"use strict";

const sharedConfig = Object.freeze({
  allowedPipelineId: "0",
  documensoApiBaseUrl: "https://app.documenso.com/api/v2",
  documensoAppBaseUrl: "https://app.documenso.com",
  documensoTemplateEnvelopeId: "envelope_dtufbxnrcmecmzbi",
  ticketProperties: Object.freeze({
    envelopeId: "qvantum_documenso_envelope_id",
    hubspotFileId: "qvantum_documenso_hubspot_file_id",
  }),
  recipientSlots: Object.freeze({
    monteur: 3320825,
    klant: 3320824,
  }),
  sandboxMonteurEmail: "teun.willems@qvantum.com",
  allowedMonteurNames: Object.freeze([
    "Richard van den Bergh",
    "Marco Liefhebber",
  ]),
  noteAssociationTypeId: 228,
});

const sandboxConfig = Object.freeze({
  ...sharedConfig,
  environmentName: "sandbox",
  allowedPortalId: "147599771",
  allowedTicketIds: null,
  allowedSubjectPrefix: "TEST - Werkbon",
  allowedSubjectExact: null,
  externalIdPrefix: "hubspot-ticket:",
});

const productionConfig = Object.freeze({
  ...sharedConfig,
  environmentName: "production",
  allowedPortalId: "143794667",
  allowedTicketIds: null,
  allowedSubjectPrefix: null,
  allowedSubjectExact: null,
  externalIdPrefix: "hubspot:143794667:ticket:",
});

const environments = Object.freeze({
  sandbox: sandboxConfig,
  production: productionConfig,
});

function forPortal(portalId) {
  const normalized = String(portalId ?? "");
  return Object.values(environments).find(
    (environmentConfig) => environmentConfig.allowedPortalId === normalized,
  ) || null;
}

module.exports = Object.freeze({
  ...sandboxConfig,
  environments,
  forPortal,
});
