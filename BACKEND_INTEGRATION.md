# Backend Integration & Advanced Features

Detta dokument beskriver alla nya backend-integrationer och avancerade funktioner som har implementerats i uppföljningssystemet.

## 🚀 Implementerade funktioner

### 1. Backend-integration

#### ✅ Databas med PostgreSQL/Neon
- Ersatt all mock-data med riktig databaslagring
- Implementerat Drizzle ORM för typsäker databasåtkomst
- Stöd för alla datamodeller: personal, klienter, dokumentation, rapporter, planer
- Soft delete för personal och klienter
- Automatiska timestamps (createdAt, updatedAt)

#### ✅ Autentisering med JWT
- Säker användarinloggning med bcrypt-hashade lösenord
- JWT-tokens för sessionhantering
- Roll-baserad åtkomstkontroll (admin, staff, viewer)
- Automatisk token-förnyelse
- Säkra HTTP-only cookies

### 2. Avancerade funktioner

#### ✅ PDF-generering
- Generera PDF-rapporter för all dokumentation
- Veckodokumentation PDF med daglig status
- Månadsrapporter PDF med kvalitetsbedömning
- Genomförandeplaner PDF med mål och insatser
- Personalrapporter med statistik
- Professionell formatering med signaturfält

#### ✅ E-postnotifieringar
- Automatiska påminnelser för veckodokumentation
- Notifieringar för månadsrapporter som förfaller
- Dagliga sammanfattningar för personal
- Anpassningsbara e-postmallar
- Bulk-utskick för administratörer

#### ✅ Dashboard med statistik
- Realtidsstatistik över systemet
- Dokumentationstrender över tid
- Personalarbetsbelastning
- Klientaktivitet och status
- Kvalitetsmätningar
- Kommande deadlines

### 3. Förbättringar

#### ✅ Sök och filtrering
- Avancerad sökning för personal och klienter
- Filtrering baserat på status, datum, kvalitet
- Fuzzy search med partiella matchningar
- Snabb indexerad sökning i databasen

#### ✅ Bulk-operationer
- Importera personal och klienter från CSV
- Exportera all data till CSV eller JSON
- Bulk-radering med soft delete
- Batch-uppdateringar

#### ✅ Export/Import av data
- Exportera till CSV med svensk formatering
- Full JSON-export för backup
- Import från CSV med validering
- Mallar för import-filer

## 📋 API Endpoints

### Autentisering
- `POST /api/auth/register` - Registrera ny användare
- `POST /api/auth/login` - Logga in
- `POST /api/auth/logout` - Logga ut
- `GET /api/auth/session` - Kontrollera session

### Personal
- `GET /api/staff` - Lista all personal
- `GET /api/staff/:id` - Hämta specifik personal
- `POST /api/staff` - Skapa ny personal (admin)
- `PUT /api/staff/:id` - Uppdatera personal (admin)
- `DELETE /api/staff/:id` - Ta bort personal (admin)

### Klienter
- `GET /api/clients/all` - Lista alla klienter
- `GET /api/staff/:staffId/clients` - Klienter för specifik personal
- `POST /api/clients` - Skapa ny klient
- `PUT /api/clients/:id` - Uppdatera klient
- `DELETE /api/clients/:id` - Ta bort klient

### Dokumentation
- `GET /api/weekly-documentation/all` - All veckodokumentation
- `GET /api/weekly-documentation/:clientId` - Dokumentation för klient
- `POST /api/weekly-documentation` - Skapa ny dokumentation
- `PUT /api/weekly-documentation/:id` - Uppdatera dokumentation

### Rapporter
- `GET /api/monthly-reports/all` - Alla månadsrapporter
- `GET /api/monthly-reports/:clientId` - Rapporter för klient
- `POST /api/monthly-reports` - Skapa ny rapport
- `PUT /api/monthly-reports/:id` - Uppdatera rapport

### PDF-generering
- `GET /api/reports/pdf/weekly-documentation/:id` - Veckodokumentation som PDF
- `GET /api/reports/pdf/monthly-report/:id` - Månadsrapport som PDF
- `GET /api/reports/pdf/care-plan/:id` - Genomförandeplan som PDF
- `POST /api/reports/pdf/staff-report` - Personalrapport som PDF

### Export/Import
- `GET /api/reports/export/staff/csv` - Exportera personal
- `GET /api/reports/export/clients/csv` - Exportera klienter
- `GET /api/reports/export/all/json` - Full backup
- `POST /api/reports/import/staff/csv` - Importera personal
- `POST /api/reports/import/clients/csv` - Importera klienter

