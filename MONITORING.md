# 🔍 Monitoring & Health Checks — Citoyen Avisé

**Date:** 2026-05-10  
**Status:** ✅ Production Ready

---

## 📊 Health Check Endpoints

L'API expose **3 endpoints** pour le monitoring et les orchestrations (Render, Kubernetes, etc):

### 1. **GET /health** — Full Status (Tous les détails)

```bash
curl http://localhost:5000/health
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "timestamp": "2026-05-10T15:30:00.123Z",
  "uptime": 3600,
  "database": {
    "status": "connected",
    "type": "postgresql"
  },
  "memory": {
    "heapUsed": 45,
    "heapTotal": 128,
    "rss": 156,
    "external": 2
  },
  "cpu": {
    "user": 1200,
    "system": 300
  },
  "responseTime": "2ms"
}
```

**Utilisé par:**
- Render.com monitoring dashboard
- DataDog / New Relic / Sentry
- Dashboards internes

---

### 2. **GET /health/ready** — Readiness Probe

```bash
curl http://localhost:5000/health/ready
```

**Response (200 OK) — Ready:**
```json
{
  "ready": true,
  "timestamp": "2026-05-10T15:30:00.123Z"
}
```

**Response (503 Service Unavailable) — Not Ready:**
```json
{
  "ready": false,
  "timestamp": "2026-05-10T15:30:00.123Z",
  "services": {
    "database": false
  }
}
```

**Utilisé par:**
- Kubernetes `readinessProbe`
- Load balancers (Render, AWS ELB)
- Décide si le service peut recevoir du trafic

---

### 3. **GET /health/live** — Liveness Probe

```bash
curl http://localhost:5000/health/live
```

**Response (200 OK) — Alive:**
```json
{
  "alive": true,
  "timestamp": "2026-05-10T15:30:00.123Z",
  "uptime": 3600
}
```

**Response (503 Service Unavailable) — Dead:**
```json
{
  "alive": false,
  "timestamp": "2026-05-10T15:30:00.123Z",
  "error": "Service hung or crashed"
}
```

**Utilisé par:**
- Kubernetes `livenessProbe`
- Détecte les services *hung* (qui ne répondent plus)
- Décide si redémarrer le container

---

## 🚀 Configuration Render.com

### **Étape 1: Accéder aux Settings**

1. Aller à https://dashboard.render.com/
2. Sélectionner votre service (citoyenavise)
3. Cliquer sur **Settings** → **Health Checks**

### **Étape 2: Ajouter Health Check**

**Nom:** `API Health`  
**Type:** `HTTP`  
**Endpoint:** `/health`  
**HTTP Method:** `GET`  
**Expected HTTP Code:** `200`  
**Check Interval:** `30 seconds`  
**Timeout:** `5 seconds`  
**Failures before marking unhealthy:** `3`

**Configuration visuelle:**
```
Service Health Checks
┌─────────────────────────────────────┐
│ Name: API Health                    │
│ Type: HTTP                          │
│ Path: /health                       │
│ Method: GET                         │
│ Expected Code: 200                  │
│ Interval: 30s                       │
│ Timeout: 5s                         │
│ Failures: 3                         │
└─────────────────────────────────────┘
```

### **Étape 3: Sauvegarder**

Cliquer sur **Save** → Render va commencer les health checks

### **Étape 4: Vérifier dans les Logs**

Les health checks apparaîtront dans les logs:
```
GET /health - 200 - 2ms
GET /health - 200 - 1ms
GET /health - 200 - 3ms
```

---

## ✅ Configuration Kubernetes (si applicable)

Si vous déployez sur Kubernetes, voici la configuration Pod:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: citoyenavise
spec:
  containers:
  - name: api
    image: citoyenavise:latest
    ports:
    - containerPort: 5000

    # Readiness probe — route vers le load balancer?
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 5000
      initialDelaySeconds: 10
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3

    # Liveness probe — redémarrer le pod?
    livenessProbe:
      httpGet:
        path: /health/live
        port: 5000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3

    # Full health info
    startupProbe:
      httpGet:
        path: /health
        port: 5000
      initialDelaySeconds: 5
      periodSeconds: 5
```

**Ce que ça fait:**
1. **readinessProbe** — Attend 10s, puis checke `/health/ready` chaque 10s
   - Si 3 failures: retire du load balancer
   - Si success: réajoute au load balancer
2. **livenessProbe** — Après 30s, checke `/health/live` chaque 10s
   - Si 3 failures: redémarre le pod
3. **startupProbe** — Check initial au démarrage

---

## 📈 Monitoring Metrics Exposées

### **Memory (MB)**
```json
{
  "heapUsed": 45,      // JavaScript heap utilisé
  "heapTotal": 128,    // JavaScript heap total alloué
  "rss": 156,          // Resident Set Size (mémoire physique)
  "external": 2        // Mémoire externe (buffers, etc)
}
```

**Seuils d'alerte recommandés:**
- ⚠️ Yellow alert si `heapUsed > 80% de heapTotal`
- 🔴 Red alert si `heapUsed > 95% de heapTotal`

### **CPU**
```json
{
  "user": 1200,    // Microsecondes en user time
  "system": 300    // Microsecondes en system time
}
```

### **Database**
```json
{
  "status": "connected|disconnected",
  "type": "postgresql"
}
```

**Seuils d'alerte:**
- 🔴 Red alert si `status = "disconnected"`

### **Uptime**
```json
{
  "uptime": 3600   // Secondes depuis le démarrage
}
```

---

## 🔔 Intégration avec Services de Monitoring

### **DataDog**

```bash
# Ajouter custom metric via API
curl -X POST "https://api.datadoghq.com/api/v1/series" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -d '{
    "series": [{
      "metric": "citoyenavise.health.memory.heap",
      "points": [[1620000000, 45]],
      "type": "gauge"
    }]
  }'
