# Werkbon Qvantum — open besluiten

GPT/Chat is eigenaar van functionele besluitvorming. Dit register legt open, gewijzigde en gesloten besluiten vast; WP0 neemt geen besluit namens GPT/Chat.

| ID | Besluit | Status | Advies | Datum | Eigenaar | Bewijs | Definitief besluit | Gevolgen voor contract of implementatie |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D01 | Gecontroleerde startwijze | `OPEN` | Handmatige ticketactie; beveiligde webhook alleen als fallback | — | GPT/Chat | Nog te verzamelen | — | Nog te bepalen |
| D02 | Monteursbron | `OPEN` | Handmatig totdat een eenduidig productieveld bewezen is | — | GPT/Chat | Nog te verzamelen | — | Nog te bepalen |
| D03 | Opdrachtgever en bezoekadres | `OPEN` | Ticketserviceadres vóór companyfallback | — | GPT/Chat | Nog te verzamelen | — | Nog te bepalen |
| D04 | PandaDoc-rollen en Route A | `OPEN` | Eén document; monteur gevolgd door klant | — | GPT/Chat | Nog te verzamelen | — | Nog te bepalen |
| D05 | Route B/C | `OPEN` | B als fallback; C alleen als expliciete uitzondering | — | GPT/Chat | Nog te verzamelen | — | Nog te bepalen |
| D06 | Reis- en totaalvelden | `OPEN` | Eenvoudige numerieke invoer | — | GPT/Chat | Nog te verzamelen | — | Nog te bepalen |
| D07 | PandaDoc-plan, regio, API en webhooks | `OPEN` | Feitelijk workspacebewijs verzamelen | — | GPT/Chat | Nog te verzamelen | — | Nog te bepalen |
| D08 | PDF-weergave in HubSpot | `OPEN` | Sandbox File + Note + attachment bewezen; eerste productionupload is controlled-cutoverstopgate | 2026-08-26 | GPT/Chat | `SANDBOX_MVP_BASELINE.md`; production-prepvalidation | Productionbewijs volgt uitsluitend in controlled cutover | Eerste auth/scopefout stopt de cutover |
| D09 | Gedrag bij gesloten ticket | `OPEN` | Koppelen zonder ticket te heropenen | — | GPT/Chat | Nog te verzamelen | — | Nog te bepalen |
| D10 | Pilotapparaten | `OPEN` | Smartphone en tablet feitelijk testen | — | GPT/Chat | Nog te verzamelen | — | Nog te bepalen |
| D11 | Pilotselectie | `CLOSED` | Kleine allowlist met eigenaar en stopcriterium | 2026-08-26 | GPT/Chat | `WerkbonConfig.js`; production Ticket-inspectie | Enig production-cutoverticket is `415307052257` met exact subject `OSH BEA400` | Runtime weigert ieder ander productionticket vóór dependencies |
| D12 | Propertyprefix | `CLOSED` | `qvantum_*` uit specificatie v1.1 leidend houden | 2026-08-26 | GPT/Chat | Production property read-back | `qvantum_documenso_envelope_id` en `qvantum_documenso_hubspot_file_id` | Beide properties bestaan als single-line tekst |
| D13 | Production-MVP closure en pilot guard | `CLOSED` | MVP sluiten; pilot blokkeren tot tijdelijke cutover-guards zijn vervangen door bedoelde pilot guards | 2026-08-26 | GPT/Chat | Production deployment/cutoverbewijs en closure-addendum | `PASS — PRODUCTION MVP CLOSED`; `NEXT — PILOT GUARD CONFIGURATION` | Geen pilotgebruik op huidige exact-ticketguard; Note-verwijdering verwijdert ook de attachmentweergave |
