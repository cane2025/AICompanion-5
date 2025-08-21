# 🔧 Troubleshooting Guide - UI Problems

## Startkommandon

### Korrekt start av systemet:
```bash
# Terminal A - API Server
npm run dev:api
# Server körs på http://127.0.0.1:3001

# Terminal B - Client (Vite)
npm run dev:client  
# Client körs på http://127.0.0.1:5175
```

### Alternativt (en terminal):
```bash
npm run dev:all
```

## Dev Login och Authentication

### 1. Logga in i dev-läge:
- Använd valfritt användarnamn/lösenord (t.ex. `admin`/`admin123`)
- Systemet använder dev-cookies automatiskt
- X-Dev-Token header sätts automatiskt från localStorage

### 2. Verifiera authentication:
```bash
# Testa login
curl -X POST http://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Dev-Token: s_demo" \
  --data '{"username":"admin","password":"admin123"}'

# Testa session
curl http://127.0.0.1:3001/api/session
```

### 3. Token/cookie format:
- **Cookie**: `devToken=s_demo` (sätts automatiskt av servern)
- **X-Dev-Token header**: `s_demo` (sätts automatiskt av klienten)
- **localStorage**: `devToken: "s_demo"` (sätts efter lyckad login)

## API Endpoints som UI använder

### Staff endpoints:
- `GET /api/staff` - Lista all personal
- `GET /api/staff/:staffId/clients` - Klienter för specifik staff

### Client endpoints:
- `GET /api/clients` - Alla klienter
- `POST /api/clients` - Skapa klient (201 + id)
- `PUT /api/clients/:id` - Uppdatera klient
- `DELETE /api/clients/:id` - Ta bort klient

### Care Plan endpoints:
- `GET /api/care-plans` - Alla vårdplaner
- `GET /api/care-plans/staff/:staffId` - Vårdplaner för staff
- `GET /api/care-plans/:clientId` - Vårdplan för klient
- `POST /api/care-plans` - Skapa vårdplan (201 + id)

### Implementation Plan endpoints:
- `GET /api/implementation-plans` - Alla genomförandeplaner
- `GET /api/implementation-plans/staff/:staffId` - Genomförandeplaner för staff
- `GET /api/implementation-plans/:clientId` - Genomförandeplan för klient
- `POST /api/implementation-plans` - Skapa genomförandeplan (201 + id)

### Weekly Documentation endpoints:
- `GET /api/weekly-documentation` - All veckodokumentation
- `GET /api/weekly-documentation/:clientId` - Veckodokumentation för klient
- `POST /api/weekly-documentation` - Skapa veckodokumentation (201 + id)

### Monthly Report endpoints:
- `GET /api/monthly-reports` - Alla månadsrapporter
- `GET /api/monthly-reports/:clientId` - Månadsrapporter för klient
- `POST /api/monthly-reports` - Skapa månadsrapport (201 + id)

### Vimsa Time endpoints:
- `GET /api/vimsa-time` - All vimsa tid
- `GET /api/vimsa-time/:clientId` - Vimsa tid för klient
- `POST /api/vimsa-time` - Skapa vimsa tid (201 + id)

## React Query Keys som uppdateras

### När klient skapas:
```javascript
queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
queryClient.invalidateQueries({ queryKey: ["/api/staff", staffId, "clients"] });
```

### När vårdplan skapas:
```javascript
queryClient.invalidateQueries({ queryKey: ["/api/care-plans"] });
queryClient.invalidateQueries({ queryKey: ["/api/care-plans", "staff", staffId] });
queryClient.invalidateQueries({ queryKey: ["/api/care-plans", clientId] });
```

### När genomförandeplan skapas:
```javascript
queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans"] });
queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans", "staff", staffId] });
queryClient.invalidateQueries({ queryKey: ["/api/implementation-plans", clientId] });
```

### När veckodokumentation skapas:
```javascript
queryClient.invalidateQueries({ queryKey: ["/api/weekly-documentation"] });
queryClient.invalidateQueries({ queryKey: ["/api/weekly-documentation", clientId] });
```

### När månadsrapport skapas:
```javascript
queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports"] });
queryClient.invalidateQueries({ queryKey: ["/api/monthly-reports", clientId] });
```

