"use strict";

const assert = require("node:assert/strict");
const { copyFileSync, mkdtempSync, readFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const test = require("node:test");
const config = require("./WerkbonConfig");
const {
  buildExternalId,
  main,
  runResumeWorkflow,
  runStartWorkflow,
  validateStartScope,
  validateTicketContext,
} = require("./QvantumWerkbonStart");

const DEFAULT_TICKET_ID = "429800712422";
const PRODUCTION_TICKET_ID = "415307052257";
const productionConfig = config.environments.production;

function loadCleanRuntimeBundle() {
  const cleanRuntimeDirectory = mkdtempSync(join(tmpdir(), "qvantum-werkbon-runtime-"));
  const cleanRuntimeEntrypoint = join(cleanRuntimeDirectory, "file.js");
  copyFileSync(join(__dirname, "QvantumWerkbonRuntime.js"), cleanRuntimeEntrypoint);
  try {
    return require(cleanRuntimeEntrypoint);
  } finally {
    rmSync(cleanRuntimeDirectory, { recursive: true, force: true });
  }
}

const cleanRuntime = loadCleanRuntimeBundle();

test("app-function metadata targets the self-contained case-exact runtime bundle", () => {
  const metadata = JSON.parse(
    readFileSync(join(__dirname, "qvantum-werkbon-start-hsmeta.json"), "utf8"),
  );
  const bundleSource = readFileSync(join(__dirname, "QvantumWerkbonRuntime.js"), "utf8");
  assert.equal(metadata.config.entrypoint, "/app/functions/QvantumWerkbonRuntime.js");
  assert.match(bundleSource, /"\.\/WerkbonConfig": function/);
  assert.match(bundleSource, /__bundleRequire\("\.\/WerkbonConfig"\)/);
  assert.doesNotMatch(
    bundleSource,
    /\brequire\(["']\.\/(?:WerkbonConfig|HubSpotTicketClient|DocumensoClient)["']\)/,
  );
  const productionProfile = JSON.parse(
    readFileSync(join(__dirname, "..", "..", "hsprofile.production.json"), "utf8"),
  );
  assert.equal(productionProfile.accountId, 143794667);
  assert.equal(productionProfile.variables.ENVIRONMENT_NAME, "production");
  assert.equal(productionProfile.variables.HUBSPOT_PORTAL_ID, "143794667");
});

function input(overrides = {}) {
  return {
    serverAccountId: config.allowedPortalId,
    clientAccountId: config.allowedPortalId,
    ticketId: DEFAULT_TICKET_ID,
    action: "open",
    recipients: {
      monteurName: "Richard van den Bergh",
      klantName: "Test Klant",
      klantEmail: "teun.willems@escapr.nl",
    },
    ...overrides,
  };
}

function envelope(overrides = {}) {
  const monteurStatus = overrides.monteurStatus || (overrides.status === "COMPLETED" ? "SIGNED" : "NOT_SIGNED");
  const klantStatus = overrides.klantStatus || (overrides.status === "COMPLETED" ? "SIGNED" : "NOT_SIGNED");
  return {
    id: "envelope_a",
    status: "PENDING",
    externalId: `hubspot-ticket:${DEFAULT_TICKET_ID}`,
    templateEnvelopeId: null,
    recipients: [
      { email: "teun.willems@qvantum.com", name: "Richard van den Bergh", signingOrder: 1, signingStatus: monteurStatus },
      { email: "teun.willems@escapr.nl", name: "Test Klant", signingOrder: 2, signingStatus: klantStatus },
    ],
    signing: {
      monteur: { id: "recipient_1", email: "teun.willems@qvantum.com", name: "Richard van den Bergh", signingOrder: 1, signingStatus: monteurStatus, sendStatus: "SENT", url: "https://sign.test/monteur" },
      klant: { id: "recipient_2", email: "teun.willems@escapr.nl", name: "Test Klant", signingOrder: 2, signingStatus: klantStatus, sendStatus: "SENT", url: "https://sign.test/klant" },
    },
    envelopeItemId: "item_1",
    ...overrides,
  };
}

function harness({
  ticketId = DEFAULT_TICKET_ID,
  pipelineId = config.allowedPipelineId,
  subject = config.allowedSubjectPrefix,
  envelopeId = null,
  fileId = null,
  currentEnvelope = envelope(),
  recoveryCandidates = [],
} = {}) {
  const state = { envelopeId, fileId };
  const envelopes = new Map([
    [currentEnvelope.id, currentEnvelope],
    ...recoveryCandidates.map((candidate) => [candidate.id, candidate]),
  ]);
  const calls = {
    ticketRead: 0,
    find: 0,
    create: 0,
    mapEnvelope: 0,
    distribute: 0,
    getEnvelope: 0,
    download: 0,
    upload: 0,
    note: 0,
    mapFile: 0,
    findExternalIds: [],
  };
  const sequence = [];
  return {
    calls,
    state,
    sequence,
    dependencies: {
      hubspot: {
        async getTicketContext() {
          calls.ticketRead += 1;
          return {
            id: ticketId,
            subject,
            pipelineId,
            envelopeId: state.envelopeId,
            hubspotFileId: state.fileId,
          };
        },
        async updateEnvelopeId(_ticketId, id) {
          calls.mapEnvelope += 1;
          sequence.push("map-envelope");
          state.envelopeId = id;
        },
        async uploadPrivateSignedPdf() {
          calls.upload += 1;
          return { id: "file_1" };
        },
        async createTicketNoteWithAttachment() {
          calls.note += 1;
          return { id: "note_1" };
        },
        async updateHubSpotFileId(_ticketId, id) {
          calls.mapFile += 1;
          state.fileId = id;
        },
      },
      documenso: {
        async findEnvelopesByExternalId(externalId) {
          calls.find += 1;
          calls.findExternalIds.push(externalId);
          return recoveryCandidates;
        },
        async createFromTemplate() {
          calls.create += 1;
          sequence.push("create");
          return currentEnvelope;
        },
        async distributeEnvelope() {
          calls.distribute += 1;
          sequence.push("distribute");
        },
        async getEnvelope(id) {
          calls.getEnvelope += 1;
          return envelopes.get(id) || currentEnvelope;
        },
        async downloadSignedPdf() {
          calls.download += 1;
          return Buffer.from("%PDF-1.7 signed");
        },
      },
    },
  };
}

test("existing mapping is reused and pending signing causes no PDF writes", async () => {
  const h = harness({ envelopeId: "envelope_a" });
  const result = await runStartWorkflow(input(), h.dependencies);
  assert.equal(result.source, "ticket_mapping");
  assert.equal(result.status, "SIGNING_PENDING");
  assert.equal(h.calls.find, 0);
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.download, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.note, 0);
  assert.equal(result.nextAction, "MONTEUR_SIGNING");
  assert.equal(result.monteur.url, "https://sign.test/monteur");
});

test("sequential signing selects the customer after the mechanic", async () => {
  const h = harness({ envelopeId: "envelope_a", currentEnvelope: envelope({ monteurStatus: "SIGNED" }) });
  const result = await runStartWorkflow(input(), h.dependencies);
  assert.equal(result.nextAction, "KLANT_SIGNING");
  assert.equal(result.klant.url, "https://sign.test/klant");
  assert.equal(h.calls.create, 0);
});

test("recipient mismatch stops before replacement", async () => {
  const h = harness({ envelopeId: "envelope_a" });
  await assert.rejects(
    runStartWorkflow(input({ recipients: { monteurName: "Marco Liefhebber", klantName: "Andere Klant", klantEmail: "teun.willems@escapr.nl" } }), h.dependencies),
    (error) => error.code === "RECIPIENT_MISMATCH",
  );
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.mapEnvelope, 0);
});

test("status reuses a mapping without recipient input", async () => {
  const h = harness({ envelopeId: "envelope_a" });
  const result = await runStartWorkflow(input({ action: "status", recipients: undefined }), h.dependencies);
  assert.equal(result.nextAction, "MONTEUR_SIGNING");
  assert.equal(h.calls.create, 0);
});

test("resume with no mapping returns the start-form state and performs zero writes", async () => {
  const h = harness();
  const result = await runResumeWorkflow(
    input({ action: "resume", recipients: undefined }),
    h.dependencies,
  );
  assert.equal(result.status, "NO_ENVELOPE");
  assert.equal(result.envelopeId, null);
  assert.equal(h.calls.ticketRead, 1);
  assert.equal(h.calls.getEnvelope, 0);
  assert.equal(h.calls.find, 0);
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.mapEnvelope, 0);
  assert.equal(h.calls.distribute, 0);
  assert.equal(h.calls.download, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.note, 0);
  assert.equal(h.calls.mapFile, 0);
});

