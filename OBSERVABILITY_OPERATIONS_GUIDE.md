# 📊 OBSERVABILITY & MONITORING GUIDE

**Version** : 1.0.0  
**Date** : 2026-05-07  
**Status** : Production Ready  
**Audience** : Operations, DevOps, Site Reliability Engineers  

---

## 📈 Monitoring Architecture

### Stack Overview

```
Application Layer:
  └─ Node.js API Server
     ├─ Prometheus client (metrics export)
     ├─ Winston logger (JSON logs)
     ├─ OpenTelemetry (tracing)
     └─ Custom instrumentation

Metrics Collection:
  └─ Prometheus Server
     ├─ Scrape interval: 15 seconds
     ├─ Storage: 30 days
     ├─ Targets: API, DB, Cache, System

Visualization:
  └─ Grafana
     ├─ 5 operational dashboards
     ├─ Custom alerts
     ├─ SLA tracking

Log Aggregation:
  └─ ELK Stack
     ├─ Elasticsearch (storage)
     ├─ Logstash (processing)
     ├─ Kibana (visualization)

Distributed Tracing:
  └─ Jaeger
     ├─ Trace storage: Cassandra
     ├─ Retention: 14 days
     └─ Sampling: 10% (adaptive)

Alerting:
  └─ Prometheus Alertmanager
     ├─ PagerDuty integration
     ├─ Slack integration
     └─ Email notifications
```

---

## 📊 Dashboards

### System Health Dashboard

**URL**: `https://grafana.prod/d/system-health`

**Panels**:
```
Row 1: System State
  ├─ StateMachine State (gauge)
  │  └─ Alert if state != READY
  ├─ Module Status (status map)
  │  └─ Shows all 15 modules
  └─ Service Availability (gauge)
     └─ Shows 5 services

Row 2: Performance
  ├─ Bootstrap Time (gauge, 245ms)
  ├─ System Uptime (counter)
  ├─ Memory Usage (gauge, 92MB)
  └─ CPU Usage (gauge)

Row 3: Errors
  ├─ Error Rate (graph, 1m average)
  ├─ Critical Errors (table)
  ├─ Module Failures (gauge)
  └─ Service Failures (gauge)
```

### API Performance Dashboard

**URL**: `https://grafana.prod/d/api-performance`

**Panels**:
```
Row 1: Request Metrics
  ├─ Requests/sec (graph)
  │  └─ Baseline: 345 req/sec
  ├─ Request Distribution (table)
  │  └─ By endpoint
  ├─ Success Rate (gauge)
  │  └─ Target: > 99.9%
  └─ Error Rate (gauge)
     └─ Alert if > 1%

Row 2: Latency
  ├─ Response Time (graph)
  │  ├─ Average: 145ms
  │  ├─ P95: 234ms
  │  └─ P99: 456ms
  ├─ Slowest Endpoints (table)
  ├─ Latency Heatmap (heatmap)
  └─ Response Distribution (histogram)

Row 3: Database
  ├─ Query Time (graph)
  │  └─ Average: 45ms
  ├─ Connection Pool (gauge)
  │  └─ 20 active / 50 max
  ├─ Slow Queries (table)
  └─ Query Errors (gauge)

Row 4: Cache
  ├─ Cache Hit Rate (gauge)
  │  └─ Target: > 70%
  ├─ Cache Misses (counter)
  ├─ Cache Size (gauge)
  └─ Evictions (counter)
```

### EventBus Dashboard

**URL**: `https://grafana.prod/d/eventbus`

**Panels**:
```
Row 1: Event Flow
  ├─ Events Emitted (counter)
  │  └─ By event type
  ├─ Event Throughput (gauge)
  │  └─ 834 events/sec capacity
  ├─ Event History Length (gauge)
  │  └─ Max 1000 events
  └─ Event Rate (graph)

Row 2: Listeners
  ├─ Listener Execution Time (histogram)
  ├─ Listener Timeouts (counter)
  │  └─ Alert if > 5 in 5 min
  ├─ Listener Errors (counter)
  ├─ Listener Success Rate (gauge)
  └─ Listener Performance (table)

Row 3: Reliability
  ├─ Retry Attempts (counter)
  ├─ Listener Isolation (gauge)
  ├─ Event Loss (gauge, target: 0)
  └─ Message Queue Depth (gauge)
```

---

## 📝 Logging

### Log Format

