# Werkbon Qvantum — execution plan

## Overzicht

| Werkpakket | Doel | Status |
| --- | --- | --- |
| WP0 — Governance | Repository, rollen, bronnen en veiligheidsregels vastleggen | `DONE` |
| WP1 — Toegang en baseline | HubSpot-productie, HubSpot-sandbox en n8n bewijsgebonden inspecteren | `NEXT` |
| WP2 — Functioneel contract | Specificatie v1.1, mappings en besluiten definitief maken | `NOT STARTED` |
| WP3 — Technisch ontwerp | Trigger, documentcreatie, statusverwerking, PDF-route en idempotentie ontwerpen | `NOT STARTED` |
| WP4 — Prototype | Afgebakende workflow bouwen en statisch valideren | `NOT STARTED` |
| WP5 — Productiepilot | Kleine allowlist en gecontroleerde mobiele pilot uitvoeren | `NOT STARTED` |
| WP6 — Operationalisering | Monitoring, herstel, beheer en overdracht regelen | `NOT STARTED` |

Actuele roadmapstatus:

```text
WP0: DONE
GitHub-publicatie: DONE
WP1: NEXT
WP2: NOT STARTED
```

De enige toegestane inhoudelijke vervolgstap is WP1. Een eerste WP1-poging is vóór iedere externe connectorinspectie gestopt, uitsluitend vanwege een governance-inconsistentie; daarbij is geen HubSpot- of n8n-verbindingsbewijs verzameld. Na herstel daarvan is WP1 opnieuw `NEXT` en moet het vanaf de volledige repositorypreflight worden uitgevoerd. WP2 is `NOT STARTED` en mag pas starten nadat WP1 bewijsgebonden is afgerond en volgens dit execution plan is vrijgegeven. PandaDoc valt buiten WP1 en vereist afzonderlijke Work-vrijgave. De GitHub-publicatie van WP0 is afgerond. De private repository `tune-looney/Werkbon-Qvantum` is gepubliceerd en lokale `main` en `origin/main` waren bij afronding synchroon op `efa196b49ee17ba528cc5613181fc7ac16d4819d`.

### Enige volgende veilige stap

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

## WP0 — Governance

- **Doel:** repository, rollen, bronnen, omgevingsbeveiliging en statusbeheer vastleggen.
- **Entrycriteria:** doelpad, Git-identiteit en GitHub-randvoorwaarden gepreflight; scope beperkt tot WP0.
- **Exitcriteria:** lokale structuur en documenten gevalideerd en gecommit; private remote, push en synchronisatie bewezen, of expliciet vastgelegde GitHub-blocker.
- **Vereist bewijs:** Git-status/diff, commit-hash, structuurcontrole en waar mogelijk remote- en visibilitycontrole.
- **Kanaal:** Codex voor lokale inrichting en validatie; Git/GitHub als leidende opslag.
- **Verboden:** systeeminspectie, connectoractie, credentials, implementatiecode en datawijziging.
- **Afhankelijkheden:** eenduidige GitHub-owner, authenticatie en private repository voor volledige externe afsluiting.

## WP1 — Toegang en baseline

- **Doel:** HubSpot-productie, HubSpot-sandbox en n8n uitsluitend read-only en bewijsgebonden inspecteren.
- **Entrycriteria:** expliciete GPT/Chat-vrijgave; juiste account-, portal-, credential- en scope-identiteit; read-only verbindingen aantoonbaar beschikbaar.
- **Exitcriteria:** toegang en relevante baseline per systeem met herleidbaar, geminimaliseerd bewijs vastgelegd; verschillen en blockers benoemd.
- **Vereist bewijs:** account/portal-identiteit, credentialprofiel zonder secrets, scopes, object- of configuratiebaseline en tijdstip.
- **Kanaal:** Codex; PandaDoc valt buiten WP1 en wordt alleen na afzonderlijke vrijgave via Work geïnspecteerd.
- **Verboden:** writes, credentials wijzigen, volledige productiepayloads opslaan en workflows uitvoeren/activeren/publiceren.
- **Afhankelijkheden:** WP0-governance, read-only verbindingen en expliciete vrijgave.

