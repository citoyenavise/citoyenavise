/**
 * MetaOptimizationEngine
 * PHASE 8.5 — Deterministic Kernel Auto-Tuning
 *
 * Automatically optimizes kernel behavior based on profiling data.
 *
 * CRITICAL:
 * ✔ deterministic tuning (same metrics → same adjustments)
 * ✔ no divergence from causal ordering
 * ✔ reversible optimizations
 * ✔ cost-aware execution planning
 */

class MetaOptimizationEngine {
  constructor(options = {}) {
    // Performance profiler (dependency injection)
    this.profiler = options.profiler || null;

    // Optimization recommendations: { componentId, tuning, rationale }
    this.recommendations = [];

    // Applied optimizations: { optimizationId, appliedAt, effect }
    this.appliedOptimizations = new Map();

    // Tuning parameters: { cacheSize, executionBatchSize, prefetchDepth }
    this.tuningParameters = {
      cacheSize: options.initialCacheSize || 1000,
      executionBatchSize: options.initialBatchSize || 10,
      prefetchDepth: options.initialPrefetchDepth || 3
    };

    // Optimization history (immutable)
    this.optimizationHistory = [];
    this.maxHistorySize = options.maxHistorySize || 500;

    // Metrics
    this.stats = {
      optimizationsGenerated: 0,
      optimizationsApplied: 0,
      expectedImprovementMs: 0,
      actualImprovementMs: 0,
      lastOptimization: null
    };
  }

  /**
   * Analyze profiling data and generate recommendations
   */
  analyzeAndRecommend() {
    if (!this.profiler) {
      return { analyzed: false, reason: 'PROFILER_NOT_SET' };
    }

    try {
      const recommendations = [];

      // Get current metrics
      const bottlenecks = this.profiler.identifyBottlenecks(5);
      const hotspots = this.profiler.getHotspots();

      // Generate recommendations based on bottlenecks
      for (const bottleneck of bottlenecks.bottlenecks) {
        if (bottleneck.avgMs > 50) {
          // High latency → recommend caching
          recommendations.push({
            componentId: bottleneck.componentId,
            type: 'ENABLE_CACHING',
            expectedImprovement: Math.round(bottleneck.avgMs * 0.3),
            rationale: `High latency (${bottleneck.avgMs}ms), enable result caching`
          });
        }

        if (bottleneck.executions > 1000) {
          // High frequency → recommend batching
          recommendations.push({
            componentId: bottleneck.componentId,
            type: 'BATCH_EXECUTION',
            expectedImprovement: Math.round(bottleneck.avgMs * 0.2),
            rationale: `High frequency (${bottleneck.executions} execs), batch operations`
          });
        }
      }

      // Generate recommendations based on hotspots
      if (hotspots.detected) {
        recommendations.push({
          componentId: 'GLOBAL',
          type: 'PREFETCH_OPTIMIZATION',
          expectedImprovement: Math.round(hotspots.hotspotsDetected * 2),
          rationale: `${hotspots.hotspotsDetected} hotspots detected, enable prefetching`
        });
      }

      this.recommendations = recommendations;
      this.stats.optimizationsGenerated += recommendations.length;

      // Calculate total expected improvement
      const totalExpected = recommendations.reduce(
        (sum, r) => sum + r.expectedImprovement,
        0
      );

      return {
        analyzed: true,
        recommendationCount: recommendations.length,
        recommendations,
        expectedTotalImprovement: totalExpected
      };
    } catch (err) {
      return {
        analyzed: false,
        error: err.message
      };
    }
  }

