/**
 * InvariantViolationReporter.js - Report invariant violations
 * PHASE 1.5: Observability Layer
 *
 * Responsibility: Track and report system invariant violations
 * - Monitor all 8 critical invariants
 * - Track violation patterns
 * - Generate violation reports
 * - Support escalation alerts
 * - Enable forensic analysis
 */

class InvariantViolationReporter {
  constructor() {
    this.violations = [];
    this.violationPatterns = {};
    this.invariantStatus = {
      'INV_NO_CASCADE_FAILURES': { violated: false, count: 0 },
      'INV_TYPE_SAFETY': { violated: false, count: 0 },
      'INV_PERMISSION_ENFORCEMENT': { violated: false, count: 0 },
      'INV_EVENT_PROPAGATION': { violated: false, count: 0 },
      'INV_STATE_MACHINE_CORRECTNESS': { violated: false, count: 0 },
      'INV_DATA_CONSISTENCY': { violated: false, count: 0 },
      'INV_MODULE_ISOLATION': { violated: false, count: 0 },
      'INV_SERVICE_AVAILABILITY': { violated: false, count: 0 }
    };
  }

  /**
   * Report invariant violation
   */
  reportViolation(invariantId, severity, message, context = {}, affectedEntities = []) {
    const violation = {
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      invariant: invariantId,
      severity,
      message,
      context,
      affectedEntities,
      sequenceNumber: this.violations.length + 1
    };

    this.violations.push(violation);

    // Update invariant status
    if (this.invariantStatus[invariantId]) {
      this.invariantStatus[invariantId].violated = true;
      this.invariantStatus[invariantId].count++;
    }

    // Track violation patterns
    this._updateViolationPattern(invariantId, severity);

    // Keep only last 10000 violations
    if (this.violations.length > 10000) {
      this.violations.shift();
    }

    return {
      recorded: true,
      violationId: violation.sequenceNumber,
      severity
    };
  }

  /**
   * Update violation pattern
   */
  _updateViolationPattern(invariantId, severity) {
    if (!this.violationPatterns[invariantId]) {
      this.violationPatterns[invariantId] = {
        total: 0,
        bySeverity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
        lastViolation: null
      };
    }

    this.violationPatterns[invariantId].total++;
    this.violationPatterns[invariantId].bySeverity[severity]++;
    this.violationPatterns[invariantId].lastViolation = new Date().toISOString();
  }

  /**
   * Get violations by invariant
   */
  getViolationsByInvariant(invariantId, limit = 50) {
    return this.violations
      .filter(v => v.invariant === invariantId)
      .slice(-limit);
  }

  /**
   * Get critical violations
   */
  getCriticalViolations(limit = 100) {
    return this.violations
      .filter(v => v.severity === 'CRITICAL')
      .slice(-limit);
  }

  /**
   * Get violations in time range
   */
  getViolationsByTimeRange(startTime, endTime, limit = 1000) {
    return this.violations
      .filter(v => v.timestampMs >= startTime && v.timestampMs <= endTime)
      .slice(0, limit);
  }

  /**
   * Get violation frequency
   */
  getViolationFrequency() {
    const frequency = {};

    for (const violation of this.violations) {
      frequency[violation.invariant] = (frequency[violation.invariant] || 0) + 1;
    }

    return frequency;
  }

  /**
   * Get invariant health
   */
  getInvariantHealth() {
    const health = {};

    for (const [invariant, status] of Object.entries(this.invariantStatus)) {
      health[invariant] = {
        healthy: !status.violated,
        violationCount: status.count,
        status: status.violated ? 'VIOLATED' : 'HEALTHY'
      };
    }

    return health;
  }

