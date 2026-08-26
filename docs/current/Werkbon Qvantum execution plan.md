# Werkbon Qvantum execution plan

## Closure-addendum production MVP en pilot guard update — 2026-08-26

De production-MVP is aantoonbaar afgerond. Dit addendum is leidend boven de historische roadmap hieronder.

### Productionbewijs

- Portal `143794667`, pipeline `0`; controlled Ticket `415307052257` (`OSH BEA400`).
- Productionproject `qvantum-werkbon`: build `#1`, deployment `#2`; application, App Card en serverless function `SUCCESS`.
- App Card zichtbaar en werkend op het Ticketrecord.
- Exact één Documenso-envelope met portalgebonden externalId; signingvolgorde Monteur → Klant; eindstatus `COMPLETED`.
- Signed PDF en exact één Note met attachment zijn op hetzelfde Ticket visueel bevestigd.
- Test-Note en attachment zijn daarna bewust handmatig verwijderd. De twee mappingproperties blijven behouden als audit/idempotency state.

Operationele les: het verwijderen van de HubSpot Note verwijdert ook de gekoppelde werkbonattachment uit de Ticketweergave.

### Pilot-runbook

1. Selecteer vooraf een echt production Ticket en controleer portal, pipeline, subject en lege mappingstatus.
2. Open de App Card vanuit dat Ticket; start geen tweede run en gebruik geen automatische retry.
3. Kies alleen Richard van den Bergh of Marco Liefhebber; laat de klant op hetzelfde apparaat tekenen.
4. Controleer `COMPLETED`, signed PDF, Note/attachment en beide mappingproperties.
5. Plan dagelijks of periodiek een korte evaluatie; gebruik geen bulkautomatisering.

Pilotstopcriteria: verkeerde context, duplicate envelope, vastlopende signing, ontbrekende PDF/Note, File/auth/scopefout, App Card onbruikbaar, onverwachte CRM-write of afwijkende recovery/idempotency. Escaleer direct en verwijder niets.

### Actuele roadmap

| Onderdeel | Status |
| --- | --- |
| Production MVP | `DONE` |
| Production deployment/cutoverbewijs | `DONE` |
| Production pilot readiness | `BLOCKED` — tijdelijke cutover-guards beperken tot Ticket `415307052257` / `OSH BEA400` |
| Pilot Guard Configuration | `NEXT` |
| Controlled Test Artifact Cleanup | `WAITING` |
| Serviceorderonderzoek | `WAITING` |

## Actuele production-prepaddendum — 2026-08-26

De golden sandboxbaseline is production-ready gemaakt zonder deployment. Deze addendum is leidend waar de historische roadmapsecties 18 en 19 een oudere projectfase beschrijven.

Afgerond en lokaal bewezen:

- expliciete sandbox- en productionprofielen;
- productionguards op portal `143794667`, pipeline `0`, Ticket `415307052257` en exact subject `OSH BEA400`;
- portalgebonden production externalId `hubspot:143794667:ticket:<ticketId>`;
- behoud van sandbox externalId `hubspot-ticket:<ticketId>`;
- production/sandbox contextisolatie;
- idempotente mapping/recovery en read-only resume-on-load;
- reproduceerbare self-contained runtimebundle;
- volledige lokale validation PASS.

De enige volgende veilige stap is:

```text
Controlled Production Deployment + Single-Ticket Cutover
```

Die stap vereist een afzonderlijke expliciete vrijgave. Tot die vrijgave blijven app upload/deployment, secrets instellen, Ticket/File/Note-runtimewrites, Documenso create/distribute en cutover verboden. De eerste echte File-upload is binnen de controlled cutover een stopgate; een auth/scopefout stopt direct.

## 1. Doel en status van dit plan

Dit document is het zelfstandige, leidende execution plan voor de Qvantum digitale werkbon. Het vervangt de inhoud van het eerder aangeleverde execution plan volledig. Dat oudere plan blijft uitsluitend een historische contrastbron en bewijst geen actuele roadmapstatus.

Actuele status:

