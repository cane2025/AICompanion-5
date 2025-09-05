Vårdadministration – Dashboard V2
=================================

Feature flag: UI_DASHBOARD_V2

Aktivering
----------
- Via URL: lägg till `?v2=1` i adressen. Exempel: `http://localhost:3001/?v2=1`
- Via localStorage i webbkonsolen: `localStorage.setItem('UI_DASHBOARD_V2','1')`
- Avaktivera: `?v2=0` eller `localStorage.setItem('UI_DASHBOARD_V2','0')`

Innehåll
--------
- Tvåkols-grid med kort: Vårdplaner, GFP – kräver åtgärd, Veckodokumentation, Personalstatistik, Visma tid.
- Standardvy visar endast poster som kräver åtgärd; "Visa alla" finns i toppfiltret.
- Skeletons, paginering (10 rader), drill-down-knappar är förberedda.

Bygg och kör
------------
```bash
pnpm build && pnpm preview
```

Rollback
--------
- Stäng av flaggan enligt ovan. V1 (`<Dashboard />` standard) renderas när flaggan är av.

