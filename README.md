# 🏥 UNGDOMS Öppenvård - Vårdadministrationssystem

Ett modernt och säkert system för vårdadministration enligt GDPR-standarder.

## 🚀 Snabbstart

### Förutsättningar
- Node.js 18+ 
- npm eller yarn

### Installation
```bash
# Klona repository
git clone <din-repo-url>
cd AICompanion-5

# Installera dependencies
npm install

# Starta utvecklingsservern
npm run dev
```

### Inloggning
Öppna http://127.0.0.1:3001 i webbläsaren
- **Användarnamn:** `admin`
- **Lösenord:** `admin123`

## 🛠️ Teknisk Stack

### Backend
- **Express.js** - API-server
- **TypeScript** - Typesäker utveckling
- **JSON-fil lagring** - Enkel datapersistens

### Frontend
- **React 18** - Användargränssnitt
- **Vite** - Snabb utvecklingsserver
- **Tailwind CSS** - Styling
- **Radix UI** - Tillgängliga komponenter
- **TanStack Query** - Datahantering

### Autentisering
- **Cookie-baserad sessionshantering**
- **GDPR-kompatibel datalagring**

## 📋 Funktioner

### 👥 Personalhantering
- ✅ Lägg till/redigera personal
- ✅ Rollhantering (sjuksköterska, läkare, etc.)
- ✅ Kontaktinformation

### 👤 Klienthantering
- ✅ Klientregistrering
- ✅ Personlig information
- ✅ Vårdhistorik

### 📋 Vårdplaner
- ✅ Skapa vårdplaner
- ✅ Redigera och uppdatera
- ✅ Statusspårning

### 📝 Genomförandeplaner (GFP)
- ✅ Administrativa genomförandeplaner
- ✅ Uppföljningspunkter
- ✅ Deadline-hantering

### 📊 Veckodokumentation
- ✅ Daglig dokumentation
- ✅ Veckovisning
- ✅ Sökbar historik

### 📈 Månadsrapporter
- ✅ Automatiska rapporter
- ✅ Statistik och analys
- ✅ Export-funktioner

### ⏰ VIMSA-tid
- ✅ Tidsregistrering
- ✅ Aktivitetsspårning
- ✅ Rapportering

## 🔧 Utveckling

### Kommandon
```bash
npm run dev          # Starta utvecklingsserver (port 3001)
npm run build        # Bygg för produktion
npm run check        # TypeScript-kontroll
npm run start        # Bygg + starta
```

### Projektstruktur
```
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # UI-komponenter
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # Utilities
│   │   └── pages/       # Sidor
├── server/          # Express backend
│   ├── routes/      # API-endpoints
│   ├── data/        # Datapersistens
│   └── middleware/  # Express middleware
├── shared/          # Delade scheman
└── dist/            # Byggda filer
```

## 🧪 Testning

### Automatiska tester
```bash
# Kör alla tester
./ai-agent-test.sh

# Node.js test suite
node ai-agent-test.js
```

### Manuell testning
1. Starta servern: `npm run dev`
2. Öppna http://127.0.0.1:3001
3. Logga in med admin/admin123
4. Testa alla funktioner

## 🔒 Säkerhet

- ✅ GDPR-kompatibel datalagring
- ✅ Säker autentisering
- ✅ Input-validering
- ✅ XSS-skydd
- ✅ CSRF-skydd

## 📊 API Endpoints

### Autentisering
- `POST /api/auth/login` - Inloggning
- `GET /api/auth/session` - Sessionskontroll

### Personal
- `GET /api/staff` - Hämta all personal
- `POST /api/staff` - Lägg till personal
- `PUT /api/staff/:id` - Uppdatera personal
- `DELETE /api/staff/:id` - Ta bort personal

### Klienter
- `GET /api/clients/all` - Hämta alla klienter
- `GET /api/staff/:staffId/clients` - Klienter per personal
- `POST /api/clients` - Lägg till klient
- `PUT /api/clients/:id` - Uppdatera klient
- `DELETE /api/clients/:id` - Ta bort klient

### Vårdplaner
- `GET /api/care-plans/all` - Hämta alla vårdplaner
- `GET /api/care-plans/client/:clientId` - Vårdplaner per klient
- `POST /api/care-plans` - Skapa vårdplan
- `PUT /api/care-plans/:id` - Uppdatera vårdplan
- `DELETE /api/care-plans/:id` - Ta bort vårdplan

### Genomförandeplaner
- `GET /api/implementation-plans/all` - Hämta alla GFP
- `GET /api/implementation-plans/client/:clientId` - GFP per klient
- `POST /api/implementation-plans` - Skapa GFP
- `PUT /api/implementation-plans/:id` - Uppdatera GFP
- `DELETE /api/implementation-plans/:id` - Ta bort GFP

### Veckodokumentation
- `GET /api/weekly-documentation/all` - Hämta all dokumentation
- `GET /api/weekly-documentation/client/:clientId` - Dokumentation per klient
- `POST /api/weekly-documentation` - Skapa dokumentation
- `PUT /api/weekly-documentation/:id` - Uppdatera dokumentation
- `DELETE /api/weekly-documentation/:id` - Ta bort dokumentation

### Månadsrapporter
- `GET /api/monthly-reports/all` - Hämta alla rapporter
- `GET /api/monthly-reports/client/:clientId` - Rapporter per klient
- `POST /api/monthly-reports` - Skapa rapport
- `PUT /api/monthly-reports/:id` - Uppdatera rapport

### VIMSA-tid
- `GET /api/vimsa-time/all` - Hämta all VIMSA-tid
- `GET /api/vimsa-time/client/:clientId` - VIMSA-tid per klient
- `POST /api/vimsa-time` - Registrera VIMSA-tid
- `PUT /api/vimsa-time/:id` - Uppdatera VIMSA-tid

## 🚀 Deployment

### Produktionsbygg
```bash
npm run build
npm start
```

### Docker (kommer snart)
```bash
docker build -t ungdom-oppenvard .
docker run -p 3001:3001 ungdom-oppenvard
```

## 📝 Changelog

### v2.0.0 (2025-08-21)
- ✅ Enhetlig server (API + frontend på port 3001)
- ✅ Vanlig användarnamn/lösenord inloggning
- ✅ Förbättrad datapersistens
- ✅ Omfattande testsuite
- ✅ Debug-rapporter och dokumentation

### v1.0.0 (2025-08-16)
- 🎉 Första versionen
- Grundläggande CRUD-funktioner
- Dev-token autentisering

## 🤝 Bidrag

1. Forka projektet
2. Skapa en feature branch (`git checkout -b feature/AmazingFeature`)
3. Committa ändringar (`git commit -m 'Add some AmazingFeature'`)
4. Pusha till branchen (`git push origin feature/AmazingFeature`)
5. Öppna en Pull Request

## 📄 Licens

Detta projekt är licensierat under MIT-licensen - se [LICENSE](LICENSE) filen för detaljer.

## 📞 Support

För support eller frågor, kontakta utvecklingsteamet.

---

**UNGDOMS Öppenvård** - Säker vårdadministration för framtiden 🏥
