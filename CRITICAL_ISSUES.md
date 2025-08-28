# KRITISKA PROBLEM - Teknisk Specifikation

## 🚨 AKUT: Duplicerade API Exports

### Problem

Fil: `client/src/lib/api.ts`
Flera Vimsa Time API-funktioner är duplicerade vilket orsakar kompileringsfel.

### Teknisk Detalj

```typescript
// FEL: Dessa funktioner finns två gånger i samma fil
export const getVimsaTime = (): Promise<any[]> => ...
export const getVimsaTimeByClient = (clientId: string): Promise<any[]> => ...
export const createVimsaTime = (data: any): Promise<any> => ...
export const updateVimsaTime = (id: string, data: any): Promise<any> => ...
export const deleteVimsaTime = (id: string): Promise<void> => ...
```

### Lösning

1. Öppna `client/src/lib/api.ts`
2. Sök efter alla förekomster av "Vimsa Time API"
3. Ta bort alla duplicerade funktioner
4. Behåll bara EN uppsättning av funktionerna (rad ~297-354)

### Verifiering

```bash
# Kontrollera att det bara finns en uppsättning
grep -n "export const getVimsaTime" client/src/lib/api.ts
# Bör visa bara EN rad
```

## 🔧 SelectItem Tomma Värden (FIXAT)

### Problem

Radix UI Select-komponenter tillåter inte tomma strängar som värden.

### Lösning Implementerad

```typescript
// FÖRE (FEL)
<SelectItem value="">Alla</SelectItem>

// EFTER (KORREKT)
<SelectItem value="all">Alla</SelectItem>
```

### Logik Uppdatering

```typescript
// FÖRE
value={filters.status || ""}
onValueChange={(value) => onFiltersChange({ ...filters, status: value || undefined })}

// EFTER
value={filters.status || "all"}
onValueChange={(value) => onFiltersChange({ ...filters, status: value === "all" ? undefined : value })}
```

## 📁 Filstruktur - Kritiska Komponenter

### SearchAndFilter.tsx

**Plats**: `client/src/components/SearchAndFilter.tsx`
**Syfte**: Universell sök- och filterkomponent
**Används av**: CarePlanList, ImplementationPlanList, etc.

### ClientDetailView.tsx

**Plats**: `client/src/pages/ClientDetailView.tsx`
**Syfte**: Huvudvy för klientdetaljer med tabs
**Komponenter**:

- CarePlanList
- ImplementationPlanList
- WeeklyDocumentation
- MonthlyReport
- VimsaIntegration

### API Integration

**Plats**: `client/src/features/*/api.ts`
**Problem**: Importerar från fel plats
**Lösning**: Ändra från `@/lib/api` till `@/lib/queryClient`

## 🔍 Debugging Kommandon

### Port Problem

```bash
# Hitta process som använder port
lsof -i :5175
lsof -i :3001

# Döda process
kill -9 <PID>
```

### Cache Problem

```bash
# Rensa Vite cache
rm -rf node_modules/.vite
rm -rf client/.vite

# Rensa TypeScript cache
rm -rf client/tsconfig.tsbuildinfo
```

### TypeScript Fel

```bash
# Kontrollera TypeScript
npx tsc --noEmit

# Kontrollera specifik fil
npx tsc --noEmit client/src/lib/api.ts
```

## 🎯 Prioriterade Åtgärder

### 1. AKUT (Måste fixas NU)

- [ ] Ta bort duplicerade Vimsa Time exports i api.ts
- [ ] Verifiera att alla SelectItem har icke-tomma värden
- [ ] Testa att applikationen startar utan fel

### 2. HÖG (Fixas inom 24h)

- [ ] Implementera proper error boundaries
- [ ] Lägg till loading states för alla API-anrop
- [ ] Validera alla API endpoints

### 3. MEDEL (Fixas inom veckan)

- [ ] Implementera proper authentication
- [ ] Lägg till unit tester
- [ ] Optimera prestanda

## 📊 API Endpoint Status

### Fungerar

- ✅ Health check: `GET /api/health`
- ✅ Care plans: `GET /api/care-plans/all`
- ✅ Care plans by client: `GET /api/care-plans/client/:clientId`

### Behöver Testas

- ⚠️ Implementation plans
- ⚠️ Weekly documentation
- ⚠️ Monthly reports
- ⚠️ Vimsa time

## 🔧 Konfiguration

### Vite Proxy

```typescript
proxy: {
  "/api": {
    target: "http://127.0.0.1:3001",
    changeOrigin: true,
    secure: false,
  },
}
```

### TypeScript Paths

```json
{
  "paths": {
    "@/*": ["./client/src/*"],
    "@shared/*": ["./shared/*"]
  }
}
```

## 🚀 Deployment Checklist

### Pre-deployment

- [ ] Alla TypeScript-fel fixade
- [ ] Inga duplicerade exports
- [ ] Alla API endpoints testade
- [ ] Error boundaries implementerade
- [ ] Loading states tillagda

### Post-deployment

- [ ] Verifiera att applikationen startar
- [ ] Testa alla CRUD-operationer
- [ ] Kontrollera att sökning/filtrering fungerar
- [ ] Validera att navigation fungerar
- [ ] Testa error handling

## 📝 Noteringar

- Projektet använder custom navigation (inte React Router)
- All data sparas lokalt i dev mode
- Frontend och backend körs på separata portar
- React Query används för state management
- Shadcn/ui för UI komponenter
