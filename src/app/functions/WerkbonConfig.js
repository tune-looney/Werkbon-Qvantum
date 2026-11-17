"use strict";

const sharedConfig = Object.freeze({
  allowedPipelineId: "0",
  documensoApiBaseUrl: "https://app.documenso.com/api/v2",
  documensoAppBaseUrl: "https://app.documenso.com",
  // Werkbon v6 (nieuwe huisstijl), sjabloon aangemaakt 17 nov 2026 (template_25849).
  documensoTemplateEnvelopeId: "envelope_terbtckdrdlvukcf",
  // Eerdere sjablonen: envelopes die daaruit zijn gemaakt blijven geldig (open werkbonnen van voor de wissel).
  previousTemplateEnvelopeIds: Object.freeze(["envelope_dtufbxnrcmecmzbi"]),
  ticketProperties: Object.freeze({
    envelopeId: "qvantum_documenso_envelope_id",
    hubspotFileId: "qvantum_documenso_hubspot_file_id",
  }),
  recipientSlots: Object.freeze({
    monteur: 4194043,
    klant: 4194044,
  }),
  // De monteur is de ingelogde HubSpot-gebruiker (App Card stuurt naam en e-mail mee). Toegestaan: alleen deze
  // namen, en alleen een e-mailadres op het Qvantum-domein. Het vaste sandboxadres uit de testfase is weg (17 nov 2026).
  allowedMonteurNames: Object.freeze([
    "Marco Liefhebber",
  ]),
  allowedMonteurEmailDomain: "qvantum.com",
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
