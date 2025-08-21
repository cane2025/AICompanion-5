# uppfoljningssystem
# Svensk Vårduppföljning System (Öppenvård)

En komplett administrativ webbapplikation för hantering av vårduppföljning inom öppenvård.

## Funktioner

### 🗓️ Veckodokumentation
- Veckor 33-52 med svenska veckodagar
- Klickbar färgkodning (grön=klart, gul=påmind, röd=ej gjort)
- Automatisk status tracking

### 📊 Månadsrapporter  
- Augusti-December
- Progress tracking med visuell feedback
- Automatisk databassparning

### 🏥 Vårdplan
- 5-stegs process: Inkommen → Skannad → Tillsagd → Inlämnad → Skickad
- Progress bar med klickbara steg
- Datumspårning för varje steg

### 📋 Genomförandeplan
- 2 uppföljningsmöten med datumhantering
- Status tracking per möte
- Automatisk sparning

### ⏰ Vimsa Tid
- Veckovis godkännande (vecka 33-52)
- Procentöversikt
- Status per vecka

## Teknisk Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript  
- **Database**: PostgreSQL med Drizzle ORM
- **UI**: Radix UI komponenter
- **State**: TanStack Query
- **Form**: React Hook Form + Zod validation

## Installation

```bash
npm install
```

## Quickstart (dev)

### Alternativ 1: Separata terminaler
```bash
# Terminal A - API Server
npm run dev:api
# Server körs på http://127.0.0.1:3001

# Terminal B - Client (Vite)
npm run dev:client  
# Client körs på http://127.0.0.1:5175
```

### Alternativ 2: En terminal
```bash
npm run dev:all
# Startar både API och client samtidigt
```

### Dev Login
- Använd valfritt användarnamn/lösenord i dev-läge
- Systemet använder dev-cookies automatiskt
- X-Dev-Token header är valfri för API-anrop

### Cache-busting
Öppna klienten via `http://127.0.0.1:5175/?v=$(date +%s)` för att forcera ny klientbuild i dev om något ser cached ut.

### Smoke Test
Kör `./scripts/smoke-api.sh` för att testa alla API-endpoints.

## Databas Setup

```bash
npm run db:push
```

## Miljövariabler

Projektet kräver en PostgreSQL databas. Sätt `DATABASE_URL` i miljövariablerna.

## Personal-Klient System

Systemet har komplett personal-klient koppling där val av personal automatiskt filtrerar tillhörande klienter.

## Färgkodning

- 🟢 **Grön**: Uppgift slutförd
- 🟡 **Gul**: Påmind eller sen
- 🔴 **Röd**: Ej utförd

Alla klick sparas automatiskt till databasen.# uppfoljningssystem
# uppfoljningssystem
# uppfoljningssystem
# cane2025
