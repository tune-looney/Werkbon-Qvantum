"use strict";

const DEFAULT_API_BASE_URL = "https://app.documenso.com/api/v2";
const DEFAULT_APP_BASE_URL = "https://app.documenso.com";

class DocumensoClientError extends Error {
  constructor(code, message, diagnostics = {}) {
    super(message);
    this.name = "DocumensoClientError";
    this.code = code;
    this.status = diagnostics.status ?? null;
    this.method = diagnostics.method ?? null;
    this.endpoint = diagnostics.endpoint ?? null;
    this.documensoCode = diagnostics.documensoCode ?? null;
    this.documensoMessage = diagnostics.documensoMessage ?? null;
    this.retryAfter = diagnostics.retryAfter ?? null;
    this.rateLimit = diagnostics.rateLimit ?? {
      limit: null,
      remaining: null,
      reset: null,
    };
  }
}

function safeHeader(response, name) {
  const value = String(response.headers?.get?.(name) || "").trim();
  return value && /^[\w .,:+\/-]{1,100}$/.test(value) ? value : null;
}

function safeDocumensoCode(value) {
  const code = String(value || "").trim();
  return code && /^[A-Za-z0-9_.:-]{1,100}$/.test(code) ? code : null;
}

function safeDocumensoMessage(value, secrets = []) {
  let message = String(value || "").replace(/[\r\n]+/g, " ").trim();
  if (!message) return null;
  for (const secret of secrets) {
    if (typeof secret === "string" && secret.length >= 8) {
      message = message.split(secret).join("[REDACTED]");
    }
  }
  return message
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
    .replace(/\b(?:api|sk|token)[-_][A-Za-z0-9_-]{12,}\b/gi, "[REDACTED]")
    .slice(0, 240);
}

async function createRequestError(response, apiBaseUrl, path, options, apiToken) {
  let body = null;
  try {
    body = JSON.parse(await response.text());
  } catch {
    // A non-JSON response is intentionally not retained or exposed.
  }
  const rawCode = body?.code ?? body?.error?.code;
  const rawMessage =
    body?.message ?? body?.error?.message ??
    (typeof body?.error === "string" ? body.error : null);
  const documensoCode =
    safeDocumensoCode(rawCode) ||
    (/^[A-Z0-9_:-]{2,100}$/.test(String(rawMessage || ""))
      ? safeDocumensoCode(rawMessage)
      : null);
  const method = String(options.method || "GET").toUpperCase();
  let endpoint = path.split("?")[0];
  try {
    endpoint = new URL(`${apiBaseUrl}${path}`).pathname;
  } catch {
    // The configured base URL is validated by fetch; retain only the relative path here.
  }
  return new DocumensoClientError(
    "DOCUMENSO_REQUEST_FAILED",
    `Documenso-request mislukt (${response.status}).`,
    {
      status: response.status,
      method,
      endpoint,
      documensoCode,
      documensoMessage: safeDocumensoMessage(rawMessage, [apiToken]),
      retryAfter: safeHeader(response, "retry-after"),
      rateLimit: {
        limit: safeHeader(response, "x-ratelimit-limit"),
        remaining: safeHeader(response, "x-ratelimit-remaining"),
        reset: safeHeader(response, "x-ratelimit-reset"),
      },
    },
  );
}

