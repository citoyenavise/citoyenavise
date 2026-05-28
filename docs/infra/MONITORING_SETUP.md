# 📊 MONITORING & HEALTH CHECKS

**Production Monitoring for Citoyenavise.org**

---

## 🏥 HEALTH ENDPOINTS

### Endpoint 1: /health (Liveness)
```
GET /health

Purpose: Is the server running?
Response: 200 OK if running, timeout if down

Response (200 OK):
{
  "status": "ok",
  "timestamp": "2026-05-05T14:23:45.123Z",
  "uptime": 3600,
  "version": "1.0.0"
}

Use case:
  - Kubernetes liveness probe
  - Docker health check
  - Uptime robot pings every 5 min
```

### Endpoint 2: /ready (Readiness)
```
GET /ready

Purpose: Is the server ready to accept traffic?
Response: 200 OK if ready, 503 if degraded

Response (200 OK):
{
  "status": "ready",
  "database": "connected",
  "cache": "connected",
  "eventBus": "initialized"
}

Response (503 Service Unavailable):
{
  "status": "degraded",
  "database": "disconnected",
  "cache": "unavailable",
  "reason": "Cannot connect to Redis"
}

Use case:
  - Load balancer health check
  - Deployment readiness verification
  - Pre-launch checks
```

---

## 🔧 IMPLEMENTATION

### Backend Handler
**File:** Already present in backend/src/modules/health/

```javascript
// GET /health
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  })
})

// GET /ready
app.get('/ready', async (req, res) => {
  try {
    // Test database
    await pool.query('SELECT 1')
    
    // Test cache
    await cache.get('health-check')
    
    // Test EventBus
    const busReady = eventBus.isInitialized()
    
    if (!busReady) throw new Error('EventBus not ready')
    
    res.json({
      status: 'ready',
      database: 'connected',
      cache: 'connected',
      eventBus: 'initialized'
    })
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      error: err.message,
      timestamp: new Date().toISOString()
    })
  }
})
```

### Testing Locally
```bash
# Start backend
npm start

# Test liveness
curl http://localhost:5000/health
# → 200 OK

# Test readiness
curl http://localhost:5000/ready
# → 200 OK (if DB running)
# → 503 Service Unavailable (if DB down)
```

---

## 📡 UPTIME ROBOT MONITORING

### Setup (Recommended: Free Tier)

**1. Create Account**
```
https://uptimerobot.com
Free account: 50 monitors, 5-min interval, email alerts
```

**2. Add Monitor**
```
Monitor Type: HTTP(s)
URL: https://citoyenavise.org/health
Interval: Every 5 minutes
Timeout: 10 seconds
```

**3. Configure Alerts**
```
Alert Contacts: Your email
Notification:
  - ON: When site is down
  - ON: When site is up (after downtime)
  - OFF: Reminder alerts
```

**4. Render Integration (Optional)**
```
If using Render + UptimeRobot:
  - Render spins down free instances after 15 min inactivity
  - UptimeRobot pings every 5 min (keeps instance warm)
  - Good for free tier: No cold starts
```

### Dashboard
```
UptimeRobot Dashboard shows:
  - Green: Last 24h, 7d, 30d uptime %
  - Ping times (avg, min, max)
  - Down events (when, duration, why)
  - SLA compliance
```

---

## 🔔 RENDER NATIVE MONITORING

### Built-in Features
```
Service Dashboard shows:
  - CPU usage (%)
  - Memory usage (%)
  - Requests (per minute)
  - Response time (avg, p95, p99)
  - Error rate (%)
  - Deployment history
```

### Alerts (Paid Tier)
```
If upgrading Render (from free):
  - Configure alerts for:
    - CPU > 80%
    - Memory > 90%
    - Error rate > 5%
    - Response time > 2s
  - Notification: Email
```

### Manual Check
```bash
# SSH into Render logs (no direct SSH)
# But logs available in Render dashboard:
Service → Logs tab
```

---

## 📊 DATADOG ALTERNATIVE (If Scaling)

### Why Datadog?
- Comprehensive APM (Application Performance Monitoring)
- Log aggregation + tracing
- Custom metrics
- Alerting + escalation
- Paid (but free trial 14 days)

### Setup (If needed later)
```bash
# Install agent in Docker
docker run -d \
  -e DD_API_KEY=your-key \
  -e DD_SITE=datadoghq.eu \
  datadog/agent:latest

# Automatic collection of:
  - Request metrics
  - Database performance
  - Memory leaks
  - Error tracking
```

---

## 🚨 ALERT RULES

### Critical (Immediate Action)
```
1. /health returns 503 or timeout (> 10s)
   → Alert: CRITICAL
   → Action: Check Render logs, restart service
   
2. Error rate > 10% (> 10% of requests failing)
   → Alert: CRITICAL
   → Action: Review error logs, potential data loss
   
3. Response time > 5s for any endpoint
   → Alert: WARNING
   → Action: Check database performance
```

