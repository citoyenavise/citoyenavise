# 📊 CENTRALIZED LOGGING SETUP

**Production Logging Configuration for Citoyenavise.org**

---

## 🎯 LOGGING STRATEGY

### Architecture
```
Backend (Node.js)
  ↓ JSON structured logs (Winston)
  ↓ stdout/stderr
  ↓ Render captures
  ↓ Render logs dashboard (7 days)
  ↓ Optional: Export to Logtail (long-term)
```

### Log Types
1. **Application Logs** (INFO, WARN, ERROR)
2. **Request Logs** (HTTP method, path, status, response time)
3. **Error Logs** (stack traces, context)
4. **Database Logs** (slow queries, connection errors)
5. **Event Logs** (EventBus handlers, notifications)

---

## 🔧 BACKEND LOGGING (Winston)

### Current Configuration
**File:** `backend/src/core/utils/logger.js`

Already implemented:
- ✅ JSON format (structured logs)
- ✅ Timestamp with ISO 8601
- ✅ Level: error, warn, info, debug
- ✅ Context (userId, requestId, etc.)
- ✅ Transport: console (stdout)

### Log Format Example
```json
{
  "timestamp": "2026-05-05T14:23:45.123Z",
  "level": "error",
  "message": "Database connection failed",
  "context": {
    "userId": 123,
    "endpoint": "GET /ideas",
    "error": "ECONNREFUSED",
    "stack": "Error: Connection refused at ..."
  }
}
```

### Environment Variables (Render)
```
NODE_ENV=production
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## 📡 RENDER NATIVE LOGS

### Built-in Features
- ✅ **Capture:** Automatically captures stdout/stderr
- ✅ **Retention:** 7 days free (older logs discarded)
- ✅ **Search:** Full-text search in dashboard
- ✅ **Filtering:** By level, timestamp, text
- ✅ **Export:** JSON export available
- ✅ **Cost:** Free (included)

### Access Logs
```
Render Dashboard:
  → Service → Logs tab
  → Shows: Build logs, runtime logs, errors
  → Filter by timestamp
  → Search by keyword
```

### Log Levels
```
ERROR   → Problems requiring action
WARN    → Potential issues (rate limit, retry)
INFO    → Normal operations (API calls, events)
DEBUG   → Detailed tracing (optional in prod)
```

### Best Practice: Only INFO+
```javascript
// In production
if (process.env.NODE_ENV === 'production') {
  logger.setLevel('info') // Skip debug spam
}
```

---

## 🔄 OPTIONAL: LOGTAIL (Long-term)

### Why Logtail?
- Render logs only 7 days
- Logtail stores 30+ days free tier
- Good for compliance/audit trails
- Easy setup: OAuth2

### Setup

**1. Create Logtail Account**
```
https://betterstack.com/logs
Sign up → Create source (Node.js)
Get: TOKEN
```

**2. Configure Backend**
```bash
# Install
npm install --save @logtail/node

# In backend/src/core/utils/logger.js
const { Logtail } = require('@logtail/node')
const logtail = new Logtail(process.env.LOGTAIL_TOKEN)

// Send errors to Logtail
if (process.env.NODE_ENV === 'production') {
  logger.on('error', (log) => {
    logtail.log(log)
  })
}
```

**3. Render Environment Variable**
```
LOGTAIL_TOKEN=your-token-here
```

**4. Monitoring**
```
Logtail Dashboard:
  → Live logs (real-time)
  → Errors tab (aggregated)
  → Alerts on error spikes
```

### Cost
- ✅ Free tier: Up to 100GB/month
- ✅ Retention: 30+ days
- ✅ Alerting: Email alerts (free)

---

## 🚨 ERROR TRACKING & ALERTS

### Option 1: Logtail Alerts (Recommended)

**Setup:**
1. Logtail Dashboard → Alerts
2. Create alert for: `level = "error"`
3. Condition: 5+ errors in 5 minutes
4. Notification: Email

**Alert Rules:**
```
Trigger when:
  - ERROR level appears (any error)
  - 5+ errors in 5 min window
  - Database connection fails
  - API endpoint returns 500
```

### Option 2: Simple Manual Check
```bash
# Daily review of Render logs
1. Render Dashboard → Logs
2. Filter: "ERROR" or "500"
3. Check if any critical issues
4. Respond to failures
```

---

## 📋 LOG SOURCES

### Application Logs
```
Source: Winston logger
Level: INFO/WARN/ERROR
Example:
  POST /ideas → INFO "Idea created, id=123"
  401 Unauthorized → WARN "Invalid token"