test("resume with a pending mapping restores the mechanic signing action read-only", async () => {
  const h = harness({ envelopeId: "envelope_a" });
  const result = await runResumeWorkflow(
    input({ action: "resume", recipients: undefined }),
    h.dependencies,
  );
  assert.equal(result.status, "SIGNING_PENDING");
  assert.equal(result.nextAction, "MONTEUR_SIGNING");
  assert.equal(result.monteur.signingOrder, 1);
  assert.equal(result.monteur.url, "https://sign.test/monteur");
  assert.equal(h.calls.getEnvelope, 1);
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.mapEnvelope, 0);
  assert.equal(h.calls.distribute, 0);
  assert.equal(h.calls.download, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.note, 0);
  assert.equal(h.calls.mapFile, 0);
});

test("resume restores the customer action when signing order 1 is signed", async () => {
  const h = harness({
    envelopeId: "envelope_a",
    currentEnvelope: envelope({ monteurStatus: "SIGNED" }),
  });
  const result = await runResumeWorkflow(
    input({ action: "resume", recipients: undefined }),
    h.dependencies,
  );
  assert.equal(result.nextAction, "KLANT_SIGNING");
  assert.equal(result.klant.signingOrder, 2);
  assert.equal(result.klant.url, "https://sign.test/klant");
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.download, 0);
});

