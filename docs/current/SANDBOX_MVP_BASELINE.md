# Werkbon Qvantum — Sandbox MVP Golden Baseline

## Status

```text
SANDBOX MVP — PASS
```

- Baseline datum: `2026-08-24`
- Bewezen deployment: HubSpot sandbox Build #10 — `SUCCEEDED / DEPLOYED`
- Project: `qvantum-werkbon`
- HubSpot platformversie: `2026.03`
- HubSpot sandbox portal: `147599771`
- Ticket pipeline: `0`
- Vereiste subjectprefix: `TEST - Werkbon`
- App Card: `Qvantum Werkbon`, UID `qvantum_werkbon_ticket_card`, op `crm.record.tab` voor `TICKETS`
- App function UID: `qvantum_werkbon_start`

## Documenso-contract

- Template-envelope-ID: `envelope_dtufbxnrcmecmzbi`
- Recipient slot monteur: `3320825`
- Recipient slot klant: `3320824`
- Signing order: eerst monteur, daarna klant

Secretreferenties, uitsluitend als namen:

- `DOCUMENSO_API_TOKEN`
- `HUBSPOT_WORKBON_SERVICE_KEY`

Secretwaarden horen nooit in Git, documentatie, logs of testoutput.

## HubSpot Ticket-contract

De sandboxguard accepteert uitsluitend portal `147599771`, pipeline `0` en een subject met prefix `TEST - Werkbon`. Binnen die guards is geen Ticket-ID hardcoded.

Gebruikte Ticket-properties:

- `subject`
- `hs_pipeline`
- `qvantum_documenso_envelope_id`
- `qvantum_documenso_hubspot_file_id`

De envelope-mapping wordt direct na creatie als duurzame externe mapping op hetzelfde Ticket opgeslagen. De HubSpot file-ID wordt pas na succesvolle verwerking van de definitieve PDF vastgelegd.

## Bewezen end-to-end keten

```text
HubSpot Ticket
→ Qvantum Werkbon App Card
→ Documenso envelope
→ Monteur SIGNED
→ Klant SIGNED
→ COMPLETED
→ signed PDF
→ HubSpot PRIVATE File + Note
→ hetzelfde Ticket
```

## Idempotency en recovery

- Een bestaande Ticket-envelope-mapping wordt hergebruikt; er wordt niet opnieuw gecreëerd.
- Zonder mapping wordt op de deterministische externe ID gezocht voordat creatie wordt toegestaan.
- Exact één herstelkandidaat mag worden gekoppeld; meerdere kandidaten stoppen als ambigu.
- Een onbekende, stale of recipient-mismatched mapping stopt veilig vóór vervangende creatie.
- Resume-on-load herstelt de actuele signing/statusactie zonder recipient-input en zonder writes.
- De definitieve PDF wordt maximaal éénmaal als private HubSpot File met Note aan hetzelfde Ticket gekoppeld.
- Een reeds vastgelegde HubSpot file-ID voorkomt dubbele completion-writes.

## Lokale golden validation

De baseline wordt alleen gefreezed wanneer dezelfde source lokaal bevestigt:

```text
34/34 function tests PASS
9/9 App Card tests PASS
typecheck PASS
hs project validate PASS
clean runtime/module-load PASS
```

De self-contained `src/app/functions/QvantumWerkbonRuntime.js` is het case-exacte runtime-entrypoint uit de app-functionmetadata en wordt reproduceerbaar gegenereerd door `build-runtime-bundle.js`.

## Production Readiness-startstatus

Sandboxbewijs is geen productiebewijs. Production Readiness start read-only en moet onder andere productie-identiteit, configuratie, rechten, secrets, properties, observability, herstel, gegevensbescherming en controlled-cutoverguards afzonderlijk bewijzen voordat enige productionwijziging wordt toegestaan.

Deze baseline is de golden source voor alle Production Readiness- en Controlled Cutover-wijzigingen. De baselinecommit en annotated tag `werkbon-sandbox-mvp-pass-2026-08-24` moeten exact naar dezelfde immutable bronstaat verwijzen.
