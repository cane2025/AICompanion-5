# Frontend Setup & Development

## Snabbstart

### 1. Starta både backend och frontend

```bash
# Starta båda servrarna samtidigt
npm run dev:full

# Eller starta separat:
npm run dev          # Backend på port 3001
npm run dev:client   # Frontend på port 5175
```

### 2. Öppna i webbläsare

- **Frontend**: http://127.0.0.1:5175
- **Backend API**: http://127.0.0.1:3001/api

## Port-konfiguration

### Frontend (Vite)

- **Port**: 5175
- **Host**: 127.0.0.1
- **Strict Port**: true (failar om porten är upptagen)

### Backend (Express)

- **Port**: 3001
- **Host**: 127.0.0.1

## Proxy-konfiguration

Frontend proxy:ar `/api` requests till backend:

```typescript
// vite.config.ts
proxy: {
  "/api": {
    target: "http://127.0.0.1:3001",
    changeOrigin: true,
    secure: false,
  },
}
```

## Felsökning

### Port 5175 inte tillgänglig

```bash
# Kolla vilka processer använder porten
lsof -nP -iTCP:5175 | grep LISTEN

# Döda processen om nödvändigt
kill -9 <PID>

# Starta om frontend
npm run dev:client
```

### Frontend laddar inte

1. Verifiera att Vite körs: `curl http://127.0.0.1:5175/`
2. Kolla terminal-output för Vite URL
3. Prova `http://localhost:5175` istället för `127.0.0.1:5175`

### API-anrop misslyckas

1. Verifiera att backend körs: `curl http://127.0.0.1:3001/api/health`
2. Kolla proxy-konfiguration i `vite.config.ts`
3. Verifiera att API-anrop går via frontend: `curl http://127.0.0.1:5175/api/health`

## Development Scripts

```bash
npm run dev          # Endast backend
npm run dev:client   # Endast frontend
npm run dev:full     # Båda samtidigt
npm run dev:build    # Build frontend
npm run dev:open     # Öppna frontend i browser
```

## Miljövariabler

- `PORT=3001` - Backend port
- `NODE_ENV=development` - Development mode
