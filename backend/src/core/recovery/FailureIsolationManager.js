/**
 * FailureIsolationManager.js - Isolate failures to prevent cascade
 * PHASE 1.6: Recovery Layer
 *
 * Responsibility: Manage module isolation and failure containment
 * - Activate isolation strategies
 * - Track isolated modules
 * - Manage isolation boundaries
 * - Monitor isolation effectiveness
 * - Coordinate module reintegration
 */

class FailureIsolationManager {
  constructor(options = {}) {
    this.isolatedModules = new Map();
    this.isolationStrategies = {
      CIRCUIT_BREAKER: this._setupCircuitBreaker.bind(this),
      TIMEOUT: this._setupTimeout.bind(this),
      BULKHEAD: this._setupBulkhead.bind(this),
      RATE_LIMIT: this._setupRateLimit.bind(this),
      QUARANTINE: this._setupQuarantine.bind(this),
      FALLBACK: this._setupFallback.bind(this),
      CELL: this._setupCell.bind(this)
    };

    // Isolation state
    this.activeBoundaries = [];
    this.isolationMetrics = {
      isolatedModules: 0,
      successfulIsolations: 0,
      failedIsolations: 0,
      reintegratedModules: 0
    };

    this.config = {
      quarantineDuration_ms: options.quarantineDuration_ms || 60000,
      isolationTimeout_ms: options.isolationTimeout_ms || 5000,
      maxIsolationDuration_ms: options.maxIsolationDuration_ms || 300000
    };
  }

  /**
   * Activate isolation for affected modules
   */
  activateIsolation(affectedModules, severity = 'HIGH') {
    if (!affectedModules || affectedModules.length === 0) {
      return { success: false, reason: 'No modules to isolate' };
    }

    // Select isolation strategy based on severity and situation
    const strategy = this._selectIsolationStrategy(affectedModules, severity);

    if (!strategy) {
      return { success: false, reason: 'No suitable isolation strategy' };
    }

    try {
      const strategyHandler = this.isolationStrategies[strategy];
      if (!strategyHandler) {
        return { success: false, reason: `Unknown strategy: ${strategy}` };
      }

      const result = strategyHandler(affectedModules);

      if (result.success) {
        // Record isolation
        for (const module of affectedModules) {
          this.isolatedModules.set(module, {
            moduleName: module,
            strategy,
            isolatedAt: Date.now(),
            severity,
            state: 'ISOLATED'
          });
        }

        this.isolationMetrics.successfulIsolations++;
        this.isolationMetrics.isolatedModules = this.isolatedModules.size;

        return {
          success: true,
          strategy,
          isolatedModules: affectedModules,
          boundaryActive: true
        };
      } else {
        this.isolationMetrics.failedIsolations++;
        return { success: false, reason: result.reason || 'Isolation failed' };
      }
    } catch (error) {
      this.isolationMetrics.failedIsolations++;
      return { success: false, reason: `Isolation error: ${error.message}` };
    }
  }

  /**
   * Select appropriate isolation strategy
   */
  _selectIsolationStrategy(modules, severity) {
    // Critical severity → most aggressive isolation
    if (severity === 'CRITICAL') {
      if (modules.length === 1) {
        return 'CIRCUIT_BREAKER'; // Single module circuit breaker
      } else {
        return 'QUARANTINE'; // Multiple modules → quarantine
      }
    }

    // HIGH severity
    if (severity === 'HIGH') {
      return 'BULKHEAD'; // Resource isolation
    }

    // Default
    return 'TIMEOUT'; // Conservative timeout-based isolation
  }

  /**
   * Setup circuit breaker
   */
  _setupCircuitBreaker(modules) {
    const circuitBreakers = new Map();

    for (const module of modules) {
      circuitBreakers.set(module, {
        state: 'OPEN',
        openedAt: Date.now(),
        failureCount: 0,
        successCount: 0,
        nextCheckAt: Date.now() + 30000
      });
    }

    this.activeBoundaries.push({
      type: 'CIRCUIT_BREAKER',
      modules,
      breakers: circuitBreakers,
      activatedAt: Date.now()
    });

    return { success: true, strategy: 'CIRCUIT_BREAKER' };
  }

  /**
   * Setup timeout-based isolation
   */
  _setupTimeout(modules) {
    const timeouts = new Map();

    for (const module of modules) {
      timeouts.set(module, {
        timeout_ms: 5000,
        activeRequests: new Set(),
        timedOutCount: 0
      });
    }

    this.activeBoundaries.push({
      type: 'TIMEOUT',
      modules,
      timeouts,
      activatedAt: Date.now()
    });

    return { success: true, strategy: 'TIMEOUT' };
  }

  /**
   * Setup bulkhead pattern
   */
  _setupBulkhead(modules) {
    const bulkheads = new Map();

    for (const module of modules) {
      bulkheads.set(module, {
        maxConcurrent: 10,
        maxQueueSize: 50,
        currentConcurrent: 0,
        queuedRequests: 0
      });
    }

    this.activeBoundaries.push({
      type: 'BULKHEAD',
      modules,
      bulkheads,
      activatedAt: Date.now()
    });

    return { success: true, strategy: 'BULKHEAD' };
  }