test("clean deployed-style runtime loads all local modules and resumes customer signing read-only", async () => {
  assert.equal(typeof cleanRuntime.main, "function");
  assert.equal(typeof cleanRuntime.runResumeWorkflow, "function");
  const h = harness({
    envelopeId: "envelope_a",
    currentEnvelope: envelope({ monteurStatus: "SIGNED" }),
  });
  const result = await cleanRuntime.runResumeWorkflow(
    input({ action: "resume", recipients: undefined }),
    h.dependencies,
  );
  assert.equal(result.status, "SIGNING_PENDING");
  assert.equal(result.nextAction, "KLANT_SIGNING");
  assert.equal(result.monteur.signingStatus, "SIGNED");
  assert.equal(result.klant.signingStatus, "NOT_SIGNED");
  assert.equal(h.calls.find, 0);
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.mapEnvelope, 0);
  assert.equal(h.calls.distribute, 0);
  assert.equal(h.calls.download, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.note, 0);
  assert.equal(h.calls.mapFile, 0);
});

test("resume renders completed-without-file as a status action without file-return writes", async () => {
  const h = harness({
    envelopeId: "envelope_a",
    currentEnvelope: envelope({ status: "COMPLETED" }),
  });
  const result = await runResumeWorkflow(
    input({ action: "resume", recipients: undefined }),
    h.dependencies,
  );
  assert.equal(result.status, "COMPLETED_PENDING_FILE");
  assert.equal(result.envelopeStatus, "COMPLETED");
  assert.equal(result.nextAction, "STATUS_CHECK");
  assert.equal(h.calls.download, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.note, 0);
  assert.equal(h.calls.mapFile, 0);
});

test("resume renders completed-with-file as complete and remains read-only", async () => {
  const h = harness({
    envelopeId: "envelope_a",
    fileId: "file_existing",
    currentEnvelope: envelope({ status: "COMPLETED" }),
  });
  const result = await runResumeWorkflow(
    input({ action: "resume", recipients: undefined }),
    h.dependencies,
  );
  assert.equal(result.status, "FILE_ATTACHED");
  assert.equal(result.nextAction, "COMPLETE");
  assert.equal(result.hubspotFileId, "file_existing");
  assert.equal(h.calls.download, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.note, 0);
  assert.equal(h.calls.mapFile, 0);
});

test("reconnect and remount resume the same mapped envelope without writes", async () => {
  const h = harness({ envelopeId: "envelope_a" });
  const resumeInput = input({ action: "resume", recipients: undefined });
  const first = await runResumeWorkflow(resumeInput, h.dependencies);
  const second = await runResumeWorkflow(resumeInput, h.dependencies);
  assert.equal(first.envelopeId, "envelope_a");
  assert.equal(second.envelopeId, "envelope_a");
  assert.equal(h.calls.ticketRead, 2);
  assert.equal(h.calls.getEnvelope, 2);
  assert.equal(h.calls.find, 0);
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.mapEnvelope, 0);
  assert.equal(h.calls.distribute, 0);
  assert.equal(h.calls.download, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.note, 0);
  assert.equal(h.calls.mapFile, 0);
});

