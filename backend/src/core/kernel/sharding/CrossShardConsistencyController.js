/**
 * CrossShardConsistencyController
 * PHASE 8.3 — Cross-Shard Consistency Verification
 *
 * Monitors execution consistency across shards.
 *
 * CRITICAL:
 * ✔ read-only global comparison
 * ✔ no automatic rollback (observability only)
 * ✔ anomaly detection and proof logging
 * ✔ deterministic divergence detection
 */

class CrossShardConsistencyController {
  constructor(options = {}) {
    // Distributed execution engine (dependency injection)
    this.executionEngine = options.executionEngine || null;

    // Shard router (dependency injection)
    this.router = options.router || null;

    // Consistency checks: timestamp → { type, result, violations[] }
    this.consistencyChecks = [];
    this.maxChecksHistory = options.maxChecksHistory || 1000;

    // Anomaly log
    this.anomalies = [];
    this.maxAnomaliesSize = options.maxAnomaliesSize || 500;

    // Metrics
    this.stats = {
      checksPerformed: 0,
      anomaliesDetected: 0,
      lastCheck: null,
      divergenceRate: 0
    };
  }

  /**
   * Verify global execution consistency across all shards
   */
  verifyGlobalConsistency() {
    if (!this.executionEngine || !this.router) {
      return { verified: false, reason: 'DEPENDENCIES_NOT_SET' };
    }

    try {
      const checkResult = this.executionEngine.validateExecutionConsistency();

      if (!checkResult.consistent) {
        // Log anomalies
        for (const violation of checkResult.violations || []) {
          this._recordAnomaly(violation);
        }
        this.stats.anomaliesDetected += checkResult.violationCount;
      }

      // Record check
      this._recordCheck({
        type: 'GLOBAL_CONSISTENCY_CHECK',
        consistent: checkResult.consistent,
        violationCount: checkResult.violationCount,
        violations: checkResult.violations
      });

      this.stats.checksPerformed++;
      this.stats.lastCheck = Date.now();

      // Calculate divergence rate
      const globalState = this.executionEngine.getGlobalExecutionState();
      if (globalState.executionCount > 0) {
        this.stats.divergenceRate = (checkResult.violationCount / globalState.executionCount) * 100;
      }

      return {
        verified: checkResult.consistent,
        violationCount: checkResult.violationCount,
        violations: checkResult.violations,
        divergenceRate: this.stats.divergenceRate
      };
    } catch (err) {
      return {
        verified: false,
        reason: 'VERIFICATION_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Verify consistency within a single shard
   */
  verifyShardConsistency(shardId) {
    if (!shardId || !this.executionEngine) {
      return { verified: false, reason: 'INVALID_INPUT' };
    }

    try {
      // Get shard execution log
      const logResult = this.executionEngine.getShardExecutionLog(shardId);
      if (!logResult.available) {
        return {
          verified: false,
          reason: 'SHARD_NOT_FOUND',
          shardId
        };
      }

      const violations = [];
      const log = logResult.lastExecutions;

      // Check 1: All invariants have unique executions
      const invariantCounts = new Map();
      for (const entry of log) {
        const count = invariantCounts.get(entry.invariantId) || 0;
        invariantCounts.set(entry.invariantId, count + 1);
      }

      for (const [invariantId, count] of invariantCounts) {
        if (count > 1) {
          violations.push({
            type: 'DUPLICATE_INVARIANT_EXECUTION',
            invariantId,
            executionCount: count
          });
        }
      }

      // Check 2: Timestamps are monotonically increasing
      let lastTimestamp = 0;
      for (const entry of log) {
        if (entry.timestamp < lastTimestamp) {
          violations.push({
            type: 'TIMESTAMP_VIOLATION',
            invariantId: entry.invariantId,
            expectedMin: lastTimestamp,
            actual: entry.timestamp
          });
        }
        lastTimestamp = entry.timestamp;
      }

      // Check 3: Sequence numbers are continuous
      for (let i = 0; i < log.length; i++) {
        if (log[i].sequence !== i) {
          violations.push({
            type: 'SEQUENCE_VIOLATION',
            expected: i,
            actual: log[i].sequence
          });
        }
      }

      const isConsistent = violations.length === 0;

      this._recordCheck({
        type: 'SHARD_CONSISTENCY_CHECK',
        shardId,
        consistent: isConsistent,
        violationCount: violations.length,
        violations
      });

      if (!isConsistent) {
        this.stats.anomaliesDetected += violations.length;
        for (const violation of violations) {
          this._recordAnomaly({ ...violation, shardId });
        }
      }

      return {
        verified: isConsistent,
        shardId,
        executionCount: logResult.executionCount,
        violationCount: violations.length,
        violations: violations.length > 0 ? violations : null
      };
    } catch (err) {
      return {
        verified: false,
        error: err.message
      };
    }
  }

  /**
   * Detect logical divergence between shards
   * (Same invariant, different results when executed on different shards)
   */
  detectDivergence() {
    if (!this.executionEngine) {
      return { detected: false, reason: 'ENGINE_NOT_SET' };
    }

    try {
      const globalState = this.executionEngine.getGlobalExecutionState(10000);
      const divergences = [];

      // Build a map of invariantId → shard results
      const invariantResults = new Map();

      for (const exec of globalState.recentExecutions) {
        if (!invariantResults.has(exec.invariantId)) {
          invariantResults.set(exec.invariantId, []);
        }
        invariantResults.get(exec.invariantId).push({
          shardId: exec.shardId,
          result: exec.result
        });
      }

      // Check for divergence: same invariant, different results
      for (const [invariantId, results] of invariantResults) {
        const uniqueResults = new Set(results.map(r => r.result.toString()));

        if (uniqueResults.size > 1) {
          // Divergence detected!
          divergences.push({
            type: 'LOGICAL_DIVERGENCE',
            invariantId,
            results: results,
            uniqueResults: uniqueResults.size
          });

          this._recordAnomaly({
            type: 'LOGICAL_DIVERGENCE',
            invariantId,
            results
          });
        }
      }

      if (divergences.length > 0) {
        this.stats.anomaliesDetected += divergences.length;
      }

      return {
        detected: divergences.length > 0,
        divergenceCount: divergences.length,
        divergences: divergences.length > 0 ? divergences : null
      };
    } catch (err) {
      return {
        detected: false,
        error: err.message
      };
    }
  }

  /**
   * Get consistency report
   */
  getConsistencyReport() {
    const recentChecks = this.consistencyChecks.slice(-10);
    const recentAnomalies = this.anomalies.slice(-20);

    return {
      checksPerformed: this.stats.checksPerformed,
      anomaliesDetected: this.stats.anomaliesDetected,
      divergenceRate: this.stats.divergenceRate.toFixed(2) + '%',
      recentChecks,
      recentAnomalies,
      timestamp: Date.now()
    };
  }

  /**
   * Get anomaly log
   */
  getAnomalies(limit = 100) {
    return {
      anomalyCount: this.anomalies.length,
      anomalies: this.anomalies.slice(-limit)
    };
  }

  /**
   * Internal: Record consistency check
   */
  _recordCheck(check) {
    this.consistencyChecks.push({
      ...check,
      timestamp: Date.now(),
      sequence: this.consistencyChecks.length
    });

    if (this.consistencyChecks.length > this.maxChecksHistory) {
      this.consistencyChecks.shift();
    }
  }

  /**
   * Internal: Record anomaly
   */
  _recordAnomaly(anomaly) {
    this.anomalies.push({
      ...anomaly,
      detectedAt: Date.now(),
      sequence: this.anomalies.length
    });

    if (this.anomalies.length > this.maxAnomaliesSize) {
      this.anomalies.shift();
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      checksHistorySize: this.consistencyChecks.length,
      anomaliesHistorySize: this.anomalies.length,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.consistencyChecks = [];
    this.anomalies = [];
    this.stats = {
      checksPerformed: 0,
      anomaliesDetected: 0,
      lastCheck: null,
      divergenceRate: 0
    };
  }
}

module.exports = CrossShardConsistencyController;
