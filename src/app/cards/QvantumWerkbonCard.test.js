"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const cardSource = readFileSync(join(__dirname, "QvantumWerkbonCard.tsx"), "utf8");

test("card copy is environment-neutral", () => {
  assert.match(cardSource, /gecontroleerde Ticket/);
  assert.doesNotMatch(cardSource, /sandboxticket/i);
});
const contractSource = readFileSync(join(__dirname, "start-contract.ts"), "utf8");

function loadStartContract() {
  const compiled = ts.transpileModule(contractSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const contractExports = {};
  new Function("exports", compiled)(contractExports);
  return contractExports;
}

test("the App Card delegates portal authorization to the server-side guard", () => {
  assert.match(cardSource, /portalId=\{context\.portal\.id\}/);
  assert.match(cardSource, /buildStartWerkbonParameters\(/);
  assert.match(cardSource, /portalId,\s+ticketId,\s+action,/);

  assert.match(contractSource, /accountId: String\(portalId\)/);
  assert.doesNotMatch(contractSource, /portalId: String\(portalId\)/);

  assert.doesNotMatch(cardSource, /context\.variables/);
  assert.doesNotMatch(cardSource, /HUBSPOT_PORTAL_ID/);
  assert.doesNotMatch(cardSource, /portalMatches/);
  assert.doesNotMatch(cardSource, /Geblokkeerd: verkeerde portal/);
});

test("the App Card renders only allowlisted Documenso diagnostics", () => {
  assert.match(cardSource, /formatWorkflowError\(next\)/);
  assert.match(contractSource, /`\$\{error\.method\} \$\{error\.endpoint\}`/);
  assert.match(contractSource, /`HTTP \$\{error\.status\}`/);
  assert.match(contractSource, /`Retry-After: \$\{error\.retryAfter\}`/);
  assert.doesNotMatch(cardSource, /Authorization|apiToken|requestHeaders|stack/);
});

test("the App Card resumes on mount and gates the start form on NO_ENVELOPE", () => {
  assert.match(cardSource, /useEffect\(\(\) => \{/);
  assert.match(cardSource, /void runWorkflow\("resume"\)/);
  assert.match(cardSource, /\[portalId, ticketId\]/);
  assert.match(
    cardSource,
    /showStartForm = initialized && result\?\.ok && result\.status === "NO_ENVELOPE"/,
  );
  assert.match(cardSource, /\{showStartForm \? \(/);
  assert.doesNotMatch(cardSource, /!successfulResult \? \(/);
});

test("resume and status never send recipient create input", () => {
  assert.match(cardSource, /action === "open" \? recipients : undefined/);
});

test("deployed resume case sends JSON-safe parameters and keeps the customer action renderable", () => {
  const { assertJsonValue, buildStartWerkbonParameters } = loadStartContract();
  const parameters = buildStartWerkbonParameters(
    147599771,
    429800712422,
    "resume",
    undefined,
  );

  assert.deepEqual(parameters, {
    accountId: "147599771",
    ticketId: "429800712422",
    action: "resume",
  });
  assert.equal(Object.hasOwn(parameters, "recipients"), false);
  assert.doesNotThrow(() => assertJsonValue(parameters));
  assert.deepEqual(JSON.parse(JSON.stringify(parameters)), parameters);
  assert.match(cardSource, /nextAction === "KLANT_SIGNING"/);
  assert.match(cardSource, />\s*Klant laten tekenen\s*</);
  assert.match(cardSource, /setMessage\("Monteur gereed\. Geef dit apparaat aan de klant\."\)/);
});

test("deep JsonValue validation rejects every non-transport value", () => {
  const { assertJsonValue } = loadStartContract();
  const valid = {
    text: "value",
    number: 147599771,
    boolean: true,
    nothing: null,
    nested: [{ action: "resume" }],
  };
  assert.doesNotThrow(() => assertJsonValue(valid));
  assert.deepEqual(JSON.parse(JSON.stringify(valid)), valid);

  const symbolProperty = { action: "resume" };
  symbolProperty[Symbol("hidden")] = "value";
  const circular = { action: "resume" };
  circular.self = circular;
  for (const invalid of [
    { nested: { value: undefined } },
    { nested: { value: () => null } },
    { nested: { value: Symbol("invalid") } },
    { nested: { value: 1n } },
    { nested: { value: new Date() } },
    { nested: { value: Number.NaN } },
    { nested: { value: Number.POSITIVE_INFINITY } },
    symbolProperty,
    circular,
  ]) {
    assert.throws(
      () => assertJsonValue(invalid),
      (error) => error.name === "InvalidJsonValueError",
    );
  }
});

test("rejected serverless Promise yields only safe specific transport diagnostics", () => {
  const { formatServerlessTransportError } = loadStartContract();
  const message = formatServerlessTransportError({
    name: "ServerlessError",
    code: "INVALID_PARAMETERS",
    statusCode: 400,
    message: "Rejected for user@example.com Authorization: Bearer secret-value https://example.test/?token=secret",
    stack: "must-not-appear",
    requestPayload: { klantEmail: "user@example.com" },
  });
  assert.match(
    message,
    /^SERVERLESS_TRANSPORT_FAILED — ServerlessError — INVALID_PARAMETERS — HTTP 400 — /,
  );
  assert.match(message, /\[REDACTED_EMAIL\]|\[REDACTED_AUTH\]|\[REDACTED_URL\]/);
  assert.doesNotMatch(message, /user@example\.com|secret-value|example\.test|must-not-appear|requestPayload|Authorization/);
});

test("normal backend errors retain their specific safe workflow diagnostics", () => {
  const { formatWorkflowError } = loadStartContract();
  assert.equal(
    formatWorkflowError({
      ok: false,
      status: "ERROR",
      error: { code: "PORTAL_MISMATCH", message: "Portal komt niet overeen." },
      envelopeId: null,
      envelopeStatus: null,
      externalId: null,
      hubspotFileId: null,
      nextAction: null,
      monteur: null,
      klant: null,
    }),
    "PORTAL_MISMATCH — Portal komt niet overeen.",
  );
  assert.match(cardSource, /setMessage\(formatWorkflowError\(next\)\)/);
  assert.match(cardSource, /setMessage\(formatServerlessTransportError\(error\)\)/);
});

test("resumed signing and completed states reuse the existing action rendering", () => {
  assert.match(cardSource, /nextAction === "MONTEUR_SIGNING"/);
  assert.match(cardSource, /successfulResult\.monteur\.url/);
  assert.match(cardSource, /nextAction === "KLANT_SIGNING"/);
  assert.match(cardSource, /successfulResult\.klant\.url/);
  assert.match(cardSource, /nextAction === "STATUS_CHECK" \? "primary" : "secondary"/);
  assert.match(cardSource, /nextAction !== "COMPLETE"/);
});
