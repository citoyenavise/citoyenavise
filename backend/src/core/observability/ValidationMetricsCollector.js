/**
 * ValidationMetricsCollector.js - Collect metrics from validation layer
 * PHASE 1.5: Observability Layer
 *
 * Responsibility: Collect comprehensive validation metrics
 * - Track validation cycles
 * - Collect violation metrics
 * - Monitor invariant status
 * - Track validation performance
 * - Generate validation reports
 */

class ValidationMetricsCollector {
  constructor(validationEngine) {
    this.validationEngine = validationEngine;
    this.metrics = {
      cycles: [],
      totalCycles: 0,
      totalViolations: 0,
      violationsBySeverity: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      validatorMetrics: {}
    };
    this.startTime = Date.now();
  }

  /**
   * Record validation cycle
   */
  recordValidationCycle(cycleResult) {
    const metric = {
      cycle: cycleResult.cycle,
      timestamp: cycleResult.timestamp,
      duration_ms: cycleResult.duration_ms,
      summary: cycleResult.summary,
      validators: cycleResult.validators
    };

    this.metrics.cycles.push(metric);
    this.metrics.totalCycles++;

    // Count violations by severity
    if (cycleResult.validators) {
      for (const validator of Object.values(cycleResult.validators)) {
        if (validator.violations) {
          for (const violation of validator.violations) {
            this.metrics.totalViolations++;
            if (violation.severity) {
              this.metrics.violationsBySeverity[violation.severity]++;
            }
          }
        }
      }
    }

    // Keep only last 1000 cycles
    if (this.metrics.cycles.length > 1000) {
      this.metrics.cycles.shift();
    }
  }

  /**
   * Get validation metrics
   */
  getValidationMetrics() {
    return {
      totalCycles: this.metrics.totalCycles,
      totalViolations: this.metrics.totalViolations,
      violationsBySeverity: this.metrics.violationsBySeverity,
      criticalViolationRate: this.metrics.totalCycles > 0
        ? (this.metrics.violationsBySeverity.CRITICAL / this.metrics.totalCycles * 100).toFixed(2) + '%'
        : '0%',
      averageCycleDuration_ms: this._getAverageCycleDuration(),
      lastCycleTime: this.metrics.cycles.length > 0
        ? this.metrics.cycles[this.metrics.cycles.length - 1].timestamp
        : null
    };
  }

  /**
   * Get average cycle duration
   */
  _getAverageCycleDuration() {
    if (this.metrics.cycles.length === 0) return 0;

    const durations = this.metrics.cycles.map(c => c.duration_ms);
    const sum = durations.reduce((a, b) => a + b, 0);
    return Math.round(sum / durations.length);
  }

  /**
   * Get violation trend
   */
  getViolationTrend(cycleLookback = 100) {
    const recentCycles = this.metrics.cycles.slice(-cycleLookback);
    const trend = {
      period: `Last ${Math.min(cycleLookback, recentCycles.length)} cycles`,
      totalViolations: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0
    };

    for (const cycle of recentCycles) {
      if (cycle.summary.totalViolations) {
        trend.totalViolations += cycle.summary.totalViolations;
      }
    }

    return trend;
  }

  /**
   * Get per-validator metrics
   */
  getValidatorMetrics() {
    const metrics = {};

    if (this.validationEngine) {
      const validators = this.validationEngine.getAllValidators();
      for (const [name, validator] of Object.entries(validators)) {
        metrics[name] = {
          name,
          validations: this.metrics.cycles
            .filter(c => c.validators[name])
            .length,
          lastRun: this._getLastValidatorRun(name),
          averageDuration_ms: this._getValidatorAverageDuration(name)
        };
      }
    }

    return metrics;
  }

  /**
   * Get last validator run time
   */
  _getLastValidatorRun(validatorName) {
    for (let i = this.metrics.cycles.length - 1; i >= 0; i--) {
      if (this.metrics.cycles[i].validators[validatorName]) {
        return this.metrics.cycles[i].timestamp;
      }
    }
    return null;
  }

  /**
   * Get validator average duration
   */
  _getValidatorAverageDuration(validatorName) {
    const durations = this.metrics.cycles
      .filter(c => c.validators[validatorName])
      .map(c => c.duration_ms);

    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const violations = this.metrics.violationsBySeverity;
    const healthy = violations.CRITICAL === 0;
    const warnings = violations.HIGH + violations.MEDIUM;

    return {
      healthy,
      criticalViolations: violations.CRITICAL,
      warnings,
      totalViolations: this.metrics.totalViolations,
      status: healthy ? 'HEALTHY' : 'UNHEALTHY'
    };
  }

  /**
   * Get invariant compliance
   */
  getInvariantCompliance() {
    const compliance = {
      timestamp: new Date().toISOString(),
      invariants: {}
    };

    if (this.validationEngine && this.metrics.cycles.length > 0) {
      const lastCycle = this.metrics.cycles[this.metrics.cycles.length - 1];

      if (lastCycle.validators && lastCycle.validators.bootstrap) {
        const violations = lastCycle.validators.bootstrap.violations || [];

        // Track each invariant
        for (const violation of violations) {
          if (violation.invariant) {
            if (!compliance.invariants[violation.invariant]) {
              compliance.invariants[violation.invariant] = {
                violations: 0,
                valid: true
              };
            }
            compliance.invariants[violation.invariant].violations++;
            compliance.invariants[violation.invariant].valid = false;
          }
        }
      }
    }

    return compliance;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const recentCycles = this.metrics.cycles.slice(-100);

    return {
      cycleDurations: {
        average_ms: this._getAverageCycleDuration(),
        min_ms: Math.min(...recentCycles.map(c => c.duration_ms)),
        max_ms: Math.max(...recentCycles.map(c => c.duration_ms))
      },
      validationCycleRate_per_sec: (1000 / this._getAverageCycleDuration()).toFixed(2),
      uptime_ms: Date.now() - this.startTime
    };
  }

  /**
   * Generate metrics report
   */
  generateMetricsReport() {
    return {
      timestamp: new Date().toISOString(),
      validation: this.getValidationMetrics(),
      health: this.getHealthStatus(),
      invariants: this.getInvariantCompliance(),
      performance: this.getPerformanceMetrics(),
      validators: this.getValidatorMetrics(),
      violations: this.getViolationTrend()
    };
  }

  /**
   * Export metrics
   */
  exportMetrics(filename) {
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        report: this.generateMetricsReport(),
        recentCycles: this.metrics.cycles.slice(-50)
      };

      const fs = require('fs');
      fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');

      return { success: true, filename };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanMs = 3600000) {
    const cutoffTime = Date.now() - olderThanMs;
    const beforeCount = this.metrics.cycles.length;

    this.metrics.cycles = this.metrics.cycles.filter(c => {
      const cycleTime = new Date(c.timestamp).getTime();
      return cycleTime > cutoffTime;
    });

    return {
      clearedEntries: beforeCount - this.metrics.cycles.length,
      remainingEntries: this.metrics.cycles.length
    };
  }
}

module.exports = ValidationMetricsCollector;
