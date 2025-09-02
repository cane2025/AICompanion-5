# Backend Integration & Advanced Features

Detta dokument beskriver alla nya backend-integrationer och avancerade funktioner som har implementerats i uppföljningssystemet.

## 🚀 Nya Funktioner

### 1. Backend Integration
- ✅ **Databas-integration**: Ersatt mock-data med riktiga PostgreSQL-databasoperationer
- ✅ **Användarhantering**: JWT-baserad autentisering med refresh tokens
- ✅ **API-endpoints**: RESTful API för alla systemfunktioner

### 2. Avancerade Funktioner
- ✅ **PDF-generering**: Automatisk generering av rapporter i PDF-format
- ✅ **E-postnotifieringar**: Automatiska påminnelser och notifieringar
- ✅ **Kalenderintegration**: Synkronisering med Google Calendar, Outlook och iCal
- ✅ **Dashboard**: Statistik, grafer och analyser

### 3. Förbättringar
- ✅ **Sök och filtrering**: Avancerad sökning i alla datatyper
- ✅ **Bulk-operationer**: Massimport/export av data
- ✅ **Export/Import**: Stöd för CSV, JSON och Excel-format

## 🗄️ Databas Setup

### 1. Installera Dependencies
```bash
npm install
```

### 2. Konfigurera Miljövariabler
Kopiera `.env.example` till `.env` och fyll i dina värden:
```bash
cp .env.example .env
```

### 3. Kör Databas-migration
```bash
npm run migrate
```

### 4. Generera Drizzle-migrationer (valfritt)
```bash
npm run db:generate
npm run db:migrate
```

## 🔐 Autentisering

### JWT-baserad Autentisering
Systemet använder JWT (JSON Web Tokens) för säker autentisering:

- **Access Token**: Giltig i 15 minuter
- **Refresh Token**: Giltig i 7 dagar (lagras som HTTP-only cookie)
- **Rollbaserad åtkomst**: admin, staff, viewer

### API-anrop
```typescript
// Login
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}

// Använda token
Authorization: Bearer <access_token>

// Refresh token
POST /api/auth/refresh
```

## 📊 Dashboard & Statistik

### Tillgängliga Endpoints
```typescript
// Översikt
GET /api/dashboard/stats

// Veckostatistik
GET /api/dashboard/weekly-stats?year=2024&week=1

// Månadsstatistik
GET /api/dashboard/monthly-stats?year=2024&month=1

// Kvalitetsmetrik
GET /api/dashboard/quality-metrics

// Personalprestanda
GET /api/dashboard/staff-performance

// Klientöversikt
GET /api/dashboard/client-overview
```

### Statistik som samlas in
- Totalt antal personal, klienter, dokument
- Genomförandegrader för veckodokumentation
- Kvalitetsbedömningar och poäng
- Personalprestanda och deadlines
- Trendanalys över tid

## 📄 PDF-generering

### Tillgängliga PDF-typer
- **Veckodokumentation**: Detaljerad veckorapport med status för varje dag
- **Månadsrapporter**: Översiktlig månadsrapport med kvalitetsbedömning
- **Vårdplaner**: Komplett vårdplan med mål och åtgärder
- **Dashboard-rapporter**: Sammanfattning av systemstatistik

### API-anrop
```typescript
// Generera PDF för veckodokumentation
POST /api/pdf/weekly-documentation/:id
{
  "clientId": "client-uuid",
  "year": 2024,
  "week": 1
}

// Generera PDF för månadsrapport
POST /api/pdf/monthly-report/:id
{
  "clientId": "client-uuid",
  "year": 2024,
  "month": 1
}
```

## 📧 E-postnotifieringar

### Automatiska Påminnelser
- **Veckopåminnelser**: Skickas automatiskt för oavslutad dokumentation
- **Månadspåminnelser**: Påminnelser för månadsrapporter
- **Kvalitetsbedömningar**: Notifieringar när kvalitetsbedömningar görs
- **Systemmeddelanden**: Admin-notifieringar för viktiga händelser

### Konfiguration
```bash
# SMTP-inställningar i .env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### API-anrop
```typescript
// Skicka veckopåminnelse
POST /api/email/weekly-reminder
{
  "staffId": "staff-uuid"
}

// Skicka månadspåminnelse
POST /api/email/monthly-reminder
{
  "staffId": "staff-uuid"
}
```

## 📅 Kalenderintegration

### Stödda Plattformar
- **Google Calendar**: Fullständig synkronisering
- **Outlook/Office 365**: Microsoft Graph API-integration
- **iCal**: Standard iCal-feed support
- **Intern kalender**: Lokal händelsehantering

### Automatiska Händelser
- **Deadlines**: Automatiska påminnelser för veckodokumentation
- **Månadsrapporter**: Deadline-händelser för månadsrapporter
- **Kvalitetsbedömningar**: Påminnelser för kvalitetsutvärdering
- **Anpassade händelser**: Möten, utbildningar, etc.

### API-anrop
```typescript
// Hämta kalenderhändelser
GET /api/calendar/events?staffId=uuid&startDate=2024-01-01&endDate=2024-01-31

