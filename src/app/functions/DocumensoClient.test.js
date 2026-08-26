"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const config = require("./WerkbonConfig");
const { createDocumensoClient } = require("./DocumensoClient");
const { serializeWorkflowError } = require("./QvantumWerkbonStart");

function jsonResponse(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: { get: () => "application/json" },
    async json() {
      return body;
    },
  };
}

function errorResponse(status, body, headers = {}) {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), String(value)]),
  );
  return {
    status,
    ok: false,
    headers: { get: (name) => normalizedHeaders.get(String(name).toLowerCase()) || null },
    async text() {
      return JSON.stringify(body);
    },
  };
}

async function captureCreateError(response) {
  const client = createDocumensoClient({
    apiToken: "super-secret-token-value",
    config,
    fetchImpl: async () => response,
  });
  try {
    await client.createFromTemplate({
      ticketId: "429800712422",
      recipients: {
        monteur: { name: "Richard van den Bergh", email: "teun.willems@qvantum.com" },
        klant: { name: "Teun Willems", email: "teun.willems@escapr.nl" },
      },
    });
    assert.fail("Expected Documenso error");
  } catch (error) {
    return error;
  }
}

test("create uses native FormData payload with proven template, slots and externalId", async () => {
  let request;
  const client = createDocumensoClient({
    apiToken: "mock-token",
    config,
    fetchImpl: async (url, options) => {
      request = { url: new URL(url), options };
      return jsonResponse(200, {
        id: "envelope_created",
        status: "DRAFT",
        externalId: "hubspot-ticket:425555669195",
      });
    },
  });

  const envelope = await client.createFromTemplate({
    ticketId: "425555669195",
    recipients: {
      monteur: { name: "Richard van den Bergh", email: "teun.willems@qvantum.com" },
      klant: { name: "Test Klant", email: "teun.willems@escapr.nl" },
    },
  });
  assert.equal(request.url.pathname, "/api/v2/envelope/use");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Authorization, "mock-token");
  assert.ok(request.options.body instanceof FormData);
  assert.deepEqual(JSON.parse(request.options.body.get("payload")), {
    envelopeId: "envelope_dtufbxnrcmecmzbi",
    recipients: [
      { id: 3320825, email: "teun.willems@qvantum.com", name: "Richard van den Bergh" },
      { id: 3320824, email: "teun.willems@escapr.nl", name: "Test Klant" },
    ],
    externalId: "hubspot-ticket:425555669195",
  });
  assert.equal(envelope.id, "envelope_created");
});

test("production create uses the portal-bound externalId", async () => {
  let payload;
  const productionConfig = config.environments.production;
  const client = createDocumensoClient({
    apiToken: "mock-token",
    config: productionConfig,
    fetchImpl: async (_url, options) => {
      payload = JSON.parse(options.body.get("payload"));
      return jsonResponse(200, {
        id: "envelope_created",
        status: "DRAFT",
        externalId: "hubspot:143794667:ticket:415307052257",
      });
    },
  });

  await client.createFromTemplate({
    ticketId: "415307052257",
    recipients: {
      monteur: { name: "Richard van den Bergh", email: "teun.willems@qvantum.com" },
      klant: { name: "Test Klant", email: "teun.willems@escapr.nl" },
    },
  });
  assert.equal(payload.externalId, "hubspot:143794667:ticket:415307052257");
  assert.equal(payload.envelopeId, "envelope_dtufbxnrcmecmzbi");
});

test("429 JSON error captures only safe request and rate-limit diagnostics", async () => {
  const error = await captureCreateError(
    errorResponse(
      429,
      {
        error: {
          code: "TOO_MANY_REQUESTS",
          message: "Too many requests for teun.willems@escapr.nl; super-secret-token-value",
        },
      },
      {
        "retry-after": "60",
        "x-ratelimit-limit": "1000",
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": "1787510100",
      },
    ),
  );

  assert.equal(error.code, "DOCUMENSO_REQUEST_FAILED");
  assert.equal(error.method, "POST");
  assert.equal(error.endpoint, "/api/v2/envelope/use");
  assert.equal(error.status, 429);
  assert.equal(error.documensoCode, "TOO_MANY_REQUESTS");
  assert.equal(
    error.documensoMessage,
    "Too many requests for [REDACTED_EMAIL]; [REDACTED]",
  );
  assert.equal(error.retryAfter, "60");
  assert.deepEqual(error.rateLimit, {
    limit: "1000",
    remaining: "0",
    reset: "1787510100",
  });
  const serialized = JSON.stringify(serializeWorkflowError(error));
  assert.doesNotMatch(serialized, /super-secret-token-value|Authorization/i);
  assert.doesNotMatch(serialized, /teun\.willems@escapr\.nl|secret-value/);
});