### När vimsa tid skapas:
```javascript
queryClient.invalidateQueries({ queryKey: ["/api/vimsa-time"] });
queryClient.invalidateQueries({ queryKey: ["/api/vimsa-time", clientId] });
```

## Felsökning - Vanliga problem

### Om POST blir 401 (Unauthorized):
1. **Kontrollera att du är inloggad**: Öppna webbläsarens Developer Tools → Application → Local Storage → `devToken`
2. **Kontrollera cookies**: Application → Cookies → `devToken`
3. **Testa login igen**: Logga ut och logga in igen
4. **Kontrollera API-anrop**: Network-fliken → Headers → `X-Dev-Token` och `Cookie`

### Om POST blir 400 (Bad Request):
1. **Kontrollera request body**: Network-fliken → Request → Payload
2. **Verifiera required fields**: Alla obligatoriska fält måste fyllas i
3. **Kontrollera data format**: Datum ska vara "YYYY-MM-DD", numbers ska vara numbers

### Om POST blir 403 (Forbidden):
1. **Kontrollera staff-scope**: Endast staff kan se sina egna klienter
2. **Verifiera staffId**: Klienter måste kopplas till rätt staff

### Om POST blir 500 (Internal Server Error):
1. **Kontrollera server logs**: Terminal A (API) visar felmeddelanden
2. **Kontrollera data**: Felaktig data kan orsaka server-fel
3. **Restarta servern**: `Ctrl+C` och `npm run dev:api` igen

### Om formulärfält är "låsta":
1. **Kontrollera React varningar**: Console → "value without onChange"
2. **Verifiera controlled inputs**: Alla inputs ska ha `value` och `onChange`
3. **Kontrollera React Hook Form**: `{...field}` spread operator

### Om listor inte uppdateras:
1. **Kontrollera React Query**: Console → React Query DevTools
2. **Verifiera invalidation keys**: Keys måste matcha UI-komponenter
3. **Kontrollera network requests**: Network-fliken → GET requests efter POST

### Om personal-listan saknas:
1. **Kontrollera `/api/staff` endpoint**: `curl http://127.0.0.1:3001/api/staff`
2. **Verifiera React Query key**: `["/api/staff"]`
3. **Kontrollera komponent**: Staff selector använder rätt endpoint

## Verifiering - Checklista

### ✅ API fungerar:
```bash
curl http://127.0.0.1:3001/api/health
# Svar: {"status":"ok","timestamp":"..."}
```

### ✅ Authentication fungerar:
```bash
curl -X POST http://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  --data '{"username":"admin","password":"admin123"}'
# Svar: {"token":"s_demo","user":{...}}
```

### ✅ Staff endpoint fungerar:
```bash
curl http://127.0.0.1:3001/api/staff
# Svar: [{"id":"s_demo","name":"Demo Personal",...}]
```

### ✅ Klient skapas:
```bash
curl -X POST http://127.0.0.1:3001/api/clients \
  -H "Content-Type: application/json" \
  -H "X-Dev-Token: s_demo" \
  --data '{"initials":"TEST","staffId":"s_demo","status":"active"}'
# Svar: {"id":"c_...","initials":"TEST",...}
```

### ✅ UI fungerar:
1. Öppna http://127.0.0.1:5175
2. Logga in med valfritt user/pass
3. Skapa klient → se toast + lista uppdateras
4. Skapa vårdplan → se toast + lista uppdateras
5. Inga React varningar i konsolen

## Snabb fix för vanliga problem

### Problem: "value without onChange" varningar
**Lösning**: Alla inputs ska ha:
```jsx
<Input 
  {...field} 
  value={field.value ?? ""} 
  onChange={field.onChange} 
/>
```

### Problem: "ws://localhost:undefined" fel
**Lösning**: WebSocket är redan disabled i dev mode. Ignorera detta fel.

### Problem: Personal-listan syns inte
**Lösning**: Kontrollera att `/api/staff` returnerar data och att komponenten använder rätt React Query key.

### Problem: Formulärfält är låsta
**Lösning**: Kontrollera att alla inputs använder React Hook Form korrekt med `{...field}` spread operator.

---

**Om problemet kvarstår**: Kör `./scripts/smoke-api.sh` för att verifiera att alla API-endpoints fungerar korrekt.