// Skapa ny händelse
POST /api/calendar/events
{
  "title": "Möte med klient",
  "description": "Veckomöte",
  "startDate": "2024-01-15T10:00:00Z",
  "endDate": "2024-01-15T11:00:00Z",
  "staffId": "staff-uuid",
  "clientId": "client-uuid",
  "type": "meeting"
}

// Hämta integrationer
GET /api/calendar/integrations
```

## 🔍 Sök och Filtrering

### Avancerad Sökning
```typescript
// Sök personal
GET /api/search/staff?q=namn

// Sök klienter
GET /api/search/clients?q=initials

// Filtrera med parametrar
GET /api/clients?staffId=uuid&status=active
GET /api/weekly-documentation?clientId=uuid&year=2024&week=1
```

### Sökfunktioner
- **Fuzzy search**: Tolererar stavfel och partiella matchningar
- **Flera fält**: Sök i namn, initialer, personnummer, etc.
- **Realtid**: Sökresultat uppdateras dynamiskt
- **Filtrering**: Kombinera sökning med filter

## 📤 Export/Import

### Stödda Format
- **CSV**: Komma-separerade värden
- **JSON**: JavaScript Object Notation
- **Excel**: Microsoft Excel-format (planerat)

### Export
```typescript
// Exportera personal
POST /api/export/staff
{
  "format": "csv",
  "filters": {
    "staffId": "uuid"
  },
  "dateRange": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  }
}

// Exportera klienter
POST /api/export/clients
{
  "format": "json",
  "filters": {
    "status": "active"
  }
}
```

### Import
```typescript
// Importera personal
POST /api/import/staff
{
  "data": "csv-data-here",
  "format": "csv",
  "options": {
    "updateExisting": true,
    "skipErrors": false,
    "validateData": true
  }
}

// Importera klienter
POST /api/import/clients
{
  "data": "json-data-here",
  "format": "json",
  "options": {
    "updateExisting": false,
    "skipErrors": true
  }
}
```

### Bulk-operationer
```typescript
// Massimport av personal
const staffList = [
  { name: "Anna Andersson", initials: "AA", ... },
  { name: "Bengt Bengtsson", initials: "BB", ... }
];

await exportImportService.bulkCreateStaff(staffList);
```

## 🛠️ Utveckling

### Projektstruktur
```
server/
├── services/           # Affärslogik
│   ├── auth.ts        # Autentisering
│   ├── database.ts    # Databasoperationer
│   ├── pdf.ts         # PDF-generering
│   ├── email.ts       # E-postnotifieringar
│   ├── calendar.ts    # Kalenderintegration
│   ├── dashboard.ts   # Statistik och analys
│   └── export-import.ts # Datahantering
├── middleware/         # Express middleware
│   └── auth.ts        # Autentisering och auktorisering
├── routes/            # API-routes
│   └── api.ts         # Huvud-API
└── index.ts           # Server-startpunkt
```

### Miljövariabler
Se `.env.example` för alla tillgängliga konfigurationsalternativ.

### Databas-schema
Alla tabeller definieras i `shared/schema.ts` med Drizzle ORM.

### API-dokumentation
Alla endpoints dokumenteras i koden med TypeScript-typer och validering.

## 🚀 Deployment

### Produktionsmiljö
1. Sätt `NODE_ENV=production`
2. Konfigurera säkra JWT-nycklar
3. Använd HTTPS för alla externa anslutningar
4. Konfigurera rate limiting
5. Sätt upp monitoring och loggning

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Miljövariabler för Produktion
```bash
NODE_ENV=production
JWT_SECRET=<säker-nyckel>
JWT_REFRESH_SECRET=<säker-refresh-nyckel>
DATABASE_URL=<produktions-databas>
SMTP_HOST=<produktions-smtp>
```

## 📚 Exempel

### Frontend-integration
```typescript
// Hämta dashboard-statistik
const stats = await fetch('/api/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
}).then(res => res.json());

// Generera PDF
const pdfResponse = await fetch('/api/pdf/weekly-documentation/123', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    clientId: 'client-uuid',
    year: 2024,
    week: 1
  })
});

const pdfBlob = await pdfResponse.blob();
```

### Webhook-integration
```typescript
// Extern system-integration
const webhookData = {
  type: 'weekly_documentation_completed',
  data: {
    clientId: 'client-uuid',
    staffId: 'staff-uuid',
    week: 1,
    year: 2024
  }
};

await fetch('/api/webhooks/external', {
  method: 'POST',
  headers: {
    'X-API-Key': process.env.API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(webhookData)
});
```

## 🔧 Felsökning

### Vanliga Problem
1. **Databasanslutning**: Kontrollera `DATABASE_URL` och nätverksåtkomst
2. **JWT-tokens**: Verifiera `JWT_SECRET` och token-format
3. **SMTP**: Testa e-postinställningar med `emailService.testConnection()`
4. **PDF-generering**: Kontrollera Puppeteer-installation

### Loggning
Alla API-anrop loggas med `requestLogger` middleware. Fel loggas med detaljerad information.

### Health Check
```bash
curl http://localhost:3001/api/health
```

## 📞 Support

För tekniska frågor eller problem, kontakta utvecklingsteamet eller skapa en issue i projektets repository.

---

**OBS**: Detta system ersätter det tidigare mock-baserade systemet. Alla data sparas nu permanent i PostgreSQL-databasen med fullständig backup och återställningskapacitet.