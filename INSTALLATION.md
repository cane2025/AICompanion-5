# Installation Guide - Svensk Vårduppföljning

## Snabb Start

1. **Ladda ner projektet från GitHub**
```bash
git clone https://github.com/cane2025/uppfoljningssystem.git
cd uppfoljningssystem
```

2. **Installera dependencies**
```bash
npm install
```

3. **Sätt upp miljövariabler**
Skapa en `.env` fil med:
```
DATABASE_URL="din-postgresql-databas-url"
```

4. **Starta projektet**
```bash
npm run dev
```

## Databas Setup

Projektet använder PostgreSQL. Efter du satt DATABASE_URL:
```bash
npm run db:push
```

Detta skapar alla tabeller automatiskt.

## Tillgänglig på
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Funktioner som fungerar direkt:
✅ Alla 5 vårdflödeskomponenter
✅ Personal-klient filtrering  
✅ Färgkodad status tracking
✅ Automatisk databassparning
✅ Komplett CRUD för alla tabeller

## Felsökning

**Problem: "Module not found"**
- Kör `npm install` igen

**Problem: "Database connection failed"** 
- Kontrollera DATABASE_URL i .env
- Kör `npm run db:push`

**Problem: "Port already in use"**
- Ändra port i vite.config.ts eller stäng andra servrar