```

### Request Logs
```
Source: Express request middleware
Level: INFO
Format: METHOD PATH STATUS TIME
Example:
  GET /api/v1/feed 200 145ms
  POST /api/v1/ideas 201 234ms
```

### Error Logs
```
Source: Express error handler
Level: ERROR
Format: ERROR_TYPE MESSAGE STACK
Example:
  TypeError: Cannot read property 'id' of null
  Stack trace: at /app/src/modules/posts/service.js:45
```

### Database Logs
```
Source: pool query errors
Level: WARN/ERROR
Example:
  WARN "Slow query: SELECT took 2500ms"
  ERROR "Connection timeout to postgres"
```

### Event Logs
```
Source: EventBus handlers
Level: INFO/ERROR
Example:
  INFO "UserFollowed event triggered"
  ERROR "NotificationHandler failed: ECONNREFUSED"
```

---

## 🔍 SEARCHING LOGS

### Render Dashboard
```
Search syntax:
  level:error              → Only errors
  path:/api/ideas         → Specific endpoint
  userId:123              → User-specific
  "connection refused"    → Text search
  timestamp:>2h ago       → Recent logs
```

### Example Queries
```
# All API errors in last hour
level:error endpoint:/api

# User activity
userId:123

# Slow requests
time:>1000

# Authentication issues
Authorization OR "401" OR "token"
```

---

## 📊 MONITORING DASHBOARD (Optional)

### Grafana Loki (Self-hosted)
```
If scaling to dedicated infrastructure:
  - Deploy Loki (log aggregation)
  - Deploy Grafana (visualization)
  - Create dashboards for:
    - Error rate per endpoint
    - Response time distribution
    - Traffic patterns
    - Database performance
```

### Docker Compose (Reference)
```yaml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./infra/loki-config.yml:/etc/loki/local-config.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    datasources:
      - loki: http://loki:3100
```

---

## 🛡️ SECURITY & COMPLIANCE

### Data Protection
- ✅ No passwords/tokens in logs (sanitize)
- ✅ No PII (email, phone, address) unless necessary
- ✅ Render encrypts logs in transit + at rest
- ✅ Logtail GDPR-compliant (EU data centers)

### Sanitization
```javascript
// Don't log sensitive data
logger.error('User auth failed', {
  // ❌ BAD
  // password: req.body.password,
  
  // ✅ GOOD
  email: req.body.email,
  errorCode: 'INVALID_PASSWORD'
})
```

### Log Retention
- Render: 7 days (auto-delete)
- Logtail: 30 days (free tier)
- Archive: Manually export for compliance if needed

---

## 📋 CHECKLIST

### Pre-Launch
- [x] Winston logger configured (JSON format)
- [x] All modules using logger.error/warn/info
- [x] No hardcoded console.log (use logger)
- [x] Request middleware logging active
- [x] Error handler logs stack traces
- [x] EventBus handlers log events

### On Render
- [ ] Check logs visible in dashboard
- [ ] Create test error (trigger 500)
- [ ] Verify error appears in logs within 5s
- [ ] Check log format is JSON (searchable)

### Optional (Logtail)
- [ ] Logtail account created
- [ ] LOGTAIL_TOKEN added to Render env vars
- [ ] Test logs forwarding (wait 30s)
- [ ] Alert configured for 5+ errors/5min

---

## 🚀 OPERATIONAL PROCEDURES

### Daily Monitoring
```bash
# Morning check: Any critical errors?
1. Render logs → Filter "ERROR"
2. Logtail dashboard → Errors tab
3. Response: Fix issues or create ticket
```

### Debugging API Issue
```bash
# Example: POST /ideas returns 500
1. Render logs → Search "POST /ideas"
2. Filter by timestamp (exact time of request)
3. Find stack trace showing root cause
4. Fix code, push, auto-redeploy
```

### Investigating Performance
```bash
# Why is /feed slow?
1. Render logs → Search "GET /feed"
2. Check response time (TIME field)
3. Look for database warnings (WARN level)
4. Analyze cache hits/misses
```

---

## 📈 SCALING LOGGING

### Phase 1 (Current: 20-50 users)
- ✅ Render logs (7 days) + Logtail (30 days)
- ✅ Manual daily check
- ✅ Email alerts on errors

### Phase 2 (100-500 users)
- Add Grafana dashboards
- Implement log aggregation (ELK or Loki)
- Automated alerting (Slack integration)
- Performance monitoring (Prometheus)

### Phase 3 (1000+ users)
- Distributed tracing (Jaeger)
- Advanced analytics
- Dedicated ops team
- Splunk/Datadog for enterprise

---

**Centralized logging: Render native + optional Logtail.** ✅

