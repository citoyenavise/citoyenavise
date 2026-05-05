# 🚀 PRODUCTION DEPLOYMENT GUIDE — PHASE 8

**Deploy Citoyenavise to Render Production**

---

## 📋 TABLE DES MATIÈRES

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database & Secrets](#database--secrets)
4. [Build & Deploy](#build--deploy)
5. [Post-Deployment](#post-deployment)
6. [Rollback Procedure](#rollback-procedure)
7. [Maintenance](#maintenance)

---

## 🔧 PREREQUISITES

### Local Requirements
```bash
# Git (for pushing code)
git --version
# → git version 2.40+

# Node.js + npm (for local build testing)
node --version  # → v18+
npm --version   # → v9+

# Docker (optional, for local image build)
docker --version  # → 20.10+
```

### Render Account
```
1. Create account: https://render.com
2. Connect GitHub: Settings → Connections
3. Authorize Render to access your repo
```

### Domain & DNS
```
1. Domain: citoyenavise.org (must be registered)
2. Registrar: Where domain is registered
3. DNS access: Ability to add CNAME records
```

### Environment Variables (Keep Safe)
```
Collect before starting:
  - DATABASE_URL (will be created on Render)
  - JWT_SECRET (32+ chars, random)
  - JWT_REFRESH_SECRET (32+ chars, random, different from JWT_SECRET)
  - REDIS_URL (optional, can use free tier)
```

---

## 🌍 INFRASTRUCTURE SETUP

### Step 1: Create Render Account

```
https://render.com
Sign up → Email verified → Ready
```

### Step 2: Create Web Service

**From Render Dashboard:**
```
New + → Web Service

Settings:
  Repository: Select your git repo
  Build Command: npm run build
  Start Command: npm start
  Environment: Node
  Region: Frankfurt (Europe)
  Plan: Starter (or Standard if budget allows)
```

### Step 3: Create PostgreSQL Database

**From Render Dashboard:**
```
New + → PostgreSQL

Settings:
  Name: citoyenavise-db
  Database: citoyenavise
  User: postgres
  Region: Frankfurt (same as web service)
  Plan: Free (90 days) → Standard ($7/mth after)
```

**Copy Connection String:**
```
When database is ready, Render provides:
DATABASE_URL=postgresql://user:password@host:5432/dbname

SAVE THIS → You'll need it for Web Service env vars
```

### Step 4: (Optional) Create Redis

**From Render Dashboard:**
```
New + → Redis

Settings:
  Name: citoyenavise-cache
  Region: Frankfurt
  Plan: Free (5GB) or starter
```

**Or Use Memory Cache Fallback:**
```
If skipping Redis:
  - Backend will use memory store (Map-based)
  - Set: REDIS_URL to empty or omit
  - Cache still works via fallback
```

---

## 🔐 DATABASE & SECRETS

### Step 1: Generate Secrets

```bash
# Generate JWT_SECRET (32+ random chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# → Copy output

# Generate JWT_REFRESH_SECRET (different)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# → Copy output (DIFFERENT from JWT_SECRET)
```

### Step 2: Set Environment Variables (Render)

**From Render Web Service Dashboard:**
```
Settings → Environment Variables

Add each:
  NODE_ENV: production
  PORT: 3000
  DATABASE_URL: postgresql://user:pass@host:5432/db
  JWT_SECRET: [generated secret]
  JWT_REFRESH_SECRET: [generated secret]
  REDIS_URL: [redis connection string] OR leave empty
  VITE_API_URL: /api/v1
```

### Step 3: (Optional) Create .env.prod for Testing

**File:** `.env.prod` (do NOT commit to git)
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
REDIS_URL=... (optional)
VITE_API_URL=/api/v1
```

**Test locally:**
```bash
# Load env and run
source .env.prod
npm start

# Verify:
curl http://localhost:3000/health
# → Should return 200
```

---

## 🔨 BUILD & DEPLOY

### Option 1: Git Auto-Deploy (Recommended)

**Step 1: Commit Changes**
```bash
git add -A
git commit -m "chore: production deployment setup — phase 8"
git push origin main
```

**Step 2: Render Auto-Deploys**
```
Render automatically:
  1. Detects git push
  2. Triggers webhook
  3. Runs build command: npm run build
  4. Runs start command: npm start
  5. Waits for health check
  6. Routes traffic
  
Estimated time: 2-5 minutes
```

**Step 3: Monitor Build**
```
Render Dashboard → Web Service → Logs
Shows:
  - Build starting...
  - npm install progress
  - npm run build (frontend build)
  - npm start (backend startup)
  - Health check: PASSED
  - Deployment live
```

### Option 2: Manual Docker Build (Advanced)

```bash
# Build production image
docker build -f Dockerfile.prod -t citoyenavise:prod .

# Test locally
docker run -it \
  -p 3000:5000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  citoyenavise:prod

# Verify health
curl http://localhost:3000/health

# Push to registry (if using)
docker tag citoyenavise:prod youruser/citoyenavise:prod
docker push youruser/citoyenavise:prod

# On Render: Set Image URI to youruser/citoyenavise:prod
```

---

## 🌐 DOMAIN CONFIGURATION

### Step 1: Add Custom Domain (Render)

**From Render Web Service Dashboard:**
```
Settings → Custom Domains

Add Domain:
  citoyenavise.org

Render provides:
  CNAME Target: [service-id].onrender.com
```

### Step 2: Update DNS (Registrar)

**Login to Domain Registrar** (GoDaddy, OVH, etc.):
```
DNS Settings → Add Record

Type: CNAME
Name: citoyenavise.org (or leave blank for root)
Value: [service-id].onrender.com
TTL: 3600
Save
```

### Step 3: Verify DNS

```bash
# Wait 10-30 min for DNS propagation
nslookup citoyenavise.org
# → Should resolve to Render IP

# Verify HTTPS
curl -I https://citoyenavise.org
# → HTTP/2 200
# → Certificate: Let's Encrypt
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

### Immediate (First 5 minutes)

- [ ] Check Render logs for errors
  ```
  Service → Logs → Look for "ERROR" or "500"
  ```

- [ ] Verify health endpoint
  ```bash
  curl -I https://citoyenavise.org/health
  # → HTTP/2 200
  ```

- [ ] Test production URL
  ```bash
  curl https://citoyenavise.org/
  # → HTML loads (not 404)
  ```

### API Testing (Next 10 minutes)

- [ ] Test health endpoint
  ```bash
  curl https://citoyenavise.org/api/v1/health
  # → 200 OK
  ```

- [ ] Test ready endpoint
  ```bash
  curl https://citoyenavise.org/api/v1/ready
  # → 200 OK (checks DB + cache)
  ```

- [ ] Test HTTPS redirect
  ```bash
  curl -I http://citoyenavise.org
  # → 308 Temporary Redirect
  # → Location: https://citoyenavise.org
  ```

### User Cycle Testing (Next 20 minutes)

- [ ] Signup
  ```bash
  curl -X POST https://citoyenavise.org/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "Test123!",
      "username": "testuser"
    }'
  # → 201 Created
  # → Response includes accessToken + refreshToken
  ```

- [ ] Login
  ```bash
  curl -X POST https://citoyenavise.org/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "Test123!"
    }'
  # → 200 OK
  # → New tokens issued
  ```

- [ ] Create Idea
  ```bash
  curl -X POST https://citoyenavise.org/api/v1/ideas \
    -H "Authorization: Bearer [accessToken]" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Test Idea",
      "description": "This is a test idea"
    }'
  # → 201 Created
  # → Idea saved to database
  ```

- [ ] Like Idea
  ```bash
  curl -X POST https://citoyenavise.org/api/v1/ideas/[ideaId]/like \
    -H "Authorization: Bearer [accessToken]"
  # → 200 OK
  # → Like recorded
  ```

- [ ] Get Ideas (Feed)
  ```bash
  curl https://citoyenavise.org/api/v1/ideas \
    -H "Authorization: Bearer [accessToken]"
  # → 200 OK
  # → List of ideas with pagination
  ```

### Infrastructure Checks (After 30 minutes)

- [ ] Setup UptimeRobot monitoring
  ```
  https://uptimerobot.com
  New Monitor → HTTPS → https://citoyenavise.org/health
  Interval: Every 5 minutes
  Email alerts: ON
  ```

- [ ] Check database connection
  ```bash
  curl https://citoyenavise.org/api/v1/ready
  # → 200 OK with "database": "connected"
  ```

- [ ] Review error logs
  ```
  Render Dashboard → Logs
  Filter: "ERROR"
  Should see: None (or only pre-deployment errors)
  ```

### Browser Testing (After 1 hour)

- [ ] Visit https://citoyenavise.org in browser
- [ ] HTTPS lock icon visible
- [ ] Frontend loads (not blank page)
- [ ] Can click buttons (no JS errors)
- [ ] Console clear of errors (F12 → Console tab)

---

## 🔄 ROLLBACK PROCEDURE

### If Production Deployment Fails

**Option 1: Render Auto-Rollback**
```
If health checks fail:
  Render automatically keeps previous deployment
  Reverts to last working version
  Estimated time: 5-10 minutes
```

**Option 2: Manual Rollback (Render Dashboard)**
```
Render → Deployments tab
  Shows: List of recent deployments
  Select: Previous successful deployment
  Click: Re-deploy
  
Verified: Old code is live again
```

**Option 3: Git Rollback**
```bash
# Find last working commit
git log --oneline | head -10

# Revert if needed
git revert HEAD
git push origin main

# Render auto-deploys previous code
```

### Recovery Steps

1. **Verify rollback worked**
   ```bash
   curl https://citoyenavise.org/health
   # Should return 200 immediately
   ```

2. **Check Render logs**
   ```
   New deployment should appear in logs
   Health checks should show PASSED
   ```

3. **Notify users (if public beta)**
   ```
   Email: We experienced brief downtime (X minutes)
   Status: Service is restored
   Investigation: Will review and deploy fix shortly
   ```

4. **Fix issue locally**
   ```bash
   git pull origin main
   npm run start:prod-local
   # Test locally, then push fix
   ```

5. **Re-deploy fixed version**
   ```bash
   git push origin main
   # Render auto-deploys
   ```

---

## 🛠️ MAINTENANCE

### Daily Operations

**Morning Check (5 min)**
```
1. UptimeRobot dashboard → Any RED (downtime)?
2. Render dashboard → CPU/Memory reasonable?
3. Logs → Any ERROR entries?
4. If all green → System healthy
```

**Evening Review (5 min)**
```
Same checks as morning
Plus: Any new feature requests or bug reports?
```

### Weekly Maintenance

**Monitor Performance**
```
Render Dashboard → Metrics
  - Response time trend
  - Error rate trend
  - CPU/Memory usage
  
Action if needed:
  - If error rate > 2%: Check logs
  - If response time > 2s: Check database
  - If memory > 80%: Consider upgrade
```

**Update Dependencies (Optional)**
```bash
# Check for updates
npm outdated

# Update non-breaking (minor/patch)
npm update

# Test locally
npm run start:prod-local

# Commit and push
git add package*.json
git commit -m "chore: update dependencies"
git push origin main
# → Render auto-deploys
```

### Monthly Maintenance

**Review Metrics**
```
- Uptime % (should be > 99%)
- Active users (growth tracking)
- Error rate (should be < 1%)
- Response time p95 (should be < 2s)
```

**Database Health**
```
Render → PostgreSQL → Logs
  - Any connection errors?
  - Any slow queries?
  - Disk usage growing?
  
If issues:
  - Optimize slow queries (add indexes)
  - Archive old data if needed
  - Upgrade plan if approaching limits
```

**Security Review**
```
- JWT secrets rotated?
- No secrets in logs?
- Rate limiting working?
- HTTPS certificate valid?
```

### Quarterly Review

**Scaling Decision**
```
Question: Are we outgrowing current plan?

Metrics to check:
  - Users: 20-50 (current) → 50-100 (upgrade)?
  - Database: Free tier expiring soon?
  - Traffic: Peak response time > 2s?
  - Errors: Unexpected 5xx responses?

If YES to any:
  - Upgrade Render plan (Web Service)
  - Upgrade PostgreSQL (to Standard)
  - Add Redis managed (vs memory fallback)
  
Estimated cost increase: $7-20/month
```

### Disaster Recovery

**Backup Strategy**
```
Render PostgreSQL:
  - Automatic daily backups (7 days)
  - Manual backup available via Render dashboard
  - No additional config needed
  
If database lost:
  1. Contact Render support (recovery possible)
  2. Restore from backup (up to 7 days old)
  3. Re-run migrations if needed
```

**Code Recovery**
```
If code corrupted:
  1. Previous deployments on Render (keep for 30 days)
  2. Git history on GitHub (permanent)
  3. Worst case: Restore from GitHub, re-deploy
```

---

## 📞 SUPPORT & TROUBLESHOOTING

### Common Issues

**Issue: 503 Service Unavailable**
```
Likely: Cold start or health check failed
Fix:
  1. Wait 20s (Render startup time)
  2. Check Render logs: Service → Logs
  3. Look for database connection error
  4. Verify DATABASE_URL is correct
  5. If still failing: Restart service (Service → Restart)
```

**Issue: 502 Bad Gateway**
```
Likely: Backend crashed or hung
Fix:
  1. Check Render logs for crash
  2. Look for: "EADDRINUSE" (port conflict)
  3. Check: Is DATABASE_URL accessible?
  4. Restart service: Service → Restart
```

**Issue: Slow Response Times (> 5s)**
```
Investigate:
  1. Database slow query? (check logs)
  2. Cache not working? (check /ready endpoint)
  3. API rate limited? (check rate limit logs)
  
Fix:
  1. Add database index (if slow query found)
  2. Increase cache TTL (if hitting DB repeatedly)
  3. Upgrade Render plan if CPU-bound
```

**Issue: High Memory Usage (> 80%)**
```
Likely: Memory leak in code
Fix:
  1. Check logs for patterns
  2. Review recent code changes
  3. Test locally: npm run start:prod-local
  4. Use Node memory profiler if available
  5. Restart service as temporary fix
```

### Getting Help

```
Render Support: https://render.com/support
GitHub Issues: Create issue in repo
Email: [maintainer email]
```

---

## 📋 FINAL CHECKLIST

### Before Deployment
- [ ] All code committed to main branch
- [ ] Tests passing locally
- [ ] Build succeeds: npm run build
- [ ] Start works: npm start
- [ ] Environment variables collected
- [ ] Database connection string ready
- [ ] Domain DNS ready (CNAME)
- [ ] Secrets generated (JWT_SECRET, JWT_REFRESH_SECRET)

### During Deployment
- [ ] Render auto-builds (watch logs)
- [ ] Health checks PASS
- [ ] No ERROR entries in logs
- [ ] Deployment shows LIVE

### After Deployment
- [ ] Health endpoint returns 200
- [ ] Frontend loads (no 404)
- [ ] HTTPS certificate valid
- [ ] User signup → login cycle works
- [ ] UptimeRobot monitoring active
- [ ] Logs visible in Render dashboard
- [ ] Database connected (/ready shows "connected")

---

## 🎉 DEPLOYMENT COMPLETE

```
Citoyenavise.org is now live in production!

Endpoints:
  - https://citoyenavise.org (frontend)
  - https://citoyenavise.org/api/v1 (API)
  - https://citoyenavise.org/health (monitoring)

Status:
  ✅ HTTPS enabled
  ✅ Database connected
  ✅ Monitoring active
  ✅ Logs centralized
  ✅ Ready for 20-50 users
  
Infrastructure:
  - Render Web Service (Node.js)
  - PostgreSQL managed database
  - Optional Redis cache
  - UptimeRobot monitoring
  
Next Steps:
  1. Share URL with beta testers
  2. Monitor logs for issues
  3. Respond to user feedback
  4. Plan Phase 2 scaling (100+ users)
```

---

**PRODUCTION DEPLOYMENT GUIDE COMPLETE** ✅

