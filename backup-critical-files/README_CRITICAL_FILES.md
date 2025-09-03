# 🚨 KRITISKA FILER - Uppföljningssystem Backup

## 📋 Översikt

Denna mapp innehåller alla kritiska filer för systemets funktionalitet, säkerhet och kvalitet.
Använd denna backup för att återställa systemet eller för PR-utveckling.

## 🏗️ Kategori: Backend & API (Kritisk)

### Server Core

- `server/index.ts` - Huvudserver med alla avancerade funktioner
- `server/index-dev.ts` - Utvecklingsserver för snabb start
- `server/db.ts` - Databasanslutning (PostgreSQL/SQLite)
- `server/dbStorage.ts` - Databaslagring med Drizzle ORM
- `server/devStorage.ts` - Mock-lagring för utveckling

### Säkerhet & Autentisering

- `server/middleware/auth.ts` - JWT-autentisering och rollhantering
- `server/routes/api.ts` - Produktions-API med säkerhet
- `server/routes/dev.ts` - Utvecklings-API med mock-data

### Avancerade Tjänster

- `server/services/emailService.ts` - E-postnotifieringar
- `server/services/pdfService.ts` - PDF-generering
- `server/services/calendarService.ts` - Kalenderintegration
- `server/services/dashboard.ts` - Statistik och rapporter
- `server/services/scheduledTasksService.ts` - Schemalagda uppgifter
- `server/services/exportImportService.ts` - Data export/import

### API Routes

- `server/routes/reports.ts` - PDF och export-funktioner
- `server/routes/dashboard.ts` - Dashboard-data
- `server/routes/calendar.ts` - Kalender-funktioner

## 🎨 Kategori: Frontend & UI (Kritisk)

### React Components

- `client-src/components/` - Alla UI-komponenter
- `client-src/pages/` - Sidkomponenter
- `client-src/hooks/` - Custom React hooks
- `client-src/utils/` - Hjälpfunktioner
- `client-src/types/` - TypeScript-typer

### Styling & Konfiguration

- `client-public/` - Statiska assets
- `tailwind.config.ts` - Tailwind CSS-konfiguration
- `postcss.config.js` - PostCSS-konfiguration
- `components.json` - Radix UI-komponenter

## 🗄️ Kategori: Databas & Schema (Kritisk)

### Schema Definition

- `shared/schema.ts` - PostgreSQL-schema med Drizzle ORM
- `shared/schema-sqlite.ts` - SQLite-schema för utveckling
- `migrations/` - Databasmigrationer

### Databas Scripts

- `scripts/setup-database.ts` - Databas-setup
- `scripts/migrate.ts` - Migrationshantering

## ⚙️ Kategori: Konfiguration & Build (Kritisk)

### Dependencies & Build

- `package.json` - Alla dependencies och scripts
- `package-lock.json` - Exakta versionslåsningar
- `tsconfig.json` - TypeScript-konfiguration
- `tsconfig.server.json` - Server TypeScript-konfiguration
- `vite.config.ts` - Vite build-konfiguration

### Miljö & Deployment

- `.env` - Miljövariabler (anpassa för produktion)
- `drizzle.config.ts` - Drizzle ORM-konfiguration

## 🧪 Kategori: Kvalitet & Testning (Viktig)

### Testning

- `tests/` - Alla testfiler
- `vitest.config.ts` - Test-konfiguration

### Dokumentation

- `BACKEND_INTEGRATION.md` - Teknisk implementation
- `IMPLEMENTATION_SUMMARY.md` - Funktionsöversikt
- `KONFIGURATION_KOMPLETT.md` - Konfigurationsguide
- `README.md` - Huvuddokumentation

## 🚀 Kategori: Deployment & Scripts (Viktig)

### Deployment

- `Dockerfile` - Docker-container
- `deploy.sh` - Deployment-script
- `start-dev.sh` - Utvecklingsstart

## 🔒 Säkerhetsaspekter

### Autentisering

- JWT-tokens med utgångstid
- Rollbaserad åtkomstkontroll (RBAC)
- Säker session-hantering
- CSRF-skydd

### Datasäkerhet

- SQL-injection-skydd via Drizzle ORM
- XSS-skydd via React
- Säker cookie-hantering
- Miljövariabler för känslig data

## 📊 Prestanda & Skalbarhet

### Optimeringar

- React Query för caching
- Lazy loading av komponenter
- Effektiv databasfrågor
- Bildoptimering

### Monitoring

- Loggning av alla API-anrop
- Felhantering med fallbacks
- Prestandamätning
- Säkerhetsloggar

## 🛠️ Installation & Återställning

### Snabb start (utveckling)

```bash
npm install
npm run dev
```

### Produktionsstart

```bash
npm install
# Konfigurera .env med riktiga värden
npm run dev:db
```

### Databas-setup

```bash
npm run db:push
npm run db:setup
```

## ⚠️ Viktiga Noter

1. **Miljövariabler**: Uppdatera `.env` för produktion
2. **Databas**: Konfigurera DATABASE_URL för riktig databas
3. **E-post**: Konfigurera SMTP-inställningar för notifieringar
4. **Säkerhet**: Ändra JWT_SECRET för produktion
5. **Backup**: Regelbunden backup av databas och filer

## 🔄 Uppdateringar

- Uppdatera dependencies regelbundet
- Följ säkerhetsuppdateringar
- Testa alla funktioner efter ändringar
- Dokumentera alla API-ändringar

## 📞 Support

För tekniska frågor, se dokumentationen eller kontakta utvecklingsteamet.