### Dashboard
- `GET /api/dashboard/statistics/overview` - Översiktsstatistik
- `GET /api/dashboard/statistics/documentation-trends` - Dokumentationstrender
- `GET /api/dashboard/statistics/staff-workload` - Personalarbetsbelastning
- `GET /api/dashboard/statistics/quality-metrics` - Kvalitetsmätningar
- `GET /api/dashboard/statistics/upcoming-deadlines` - Kommande deadlines

### Sök
- `GET /api/search/staff?q=<query>` - Sök personal
- `GET /api/search/clients?q=<query>` - Sök klienter

### Bulk-operationer
- `POST /api/bulk/staff` - Skapa flera personal
- `DELETE /api/bulk/staff` - Ta bort flera personal
- `POST /api/bulk/clients` - Skapa flera klienter
- `DELETE /api/bulk/clients` - Ta bort flera klienter

## 🔧 Installation och konfiguration

### 1. Miljövariabler
Kopiera `.env.example` till `.env` och uppdatera:

```bash
# Databas
DATABASE_URL=postgresql://user:password@host/database

# JWT
JWT_SECRET=din-hemliga-nyckel
JWT_EXPIRES_IN=7d

# E-post
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=din-email@gmail.com
SMTP_PASS=ditt-app-lösenord
EMAIL_FROM=noreply@uppfoljning.se

# Övriga inställningar
NODE_ENV=production
PORT=3001
ENABLE_SCHEDULED_TASKS=true
```

### 2. Databas-setup

```bash
# Installera beroenden
npm install

# Kör migrationer
npm run db:generate
npm run db:push

# Kör setup-skript (skapar admin-användare)
npm run db:setup
```

### 3. Starta applikationen

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 📊 Schemalagda uppgifter

Systemet kör automatiskt följande uppgifter:

- **08:00** - Daglig morgonkontroll och påminnelser
- **09:00 måndag** - Veckodokumentationspåminnelser
- **15:00 fredag** - Deadline-påminnelser för veckodokumentation
- **10:00 25:e** - Månadsrapportpåminnelser
- **17:00 vardagar** - Daglig sammanfattning via e-post
- **10:00 dagligen** - Uppföljningskontroll för genomförandeplaner

## 🔒 Säkerhet

- Alla lösenord hashas med bcrypt
- JWT-tokens lagras i HTTP-only cookies
- Roll-baserad åtkomstkontroll
- Miljövariabler för känslig information
- Prepared statements mot SQL-injection
- Input-validering med Zod schemas

## 📈 Prestanda

- Databasindex på vanliga sökfält
- Lazy loading av relationer
- Bulk-operationer för effektivitet
- Caching av statiska resurser
- Optimerade SQL-queries

## 🐛 Felsökning

### Vanliga problem

1. **Databasanslutning misslyckas**
   - Kontrollera DATABASE_URL i .env
   - Verifiera att databasen är tillgänglig

2. **E-post skickas inte**
   - Kontrollera SMTP-inställningar
   - Aktivera "mindre säkra appar" för Gmail

3. **PDF-generering misslyckas**
   - Kontrollera att Puppeteer har installerats korrekt
   - Kör `npm install puppeteer --save`

4. **JWT-fel**
   - Kontrollera JWT_SECRET i .env
   - Rensa cookies och logga in igen

#### ✅ Kalenderintegration
- Automatisk generering av kalenderhändelser
- Export till iCal-format
- Integration med Google Calendar, Outlook, Apple Calendar
- Påminnelser för deadlines och uppföljningar
- Personliga kalendertokens för extern åtkomst
- Vecko- och månadsvyer för planering

### Kalender
- `GET /api/calendar/events` - Hämta kalenderhändelser
- `GET /api/calendar/events/upcoming` - Kommande händelser
- `GET /api/calendar/events/client/:id` - Händelser för specifik klient
- `POST /api/calendar/token/generate` - Generera kalendertoken
- `GET /api/calendar/ical/:staffId` - iCal-feed för extern kalender
- `GET /api/calendar/export` - Exportera kalender som fil
- `GET /api/calendar/statistics` - Kalenderstatistik

## 📝 Framtida förbättringar

- [ ] Mobilapp med React Native
- [ ] Avancerad rapportgenerator
- [ ] Integration med externa system
- [ ] Realtidsnotifieringar med WebSockets
- [ ] Flerspråksstöd
- [ ] AI-assisterad dokumentation

## 💡 Tips

- Använd `npm run db:studio` för att utforska databasen
- Exportera regelbundna backups med JSON-export
- Konfigurera e-postmallar efter organisationens behov
- Anpassa schemalagda uppgifter i `scheduledTasksService.ts`
