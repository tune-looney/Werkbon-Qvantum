"use strict";

const config = require("./WerkbonConfig");
const { createHubSpotTicketClient } = require("./HubSpotTicketClient");
const { DocumensoClientError, createDocumensoClient } = require("./DocumensoClient");

const inFlightByTicket = new Map();

class WorkflowError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "WorkflowError";
    this.code = code;
  }
}

function normalizeId(value, fieldName) {
  const normalized = String(value ?? "");
  if (!/^[1-9]\d*$/.test(normalized)) {
    throw new WorkflowError("INVALID_INPUT", `${fieldName} is ongeldig.`);
  }
  return normalized;
}

function validateStartScope(input, runtimeConfig = config) {
  const clientAccountId = normalizeId(input.clientAccountId, "accountId");
  const hasServerAccountId = input.serverAccountId !== undefined && input.serverAccountId !== null;
  const serverAccountId = hasServerAccountId
    ? normalizeId(input.serverAccountId, "accountId")
    : null;
  const ticketId = normalizeId(input.ticketId, "ticketId");

  if (
    (serverAccountId !== null && serverAccountId !== clientAccountId) ||
    clientAccountId !== String(runtimeConfig.allowedPortalId)
  ) {
    throw new WorkflowError(
      "PORTAL_MISMATCH",
      "Portal komt niet overeen met de sandboxconfiguratie.",
    );
  }
  return { accountId: serverAccountId ?? clientAccountId, ticketId };
}

function validateTicketContext(ticket, ticketId, runtimeConfig = config) {
  if (
    ticket?.id !== ticketId ||
    String(ticket?.pipelineId ?? "") !== String(runtimeConfig.allowedPipelineId) ||
    !String(ticket?.subject ?? "").startsWith(runtimeConfig.allowedSubjectPrefix)
  ) {
    throw new WorkflowError(
      "SANDBOX_CONTEXT_MISMATCH",
      "Ticketpipeline of subject wijkt af van de sandboxconfiguratie.",
    );
  }
}

function normalizeRecipientInput(input, runtimeConfig = config) {
  const action = String(input.action || "open");
  if (!["open", "status", "resume"].includes(action)) {
    throw new WorkflowError("INVALID_ACTION", "Werkbonactie is ongeldig.");
  }
  if (action === "resume" || (action === "status" && !input.recipients)) return null;

  const monteurName = String(input.recipients?.monteurName || "").trim();
  const klantName = String(input.recipients?.klantName || "").trim();
  const klantEmail = String(input.recipients?.klantEmail || "").trim().toLowerCase();
  if (!runtimeConfig.allowedMonteurNames.includes(monteurName)) {
    throw new WorkflowError("INVALID_MONTEUR", "Selecteer een geldige monteur.");
  }
  if (!klantName || klantName.length > 255) {
    throw new WorkflowError("INVALID_KLANT_NAME", "Vul een geldige klantnaam in.");
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(klantEmail)) {
    throw new WorkflowError("INVALID_KLANT_EMAIL", "Vul een geldig klant e-mailadres in.");
  }
  return {
    monteur: {
      name: monteurName,
      email: runtimeConfig.sandboxMonteurEmail.toLowerCase(),
    },
    klant: { name: klantName, email: klantEmail },
  };
}

function validateEnvelopeContract(
  envelope,
  ticketId,
  expectedRecipients = null,
  runtimeConfig = config,
) {
  const expectedExternalId = `hubspot-ticket:${ticketId}`;
  if (envelope.externalId !== expectedExternalId) {
    throw new WorkflowError(
      "ENVELOPE_CORRELATION_MISMATCH",
      "Documenso-envelope hoort niet bij dit sandboxticket.",
    );
  }
  if (
    envelope.templateEnvelopeId &&
    envelope.templateEnvelopeId !== runtimeConfig.documensoTemplateEnvelopeId
  ) {
    throw new WorkflowError(
      "TEMPLATE_MISMATCH",
      "Documenso-template wijkt af van het bewezen contract.",
    );
  }
  const monteur = envelope.signing?.monteur;
  const klant = envelope.signing?.klant;
  if (!monteur || !klant || monteur.signingOrder !== 1 || klant.signingOrder !== 2) {
    throw new WorkflowError(
      "SIGNING_RECIPIENTS_INVALID",
      "Documenso-recipients zijn niet veilig aan de signingvolgorde te koppelen.",
    );
  }
  if (expectedRecipients) {
    const matches =
      monteur.email === expectedRecipients.monteur.email &&
      monteur.name === expectedRecipients.monteur.name &&
      klant.email === expectedRecipients.klant.email &&
      klant.name === expectedRecipients.klant.name;
    if (!matches) {
      throw new WorkflowError(
        "RECIPIENT_MISMATCH",
        "De bestaande Documenso-envelope heeft andere recipientgegevens; er wordt geen nieuwe envelope gemaakt.",
      );
    }
  }
}

