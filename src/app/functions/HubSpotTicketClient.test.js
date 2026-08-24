"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const config = require("./WerkbonConfig");
const { createHubSpotTicketClient } = require("./HubSpotTicketClient");

function response(status, body) {
  return {
    status,
    ok: status >= 200 && status < 300,
    async json() {
      return body;
    },
  };
}

test("HubSpot adapter reads only guards and the two allowed mapping properties", async () => {
  let request;
  const client = createHubSpotTicketClient({
    accessToken: "mock-token",
    config,
    fetchImpl: async (url, options = {}) => {
      request = { url: new URL(url), options };
      return response(200, {
        id: "425555669195",
        properties: {
          subject: "TEST - Werkbon",
          hs_pipeline: "0",
          qvantum_documenso_envelope_id: "envelope_existing",
          qvantum_documenso_hubspot_file_id: "1234",
        },
      });
    },
  });

  const ticket = await client.getTicketContext("425555669195");
  assert.equal(
    request.url.searchParams.get("properties"),
    "subject,hs_pipeline,qvantum_documenso_envelope_id,qvantum_documenso_hubspot_file_id",
  );
  assert.deepEqual(ticket, {
    id: "425555669195",
    subject: "TEST - Werkbon",
    pipelineId: "0",
    envelopeId: "envelope_existing",
    hubspotFileId: "1234",
  });
});

test("mapping updates write one allowed property at a time", async () => {
  const requests = [];
  const client = createHubSpotTicketClient({
    accessToken: "mock-token",
    config,
    fetchImpl: async (url, options = {}) => {
      requests.push({ url: new URL(url), options });
      return response(200, { id: "425555669195" });
    },
  });

  await client.updateEnvelopeId("425555669195", "envelope_a");
  await client.updateHubSpotFileId("425555669195", "5678");
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    properties: { qvantum_documenso_envelope_id: "envelope_a" },
  });
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    properties: { qvantum_documenso_hubspot_file_id: "5678" },
  });
});

test("completion uploads PRIVATE PDF and creates one attached Note on the same Ticket", async () => {
  const requests = [];
  const client = createHubSpotTicketClient({
    accessToken: "mock-token",
    config,
    fetchImpl: async (url, options = {}) => {
      requests.push({ url: new URL(url), options });
      if (new URL(url).pathname === "/files/v3/files") return response(201, { id: "file_1" });
      return response(201, { id: "note_1" });
    },
  });

  const file = await client.uploadPrivateSignedPdf(
    "425555669195",
    Buffer.from("%PDF-1.7 signed"),
  );
  const note = await client.createTicketNoteWithAttachment("425555669195", file.id);

  assert.equal(file.name, "Qvantum Werkbon - 425555669195 - signed.pdf");
  assert.equal(requests[0].options.body.get("folderPath"), "/Qvantum Werkbon");
  assert.deepEqual(JSON.parse(requests[0].options.body.get("options")), {
    access: "PRIVATE",
    overwrite: false,
    duplicateValidationStrategy: "RETURN_EXISTING",
    duplicateValidationScope: "EXACT_FOLDER",
  });
  const noteBody = JSON.parse(requests[1].options.body);
  assert.equal(noteBody.properties.hs_attachment_ids, "file_1");
  assert.equal(noteBody.associations[0].to.id, "425555669195");
  assert.equal(noteBody.associations[0].types[0].associationTypeId, 228);
  assert.equal(note.id, "note_1");
});
