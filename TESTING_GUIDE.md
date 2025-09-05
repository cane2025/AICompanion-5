# 🧪 TESTING GUIDE - UNGDOMS Öppenvård

## 🚀 **SNABBSTART FÖR TESTING**

### **1. STARTA SYSTEMET**

```bash
# Terminal 1: Starta backend
PORT=3001 NODE_ENV=development npm run dev

# Terminal 2: Starta frontend
npx vite --port 5175 --strictPort --host 127.0.0.1
```

### **2. ÖPPNA I WEBBLÄSARE**

- **URL:** http://127.0.0.1:5175
- **Login:** Använd vilket användarnamn/lösenord som helst (dev-mode)

---

## 📋 **MANUELL TESTING**

### **✅ TEST 1: LOGIN**

1. Öppna http://127.0.0.1:5175
2. Ange vilket användarnamn/lösenord
3. Klicka "Logga in"
4. **Förväntat resultat:** Du loggas in och ser dashboard

### **✅ TEST 2: PERSONALHANTERING**

1. I vänster panel, klicka "Lägg till personal"
2. Ange namn: "Test Person"
3. Klicka "Spara"
4. **Förväntat resultat:** Personen visas i listan (sorterad A-Ö)

### **✅ TEST 3: KLIENTHANTERING**

1. Klicka på en personal i vänster panel
2. Klicka "Lägg till klient"
3. Ange: Initialer "TP", Status "aktiv"
4. Klicka "Spara"
5. **Förväntat resultat:** Klienten skapas och visas

### **✅ TEST 4: VÅRDPLAN**

1. Klicka "Skapa vårdplan"
2. Välj personal och klient
3. Fyll i: Plan nummer "1", Mottagningsdatum (dagens datum)
4. Klicka "Spara vårdplan"
5. **Förväntat resultat:** Vårdplan skapas, Implementation Plan öppnas automatiskt

### **✅ TEST 5: GENOMFÖRANDEPLAN**

1. I Implementation Plan-dialogen
2. Välj klient
3. Fyll i: Plan referens "GFP-001"
4. Klicka "Spara"
5. **Förväntat resultat:** Genomförandeplan skapas

### **✅ TEST 6: VECKODOKUMENTATION**

1. Klicka "Skapa Veckodokumentation"
2. Välj klient
3. Kryssa i några dagar (MÅN-SÖN)
4. Skriv dokumentation: "Test veckodokumentation"
5. Klicka "Spara"
6. **Förväntat resultat:** Veckodokumentation skapas

### **✅ TEST 7: MÅNADSRAPPORT**

1. Klicka "Skapa Månadsrapport"
2. Välj klient
3. Fyll i: Månad/år, rapporttext "Test månadsrapport"
4. Kryssa i "Godkänd"
5. Klicka "Spara"
6. **Förväntat resultat:** Månadsrapport skapas

### **✅ TEST 8: VIMSA TID**

1. Klicka "Skapa Visma Tid"
2. Välj klient
3. Ange: Timmar "8", kryssa i "Godkänd"
4. Klicka "Spara"
5. **Förväntat resultat:** Visma tid skapas

---

## 🔧 **AUTOMATISERAD TESTING**

### **Smoke Test (API)**

```bash
# Kör automatiserad API-test
npm run smoke
```

### **Browser Console Test**

```javascript
// Kör detta i browser console när du är inloggad
const API_BASE = "http://127.0.0.1:3001/api";
const TOKEN = "s_demo";

async function testAllFunctions() {
  console.log("🧪 Starting comprehensive test suite...\n");

  // Test 1: Create Client
  console.log("📝 Test 1: Creating client...");
  const clientRes = await fetch(`${API_BASE}/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Dev-Token": TOKEN,
    },
    body: JSON.stringify({
      initials: "TEST",
      personnummer: "20000101-0000",
      status: "active",
    }),
  });

  if (!clientRes.ok) throw new Error(`Status: ${clientRes.status}`);
  const client = await clientRes.json();
  console.log("✅ Client created:", client.id);

  // Test 2: Create Care Plan
  console.log("📝 Test 2: Creating care plan...");
  const carePlanRes = await fetch(`${API_BASE}/care-plans`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Dev-Token": TOKEN,
    },
    body: JSON.stringify({
      clientId: client.id,
      name: "Test Vårdplan",
      description: "Test beskrivning",
      startDate: new Date().toISOString(),
      goals: ["Mål 1", "Mål 2"],
      activities: ["Aktivitet 1", "Aktivitet 2"],
    }),
  });

  if (!carePlanRes.ok) throw new Error(`Status: ${carePlanRes.status}`);
  const carePlan = await carePlanRes.json();
  console.log("✅ Care plan created:", carePlan.id);

  console.log("\n🎉 All tests passed!");
}

