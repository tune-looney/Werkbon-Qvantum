"use strict";

const API_BASE_URL = "https://api.hubapi.com";

class HubSpotClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "HubSpotClientError";
    this.code = code;
  }
}

function createHubSpotTicketClient({ accessToken, fetchImpl = globalThis.fetch, config }) {
  if (!accessToken) {
    throw new HubSpotClientError("HUBSPOT_NOT_CONFIGURED", "HubSpot is niet geconfigureerd.");
  }
  if (typeof fetchImpl !== "function" || typeof FormData !== "function") {
    throw new HubSpotClientError("HTTP_NOT_AVAILABLE", "HTTP-client is niet beschikbaar.");
  }

  async function request(path, options = {}) {
    const response = await fetchImpl(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new HubSpotClientError(
        "HUBSPOT_REQUEST_FAILED",
        `HubSpot-request mislukt (${response.status}).`,
      );
    }
    return response;
  }

  async function jsonRequest(path, options = {}) {
    const response = await request(path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
    return response.status === 204 ? null : response.json();
  }

  return {
    async getTicketContext(ticketId) {
      const properties = [
        "subject",
        "hs_pipeline",
        config.ticketProperties.envelopeId,
        config.ticketProperties.hubspotFileId,
      ].join(",");
      const ticket = await jsonRequest(
        `/crm/v3/objects/tickets/${encodeURIComponent(ticketId)}?properties=${properties}`,
      );
      return {
        id: String(ticket?.id || ""),
        subject: ticket?.properties?.subject || null,
        pipelineId: ticket?.properties?.hs_pipeline || null,
        envelopeId: ticket?.properties?.[config.ticketProperties.envelopeId] || null,
        hubspotFileId: ticket?.properties?.[config.ticketProperties.hubspotFileId] || null,
      };
    },

    async updateEnvelopeId(ticketId, envelopeId) {
      await jsonRequest(`/crm/v3/objects/tickets/${encodeURIComponent(ticketId)}`, {
        method: "PATCH",
        body: JSON.stringify({
          properties: { [config.ticketProperties.envelopeId]: envelopeId },
        }),
      });
    },

    async updateHubSpotFileId(ticketId, fileId) {
      await jsonRequest(`/crm/v3/objects/tickets/${encodeURIComponent(ticketId)}`, {
        method: "PATCH",
        body: JSON.stringify({
          properties: { [config.ticketProperties.hubspotFileId]: String(fileId) },
        }),
      });
    },

    async uploadPrivateSignedPdf(ticketId, pdfBytes) {
      const filename = `Qvantum Werkbon - ${ticketId} - signed.pdf`;
      const form = new FormData();
      form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), filename);
      form.append("folderPath", "/Qvantum Werkbon");
      form.append(
        "options",
        JSON.stringify({
          access: "PRIVATE",
          overwrite: false,
          duplicateValidationStrategy: "RETURN_EXISTING",
          duplicateValidationScope: "EXACT_FOLDER",
        }),
      );
      const response = await request("/files/v3/files", { method: "POST", body: form });
      const file = await response.json();
      const fileId = String(file?.id || "");
      if (!fileId) {
        throw new HubSpotClientError("INVALID_FILE_RESPONSE", "HubSpot File-ID ontbreekt.");
      }
      return { id: fileId, name: filename };
    },

    async createTicketNoteWithAttachment(ticketId, fileId) {
      const note = await jsonRequest("/crm/v3/objects/notes", {
        method: "POST",
        body: JSON.stringify({
          properties: {
            hs_timestamp: new Date().toISOString(),
            hs_note_body: "Ondertekende Qvantum-werkbon ontvangen via Documenso.",
            hs_attachment_ids: String(fileId),
          },
          associations: [
            {
              to: { id: String(ticketId) },
              types: [
                {
                  associationCategory: "HUBSPOT_DEFINED",
                  associationTypeId: config.noteAssociationTypeId,
                },
              ],
            },
          ],
        }),
      });
      const noteId = String(note?.id || "");
      if (!noteId) {
        throw new HubSpotClientError("INVALID_NOTE_RESPONSE", "HubSpot Note-ID ontbreekt.");
      }
      return { id: noteId };
    },
  };
}

module.exports = { HubSpotClientError, createHubSpotTicketClient };
