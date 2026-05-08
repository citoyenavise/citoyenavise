/**
 * EventAlertEngine
 * PHASE 5.4 — Event Monitoring & Alerting Layer
 *
 * Alert rule engine for governance events.
 * Defines thresholds and generates alerts on event patterns.
 *
 * Responsibilities:
 * - Define alert rules by type and severity
 * - Evaluate events against rules
 * - Generate alerts on threshold breach
 * - Track alert history
 * - No corrective actions (pure notification)
 */

class EventAlertEngine {
  constructor(options = {}) {
    this.rules = new Map();
    this.alerts = [];
    this.maxAlertHistory = options.maxAlertHistory || 5000;
    this.enabled = options.enabled !== false;

    // PHASE 5.7: Track last alert time per rule for cooldown
    this.lastAlertAt = new Map(); // ruleId → last alert timestamp

    this.metrics = {
      alertsGenerated: 0,
      alertsByLevel: {},
      ruleEvaluations: 0
    };

    this._initializeDefaultRules();
  }

  /**
   * Define alert rule
   */
  defineRule(ruleId, rule) {
    if (!ruleId || !rule) throw new Error('ruleId and rule required');

    const normalizedRule = {
      id: ruleId,
      name: rule.name || ruleId,
      description: rule.description || '',
      eventType: rule.eventType || 'VIOLATION',
      condition: rule.condition || 'severity_equals',
      threshold: rule.threshold,
      alertLevel: rule.alertLevel || 'WARNING',
      enabled: rule.enabled !== false,
      cooldown_ms: rule.cooldown_ms || 0
    };

    this.rules.set(ruleId, normalizedRule);
    return { ruleId, registered: true };
  }