## WP2 — Functioneel contract

- **Doel:** specificatie v1.1, veldmappings, routes en besluiten definitief maken.
- **Entrycriteria:** leidende specificatie beschikbaar; relevante WP1-feiten bekend; GPT/Chat neemt besluiten.
- **Exitcriteria:** versieerbaar contract met gesloten noodzakelijke besluiten, mappings en acceptatiecriteria.
- **Vereist bewijs:** bronspecificatie, besluitenregister en traceerbare mapping.
- **Kanaal:** GPT/Chat voor besluitvorming; Codex voor structurering en validatie.
- **Verboden:** aannames als feiten markeren en implementatie vrijgeven zonder gesloten contract.
- **Afhankelijkheden:** WP1 en D01–D12 voor zover contractbepalend.

## WP3 — Technisch ontwerp

- **Doel:** trigger, documentcreatie, statusverwerking, PDF-route, foutafhandeling en idempotentie ontwerpen.
- **Entrycriteria:** functioneel contract voldoende definitief; systeemmogelijkheden bewezen.
- **Exitcriteria:** reviewbaar ontwerp met datastromen, beveiliging, herstel en teststrategie; expliciete vrijgave voor WP4.
- **Vereist bewijs:** ontwerpbesluiten gekoppeld aan contract en systeemfeiten.
- **Kanaal:** GPT/Chat voor architectuurkeuzes; Codex voor technische uitwerking en validatie.
- **Verboden:** workflow bouwen, publiceren of uitvoeren.
- **Afhankelijkheden:** WP1 en WP2.

## WP4 — Prototype

- **Doel:** één afgebakende workflow bouwen en statisch valideren.
- **Entrycriteria:** goedgekeurd ontwerp, expliciete scope, veilige testomgeving en benodigde credentials gescheiden beschikbaar.
- **Exitcriteria:** prototype statisch gevalideerd, testbewijs vastgelegd en geen ongeautoriseerde side effects.
- **Vereist bewijs:** configuratiediff, validatieresultaten, testgevallen en herstelpad.
- **Kanaal:** Codex; specialistisch kanaal alleen waar aantoonbaar nodig.
- **Verboden:** productiegebruik, brede dataset, activering/publicatie zonder expliciete opdracht.
- **Afhankelijkheden:** WP3 en vrijgave.

## WP5 — Productiepilot

- **Doel:** gecontroleerde mobiele pilot met kleine allowlist uitvoeren.
- **Entrycriteria:** prototype geaccepteerd; eigenaar, deelnemers, apparaten, monitoring en stopcriterium vastgesteld.
- **Exitcriteria:** pilotresultaten, incidenten, gebruikersfeedback en go/no-go-besluit vastgelegd.
- **Vereist bewijs:** allowlist, testscenario's, apparaatresultaten, logs en besluit.
- **Kanaal:** operationeel uitvoeringsteam onder GPT/Chat-vrijgave; Codex voor technische validatie.
- **Verboden:** brede uitrol, ontbrekend stopcriterium en ongecontroleerde productiewijzigingen.
- **Afhankelijkheden:** WP4 en D10–D11.

## WP6 — Operationalisering

- **Doel:** monitoring, herstel, beheer, beveiliging en overdracht regelen.
- **Entrycriteria:** positieve pilotbeslissing en toegewezen operationeel eigenaarschap.
- **Exitcriteria:** beheerproces, monitoring, runbook, hersteltest en overdracht geaccepteerd.
- **Vereist bewijs:** runbook, alerts, herstelbewijs, verantwoordelijkheden en acceptatie.
- **Kanaal:** GPT/Chat voor vrijgave/eigenaarschap; Codex voor technische inrichting na expliciete scope.
- **Verboden:** onbeheerde productieactivatie en overdracht zonder herstel- of monitoringbewijs.
- **Afhankelijkheden:** WP5.
