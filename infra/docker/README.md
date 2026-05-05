# 🐳 DOCKER PRODUCTION GUIDE

**Citoyenavise Production Deployment**

---

## 📋 Fichiers Docker

### Production Dockerfile
- **File:** `Dockerfile.prod` (root)
- **Purpose:** Multi-stage build combining frontend + backend
- **Stages:**
  1. Frontend builder: React + Vite build
  2. Backend builder: Node dependencies
  3. Runtime: Combined app image (~150MB)

### Development Docker Compose
- **File:** `docker-compose.yml` (root)
- **Services:** PostgreSQL, Redis, Backend, Frontend, pgAdmin, Redis Commander
- **Usage:** Local development, testing

### Production Docker Compose (optional)
- **File:** `docker-compose.prod.yml` (if self-hosting)
- **Minimal:** Backend, PostgreSQL, Redis only
- **Usage:** VPS/Docker Swarm deployments

---

## 🔨 BUILD LOCALLY

### Prerequisites
```bash
# Check Docker installed
docker --version
# → Docker version 20.10+ required

# Check Docker Compose
docker-compose --version
# → Docker Compose version 2.0+ required
```

### Build Frontend + Backend Image
```bash
# From project root
docker build -f Dockerfile.prod -t citoyenavise:prod .

# Result: Single image ~150MB containing:
# - Node.js runtime
# - Frontend dist/ (minified React + CSS)
# - Backend src/ (all modules)
# - health checks
```

### Run Locally
```bash
# Without database (test frontend serving)
docker run -it -p 3000:5000 \
  -e NODE_ENV=production \
  citoyenavise:prod

# With docker-compose (full stack)
docker-compose -f docker-compose.yml up

# Access:
# - http://localhost:5000 → Frontend
# - http://localhost:5000/api/v1/health → Backend API
```

### Test Build Artifacts
```bash
# Verify frontend dist included
docker run --rm citoyenavise:prod ls -la frontend/dist/

# Expected:
# - index.html
# - assets/index-*.js
# - assets/index-*.css
```

---

## 🚀 RENDER DEPLOYMENT

### Option 1: Direct Git Integration (Recommended)

**Setup:**
1. Create Render account (render.com)
2. Connect GitHub repository
3. Create New → Web Service
   - Select repository
   - Environment: Node
   - Build Command: `npm run build` (frontend only)
   - Start Command: `npm start` (backend)
   - Region: Frankfurt (Europe)

**Environment Variables (Render Dashboard):**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
VITE_API_URL=/api/v1
```

**Auto-deployment:**
- Render watches main branch
- On git push: auto-builds and deploys
- Health checks verify before rollout

### Option 2: Docker Image Registry

**Build & Push:**
```bash
# Build
docker build -f Dockerfile.prod -t citoyenavise:prod .

# Tag for registry (e.g., Docker Hub)
docker tag citoyenavise:prod youruser/citoyenavise:prod
docker push youruser/citoyenavise:prod

# On Render:
# - Image URI: youruser/citoyenavise:prod
# - Port: 5000
# - Same env variables
```

---

## 🛡️ PRODUCTION CHECKLIST

### Image Optimization
- ✅ Multi-stage build (reduces size)
- ✅ Alpine base (minimal 150MB)
- ✅ Non-root user (nodejs:1001)
- ✅ Healthcheck defined
- ✅ No dev dependencies in runtime

### Security
- ✅ Non-root user (nodejs)
- ✅ No hardcoded secrets (env vars only)
- ✅ No package-lock.json in image
- ✅ Minimal attack surface (Alpine)

### Database
- ✅ Connection pooling (max 10)
- ✅ Migrations run on startup
- ✅ Backups configured (Render managed)

### Frontend
- ✅ Build optimizations (Vite minify)
- ✅ No source maps in prod
- ✅ Cache busting via asset hash

### Monitoring
- ✅ Health endpoint (/health)
- ✅ Logs to stdout (Render captures)
- ✅ Readiness checks (/ready)

---

## 📊 IMAGE SIZES

| Build | Size | Notes |
|-------|------|-------|
| Frontend dist/ | 2.5MB | Minified React + CSS |
| Backend src/ | 0.5MB | Node.js source |
| node_modules | ~150MB | Alpine production |
| **Total Image** | **~155MB** | ✅ Acceptable |

---

## 🔄 ROLLBACK PROCEDURE

### If Deployment Fails
```bash
# Render automatically keeps previous version
# Rollback via Render Dashboard:
# 1. Services → Deployments
# 2. Click previous successful deployment
# 3. Re-deploy

# Manual rollback (Docker image):
docker run -it -p 3000:5000 \
  citoyenavise:prev \
  # (previous tagged image)
```

### Database Migration Failure
```bash
# If migrations fail during startup:
# 1. Render logs show error
# 2. Check backend/src/database/migrations/
# 3. Fix migration SQL
# 4. Push to main (auto-redeploy)
```

---

## 🐛 DEBUGGING

### View Build Logs
```bash
# Render Dashboard → Logs tab
# Shows:
# - Docker build output
# - npm install progress
# - Startup errors
# - Runtime logs
```

### SSH into Container (local)
```bash
# If running locally:
docker exec -it <container-id> sh

# Check processes
ps aux

# Verify network
netstat -an

# Check logs
cat /app/logs/*.log
```

### Database Connection Test
```bash
docker run --rm --network host \
  -e DATABASE_URL=postgresql://... \
  citoyenavise:prod \
  node -e "require('./src/services/database').getPool().query('SELECT 1')"
```

---

## 📈 SCALING (Future)

### Horizontal Scaling (Multiple instances)
```yaml
# docker-compose scale for load testing
services:
  backend:
    replicas: 3  # 3 instances behind load balancer
    ports:
      - "5001:5000"
      - "5002:5000"
      - "5003:5000"
```

### On Render
```
Services → Scale
- Set Num of Instances: 2-3
- Load balanced automatically
- Estimated cost: $21/mth (3× $7)
```

---

**Docker production-ready and deployable to Render.** ✅