  /**
   * Get systemic risks
   */
  getSystemicRisks() {
    const risks = [];

    // Check for cascading failures
    const cascadeViolations = this.violationPatterns['INV_NO_CASCADE_FAILURES'];
    if (cascadeViolations && cascadeViolations.total > 5) {
      risks.push({
        type: 'cascade_risk',
        description: 'Multiple cascade failure violations detected',
        severity: 'HIGH',
        count: cascadeViolations.total
      });
    }

    // Check for data consistency issues
    const dataViolations = this.violationPatterns['INV_DATA_CONSISTENCY'];
    if (dataViolations && dataViolations.total > 3) {
      risks.push({
        type: 'data_consistency_risk',
        description: 'Multiple data consistency violations detected',
        severity: 'CRITICAL',
        count: dataViolations.total
      });
    }

    // Check for critical patterns
    const criticalCount = this.violations.filter(v => v.severity === 'CRITICAL').length;
    if (criticalCount > 10) {
      risks.push({
        type: 'critical_violation_surge',
        description: `${criticalCount} critical violations in history`,
        severity: 'CRITICAL',
        count: criticalCount
      });
    }

    return risks;
  }

  /**
   * Get violation summary
   */
  getViolationSummary() {
    const violations = this.violations;

    return {
      totalViolations: violations.length,
      bySeverity: {
        CRITICAL: violations.filter(v => v.severity === 'CRITICAL').length,
        HIGH: violations.filter(v => v.severity === 'HIGH').length,
        MEDIUM: violations.filter(v => v.severity === 'MEDIUM').length,
        LOW: violations.filter(v => v.severity === 'LOW').length
      },
      violatedInvariants: Object.values(this.invariantStatus)
        .filter(s => s.violated)
        .length,
      invariantViolationCounts: this.violationPatterns,
      systemicRisks: this.getSystemicRisks()
    };
  }

  /**
   * Generate violation report
   */
  generateViolationReport(limit = 10) {
    return {
      timestamp: new Date().toISOString(),
      summary: this.getViolationSummary(),
      health: this.getInvariantHealth(),
      recentViolations: this.violations.slice(-limit),
      patterns: this.violationPatterns,
      recommendations: this._generateRecommendations()
    };
  }

  /**
   * Generate recommendations
   */
  _generateRecommendations() {
    const recommendations = [];
    const risks = this.getSystemicRisks();

    // Recommend actions based on risks
    for (const risk of risks) {
      if (risk.type === 'data_consistency_risk') {
        recommendations.push({
          action: 'Verify data consistency',
          description: 'Multiple data consistency violations detected. Perform full consistency check.',
          priority: 'CRITICAL'
        });
      }

      if (risk.type === 'cascade_risk') {
        recommendations.push({
          action: 'Review error boundaries',
          description: 'Cascade failure violations detected. Review module error boundaries.',
          priority: 'HIGH'
        });
      }

      if (risk.type === 'critical_violation_surge') {
        recommendations.push({
          action: 'System audit',
          description: 'High volume of critical violations. Perform immediate system audit.',
          priority: 'CRITICAL'
        });
      }
    }

    return recommendations;
  }

  /**
   * Export violation report
   */
  exportViolationReport(filename) {
    try {
      const report = this.generateViolationReport(100);
      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(report, null, 2), 'utf8');

      return { success: true, filename, violationCount: this.violations.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get violation timeline
   */
  getViolationTimeline(minutesBack = 60) {
    const cutoffTime = Date.now() - (minutesBack * 60 * 1000);
    const recentViolations = this.violations.filter(v => v.timestampMs >= cutoffTime);

    const timeline = [];
    const bucketSize = 60000; // 1 minute buckets

    for (let i = 0; i < minutesBack; i++) {
      const bucketStart = Date.now() - ((minutesBack - i) * 60 * 1000);
      const bucketEnd = bucketStart + bucketSize;

      const violations = recentViolations.filter(v =>
        v.timestampMs >= bucketStart && v.timestampMs < bucketEnd
      );

      timeline.push({
        minute: i,
        timestamp: new Date(bucketStart).toISOString(),
        count: violations.length,
        critical: violations.filter(v => v.severity === 'CRITICAL').length
      });
    }

    return timeline;
  }

  /**
   * Clear violations
   */
  clearViolations() {
    const clearedCount = this.violations.length;
    this.violations = [];

    return { clearedViolations: clearedCount };
  }

  /**
   * Reset reporter
   */
  reset() {
    this.violations = [];
    this.violationPatterns = {};

    for (const invariant of Object.keys(this.invariantStatus)) {
      this.invariantStatus[invariant] = { violated: false, count: 0 };
    }

    return { reset: true };
  }
}

module.exports = InvariantViolationReporter;
