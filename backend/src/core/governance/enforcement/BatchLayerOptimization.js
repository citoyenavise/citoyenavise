/**
 * BatchLayerOptimization
 * PHASE 7.0.5 — Batch Layer Optimization & Observability Enhancement
 *
 * Standalone observability layer that wraps EnforcementProofSystem
 * INVARIANT: Batch NEVER influences Real-Time Enforcement decisions
 * All operations are observability-only, non-blocking, fire-and-forget
 */

class BatchLayerOptimization {
  constructor(proofSystem, options = {}) {
    // Reference to EnforcementProofSystem (read-only for observability)
    this.proofSystem = proofSystem;

    // Alert thresholds (configurable)
    this.alertThresholds = {
      violationRatePercent: options.violationRatePercent || 30,
      p95LatencyMs: options.p95LatencyMs || 100,
      batchQueueFillPercent: options.batchQueueFillPercent || 90
    };

    // Alert history (append-only, capped)
    this.alerts = [];
    this.maxAlerts = options.maxAlerts || 1000;

    // Compaction history for diagnostics
    this.compactionHistory = [];
    this.maxCompactionHistory = options.maxCompactionHistory || 100;

    // Timestamp of initialization
    this.initializedAt = new Date().toISOString();
  }

  /**
   * INVARIANT: Batch layer is NEVER authoritative
   * This is the core separation: Real-Time drives decisions, Batch only observes
   */
  isAuthoritative() {
    return false;
  }

