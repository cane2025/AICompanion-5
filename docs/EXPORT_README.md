# AICompanion-5 - Komplett Systemexport

## 🏗️ Systemarkitektur

### Frontend (React + TypeScript + Vite)
- **Framework**: React 18 med TypeScript
- **Build Tool**: Vite med hot reload
- **UI Library**: Shadcn/ui (Radix UI komponenter)
- **State Management**: React Query (TanStack Query)
- **Styling**: Tailwind CSS

### Backend (Node.js + Express + TypeScript)
- **Runtime**: Node.js med TypeScript (tsx)
- **Framework**: Express.js
- **Authentication**: JWT tokens
- **Validation**: Zod schemas
- **Data Storage**: JSON-filer (dev) / PostgreSQL (prod)

## 📁 Kritiska Filer & Struktur

### 1. Autentisering & Säkerhet
```
server/auth/jwt.ts              # JWT token hantering
server/routes/auth.ts           # Login/logout endpoints
server/validation.ts            # Server-side validation
client/src/shared/validation.ts # Client-side validation
client/src/components/Login.tsx # Login UI
```

### 2. API & Datahantering
```
client/src/lib/queryClient.ts   # React Query setup + API client
client/src/lib/api.ts           # API funktioner
server/routes.ts                # Backend API endpoints
server/store.ts                 # Data persistence
```

### 3. Dashboard & Navigation
```
client/src/App.tsx              # Huvudapp + navigation state
client/src/pages/dashboard.tsx  # Dashboard komponent
client/src/components/staff-client-management.tsx # Huvudvy
client/src/components/staff-sidebar.tsx # Navigation
```

### 4. CRUD-operationer
```
client/src/features/carePlans/          # Vårdplaner
client/src/features/implementationPlans/ # Genomförandeplaner
client/src/features/weeklyDocs/         # Veckodokumentation
client/src/features/reports/            # Månadsrapporter
client/src/features/vimsa/              # Vimsa tid
```

### 5. Komponenter & UI
```
client/src/components/ui/               # Shadcn/ui komponenter
client/src/components/ErrorBoundary.tsx # Felhantering
client/src/components/LoadingSpinner.tsx # Laddningsindikatorer
client/src/components/SearchAndFilter.tsx # Sök & filtrering
```

## 🔧 Konfiguration

### Vite Config (Frontend)
```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./client/src/shared"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
});
```

### Express Config (Backend)
```typescript
// server/index.ts
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", devRoutes);
```

## 🚀 Starta Systemet

### Development
```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend  
npm run dev:client
```

### Production
```bash
npm run build
npm start
```

## 📊 Dataflöde & Skalbarhet

### 1. React Query Caching
- **Stale Time**: 5 minuter
- **Cache Time**: 10 minuter
- **Background Refetch**: Automatisk
- **Optimistic Updates**: Omedelbar UI feedback

### 2. Error Handling
- **Error Boundaries**: Fångar React-fel
- **Toast Notifications**: Användarfeedback
- **Retry Logic**: Automatiska återförsök
- **Fallback UI**: Graceful degradation

### 3. Performance Optimering
- **Code Splitting**: Lazy loading av komponenter
- **Memoization**: React.memo för tunga komponenter
- **Bundle Analysis**: Visualizer för storlek
- **Image Optimization**: Vite plugin

## 🔐 Säkerhet

### JWT Authentication
```typescript
// Token generation
const token = generateToken({
  userId: user.id,
  role: user.role,
  staffId: user.staffId,
});

// Token verification
const payload = verifyToken(token);
```

### Input Validation
```typescript
// Zod schemas för alla inputs
export const loginSchema = z.object({
  username: z.string().min(1, "Användarnamn krävs"),
  password: z.string().min(1, "Lösenord krävs"),
});
```

### Security Headers
```typescript
// CSP, XSS Protection, CSRF
res.setHeader("X-XSS-Protection", "1; mode=block");
res.setHeader("X-Frame-Options", "DENY");
res.setHeader("Content-Security-Policy", "...");
```

## 📈 Skalbarhet & Prestanda

### 1. Database Migration Ready
```sql
-- PostgreSQL schema för produktion
CREATE TABLE care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  title VARCHAR(255) NOT NULL,
  goals TEXT,
  interventions TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES staff(id),
  version INT DEFAULT 1,
  deleted_at TIMESTAMP,
  audit_log JSONB DEFAULT '[]'::jsonb
);
```

### 2. Offline-First Architecture
```typescript
// IndexedDB för offline support
const db = await openDB('CareDB', 1, {
  upgrade(db) {
    db.createObjectStore('carePlans', { keyPath: 'id' });
    db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
  },
});
```

### 3. Real-time Updates
```typescript
// WebSocket för live updates
socket.on('carePlanUpdated', (data) => {
  queryClient.invalidateQueries(['carePlans', data.clientId]);
  toast.info(`${data.updatedBy} uppdaterade vårdplanen`);
});
```

## 🧪 Testing & Monitoring

### Error Tracking
```typescript
// Sentry integration
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Performance Monitoring
```typescript
// Web Vitals tracking
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
```

## 📋 Deployment Checklist

### Security
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Database credentials secured
- [ ] Rate limiting configured
- [ ] CORS properly configured

### Performance
- [ ] Bundle size optimized
- [ ] Images compressed
- [ ] CDN configured
- [ ] Caching headers set
- [ ] Database indexes created

### Monitoring
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Log aggregation setup
- [ ] Health checks implemented
- [ ] Alerting configured

## 🔄 Uppdateringar & Underhåll

### 1. Dependency Updates
```bash
# Säkerhetsuppdateringar
npm audit fix

# Major version updates
npm update

# Bundle analysis
npm run analyze
```

### 2. Database Migrations
```bash
# Schema changes
npm run migrate

# Data seeding
npm run seed
```

### 3. Performance Monitoring
```bash
# Bundle analysis
npm run build:analyze

# Lighthouse audit
npm run lighthouse
```

## 📞 Support & Dokumentation

### API Documentation
- **Health Check**: `GET /api/health`
- **Authentication**: `POST /api/auth/login`
- **Care Plans**: `GET/POST/PUT/DELETE /api/care-plans`
- **Implementation Plans**: `GET/POST/PUT/DELETE /api/implementation-plans`

### Error Codes
- **401**: Unauthorized (login required)
- **403**: Forbidden (insufficient permissions)
- **404**: Resource not found
- **422**: Validation error
- **500**: Internal server error

### Logging
```typescript
// Structured logging
logger.info('User logged in', {
  userId: user.id,
  role: user.role,
  timestamp: new Date().toISOString(),
});
```

---

**Detta system är designat för att vara skalbart, säkert och underhållbart för långsiktig användning i produktionsmiljö.**
