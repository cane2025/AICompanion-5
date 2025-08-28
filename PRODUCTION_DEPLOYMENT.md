# 🚀 PRODUKTIONSDEPLOYMENT - UNGDOMS Öppenvård

## 📋 **PRODUKTIONSFÖRBEREDELSER**

### **1. Miljövariabler (.env.production)**

```bash
# Skapa .env.production
NODE_ENV=production
PORT=3001
DATABASE_URL=your_production_database_url
SESSION_SECRET=your_very_long_random_session_secret_here
JWT_SECRET=your_very_long_random_jwt_secret_here
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=info
ENABLE_AUDIT_LOGS=true
STORAGE_PATH=/var/lib/ungdoms-oppenvard/data
BACKUP_PATH=/var/lib/ungdoms-oppenvard/backups
```

### **2. Databasuppgradering**

```bash
# Installera PostgreSQL eller MySQL
# Uppdatera server/db.ts för production
# Migrera från JSON-fil till riktig databas
```

### **3. Säkerhetsförbättringar**

- [ ] Implementera riktig autentisering (inte dev-mode)
- [ ] HTTPS/SSL-certifikat
- [ ] Rate limiting
- [ ] Input validation
- [ ] SQL injection protection
- [ ] XSS protection

### **4. Monitoring & Logging**

- [ ] Logging (Winston/Pino)
- [ ] Health checks
- [ ] Metrics (Prometheus)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring

---

## 🐳 **DOCKER DEPLOYMENT**

### **Dockerfile (redan finns)**

```dockerfile
# Använd befintlig Dockerfile
# Bygger React-app + Node.js server
```

### **Docker Compose (production)**

```yaml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/ungdoms
    depends_on:
      - db
    volumes:
      - app-data:/var/lib/ungdoms-oppenvard/data
      - backup-data:/var/lib/ungdoms-oppenvard/backups

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=ungdoms
      - POSTGRES_USER=ungdoms_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres-data:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  app-data:
  backup-data:
  postgres-data:
```

---

## ☁️ **CLOUD DEPLOYMENT**

### **Vercel (Frontend)**

```bash
# Installera Vercel CLI
npm i -g vercel

# Deploya frontend
cd client
vercel --prod
```

### **Railway/Render (Backend)**

```bash
# Koppla GitHub-repo
# Sätt miljövariabler
# Auto-deploy vid push
```

### **AWS/GCP/Azure**

```bash
# Använd Docker + Kubernetes
# Eller serverless (AWS Lambda)
# Load balancer + auto-scaling
```

---

## 🔧 **PRODUKTIONSKONFIGURATION**

### **Nginx Config (nginx.conf)**

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3001;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /api {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### **PM2 Config (ecosystem.config.js)**

```javascript
module.exports = {
  apps: [
    {
      name: "ungdoms-oppenvard",
      script: "server/index.ts",
      interpreter: "node",
      interpreter_args: "-r tsx/register",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

---

## 📊 **MONITORING & BACKUP**

### **Backup Script (backup.sh)**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/lib/ungdoms-oppenvard/backups"

# Database backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/db_$DATE.sql"

# File backup
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" /var/lib/ungdoms-oppenvard/data

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### **Health Check Script (health-check.sh)**

```bash
#!/bin/bash
HEALTH_URL="https://your-domain.com/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ Health check passed"
    exit 0
else
    echo "❌ Health check failed: $RESPONSE"
    exit 1
fi
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

### **Pre-Deployment**

- [ ] Alla tester passerar (`npm test`)
- [ ] Build fungerar (`npm run build`)
- [ ] TypeScript-kompilering OK (`npm run check`)
- [ ] Miljövariabler konfigurerade
- [ ] Databas migrerad
- [ ] SSL-certifikat installerat
- [ ] Backup-strategi implementerad

### **Post-Deployment**

- [ ] Health check OK
- [ ] Alla API-endpoints fungerar
- [ ] Frontend laddar korrekt
- [ ] Login/autentisering fungerar
- [ ] Data persistence fungerar
- [ ] Monitoring aktiverat
- [ ] Backup schemalagt

### **Säkerhet**

- [ ] HTTPS aktiverat
- [ ] Rate limiting konfigurerat
- [ ] Input validation implementerad
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] CORS korrekt konfigurerat
- [ ] Session management säkert

---

## 📈 **SCALING & PERFORMANCE**

### **Performance Optimering**

```bash
# Frontend
- Code splitting
- Lazy loading
- Image optimization
- CDN för statiska filer

# Backend
- Database indexing
- Query optimization
- Caching (Redis)
- Load balancing
```

### **Auto-scaling**

```bash
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ungdoms-oppenvard-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ungdoms-oppenvard
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 🎯 **NÄSTA STEG**

1. **Välj deployment-plattform** (Docker, Vercel, Railway, etc.)
2. **Konfigurera miljövariabler**
3. **Migrera till riktig databas**
4. **Implementera säkerhetsförbättringar**
5. **Sätt upp monitoring**
6. **Testa i staging-miljö**
7. **Deploya till production**

**Projektet är tekniskt redo för deployment, men kräver produktionskonfiguration!**