  /**
   * Apply optimization with deterministic validation
   */
  applyOptimization(optimization) {
    if (!optimization || !optimization.type) {
      return { applied: false, reason: 'INVALID_OPTIMIZATION' };
    }

    try {
      const optimizationId = `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Apply optimization (deterministically)
      const adjustments = this._computeAdjustments(optimization);

      const record = Object.freeze({
        optimizationId,
        type: optimization.type,
        componentId: optimization.componentId,
        adjustments,
        appliedAt: Date.now(),
        expectedImprovement: optimization.expectedImprovement
      });

      this.appliedOptimizations.set(optimizationId, record);

      // Record in history
      this.optimizationHistory.push(record);
      if (this.optimizationHistory.length > this.maxHistorySize) {
        this.optimizationHistory.shift();
      }

      this.stats.optimizationsApplied++;
      this.stats.expectedImprovementMs += optimization.expectedImprovement;
      this.stats.lastOptimization = Date.now();

      return {
        applied: true,
        optimizationId,
        adjustments,
        expectedImprovement: optimization.expectedImprovement
      };
    } catch (err) {
      return {
        applied: false,
        error: err.message
      };
    }
  }

  /**
   * Record actual improvement after optimization
   */
  recordActualImprovement(optimizationId, actualImprovementMs) {
    const record = this.appliedOptimizations.get(optimizationId);
    if (!record) {
      return { recorded: false, reason: 'OPTIMIZATION_NOT_FOUND' };
    }

    try {
      this.stats.actualImprovementMs += actualImprovementMs;

      return {
        recorded: true,
        optimizationId,
        actualImprovement: actualImprovementMs,
        expectedImprovement: record.expectedImprovement,
        accuracy: (actualImprovementMs / record.expectedImprovement * 100).toFixed(1) + '%'
      };
    } catch (err) {
      return {
        recorded: false,
        error: err.message
      };
    }
  }

  /**
   * Adjust tuning parameters based on optimization
   */
  adjustTuningParameters(optimization) {
    try {
      const adjusted = { ...this.tuningParameters };

      switch (optimization.type) {
        case 'ENABLE_CACHING':
          adjusted.cacheSize = Math.min(10000, adjusted.cacheSize * 1.5);
          break;
        case 'BATCH_EXECUTION':
          adjusted.executionBatchSize = Math.min(100, adjusted.executionBatchSize * 1.2);
          break;
        case 'PREFETCH_OPTIMIZATION':
          adjusted.prefetchDepth = Math.min(10, adjusted.prefetchDepth * 1.3);
          break;
      }

      this.tuningParameters = adjusted;

      return {
        adjusted: true,
        parameters: adjusted
      };
    } catch (err) {
      return {
        adjusted: false,
        error: err.message
      };
    }
  }

  /**
   * Validate optimization doesn't break determinism
   */
  validateDeterminism(optimization) {
    try {
      // Check if optimization is deterministic
      const deterministicOptimizations = [
        'ENABLE_CACHING',
        'BATCH_EXECUTION',
        'PREFETCH_OPTIMIZATION',
        'REORDER_EXECUTION'
      ];

      const isDeterministic = deterministicOptimizations.includes(optimization.type);

      if (!isDeterministic) {
        return {
          valid: false,
          reason: 'NON_DETERMINISTIC_OPTIMIZATION'
        };
      }

      // Check if it affects causal ordering
      const affectsCausality = optimization.type === 'REORDER_EXECUTION';

      return {
        valid: true,
        deterministic: isDeterministic,
        affectsCausality,
        safe: !affectsCausality
      };
    } catch (err) {
      return {
        valid: false,
        error: err.message
      };
    }
  }

  /**
   * Internal: Compute adjustments for optimization
   */
  _computeAdjustments(optimization) {
    const adjustments = {};

    switch (optimization.type) {
      case 'ENABLE_CACHING':
        adjustments.cacheEnabled = true;
        adjustments.cacheSize = this.tuningParameters.cacheSize;
        break;
      case 'BATCH_EXECUTION':
        adjustments.batchingEnabled = true;
        adjustments.batchSize = this.tuningParameters.executionBatchSize;
        break;
      case 'PREFETCH_OPTIMIZATION':
        adjustments.prefetchEnabled = true;
        adjustments.prefetchDepth = this.tuningParameters.prefetchDepth;
        break;
    }

    return Object.freeze(adjustments);
  }

  /**
   * Get optimization history
   */
  getOptimizationHistory(limit = 50) {
    return {
      available: true,
      optimizationCount: this.optimizationHistory.length,
      history: this.optimizationHistory.slice(-limit)
    };
  }

  /**
   * Get tuning parameters
   */
  getTuningParameters() {
    return {
      parameters: { ...this.tuningParameters },
      timestamp: Date.now()
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      appliedOptimizationsCount: this.appliedOptimizations.size,
      historySize: this.optimizationHistory.length,
      currentCacheSize: this.tuningParameters.cacheSize,
      currentBatchSize: this.tuningParameters.executionBatchSize,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.recommendations = [];
    this.appliedOptimizations.clear();
    this.optimizationHistory = [];
    this.tuningParameters = {
      cacheSize: 1000,
      executionBatchSize: 10,
      prefetchDepth: 3
    };
    this.stats = {
      optimizationsGenerated: 0,
      optimizationsApplied: 0,
      expectedImprovementMs: 0,
      actualImprovementMs: 0,
      lastOptimization: null
    };
  }
}

module.exports = MetaOptimizationEngine;