test("429 without Retry-After retains an explicit null and successful responses stay unchanged", async () => {
  const error = await captureCreateError(
    errorResponse(429, { code: "RATE_LIMITED", message: "Too many requests" }),
  );
  assert.equal(error.retryAfter, null);
  assert.deepEqual(error.rateLimit, { limit: null, remaining: null, reset: null });
  assert.deepEqual(serializeWorkflowError(error), {
    code: "DOCUMENSO_REQUEST_FAILED",
    message: "Documenso-request mislukt (429).",
    status: 429,
    method: "POST",
    endpoint: "/api/v2/envelope/use",
    documensoCode: "RATE_LIMITED",
    documensoMessage: "Too many requests",
    retryAfter: null,
    rateLimit: { limit: null, remaining: null, reset: null },
  });
});

test("distribute and envelope lookup use proven routes and map reversed recipients by signing order", async () => {
  const requests = [];
  const client = createDocumensoClient({
    apiToken: "mock-token",
    config,
    fetchImpl: async (url, options = {}) => {
      requests.push({ url: new URL(url), options });
      if (options.method === "POST") return jsonResponse(200, { success: true });
      return jsonResponse(200, {
        id: "envelope_existing",
        status: "PENDING",
        externalId: "hubspot-ticket:425555669195",
        recipients: [
          { id: 2, email: "teun.willems@escapr.nl", name: "Test Klant", signingOrder: 2, signingStatus: "NOT_SIGNED", token: "customer-token" },
          { id: 1, email: "teun.willems@qvantum.com", name: "Richard van den Bergh", signingOrder: 1, signingStatus: "NOT_SIGNED", signingUrl: "https://sign.test/monteur" },
        ],
        envelopeItems: [{ id: "item_1" }],
      });
    },
  });

  await client.distributeEnvelope("envelope_existing");
  const envelope = await client.getEnvelope("envelope_existing");
  assert.equal(requests[0].url.pathname, "/api/v2/envelope/distribute");
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    envelopeId: "envelope_existing",
  });
  assert.equal(requests[1].url.pathname, "/api/v2/envelope/envelope_existing");
  assert.equal(envelope.envelopeItemId, "item_1");
  assert.equal(envelope.signing.monteur.signingOrder, 1);
  assert.equal(envelope.signing.monteur.name, "Richard van den Bergh");
  assert.equal(envelope.signing.monteur.url, "https://sign.test/monteur");
  assert.equal(envelope.signing.klant.signingOrder, 2);
  assert.equal(envelope.signing.klant.name, "Test Klant");
  assert.equal(envelope.signing.klant.url, "https://app.documenso.com/sign/customer-token");
});

test("externalId recovery scans all pages and returns exact matches only", async () => {
  const pages = [];
  const client = createDocumensoClient({
    apiToken: "mock-token",
    config,
    fetchImpl: async (url) => {
      const parsed = new URL(url);
      const page = Number(parsed.searchParams.get("page"));
      pages.push(page);
      return jsonResponse(200, {
        data: [
          {
            id: `envelope_${page}`,
            status: page === 2 ? "COMPLETED" : "DRAFT",
            externalId:
              page === 2
                ? "hubspot-ticket:425555669195"
                : "hubspot-ticket:other",
          },
        ],
        pagination: { totalPages: 2 },
      });
    },
  });

  const matches = await client.findEnvelopesByExternalId(
    "hubspot-ticket:425555669195",
  );
  assert.deepEqual(pages, [1, 2]);
  assert.deepEqual(
    matches.map((item) => ({ id: item.id, status: item.status, externalId: item.externalId })),
    [
      {
        id: "envelope_2",
        status: "COMPLETED",
        externalId: "hubspot-ticket:425555669195",
      },
    ],
  );
});

test("signed PDF download requires HTTP success, PDF content-type and magic bytes", async () => {
  let requestedUrl;
  const client = createDocumensoClient({
    apiToken: "mock-token",
    config,
    fetchImpl: async (url) => {
      requestedUrl = new URL(url);
      return {
        status: 200,
        ok: true,
        headers: { get: () => "application/pdf" },
        async arrayBuffer() {
          return Buffer.from("%PDF-1.7 signed");
        },
      };
    },
  });

  const bytes = await client.downloadSignedPdf("item_signed");
  assert.equal(
    `${requestedUrl.pathname}${requestedUrl.search}`,
    "/api/v2/envelope/item/item_signed/download?version=signed",
  );
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
});