```text
Documentconsolidatie:
DONE

Besluitconsolidatieverdict:
PASS WITH OPEN TECHNICAL VALIDATIONS

Leidende functionele specificatie:
Qvantum digitale werkbon — PandaDoc MVP-specificatie v1.2

Functionele besluiten D01–D06:
DEFINITIEF

Technische sandboxvalidatie:
NOT STARTED

Technische implementatie:
NOT STARTED
```

`PASS WITH OPEN TECHNICAL VALIDATIONS` is geen functionele blocker. Het functionele MVP-ontwerp en D01–D06 zijn afgerond. Alleen technische validaties, technische detailkeuzes en eventueel later expliciet toegestane pilots staan nog open.

Dit plan autoriseert geen HubSpot-, PandaDoc-, n8n-, credential-, sandbox-, productie- of repositorywijziging.

## 2. Leidende bronnen en bronhiërarchie

De bronnen worden in deze volgorde toegepast:

1. `Qvantum digitale werkbon — PandaDoc MVP-specificatie v1.2`;
2. `Qvantum besluitconsolidatie eindrapport v1.2`;
3. de daarin vastgelegde definitieve besluiten D01–D06;
4. het oude `Werkbon Qvantum execution plan`, uitsluitend als historische contrastbron.

De MVP-specificatie v1.2 vervangt v1.1 volledig. Bij strijdigheid met v1.2 of het besluitconsolidatierapport wordt het oude execution plan genegeerd. Er wordt geen ontbrekende historische planstatus gereconstrueerd.

De aangeleverde bronnen zijn vooraf inhoudelijk vergeleken op D01–D06, formuliertelling, terugschrijfgrens, bronidentiteit, sandboxscope, technische open validaties, roadmapstatus en toekomstige serviceorderarchitectuur. De twee leidende v1.2-bronnen zijn daarop onderling consistent.

## 3. Actuele projectbaseline

De documentconsolidatie is `DONE`. De MVP-specificatie v1.2 en het besluitconsolidatierapport v1.2 zijn inhoudelijk afgerond. D01–D06 zijn definitief. Het correcte execution plan is met dit document inhoudelijk gereed.

De nieuwe, specifiek op v1.2 gerichte technische sandboxvalidatie is nog niet uitgevoerd. Technische implementatie is niet gestart. Er is geen actuele technische uitvoeringsstatus uit het oude plan overgenomen.

Een eerder read-only sandboxinspectierapport v1.1 bestaat als feitelijke historische bewijsbron. Dat rapport bewijst niet dat het hier gedefinieerde v1.2-sandboxvalidatiewerkpakket is uitgevoerd of afgerond.

De administratieve repositorypublicatie van de drie v1.2-documenten is nog niet gestart. Deze publicatie is een noodzakelijke voorwaarde voor inhoudelijke voortzetting, maar geen concurrerend inhoudelijk work package.

## 4. Definitieve functionele besluiten D01–D06

### D01 — Werkbonstart vanuit ticketcontext

De monteur moet de werkbon in de MVP kunnen starten vanuit de context van een specifiek HubSpot-serviceticket. De exacte technische startvorm is nog niet bewezen en wordt in de sandbox gevalideerd.

De gebruiker hoeft niet eerst buiten de ticketcontext zelfstandig het juiste dossier op te zoeken. PandaDoc is de document-, invul- en ondertekenlaag en niet het primaire processtartpunt.

### D02 — Expliciete ticketgebonden selectie

HubSpot bepaalt niet zelfstandig welk bedrijf, contact of adres wordt gebruikt. De gebruiker kiest vóór documentcreatie expliciet uit uitsluitend:

- gegevens op het geopende ticket;
- directe associaties van dat ticket;
- gegevens die aantoonbaar aan die associaties zijn gekoppeld en binnen de ticketcontext beschikbaar zijn.

Een vrije of globale selectie uit alle HubSpot-records is niet toegestaan. Na de expliciete keuze mogen de geselecteerde waarden automatisch zichtbaar naar PandaDoc worden overgedragen. Dezelfde waarden hoeven niet handmatig opnieuw in PandaDoc te worden ingevoerd.