test("stale mapped envelope fails safely and never falls through to create", async () => {
  const h = harness({
    envelopeId: "envelope_a",
    currentEnvelope: envelope({ externalId: "hubspot-ticket:stale" }),
  });
  await assert.rejects(
    runResumeWorkflow(
      input({ action: "resume", recipients: undefined }),
      h.dependencies,
    ),
    (error) => error.code === "ENVELOPE_CORRELATION_MISMATCH",
  );
  assert.equal(h.calls.find, 0);
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.mapEnvelope, 0);
  assert.equal(h.calls.distribute, 0);
  assert.equal(h.calls.download, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.note, 0);
  assert.equal(h.calls.mapFile, 0);
});

test("empty mapping creates once, maps immediately, then distributes", async () => {
  const h = harness();
  const first = await runStartWorkflow(input(), h.dependencies);
  const second = await runStartWorkflow(input(), h.dependencies);
  assert.equal(first.source, "created");
  assert.equal(second.source, "ticket_mapping");
  assert.deepEqual(h.sequence, ["create", "map-envelope", "distribute"]);
  assert.equal(h.calls.create, 1);
  assert.equal(h.calls.find, 1);
  assert.equal(h.calls.mapEnvelope, 1);
  assert.equal(h.calls.distribute, 1);
});

test("missing mapping recovers the only COMPLETED candidate before create", async () => {
  const draft = envelope({ id: "envelope_draft", status: "DRAFT" });
  const completed = envelope({ id: "envelope_completed", status: "COMPLETED" });
  const h = harness({
    fileId: "file_existing",
    recoveryCandidates: [draft, completed],
  });
  const result = await runStartWorkflow(input(), h.dependencies);
  assert.equal(result.source, "external_id_recovery");
  assert.equal(result.envelopeId, "envelope_completed");
  assert.equal(h.state.envelopeId, "envelope_completed");
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.distribute, 0);
  assert.equal(h.calls.mapEnvelope, 1);
  assert.equal(h.calls.download, 0);
});

test("multiple COMPLETED recovery candidates stop before mapping or create", async () => {
  const h = harness({
    recoveryCandidates: [
      envelope({ id: "envelope_completed_1", status: "COMPLETED" }),
      envelope({ id: "envelope_completed_2", status: "COMPLETED" }),
    ],
  });
  await assert.rejects(
    runStartWorkflow(input(), h.dependencies),
    (error) => error.code === "MULTIPLE_COMPLETED_ENVELOPES",
  );
  assert.equal(h.calls.mapEnvelope, 0);
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.download, 0);
});

test("multiple non-completed recovery candidates stop as ambiguous", async () => {
  const h = harness({
    recoveryCandidates: [
      envelope({ id: "envelope_draft", status: "DRAFT" }),
      envelope({ id: "envelope_pending", status: "PENDING" }),
    ],
  });
  await assert.rejects(
    runStartWorkflow(input(), h.dependencies),
    (error) => error.code === "AMBIGUOUS_ENVELOPE_RECOVERY",
  );
  assert.equal(h.calls.mapEnvelope, 0);
  assert.equal(h.calls.create, 0);
});

test("COMPLETED returns signed PDF exactly once and duplicate completion does no writes", async () => {
  const h = harness({
    envelopeId: "envelope_a",
    currentEnvelope: envelope({ status: "COMPLETED" }),
  });
  const first = await runStartWorkflow(input(), h.dependencies);
  const second = await runStartWorkflow(input(), h.dependencies);
  assert.equal(first.status, "FILE_ATTACHED");
  assert.equal(second.status, "FILE_ATTACHED");
  assert.equal(h.calls.download, 1);
  assert.equal(h.calls.upload, 1);
  assert.equal(h.calls.note, 1);
  assert.equal(h.calls.mapFile, 1);
  assert.equal(h.state.fileId, "file_1");
  assert.equal(first.nextAction, "COMPLETE");
});

test("accountId accepts number, string, and the local-dev context omission", () => {
  for (const clientAccountId of [147599771, "147599771"]) {
    const withServerContext = validateStartScope({
      serverAccountId: 147599771,
      clientAccountId,
      ticketId: DEFAULT_TICKET_ID,
    });
    assert.equal(withServerContext.accountId, "147599771");

    const localDevFallback = validateStartScope({
      serverAccountId: undefined,
      clientAccountId,
      ticketId: DEFAULT_TICKET_ID,
    });
    assert.equal(localDevFallback.accountId, "147599771");
  }
});

