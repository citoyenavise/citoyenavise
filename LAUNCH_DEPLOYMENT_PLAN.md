# 🚀 PLAN DE DÉPLOIEMENT LANCEMENT PUBLIC — CITOYENAVISE.ORG

**Phase Lancement Public — Mise en ligne réelle sur Render**

---

## 📋 TABLE DES MATIÈRES

1. [Overview](#overview)
2. [Prérequis](#prérequis)
3. [Étape 1 — Créer le Web Service Render](#étape-1--créer-le-web-service-render)
4. [Étape 2 — Créer PostgreSQL Managée](#étape-2--créer-postgresql-managée)
5. [Étape 3 — Configurer les Secrets](#étape-3--configurer-les-secrets)
6. [Étape 4 — Ajouter le Domaine](#étape-4--ajouter-le-domaine)
7. [Étape 5 — Premier Déploiement](#étape-5--premier-déploiement)
8. [Étape 6 — Vérifications Techniques](#étape-6--vérifications-techniques)
9. [Étape 7 — Tests Cycle Utilisateur](#étape-7--tests-cycle-utilisateur)
10. [Étape 8 — Monitoring & Alerting](#étape-8--monitoring--alerting)
11. [Validation & Troubleshooting](#validation--troubleshooting)

---

## 📊 OVERVIEW

```
Objectif: https://citoyenavise.org accessible publiquement en HTTPS
Timeline: ~30-45 min (dépend propagation DNS)
Risque: Faible (toutes les configs pré-testées)
Rollback: Possible en 5-10 min (previous deployment)
```

### Timeline Estimée

| Étape | Action | Temps |
|-------|--------|-------|
| 1 | Web Service Render | 2 min |
| 2 | PostgreSQL Managée | 2 min |
| 3 | Secrets + Variables | 3 min |
| 4 | Domaine + DNS | 2 min |
| 5 | Déploiement | 3-5 min |
| 6 | Vérifications | 5 min |
| 7 | Tests Utilisateur | 10 min |
| 8 | Monitoring | 2 min |
| **TOTAL** | | **30-45 min** |

---

## ✅ PRÉREQUIS

**Avant de commencer, vérifier:**

- [ ] Compte Render créé et actif (render.com)
- [ ] GitHub connecté à Render (Settings → Connections)
- [ ] Repository citoyenavise accessible
- [ ] Domaine citoyenavise.org accessible (DNS admin)
- [ ] Secrets générés (JWT_SECRET, JWT_REFRESH_SECRET)
- [ ] Browser en mode incognito pour tester
- [ ] Fichiers infra/ préparés (voir étape suivante)
- [ ] Scripts de validation téléchargés

**Secrets à générer AVANT étape 3:**

```bash
# Générer JWT_SECRET (32+ chars, random)
node -e "console.log('JWT_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
# → Copier la valeur

# Générer JWT_REFRESH_SECRET (DIFFÉRENT)
node -e "console.log('JWT_REFRESH_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
# → Copier la valeur (DIFFÉRENT du JWT_SECRET)
```

---

## ÉTAPE 1 — CRÉER LE WEB SERVICE RENDER

### Objectif
Créer le service Node.js qui accueillera le backend + frontend dist.

### Actions sur Render Dashboard

**1. Aller à Render Home**
```
Dashboard → Click "New +"
```

**2. Sélectionner "Web Service"**
```
New + button → Web Service option
```

**3. Connecter le Repository**
```
Page: "Create a new Web Service"

Repository URL section:
  ✓ GitHub selected (or GitLab if applicable)
  ✓ Search for: citoyenavise
  ✓ Select: citoyenavise repo
  ✓ Branch: main (confirm)

Click: "Connect"
```

**4. Configurer le Service**
```
Service name: citoyenavise-backend (or citoyenavise-prod)

Environment: Node
Region: Frankfurt (Europe, Western)
Branch: main

Build Command:
  npm run build

Start Command:
  npm start

Instance Type: Starter ($7/mth) ← Recommended for MVP
  [If later: upgrade to Standard $20/mth for better perf]

Auto-Deploy: ON
  [Automatically redeploy on main push]

Advanced Settings:
  ✓ Keep default (no need to change)
```

**5. Create Web Service**
```
Click: "Create Web Service" button
Wait: Service initializes (30-60 sec)
Status: Should show "Build in progress..."
```

### Expected Behavior
```
Dashboard shows:
  ✓ Service name: citoyenavise-backend
  ✓ Status: "Build in progress" (spinning circle)
  ✓ Logs tab: Shows git clone, build steps
  
After ~60-90 sec:
  ✗ Build FAILS (expected, no DATABASE_URL yet)
  ✓ Service created (will fix in next steps)
```

### If Build Fails Immediately
```
Check logs for:
  Error: "DATABASE_URL not defined"
  → NORMAL, we'll add secrets next
  
  OR
  
  Error: "npm: command not found"
  → Problem: Wrong environment selected
  → Fix: Delete service, recreate with "Node" environment
```

### Capture Info You'll Need Later
```
From Render Dashboard → Service Settings:
  - Service ID: (long ID in URL)
  - Service name: citoyenavise-backend
  - Region: Frankfurt
  
Save these for later.
```

---

## ÉTAPE 2 — CRÉER POSTGRESQL MANAGÉE

### Objectif
Créer une base PostgreSQL 14 que le backend utilisera.

### Actions sur Render Dashboard

**1. Créer Nouvelle Database**
```
Dashboard → Click "New +"
```

**2. Sélectionner PostgreSQL**
```
New + button → PostgreSQL option
```

**3. Configurer la Database**
```
Page: "Create a new PostgreSQL database"

Database name: citoyenavise-db (or just citoyenavise)
Database: citoyenavise (auto-filled)
User: postgres (default, ok)
Password: [Auto-generated, strong password]

Region: Frankfurt (same as web service)
  ✓ IMPORTANT: Same region = lower latency + no data transfer costs

PostgreSQL Version: 14.x (latest available)

Blueprint: None (start fresh)

Click: "Create Database"
```

**4. Wait for Database Ready**
```
Status: "Initializing..." → "Available"
Takes: 1-2 minutes

Once "Available":
  Dashboard shows green checkmark
```

### Capture Info You'll Need Now
```
From Render Dashboard → PostgreSQL Settings:

DATABASE_URL: 
  postgresql://[user]:[password]@[host]:[port]/[dbname]
  
Example:
  postgresql://postgres:abc123xyz@dpg-xxx.c.render.com:5432/citoyenavise

✓ COPY THIS ENTIRE URL → You'll paste in Web Service env vars next

Also note:
  - Internal Database URL: [use for Docker internal connections]
  - Hostname: dpg-xxx.c.render.com
```

### If Database Creation Fails
```
Error: "Region not available"
  → Try: US East, or another available region
  → Note: Slightly higher latency, but ok for MVP

Error: "Storage limit exceeded"
  → Unlikely for new account
  → Check: Any previous databases still running?
```

---

## ÉTAPE 3 — CONFIGURER LES SECRETS & VARIABLES

### Objectif
Ajouter toutes les variables d'environnement au Web Service.

### Actions sur Render Dashboard

**1. Aller aux Settings du Web Service**
```
Dashboard → Services → citoyenavise-backend
Click: "Settings" tab (not "Logs" or "Events")
```

**2. Trouver "Environment Variables"**
```
Page: Settings
Scroll: Find "Environment" section
Click: "Add Environment Variable" (multiple times)
```

**3. Ajouter les Variables**

```
Add these ONE BY ONE:

1. NODE_ENV
   Key: NODE_ENV
   Value: production
   Click: "Add"

2. PORT
   Key: PORT
   Value: 3000
   Click: "Add"

3. DATABASE_URL
   Key: DATABASE_URL
   Value: [paste the PostgreSQL URL from Step 2]
   Example: postgresql://postgres:abc123xyz@dpg-xxx.c.render.com:5432/citoyenavise
   Click: "Add"

4. JWT_SECRET
   Key: JWT_SECRET
   Value: [your generated JWT_SECRET from prerequisites]
   Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   Click: "Add"

5. JWT_REFRESH_SECRET
   Key: JWT_REFRESH_SECRET
   Value: [your generated JWT_REFRESH_SECRET from prerequisites]
   Example: z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4
   Click: "Add"

6. VITE_API_URL (optional, but recommended)
   Key: VITE_API_URL
   Value: /api/v1
   Click: "Add"

7. LOG_LEVEL (optional)
   Key: LOG_LEVEL
   Value: info
   Click: "Add"

8. REDIS_URL (optional, skip if not using Redis)
   Key: REDIS_URL
   Value: [leave empty or provide Redis URL]
   Click: "Add"
```

### Expected Behavior After Adding Variables
```
Environment section shows:
  ✓ NODE_ENV = production
  ✓ PORT = 3000
  ✓ DATABASE_URL = postgresql://...
  ✓ JWT_SECRET = [hidden/masked]
  ✓ JWT_REFRESH_SECRET = [hidden/masked]
  ✓ VITE_API_URL = /api/v1
  ✓ LOG_LEVEL = info
  ✓ REDIS_URL = [if added]
```

### Important Security Notes
```
✓ Render automatically masks secrets (don't show in logs)
✓ Never commit secrets to git
✓ Variables synced to all deployments automatically
✓ Can be changed without code push (takes 1 deploy to apply)
```

### If Variables Don't Save
```
Error: "Invalid value format"
  → Check: DATABASE_URL is complete (has password, host, etc.)
  → Check: No extra spaces at end
  → Fix: Copy-paste carefully from Render database page

Error: "Too long"
  → Unlikely unless you pasted wrong value
  → Fix: Clear and re-paste
```

### Verification: Check Web Service Status
```
After adding ALL variables:
  - Service still shows: "Build failed" (ok, we're deploying next)
  - Environment section: All variables listed
  - No red error messages
```

---

## ÉTAPE 4 — AJOUTER LE DOMAINE

### Objectif
Lier citoyenavise.org au Web Service et activer HTTPS.

### Actions sur Render Dashboard

**1. Aller à Custom Domains**
```
Dashboard → Services → citoyenavise-backend
Click: "Settings" tab
Scroll: Find "Custom Domain" section
```

**2. Ajouter le Domaine**
```
Custom Domains section:
  Input field: "Enter custom domain"
  Type: citoyenavise.org
  Click: "Add Custom Domain"
```

**3. Render Fournit CNAME**
```
After click, Render shows:

"To verify ownership, add this CNAME record to your DNS:"
  Name: citoyenavise.org
  Type: CNAME
  Value: [service-id].onrender.com
  
Example value might be:
  cname-abc123def456.onrender.com

✓ COPY THIS VALUE
```

**4. Mettre à Jour DNS chez Registrar**

Aller chez votre registrar DNS (OVH, GoDaddy, etc.):

```
DNS Settings for citoyenavise.org:

Find: CNAME record (ou créer si n'existe pas)
Name: citoyenavise.org (or leave blank for root)
Type: CNAME
Value: [the value Render provided]
TTL: 3600

Save/Submit DNS change
```

**5. Attendre Propagation DNS**
```
Timeframe: 5-30 minutes (can be instant in rare cases)

In Render dashboard:
  Status will change from "Unverified" to "Verified"
  
Meanwhile, HTTPS certificate generation starts automatically.
```

### How to Verify DNS Propagated
```bash
# In your terminal/command prompt:
nslookup citoyenavise.org

# Output should show:
# citoyenavise.org is an alias for [service-id].onrender.com

# If still shows old records:
  Wait 10 more minutes, try again
```

### After DNS Verified (~15-30 min)
```
Render Dashboard shows:
  ✓ Custom Domain: citoyenavise.org ← VERIFIED
  ✓ HTTPS: Enabled (Let's Encrypt)
  ✓ Certificate: Auto-renewed
```

### If DNS Verification Fails
```
Problem: "Domain still not verified after 30 min"

Troubleshoot:
  1. Check registrar: Is CNAME correctly added?
  2. Check value: Copy exactly (case-sensitive)
  3. Clear browser cache: Ctrl+Shift+Del
  4. Try different DNS checker: 
     https://dnschecker.org
  5. If still failing: Delete custom domain in Render,
     wait 5 min, re-add
```

---

## ÉTAPE 5 — PREMIER DÉPLOIEMENT

### Objectif
Déclencher la construction et déploiement du code avec les secrets.

### Option A: Déploiement Automatique (Recommandé)

**Render Peut Redéployer Automatiquement:**

```
Dashboard → Services → citoyenavise-backend

Status shows: "Build failed" from earlier attempt

Click: "Manual Deploy" (in top-right)
Select: "Deploy latest commit"

Render starts:
  1. Git fetch (latest code from main branch)
  2. Build (npm run build)
  3. Artifacts (minify, bundle)
  4. Container image creation
  5. Health check initialization
  6. Deploy to edge
```

### Option B: Git Push (Auto-Deploy)

**Si vous préférez déclencher via git:**

```bash
# Locally, push to main:
git push origin main

# Render webhook triggers automatically:
  1. Git push detected
  2. Build starts in Render dashboard
  3. Same process as Option A
```

### Monitoring the Build

```
Render Dashboard → Logs tab shows:

[1/7] Building...
[2/7] Installing dependencies...
[3/7] Running npm run build...
  → Frontend builds (Vite)
  → Creates dist/ folder

[4/7] Starting application...
npm start
node server.js

[5/7] Health check...
GET /health
✓ 200 OK

[6/7] Waiting for service ready...
[7/7] Deployment complete!

Status: "Live" ✅
```

### Expected Behavior

```
Success (Expected):
  ✓ Logs show "Deployment live"
  ✓ Service status: GREEN
  ✓ No error messages after "live"

Possible First-Time Issues:
  ✗ Database error: "Cannot connect to PostgreSQL"
    → Check: DATABASE_URL is correct (copy from Step 2)
    → Check: Database is "Available" status
    → Solution: Update DATABASE_URL, Manual Deploy again
    
  ✗ Timeout error: "Health check failed (10s)"
    → Check: Service taking too long to start
    → Check: Database connection hanging
    → Solution: Restart service (Service → Restart)
    
  ✗ npm: "command not found"
    → Check: Environment is set to "Node"
    → Solution: Delete and recreate Web Service
```

### After Deployment Succeeds

```
Render Dashboard:
  ✓ Service: citoyenavise-backend
  ✓ Status: GREEN ("Live")
  ✓ Custom Domain: citoyenavise.org
  ✓ HTTPS: Enabled
  ✓ Deployment: 1 (first deploy)
```

### Check Live URL

```bash
# Test in terminal:
curl -I https://citoyenavise.org/

# Should see:
# HTTP/2 200
# Server: [Render infrastructure]
# Date: [current date]
# Cache-Control: ...
```

---

## ÉTAPE 6 — VÉRIFICATIONS TECHNIQUES

### Objectif
Valider que le service est opérationnel et sécurisé.

### 6.1 Health Check

```bash
curl https://citoyenavise.org/health

Expected response (200):
{
  "status": "ok",
  "timestamp": "2026-05-05T14:45:00.123Z",
  "uptime": 45,
  "version": "1.0.0"
}

If FAILS:
  ✗ Timeout (curl hangs 10+ sec)
    → Service not responding
    → Check Render logs for errors
    
  ✗ 503 Service Unavailable
    → Database not connected
    → Check DATABASE_URL env var
    
  ✗ 502 Bad Gateway
    → Service crashed
    → Check logs for exceptions
```

### 6.2 Readiness Check

```bash
curl https://citoyenavise.org/api/v1/ready

Expected response (200):
{
  "status": "ready",
  "database": "connected",
  "cache": "connected",
  "eventBus": "initialized"
}

OR if Redis not configured (ok):
{
  "status": "ready",
  "database": "connected",
  "cache": "fallback (memory)",
  "eventBus": "initialized"
}

If shows 503:
  → Database not connected
  → Check DATABASE_URL again
  → Common fix: Full DATABASE_URL must include password
```

### 6.3 HTTPS & Security Headers

```bash
curl -I https://citoyenavise.org/

Check response headers:
  ✓ HTTP/2 200 (or HTTP/1.1 200)
  ✓ Strict-Transport-Security: max-age=31536000
  ✓ X-Frame-Options: DENY
  ✓ X-Content-Type-Options: nosniff
  ✓ Referrer-Policy: strict-origin-when-cross-origin

Certificate check:
  openssl s_client -connect citoyenavise.org:443 -showcerts
  
  Should show:
    Issuer: Let's Encrypt (or similar)
    Not Before: [recent date]
    Not After: [90 days from now]
```

### 6.4 HTTP Redirect

```bash
curl -I http://citoyenavise.org/

Expected:
  ✓ HTTP/1.1 308 (or 301 Permanent Redirect)
  ✓ Location: https://citoyenavise.org/

Verify:
  curl http://citoyenavise.org/ -L
  Should end with HTTPS content
```

### 6.5 Frontend Served

```bash
curl https://citoyenavise.org/ | head -50

Expected:
  ✓ <html> tag present
  ✓ <head> with React metadata
  ✓ <div id="root"> for React mount
  ✓ <script src="assets/index-...js"> (hashed)

If shows 404:
  → dist/ folder not built
  → Check: "npm run build" in Build Command
  → Check Logs: Does "Creating dist/" appear?
```

### 6.6 API Endpoints

```bash
# Test API base
curl https://citoyenavise.org/api/v1/health

Expected:
  ✓ 200 (same as /health, but through /api/v1 prefix)

# Test non-existent endpoint (404 expected)
curl https://citoyenavise.org/api/v1/nonexistent

Expected:
  ✓ 404 (not found, normal)
```

### 6.7 Render Logs Review

```
Render Dashboard → Logs tab:

Scroll through and check:
  ✓ Startup: "Server listening on port 3000"
  ✓ Database: "Pool initialized (10 connections)"
  ✓ EventBus: "Subscribers registered"
  
  ✗ Watch for ERROR entries:
    "Cannot connect to database"
    "EADDRINUSE: address already in use"
    "Module not found"
    
If errors found:
  → Note the error
  → Don't patch yet, proceed to test cycle
  → If blocking, document and skip to troubleshooting
```

### Summary: All Checks Pass?
```
If ALL above checks return expected results:
  ✅ System is operational
  ✅ HTTPS working
  ✅ Frontend served
  ✅ API responding
  ✅ Security headers present
  ✅ Ready for user testing
```

---

## ÉTAPE 7 — TESTS CYCLE UTILISATEUR

### Objectif
Tester le cycle complet signup → login → create → like → comment en prod.

### Setup
```
1. Open browser in INCOGNITO mode
   (Ensure no cached localStorage from dev)
   
2. Go to: https://citoyenavise.org
   (If you see "Cannot reach" → DNS not propagated yet, wait)
```

### Test 1: Homepage Load

```
Action:
  Navigate to https://citoyenavise.org

Expected:
  ✓ Page loads in < 2 sec
  ✓ React app renders (no blank page)
  ✓ Header visible
  ✓ Login/Signup buttons visible

Debug if fails:
  Open browser Console (F12 → Console tab)
  Look for red errors:
    - CORS errors → API URL misconfigured
    - "Cannot find module" → Build issue
    - Network errors → API unreachable
```

### Test 2: Signup

```
Action:
  1. Click "Sign Up" button
  2. Fill form:
     Email: test-prod-1@example.com
     Password: TestPass123!
     Username: testproduser1
  3. Click "Register"

Expected:
  ✓ Request: POST /api/v1/auth/register
  ✓ Status: 201 Created
  ✓ Response: { data: { accessToken, refreshToken, user } }
  ✓ Redirects to /feed or dashboard
  ✓ localStorage contains: accessToken, refreshToken

Debug if fails:
  F12 → Network tab:
    Look at POST /auth/register
    - 400 Bad Request: Validation error (see response)
    - 409 Conflict: Email already exists
    - 500 Internal: Server error (check Render logs)
    
  Common issues:
    - Email invalid format → Use proper email
    - Password too short → Use 8+ chars
    - Username taken → Use unique username
```

### Test 3: Login

```
Action:
  1. Logout (if already logged in)
  2. Click "Login"
  3. Fill form:
     Email: test-prod-1@example.com
     Password: TestPass123!
  4. Click "Login"

Expected:
  ✓ POST /api/v1/auth/login → 200 OK
  ✓ Response: { data: { accessToken, refreshToken } }
  ✓ Redirects to /feed
  ✓ localStorage updated with new tokens

Debug if fails:
  - 401 Unauthorized: Wrong email/password
  - 500 error: Check Render logs
```

### Test 4: Create Idea

```
Action:
  1. On /feed page, find "Create Idea" button
  2. Fill form:
     Title: "My Test Idea"
     Description: "This is a test idea created in production"
  3. Click "Create"

Expected:
  ✓ POST /api/v1/ideas → 201 Created
  ✓ New idea appears in feed immediately
  ✓ Idea shows: title, description, your name, timestamp

Debug if fails:
  - 400 Bad Request: Title/description missing
  - 401 Unauthorized: Token expired or missing
  - 500 error: Check Render logs
```

### Test 5: Like Idea

```
Action:
  1. Find an idea in the feed
  2. Click the "Like" button (heart icon)

Expected:
  ✓ POST /api/v1/ideas/{id}/like → 200 OK
  ✓ Like count increments by 1
  ✓ Button state changes (filled heart)

Debug if fails:
  - 404 Not Found: Idea ID doesn't exist
  - 409 Conflict: Already liked this idea
  - 500 error: Database issue
```

### Test 6: Comment on Post

```
Action:
  1. Find a post (if available)
  2. Click "Comments" or "Reply"
  3. Type comment: "Great idea!"
  4. Click "Send Comment"

Expected:
  ✓ POST /api/v1/posts/{id}/comments → 201 Created
  ✓ Comment appears immediately
  ✓ Shows: comment text, author, timestamp

Debug if fails:
  - 404 Post Not Found: Wrong post ID
  - 400 Comment missing: Empty text
  - 500 error: Server issue
```

### Test 7: View Feed (Pagination)

```
Action:
  1. On /feed page
  2. Look for pagination (Next, Previous, or infinite scroll)
  3. Navigate through pages

Expected:
  ✓ Ideas load with limit=20 per page
  ✓ Pagination works (or infinite scroll)
  ✓ New ideas show correct data
  ✓ No 404 errors

Debug if fails:
  - 500 error: Database query failed
  - Slow loading (> 5s): Database performance issue
```

### Test 8: Logout

```
Action:
  1. Click user menu or "Logout"
  2. Confirm logout

Expected:
  ✓ Redirects to /login
  ✓ localStorage cleared (tokens gone)
  ✓ API calls fail with 401 if try to access /feed

Debug if fails:
  - Still can access /feed: Logout didn't clear tokens
  - 500 error: Server logout issue
```

### Summary Checklist

```
✅ All tests pass?
  ✓ Signup works
  ✓ Login works
  ✓ Create idea works
  ✓ Like works
  ✓ Comment works
  ✓ Feed displays correctly
  ✓ Logout works
  
Then:
  ✅ CYCLE UTILISATEUR COMPLET VALIDÉ
  ✅ PRÊT POUR LANCEMENT PUBLIC
```

---

## ÉTAPE 8 — MONITORING & ALERTING

### Objectif
Activer le monitoring pour détecter les incidents en prod.

### 8.1 UptimeRobot

```
Go to: https://uptimerobot.com
Sign up (if not already) / Login

Click: "Add New Monitor"

Settings:
  Monitor type: HTTPS
  URL: https://citoyenavise.org/health
  Interval: Every 5 minutes
  Timeout: 10 seconds
  
Alert contacts:
  ✓ Add your email
  ✓ Enable email alerts for DOWN events
  ✓ Enable alert when BACK UP

Click: "Create Monitor"
```

### 8.2 Render Native Monitoring

```
Render Dashboard → Service → Metrics tab:

You should see:
  - CPU usage (%)
  - Memory usage (%)
  - Requests/minute
  - Response time (avg, p95, p99)

Monitor daily for anomalies:
  - CPU sudden spike → Possible DoS or bad query
  - Memory leak → Gradual increase → Restart service
  - Response time > 2s → Database issue
```

### 8.3 Render Logs Alerts (Optional)

```
Render Dashboard → Alerts (if available on plan):

Create alert:
  Trigger: Error rate > 5%
  Notification: Email
  
This helps catch deployment issues early.
```

### 8.4 Logtail (Optional, for longer retention)

```
If you want logs beyond Render's 7 days:

Go to: https://betterstack.com/logs
Sign up
Create source (Node.js)
Get token

Add to Render environment:
  LOGTAIL_TOKEN: [your token]

Deploy: Manual Deploy in Render
```

---

## ✅ VALIDATION & TROUBLESHOOTING

### Pre-Deployment Checklist

```
Before starting Étape 1:
  [ ] Secrets generated (JWT_SECRET, JWT_REFRESH_SECRET)
  [ ] Render account created & GitHub connected
  [ ] Domain registrar access ready
  [ ] Browser ready (incognito mode)
  [ ] This plan document open
```

### Per-Step Checklist

```
After Étape 1 (Web Service):
  [ ] Service created in Render
  [ ] Status shows "Build in progress" (then fails, ok)
  
After Étape 2 (PostgreSQL):
  [ ] Database shows "Available"
  [ ] DATABASE_URL copied
  
After Étape 3 (Secrets):
  [ ] All 8 variables added
  [ ] No validation errors
  
After Étape 4 (Domain):
  [ ] CNAME added to registrar
  [ ] "Verified" shows in Render (after ~15-30 min)
  [ ] HTTPS certificate issued
  
After Étape 5 (Déploiement):
  [ ] Service status: GREEN/"Live"
  [ ] Logs show: "Deployment live"
  [ ] No ERROR entries in logs
  
After Étape 6 (Vérifications):
  [ ] /health returns 200
  [ ] /ready returns 200
  [ ] HTTPS working
  [ ] Frontend loads
  [ ] Security headers present
  
After Étape 7 (Tests):
  [ ] Signup works
  [ ] Login works
  [ ] Create idea works
  [ ] Like works
  [ ] Feed displays
  [ ] Logout works
  
After Étape 8 (Monitoring):
  [ ] UptimeRobot monitoring active
  [ ] Render metrics visible
  [ ] Alert email received (test)
```

### Troubleshooting Common Issues

#### Issue 1: Service Won't Start (RED status)

```
Symptoms:
  Service status: RED
  Logs show: "EADDRINUSE" or "Cannot connect to database"

Solutions:
  1. Check DATABASE_URL:
     - Full URL with password? postgresql://user:pass@host:5432/db
     - No extra spaces?
     - Password has special chars? (need URL encoding)
     
  2. Check if database is "Available":
     - Render → PostgreSQL → Status should be green
     
  3. Restart service:
     - Service → Restart button (top-right)
     - Wait 30 sec
     
  4. Manual Deploy again:
     - Service → Manual Deploy → "Deploy latest commit"
```

#### Issue 2: 502 Bad Gateway

```
Symptoms:
  curl https://citoyenavise.org
  Response: 502 Bad Gateway

Solutions:
  1. Check Render logs for crash:
     - Look for "SEGFAULT", "OOM", "panic"
     
  2. If no crash, health check may be slow:
     - Wait 20 sec (cold start)
     - Try again
     
  3. If persistent:
     - Service → Restart
     - Wait full 30 sec
     
  4. If still failing:
     - May be database connectivity
     - Check DATABASE_URL matches exactly
     - Restart both service and DB if needed
```

#### Issue 3: DNS Not Resolving (Cannot reach citoyenavise.org)

```
Symptoms:
  curl https://citoyenavise.org
  Error: "Could not resolve host"

Solutions:
  1. Check DNS propagation:
     https://dnschecker.org → search citoyenavise.org
     Should show Render IP
     
  2. If DNS says "CNAME: unknown":
     - CNAME not yet propagated (wait 10-30 min)
     - Try clearing your DNS cache:
       Windows: ipconfig /flushdns
       Mac: sudo dscacheutil -flushcache
       
  3. If DNS shows old records:
     - Check registrar: Did you add the CNAME?
     - Check value: Exact copy from Render?
     - Wait 15+ minutes for full propagation
     
  4. Render still shows "Unverified":
     - Click "Retry verification" in Render
     - If still fails after 30 min:
       Delete custom domain, re-add
       Copy-paste CNAME value again (very carefully)
```

#### Issue 4: 401 Unauthorized on API Calls

```
Symptoms:
  POST /auth/register → 401 Unauthorized
  (Should be 201 or 400, not 401)

Solutions:
  1. Check JWT_SECRET set:
     - Render → Environment Variables
     - JWT_SECRET present? (hidden as **)
     
  2. If missing:
     - Add JWT_SECRET + JWT_REFRESH_SECRET
     - Manual Deploy (redeploy needed for env changes)
     
  3. If present but still 401:
     - Token verification failing
     - Check Render logs for "JWT error"
     - May need to restart service
```

#### Issue 5: 500 Internal Server Error

```
Symptoms:
  Any API call returns 500
  OR
  Logs show "Error: Cannot read property..."

Solutions:
  1. Check Render logs:
     - Service → Logs
     - Look for full error stack
     - Most recent errors at bottom
     
  2. Common causes:
     - "Cannot read property 'id' of null"
       → Bug in code, needs fix
       
     - "Connection refused"
       → Database down, needs restart
       
     - "MODULE_NOT_FOUND"
       → Build didn't complete, redo deploy
       
  3. If code bug:
     - Fix in local repo
     - git push origin main
     - Render auto-redeploys
     - Test again
```

#### Issue 6: Slow Response Times (> 5 seconds)

```
Symptoms:
  API calls take 5-10+ seconds
  
Solutions:
  1. First request slower? (Cold start)
     - Render spins down free tier after 15 min inactivity
     - First request after cold start: 10-20 sec
     - Subsequent: < 1 sec
     → Normal for free tier
     
  2. Database slow:
     - Check: Render PostgreSQL logs
     - Look for "query took 3000ms"
     → Add database indexes (Phase 2 was supposed to do this)
     
  3. Network slow:
     - Check: Browser network tab (F12 → Network)
     - See actual request time
     → If > 5 sec, likely database issue
     
  4. CPU maxed:
     - Check: Render metrics → CPU
     - If 100%: Upgrade to paid tier
```

### When to Contact Support vs. Fix Yourself

```
Fix Yourself:
  ✓ Database URL wrong → Update env var
  ✓ CNAME DNS not set → Add to registrar
  ✓ Service crashed → Check logs, fix code, redeploy
  ✓ Token issues → Check JWT_SECRET is set
  ✓ Cold start slow → Normal, wait 20 sec
  
Contact Render Support:
  ✗ Database corrupted/lost
  ✗ Quota/limits reached
  ✗ Infrastructure failure (red alerts)
  ✗ After 1 hour of troubleshooting without success
```

---

## 📋 FINAL SIGN-OFF

```
When all sections completed and validated:

✅ Web Service created
✅ PostgreSQL ready
✅ Secrets configured
✅ Domain & HTTPS active
✅ First deployment successful
✅ Health checks passing
✅ Cycle utilisateur tested
✅ Monitoring active

Then:
  🚀 CITOYENAVISE.ORG LANCEMENT PUBLIC EFFECTIF
```

---

**Document De Déploiement Complété** ✅

