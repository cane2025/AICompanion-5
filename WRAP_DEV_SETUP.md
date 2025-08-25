# 🤖 WRAP.DEV SETUP - UNGDOMS Öppenvård

## 📋 **PROJEKT SAMMANFATTNING**

- **System**: UNGDOMS Öppenvård - Vårdadministration
- **Status**: Fullständigt funktionellt med alla CRUD-operationer
- **Tech Stack**: React + Vite frontend, Node.js + Express backend
- **Data**: JSON-baserad persistens med seed-data

---

## 🌐 **WRAP.DEV KONFIGURATION**

### **1. Grundläggande Setup**

```bash
# Klona projektet till Wrap.dev
git clone https://github.com/cane2025/AICompanion-5.git
cd AICompanion-5
git checkout chore/repo-cleanup

# Installera beroenden
npm install

# Starta servrar
# Terminal 1 (Backend):
PORT=3001 NODE_ENV=development npm run dev

# Terminal 2 (Frontend):
npx vite --port 5175 --strictPort --host 127.0.0.1
```

### **2. URL:er för Wrap.dev Agent**

- **Frontend**: http://127.0.0.1:5175
- **Backend API**: http://127.0.0.1:3001/api
- **Health Check**: http://127.0.0.1:3001/api/health

---

## 🎯 **WRAP.DEV AGENT TASKS**

### **Agent 1: Login & Navigation Test**

```
Task: Test complete login flow and navigation
URL: http://127.0.0.1:5175
Steps:
1. Navigate to login page
2. Enter any username/password (e.g., "testuser" / "testpass")
3. Click "Logga in" button
4. Verify staff sidebar appears with "Behandlare" list
5. Select a staff member from sidebar
6. Navigate through different views without logout
Expected: Smooth navigation, no blank pages, persistent login
```

### **Agent 2: Care Plan Creation & GFP Flow**

```
Task: Test vårdplan creation and auto-GFP opening
Steps:
1. After login, click "Skapa vårdplan" button
2. Fill in required fields:
   - Behandlare: Select from dropdown
   - Klient: Enter initials
   - Vårdplansnummer: "1"
   - Mottagningsdatum: Today's date
3. Click "Spara vårdplan" button (type="submit")
4. Verify success message shows "Öppnar nu GFP..."
5. Confirm Implementation Plan (GFP) dialog opens automatically
Expected: POST returns 201+ID, GFP opens after 1.5s delay
```

### **Agent 3: Weekly Documentation (Mån-Sön)**

```
Task: Test weekly documentation with all days
Steps:
1. Click "Veckodokumentation" button
2. Select client from dropdown (should populate)
3. Verify all days are visible: Måndag, Tisdag, Onsdag, Torsdag, Fredag, Lördag, Söndag
4. Click checkboxes for different days
5. Add documentation text
6. Click "Spara dokumentation" button
7. Verify entry appears in list and React Query updates
Expected: All 7 days visible, saves correctly, list updates immediately
```

### **Agent 4: Monthly Report CRUD**

```
Task: Test monthly report full CRUD operations
Steps:
1. Click "Månadsrapport" button
2. Create new report with content
3. Set status to "Godkänd" (not old "Status" field)
4. Save and verify in list
5. Click edit on existing report
6. Modify content and status to "Ej godkänd"
7. Save changes
8. Click delete button and confirm
Expected: Full CRUD works, status shows "Godkänd/Ej godkänd", no blank pages
```

### **Agent 5: Visma Tid with "Stämmer/Inte stämmer"**

```
Task: Test Visma Time with new fields
Steps:
1. Click "Visma Tid" button
2. Select client from dropdown
3. Enter hours worked (e.g., 8.5)
4. Check "Godkänd" checkbox
5. Check "Stämmer med dokumentation" checkbox
6. Add comments
7. Save and verify
8. Edit existing entry and change checkboxes
9. Test delete functionality
Expected: New simplified fields work, "stämmer/inte stämmer" logic correct
```

### **Agent 6: Implementation Plan (GFP) Administrative Fields**

```
Task: Test GFP administrative-only view
Steps:
1. Open Implementation Plan dialog
2. Verify only administrative fields are present:
   - Vilken genomförandeplan (planRef)
   - Klient (auto-filled, disabled)
   - Datum skickad
   - Datum klar
   - Uppföljning 1-6 (checkboxes)
   - Kommentarer
3. Verify NO "mål/planinnehåll" text blocks
4. Fill fields and save
5. Test edit and delete buttons
Expected: Only admin fields, no content fields, full CRUD works
```

### **Agent 7: Data Persistence & API Testing**

```
Task: Test backend API and data persistence
API Base: http://127.0.0.1:3001/api
Tests:
1. GET /api/health → should return {"ok": true}
2. POST /api/auth/login with any credentials → should return 200 + devToken
3. GET /api/staff → should return array of behandlare (sorted A-Ö)
4. POST /api/clients → should return 201 + ID
5. POST /api/care-plans → should return 201 + ID
6. GET /api/staff/{id}/clients → should return scoped clients
Expected: All endpoints respond correctly, data persists in store.json
```