function determineSigningAction(envelope) {
  const monteur = envelope.signing.monteur;
  const klant = envelope.signing.klant;
  if (monteur.signingStatus !== "SIGNED") {
    if (!monteur.url) {
      throw new WorkflowError(
        "MONTEUR_SIGNING_URL_MISSING",
        "De signing URL van de monteur ontbreekt.",
      );
    }
    return "MONTEUR_SIGNING";
  }
  if (klant.signingStatus !== "SIGNED") {
    if (!klant.url) {
      throw new WorkflowError(
        "KLANT_SIGNING_URL_MISSING",
        "De signing URL van de klant ontbreekt.",
      );
    }
    return "KLANT_SIGNING";
  }
  return "STATUS_CHECK";
}

function selectRecoveryEnvelope(candidates) {
  if (!candidates.length) return null;
  const completed = candidates.filter((candidate) => candidate.status === "COMPLETED");
  if (completed.length > 1) {
    throw new WorkflowError(
      "MULTIPLE_COMPLETED_ENVELOPES",
      "Meerdere COMPLETED Documenso-envelopes gevonden; automatische recovery is geblokkeerd.",
    );
  }
  if (completed.length === 1) return completed[0];
  if (candidates.length === 1) return candidates[0];
  throw new WorkflowError(
    "AMBIGUOUS_ENVELOPE_RECOVERY",
    "Meerdere niet-completed Documenso-envelopes gevonden; automatische recovery is geblokkeerd.",
  );
}

async function findRecoveryEnvelope(
  ticketId,
  documenso,
  expectedRecipients,
  runtimeConfig = config,
) {
  const externalId = `hubspot-ticket:${ticketId}`;
  const references = await documenso.findEnvelopesByExternalId(externalId);
  const candidates = [];
  for (const reference of references) {
    const candidate = await documenso.getEnvelope(reference.id);
    validateEnvelopeContract(candidate, ticketId, expectedRecipients, runtimeConfig);
    candidates.push(candidate);
  }
  return selectRecoveryEnvelope(candidates);
}

async function runStartWorkflow(input, dependencies, runtimeConfig = config) {
  const { ticketId } = validateStartScope(input, runtimeConfig);
  const expectedRecipients = normalizeRecipientInput(input, runtimeConfig);
  const ticket = await dependencies.hubspot.getTicketContext(ticketId);
  validateTicketContext(ticket, ticketId, runtimeConfig);

  let source = "ticket_mapping";
  let envelopeId = ticket.envelopeId;
  let envelope;

  if (envelopeId) {
    envelope = await dependencies.documenso.getEnvelope(envelopeId);
  } else {
    const recoveredEnvelope = await findRecoveryEnvelope(
      ticketId,
      dependencies.documenso,
      expectedRecipients,
      runtimeConfig,
    );
    if (recoveredEnvelope) {
      source = "external_id_recovery";
      envelope = recoveredEnvelope;
      envelopeId = envelope.id;
      await dependencies.hubspot.updateEnvelopeId(ticketId, envelopeId);
    } else {
      if (!expectedRecipients) {
        throw new WorkflowError(
          "RECIPIENTS_REQUIRED",
          "Recipientgegevens zijn vereist voordat een nieuwe envelope kan worden gemaakt.",
        );
      }
      source = "created";
      const createdEnvelope = await dependencies.documenso.createFromTemplate({
        ticketId,
        recipients: expectedRecipients,
      });
      envelopeId = createdEnvelope.id;

      // De mapping is de primaire idempotency-lock en wordt direct na create vastgelegd.
      await dependencies.hubspot.updateEnvelopeId(ticketId, envelopeId);
      envelope = await dependencies.documenso.getEnvelope(envelopeId);
      validateEnvelopeContract(envelope, ticketId, expectedRecipients, runtimeConfig);
      await dependencies.documenso.distributeEnvelope(envelopeId);
    }
  }

  validateEnvelopeContract(envelope, ticketId, expectedRecipients, runtimeConfig);

  if (ticket.hubspotFileId) {
    return readyResult({
      source,
      status: "FILE_ATTACHED",
      envelope,
      hubspotFileId: ticket.hubspotFileId,
    });
  }

  if (envelope.status !== "COMPLETED") {
    return readyResult({ source, status: "SIGNING_PENDING", envelope });
  }

  if (!envelope.envelopeItemId) {
    throw new WorkflowError(
      "ENVELOPE_ITEM_MISSING",
      "Documenso envelope-item voor signed PDF ontbreekt.",
    );
  }

  const pdfBytes = await dependencies.documenso.downloadSignedPdf(envelope.envelopeItemId);
  const file = await dependencies.hubspot.uploadPrivateSignedPdf(ticketId, pdfBytes);
  await dependencies.hubspot.createTicketNoteWithAttachment(ticketId, file.id);
  await dependencies.hubspot.updateHubSpotFileId(ticketId, file.id);

  return readyResult({
    source,
    status: "FILE_ATTACHED",
    envelope,
    hubspotFileId: file.id,
  });
}

