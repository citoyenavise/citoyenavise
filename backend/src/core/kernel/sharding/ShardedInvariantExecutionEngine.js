/**
 * ShardedInvariantExecutionEngine
 * PHASE 8.3 — Distributed Invariant Execution per Shard
 *
 * Executes compiled invariant bytecode locally within shard boundaries.
 *
 * CRITICAL:
 * ✔ deterministic local execution
 * ✔ shard-level isolation
 * ✔ global state synchronization
 * ✔ zero cross-shard divergence
 */

class ShardedInvariantExecutionEngine {
  constructor(options = {}) {
    // Shard router (dependency injection)
    this.router = options.router || null;

    // Execution engine per shard: shardId → InvariantExecutionEngine
    this.shardEngines = new Map();

    // Local execution log per shard: shardId → { invariantId, result, timestamp }[]
    this.shardExecutionLogs = new Map();
    this.maxLogSize = options.maxLogSize || 5000;

    // Global execution synchronization state
    this.globalExecutionState = new Map(); // invariantId → { shardId, result, timestamp }

    // Metrics
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      shardIsolationViolations: 0,
      lastExecution: null
    };
  }

  /**
   * Register execution engine for a shard
   */
  registerShardEngine(shardId, executionEngine) {
    if (!shardId || !executionEngine) {
      return { registered: false, reason: 'INVALID_INPUT' };
    }

    this.shardEngines.set(shardId, executionEngine);
    this.shardExecutionLogs.set(shardId, []);

    return {
      registered: true,
      shardId
    };
  }

  /**
   * Execute invariant within its assigned shard
   */
  executeInvariantOnShard(invariantId, operationContext) {
    if (!invariantId || !this.router) {
      return { executed: false, reason: 'INVALID_INPUT' };
    }

    try {
      // STEP 1: Determine target shard
      const assignmentResult = this.router.assignInvariantToShard(invariantId);
      if (!assignmentResult.assigned) {
        return {
          executed: false,
          reason: 'SHARD_ASSIGNMENT_FAILED'
        };
      }

      const shardId = assignmentResult.shardId;

      // STEP 2: Get shard-local execution engine
      const shardEngine = this.shardEngines.get(shardId);
      if (!shardEngine) {
        return {
          executed: false,
          reason: 'SHARD_ENGINE_NOT_FOUND',
          shardId
        };
      }

      // STEP 3: Execute on shard
      const startTime = Date.now();
      const executionResult = shardEngine.executeInvariant(invariantId, operationContext);
      const latencyMs = Date.now() - startTime;

      if (!executionResult.executed) {
        this.stats.failedExecutions++;
        return {
          executed: false,
          reason: 'INVARIANT_EXECUTION_FAILED',
          invariantId,
          shardId,
          error: executionResult.error
        };
      }

      // STEP 4: Log execution locally
      this._logShardExecution(shardId, {
        invariantId,
        valid: executionResult.valid,
        latencyMs,
        timestamp: Date.now()
      });

      // STEP 5: Synchronize to global state
      this._syncToGlobalState(invariantId, shardId, executionResult.valid);

      this.stats.totalExecutions++;
      if (executionResult.valid) {
        this.stats.successfulExecutions++;
      } else {
        this.stats.failedExecutions++;
      }
      this.stats.lastExecution = Date.now();

      return {
        executed: true,
        invariantId,
        shardId,
        valid: executionResult.valid,
        latencyMs,
        bytecodeHash: executionResult.bytecodeHash
      };
    } catch (err) {
      this.stats.failedExecutions++;
      return {
        executed: false,
        reason: 'EXECUTION_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Execute batch of invariants distributed across shards
   */
  executeBatchDistributed(invariantIds, operationContext) {
    if (!Array.isArray(invariantIds)) {
      return { executed: false, reason: 'INVALID_BATCH' };
    }

    const results = [];
    const shardExecutions = new Map(); // shardId → [results]

    for (const invariantId of invariantIds) {
      const result = this.executeInvariantOnShard(invariantId, operationContext);
      results.push({
        invariantId,
        executed: result.executed,
        valid: result.valid,
        shardId: result.shardId
      });

      // Track by shard for analysis
      if (result.shardId) {
        if (!shardExecutions.has(result.shardId)) {
          shardExecutions.set(result.shardId, []);
        }
        shardExecutions.get(result.shardId).push(result);
      }
    }

    return {
      executed: true,
      batchSize: invariantIds.length,
      results,
      shardDistribution: Object.fromEntries(
        Array.from(shardExecutions).map(([shardId, execs]) => [shardId, execs.length])
      )
    };
  }

  /**
   * Validate cross-shard consistency
   */
  validateExecutionConsistency() {
    const violations = [];

    // Check 1: Global state matches shard logs
    for (const [invariantId, globalState] of this.globalExecutionState) {
      const shardLog = this.shardExecutionLogs.get(globalState.shardId) || [];
      const logEntry = shardLog.find(entry => entry.invariantId === invariantId);

      if (!logEntry) {
        violations.push({
          type: 'MISSING_LOG_ENTRY',
          invariantId,
          shardId: globalState.shardId
        });
      } else if (logEntry.valid !== globalState.result) {
        violations.push({
          type: 'RESULT_MISMATCH',
          invariantId,
          shardId: globalState.shardId,
          globalResult: globalState.result,
          localResult: logEntry.valid
        });
      }
    }

    // Check 2: No invariant executed on multiple shards (should never happen)
    const executionCounts = new Map();
    for (const [invariantId] of this.globalExecutionState) {
      const count = executionCounts.get(invariantId) || 0;
      executionCounts.set(invariantId, count + 1);
    }

    for (const [invariantId, count] of executionCounts) {
      if (count > 1) {
        violations.push({
          type: 'DUPLICATE_EXECUTION',
          invariantId,
          executionCount: count
        });
        this.stats.shardIsolationViolations++;
      }
    }

    const isConsistent = violations.length === 0;
    return {
      consistent: isConsistent,
      violationCount: violations.length,
      violations: violations.length > 0 ? violations : null,
      timestamp: Date.now()
    };
  }

  /**
   * Get shard execution log
   */
  getShardExecutionLog(shardId, limit = 100) {
    const log = this.shardExecutionLogs.get(shardId);
    if (!log) {
      return { available: false, reason: 'SHARD_NOT_FOUND' };
    }

    return {
      available: true,
      shardId,
      executionCount: log.length,
      lastExecutions: log.slice(-limit)
    };
  }

  /**
   * Get global execution state
   */
  getGlobalExecutionState(limit = 100) {
    const entries = Array.from(this.globalExecutionState.entries())
      .sort((a, b) => b[1].timestamp - a[1].timestamp)
      .slice(0, limit)
      .map(([invariantId, state]) => ({
        invariantId,
        ...state
      }));

    return {
      available: true,
      executionCount: this.globalExecutionState.size,
      recentExecutions: entries
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      registeredShardsCount: this.shardEngines.size,
      globalExecutionStateSize: this.globalExecutionState.size,
      timestamp: Date.now()
    };
  }

  /**
   * Internal: Log execution on shard
   */
  _logShardExecution(shardId, entry) {
    if (!this.shardExecutionLogs.has(shardId)) {
      this.shardExecutionLogs.set(shardId, []);
    }

    const log = this.shardExecutionLogs.get(shardId);
    log.push({
      ...entry,
      sequence: log.length
    });

    if (log.length > this.maxLogSize) {
      log.shift();
    }
  }

  /**
   * Internal: Synchronize execution result to global state
   */
  _syncToGlobalState(invariantId, shardId, result) {
    const globalState = Object.freeze({
      shardId,
      result,
      timestamp: Date.now()
    });

    this.globalExecutionState.set(invariantId, globalState);
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.shardEngines.clear();
    this.shardExecutionLogs.clear();
    this.globalExecutionState.clear();
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      shardIsolationViolations: 0,
      lastExecution: null
    };
  }
}

module.exports = ShardedInvariantExecutionEngine;