  /**
   * Setup rate limiting
   */
  _setupRateLimit(modules) {
    const rateLimiters = new Map();

    for (const module of modules) {
      rateLimiters.set(module, {
        algorithm: 'token_bucket',
        capacity: 100,
        tokens: 100,
        refillRate_per_sec: 20,
        lastRefill: Date.now()
      });
    }

    this.activeBoundaries.push({
      type: 'RATE_LIMIT',
      modules,
      limiters: rateLimiters,
      activatedAt: Date.now()
    });

    return { success: true, strategy: 'RATE_LIMIT' };
  }

  /**
   * Setup quarantine
   */
  _setupQuarantine(modules) {
    const quarantines = new Map();

    for (const module of modules) {
      quarantines.set(module, {
        state: 'QUARANTINED',
        quarantinedAt: Date.now(),
        checkInterval_ms: 1000,
        healthChecksRequired: 5,
        passedChecks: 0,
        failedChecks: 0
      });
    }

    this.activeBoundaries.push({
      type: 'QUARANTINE',
      modules,
      quarantines,
      activatedAt: Date.now()
    });

    return { success: true, strategy: 'QUARANTINE' };
  }

  /**
   * Setup fallback handlers
   */
  _setupFallback(modules) {
    const fallbacks = new Map();

    for (const module of modules) {
      fallbacks.set(module, {
        primaryFailed: true,
        fallbackActive: true,
        fallbackType: 'cached_response',
        useCount: 0,
        staleTolerance_sec: 300
      });
    }

    this.activeBoundaries.push({
      type: 'FALLBACK',
      modules,
      fallbacks,
      activatedAt: Date.now()
    });

    return { success: true, strategy: 'FALLBACK' };
  }

  /**
   * Setup cell-based isolation
   */
  _setupCell(modules) {
    const cellId = `cell_${Date.now()}`;
    const cells = new Map();

    cells.set(cellId, {
      cellId,
      modules,
      healthStatus: 'DEGRADED',
      failureCount: 0,
      recoveryAttempts: 0
    });

    this.activeBoundaries.push({
      type: 'CELL',
      cellId,
      cells,
      activatedAt: Date.now()
    });

    return { success: true, strategy: 'CELL' };
  }

  /**
   * Get isolation status
   */
  getIsolationStatus() {
    return {
      isolatedModules: Array.from(this.isolatedModules.entries()).map(([name, data]) => ({
        moduleName: name,
        ...data
      })),
      activeBoundaries: this.activeBoundaries.length,
      metrics: this.isolationMetrics
    };
  }

  /**
   * Check isolation effectiveness
   */
  checkIsolationEffectiveness() {
    const effectiveness = {
      timestamp: new Date().toISOString(),
      boundaries: []
    };

    for (const boundary of this.activeBoundaries) {
      const age_ms = Date.now() - boundary.activatedAt;

      effectiveness.boundaries.push({
        type: boundary.type,
        moduleCount: boundary.modules.length,
        age_ms,
        status: age_ms > this.config.maxIsolationDuration_ms ? 'EXPIRED' : 'ACTIVE'
      });
    }

    return effectiveness;
  }

  /**
   * Reintegrate module after recovery
   */
  reintegrateModule(moduleName) {
    const isolation = this.isolatedModules.get(moduleName);

    if (!isolation) {
      return { success: false, reason: 'Module not isolated' };
    }

    try {
      // Remove from isolation
      this.isolatedModules.delete(moduleName);

      // Remove from boundaries
      for (let i = this.activeBoundaries.length - 1; i >= 0; i--) {
        const boundary = this.activeBoundaries[i];
        const idx = boundary.modules.indexOf(moduleName);

        if (idx !== -1) {
          boundary.modules.splice(idx, 1);

          // If no more modules in this boundary, remove it
          if (boundary.modules.length === 0) {
            this.activeBoundaries.splice(i, 1);
          }
        }
      }

      this.isolationMetrics.reintegratedModules++;

      return {
        success: true,
        moduleName,
        reason: 'Module reintegrated successfully'
      };
    } catch (error) {
      return { success: false, reason: `Reintegration error: ${error.message}` };
    }
  }

  /**
   * Get isolated module
   */
  getIsolatedModule(moduleName) {
    return this.isolatedModules.get(moduleName) || null;
  }

  /**
   * Get isolation metrics
   */
  getIsolationMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.isolationMetrics,
      currentlyIsolated: this.isolatedModules.size,
      activeBoundaries: this.activeBoundaries.length
    };
  }

  /**
   * Clear expired isolations
   */
  clearExpiredIsolations() {
    const maxAge = this.config.maxIsolationDuration_ms;
    const now = Date.now();
    let clearedCount = 0;

    for (const [module, data] of this.isolatedModules.entries()) {
      if (now - data.isolatedAt > maxAge) {
        this.isolatedModules.delete(module);
        clearedCount++;
      }
    }

    // Clean up expired boundaries
    this.activeBoundaries = this.activeBoundaries.filter(b => {
      return now - b.activatedAt <= maxAge;
    });

    return { clearedCount };
  }

  /**
   * Reset isolation state
   */
  reset() {
    this.isolatedModules.clear();
    this.activeBoundaries = [];
    this.isolationMetrics = {
      isolatedModules: 0,
      successfulIsolations: 0,
      failedIsolations: 0,
      reintegratedModules: 0
    };

    return { reset: true };
  }
}

module.exports = FailureIsolationManager;