async function runResumeWorkflow(input, dependencies, runtimeConfig = config) {
  const { ticketId } = validateStartScope(input, runtimeConfig);
  normalizeRecipientInput({ ...input, action: "resume", recipients: undefined }, runtimeConfig);
  const ticket = await dependencies.hubspot.getTicketContext(ticketId);
  validateTicketContext(ticket, ticketId, runtimeConfig);

  if (!ticket.envelopeId) {
    return {
      ok: true,
      status: "NO_ENVELOPE",
      source: "ticket_mapping",
      envelopeId: null,
      envelopeStatus: null,
      externalId: null,
      hubspotFileId: null,
      nextAction: null,
      monteur: null,
      klant: null,
    };
  }

  const envelope = await dependencies.documenso.getEnvelope(ticket.envelopeId);
  validateEnvelopeContract(envelope, ticketId, null, runtimeConfig);

  if (ticket.hubspotFileId) {
    return readyResult({
      source: "ticket_mapping",
      status: "FILE_ATTACHED",
      envelope,
      hubspotFileId: ticket.hubspotFileId,
    });
  }

  return readyResult({
    source: "ticket_mapping",
    status: envelope.status === "COMPLETED" ? "COMPLETED_PENDING_FILE" : "SIGNING_PENDING",
    envelope,
  });
}

function readyResult({ source, status, envelope, hubspotFileId = null }) {
  const nextAction =
    status === "FILE_ATTACHED" ? "COMPLETE" : determineSigningAction(envelope);
  return {
    ok: true,
    status,
    source,
    envelopeId: envelope.id,
    envelopeStatus: envelope.status,
    externalId: envelope.externalId,
    hubspotFileId,
    nextAction,
    monteur: envelope.signing.monteur,
    klant: envelope.signing.klant,
  };
}

function createRuntimeDependencies() {
  return {
    hubspot: createHubSpotTicketClient({
      accessToken: process.env.HUBSPOT_WORKBON_SERVICE_KEY,
      config,
    }),
    documenso: createDocumensoClient({
      apiToken: process.env.DOCUMENSO_API_TOKEN,
      config,
    }),
  };
}

async function runOncePerTicket(ticketId, operation) {
  const current = inFlightByTicket.get(ticketId);
  if (current) return current;
  const pending = operation().finally(() => inFlightByTicket.delete(ticketId));
  inFlightByTicket.set(ticketId, pending);
  return pending;
}

function serializeWorkflowError(error) {
  const isSafeError = typeof error?.code === "string";
  const serialized = {
    code: isSafeError ? error.code : "WORKFLOW_FAILED",
    message: isSafeError ? error.message : "Werkbon verwerken is mislukt.",
  };
  if (error instanceof DocumensoClientError && error.code === "DOCUMENSO_REQUEST_FAILED") {
    Object.assign(serialized, {
      status: error.status,
      method: error.method,
      endpoint: error.endpoint,
      documensoCode: error.documensoCode,
      documensoMessage: error.documensoMessage,
      retryAfter: error.retryAfter,
      rateLimit: error.rateLimit,
    });
  }
  return serialized;
}

exports.main = async (context = {}) => {
  try {
    const input = {
      serverAccountId: context.accountId,
      clientAccountId: context.parameters?.accountId,
      ticketId: context.parameters?.ticketId,
      action: context.parameters?.action,
      recipients: context.parameters?.recipients,
    };
    const scope = validateStartScope(input);
    return await runOncePerTicket(scope.ticketId, () => {
      const dependencies = createRuntimeDependencies();
      return input.action === "resume"
        ? runResumeWorkflow(input, dependencies)
        : runStartWorkflow(input, dependencies);
    });
  } catch (error) {
    return {
      ok: false,
      status: "ERROR",
      error: serializeWorkflowError(error),
      envelopeId: null,
      envelopeStatus: null,
      externalId: null,
      hubspotFileId: null,
      nextAction: null,
      monteur: null,
      klant: null,
    };
  }
};

module.exports.WorkflowError = WorkflowError;
module.exports.normalizeId = normalizeId;
module.exports.normalizeRecipientInput = normalizeRecipientInput;
module.exports.determineSigningAction = determineSigningAction;
module.exports.findRecoveryEnvelope = findRecoveryEnvelope;
module.exports.runOncePerTicket = runOncePerTicket;
module.exports.runResumeWorkflow = runResumeWorkflow;
module.exports.runStartWorkflow = runStartWorkflow;
module.exports.serializeWorkflowError = serializeWorkflowError;
module.exports.selectRecoveryEnvelope = selectRecoveryEnvelope;
module.exports.validateEnvelopeContract = validateEnvelopeContract;
module.exports.validateStartScope = validateStartScope;
module.exports.validateTicketContext = validateTicketContext;
