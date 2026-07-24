# Werkbon Qvantum — execution plan

## Overzicht

| Werkpakket | Doel | Status |
| --- | --- | --- |
| WP0 — Governance | Repository, rollen, bronnen en veiligheidsregels vastleggen | `DONE` |
| WP1 — Toegang en baseline | HubSpot-productie, sandbox, PandaDoc en n8n bewijsgebonden inspecteren | `BLOCKED / PARTIAL` |
| WP2 — Functioneel contract | Specificatie v1.1, mappings en besluiten definitief maken | `IN PROGRESS` |
| WP3 — Technisch ontwerp | Trigger, documentcreatie, statusverwerking, PDF-route en idempotentie ontwerpen | `NOT STARTED` |
| WP4 — Prototype | Afgebakende workflow bouwen en statisch valideren | `NOT STARTED` |
| WP5 — Productiepilot | Kleine allowlist en gecontroleerde mobiele pilot uitvoeren | `NOT STARTED` |
| WP6 — Operationalisering | Monitoring, herstel, beheer en overdracht regelen | `NOT STARTED` |

De enige toegestane inhoudelijke vervolgstap is WP1. WP1 blijft geblokkeerd totdat de benodigde read-only verbindingen aantoonbaar beschikbaar zijn. De GitHub-publicatie van WP0 blijft daarnaast een governanceblocker.

## WP0 — Governance

- **Doel:** repository, rollen, bronnen, omgevingsbeveiliging en statusbeheer vastleggen.
- **Entrycriteria:** doelpad, Git-identiteit en GitHub-randvoorwaarden gepreflight; scope beperkt tot WP0.
- **Exitcriteria:** lokale structuur en documenten gevalideerd en gecommit; private remote, push en synchronisatie bewezen, of expliciet vastgelegde GitHub-blocker.
- **Vereist bewijs:** Git-status/diff, commit-hash, structuurcontrole en waar mogelijk remote- en visibilitycontrole.
- **Kanaal:** Codex voor lokale inrichting en validatie; Git/GitHub als leidende opslag.
- **Verboden:** systeeminspectie, connectoractie, credentials, implementatiecode en datawijziging.
- **Afhankelijkheden:** eenduidige GitHub-owner, authenticatie en private repository voor volledige externe afsluiting.

## WP1 — Toegang en baseline

- **Doel:** productie, sandbox, PandaDoc en n8n uitsluitend read-only en bewijsgebonden inspecteren.
- **Entrycriteria:** expliciete GPT/Chat-vrijgave; juiste account-, portal-, credential- en scope-identiteit; read-only verbindingen aantoonbaar beschikbaar.
- **Exitcriteria:** toegang en relevante baseline per systeem met herleidbaar, geminimaliseerd bewijs vastgelegd; verschillen en blockers benoemd.
- **Vereist bewijs:** account/portal-identiteit, credentialprofiel zonder secrets, scopes, object- of configuratiebaseline en tijdstip.
- **Kanaal:** Codex; Work alleen voor een afgebakende PandaDoc-connectoractie met aantoonbare meerwaarde.
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