### D03 — Monteurskeuze

De monteurskeuze is in de MVP beperkt tot exact:

```text
Marco Liefhebber
Richard van den Bergh
```

Andere monteurs, een vrije naam en dynamische monteursynchronisatie vallen buiten de MVP. De technische plaats van deze vaste keuze en de PDF-weergave moeten nog worden gevalideerd.

### D04 — Serviceorderroute als toekomstarchitectuur

Een route via HubSpot Service Orders of `NL Service Orders` is toekomstarchitectuur en valt buiten de huidige MVP. De huidige MVP gebruikt het HubSpot-serviceticket als operationele broncontext.

Een serviceorderroute is geen actuele MVP-oplossing, verplichte tussenlaag of reeds gekozen implementatie. Technische validatie van die toekomstige route blokkeert de huidige MVP niet.

### D05 — Toekomstvast bronidentiteitscontract

De logische bronidentiteit bestaat uit:

```text
portal_id
source_object_type
source_record_id
correlation_id
mvp_version
```

Dit contract voorkomt hardcoding van de integratieketen op tickets en maakt een latere overgang naar een ander `source_object_type` mogelijk zonder herontwerp van de PandaDoc- en integratieketen.

Voor de aangewezen sandboxcontext geldt:

```text
portal_id = 147599771
source_object_type = ticket
source_record_id = 425555669195
mvp_version = 1.2
correlation_id = 147599771|ticket|425555669195|mvp:1.2
```

De exacte technische opslag en overdracht worden nog gevalideerd. `ticket_id` mag binnen de ticketimplementatie praktisch worden gebruikt, maar vervangt `source_record_id` niet. Het broncontract wordt niet versmald tot `portal_id + ticket_id + mvp_version`.

### D06 — `NL Service Orders` als onderzoekskandidaat

`NL Service Orders` is uitsluitend een onderzoekskandidaat voor een mogelijke toekomstige architectuur. Het object of de pipeline is geen bewezen oplossing voor de huidige MVP en is geen geselecteerde route, verplicht onderdeel, geïmplementeerde voorziening of voorwaarde voor de actuele sandboxvalidatie.

Een latere vergelijking met bijvoorbeeld een custom object Serviceorder vereist een afzonderlijke opdracht en afzonderlijk bewijs.

## 5. Vast MVP-scopecontract

De compacte PandaDoc-werkbon bevat exact:

```text
27 zichtbare veldelementen
4 verborgen integratiemetadata-elementen
```

Deze telling is een vast MVP-scopecontract en geen onderdeel van D04. De zichtbare inhoud blijft verdeeld over acht blokken: Bezoek; Werknemer en installatie; Reden bezoek; Werkzaamheden; Gewerkte uren; Materiaal; Handtekening werknemer; Handtekening klant.

Veld 5, `Naam werknemer`, is een vaste keuze met uitsluitend Marco Liefhebber en Richard van den Bergh. Materiaal blijft één vrij meerregelig tekstveld.

De vier verborgen PandaDoc-elementen zijn:

1. bronrecordidentiteit: in de MVP `source_object_type=ticket` en `source_record_id=<ticket-ID>`;
2. PandaDoc document-ID;
3. templateversie: `mvp_version=1.2`;
4. integratie-/correlatiestatus: `correlation_id` plus een compacte status of verwijzing daarnaar.

`portal_id` is verplicht in het logische broncontract, maar blijft een interne omgevings- en integratieguard. Het wordt niet als vijfde verborgen PandaDoc-element toegevoegd.

Het logische broncontract, de technische verdeling ervan over systemen en de vier verborgen PandaDoc-elementen zijn drie verschillende niveaus. Het volledige logische broncontract hoeft niet als vijf afzonderlijke verborgen PandaDoc-velden te worden uitgevoerd.

## 6. Architectuur- en integratiecontract

De vaste verantwoordelijkheidsverdeling is:

```text
HubSpot:
dossier- en procescontext

PandaDoc:
document-, invul- en ondertekenlaag

n8n of gelijkwaardige integratielaag:
orchestratie waar technisch nodig
```

De actuele MVP-route is:

```text
HubSpot-ticket
→ ticketgebonden werkbonstart
→ expliciete ticketgebonden selectie
→ overdracht van geselecteerde waarden
→ één gekoppeld PandaDoc-document
→ invullen en ondertekenen
→ definitieve PDF
→ koppeling aan hetzelfde HubSpot-ticket
```

HubSpot ontvangt uitsluitend minimale proces- en integratiemetadata voor status, documentidentificatie, correlatie, idempotentie, foutafhandeling, voltooiing en PDF-koppeling. De 27 inhoudelijke werkbonvelden worden niet volledig naar HubSpot gedupliceerd.

De minimale HubSpot-propertyset is nog niet bewezen. V1.2 noemt vier vereiste en vier aanbevolen properties als voorstel, maar de definitieve internal names, typen, enumopties en opslagplaatsen worden pas na technische validatie vastgesteld. Eerdere `qv_*`- en voorgestelde `qvantum_*`-properties mogen niet als ingericht worden gepresenteerd.

Een HubSpot-, PandaDoc- of n8n-write vereist altijd een afzonderlijke inspect-first opdracht met expliciete schrijfscope.

## 7. Bronidentiteits- en correlatiecontract

De deterministische functionele opbouw is:

```text
correlation_id =
normalize(portal_id)
+ "|"
+ normalize(source_object_type)
+ "|"
+ normalize(source_record_id)
+ "|mvp:"
+ normalize(mvp_version)
```

De vaste sandboxwaarde is:

```text
147599771|ticket|425555669195|mvp:1.2
```

Voor retries op dezelfde bron, portal en MVP-versie blijft de `correlation_id` gelijk. Een interne `attempt_id` of teller mag afzonderlijke pogingen onderscheiden.

Vóór documentcreatie worden duurzame integratieopslag en het bronrecord gecontroleerd op een bestaand actief of voltooid document. Een bestaand actief document wordt hervat of geopend. Bij een voltooid document stopt nieuwe creatie met een conflictmelding en verwijzing naar het bestaande resultaat. Bij een onbekende of ambigue creatie-uitkomst wordt eerst met PandaDoc gereconcilieerd; blind opnieuw creëren is verboden.

Na succesvolle creatie blijft het document-ID onveranderlijk gekoppeld aan de integratiecontext. Een callback zonder betrouwbare bronidentiteit en document-ID wordt niet aan een willekeurig record gekoppeld. PDF-koppeling gebruikt minimaal `portal_id + source_object_type + source_record_id + document_id`.

De sandboxvalidatie moet per logisch element bewijzen:

- waar het ontstaat;
- waar het technisch beschikbaar is;
- waar en hoe het duurzaam wordt opgeslagen;
- welke beperkte metadata naar PandaDoc gaat;
- hoe callbacks naar het juiste bronrecord terugleiden;
- hoe de definitieve PDF aan het juiste bronrecord wordt gekoppeld;
- hoe sandbox en productie worden onderscheiden;
- hoe een latere overgang naar een ander `source_object_type` mogelijk blijft;
- hoe dubbele documentcreatie wordt voorkomen;
- hoe geannuleerde, mislukte, actieve en voltooide documenten worden onderscheiden.

## 8. MVP-scope

Binnen de MVP vallen:

- starten vanuit een specifiek HubSpot-serviceticket;
- expliciete keuze van ticketgebonden bedrijf, contact en bezoekadres vóór documentcreatie;
- automatische overdracht van de gekozen waarden naar PandaDoc;
- één compacte werkbon volgens de vaste acht blokken en formuliertelling;
- vaste monteurskeuze uit exact twee namen;
- invullen en ondertekenen in PandaDoc;
- status-, correlatie-, idempotentie- en foutherstelgedrag;
- ophalen van de definitieve PDF en koppeling aan hetzelfde ticket;
- uitsluitend minimale proces- en integratiemetadata in HubSpot;
- technische validatie in de vaste sandboxscope vóór enige implementatie.

