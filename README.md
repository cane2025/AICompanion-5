# 🏥 AICompanion-5 - Vårdadministrationssystem

Ett komplett vårdadministrationssystem byggt med modern teknologi för att hantera vårdplaner, dokumentation och rapporter.

## 🚀 Snabbstart

### Installation
```bash
npm install
```

### Starta utvecklingsservrar
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
npm run dev:client
```

### Öppna applikationen
- Frontend: http://127.0.0.1:5175
- Backend: http://127.0.0.1:3001

### Demo-konton
- **Admin**: `admin` / `password123`
- **Staff**: `staff` / `password123`

## 🏗️ Teknisk Arkitektur

### Frontend
- **React 18** med TypeScript
- **Vite** för snabb utveckling
- **Tailwind CSS** för styling
- **Shadcn/ui** komponenter
- **React Query** för state management

### Backend
- **Node.js** med TypeScript
- **Express.js** framework
- **JWT** autentisering
- **Zod** validering

## 📁 Projektstruktur

```
├── client/src/
│   ├── components/     # UI komponenter
│   ├── features/       # CRUD-operationer
│   ├── hooks/          # Custom hooks
│   ├── lib/            # Utilities
│   ├── pages/          # Sidor
│   └── shared/         # Delade typer/validering
├── server/
│   ├── auth/           # JWT autentisering
│   ├── routes/         # API endpoints
│   └── validation.ts   # Server-side validering
└── docs/               # Dokumentation
```

## 🔧 Funktioner

### ✅ CRUD-operationer
- **Vårdplaner**: Skapa, läsa, uppdatera, ta bort
- **Genomförandeplaner**: Administrativa fält
- **Veckodokumentation**: Daglig dokumentation
- **Månadsrapporter**: Status och innehåll
- **Vimsa tid**: Timmar och dagar

### ✅ Sök & Filtrering
- Smart search med Fuse.js
- Avancerad filtrering
- Sortering A-Ö
- Sparade sökningar

### ✅ Autentisering
- JWT-baserad inloggning
- Role-based access control
- Session management

### ✅ Error Handling
- Error boundaries
- Toast notifications
- Graceful fallbacks

## 📚 Dokumentation

- [EXPORT_README.md](docs/EXPORT_README.md) - Komplett systemarkitektur
- [CRUD_OPERATIONS.md](docs/CRUD_OPERATIONS.md) - CRUD-implementation
- [DASHBOARD_INTEGRATION.md](docs/DASHBOARD_INTEGRATION.md) - Dashboard & navigation

## 🔐 Säkerhet

- Input validation med Zod
- JWT autentisering
- XSS protection
- CSRF protection
- Security headers

## 📈 Skalbarhet

- React Query caching
- Optimistic updates
- Lazy loading
- Pagination support
- Offline-first architecture

## 🛠️ Utveckling

### Scripts
```bash
npm run dev          # Starta backend
npm run dev:client   # Starta frontend
npm run build        # Bygg för produktion
npm run check        # TypeScript check
```

### Miljövariabler
```bash
# .env
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=3001
```

## 🤝 Bidrag

1. Fork repository
2. Skapa feature branch
3. Commit ändringar
4. Push till branch
5. Skapa Pull Request

## 📄 Licens

MIT License - se [LICENSE](LICENSE) fil för detaljer.

---

**Detta system är designat för att vara skalbart, säkert och underhållbart för långsiktig användning i produktionsmiljö.** 🚀
