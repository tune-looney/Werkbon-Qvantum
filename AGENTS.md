# Werkbon Qvantum — uitvoeringsregels

## Rollen en leidende bron

- GPT/Chat bepaalt functionele keuzes, scope, vrijgave en exact één volgende veilige stap.
- Codex inspecteert, haalt bewijs op, implementeert uitsluitend na vrijgave en valideert.
- Work wordt alleen gebruikt wanneer een specifieke connector aantoonbaar meerwaarde heeft; momenteel betreft dit PandaDoc.
- Git is de leidende technische en bestuurlijke bron voor status, besluiten, contracten en bewijs.
- Losse chatconclusies zijn pas een projectbesluit nadat ze in Git zijn vastgelegd.

## HubSpot-omgevingen

| Omgeving | Account | Portal-ID |
| --- | --- | --- |
| Productie | Qvantum Industries | `143794667` |
| Sandbox | Afzonderlijke sandboxomgeving | `147599771` |

Vóór iedere HubSpot-actie controleert Codex aantoonbaar:

1. accountnaam;
2. portal-ID;
3. credentialprofiel;
4. read/write-scope;
5. toegestane actie en omgeving.

Bij afwijking of ambiguïteit stopt Codex onmiddellijk.

- Sandboxbewijs geldt nooit automatisch als productiebewijs.
- Inspecties zijn read-only, tenzij GPT/Chat exact één afgebakende wijziging heeft vrijgegeven.
- Productie- en sandboxcredentials blijven herkenbaar gescheiden.
- Read-only inspectiecredentials blijven gescheiden van toekomstige runtimecredentials.
- Secrets en volledige productiepayloads komen niet in Git, prompts of rapportages.
- Geen workflow uitvoeren, activeren of publiceren zonder expliciete opdracht.
- Bestaande gebruikerswijzigingen altijd behouden.
- Per technische opdracht maximaal de expliciet vrijgegeven scope uitvoeren.

## Statusbeheer

Na iedere afgeronde mijlpaal:

1. bewijs of wijziging valideren;
2. het actuele statusdocument bijwerken;
3. het execution plan alleen bijwerken wanneer fase of toegestane volgende stap verandert;
4. het besluitenregister bijwerken wanneer een besluit opent, wijzigt of sluit;
5. vervangen leidende documenten archiveren;
6. Git-status en diff controleren;
7. alleen expliciet bedoelde bestanden committen;
8. exact één volgende veilige stap vastleggen.
