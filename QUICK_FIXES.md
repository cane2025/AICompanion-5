# 🚨 QUICK FIXES - Omedelbara åtgärder

## 🔴 AKUT - Fixa nu!

### 1. JWT Authentication (30 min)

```bash
# Installera dependencies
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
```

```typescript
// server/auth/jwt.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

### 2. Input Validation med Zod (15 min)

```bash
npm install zod
```

```typescript
// shared/validation.ts
import { z } from "zod";

export const carePlanSchema = z.object({
  title: z.string().min(1, "Titel krävs").max(255, "Titel för lång"),
  goals: z.array(z.string().min(1, "Mål krävs")),
  interventions: z.string().max(1000, "Interventioner för långa"),
  status: z.enum(["draft", "active", "completed"]),
  clientId: z.string().uuid("Ogiltigt klient-ID"),
  staffId: z.string().uuid("Ogiltigt personal-ID"),
});

export const validateCarePlan = (data: any) => {
  return carePlanSchema.parse(data);
};
```

### 3. Error Boundaries (10 min)

```typescript
// client/src/components/ErrorBoundary.tsx
import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Skicka till Sentry här
  }

  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback = ({ error }: { error: Error }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded">
    <h2 className="text-red-800 font-semibold">Något gick fel</h2>
    <p className="text-red-600 text-sm">{error.message}</p>
    <button
      onClick={() => window.location.reload()}
      className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Ladda om sidan
    </button>
  </div>
);
```

### 4. Loading States (10 min)

```typescript
// client/src/components/LoadingSpinner.tsx
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Laddar...</span>
  </div>
);

// Använd i komponenter
const { data, isLoading } = useQuery(["carePlans"], fetchCarePlans);

if (isLoading) return <LoadingSpinner />;
```

## 🟡 SÄKERHET - Fixa inom 24h

### 1. Rate Limiting

```bash
npm install express-rate-limit
```

```typescript
// server/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuter
  max: 5, // max 5 försök
  message: "För många inloggningsförsök, försök igen senare",
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // max 100 requests per 15 min
});
```

### 2. Security Headers

```typescript
// server/middleware/security.ts
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

### 3. CSRF Protection

```bash
npm install csurf
```

```typescript
// server/middleware/csrf.ts
import csrf from "csurf";

const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## 🟠 PRESTANDA - Fixa inom veckan

### 1. Code Splitting

```typescript
// client/src/App.tsx
import { lazy, Suspense } from "react";

const CarePlanList = lazy(() => import("./features/carePlans/CarePlanList"));
const ClientDetailView = lazy(() => import("./pages/ClientDetailView"));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Router>
        <Routes>
          <Route path="/care-plans" element={<CarePlanList />} />
          <Route path="/client/:id" element={<ClientDetailView />} />
        </Routes>
      </Router>
    </Suspense>
  );
}
```

### 2. Bundle Analysis

```bash
npm install --save-dev webpack-bundle-analyzer
```

```json
// package.json
{
  "scripts": {
    "analyze": "npm run build && npx webpack-bundle-analyzer dist/stats.json"
  }
}
```

### 3. Image Optimization

```bash
npm install vite-plugin-imagemin
```

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { ViteImageOptimize } from "vite-plugin-imagemin";

export default defineConfig({
  plugins: [
    ViteImageOptimize({
      gifsicle: { optimizationLevel: 7 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.65, 0.8] },
      svgo: {
        plugins: [
          { name: "removeViewBox", active: false },
          { name: "removeEmptyAttrs", active: false },
        ],
      },
    }),
  ],
});
```

## 🔵 MONITORING - Fixa inom veckan

### 1. Error Tracking

```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// client/src/utils/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### 2. Performance Monitoring

```bash
npm install web-vitals
```

```typescript
// client/src/utils/analytics.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric: any) {
  console.log(metric);
  // Skicka till analytics service
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## 📋 EXECUTION PLAN

### Dag 1 (4 timmar)

1. ✅ Fixa duplicerade exports (30 min)
2. 🔐 Implementera JWT auth (2 timmar)
3. ✅ Input validation med Zod (1 timme)
4. 🛡️ Error boundaries (30 min)

### Dag 2 (4 timmar)

1. 🔒 Rate limiting (1 timme)
2. 🛡️ Security headers (1 timme)
3. 🔒 CSRF protection (1 timme)
4. 📊 Loading states (1 timme)

### Dag 3 (4 timmar)

1. ⚡ Code splitting (2 timmar)
2. 📦 Bundle optimization (1 timme)
3. 🖼️ Image optimization (1 timme)

### Dag 4 (4 timmar)

1. 📊 Error tracking (2 timmar)
2. 📈 Performance monitoring (1 timme)
3. 🧪 Unit tests (1 timme)

**Total tid: 16 timmar för att göra systemet production-ready!** 🚀
