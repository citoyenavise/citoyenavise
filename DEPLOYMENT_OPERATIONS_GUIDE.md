# 🚀 DEPLOYMENT & OPERATIONS GUIDE

**Version** : 1.0.0  
**Date** : 2026-05-07  
**Status** : Production Ready  
**Audience** : DevOps, Site Reliability Engineers, Operations Team  

---

## 🚀 Deployment Procedures

### Pre-Deployment Checklist

```
□ Code Review
  └─ All changes reviewed and approved
  └─ No security vulnerabilities
  └─ Test coverage acceptable

□ Environment Verification
  └─ 27/27 environment variables configured
  └─ Database credentials verified
  └─ Cache credentials verified
  └─ SSL certificates valid
  └─ Load balancer configured

□ Database Preparation
  └─ Migrations applied (47/47)
  └─ Backups created
  └─ Replication verified
  └─ Connection tested

□ Monitoring Preparation
  └─ Prometheus endpoints ready
  └─ Grafana dashboards loaded
  └─ ELK Stack online
  └─ Alerting rules configured
  └─ Health check endpoints live

□ Team Readiness
  └─ On-call team briefed
  └─ Runbooks reviewed
  └─ Communication channels open
  └─ Emergency contacts updated
```

### Deployment Steps

**Step 1: Build Package Preparation**
```bash
# Verify build integrity
$ checksums sha256 citoyenavise-1.0.0.tar.gz
  Expected: 7f3a9e2c8d1b5a4f6e9c2d7a1b4e5f8a
  Status: ✅ Match

# Extract to staging
$ mkdir -p /opt/citoyenavise/builds/1.0.0
$ tar -xzf citoyenavise-1.0.0.tar.gz -C /opt/citoyenavise/builds/1.0.0/

# Verify extraction
$ ls -la /opt/citoyenavise/builds/1.0.0/ | wc -l
  7895 files ✅
```

**Step 2: Pre-Flight Checks**
```bash
# Health check endpoints
$ curl https://api.citoyenavise.org/health
  { "status": "ok" } ✅

$ curl https://api.citoyenavise.org/health/ready
  { "ready": true, "modules": 15 } ✅

# Prometheus metrics
$ curl https://api.citoyenavise.org/metrics | head -5
  # HELP api_requests_total Total API requests
  # TYPE api_requests_total counter
  api_requests_total{method="GET",status="200"} 12345
```

**Step 3: Deploy to Staging**
```bash
# Stop current staging service
$ kubectl set image deployment/citoyenavise-api-staging \
    citoyenavise-api=citoyenavise:1.0.0-staging \
    --record

# Wait for deployment
$ kubectl rollout status deployment/citoyenavise-api-staging --timeout=5m
  deployment "citoyenavise-api-staging" successfully rolled out

# Verify health
$ kubectl port-forward -n staging svc/citoyenavise-api 3000:3000 &
$ curl http://localhost:3000/health/ready
  { "ready": true } ✅
```

**Step 4: Run Smoke Tests**
```bash
# Execute smoke test suite
$ npm run test:smoke
  ✅ Auth flow: OK
  ✅ Create post: OK
  ✅ Get posts: OK
  ✅ Like post: OK
  ✅ Add comment: OK
  All 15 smoke tests passed ✅

# Performance baseline
$ npm run test:performance
  Bootstrap: 245ms ✅
  API response: 145ms ✅
  All targets exceeded ✅
```

**Step 5: Canary Deployment to Production**
```bash
# Deploy to 10% of traffic
$ kubectl set image deployment/citoyenavise-api \
    citoyenavise-api=citoyenavise:1.0.0 \
    --record

$ kubectl patch deployment citoyenavise-api -p \
  '{
    "spec": {
      "strategy": {
        "type": "RollingUpdate",
        "rollingUpdate": {
          "maxSurge": "10%",
          "maxUnavailable": 0
        }
      }
    }
  }'

# Monitor canary (5-10 minutes)
$ watch kubectl get pods -l app=citoyenavise-api
$ watch kubectl top pods -l app=citoyenavise-api
```

**Step 6: Production Rollout**
```bash
# If canary healthy, proceed
$ kubectl scale deployment citoyenavise-api --replicas=3
$ kubectl rollout status deployment/citoyenavise-api --timeout=10m

# Verify all replicas
$ kubectl get pods -l app=citoyenavise-api
  NAME                                    READY   STATUS    RESTARTS
  citoyenavise-api-5d4c8b9f7c-abc12       1/1     Running   0
  citoyenavise-api-5d4c8b9f7c-def34       1/1     Running   0
  citoyenavise-api-5d4c8b9f7c-ghi56       1/1     Running   0
```

**Step 7: Health Verification**
```bash
# Check all endpoints
$ npm run test:health-check
  ✅ /health: OK (200)
  ✅ /health/ready: OK (200)
  ✅ /health/live: OK (200)
  ✅ /metrics: OK (200)
  ✅ Database: HEALTHY
  ✅ Cache: HEALTHY
  ✅ All services: OPERATIONAL

# Performance baseline
$ npm run test:baseline
  Bootstrap: 245ms ✅
  API response: 145ms ✅
  P95: 234ms ✅
  Error rate: 0% ✅
```

---

## 🔄 Rollback Procedures

### Level 1: Quick Restart (2-3 minutes)

For transient failures:

```bash
$ kubectl rollout restart deployment/citoyenavise-api
$ kubectl rollout status deployment/citoyenavise-api --timeout=5m
$ curl https://api.citoyenavise.org/health/ready
```

### Level 2: Previous Version (5-8 minutes)

For runtime errors:

```bash
$ kubectl set image deployment/citoyenavise-api \
    citoyenavise-api=citoyenavise:1.0.0-previous \
    --record

$ kubectl rollout status deployment/citoyenavise-api --timeout=5m
$ npm run test:smoke
```

### Level 3: Database Rollback (10-30 minutes)

For data issues:

```bash
# Stop API servers
$ kubectl scale deployment citoyenavise-api --replicas=0

# Restore database
$ aws s3 cp s3://citoyenavise-backups/db-backup-latest.sql.gz /tmp/
$ gunzip /tmp/db-backup-latest.sql.gz
$ psql -h prod-db -U postgres citoyenavise < /tmp/db-backup-latest.sql

# Verify integrity
$ psql -h prod-db -U postgres citoyenavise -c \
  "SELECT COUNT(*) FROM posts;"

# Restart API
$ kubectl scale deployment citoyenavise-api --replicas=3
$ npm run test:comprehensive
```

### Level 4: Disaster Recovery (30-60 minutes)

For critical infrastructure failures:

```bash
# Activate DR procedures
$ ./scripts/activate-disaster-recovery.sh

# Verify all systems
$ ./scripts/comprehensive-health-check.sh

# Monitor closely
$ tail -f /var/log/deployment.log
```

---

## 📊 Post-Deployment Monitoring

### First Hour

```
Every 5 minutes:
  □ Check dashboard (all green?)
  □ Monitor error rate (< 0.1%?)
  □ Check response times (< 200ms?)
  □ Verify no new alerts

Every 15 minutes:
  □ Review error logs
  □ Check database performance
  □ Verify cache hit rate
  □ Monitor resource usage
```

### First Day

```
Hourly:
  □ Review dashboards
  □ Check SLA compliance
  □ Monitor user feedback
  □ Verify system stability

End of day:
  □ Generate daily report
  □ Review all incidents
  □ Update documentation
  □ Brief next shift
```

### First Week

```
Daily:
  □ Morning briefing
  □ Evening review
  □ Performance analysis
  □ User feedback collection

Weekly:
  □ Comprehensive review
  □ SLA compliance check
  □ Incident analysis
  □ Planning for next week
```

---

## 🔐 Security Checklist

### Pre-Deployment

```
□ Secrets securely configured
  └─ JWT secret in vault
  └─ Database password secured
  └─ API keys rotated
  └─ No hardcoded credentials

□ SSL/TLS configured
  └─ Certificate valid
  └─ TLS 1.3 enabled
  └─ HSTS headers set
  └─ Ciphers strong

□ Access controls
  └─ Load balancer firewall rules
  └─ Database firewall rules
  └─ API rate limiting configured
  └─ CORS properly set
```

### Post-Deployment

```
□ Monitor security events
  └─ Failed auth attempts logged
  └─ Permission violations tracked
  └─ Rate limits enforced
  └─ Audit logging active

□ Verify protections
  □ SQL injection: Protected
  □ XSS: Protected
  □ CSRF: Protected
  □ Injection: Protected
```

---

## 📞 Incident Response

### Critical Alert Response (StateMachine != READY)

```
IMMEDIATE (0-2 minutes):
  1. Acknowledge alert
  2. Page on-call engineer
  3. Check latest logs
  4. Assess impact

INVESTIGATION (2-5 minutes):
  1. Review bootstrap logs
  2. Check module initialization
  3. Verify database/cache
  4. Review error patterns

RESOLUTION (5-10 minutes):
  1. Can we restart? YES → Restart
  2. Previous version working? YES → Rollback
  3. Database issue? YES → Level 3 rollback
  4. Critical issue? YES → Level 4 DR

MONITORING (post-fix):
  1. Watch dashboard closely
  2. Run health checks every 5 min
  3. Prepare communication
  4. Document issue
```

### Performance Degradation (P95 > 1000ms)

```
INVESTIGATION:
  1. Check database slow queries
  2. Review cache hit rate
  3. Monitor memory/CPU
  4. Check concurrent users

REMEDIATION:
  1. Identify bottleneck
  2. Optimize queries / queries
  3. Increase cache TTL
  4. Scale if needed
```

### Error Rate Spike (> 1%)

```
INVESTIGATION:
  1. Review error logs
  2. Identify error pattern
  3. Check affected endpoints
  4. Review recent changes

REMEDIATION:
  1. Fix identified bug
  2. Test in staging
  3. Deploy fix
  4. Monitor closely
```

---

## ✅ Maintenance Tasks

### Daily

```
□ Review logs for anomalies
□ Check dashboard metrics
□ Verify backup completion
□ Monitor disk usage
□ Check certificate expiration (≥ 30 days)
```

### Weekly

```
□ Update dependencies
□ Run security scans
□ Review performance trends
□ Analyze user feedback
□ Plan scaling if needed
```

### Monthly

```
□ Update documentation
□ Conduct security audit
□ Test disaster recovery
□ Review and adjust thresholds
□ Capacity planning
```

### Quarterly

```
□ Full security assessment
□ Performance optimization
□ Architecture review
□ Update runbooks
□ Team training
```

---

**DEPLOYMENT & OPERATIONS GUIDE v1.0.0**  
**Status**: Production Ready  
**Last Updated**: 2026-05-07