test("wrong or invalid accountId fails before external dependencies", async () => {
  const h = harness();
  await assert.rejects(
    runStartWorkflow(input({ clientAccountId: "1" }), h.dependencies),
    (error) => error.code === "PORTAL_MISMATCH",
  );
  await assert.rejects(
    runStartWorkflow(input({ serverAccountId: 1 }), h.dependencies),
    (error) => error.code === "PORTAL_MISMATCH",
  );
  await assert.rejects(
    runStartWorkflow(input({ clientAccountId: "" }), h.dependencies),
    (error) => error.code === "INVALID_INPUT",
  );
  await assert.rejects(
    runStartWorkflow(input({ serverAccountId: "", clientAccountId: "147599771" }), h.dependencies),
    (error) => error.code === "INVALID_INPUT",
  );
  assert.equal(h.calls.ticketRead, 0);
});

test("sandbox guard accepts any ticket ID in pipeline 0 with the exact subject prefix", () => {
  for (const subject of ["TEST - Werkbon", "TEST - Werkbon 1"]) {
    const ticketId = subject.endsWith(" 1") ? DEFAULT_TICKET_ID : "987654321";
    const scope = validateStartScope({
      serverAccountId: config.allowedPortalId,
      clientAccountId: config.allowedPortalId,
      ticketId,
    });
    assert.equal(scope.ticketId, ticketId);
    assert.doesNotThrow(() =>
      validateTicketContext(
        { id: ticketId, pipelineId: "0", subject },
        ticketId,
      ),
    );
  }
});

test("sandbox guard rejects wrong pipeline and subject without the exact prefix", () => {
  assert.throws(
    () =>
      validateTicketContext(
        { id: DEFAULT_TICKET_ID, pipelineId: "1", subject: "TEST - Werkbon 1" },
        DEFAULT_TICKET_ID,
      ),
    (error) => error.code === "TICKET_CONTEXT_MISMATCH",
  );
  assert.throws(
    () =>
      validateTicketContext(
        { id: DEFAULT_TICKET_ID, pipelineId: "0", subject: "Werkbon 1" },
        DEFAULT_TICKET_ID,
      ),
    (error) => error.code === "TICKET_CONTEXT_MISMATCH",
  );
});

test("production config is selected only for portal 143794667", () => {
  assert.equal(config.forPortal("147599771"), config.environments.sandbox);
  assert.equal(config.forPortal(143794667), productionConfig);
  assert.equal(config.forPortal("1"), null);
  assert.equal(productionConfig.allowedPipelineId, "0");
  assert.deepEqual(productionConfig.allowedTicketIds, [PRODUCTION_TICKET_ID]);
  assert.equal(productionConfig.allowedSubjectExact, "OSH BEA400");
});

test("production scope requires the exact portal and Ticket allowlist", () => {
  assert.deepEqual(
    validateStartScope(
      {
        serverAccountId: "143794667",
        clientAccountId: "143794667",
        ticketId: PRODUCTION_TICKET_ID,
      },
      productionConfig,
    ),
    { accountId: "143794667", ticketId: PRODUCTION_TICKET_ID },
  );
  assert.throws(
    () => validateStartScope(
      {
        serverAccountId: "143794667",
        clientAccountId: "143794667",
        ticketId: DEFAULT_TICKET_ID,
      },
      productionConfig,
    ),
    (error) => error.code === "TICKET_NOT_ALLOWED",
  );
  assert.throws(
    () => validateStartScope(
      {
        serverAccountId: "147599771",
        clientAccountId: "147599771",
        ticketId: PRODUCTION_TICKET_ID,
      },
      productionConfig,
    ),
    (error) => error.code === "PORTAL_MISMATCH",
  );
  assert.throws(
    () => validateStartScope(
      {
        serverAccountId: "143794667",
        clientAccountId: "143794667",
        ticketId: PRODUCTION_TICKET_ID,
      },
      config.environments.sandbox,
    ),
    (error) => error.code === "PORTAL_MISMATCH",
  );
});

