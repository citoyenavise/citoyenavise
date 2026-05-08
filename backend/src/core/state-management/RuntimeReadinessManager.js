/**
 * RuntimeReadinessManager.js - Manage system operational readiness
 * State Management Layer
 *
 * Responsibility: Track and verify system readiness to operate
 * - Monitor readiness conditions
 * - Verify prerequisites before accepting traffic
 * - Track readiness transitions
 * - Provide readiness signals
 * - Health-based readiness assessment
 */

class RuntimeReadinessManager {
  constructor(options = {}) {
    this.readinessState = 'NOT_READY';
    this.readinessChecks = new Map();
    this.readinessHistory = [];
    this.readinessProbes = [];

    this.readinessConditions = {
      BOOTSTRAP_COMPLETE: {
        name: 'Bootstrap Complete',
        description: 'All bootstrap phases completed successfully',
        required: true,
        met: false
      },
      CONSTITUTION_LOADED: {
        name: 'Constitution Loaded',
        description: 'Constitutional declarations loaded and verified',
        required: true,
        met: false
      },
      VALIDATION_ACTIVE: {
        name: 'Validation Active',
        description: 'Validation engine running and checking rules',
        required: true,
        met: false
      },
      ENFORCEMENT_ACTIVE: {
        name: 'Enforcement Active',
        description: 'Enforcement engine ready to block violations',
        required: true,
        met: false
      },
      CRITICAL_SERVICES_HEALTHY: {
        name: 'Critical Services Healthy',
        description: 'All critical services operational',
        required: true,
        met: false
      },
      NO_CRITICAL_VIOLATIONS: {
        name: 'No Critical Violations',
        description: 'No unresolved critical invariant violations',
        required: true,
        met: false
      },
      RECOVERY_AVAILABLE: {
        name: 'Recovery Available',
        description: 'Recovery layer ready for failures',
        required: false,
        met: false
      },
      OBSERVABILITY_ACTIVE: {
        name: 'Observability Active',
        description: 'Observability components collecting data',
        required: false,
        met: false
      }
    };

    this.config = {
      maxReadinessHistorySize: options.maxReadinessHistorySize || 10000,
      readinessCheckInterval_ms: options.readinessCheckInterval_ms || 5000,
      requiredConditionsForReady: options.requiredConditionsForReady || null
    };

    this.metrics = {
      readinessTransitions: 0,
      timeToReady_ms: null,
      currentReadinessScore: 0,
      maxReadinessScore: 0
    };
  }

  /**
   * Report readiness condition met
   */
  reportConditionMet(conditionName) {
    const condition = this.readinessConditions[conditionName];

    if (!condition) {
      return {
        success: false,
        reason: `Unknown readiness condition: ${conditionName}`
      };
    }

    const wasMet = condition.met;
    condition.met = true;

    if (!wasMet) {
      this._checkOverallReadiness();
    }

    return {
      success: true,
      condition: conditionName,
      name: condition.name,
      nowMet: true,
      readinessState: this.readinessState
    };
  }

  /**
   * Report readiness condition not met
   */
  reportConditionNotMet(conditionName, reason = '') {
    const condition = this.readinessConditions[conditionName];

    if (!condition) {
      return {
        success: false,
        reason: `Unknown readiness condition: ${conditionName}`
      };
    }

    const wasMet = condition.met;
    condition.met = false;

    if (wasMet) {
      const wasReady = this.readinessState === 'READY';
      this._checkOverallReadiness();

      if (wasReady && this.readinessState !== 'READY') {
        return {
          success: true,
          condition: conditionName,
          readinessLost: true,
          reason,
          readinessState: this.readinessState
        };
      }
    }

    return {
      success: true,
      condition: conditionName,
      name: condition.name,
      nowMet: false,
      readinessState: this.readinessState
    };
  }

  /**
   * Check overall readiness
   */
  _checkOverallReadiness() {
    // Check if all required conditions are met
    const unmetRequired = [];

    for (const [name, condition] of Object.entries(this.readinessConditions)) {
      if (condition.required && !condition.met) {
        unmetRequired.push(name);
      }
    }

    const previousState = this.readinessState;

    if (unmetRequired.length === 0) {
      this.readinessState = 'READY';

      if (previousState !== 'READY') {
        this.metrics.readinessTransitions++;
        if (!this.metrics.timeToReady_ms) {
          this.metrics.timeToReady_ms = Date.now();
        }
      }
    } else {
      this.readinessState = 'NOT_READY';

      if (previousState === 'READY') {
        this.metrics.readinessTransitions++;
      }
    }

    // Record transition if changed
    if (previousState !== this.readinessState) {
      this.readinessHistory.push({
        timestamp: new Date().toISOString(),
        previousState,
        newState: this.readinessState,
        unmetConditions: unmetRequired
      });

      if (this.readinessHistory.length > this.config.maxReadinessHistorySize) {
        this.readinessHistory.shift();
      }
    }
  }

  /**
   * Register readiness probe
   */
  registerProbe(probeName, probeFunction) {
    this.readinessProbes.push({
      name: probeName,
      check: probeFunction,
      lastResult: null,
      lastCheckedAt: null,
      isHealthy: null
    });

    return {
      registered: true,
      probeName,
      totalProbes: this.readinessProbes.length
    };
  }

