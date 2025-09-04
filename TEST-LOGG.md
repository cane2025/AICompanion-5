QA TEST-LOGG

Back-end
- Skapat V2-endpoints i dev-API:
  - GET /api/clients/:clientId/care-plans
  - POST /api/clients/:clientId/care-plans (auto-GFP)
  - PATCH /api/care-plans/:carePlanId
  - GET /api/clients/:clientId/implementation-plans
  - POST /api/clients/:clientId/implementation-plans
  - PATCH /api/implementation-plans/:implId
  - GET /api/clients/:clientId/weekly-docs?year=
  - GET /api/clients/:clientId/weekly-docs/:year/:week
  - PUT /api/clients/:clientId/weekly-docs/:year/:week
  - GET /api/stats/staff?from=&to=
  - GET /api/stats/client/:clientId?from=&to=

Verifierat manuellt:
- Skapa klient A och tre vårdplaner via POST /v2-care-plan → GFP index 1..3 auto-skapat.
- PUT weekly-docs för v36 med 2 dagar dokumenterade, en försenad → veckans delayed=true och qualityApproved=false när en dag ej godkänd.

Front-end
- Flik Vårdplan visar versionerad lista per klient och snackbar vid autoskapad GFP.
- Flik GFP listar versioner, 5 uppföljningsrutor, minimal redigering.
- Flik Dokumentation visar dagvy (Mån–Sön), filter (försenade, ej godkända), export CSV.

Tillgänglighet/UX
- Knappar och inputs med aria-labels.
- Statuschips enligt färg: Väntar (grå), Aktiv (blå), Slutförd (grön); Dokumenterad/Godkänd/Försenad/Saknas.

Security
- Ingen personnummerhantering i V2-flöden; endast clientId/staffId (UUID/dev-token).

Prestanda
- Veckovyn laddar endast valt år (default aktuellt år).
- Listor renderas effektivt med enkla queries.

Enhetstester (att lägga till separat testrigg):
- createCarePlan ⇒ autoCreateGFP (carePlanIndex-koppling) OK manuellt, pending unit test.
- weeklyDocs upsert aggregations OK manuellt, pending unit test.
- stats aggregation för staff edge: inga data ⇒ tom array.

