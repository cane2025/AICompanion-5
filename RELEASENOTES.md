Release Notes – V2 Vårdflöden

Nyheter
- Versionerad Vårdplan per klient (index 1..N) med auto-skapande GFP.
- Genomförandeplaner (GFP) per Vårdplan med 5 uppföljningar.
- Veckodokumentation dagvy (Mån–Sön) med onTime/försenad-logik och export.
- Nya stats-endpoints för personal- och klientuppföljning.

Säkerhet
- Inget personnummer lagras eller används i V2-flöden.
- UUID-baserade clientId/personals (dev-token för demo).

Prestanda
- Veckovyn begränsad till valt år (default aktuellt år).

Hur man testar (lokalt)
1. Starta servern: npm run dev
2. Öppna appen (http://127.0.0.1:3001) och logga in (dev): admin/admin123
3. Skapa klient i Admin/Clients.
4. Öppna klientens detaljsida.
   - Flik Vårdplan: skapa ny vårdplan → snackbar visar auto-GFP index.
   - Flik GFP: se lista, toggla uppföljningar och spara.
   - Flik Dokumentation: öppna vecka, markera dagars togglar, spara. Testa filter och export.
5. Stats: använd komponenten Personalstatistik (drivs av /api/stats/staff).

API (v2)
- GET/POST/PATCH enligt TEST-LOGG.md.

Bakåtkompatibilitet
- Befintliga endpoints och modeller lämnas orörda för dev-miljön.