Een klant tekent standaard direct op hetzelfde apparaat. Een later-tekenen-route mag alleen hetzelfde document gebruiken en vereist een expliciet geselecteerd geldig ticketgebonden contact met e-mailadres. Rollen, signing order en mobiele bruikbaarheid moeten technisch worden gevalideerd.

## 9. Buiten scope en toekomstarchitectuur

Buiten de huidige MVP vallen:

- Service Orders als operationele bronroute;
- `NL Service Orders` als gekozen oplossing;
- productie-implementatie;
- serviceorders aanmaken of ERP-serviceorders migreren;
- meerdere serviceorders per ticket implementeren;
- planning in HubSpot;
- dynamische monteursynchronisatie en generieke ondersteuning voor extra monteurs;
- volledige inhoudelijke duplicatie van de werkbon in HubSpot;
- uitbreiding of wijziging van de vaste formuliertelling;
- het definitieve serviceorderobject kiezen.

Toekomstige onderzoekskandidaat:

```text
NL Service Orders en een mogelijke serviceordergebaseerde bronarchitectuur
```

Een mogelijke toekomstige route is `Serviceticket → Serviceorder → PandaDoc-werkbon → PDF/status naar Serviceorder → zichtbaar vanuit Serviceticket`. Onderzoek daarnaar vindt pas na de huidige MVP plaats, via een afzonderlijke opdracht en op basis van afzonderlijk bewijs.

## 10. Werkpakketten en uitvoeringsvolgorde

### Administratieve repositorypublicatie

Status bij oplevering van dit plan:

```text
NOT STARTED
```

Doel:

- MVP-specificatie v1.2 publiceren;
- dit correcte execution plan publiceren;
- besluitconsolidatierapport v1.2 publiceren;
- actuele projectstatus en verwijzingen consistent maken;
- v1.1 ondubbelzinnig als vervangen presenteren.

Dit is een administratieve Codex-stap en geen inhoudelijk technisch work package. De publicatie moet zijn afgerond voordat het actuele inhoudelijke work package wordt uitgevoerd.

### WP — Sandboxvalidatie ticketgebonden werkbonstart en bronidentiteit

Inhoudelijke roadmapstatus:

```text
NEXT
```

Uitvoeringsvoorwaarde:

```text
WAITING FOR REPOSITORY PUBLICATION
```

Dit is het enige inhoudelijke work package met status `NEXT`. Het is volledig read-only.

Doel:

- ticketgebonden startmechanismen valideren;
- ticketgebonden bedrijven, contacten en adresbronnen inventariseren;
- expliciete selectie vóór documentcreatie valideren;
- overdracht van geselecteerde waarden naar PandaDoc beoordelen;
- de vaste monteurskeuze technisch positioneren;
- het volledige broncontract valideren;
- deterministische correlatie en idempotentie valideren;
- minimale HubSpot-properties vaststellen;
- integratiegrenzen tussen HubSpot, PandaDoc en n8n bepalen;
- vaststellen welke onderdelen een gecontroleerde sandboxpilot vereisen.

### Voorwaardelijke latere werkpakketten

- `WAITING` — technisch ontwerp ticketgebonden startinterface;
- `WAITING` — gecontroleerde sandboxpilot documentcreatie;
- `WAITING` — MVP-implementatie;
- `WAITING` — end-to-end pilotvalidatie;
- `WAITING` — productievoorbereiding;
- `WAITING` — gecontroleerde productiepilot;
- `WAITING` — onderzoek toekomstige serviceorderarchitectuur.

De precieze inhoud en volgorde van deze latere werkpakketten worden pas na de read-only sandboxvalidatie vastgesteld. Geen ervan is gestart.

## 11. Actueel NEXT-work package

Naam:

```text
WP — Sandboxvalidatie ticketgebonden werkbonstart en bronidentiteit
```

Vaste scope:

```text
Accounttype: SANDBOX
Portal-ID: 147599771
Object: Tickets
Pipeline: Support Pipeline
Testrecord: 425555669195
```

Vast broncontract voor deze scope:

```text
portal_id: 147599771
source_object_type: ticket
source_record_id: 425555669195
mvp_version: 1.2
correlation_id: 147599771|ticket|425555669195|mvp:1.2
```

De productieportal `143794667` valt volledig buiten dit read-only work package. `NL Service Orders` valt eveneens buiten de actuele validatiescope en wordt alleen als toekomstige onderzoekskandidaat genoemd.

De validatie controleert accounttype, portal-ID, object, pipeline en testrecord afzonderlijk voordat inhoudelijke inspectie begint. Een afwijkende guard is een stopconditie.

Een eventuele schrijvende sandboxpilot is geen onderdeel van dit work package. Die vereist later een afzonderlijk work package met expliciete schrijfscope.

## 12. Entrycriteria en exitcriteria per werkpakket

### Administratieve repositorypublicatie

Entrycriteria:

- de drie definitieve v1.2-documenten zijn lokaal beschikbaar;
- bestandsnamen en doelpaden zijn eenduidig;
- de repository en branch zijn vooraf read-only gecontroleerd;
- bestaande gebruikerswijzigingen kunnen worden behouden;
- de opdracht beperkt zich tot documentatiepublicatie.

Exitcriteria:

- de MVP-specificatie v1.2, dit execution plan en het besluitconsolidatierapport v1.2 zijn gepubliceerd;
- v1.1 is ondubbelzinnig als vervangen gepresenteerd;
- onderlinge verwijzingen en roadmapstatus zijn consistent;
- commit en push zijn succesvol bewezen;
- de repositorywerkboom is na publicatie schoon;
- geen technische systeemwrite is uitgevoerd.

### WP — Sandboxvalidatie ticketgebonden werkbonstart en bronidentiteit

Entrycriteria:

- MVP-specificatie v1.2 is leidend;
- D01–D06 zijn definitief;
- het correcte execution plan is gepubliceerd;
- het besluitconsolidatierapport v1.2 is gepubliceerd;
- de sandboxscope en het testticket zijn vastgelegd;
- geen technische implementatie is gestart;
- de read-only sandboxvalidatieprompt is beschikbaar;
- de repositorywerkboom is schoon;
- vereiste read-only toegang is beschikbaar.

Exitcriteria:

1. alle sandboxguards zijn afzonderlijk gerapporteerd;
2. het aangewezen testticket is feitelijk geïnspecteerd;
3. ticketgebonden bedrijven, contacten en adresbronnen zijn geïnventariseerd;
4. bruikbare ticketgebonden startmechanismen zijn beoordeeld;
5. expliciete selectie vóór documentcreatie is technisch gevalideerd;
6. overdracht van geselecteerde waarden naar PandaDoc is beoordeeld;
7. de vaste monteurskeuze is technisch beoordeeld;
8. het volledige broncontract is gevalideerd;
9. de deterministische correlatie is gevalideerd;
10. idempotentie en herstartscenario’s zijn beoordeeld;
11. de minimaal benodigde HubSpot-properties zijn vastgesteld;
12. de verdeling van logische bronmetadata over HubSpot, PandaDoc en integratielaag is beoordeeld;
13. open pilottests, toegangsproblemen en blockers zijn benoemd;
14. geen verboden wijziging is uitgevoerd;
15. exact één volgende veilige stap is aangewezen.

### Latere werkpakketten

De entry- en exitcriteria voor latere werkpakketten worden pas bewijsgebonden vastgesteld na afsluiting van de sandboxvalidatie. Tot dat moment blijven zij `WAITING` en autoriseren zij geen uitvoering.

## 13. Verplicht bewijs per werkpakket

### Repositorypublicatie

Vereist zijn:

- repository- en branchidentiteit;
- status van HEAD en remote baseline;
- werkboomstatus vóór en na;
- exacte bestandsdiff;
- bewijs dat uitsluitend de drie bedoelde v1.2-documenten en noodzakelijke verwijzingen zijn geraakt;
- commit-hash en push-/synchronisatiebewijs;
- bewijs dat v1.1 niet meer als leidend wordt gepresenteerd.

### Sandboxvalidatie

Vereist zijn:

- afzonderlijk resultaat voor iedere sandboxguard;
- feitelijke ticket-, associatie-, property- en toegangsbevindingen;
- bewijsclassificatie per bevinding, zonder aannames als feiten;
- vergelijking van startvarianten, selectielocaties en adresbronnen;
- technische beoordeling van overdracht, vaste monteurskeuze en mobiele bruikbaarheid;
- bewijs voor `portal_id`, `source_object_type`, `source_record_id`, `correlation_id` en `mvp_version`;
- mapping van ieder logisch bronelement naar ontstaan, beschikbaarheid, opslag en overdracht;
- beoordeling van callbacks, statussen, retries, duplicatepreventie en herstartgedrag;
- beoordeling van de volledige PDF-download-, Files-, Note- en ticketkoppelroute;
- onderscheid tussen technisch bewezen, afwezig, niet toegankelijk, pilot vereist, besluit nodig en blocker;
- expliciete registratie dat geen write is uitgevoerd;
- exact één volgende veilige stap.

Historische bevindingen uit v1.1 mogen als aanwijzing worden gebruikt, maar moeten waar nodig opnieuw binnen de vaste v1.2-scope worden geverifieerd.

## 14. Toegestane uitvoerkanalen

```text
Chat:
architectuurkeuzes, functionele besluitvorming en beoordeling

Work:
documentconsolidatie, read-only inspecties en zelfstandige rapporten

Codex:
repositorywijzigingen, gecontroleerde technische patches, commits en pushes
```

Repositorypublicatie wordt als afzonderlijke Codex-documentatieopdracht uitgevoerd. Read-only sandboxvalidatie wordt via Work uitgevoerd. Een technische write wordt uitsluitend via een afzonderlijke inspect-first opdracht met expliciete schrijfscope uitgevoerd.

## 15. Verboden acties en governanceguards

Vóór afsluiting van de read-only sandboxvalidatie zijn verboden:

- productieconfiguratie wijzigen of de productieportal voor validatie gebruiken;
- HubSpot-properties aanmaken of wijzigen;
- PandaDoc-templates definitief bouwen of wijzigen;
- PandaDoc-documenten aanmaken, verzenden of opnieuw creëren;
- n8n-workflows bouwen, wijzigen, activeren, publiceren of uitvoeren;
- credentials toevoegen, vervangen, opnieuw autoriseren of herrouteren;
- PDF’s aan tickets koppelen;
- technische implementatie als gestart markeren;
- extra functionele velden of besluiten D07 en hoger toevoegen;
- D01–D06 heropenen of hernummeren;
- andere monteurs toevoegen;
- de telling van 27 zichtbare en vier verborgen elementen wijzigen;
- `NL Service Orders` als gekozen MVP-route implementeren;
- Service Orders als actuele broncontext gebruiken;
- het broncontract versmallen tot alleen portal-ID, ticket-ID en MVP-versie;
- `source_record_id` stilzwijgend door `ticket_id` vervangen;
- vijf extra verborgen PandaDoc-velden toevoegen;
- ontbrekende technische feiten met aannames invullen;
- een schrijvende sandboxpilot uitvoeren zonder afzonderlijke expliciete autorisatie.

Voor iedere toekomstige write gelden minimaal: inspect-first, exacte omgevings- en recordguards, minimale mutatiescope, vooraf vastgelegd herstelpad, bewijs vóór en na, en een afzonderlijk uitvoeringsbesluit.

## 16. Technische open validaties

Onderstaande punten zijn technisch en niet functioneel open:

- exacte ticketgebonden startinterface;
- locatie en vorm van het selectiescherm;
- wijze waarop ticketassociaties en gekoppelde adresbronnen worden opgehaald;
- wijze waarop geselecteerde waarden naar PandaDoc worden overgedragen;
- technische plaats en PDF-weergave van de vaste monteurskeuze;
- HubSpot-licentie, rechten en mobiele bruikbaarheid;
- minimale HubSpot-propertyset, internal names, typen en enumopties;
- verdeling van het logische broncontract over HubSpot, PandaDoc en integratielaag;
- opbouw, duurzame opslag en hergebruik van `correlation_id`;
- idempotentie-, retry-, reconcile- en herstartgedrag;
- PandaDoc-templatevelden, rollen, signing order, API, webhooks en eventmapping;
- callback- en documentstatusafhandeling;
- PDF-download-, upload-, Note- en ticketkoppelproces;
- rol van n8n of een gelijkwaardige integratielaag als orchestrator;
- exacte invoervorm voor `Reis` en `Totaal`;
- toegangsvereisten;
- onderdelen die een gecontroleerde sandboxpilot vereisen;
- afzonderlijke productiebevestiging vóór productie-implementatie.

Deze validaties blokkeren het functionele MVP-ontwerp niet. Zij blokkeren wel iedere technische inrichting of productiehandeling waarvoor het betreffende bewijs nog ontbreekt.

## 17. Statusovergangen

In dit plan worden uitsluitend de volgende roadmapstatussen gebruikt:

```text
DONE
NEXT
WAITING
NOT STARTED
BLOCKED
```

Statusregels:

- `DONE`: de beschreven resultaten en het verplichte bewijs zijn compleet;
- `NEXT`: het enige inhoudelijke work package dat na vervulling van zijn uitvoeringsvoorwaarde mag worden gestart;
- `WAITING`: afhankelijk van bewijs of afsluiting van een eerder work package;
- `NOT STARTED`: niet begonnen en niet impliciet geautoriseerd;
- `BLOCKED`: feitelijk bewijs verhindert een veilige vervolgstap.

Een work package gaat alleen naar `DONE` wanneer alle exitcriteria en bewijsvereisten zijn vervuld. Een toekomstige stap gaat pas van `WAITING` naar de actuele uitvoeringsstatus na een afzonderlijke, bewijsgebonden planbeslissing. Een blocker heropent D01–D06 niet automatisch.

De administratieve repositorypublicatie is een noodzakelijke actie met status `NOT STARTED`, maar geen tweede inhoudelijke roadmapkandidaat.

## 18. Actuele roadmapstatus

| Onderdeel | Status | Toelichting |
| --- | --- | --- |
| Documentconsolidatie | `DONE` | MVP-specificatie v1.2 en besluitconsolidatierapport zijn afgerond |
| D01–D06 | `DONE` | Definitief vastgelegd volgens v1.2 |
| Correct execution plan | `DONE` | Dit nieuwe, zelfstandige bestand |
| Repositorypublicatie v1.2 | `NOT STARTED` | Eerstvolgende administratieve Codex-stap |
| Sandboxvalidatie | `NEXT` | Read-only uitvoering na succesvolle repositorypublicatie |
| Technische implementatie | `NOT STARTED` | Geen technische writes uitgevoerd |
| Gecontroleerde sandboxpilot | `WAITING` | Afhankelijk van read-only validatie en expliciete schrijfvrijgave |
| Productiepilot | `WAITING` | Afhankelijk van sandbox-, implementatie- en productiepreflightbewijs |
| Serviceorderonderzoek | `WAITING` | Toekomstarchitectuur buiten de huidige MVP |

Het oude `WP1 — Toegang en baseline` heeft geen actuele leidende status en is niet de actuele inhoudelijke vervolgstap.

## 19. Exact volgende toegestane stap

```text
Publiceer via de afzonderlijke Codex repository-documentatieopdracht de MVP-specificatie v1.2, dit correcte execution plan en het besluitconsolidatie-eindrapport v1.2. Start pas na een succesvolle commit en push het read-only work package ‘WP — Sandboxvalidatie ticketgebonden werkbonstart en bronidentiteit’.
```