```

### **New Relic**

```javascript
// Dans votre code instrumenté
newrelic.recordMetric('Custom/API/Health/Memory', memoryUsage.heapUsed);
```

### **Sentry**

```javascript
import * as Sentry from "@sentry/node";

// Capturer les health checks errors
router.get('/health', async (req, res) => {
  try {
    const health = await HealthService.getHealth();
    res.json(health);
  } catch (err) {
    Sentry.captureException(err);
    res.status(503).json({ error: err.message });
  }
});
```

---

## 📊 Dashboards Recommandés

### **Render.com Dashboard**
- ✅ Service status (Green/Yellow/Red)
- ✅ Uptime graph
- ✅ Memory usage over time
- ✅ Response times

### **CloudFlare Analytics**
Si CloudFlare est en front:
- ✅ Cache hit rate
- ✅ Error rates by status code
- ✅ Request latency

### **Custom Dashboard (exemple Grafana)**

```javascript
// Scrape toutes les 30s
setInterval(async () => {
  const res = await fetch('http://api:5000/health');
  const data = await res.json();
  
  // Envoyer à Grafana/Prometheus
  prometheus.gauge('api_memory_heap_used', data.memory.heapUsed);
  prometheus.gauge('api_uptime_seconds', data.uptime);
  prometheus.gauge('api_database_connected', data.database.status === 'connected' ? 1 : 0);
}, 30000);
```

---

## 🚨 Alertes Recommandées

### **Critical (Page immediately)**
- ❌ Database disconnected (`/health/ready` returns 503)
- ❌ Service doesn't respond (`/health/live` timeout)
- ❌ Memory heap > 95%

### **Warning (Alert in dashboard)**
- ⚠️ Memory heap > 80%
- ⚠️ Response time > 500ms
- ⚠️ High CPU usage

### **Info (Log only)**
- ℹ️ Service restart (uptime reset to 0)
- ℹ️ Health check failure (recovered quickly)

---

## 🧪 Test Local Health Checks

```bash
# Test endpoint simple
curl http://localhost:5000/health | jq .

# Test avec verbose
curl -v http://localhost:5000/health

# Boucle de test (toutes les 5s)
watch -n 5 'curl -s http://localhost:5000/health | jq .'

# Test readiness
curl http://localhost:5000/health/ready

# Test liveness
curl http://localhost:5000/health/live
```

---

## 📝 Configuration Recommandée (Production)

### **Render.com Settings**
```
Service Type: Web Service
Health Check: ✅ Enabled
Path: /health
Method: GET
Expected Status: 200
Interval: 30s
Timeout: 5s
Retries: 3
```

### **Environment Variables**
```env
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://...
MONITORING_ENABLED=true
HEALTH_CHECK_TIMEOUT=5000
```

### **Nginx Reverse Proxy (si applicable)**
```nginx
location /health {
    proxy_pass http://api:5000/health;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
    access_log off;  # Don't log health checks
}
```

---

## ✨ Avantages

- ✅ **Auto-healing:** Render détecte les services down et redémarre
- ✅ **Load balancing:** Retire les instances unhealthy du LB
- ✅ **Monitoring:** Dashboard en temps réel
- ✅ **Alertes:** Notifications si problème
- ✅ **Zero-downtime deployments:** Graceful shutdown
- ✅ **Kubernetes-ready:** Compatible livenessProbe/readinessProbe

---

## 📞 Troubleshooting

### **Health check returns 503**

```bash
# 1. Vérifier la DB
curl http://localhost:5000/health | jq .database

# 2. Vérifier les logs
npm run dev 2>&1 | grep -i health

# 3. Tester la connexion DB directement
psql $DATABASE_URL -c "SELECT 1"
```

### **Memory keeps increasing**

```bash
# 1. Check memory details
curl http://localhost:5000/health | jq .memory

# 2. Si heapUsed > heapTotal, il y a une fuite
# Redémarrer le service ou investiguer les fonctions async
```

### **Health check timeout sur Render**

1. Vérifier que le service écoute sur le bon port
2. Vérifier CORS settings (pas requis pour GET /health)
3. Vérifier firewall / network security groups

---

**Health checks configuré et prêt! 🚀**
