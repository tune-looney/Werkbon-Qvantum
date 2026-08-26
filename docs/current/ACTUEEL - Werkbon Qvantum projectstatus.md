# ACTUEEL — Werkbon Qvantum projectstatus

## Actuele production-MVP- en pilotstatus — 2026-08-26

```text
PROJECTFASE:
Production MVP gesloten; pilotguard-update vereist

VERDICT:
PASS — PRODUCTION MVP CLOSED

ENIGE VOLGENDE VEILIGE STAP:
Pilot Guard Configuration
```

Leidende technische baseline:

- golden sandboxcommit en tag: `19ef7f71c3d6af7539e1c7d82326ea67ddc86797` / `werkbon-sandbox-mvp-pass-2026-08-24`;
- productionportal: `143794667`;
- productionpipeline: `0`;
- enig vrijgegeven productionticket: `415307052257`;
- exact productionsubject: `OSH BEA400`;
- production externalId: `hubspot:143794667:ticket:<ticketId>`;
- beide `qvantum_documenso_*` Ticket-properties bestaan als single-line tekst;
- sandbox en production worden fail-closed op serverportal van elkaar gescheiden;
- lokale validatie: 41/41 function tests, 10/10 App Card tests, typecheck, project validate voor beide profielen, clean module-load en reproduceerbare runtimebundle PASS.
- production deployment: build `#1`, deployment `#2`, application/card/serverless `SUCCESS`;
- gecontroleerde production-MVP: Ticket `415307052257`, subject `OSH BEA400`, exact één envelope, signingvolgorde Monteur → Klant, `COMPLETED`, signed PDF en Note visueel bevestigd;
- test-Note en attachment zijn na visuele verificatie handmatig verwijderd; beide technische mappingproperties blijven behouden als audit- en idempotentiestate.

Operationele les voor de pilot: het verwijderen van de HubSpot Note verwijdert ook de gekoppelde werkbonattachment uit de Ticketweergave.

## Voorbereidende pilotdocumentatie (pilot nog niet gereed)

- Monteurs: Richard van den Bergh en Marco Liefhebber.
- Alleen vooraf geselecteerde echte production Tickets; geen bulkgebruik of automatisering. De huidige tijdelijke guards staan nog op exact Ticket `415307052257` en subject `OSH BEA400`; deze moeten vóór pilot worden vervangen door de bedoelde production pilot guards.
- Monteur gebruikt de App Card handmatig vanuit het juiste Ticket.
- Klant tekent op hetzelfde apparaat.
- Dagelijks of periodiek kort evaluatiemoment; geen automatische retries.

Stop en escaleer direct bij verkeerde Ticket/context, een tweede of dubbele envelope, vastlopende signingflow, ontbrekende PDF/Note, File/auth/scopefout, onbruikbare App Card, onverwachte CRM-write of afwijkend recovery/idempotencygedrag.

Files-search is geen pre-deployment stopgate meer: de waargenomen HTTP 400-responses waren `VALIDATION_ERROR` en geen auth/scopebewijs. De eerste echte File-upload blijft tijdens de controlled cutover een expliciete stopgate; de eerste auth/scopefout stopt die cutover onmiddellijk.

Niet uitgevoerd sinds closure: geen nieuwe deployment, secretswijziging, runtime-test of cleanup. De test-Note en attachment zijn buiten deze closure al handmatig verwijderd; mappingproperties zijn bewust behouden. Pilot readiness is geblokkeerd totdat de tijdelijke cutover-guards zijn aangepast.

Deze sectie vervangt voor actuele status en volgende stap de historische WP0/WP1-status verderop in dit document.

Dit document is het verplichte startpunt voor iedere nieuwe Chat-, Work- en Codex-sessie.

## Projectdoel

Een beheerste digitale werkbon realiseren op basis van de leidende PandaDoc MVP-specificatie, met bewijsgebonden toegang, expliciete besluitvorming en gefaseerde vrijgave.

## Vaste rolverdeling

- **GPT/Chat:** architect, reviewer, besluitvorming, scope en vrijgave.
- **Codex:** technische inspecteur, ophaler, uitvoerder na vrijgave en validator.
- **Work:** specialistisch kanaal wanneer een connector aantoonbaar meerwaarde heeft; momenteel PandaDoc.
- **Git:** leidende bron voor status, besluiten, contracten en bewijs.

## Huidige fase en verdict

```text
PROJECTFASE:
WP1 — Toegang en baseline

WP0 — Governance:
DONE

GitHub-publicatie:
DONE

GitHub-repository:
tune-looney/Werkbon-Qvantum

URL:
https://github.com/tune-looney/Werkbon-Qvantum

Visibility:
PRIVATE

Default branch:
main

Gepubliceerde WP0-baseline:
efa196b49ee17ba528cc5613181fc7ac16d4819d

WP1 — Toegang en baseline:
NEXT — uitsluitend read-only verbindingspreflight

WP2 — Functioneel contract:
NOT STARTED

IMPLEMENTATIESTATUS:
Niet vrijgegeven
```

De eerdere GitHub-publicatieblocker is gesloten. De private repository is gepubliceerd en lokale `main` en `origin/main` waren bij afronding synchroon op de vastgelegde WP0-baseline.

