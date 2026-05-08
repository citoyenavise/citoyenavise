/**
 * EventClassifier
 * PHASE 5.2 — Event-Driven Governance Backbone
 *
 * Converts raw system inputs (violations, health states, recovery actions)
 * into standardized GovernanceEvent objects.
 */

const GovernanceEvent = require('./GovernanceEvent');

class EventClassifier {
  constructor(options = {}) {
    this.classificationRules = options.rules || {};
    this.metrics = {
      eventsClassified: 0,
      classificationErrors: 0
    };
  }

  /**
   * Classify a runtime violation
   */
  classifyViolation(violation) {
    try {
      const event = GovernanceEvent.violation(
        {
          type: violation.type,
          message: violation.message,
          validator: violation.validator,
          details: violation.details
        },
        {
          severity: this._normalizeSeverity(violation.severity),
          source: violation.validator || 'runtime-validation-engine',
          origin: 'violation-classifier'
        }
      );

      this.metrics.eventsClassified += 1;
      return event;
    } catch (error) {
      this.metrics.classificationErrors += 1;
      throw error;
    }
  }

  /**
   * Classify a healing action
   */
  classifyHealing(action) {
    try {
      const event = GovernanceEvent.healing(
        {
          correctionId: action.correctionId,
          violationType: action.violationType,
          applied: action.applied,
          reason: action.reason
        },
        {
          source: 'self-healing-orchestrator',
          origin: 'healing-classifier',
          metadata: {
            correctionAttempt: action.attempt || 1,
            strategy: action.strategy
          }
        }
      );

      this.metrics.eventsClassified += 1;
      return event;
    } catch (error) {
      this.metrics.classificationErrors += 1;
      throw error;
    }
  }

  /**
   * Classify a recovery action
   */
  classifyRecovery(action) {
    try {
      const event = GovernanceEvent.recovery(
        {
          recoveryPath: action.recoveryPath,
          action: action.action,
          status: action.status,
          reason: action.reason
        },
        {
          severity: action.severity || 'HIGH',
          source: 'recovery-orchestrator',
          origin: 'recovery-classifier',
          metadata: {
            recoveryStrategy: action.strategy,
            escalationLevel: action.escalationLevel
          }
        }
      );

      this.metrics.eventsClassified += 1;
      return event;
    } catch (error) {
      this.metrics.classificationErrors += 1;
      throw error;
    }
  }

  /**
   * Classify health state
   */
  classifyHealth(healthState) {
    try {
      // Determine severity based on health score
      let severity = 'INFO';
      if (healthState.score >= 80) severity = 'INFO';
      else if (healthState.score >= 60) severity = 'LOW';
      else if (healthState.score >= 40) severity = 'MEDIUM';
      else if (healthState.score >= 20) severity = 'HIGH';
      else severity = 'CRITICAL';

      const event = GovernanceEvent.health(
        {
          healthScore: healthState.score,
          activeViolations: healthState.activeViolations,
          degradationStatus: healthState.degradationStatus,
          timestamp: healthState.timestamp
        },
        {
          severity,
          source: 'degradation-monitor',
          origin: 'health-classifier',
          metadata: {
            cycleNumber: healthState.cycle,
            windowSize: healthState.windowSize
          }
        }
      );

      this.metrics.eventsClassified += 1;
      return event;
    } catch (error) {
      this.metrics.classificationErrors += 1;
      throw error;
    }
  }

  /**
   * Batch classify violations
   */
  classifyViolations(violations) {
    return violations.map(v => this.classifyViolation(v));
  }

  /**
   * Normalize severity to standard levels
   */
  _normalizeSeverity(severity) {
    const normalized = {
      'CRITICAL': 'CRITICAL',
      'HIGH': 'HIGH',
      'MEDIUM': 'MEDIUM',
      'LOW': 'LOW',
      'INFO': 'INFO'
    };

    return normalized[severity] || 'MEDIUM';
  }

  /**
   * Get classification metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      eventsClassified: 0,
      classificationErrors: 0
    };
    return { reset: true };
  }
}

module.exports = EventClassifier;