test("production Ticket guard requires exact ID, pipeline and subject", () => {
  assert.doesNotThrow(() => validateTicketContext(
    { id: PRODUCTION_TICKET_ID, pipelineId: "0", subject: "OSH BEA400" },
    PRODUCTION_TICKET_ID,
    productionConfig,
  ));
  for (const ticket of [
    { id: DEFAULT_TICKET_ID, pipelineId: "0", subject: "OSH BEA400" },
    { id: PRODUCTION_TICKET_ID, pipelineId: "1", subject: "OSH BEA400" },
    { id: PRODUCTION_TICKET_ID, pipelineId: "0", subject: "OSH BEA400 extra" },
  ]) {
    assert.throws(
      () => validateTicketContext(ticket, PRODUCTION_TICKET_ID, productionConfig),
      (error) => error.code === "TICKET_CONTEXT_MISMATCH",
    );
  }
});

test("production uses a portal-bound externalId and remains recovery-idempotent", async () => {
  const externalId = `hubspot:143794667:ticket:${PRODUCTION_TICKET_ID}`;
  const currentEnvelope = envelope({ externalId });
  const h = harness({
    ticketId: PRODUCTION_TICKET_ID,
    subject: "OSH BEA400",
    currentEnvelope,
  });
  const productionInput = input({
    serverAccountId: "143794667",
    clientAccountId: "143794667",
    ticketId: PRODUCTION_TICKET_ID,
  });
  const result = await runStartWorkflow(productionInput, h.dependencies, productionConfig);
  assert.equal(buildExternalId(PRODUCTION_TICKET_ID, productionConfig), externalId);
  assert.deepEqual(h.calls.findExternalIds, [externalId]);
  assert.equal(result.source, "created");
  assert.deepEqual(h.sequence, ["create", "map-envelope", "distribute"]);
});

test("production resume uses the mapped envelope without writes", async () => {
  const externalId = `hubspot:143794667:ticket:${PRODUCTION_TICKET_ID}`;
  const h = harness({
    ticketId: PRODUCTION_TICKET_ID,
    subject: "OSH BEA400",
    envelopeId: "envelope_a",
    currentEnvelope: envelope({ externalId }),
  });
  const result = await runResumeWorkflow(
    input({
      serverAccountId: "143794667",
      clientAccountId: "143794667",
      ticketId: PRODUCTION_TICKET_ID,
      action: "resume",
      recipients: undefined,
    }),
    h.dependencies,
    productionConfig,
  );
  assert.equal(result.status, "SIGNING_PENDING");
  assert.equal(h.calls.mapEnvelope, 0);
  assert.equal(h.calls.create, 0);
  assert.equal(h.calls.distribute, 0);
  assert.equal(h.calls.download, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.note, 0);
  assert.equal(h.calls.mapFile, 0);
});

test("a new arbitrary sandbox ticket reaches the existing recipient and recovery flow", async () => {
  const ticketId = "987654321";
  const currentEnvelope = envelope({ externalId: `hubspot-ticket:${ticketId}` });
  const h = harness({ ticketId, currentEnvelope });
  const result = await runStartWorkflow(input({ ticketId }), h.dependencies);
  assert.equal(result.source, "created");
  assert.deepEqual(h.sequence, ["create", "map-envelope", "distribute"]);
  assert.equal(h.calls.find, 1);
  assert.equal(h.calls.create, 1);
  assert.equal(h.calls.mapEnvelope, 1);
});

test("wrong subject/pipeline and wrong externalId stop before writes", async () => {
  const h = harness({
    envelopeId: "envelope_a",
    currentEnvelope: envelope({ externalId: "hubspot-ticket:other" }),
  });
  await assert.rejects(
    runStartWorkflow(input(), h.dependencies),
    (error) => error.code === "ENVELOPE_CORRELATION_MISMATCH",
  );
  assert.equal(h.calls.download, 0);
  assert.equal(h.calls.upload, 0);
  assert.equal(h.calls.note, 0);
});

test("serverless entrypoint rejects wrong portal before secret construction", async () => {
  const result = await main({
    accountId: 147599771,
    parameters: { accountId: "1", ticketId: "425555669195" },
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "PORTAL_MISMATCH");
});

test("serverless production entrypoint rejects a non-allowlisted Ticket before secrets", async () => {
  const result = await main({
    accountId: 143794667,
    parameters: {
      accountId: "143794667",
      ticketId: DEFAULT_TICKET_ID,
      action: "resume",
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "TICKET_NOT_ALLOWED");
});