  /**
   * Run all readiness probes
   */
  async runProbes() {
    const results = [];
    const now = Date.now();

    for (const probe of this.readinessProbes) {
      try {
        const result = await Promise.race([
          probe.check(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Probe timeout')), 5000)
          )
        ]);

        probe.isHealthy = result.healthy !== false;
        probe.lastResult = result;
        probe.lastCheckedAt = new Date().toISOString();

        results.push({
          probeName: probe.name,
          healthy: probe.isHealthy,
          message: result.message,
          duration_ms: Date.now() - now
        });
      } catch (error) {
        probe.isHealthy = false;
        probe.lastResult = { error: error.message };
        probe.lastCheckedAt = new Date().toISOString();

        results.push({
          probeName: probe.name,
          healthy: false,
          message: error.message,
          duration_ms: Date.now() - now
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      probeResults: results,
      allHealthy: results.every(r => r.healthy)
    };
  }

  /**
   * Get readiness status
   */
  getReadinessStatus() {
    const conditions = [];
    const unmetRequired = [];
    const unmetOptional = [];

    for (const [name, condition] of Object.entries(this.readinessConditions)) {
      conditions.push({
        name,
        displayName: condition.name,
        description: condition.description,
        required: condition.required,
        met: condition.met
      });

      if (!condition.met) {
        if (condition.required) {
          unmetRequired.push(name);
        } else {
          unmetOptional.push(name);
        }
      }
    }

    return {
      timestamp: new Date().toISOString(),
      readinessState: this.readinessState,
      conditions,
      unmetRequiredConditions: unmetRequired,
      unmetOptionalConditions: unmetOptional,
      canAcceptTraffic: this.readinessState === 'READY',
      probeHealthStatus: this._summarizeProbes()
    };
  }

  /**
   * Summarize probe results
   */
  _summarizeProbes() {
    const healthy = this.readinessProbes.filter(p => p.isHealthy).length;
    const total = this.readinessProbes.length;

    return {
      healthyProbes: healthy,
      totalProbes: total,
      healthPercentage: total > 0 ? ((healthy / total) * 100).toFixed(2) + '%' : 'N/A',
      allHealthy: healthy === total
    };
  }

  /**
   * Get readiness score
   */
  getReadinessScore() {
    let metCount = 0;
    let totalCount = 0;

    for (const condition of Object.values(this.readinessConditions)) {
      totalCount++;
      if (condition.met) {
        metCount++;
      }
    }

    const score = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 0;
    this.metrics.currentReadinessScore = score;
    this.metrics.maxReadinessScore = Math.max(this.metrics.maxReadinessScore, score);

    return {
      score,
      percentage: score + '%',
      metConditions: metCount,
      totalConditions: totalCount
    };
  }

  /**
   * Is system ready
   */
  isReady() {
    return this.readinessState === 'READY';
  }

  /**
   * Can accept traffic
   */
  canAcceptTraffic() {
    return this.readinessState === 'READY';
  }

  /**
   * Get readiness summary
   */
  getReadinessSummary() {
    const status = this.getReadinessStatus();
    const score = this.getReadinessScore();

    return {
      timestamp: new Date().toISOString(),
      ready: this.isReady(),
      canAcceptTraffic: this.canAcceptTraffic(),
      readinessScore: score,
      status,
      recommendation: this._getRecommendation()
    };
  }

  /**
   * Get readiness recommendation
   */
  _getRecommendation() {
    if (this.readinessState === 'READY') {
      return 'System ready to accept traffic';
    }

    const unmetRequired = [];
    for (const [name, condition] of Object.entries(this.readinessConditions)) {
      if (condition.required && !condition.met) {
        unmetRequired.push(condition.name);
      }
    }

    if (unmetRequired.length > 0) {
      return `Waiting for: ${unmetRequired.join(', ')}`;
    }

    return 'Waiting for optional conditions';
  }

  /**
   * Get readiness history
   */
  getReadinessHistory(limit = 50) {
    return this.readinessHistory.slice(-limit);
  }

  /**
   * Get readiness metrics
   */
  getReadinessMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics
    };
  }

  /**
   * Generate readiness report
   */
  generateReadinessReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: this.getReadinessSummary(),
      conditions: this.getReadinessStatus().conditions,
      probeResults: this.readinessProbes.map(p => ({
        name: p.name,
        healthy: p.isHealthy,
        lastCheckedAt: p.lastCheckedAt
      })),
      metrics: this.getReadinessMetrics(),
      recentHistory: this.getReadinessHistory(10)
    };
  }

  /**
   * Reset manager
   */
  reset() {
    for (const condition of Object.values(this.readinessConditions)) {
      condition.met = false;
    }

    this.readinessState = 'NOT_READY';
    this.readinessHistory = [];
    this.metrics = {
      readinessTransitions: 0,
      timeToReady_ms: null,
      currentReadinessScore: 0,
      maxReadinessScore: 0
    };

    return { reset: true };
  }
}

module.exports = RuntimeReadinessManager;