  /**
   * Calculate percentile of a numeric array
   * Pattern: reused from EventMetricsCollector.js
   */
  _percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get enhanced metrics with percentiles
   * Reads from proofSystem (read-only reference)
   */
  getEnhancedMetrics() {
    const metrics = this.proofSystem.getMetrics();
    const total = metrics.totalCaptured;

    // Calculate rates
    const successRate = total > 0 ? metrics.successCount / total : 0;
    const violationRate = total > 0 ? metrics.violationCount / total : 0;

    // Calculate batch queue fill percentage
    const batchQueueFillPercent =
      total > 0
        ? (metrics.batchQueueDepth / this.proofSystem.maxBatchBufferSize) * 100
        : 0;

    // Calculate percentiles for each action
    const latencyPercentiles = {};
    for (const [action, latencies] of Object.entries(metrics.latencyPerRule)) {
      if (latencies && latencies.length > 0) {
        latencyPercentiles[action] = {
          p50: this._percentile(latencies, 50),
          p95: this._percentile(latencies, 95),
          p99: this._percentile(latencies, 99),
          avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
          count: latencies.length,
          min: Math.min(...latencies),
          max: Math.max(...latencies)
        };
      }
    }

    return {
      isAuthoritative: false, // INVARIANT
      chainLength: metrics.chainLength,
      totalCaptured: metrics.totalCaptured,
      successCount: metrics.successCount,
      violationCount: metrics.violationCount,
      successRate: parseFloat((successRate * 100).toFixed(2)),
      violationRate: parseFloat((violationRate * 100).toFixed(2)),
      batchQueueDepth: metrics.batchQueueDepth,
      batchQueueFillPercent: parseFloat(batchQueueFillPercent.toFixed(2)),
      batchFlushed: metrics.batchFlushed,
      batchAutoCompactCount: metrics.batchAutoCompactCount,
      lastFlushTimestamp: metrics.lastFlushTimestamp,
      lastFlushDurationMs: metrics.lastFlushDurationMs,
      proofFlushRate: metrics.proofFlushRate,
      proofSystemErrors: metrics.proofSystemErrors,
      latencyPercentiles,
      byModule: metrics.byModule,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Evaluate alert thresholds and record alerts
   * Returns array of newly triggered alerts
   */
  checkAlerts() {
    const metrics = this.proofSystem.getMetrics();
    const newAlerts = [];
    const total = metrics.totalCaptured;

    if (total === 0) {
      return newAlerts;
    }

    // Alert 1: Violation rate exceeds threshold
    const violationRatePercent = (metrics.violationCount / total) * 100;
    if (violationRatePercent > this.alertThresholds.violationRatePercent) {
      const alert = Object.freeze({
        type: 'VIOLATION_RATE',
        severity: 'WARNING',
        value: parseFloat(violationRatePercent.toFixed(2)),
        threshold: this.alertThresholds.violationRatePercent,
        message: `Violation rate ${violationRatePercent.toFixed(1)}% exceeds threshold ${this.alertThresholds.violationRatePercent}%`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
    }

    // Alert 2: p95 latency exceeds threshold (per action)
    for (const [action, latencies] of Object.entries(metrics.latencyPerRule)) {
      if (!latencies || latencies.length === 0) continue;

      const p95 = this._percentile(latencies, 95);
      if (p95 > this.alertThresholds.p95LatencyMs) {
        const alert = Object.freeze({
          type: 'LATENCY_P95',
          severity: 'WARNING',
          action,
          value: parseFloat(p95.toFixed(2)),
          threshold: this.alertThresholds.p95LatencyMs,
          message: `p95 latency for '${action}' = ${p95.toFixed(2)}ms exceeds threshold ${this.alertThresholds.p95LatencyMs}ms`,
          timestamp: new Date().toISOString(),
          isAuthoritative: false
        });
        newAlerts.push(alert);
      }
    }

    // Alert 3: Batch queue approaching capacity
    const batchQueueFillPercent =
      (metrics.batchQueueDepth / this.proofSystem.maxBatchBufferSize) * 100;
    if (batchQueueFillPercent > this.alertThresholds.batchQueueFillPercent) {
      const alert = Object.freeze({
        type: 'BATCH_QUEUE_FULL',
        severity: 'CRITICAL',
        value: parseFloat(batchQueueFillPercent.toFixed(2)),
        threshold: this.alertThresholds.batchQueueFillPercent,
        message: `Batch queue at ${batchQueueFillPercent.toFixed(1)}% capacity`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
    }

    // Append new alerts to history (capped)
    for (const alert of newAlerts) {
      this.alerts.push(alert);
      if (this.alerts.length > this.maxAlerts) {
        this.alerts.shift();
      }
    }

    return newAlerts;
  }

  /**
   * Get recent alerts
   */
  getAlerts(n = 50) {
    const start = Math.max(0, this.alerts.length - n);
    return this.alerts.slice(start);
  }

  /**
   * Get all current alerts
   */
  getAllAlerts() {
    return [...this.alerts];
  }

  /**
   * Clear all alerts (for testing)
   */
  clearAlerts() {
    this.alerts = [];
  }

  /**
   * Get summary combining real-time + batch + alerts
   */
  getSummary() {
    const enhanced = this.getEnhancedMetrics();
    const activeAlerts = this.checkAlerts();

    return {
      isAuthoritative: false,
      metrics: enhanced,
      alerts: {
        active: activeAlerts,
        total: this.alerts.length,
        recent: this.getAlerts(10)
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Record a compaction event in history
   */
  recordCompaction(compactionResult) {
    if (!compactionResult) return;

    const event = Object.freeze({
      timestamp: new Date().toISOString(),
      flushed: compactionResult.flushed,
      batchId: compactionResult.compacted?.batchId || null,
      sequenceRange: compactionResult.compacted?.sequenceRange || null,
      entriesCount: compactionResult.compacted?.entriesCount || 0,
      metricsSnapshot: {
        batchQueueDepth: compactionResult.metrics?.batchQueueDepth || 0,
        totalCaptured: compactionResult.metrics?.totalCaptured || 0,
        proofFlushRate: compactionResult.metrics?.proofFlushRate || 0
      }
    });

    this.compactionHistory.push(event);
    if (this.compactionHistory.length > this.maxCompactionHistory) {
      this.compactionHistory.shift();
    }
  }

  /**
   * Get compaction history
   */
  getCompactionHistory(n = 20) {
    const start = Math.max(0, this.compactionHistory.length - n);
    return this.compactionHistory.slice(start);
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.alerts = [];
    this.compactionHistory = [];
    this.initializedAt = new Date().toISOString();
  }

  /**
   * Get diagnostic summary
   */
  getDiagnostics() {
    const metrics = this.proofSystem.getMetrics();
    return {
      isAuthoritative: false,
      initialized: this.initializedAt,
      proofSystemStatus: {
        totalCaptured: metrics.totalCaptured,
        chainLength: metrics.chainLength,
        proofSystemErrors: metrics.proofSystemErrors
      },
      batchStatus: {
        queueDepth: metrics.batchQueueDepth,
        maxSize: this.proofSystem.maxBatchBufferSize,
        fillPercent: (metrics.batchQueueDepth / this.proofSystem.maxBatchBufferSize) * 100,
        flushed: metrics.batchFlushed,
        autoCompactCount: metrics.batchAutoCompactCount,
        lastFlushTimestamp: metrics.lastFlushTimestamp,
        lastFlushDurationMs: metrics.lastFlushDurationMs
      },
      alertStatus: {
        total: this.alerts.length,
        maxStored: this.maxAlerts,
        active: this.checkAlerts().map((a) => a.type)
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = BatchLayerOptimization;