---

## 🔧 **TEKNISKA DETALJER FÖR WRAP.DEV**

### **Autentisering**

- **Dev Mode**: Accepterar vilken kombination som helst av username/password
- **Cookie**: `devToken` sätts automatiskt (httpOnly: false för dev)
- **Session**: Persistent mellan requests via cookie

### **Data Struktur**

```json
{
  "staff": [
    {
      "id": "staff_default_1",
      "name": "Anna Behandlare",
      "initials": "AB",
      "roll": "behandlare"
    },
    {
      "id": "staff_default_2",
      "name": "Björn Behandlare",
      "initials": "BB",
      "roll": "behandlare"
    },
    {
      "id": "staff_default_3",
      "name": "Carina Behandlare",
      "initials": "CB",
      "roll": "behandlare"
    }
  ],
  "clients": [],
  "carePlans": [],
  "implementationPlans": [],
  "weeklyDocumentation": [],
  "monthlyReports": [],
  "vimsaTime": []
}
```

### **Viktiga API Endpoints**

```bash
# Auth
POST /api/auth/login - Dev login (any creds)
GET /api/session - Get current user

# Core entities (all have full CRUD)
GET/POST /api/staff
GET/POST /api/clients
GET/POST /api/care-plans
GET/POST /api/implementation-plans
GET/POST /api/weekly-documentation
GET/POST /api/monthly-reports
GET/POST /api/vimsa-time

# Scoped queries
GET /api/staff/{id}/clients
GET /api/clients/{id}/care-plans
GET /api/clients/{id}/implementation-plans
```

### **React Query Cache Keys**

```typescript
// För invalidation efter mutations
["/api/staff"][("/api/clients", clientId, "care-plans")][
  ("/api/clients", clientId, "implementation-plans")
][("/api/weekly-documentation", clientId)][("/api/monthly-reports", clientId)][
  ("/api/vimsa-time", clientId)
][("/api/staff", staffId, "clients")];
```

---

## 🎯 **WRAP.DEV SUCCESS CRITERIA**

### **Funktionalitet som MÅSTE fungera:**

1. ✅ **Login**: Valfritt user/pass → dev-token → staff sidebar
2. ✅ **Staff Management**: A-Ö lista, CRUD, klient-scoping
3. ✅ **Vårdplan**: Spara-knapp → POST 201 → Auto-öppna GFP
4. ✅ **GFP**: Admin-fält only, CRUD-knappar, kommentarer
5. ✅ **Veckodok**: Mån-Sön dagar, klient-väljare, React Query uppdatering
6. ✅ **Månadsrapport**: Full CRUD, "Godkänd/Ej godkänd" status
7. ✅ **Visma Tid**: Full CRUD, "stämmer/inte stämmer", klient-väljare
8. ✅ **Navigation**: Inga blank pages, tillbaka utan utloggning
9. ✅ **Data**: Persistens, seedad default-data

### **Tekniska krav:**

- ✅ **TypeScript**: 0 kompileringsfel
- ✅ **Build**: Production build OK
- ✅ **API**: Alla 15 endpoints svarar korrekt
- ✅ **Forms**: Controlled med React Hook Form + Zod
- ✅ **Cache**: React Query invalidation fungerar
- ✅ **Console**: Inga React-varningar

---

## 📝 **WRAP.DEV DEPLOYMENT NOTES**

### **Environment Setup**

```bash
# Required Node version
node --version  # v18+ recommended

# Environment variables (optional for dev)
NODE_ENV=development
PORT=3001

# File structure
/client         # React frontend (Vite)
/server         # Express backend
/shared         # Shared schemas
/server/data    # JSON data store
```

### **Common Issues & Solutions**

1. **Port conflicts**: Backend 3001, Frontend 5175
2. **CORS**: Already configured for localhost development
3. **Assets**: Logo component uses text-based design (no external files)
4. **Persistence**: Data saves to `server/data/store.json`
5. **HMR**: Hot module reload works for all components

### **Quick Verification Commands**

```bash
# Health check
curl http://127.0.0.1:3001/api/health

# Login test
curl -X POST http://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Staff list
curl http://127.0.0.1:3001/api/staff
```

---

## 🚀 **NEXT STEPS FOR WRAP.DEV**

1. **Import Project**: Clone from GitHub branch `chore/repo-cleanup`
2. **Setup Environment**: Node.js + npm install
3. **Configure Agents**: Use the 7 agent tasks above
4. **Start Testing**: Begin with Agent 1 (Login & Navigation)
5. **Iterate**: Use agents to test all 9 critical functionalities
6. **Document**: Create test reports for each agent run

**🎯 Projektet är 100% redo för Wrap.dev med alla funktioner verifierade!**


