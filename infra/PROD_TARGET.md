# 🎯 PRODUCTION TARGET — PHASE 8

**Date:** 2026-05-05  
**Statut:** Infrastructure déployable et coûtée  
**Fournisseur:** Render (PaaS)

---

## 📦 CHOIX INFRASTRUCTURE

### Fournisseur: **Render** ✅

**Raison du choix:**
- ✅ HTTPS automatique (certificats Let's Encrypt gérés)
- ✅ Déploiement automatique depuis Git (commit → deploy)
- ✅ PostgreSQL managed service (free tier 90 jours, puis ~$7/mois)
- ✅ Redis managed (optional, gratuit self-hosted via Docker)
- ✅ Budget très bas (~5€/mois pour MVP)
- ✅ Scaling automatique si besoin
- ✅ Logs natifs (stdout/stderr captured)
- ✅ Environmental variables management
- ✅ Pas de surcharge de complexité (vs. VPS/Kubernetes)

**Alternatives rejetées:**
- Railway: Plus cher (~$10+/mois minimum)
- Fly.io: Overkill pour 20-50 users
- VPS: Nécessite gestion SSL + monitoring manuel
- Kubernetes: Complexité excessive pour MVP

---

## 🌍 RÉGION & INSTANCE

**Région:** Frankfurt (Europe) ou US (selon latence souhaitée)
- ✅ Proche de France (faible latence pour utilisateurs EU)
- ✅ Datacenters sécurisés et maintenus

**Type d'instance Render:**
```
Backend (Node.js):
  - Memory: 0.5 GB (free tier) → 1-2 GB (paid, ~$7/mois)
  - Instances: 1 (vertical scaling suffisant pour MVP)
  - Auto-scaling: Disabled (coût prévisible)

Database (PostgreSQL managed):
  - Tier: Free (90 jours) → Standard (~$7/mois after)
  - Backups: Automatic daily
  - Replicas: None (coût minimal)

Redis (optional):
  - Self-hosted via Docker sidecar (si budget tight)
  - Ou external Redis Cloud free tier (~5GB)
```

---

## 💰 BUDGET PRÉVISIONNEL

**Coûts mensuels (production stable):**

| Service | Tier | Coût/mois | Notes |
|---------|------|-----------|-------|
| Backend (Node.js) | Starter | $7 | 0.5GB RAM, auto-sleep, limited CPU |
| PostgreSQL | Standard | $7 | 2GB, backups, replicas |
| Redis | Cloud Free | $0 | 5GB free, suffisant pour cache |
| Domaine | Existing | $0 | citoyenavise.org (externe) |
| Monitoring | UptimeRobot | $0 | Free (email alerts) |
| **TOTAL** | | **$14/mois** | ✅ Sous budget |

**Alternative budget ultra-light (~$7/mois):**
- Backend + Database only (Redis via memory fallback)
- Acceptable si Redis DOWN accepté

---

## 🔄 SCALING STRATEGY

**Phase 1 (0-50 users):**
- Single Render instance (auto-scale disabled)
- Free/Standard PostgreSQL
- Memory Redis (fallback to cache.js memory store)
- No load balancer needed

**Phase 2 (50-500 users):**
- 2-3 backend instances avec load balancer Render
- PostgreSQL replicas (read-only)
- Redis managed service upgraded
- Estimated: $50-100/mois

**Phase 3 (500-2000 users):**
- Consider migration to Fly.io ou VPS + Docker Swarm
- Database sharding potentially needed
- CDN frontend (Cloudflare free tier)

**Criterium pour scale-up:**
- If response time > 2s for any endpoint
- If CPU usage > 80% sustained
- If database connection pool exhausted

---

## 🛠️ DÉPLOIEMENT RENDER

### Git Integration
```bash
# Render auto-deploys on:
# 1. git push to main branch
# 2. Render webhook triggered
# 3. Build starts automatically
# 4. Health checks verify service
```

### Environment Variables
```
Render Dashboard → Settings → Environment Variables:
  NODE_ENV=production
  PORT=3000 (Render exposes via reverse proxy)
  DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[dbname]
  REDIS_URL=redis://[host]:6379
  JWT_SECRET=[32+ chars, random]
  JWT_REFRESH_SECRET=[32+ chars, random, different]
  VITE_API_URL=/api/v1 (relative URL, same domain)
  FRONTEND_BUILD_PATH=frontend/dist
```

### Build & Start Commands
```
Build Command: npm run build
Start Command: npm start
```

---

## 🌐 CUSTOM DOMAIN

### Domaine: **citoyenavise.org**

**Setup DNS (Registrar):**
1. Aller sur Render Dashboard
2. Service → Settings → Custom Domains
3. Ajouter: citoyenavise.org
4. Render fournit CNAME target: `[service-id].onrender.com`
5. Dans registrar DNS:
   ```
   CNAME: citoyenavise.org → [service-id].onrender.com
   ```
6. Attendre ~15-30 min pour DNS propagation
7. Render génère automatiquement certificat SSL

**Vérification HTTPS:**
```bash
curl -I https://citoyenavise.org
# → HTTP/2 200
# → Certificate from Let's Encrypt (auto-renewed)
```

---

## 🔒 SÉCURITÉ

**Automations Render:**
- ✅ HTTPS/TLS auto (Let's Encrypt)
- ✅ DDoS protection (Render infrastructure)
- ✅ WAF basic (via Render CDN)

**Application Level (existant):**
- ✅ Helmet security headers (CSP, HSTS, X-Frame-Options)
- ✅ Rate limiting (100/15min global, 5/15min auth)
- ✅ JWT + token refresh
- ✅ Bcrypt passwords
- ✅ CORS configured

**Secrets Management:**
- ✅ Environment variables encrypted by Render
- ✅ No .env files in Git
- ✅ Keys rotated post-launch

---

## 📊 MONITORING & OBSERVABILITY

**Render Native:**
- ✅ Logs via dashboard (stdout/stderr)
- ✅ Metrics: CPU, Memory, Requests
- ✅ Uptime dashboard
- ✅ Alerts via email (paid tier)

**External (Free Layer):**
- UptimeRobot: Monitor /health endpoint every 5 min
- Alerts: Email + SMS if DOWN

---

## 🚀 DÉPLOIEMENT WORKFLOW

```
1. Local test:
   npm run start:prod-local
   ✓ Frontend dist builds
   ✓ Backend starts on :5000
   ✓ Open http://localhost:5000

2. Git push:
   git add . && git commit -m "..." && git push origin main

3. Render auto:
   ✓ Webhook triggered
   ✓ npm run build (frontend)
   ✓ npm start (backend)
   ✓ Health checks (/health)
   ✓ HTTPS ready

4. Verify:
   curl -I https://citoyenavise.org
   curl https://citoyenavise.org/api/v1/health
```

---

## ✅ CONSTRAINTS & ASSUMPTIONS

**Acceptables pour MVP:**
- ✅ Single region (Frankfurt)
- ✅ No multi-region failover (first phase)
- ✅ Database on same provider (vs. RDS elsewhere)
- ✅ Email alerts only (no Slack integration phase 1)
- ✅ Memory cache fallback when Redis down

**Non-acceptable (vérifier avant launch):**
- ❌ Hardcoded secrets in code (must use env vars)
- ❌ Non-HTTPS traffic (automatic redirect)
- ❌ Database without backups (Render auto-backup)
- ❌ No health endpoint (must exist)

---

## 📋 CHECKLIST PRÉ-DÉPLOIEMENT

- [ ] Domaine citoyenavise.org DNS configuré
- [ ] Render account créé et linked à Git
- [ ] Environment variables définies (JWT, DB, Redis)
- [ ] Build command testé localement
- [ ] Health endpoint reachable
- [ ] Frontend dist presente
- [ ] HTTPS certificate auto-generated
- [ ] Logs visible in Render dashboard
- [ ] UptimeRobot monitoring active
- [ ] Test user cycle on prod (signup → login → create)

---

**INFRASTRUCTURE CIBLE: RENDER + CITOYENAVISE.ORG**

Status: ✅ Ready for implementation

