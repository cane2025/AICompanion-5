# TEST-LOGG – Dashboard V2 (UI_DASHBOARD_V2)

Datum: 2025-09-04
Författare: cane2025

Checklistan nedan motsvarar krav §7. Bocka varje punkt vid verifiering i preview.

- [ ] 1. Dashboard visar endast requiresAction-poster i default
- [ ] 2. Varje rad visar klient-initialer + ev. namn
- [ ] 3. Klick på kort behåller filter i listvy
- [ ] 4. "Visa alla" exponerar completed-poster
- [ ] 5. Tomt tillstånd renderas korrekt
- [ ] 6. Paginering, sortering, action-knappar fungerar
- [ ] 7. Visuell grid matchar mockup (spacing, graf, donut)

Prestanda
- [ ] Paginering 10 rader/kort
- [ ] Skeleton loaders syns vid laddning
- [ ] Δ ≤ 100 ms vid filter-skifte

Release
- [ ] Flagga kan togglas utan ombyggnad
- [ ] Rollback visar Dashboard V1