  /**
   * Evaluate event against rules
   * PHASE 5.7: Check cooldown before triggering alert
   */
  evaluateEvent(event) {
    if (!this.enabled || !event) return [];

    const triggeredAlerts = [];

    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      this.metrics.ruleEvaluations += 1;

      // Check event type match
      if (rule.eventType !== '*' && rule.eventType !== event.type) {
        continue;
      }

      // PHASE 5.7: Check cooldown
      if (rule.cooldown_ms > 0) {
        const lastAlert = this.lastAlertAt.get(rule.id) || 0;
        if (Date.now() - lastAlert < rule.cooldown_ms) {
          continue; // Still in cooldown
        }
      }

      // Evaluate condition
      if (this._evaluateCondition(event, rule)) {
        const alert = this._createAlert(event, rule);
        triggeredAlerts.push(alert);
        // PHASE 5.7: Update cooldown timestamp
        this.lastAlertAt.set(rule.id, Date.now());
        this._recordAlert(alert);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Get active rules
   */
  getRules() {
    const rules = [];
    for (const [id, rule] of this.rules) {
      rules.push({ ...rule });
    }
    return rules;
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId) {
    const rule = this.rules.get(ruleId);
    return rule ? { ...rule } : null;
  }

  /**
   * Disable/enable rule
   */
  setRuleEnabled(ruleId, enabled) {
    const rule = this.rules.get(ruleId);
    if (!rule) return { found: false };

    rule.enabled = enabled;
    return { ruleId, enabled };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(n = 100) {
    return this.alerts.slice(-n);
  }

  /**
   * Get alerts by level
   */
  getAlertsByLevel(level) {
    return this.alerts.filter(a => a.level === level);
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type) {
    return this.alerts.filter(a => a.eventType === type);
  }

  /**
   * Get alerts by time range
   */
  getAlertsByTimeRange(startTime, endTime) {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    return this.alerts.filter(a => {
      const time = new Date(a.timestamp).getTime();
      return time >= start && time <= end;
    });
  }

  /**
   * Get alert metrics
   */
  getMetrics() {
    const levelDist = {};
    for (const alert of this.alerts) {
      levelDist[alert.level] = (levelDist[alert.level] || 0) + 1;
    }

    return {
      timestamp: new Date().toISOString(),
      alertsGenerated: this.metrics.alertsGenerated,
      alertsByLevel: levelDist,
      ruleEvaluations: this.metrics.ruleEvaluations,
      rulesActive: Array.from(this.rules.values()).filter(r => r.enabled).length,
      alertHistorySize: this.alerts.length,
      enabled: this.enabled
    };
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThanMs = 86400000) {
    const cutoff = Date.now() - olderThanMs;
    const initial = this.alerts.length;

    this.alerts = this.alerts.filter(a => {
      const time = new Date(a.timestamp).getTime();
      return time > cutoff;
    });

    return {
      cleared: initial - this.alerts.length,
      remaining: this.alerts.length
    };
  }

  /**
   * Reset engine
   */
  reset() {
    this.alerts = [];
    this.lastAlertAt.clear(); // PHASE 5.7
    this.metrics = {
      alertsGenerated: 0,
      alertsByLevel: {},
      ruleEvaluations: 0
    };
    return { reset: true };
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      timestamp: new Date().toISOString(),
      enabled: this.enabled,
      rulesCount: this.rules.size,
      metrics: this.getMetrics()
    };
  }

  /**
   * Private: Evaluate rule condition
   * PHASE 5.7: Add status_match condition for recovery failure detection
   */
  _evaluateCondition(event, rule) {
    switch (rule.condition) {
      case 'severity_equals':
        return event.severity === rule.threshold;

      case 'severity_gte':
        const severityOrder = { INFO: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        const eventLevel = severityOrder[event.severity] || 0;
        const thresholdLevel = severityOrder[rule.threshold] || 0;
        return eventLevel >= thresholdLevel;

      case 'type_match':
        return event.type === rule.threshold;

      case 'source_match':
        return event.source === rule.threshold;

      case 'status_match':
        // PHASE 5.7: Check event.payload.status or event.status
        return (event.payload && event.payload.status === rule.threshold) || event.status === rule.threshold;

      case 'always':
        return true;

      default:
        return false;
    }
  }

  /**
   * Private: Create alert from event and rule
   */
  _createAlert(event, rule) {
    return {
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      level: rule.alertLevel,
      eventId: event.id,
      eventType: event.type,
      eventSeverity: event.severity,
      eventSource: event.source,
      traceId: event.traceId,
      timestamp: new Date().toISOString(),
      message: `Alert: ${rule.name} triggered by ${event.type}(${event.severity})`,
      eventPayload: event.payload
    };
  }

  /**
   * Private: Record alert
   */
  _recordAlert(alert) {
    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlertHistory) {
      this.alerts.shift();
    }

    this.metrics.alertsGenerated += 1;
    this.metrics.alertsByLevel[alert.level] = (this.metrics.alertsByLevel[alert.level] || 0) + 1;
  }

  /**
   * Private: Initialize default rules
   */
  _initializeDefaultRules() {
    // Critical severity rule
    this.defineRule('alert_critical_violations', {
      name: 'Critical Violations',
      description: 'Alert on critical violations',
      eventType: 'VIOLATION',
      condition: 'severity_equals',
      threshold: 'CRITICAL',
      alertLevel: 'CRITICAL',
      enabled: true
    });

    // High severity rule
    this.defineRule('alert_high_violations', {
      name: 'High Severity Violations',
      description: 'Alert on high severity violations',
      eventType: 'VIOLATION',
      condition: 'severity_equals',
      threshold: 'HIGH',
      alertLevel: 'WARNING',
      enabled: true
    });

    // Failed recoveries (PHASE 5.7: only on actual failures, with cooldown)
    this.defineRule('alert_recovery_failure', {
      name: 'Recovery Failures',
      description: 'Alert on failed recovery attempts',
      eventType: 'RECOVERY',
      condition: 'status_match',
      threshold: 'RECOVERY_FAILED',
      alertLevel: 'CRITICAL',
      cooldown_ms: 30000,
      enabled: true
    });

    // Module non-compliance
    this.defineRule('alert_module_noncompliance', {
      name: 'Module Non-Compliance',
      description: 'Alert on module structural violations',
      eventType: 'MODULE_NONCOMPLIANCE',
      condition: 'always',
      alertLevel: 'WARNING',
      enabled: true
    });
  }
}

module.exports = EventAlertEngine;
