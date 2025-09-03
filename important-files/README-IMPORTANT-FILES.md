# 🏥 AICompanion-5 - Viktiga Filer för Flöde, Säkerhet och Systemarkitektur

Denna mapp innehåller de mest kritiska filerna för att förstå och underhålla AICompanion-5 systemet.

## 📁 Mappstruktur

### 🔧 **config/** - Konfigurationsfiler

- `package.json` - Projektberoenden och skript
- `tsconfig.json` - TypeScript-konfiguration
- `vite.config.ts` - Vite build-konfiguration
- `vitest.config.ts` - Test-konfiguration

### 🖥️ **server/** - Backend-kod

- `index.ts` - Huvudserver-fil
- `routes/` - API-endpoints och routing
- `data/` - Datapersistens och JSON-lagring
- `middleware/` - Express middleware (autentisering, validering)

### 🎨 **client/** - Frontend-kod

- `components/` - React-komponenter
- `hooks/` - Custom React hooks
- `lib/` - Utilities och hjälpfunktioner
- `pages/` - Sidkomponenter och routing

### 🔄 **shared/** - Delade scheman

- `types.ts` - TypeScript-typer och interfaces
- `schemas.ts` - Valideringsscheman

### 🚀 **flow/** - Flödes- och testfiler

- `ai-agent-test.sh` - Shell-baserad testsuite
- `ai-agent-test.js` - Node.js testsuite
- `debug-script.sh` - Debug-verktyg

### 🔒 **security/** - Säkerhetskonfiguration

- `eslint.config.js` - Kodkvalitet och säkerhetsregler
- `.eslintignore` - Ignorerade filer för linting
- `.gitignore` - Git-säkerhet (känsliga filer)

### 🛠️ **.vscode/** - Utvecklingsmiljö

- `settings.json` - VS Code-inställningar
- `extensions.json` - Rekommenderade tillägg

### 🔍 **.sonarlint/** - Kodkvalitet

- SonarLint-konfiguration för säkerhetsanalys

## 🚨 Kritiska Säkerhetsaspekter

### Autentisering

- Cookie-baserad sessionshantering
- Dev-token för utveckling
- GDPR-kompatibel datalagring

### Datavalidering

- Input-sanitering
- TypeScript-typer för typesäkerhet
- Schema-validering

### Säkerhetsregler

- ESLint-regler för säker kod
- SonarLint för säkerhetsanalys
- Git-säkerhet med .gitignore

## 🔄 Systemflöde

### API-flöde

1. **Autentisering** - Dev-token validering
2. **Routing** - Express.js routing med middleware
3. **Validering** - Input-validering med scheman
4. **Datapersistens** - JSON-fil lagring
5. **Response** - Strukturerad JSON-response

### Frontend-flöde

1. **Komponenter** - Modulära React-komponenter
2. **State Management** - TanStack Query för data
3. **Styling** - Tailwind CSS med Radix UI
4. **Validering** - Hookform med resolvers

## 🧪 Testning och Kvalitet

### Automatiserade tester

- **Shell-tester** - Integrationstester för API
- **Node.js-tester** - Unit-tester för funktionalitet
- **Debug-verktyg** - Felsökning och rapportering

### Kodkvalitet

- **ESLint** - Kodstandarder och säkerhet
- **SonarLint** - Säkerhetsanalys
- **TypeScript** - Typesäkerhet

## 📊 Prestanda och Skalbarhet

### Backend

- Express.js med TypeScript
- JSON-fil lagring för enkelhet
- Middleware för prestanda

### Frontend

- Vite för snabb utveckling
- React 18 med moderna hooks
- Tailwind CSS för effektiv styling

## 🔧 Underhåll och Utveckling

### Utvecklingsmiljö

- VS Code med rekommenderade tillägg
- Hot reload med Vite
- TypeScript-kompilering

### Deployment

- Docker-stöd
- Build-script för produktion
- Miljövariabler för konfiguration

## 📝 Viktiga Kommandon

```bash
# Starta utvecklingsservern
npm run dev

# Kör tester
./ai-agent-test.sh
node ai-agent-test.js

# Bygg för produktion
npm run build

# Starta produktion
npm start
```

## 🚨 Säkerhetsrekommendationer

1. **Regelbundna säkerhetsuppdateringar** av dependencies
2. **Kodgranskning** med ESLint och SonarLint
3. **Testning** av alla säkerhetsfunktioner
4. **Övervakning** av loggar och fel
5. **Backup** av kritiska data

## 📞 Support

För frågor om säkerhet, flöde eller systemarkitektur, kontakta utvecklingsteamet.

---

**AICompanion-5** - Säker vårdadministration för framtiden 🏥
