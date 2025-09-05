# TEST-LOGG – Dashboard V2

Datum: 2025-09-04
Feature-flag: UI_DASHBOARD_V2

QA-checklista
--------------
- [ ] Dashboard visar endast `requiresAction`-poster i default
- [ ] Varje rad visar klient-initialer + ev. namn
- [ ] Klick på kort behåller filter i listvy (drill-down förberedd)
- [ ] "Visa alla" exponerar completed-poster
- [ ] Tomt tillstånd renderas korrekt
- [ ] Paginering, sortering, action-knappar fungerar
- [ ] Visuell grid matchar mockup (spacing, graf, donut)

Körnoteringar
-------------
- Starta med `?v2=1` för att aktivera V2.
- Laddningstider vid filterbyte ≤ 100 ms (mätt i devtools, lokalt).