testAllFunctions();
```

---

## 🧪 **WRAP.DEV TESTING**

### **Setup Wrap.dev Agent**

1. Gå till https://wrap.dev
2. Skapa ny agent
3. **Agent Name:** "UNGDOMS Öppenvård Tester"
4. **Target URL:** http://127.0.0.1:5175
5. **Instructions:** Se `WRAP_QUICK_START.md`

### **Test Scenario**

```yaml
Scenario: Complete Healthcare Workflow
1. Login with any credentials
2. Add new staff member
3. Create new client
4. Create care plan
5. Create implementation plan
6. Create weekly documentation
7. Create monthly report
8. Create Visma time entry
9. Verify all data is saved
```

---

## 🔍 **DEBUGGING**

### **Backend Logs**

```bash
# Se backend logs
tail -f /tmp/api.log
```

### **Frontend Console**

```bash
# Öppna browser console (F12)
# Se för fel och warnings
```

### **Network Tab**

```bash
# I browser, öppna Network tab
# Se API-anrop och responses
```

---

## 📊 **PERFORMANCE TESTING**

### **Bundle Analysis**

```bash
# Analysera bundle storlek
npm run build
# Öppna reports/bundle-analyze.html
```

### **API Performance**

```bash
# Testa API-svarstid
curl -w "@curl-format.txt" -o /dev/null -s "http://127.0.0.1:3001/api/health"
```

---

## 🐛 **FELSÖKNING**

### **Vanliga Problem**

#### **Problem: "Port already in use"**

```bash
# Lösning:
pkill -f "tsx.*server/index"
pkill -f "vite"
```

#### **Problem: "Cannot find module"**

```bash
# Lösning:
npm install
npm run check
```

#### **Problem: "Login not working"**

```bash
# Lösning:
# Kontrollera att backend körs på port 3001
curl http://127.0.0.1:3001/api/health
```

#### **Problem: "White screen"**

```bash
# Lösning:
# Öppna browser console (F12)
# Se för JavaScript-fel
# Kontrollera att frontend körs på port 5175
```

---

## ✅ **TESTING CHECKLIST**

### **Funktionalitet**

- [ ] Login fungerar
- [ ] Staff CRUD fungerar
- [ ] Client CRUD fungerar
- [ ] Care Plan CRUD fungerar
- [ ] Implementation Plan CRUD fungerar
- [ ] Weekly Documentation CRUD fungerar
- [ ] Monthly Report CRUD fungerar
- [ ] Visma Time CRUD fungerar

### **UI/UX**

- [ ] Alla formulär har "Spara"-knappar
- [ ] Controlled inputs fungerar
- [ ] Datumfält fungerar
- [ ] Inga vita sidor
- [ ] Navigation fungerar
- [ ] Responsive design

### **Performance**

- [ ] Snabb laddning
- [ ] Smooth navigation
- [ ] Inga console-fel
- [ ] API-anrop fungerar

---

## 🎯 **SLUTSATS**

**För att testa systemet:**

1. **Starta servrarna** (se Snabbstart)
2. **Öppna webbläsare** på http://127.0.0.1:5175
3. **Logga in** med vilka credentials som helst
4. **Testa alla funktioner** enligt manuell testing
5. **Kör automatiserade tester** om önskat
6. **Använd Wrap.dev** för AI-powered testing

**Systemet är redo för omfattande testing! 🚀**