```json
{
  "timestamp": "2026-05-07T14:30:45.123Z",
  "level": "info|warn|error|debug",
  "service": "citoyenavise-api",
  "requestId": "req_abc123xyz789",
  "traceId": "trace_def456uvw012",
  "userId": "user_123 (optional)",
  "action": "POST /api/v1/posts",
  "method": "POST",
  "path": "/api/v1/posts",
  "statusCode": 201,
  "responseTime": 145,
  "module": "posts",
  "message": "Post created successfully",
  "metadata": {
    "contentLength": 512,
    "tags": ["technology"],
    "ipAddress": "203.0.113.45"
  },
  "error": null,
  "correlation": {
    "request_id": "req_abc123xyz789",
    "trace_id": "trace_def456uvw012",
    "parent_id": "parent_123"
  }
}
```

### Log Levels

```
ERROR: System errors, exceptions, critical failures
  └─ Alert on-call immediately
  └─ Retention: 90 days
  └─ Example: Database connection failed

WARN: Degradation, retries, unusual conditions
  └─ Notify team
  └─ Retention: 90 days
  └─ Example: Slow query (> 1s)

INFO: Normal operation, state changes, auditable events
  └─ Retention: 90 days
  └─ Example: User login, post created

DEBUG: Detailed execution flow (staging only)
  └─ Not in production
  └─ For troubleshooting
```

### Kibana Access

```
URL: https://kibana.prod:5601
Authentication: LDAP
Default Index: logstash-*

Common Searches:
  └─ errors: "level:error"
  └─ slow queries: "queryTime:[1000 TO *]"
  └─ 404s: "statusCode:404"
  └─ user logins: "action:\"POST /api/v1/auth/login\""
```

---

## 🎯 Metrics & Thresholds

### Critical Metrics

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| StateMachine State | READY | != READY | FAILED |
| Module Init | 15/15 | < 15 | < 10 |
| API Response | < 200ms | 200-500ms | > 500ms |
| P95 Latency | < 500ms | 500-1000ms | > 1000ms |
| Error Rate | < 0.1% | 0.1-1% | > 1% |
| Cache Hit Rate | > 70% | 50-70% | < 50% |
| Memory | < 60% | 60-80% | > 80% |
| CPU | < 40% | 40-70% | > 70% |
| Disk | < 50% | 50-80% | > 80% |
| DB Connections | < 30 | 30-40 | > 40 |

### Alert Rules

```yaml
Groups:
  - name: critical
    rules:
      - StateMachineNotReady
        condition: state_machine_state != 1
        duration: 1m
        severity: critical
      - APIErrorRateHigh
        condition: api_error_rate > 0.01
        duration: 2m
        severity: critical
      - ModuleFailure
        condition: modules_failed > 0
        duration: 30s
        severity: critical

  - name: warning
    rules:
      - APIResponseTimeDegraded
        condition: api_response_time_p95 > 500ms
        duration: 5m
        severity: warning
      - MemoryUsageHigh
        condition: memory_usage > 0.8
        duration: 5m
        severity: warning
      - CacheHitRateLow
        condition: cache_hit_rate < 0.7
        duration: 10m
        severity: warning
```

---

## 🔍 Distributed Tracing

### Jaeger Dashboard

**URL**: `https://jaeger.prod:16686`

**Features**:
```
Search:
  └─ Find traces by:
     ├─ Service (citoyenavise-api)
     ├─ Operation (POST /api/v1/posts)
     ├─ Tags (userId, statusCode)
     └─ Span duration

Service Dependency Graph:
  └─ Visual map of:
     ├─ API → Database
     ├─ API → Cache
     ├─ API → EventBus
     └─ Service interactions

Trace Details:
  └─ Complete request flow:
     ├─ API Gateway span
     ├─ Permission check span
     ├─ Module handler span
     ├─ Database query span
     └─ Response serialization span

Performance Analysis:
  └─ Identify slow operations:
     ├─ Critical path analysis
     ├─ Latency breakdown
     └─ Service comparisons
```

### Example Trace

```
POST /api/v1/posts (145ms total)
  ├─ [0-1ms] Request received (span: request_entry)
  ├─ [1-2ms] Permission validation (span: auth_check)
  ├─ [2-50ms] Module handler (span: posts_handler)
  │  ├─ [3-30ms] Database query (span: db_insert)
  │  │  └─ INSERT INTO posts VALUES (...)
  │  └─ [31-45ms] EventBus emission (span: eventbus_emit)
  │     └─ Emit post:created event
  ├─ [50-140ms] Event listener execution (span: listeners)
  │  ├─ [50-60ms] Search indexing
  │  ├─ [60-75ms] Analytics tracking
  │  └─ [75-140ms] Notification service
  └─ [140-145ms] Response serialization (span: response)
```

---

## 🚨 Alert Notification Channels

### PagerDuty Integration

