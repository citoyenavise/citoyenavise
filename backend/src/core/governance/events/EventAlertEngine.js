/**
 * EventAlertEngine
 * PHASE 5.4 — Event Monitoring & Alerting Layer
 * PHASE 5.7 — Simplified + Hardened (idempotency, cooldown, configurable rules)
 *
 * Alert engine for governance events.
 * - Evaluates events against configurable rules
 * - Tracks alert history (bounded)
 * - Prevents duplicate alerts via eventId idempotency
 * - Enforces per-rule cooldown to prevent spam
 * - No corrective actions (pure notification)
 */

class EventAlertEngine {
  constructor(maxHistory = 5000) {
    this.alertHistory = [];
    this.maxHistory = maxHistory;
    this.rules = new Map();

    // PHASE 5.7: Cooldown tracking per rule
    this.lastAlertAt = new Map(); // ruleId → last alert timestamp

    this.metrics = {
      alertsGenerated: 0,
      alertsByLevel: {}
    };

    this._initializeDefaultRules();
  }

  /**
   * Define or override an alert rule
   */
  defineRule(ruleId, rule) {
    if (!ruleId || !rule) throw new Error('ruleId and rule required');

    const normalizedRule = {
      id: ruleId,
      name: rule.name || ruleId,
      condition: rule.condition || 'severity_equals', // severity_equals, severity_gte, type_match, status_match
      threshold: rule.threshold, // Value to match
      alertLevel: rule.alertLevel || 'WARNING',
      cooldown_ms: rule.cooldown_ms || 0, // PHASE 5.7: Per-rule cooldown
      enabled: rule.enabled !== false
    };

    this.rules.set(ruleId, normalizedRule);
    return { ruleId, registered: true };
  }

  /**
   * Evaluate event against rules, return triggered alerts
   */
  evaluate(event) {
    if (!event) return [];

    const triggeredAlerts = [];

    // PHASE 5.7: Idempotency check - skip if eventId already alerted
    const existing = this.alertHistory.find(a => a.eventId === event.id);
    if (existing) return [];

    // Evaluate all rules
    for (const [ruleId, rule] of this.rules) {
      if (!rule.enabled) continue;

      // PHASE 5.7: Check rule cooldown
      if (rule.cooldown_ms > 0) {
        const lastAlert = this.lastAlertAt.get(rule.id) || 0;
        if (Date.now() - lastAlert < rule.cooldown_ms) {
          continue; // Still in cooldown
        }
      }

      // Check if event matches rule
      if (this._checkRules(event, rule)) {
        const alert = {
          alertId: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          ruleId: rule.id,
          ruleName: rule.name,
          eventId: event.id,
          severity: event.severity,
          timestamp: Date.now(),
          level: rule.alertLevel
        };

        triggeredAlerts.push(alert);
        this._recordAlert(alert);

        // PHASE 5.7: Update cooldown timestamp
        this.lastAlertAt.set(rule.id, Date.now());
      }
    }

    return triggeredAlerts;
  }

  /**
   * Check if event matches rule condition
   */
  _checkRules(event, rule) {
    switch (rule.condition) {
      case 'severity_equals':
        return event.severity === rule.threshold;

      case 'severity_gte': {
        const severityOrder = { INFO: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
        const eventLevel = severityOrder[event.severity] || 0;
        const thresholdLevel = severityOrder[rule.threshold] || 0;
        return eventLevel >= thresholdLevel;
      }

      case 'type_match':
        return event.type === rule.threshold;

      case 'status_match':
        return (event.payload && event.payload.status === rule.threshold) || event.status === rule.threshold;

      default:
        return false;
    }
  }

  /**
   * Record alert to history
   */
  _recordAlert(alert) {
    if (this.alertHistory.length >= this.maxHistory) {
      this.alertHistory.shift();
    }
    this.alertHistory.push(alert);

    this.metrics.alertsGenerated += 1;
    this.metrics.alertsByLevel[alert.level] = (this.metrics.alertsByLevel[alert.level] || 0) + 1;
  }

  /**
   * Get alert history
   */
  getHistory() {
    return [...this.alertHistory];
  }

  /**
   * Get recent N alerts
   */
  getRecentAlerts(n = 50) {
    return this.alertHistory.slice(-n);
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      alertsGenerated: this.metrics.alertsGenerated,
      alertsByLevel: { ...this.metrics.alertsByLevel },
      historySize: this.alertHistory.length
    };
  }

  /**
   * Reset history and metrics
   */
  reset() {
    this.alertHistory = [];
    this.lastAlertAt.clear();
    this.metrics = {
      alertsGenerated: 0,
      alertsByLevel: {}
    };
    return { reset: true };
  }

  /**
   * Initialize default alert rules
   */
  _initializeDefaultRules() {
    // Critical violations
    this.defineRule('critical_violations', {
      name: 'Critical Violations',
      condition: 'severity_equals',
      threshold: 'CRITICAL',
      alertLevel: 'CRITICAL'
    });

    // High severity violations
    this.defineRule('high_violations', {
      name: 'High Violations',
      condition: 'severity_equals',
      threshold: 'HIGH',
      alertLevel: 'WARNING'
    });

    // Failed recoveries (PHASE 5.7: only on failures, with 30s cooldown)
    this.defineRule('recovery_failure', {
      name: 'Recovery Failures',
      condition: 'status_match',
      threshold: 'RECOVERY_FAILED',
      alertLevel: 'CRITICAL',
      cooldown_ms: 30000
    });
  }
}

module.exports = EventAlertEngine;
