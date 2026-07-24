# ACTUEEL — Werkbon Qvantum projectstatus

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
WP0 — Governance

WP0-STATUS:
DONE (lokale governance-inrichting)

WP0 VERDICT:
PASS WITH GITHUB BLOCKER

IMPLEMENTATIESTATUS:
Niet vrijgegeven
```

De lokale governance-repository is ingericht. Externe GitHub-aanmaak en push zijn geblokkeerd omdat GitHub CLI niet beschikbaar is en daardoor geen account/owner aantoonbaar kon worden vastgesteld.

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

- GitHub CLI is niet beschikbaar; account/owner, bestaande repository en zichtbaarheid zijn niet aantoonbaar.
- De benodigde read-only HubSpot- en n8n-verbindingen zijn in deze Codex-omgeving nog niet gepreflight.
- PandaDoc-template-details zijn gedeeltelijk geblokkeerd door een connectorvalidatiefout.
- Open functionele besluiten D01–D12 verhinderen een definitief technisch contract.

## Open besluiten

De besluiten D01–D12 staan allemaal `OPEN`. Zie het [open besluitenregister](Werkbon%20Qvantum%20open%20decisions.md). Er is in WP0 geen besluit namens GPT/Chat genomen.

## Laatst afgeronde stap

Lokale WP0-governance-inrichting: minimale structuur, uitvoeringsregels, status, execution plan en besluitenregister zijn aangemaakt en lokaal gevalideerd.

## Enige toegestane volgende stap

**WP1 — gebundelde, uitsluitend read-only toegangs- en baseline-inspectie, te beginnen met een preflight van de beschikbare HubSpot- en n8n-verbindingen.**

WP1 blijft geblokkeerd totdat de benodigde read-only verbindingen in de betreffende Codex-omgeving aantoonbaar beschikbaar zijn.

## Uitvoerkanaal en motivatie

Codex is het aangewezen kanaal voor de WP1-preflight en read-only inspectie, omdat Codex technisch bewijs kan ophalen en valideren. Work wordt alleen voor een afgebakende PandaDoc-connectoractie gebruikt als die aantoonbaar meerwaarde heeft. GPT/Chat beslist over scope en vrijgave.

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
