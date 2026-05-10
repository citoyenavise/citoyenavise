# 🏥 Health Checks — Citoyen Avisé

**Endpoints de monitoring pour Render.com, Kubernetes, Load Balancers**

---

## 📍 Endpoints

| Endpoint | Purpose | Used By | HTTP Code |
|----------|---------|---------|-----------|
| **GET /health** | Full health status | Render, Monitoring, Dashboards | 200 or 503 |
| **GET /health/ready** | Readiness probe | Load Balancers, Kubernetes | 200 or 503 |
| **GET /health/live** | Liveness probe | Kubernetes, Auto-restart | 200 or 503 |

---

## 🧪 Test Local

```bash
# Full health check
curl http://localhost:5000/health | jq .

# Readiness (can accept traffic?)
curl http://localhost:5000/health/ready | jq .

# Liveness (is service alive?)
curl http://localhost:5000/health/live | jq .
```

---

## 📊 Response Examples

### **GET /health** (200 OK)
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

### **GET /health/ready** (200 OK)
```json
{
  "ready": true,
  "timestamp": "2026-05-10T15:30:00.123Z"
}
```

### **GET /health/live** (200 OK)
```json
{
  "alive": true,
  "timestamp": "2026-05-10T15:30:00.123Z",
  "uptime": 3600
}
```

### **503 Service Unavailable** (DB down)
```json
{
  "ready": false,
  "timestamp": "2026-05-10T15:30:00.123Z",
  "services": {
    "database": false
  }
}
```

---

## 🚀 Render.com Configuration

**Already configured in `render.yaml`:**
```yaml
healthCheckPath: /health
healthCheckProtocol: HTTP
healthCheckTimeout: 5
healthCheckInterval: 30
```

**What this does:**
- ✅ Checks `/health` every 30 seconds
- ✅ Expects response in < 5 seconds
- ✅ Removes from load balancer if unhealthy
- ✅ Auto-restarts if consistently unhealthy

---

## 🔍 What's Monitored

### Database Connection
```json
"database": {
  "status": "connected|disconnected",
  "type": "postgresql"
}
```
- ✅ Connects to PostgreSQL
- ✅ Executes test query
- ✅ Returns status

### Memory Usage (MB)
```json
"memory": {
  "heapUsed": 45,        // Used JavaScript memory
  "heapTotal": 128,      // Allocated memory
  "rss": 156,            // Physical memory (Resident Set Size)
  "external": 2          // External buffers
}
```
- ⚠️ Alert if `heapUsed > 80% of heapTotal`
- 🔴 Critical if `heapUsed > 95%` (memory leak likely)

### CPU Usage
```json
"cpu": {
  "user": 1200,          // User CPU time (microseconds)
  "system": 300          // System CPU time
}
```

### Uptime
```json
"uptime": 3600           // Seconds since process started
```
- Resets to 0 on restart
- Useful to detect crash/restart cycles

---

## 🎯 Integration Points

### ✅ Render.com
- Automatically uses `/health` endpoint
- No configuration needed beyond `render.yaml`
- Visible in Dashboard → Service → Health

### ✅ Kubernetes
```yaml
readinessProbe:
  httpGet:
    path: /health/ready
    port: 5000
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /health/live
    port: 5000
  periodSeconds: 10
```

### ✅ Monitoring Services
- DataDog: POST to `/health` every 30s
- New Relic: Integration via APM
- Sentry: Health events tracked

### ✅ Load Balancers
- ALB (AWS): Uses `/health/ready` for target health
- HAProxy: Backend health checks
- Nginx: Upstream server health

---

## 🛠️ Troubleshooting

### **Health check returns 503**

```bash
# Check what's down
curl http://localhost:5000/health | jq .database

# View logs
npm run dev 2>&1 | grep -i "disconnected|error"

# Test DB directly
psql "$DATABASE_URL" -c "SELECT 1"
```

### **Render shows "Unhealthy"**

1. Check if service is actually running
2. Verify port 5000 is exposed
3. Check logs for errors
4. Ensure DATABASE_URL is set

### **Memory keeps growing**

```bash
# Check memory stats
curl http://localhost:5000/health | jq .memory

# If heapUsed ≈ heapTotal, there's a memory leak
# Restart the service to verify it recovers
```

---

## 📈 Monitoring Best Practices

### 1. **Set Up Alerts**
```
Alert on:
- database.status = "disconnected" → Critical
- memory.heapUsed / memory.heapTotal > 0.8 → Warning
- uptime = 0 for > 1 minute → Critical (crash loop)
- response > 5 seconds → Warning
```

### 2. **Check Regularly**
```bash
# Every 5 minutes
*/5 * * * * curl -s http://localhost:5000/health | jq .database
```

### 3. **Dashboard**
- Display `/health` response in real-time dashboard
- Graph memory trends over 24h
- Track restart frequency

---

## ✨ Features

- ✅ **No Authentication Required** — Accessible to load balancers
- ✅ **Fast Response** — < 5ms typical (< 1s for DB check)
- ✅ **Detailed Metrics** — Memory, CPU, Database, Uptime
- ✅ **Kubernetes Compatible** — readiness & liveness probes
- ✅ **Production Ready** — Error handling, graceful failure
- ✅ **Zero External Dependencies** — Just Node.js built-ins

---

## 📝 Code Reference

### Service Implementation
```javascript
// backend/src/services/health/HealthService.js
export class HealthService {
  static async getHealth()      // Full status
  static async checkDatabase()  // DB connectivity
  static async getReadiness()   // Ready for traffic?
  static async getLiveness()    // Still alive?
}
```

### Routes
```javascript
// backend/src/routes/health.js
GET /health        → HealthService.getHealth()
GET /health/ready  → HealthService.getReadiness()
GET /health/live   → HealthService.getLiveness()
```

---

## 📞 Support

- Full documentation: [MONITORING.md](./MONITORING.md)
- Service code: `backend/src/services/health/HealthService.js`
- Route code: `backend/src/routes/health.js`
- Tests: `backend/__tests__/health.test.js`

---

**Health checks are active and ready for production! ✅**
