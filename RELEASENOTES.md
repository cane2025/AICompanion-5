Vårdadministration – Dashboard V2

Aktivering
- Sätt feature-flag i webbläsaren: `localStorage.setItem('UI_DASHBOARD_V2','true')` och ladda om.
- Alternativt kan `window.UI_DASHBOARD_V2 = true` sättas före appen initialiseras.

Bygg & preview
- pnpm build && pnpm preview (eller enligt CI).

Rollback
- Ta bort flaggan: `localStorage.removeItem('UI_DASHBOARD_V2')` – appen renderar Dashboard V1 (`client/src/pages/dashboard.tsx`).

Test
- Se TEST-LOGG.md för checklista och verifieringssteg.