```
Severity Mapping:
  CRITICAL → Page on-call engineer (immediate)
  WARNING → Create incident (notify team)

On-Call Schedule:
  └─ Business hours: Engineering team
  └─ After hours: On-call rotation
  └─ Holidays: Escalation to management

Escalation Policy:
  └─ Level 1: On-call engineer (5 min)
  └─ Level 2: Engineering manager (5 min)
  └─ Level 3: Director of engineering (immediate)
```

### Slack Integration

**Critical Alerts Channel**: `#incidents`
```
Example:
  🚨 CRITICAL: StateMachine != READY
  Service: citoyenavise-api
  Duration: 2 minutes
  Action: Auto-rollback initiated
  Dashboard: [Link to Grafana]
  Runbook: [Link to runbooks]
```

**Performance Channel**: `#performance`
```
Example:
  ⚠️ WARNING: API response time P95 > 500ms
  Current: 678ms
  Baseline: 234ms
  Duration: 7 minutes
  Dashboard: [Link to Grafana]
```

**EventBus Channel**: `#eventbus`
```
Example:
  ⚠️ WARNING: EventBus listener timeouts
  Count: 8 in last 5 minutes
  Listeners affected: [list]
  Recovery: Automatic retry active
```

---

## 📊 SLA Monitoring

### Target SLAs

```
Availability: 99.95%
  ├─ Expected downtime: 8.7 hours/year
  ├─ Unacceptable downtime: > 52 hours/year
  └─ Current: Exceeding target

Response Time (API):
  ├─ Target: < 200ms average
  ├─ Current: 145ms average (145% of target)
  └─ Status: Exceeding target

Error Rate:
  ├─ Target: < 0.5%
  ├─ Current: 0% (0.0)
  └─ Status: Exceeding target
```

### SLA Dashboard

**URL**: `https://grafana.prod/d/sla-tracking`

**Panels**:
```
Monthly SLA Metrics:
  ├─ Uptime % (gauge)
  │  └─ Target: 99.95%
  ├─ Downtime hours (gauge)
  │  └─ Target: < 3.6 hours
  ├─ API Success Rate (gauge)
  │  └─ Target: > 99.9%
  └─ SLA Compliance (gauge)
     └─ Target: > 99.5%

Incident Tracking:
  ├─ Incident count (this month)
  ├─ MTTR (Mean Time To Recovery)
  │  └─ Target: < 15 minutes
  ├─ Affected users (last incident)
  └─ Root cause (if applicable)
```

---

## 🔄 Daily Observability Checks

### Morning Briefing (8:00 AM)

```
□ System Health
  └─ All systems green?
  └─ Uptime: 100% last 24h?
  └─ No critical alerts?

□ Performance Baseline
  └─ API response: 145ms avg?
  └─ Error rate: < 0.1%?
  └─ Cache hit rate: > 70%?

□ Overnight Incidents
  └─ Any errors? (Kibana)
  └─ Any slowdowns? (Performance dashboard)
  └─ Any resource issues? (System dashboard)

□ Deployment Status
  └─ All pods running?
  └─ No restart loops?
  └─ Build version correct?
```

### Midday Check (12:00 PM)

```
□ Performance Trend
  └─ Compare to morning
  └─ Any degradation?
  └─ Peak load handling?

□ EventBus Health
  └─ Event throughput normal?
  └─ Listener performance?
  └─ Any timeouts?

□ Database
  └─ Query performance ok?
  └─ Connection pool healthy?
  └─ Replication lag < 100ms?
```

### Evening Review (6:00 PM)

```
□ Daily Summary
  └─ Generate daily report
  └─ Document any issues
  └─ Review metrics trends

□ Alert Thresholds
  └─ Adjust if needed
  └─ Document changes
  └─ Communicate to team

□ Next Shift Briefing
  └─ Document issues
  └─ Known problems
  └─ Escalation points
```

---

## 📞 Incident Response Checklist

### When Alert Fires

```
IMMEDIATE (< 1 minute):
  □ Acknowledge alert in PagerDuty
  □ Open relevant dashboard in Grafana
  □ Check latest logs in Kibana
  □ Page on-call engineer if not already paged

INVESTIGATION (1-5 minutes):
  □ Confirm alert is valid
  □ Check Jaeger traces for slow requests
  □ Review relevant logs
  □ Check recent deployments
  □ Assess user impact

MITIGATION (5-15 minutes):
  □ Apply temporary fix if available
  □ Scale if resource issue
  □ Rollback if deployment issue
  □ Document actions taken

RECOVERY (post-incident):
  □ Monitor closely (10+ minutes)
  □ Create incident ticket
  □ Schedule post-mortem
  □ Implement permanent fix
```

---

**OBSERVABILITY & MONITORING GUIDE v1.0.0**  
**Status**: Production Ready  
**Last Updated**: 2026-05-07