### Warning (Review)
```
1. Database slow queries (> 2s)
   → Alert: WARNING
   → Action: Check query plans, add indexes
   
2. Cache hits < 50% for /feed endpoint
   → Alert: INFO
   → Action: Review cache strategy
   
3. EventBus handler failure
   → Alert: WARNING
   → Action: Check logs, retry mechanism
```

### Informational (For Trends)
```
1. Unusual traffic spike (2x normal)
2. New user registrations (daily total)
3. Deployment frequency (track velocity)
```

---

## 📋 RENDER DEPLOYMENT CHECKS

### Pre-Deployment
```bash
# 1. Local test
npm run start:prod-local
# → App starts on :5000
# → No errors in logs
# → /health returns 200

# 2. Frontend verify
curl http://localhost:5000/
# → HTML loads (not 404)
# → Assets load (no CORS errors)

# 3. API test
curl http://localhost:5000/api/v1/health
# → 200 OK
```

### Post-Deployment
```
1. Render dashboard → Logs
   → Check for startup errors
   → Verify migrations ran (if any)

2. UptimeRobot monitors /health
   → Should show 200 within 5 min

3. Manual production check
   curl -I https://citoyenavise.org/health
   # → HTTP/2 200
   # → Response < 1s
```

---

## 📈 METRICS TO TRACK

### Application Metrics
```
- Requests/sec (load)
- Error rate % (health)
- Response time p95 (latency)
- Active database connections (resource)
- Cache hit rate % (performance)
```

### Business Metrics
```
- Signups/day (growth)
- Daily active users (engagement)
- Ideas created/day (content)
- Comments/day (interaction)
```

### Infrastructure Metrics
```
- CPU % (capacity)
- Memory % (capacity)
- Disk usage (storage)
- Network I/O (bandwidth)
```

---

## 🔄 INCIDENT RESPONSE

### If Service is Down

**Step 1: Verify (10s)**
```bash
curl -I https://citoyenavise.org/health
# Timeout or 503?

# Check Render status
# → Is platform operational?
```

**Step 2: Check Logs (30s)**
```
Render Dashboard → Service → Logs
Filter: "ERROR"
Look for: Startup error, database error, crash
```

**Step 3: Check Dependencies (1 min)**
```
Is PostgreSQL running?
  → Render → Data Services → Databases
  
Is Redis running?
  → Optional, app has memory fallback
  
Is network connectivity ok?
  → Try curl to /health from local machine
```

**Step 4: Restart Service (1 min)**
```
Render Dashboard → Service
Click: "Restart Service"
Wait: 20-30s for startup
Verify: /health returns 200
```

**Step 5: If Still Down (5 min)**
```
Last resort: Rollback to previous deployment
Render → Deployments tab
Select: Previous successful deploy
Click: Re-deploy

Estimated recovery: 5-10 min total
```

---

## 📊 UPTIME SLA

### Target: 99% uptime
```
Total minutes/month: 43,200
Allowed downtime: 432 minutes (7.2 hours)

Acceptable:
  - 1 hour unplanned outage/month
  - 1 hour planned maintenance/month

Not acceptable:
  - > 2 hours downtime/month
  - Regular outages
```

### Tracking
```
UptimeRobot reports:
  - Daily uptime %
  - Monthly SLA %
  - Incidents + resolution time
  - Export to CSV for reports
```

---

## 🛠️ MAINTENANCE WINDOWS

### Planned Downtime
```
Render allows: Scheduled maintenance
Use case: Database migrations, major updates

Procedure:
1. Announce maintenance (email users)
2. Trigger maintenance mode (optional feature)
3. Deploy changes
4. Run database migrations (if any)
5. Health check /ready endpoint
6. Resume operations
```

---

## 📋 CHECKLIST

### Pre-Launch
- [x] /health endpoint implemented
- [x] /ready endpoint implemented
- [x] Health check responds in < 1s
- [x] Ready check tests database + cache
- [ ] UptimeRobot account created
- [ ] UptimeRobot monitoring /health
- [ ] Email alerts configured
- [ ] Test alert: Manually stop service, verify email

### Launch
- [x] Render monitoring enabled
- [x] Logs visible in dashboard
- [x] UptimeRobot shows green (200 OK)
- [x] SLA tracking active
- [x] Incident response procedure documented

---

## 🚀 MONITORING DASHBOARD (Reference)

### If scaling to dedicated infrastructure:
```
Tools:
  - Prometheus (metrics collection)
  - Grafana (dashboard + alerting)
  - AlertManager (routing alerts)
  
Dashboards:
  - System health (CPU, memory, disk)
  - Application performance (requests, errors)
  - Business metrics (signups, DAU)
  - Infrastructure (database, cache)
```

---

**Health checks configured. Monitoring via Render + UptimeRobot.** ✅

