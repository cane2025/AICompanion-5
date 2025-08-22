# 🚀 WRAP.DEV QUICK START - UNGDOMS Öppenvård

## ⚡ **SNABB SETUP FÖR WRAP.DEV**

### **1. Klona & Starta**
```bash
# I Wrap.dev terminal
git clone https://github.com/cane2025/AICompanion-5.git
cd AICompanion-5
git checkout chore/repo-cleanup
npm install
```

### **2. Starta Servrar (2 terminaler)**
```bash
# Terminal 1 - Backend
PORT=3001 NODE_ENV=development npm run dev

# Terminal 2 - Frontend  
npx vite --port 5175 --strictPort --host 127.0.0.1
```

### **3. Wrap.dev Agent URL**
```
http://127.0.0.1:5175
```

---

## 🤖 **WRAP.DEV AGENT INSTRUKTIONER**

### **Agent Task: Komplett Systemtest**
```
URL: http://127.0.0.1:5175

Scenario: Testa hela vårdflödet från login till dokumentation

Steg:
1. INLOGGNING
   - Gå till http://127.0.0.1:5175
   - Skriv valfritt användarnamn (t.ex. "testuser") 
   - Skriv valfritt lösenord (t.ex. "testpass")
   - Klicka "Logga in"
   - Förväntat: Behandlarlista visas till vänster

2. VÄLJ BEHANDLARE
   - Klicka på en behandlare från listan (t.ex. "Anna Behandlare")
   - Förväntat: Behandlaren blir markerad/aktiv

3. SKAPA VÅRDPLAN
   - Klicka "Skapa vårdplan" knappen
   - Fyll i formulär:
     * Behandlare: Välj från dropdown
     * Klient: Skriv "TC" (testklient)
     * Vårdplansnummer: "1"
     * Mottagningsdatum: Välj dagens datum
   - Klicka "Spara vårdplan" (VIKTIGT: denna knapp ska vara type="submit")
   - Förväntat: Success-meddelande + Genomförandeplan öppnas automatiskt

4. GENOMFÖRANDEPLAN (GFP)
   - Verifiera att GFP-dialog öppnades automatiskt
   - Fyll i administrativa fält:
     * Vilken genomförandeplan: "Plan 1"
     * Datum skickad: Välj datum
     * Datum klar: Välj datum  
     * Bocka i några uppföljningar (1-6)
     * Kommentarer: "Test GFP"
   - Klicka "Spara"
   - Förväntat: Sparas utan fel

5. VECKODOKUMENTATION
   - Klicka "Veckodokumentation"
   - Välj klient från dropdown
   - Verifiera att ALLA dagar visas: Måndag, Tisdag, Onsdag, Torsdag, Fredag, Lördag, Söndag
   - Bocka i några dagar
   - Skriv dokumentation
   - Klicka "Spara dokumentation"
   - Förväntat: Sparas och visas i listan

6. MÅNADSRAPPORT
   - Klicka "Månadsrapport"
   - Skapa ny rapport
   - Sätt status till "Godkänd" (INTE gammal "Status" dropdown)
   - Spara
   - Testa att redigera rapporten
   - Ändra status till "Ej godkänd"
   - Spara ändringar
   - Förväntat: Full CRUD fungerar, rätt status-fält

7. VISMA TID
   - Klicka "Visma Tid"
   - Välj klient
   - Ange arbetade timmar (t.ex. 8)
   - Bocka "Godkänd"
   - Bocka "Stämmer med dokumentation"
   - Lägg till kommentar
   - Spara
   - Förväntat: Nya fält fungerar korrekt

8. NAVIGATION
   - Navigera mellan olika vyer
   - Gå tillbaka till översikt
   - Förväntat: Inga blanka sidor, ingen utloggning

Framgångskriterier:
✅ Login fungerar med valfria credentials
✅ Behandlarlista visas och är klickbar
✅ Vårdplan sparas och GFP öppnas automatiskt
✅ Alla 7 dagar visas i veckodokumentation
✅ Månadsrapport har "Godkänd/Ej godkänd" status
✅ Visma Tid har "stämmer/inte stämmer" checkbox
✅ Navigation fungerar utan blanka sidor
✅ Inga fel i browser console
```

---

## 🔧 **TROUBLESHOOTING FÖR WRAP.DEV**

### **Om servrar inte startar:**
```bash
# Döda gamla processer
pkill -f "vite" && pkill -f "tsx"
sleep 2

# Starta igen
PORT=3001 NODE_ENV=development npm run dev &
npx vite --port 5175 --strictPort --host 127.0.0.1 &
```

### **Om ports är upptagna:**
```bash
# Hitta process på port 5175
lsof -ti:5175 | xargs kill -9

# Hitta process på port 3001  
lsof -ti:3001 | xargs kill -9
```

### **API Health Check:**
```bash
curl http://127.0.0.1:3001/api/health
# Förväntat: {"ok":true}
```

---

## 📝 **WRAP.DEV SUCCESS METRICS**

Agenten ska rapportera:
- ✅ **Login Rate**: 100% (alla credentials fungerar)
- ✅ **Navigation Success**: 100% (inga blanka sidor)
- ✅ **Form Submission**: 100% (alla Spara-knappar fungerar)  
- ✅ **Auto-Navigation**: Vårdplan → GFP öppnas automatiskt
- ✅ **CRUD Operations**: Create/Read/Update/Delete för alla entiteter
- ✅ **Data Persistence**: Alla ändringar sparas
- ✅ **UI Correctness**: Rätt etiketter och fält visas

**🎯 Detta är ett 100% funktionellt system redo för Wrap.dev-testning!**