## Leidende specificatie

```text
Qvantum digitale werkbon — PandaDoc MVP-specificatie v1.1 compacte monteursbon
```

Deze bron is als projectbaseline opgegeven; de brontekst zelf is nog niet als bewijs in deze repository opgenomen.

## Bewezen systeemtoegang

```text
PANDADOC:
Plugin-toegang bewezen
Template “Werkbon Qvantum” zichtbaar
Template-ID 9FrKvGKKAJedj3J3mVqwW6
Templateversie 2
Template-details gedeeltelijk geblokkeerd door connectorvalidatiefout
```

Dit is de door de opdrachtgever aangeleverde baseline. In WP0 is geen connectorinspectie uitgevoerd.

## Nog niet bewezen toegang

```text
HUBSPOT-PRODUCTIE:
Portal 143794667 — nog niet via Codex read-only geïnspecteerd

HUBSPOT-SANDBOX:
Portal 147599771 — bestaande afzonderlijke sandboxomgeving

N8N:
Codex-MCP-toegang volgens projectcontext beschikbaar
Map “Werkbon” volgens opdrachtgever nog leeg
Inhoudelijke read-only baseline-inspectie nog niet uitgevoerd
```

De n8n-beschikbaarheid en mapinhoud zijn nog niet door WP1-bewijs bevestigd.

## HubSpot-portalidentiteiten

| Omgeving | Account | Portal-ID | Bewijsstatus |
| --- | --- | --- | --- |
| Productie | Qvantum Industries | `143794667` | Nog niet read-only geïnspecteerd |
| Sandbox | Afzonderlijke sandboxomgeving | `147599771` | Bestaan opgegeven; toegang nog niet bewezen |

## Actuele blockers

- De benodigde read-only HubSpot- en n8n-verbindingen zijn in deze Codex-omgeving nog niet gepreflight.
- PandaDoc-template-details zijn gedeeltelijk geblokkeerd door een connectorvalidatiefout.
- Open functionele besluiten D01–D12 verhinderen een definitief technisch contract.

## Open besluiten

De besluiten D01–D12 staan allemaal `OPEN`. Zie het [open besluitenregister](Werkbon%20Qvantum%20open%20decisions.md). Er is in WP0 geen besluit namens GPT/Chat genomen.

## Laatst afgeronde stap

WP0-governance en GitHub-publicatie: de minimale structuur en governancebestanden zijn lokaal gevalideerd, gecommit en als private repository `tune-looney/Werkbon-Qvantum` gepubliceerd.

## Enige toegestane volgende stap

```text
UITVOEREN IN: Codex

WP1 — uitsluitend read-only verbindingspreflight.

DOEL:
Aantoonbaar vaststellen welke verbindingen beschikbaar zijn voor
HubSpot-productie, HubSpot-sandbox en n8n, met welke omgeving ze verbonden
zijn en welke relevante toegangs- en mutatiescope aantoonbaar geldt.

PANDADOC:
Afzonderlijk via Work inspecteren na expliciete vrijgave.

VERBODEN:
Nog geen inhoudelijke baseline-inspectie, credentialwijziging,
connectorherconfiguratie, workflowuitvoering, implementatie of systeemwrite.
```

Een eerste WP1-poging is vóór iedere externe connectorinspectie gestopt, uitsluitend vanwege een governance-inconsistentie tussen dit statusdocument en het execution plan. Er is daarbij geen HubSpot- of n8n-verbindingsbewijs verzameld. Na herstel van die inconsistentie is WP1 opnieuw `NEXT` en moet het vanaf de volledige repositorypreflight worden uitgevoerd. PandaDoc blijft buiten WP1 en vereist afzonderlijke Work-vrijgave. WP2 is `NOT STARTED` en mag pas beginnen nadat WP1 bewijsgebonden is afgerond en volgens het execution plan is vrijgegeven.

## Uitvoerkanaal en motivatie

Codex is het aangewezen kanaal voor uitsluitend de WP1-verbindingspreflight, omdat Codex technisch bewijs kan ophalen en valideren. PandaDoc wordt afzonderlijk via Work geïnspecteerd na expliciete vrijgave. GPT/Chat beslist over scope en vrijgave.

## Verboden acties

- Geen implementatie, mutatie of credentialconfiguratie.
- Geen HubSpot-, PandaDoc- of n8n-write-acties.
- Geen workflow maken, wijzigen, uitvoeren, activeren of publiceren.
- Geen properties, templates, documenten of testrecords maken.
- Geen productie- of sandboxdata wijzigen.
- Geen secrets of volledige productiepayloads lezen, tonen of opslaan.
- Geen technische actie buiten de expliciet vrijgegeven scope.

## Leidende verwijzingen

- [Execution plan](Werkbon%20Qvantum%20execution%20plan.md)
- [Open besluitenregister](Werkbon%20Qvantum%20open%20decisions.md)
- [HubSpot-bewijs](../evidence/hubspot/)
- [PandaDoc-bewijs](../evidence/pandadoc/)
- [n8n-bewijs](../evidence/n8n/)
- [Archief](../archive/)
