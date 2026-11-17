export const START_FUNCTION_UID = "qvantum_werkbon_start";

export type WerkbonRecipientInput = {
  // De monteur is de ingelogde HubSpot-gebruiker (context.user); de server controleert naam en e-maildomein.
  monteurName: string;
  monteurEmail: string;
  klantName: string;
  klantEmail: string;
};

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type StartWerkbonParameters = {
  accountId: string;
  ticketId: string;
  action: "open" | "status" | "resume";
  recipients?: WerkbonRecipientInput;
};

export type SigningRecipient = {
  id: string | null;
  email: string;
  name: string;
  signingOrder: number;
  signingStatus: string;
  sendStatus: string;
  url: string | null;
};

export type StartWerkbonResponse =
  | {
      ok: true;
      status: "SIGNING_PENDING" | "COMPLETED_PENDING_FILE" | "FILE_ATTACHED";
      source: "ticket_mapping" | "external_id_recovery" | "created";
      envelopeId: string;
      envelopeStatus: string;
      externalId: string;
      hubspotFileId: string | null;
      nextAction: "MONTEUR_SIGNING" | "KLANT_SIGNING" | "STATUS_CHECK" | "COMPLETE";
      monteur: SigningRecipient;
      klant: SigningRecipient;
    }
  | {
      ok: true;
      status: "NO_ENVELOPE";
      source: "ticket_mapping";
      envelopeId: null;
      envelopeStatus: null;
      externalId: null;
      hubspotFileId: null;
      nextAction: null;
      monteur: null;
      klant: null;
    }
  | {
      ok: false;
      status: "ERROR";
      error: {
        code: string;
        message: string;
        status?: number | null;
        method?: string | null;
        endpoint?: string | null;
        documensoCode?: string | null;
        documensoMessage?: string | null;
        retryAfter?: string | null;
        rateLimit?: {
          limit: string | null;
          remaining: string | null;
          reset: string | null;
        };
      };
      envelopeId: null;
      envelopeStatus: null;
      externalId: null;
      hubspotFileId: null;
      nextAction: null;
      monteur: null;
      klant: null;
    };

function invalidJsonValue(path: string, kind: string): never {
  const error = new TypeError(`Parameters bevatten geen geldige JsonValue op ${path} (${kind}).`);
  error.name = "InvalidJsonValueError";
  throw error;
}

function validateJsonValue(value: unknown, path: string, seen: WeakSet<object>): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) invalidJsonValue(path, "non-finite number");
    return;
  }
  if (typeof value !== "object") invalidJsonValue(path, typeof value);

  const objectValue = value as object;
  if (seen.has(objectValue)) invalidJsonValue(path, "circular reference");
  seen.add(objectValue);

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) invalidJsonValue(`${path}[${index}]`, "sparse array item");
      validateJsonValue(value[index], `${path}[${index}]`, seen);
    }
    const extraKeys = Object.keys(value).filter((key) => !/^(0|[1-9]\d*)$/.test(key));
    if (extraKeys.length || Object.getOwnPropertySymbols(value).length) {
      invalidJsonValue(path, "array properties");
    }
    seen.delete(objectValue);
    return;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    invalidJsonValue(path, "object instance");
  }
  if (Object.getOwnPropertySymbols(value).length) invalidJsonValue(path, "symbol property");

  for (const key of Object.getOwnPropertyNames(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !("value" in descriptor)) invalidJsonValue(`${path}.${key}`, "accessor");
    validateJsonValue(descriptor.value, `${path}.${key}`, seen);
  }
  seen.delete(objectValue);
}

export function assertJsonValue(value: unknown): asserts value is JsonValue {
  validateJsonValue(value, "$", new WeakSet());
}

function safeDiagnosticToken(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return /^[A-Za-z0-9_.:-]{1,80}$/.test(normalized) ? normalized : null;
}

function safeTransportMessage(value: unknown): string | null {
  let message = typeof value === "string" ? value.replace(/[\r\n]+/g, " ").trim() : "";
  if (!message) return null;
  message = message
    .replace(/Authorization\s*[:=]\s*[^\s,;]+(?:\s+[^\s,;]+)?/gi, "[REDACTED_AUTH]")
    .replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]")
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
    .replace(/https?:\/\/\S+/gi, "[REDACTED_URL]")
    .replace(/\b(?:api|sk|token)[-_][A-Za-z0-9_-]{12,}\b/gi, "[REDACTED]");
  return message.slice(0, 240);
}

export function formatServerlessTransportError(error: unknown): string {
  const source = error && typeof error === "object"
    ? (error as Record<string, unknown>)
    : {};
  const parts = ["SERVERLESS_TRANSPORT_FAILED"];
  const name = safeDiagnosticToken(source.name);
  const code = safeDiagnosticToken(source.code);
  const status = safeDiagnosticToken(source.status ?? source.statusCode);
  const message = safeTransportMessage(source.message);
  if (name) parts.push(name);
  if (code) parts.push(code);
  if (status) parts.push(`HTTP ${status}`);
  if (message) parts.push(message);
  if (parts.length === 1) parts.push("Onbekende transportfout.");
  return parts.join(" — ");
}

export function formatWorkflowError(
  response: Extract<StartWerkbonResponse, { ok: false }>,
): string {
  const error = response.error;
  if (error.code !== "DOCUMENSO_REQUEST_FAILED" || !error.method || !error.endpoint || !error.status) {
    return `${error.code} — ${error.message}`;
  }
  const parts = [
    error.code,
    `${error.method} ${error.endpoint}`,
    `HTTP ${error.status}`,
  ];
  if (error.documensoCode) parts.push(error.documensoCode);
  if (error.retryAfter) parts.push(`Retry-After: ${error.retryAfter}`);
  return parts.join(" — ");
}

export function buildStartWerkbonParameters(
  portalId: number | string,
  ticketId: number | string,
  action: StartWerkbonParameters["action"],
  recipients?: WerkbonRecipientInput,
): StartWerkbonParameters {
  const parameters = {
    accountId: String(portalId),
    ticketId: String(ticketId),
    action,
    ...(recipients ? { recipients } : {}),
  };
  assertJsonValue(parameters);
  return parameters;
}