function createDocumensoClient({ apiToken, fetchImpl = globalThis.fetch, config }) {
  if (!apiToken) {
    throw new DocumensoClientError("DOCUMENSO_NOT_CONFIGURED", "Documenso is niet geconfigureerd.");
  }
  if (typeof fetchImpl !== "function" || typeof FormData !== "function") {
    throw new DocumensoClientError("HTTP_NOT_AVAILABLE", "HTTP-client is niet beschikbaar.");
  }

  const apiBaseUrl = config.documensoApiBaseUrl || DEFAULT_API_BASE_URL;
  const appBaseUrl = config.documensoAppBaseUrl || DEFAULT_APP_BASE_URL;

  async function request(path, options = {}) {
    const response = await fetchImpl(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        Authorization: apiToken,
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw await createRequestError(response, apiBaseUrl, path, options, apiToken);
    }
    return response;
  }

  return {
    async createFromTemplate({ ticketId, recipients }) {
      const payload = {
        envelopeId: config.documensoTemplateEnvelopeId,
        recipients: [
          {
            id: config.recipientSlots.monteur,
            email: recipients.monteur.email,
            name: recipients.monteur.name,
          },
          {
            id: config.recipientSlots.klant,
            email: recipients.klant.email,
            name: recipients.klant.name,
          },
        ],
        externalId: `hubspot-ticket:${ticketId}`,
      };
      const form = new FormData();
      form.append("payload", JSON.stringify(payload));
      const response = await request("/envelope/use", { method: "POST", body: form });
      return normalizeEnvelope(await response.json(), appBaseUrl);
    },

    async distributeEnvelope(envelopeId) {
      const response = await request("/envelope/distribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ envelopeId }),
      });
      return response.status;
    },

    async getEnvelope(envelopeId) {
      const response = await request(`/envelope/${encodeURIComponent(envelopeId)}`);
      return normalizeEnvelope(await response.json(), appBaseUrl);
    },

    async getStatus(envelopeId) {
      return (await this.getEnvelope(envelopeId)).status;
    },

    async findEnvelopesByExternalId(externalId) {
      const matches = [];
      let page = 1;
      let totalPages = 1;
      do {
        const params = new URLSearchParams({
          type: "DOCUMENT",
          page: String(page),
          perPage: "100",
          orderByColumn: "createdAt",
          orderByDirection: "desc",
        });
        const response = await request(`/envelope?${params}`);
        const body = await response.json();
        const rows = Array.isArray(body?.data) ? body.data : [];
        for (const row of rows) {
          if (row?.externalId === externalId) {
            matches.push(normalizeEnvelope(row, appBaseUrl));
          }
        }
        totalPages = Math.max(1, Number(body?.pagination?.totalPages || 1));
        page += 1;
      } while (page <= totalPages);
      return matches;
    },

    async downloadSignedPdf(envelopeItemId) {
      const response = await request(
        `/envelope/item/${encodeURIComponent(envelopeItemId)}/download?version=signed`,
      );
      const contentType = String(response.headers?.get?.("content-type") || "").toLowerCase();
      const bytes = Buffer.from(await response.arrayBuffer());
      if (
        !contentType.includes("application/pdf") ||
        bytes.length < 5 ||
        bytes.subarray(0, 5).toString() !== "%PDF-"
      ) {
        throw new DocumensoClientError(
          "INVALID_SIGNED_PDF",
          "Documenso gaf geen geldig signed PDF terug.",
        );
      }
      return bytes;
    },
  };
}

function normalizeEnvelope(body, appBaseUrl = DEFAULT_APP_BASE_URL) {
  const envelope = body?.data?.envelope || body?.data || body?.envelope || body || {};
  const id = String(envelope.id || envelope.envelopeId || "");
  if (!id.startsWith("envelope_")) {
    throw new DocumensoClientError(
      "INVALID_DOCUMENSO_RESPONSE",
      "Documenso-envelope-ID ontbreekt.",
    );
  }
  const recipients = Array.isArray(envelope.recipients) ? envelope.recipients : [];
  const monteur = recipients.find((recipient) => Number(recipient?.signingOrder) === 1);
  const klant = recipients.find((recipient) => Number(recipient?.signingOrder) === 2);
  const envelopeItems = Array.isArray(envelope.envelopeItems)
    ? envelope.envelopeItems
    : Array.isArray(envelope.items)
      ? envelope.items
      : [];
  const envelopeItemId =
    String(envelopeItems[0]?.id || envelopeItems[0]?.envelopeItemId || "") || null;
  return {
    id,
    status: String(envelope.status || "UNKNOWN").toUpperCase(),
    externalId: envelope.externalId == null ? null : String(envelope.externalId),
    templateEnvelopeId: envelope.templateEnvelopeId || envelope.sourceEnvelopeId || null,
    recipients,
    signing: {
      monteur: normalizeSigningRecipient(monteur, appBaseUrl),
      klant: normalizeSigningRecipient(klant, appBaseUrl),
    },
    envelopeItemId,
  };
}

function normalizeSigningRecipient(recipient, appBaseUrl) {
  if (!recipient) return null;
  const signingUrl =
    recipient.signingUrl ||
    (recipient.token ? `${appBaseUrl}/sign/${recipient.token}` : null);
  return {
    id: recipient.id == null ? null : String(recipient.id),
    email: String(recipient.email || "").trim().toLowerCase(),
    name: String(recipient.name || "").trim(),
    signingOrder: Number(recipient.signingOrder),
    signingStatus: String(recipient.signingStatus || "UNKNOWN").toUpperCase(),
    sendStatus: String(recipient.sendStatus || "UNKNOWN").toUpperCase(),
    url: signingUrl,
  };
}

module.exports = {
  DocumensoClientError,
  createDocumensoClient,
  normalizeEnvelope,
  normalizeSigningRecipient,
};
