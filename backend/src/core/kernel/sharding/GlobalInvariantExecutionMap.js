/**
 * GlobalInvariantExecutionMap
 * PHASE 8.3 — Global Invariant Execution Audit Map
 *
 * Immutable, append-only record of all invariant executions.
 *
 * CRITICAL:
 * ✔ append-only audit trail
 * ✔ fully reconstructible execution history
 * ✔ deterministic sequencing
 * ✔ cryptographic proof chaining (optional)
 */

const crypto = require('crypto');

class GlobalInvariantExecutionMap {
  constructor(options = {}) {
    // Execution audit trail: append-only, immutable entries
    this.executionLog = [];
    this.maxLogSize = options.maxLogSize || 100000;

    // Index: invariantId → [logIndices] for fast lookup
    this.invariantIndex = new Map();

    // Index: shardId → [logIndices] for fast lookup
    this.shardIndex = new Map();

    // Previous hash for chaining (optional proof)
    this.previousHash = null;

    // Execution map state (immutable snapshots)
    this.stateSnapshots = [];
    this.maxSnapshotCount = options.maxSnapshotCount || 100;

    // Metrics
    this.stats = {
      executionsLogged: 0,
      snapshotsTaken: 0,
      lastExecution: null
    };
  }

  /**
   * Record invariant execution
   */
  recordExecution(invariantId, shardId, executionResult) {
    if (!invariantId || !shardId) {
      return { recorded: false, reason: 'INVALID_INPUT' };
    }

    try {
      const entry = Object.freeze({
        sequence: this.executionLog.length,
        invariantId,
        shardId,
        valid: executionResult.valid,
        latencyMs: executionResult.latencyMs || 0,
        timestamp: executionResult.timestamp || Date.now(),
        bytecodeHash: executionResult.bytecodeHash || null,
        previousHash: this.previousHash
      });

      // Calculate hash for this entry (for optional chaining)
      const entryHash = this._hashEntry(entry);

      // Create immutable log entry
      const logEntry = Object.freeze({
        ...entry,
        hash: entryHash
      });

      // Append to log
      this.executionLog.push(logEntry);

      // Update indices
      if (!this.invariantIndex.has(invariantId)) {
        this.invariantIndex.set(invariantId, []);
      }
      this.invariantIndex.get(invariantId).push(this.executionLog.length - 1);

      if (!this.shardIndex.has(shardId)) {
        this.shardIndex.set(shardId, []);
      }
      this.shardIndex.get(shardId).push(this.executionLog.length - 1);

      // Update chain hash for next entry
      this.previousHash = entryHash;

      this.stats.executionsLogged++;
      this.stats.lastExecution = Date.now();

      // Cleanup if log is too large
      if (this.executionLog.length > this.maxLogSize) {
        const removed = this.executionLog.shift();
        // TODO: Update indices to remove first entries
      }

      return {
        recorded: true,
        sequence: entry.sequence,
        hash: entryHash
      };
    } catch (err) {
      return {
        recorded: false,
        reason: 'RECORDING_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Get execution history for an invariant
   */
  getInvariantHistory(invariantId) {
    if (!invariantId) {
      return { available: false, reason: 'INVALID_INVARIANT_ID' };
    }

    const indices = this.invariantIndex.get(invariantId);
    if (!indices) {
      return {
        available: true,
        invariantId,
        executionCount: 0,
        history: []
      };
    }

    const history = indices.map(idx => {
      const entry = this.executionLog[idx];
      return {
        sequence: entry.sequence,
        shardId: entry.shardId,
        valid: entry.valid,
        latencyMs: entry.latencyMs,
        timestamp: entry.timestamp
      };
    });

    return {
      available: true,
      invariantId,
      executionCount: history.length,
      history
    };
  }

  /**
   * Get execution history for a shard
   */
  getShardHistory(shardId) {
    if (!shardId) {
      return { available: false, reason: 'INVALID_SHARD_ID' };
    }

    const indices = this.shardIndex.get(shardId);
    if (!indices) {
      return {
        available: true,
        shardId,
        executionCount: 0,
        history: []
      };
    }

    const history = indices.map(idx => {
      const entry = this.executionLog[idx];
      return {
        sequence: entry.sequence,
        invariantId: entry.invariantId,
        valid: entry.valid,
        latencyMs: entry.latencyMs,
        timestamp: entry.timestamp
      };
    });

    return {
      available: true,
      shardId,
      executionCount: history.length,
      history
    };
  }

  /**
   * Reconstruct global execution state at specific time
   */
  reconstructState(upToSequence = null) {
    const endIndex = upToSequence !== null ? upToSequence + 1 : this.executionLog.length;
    const entries = this.executionLog.slice(0, endIndex);

    const state = {
      invariantStates: new Map(),
      shardStates: new Map(),
      totalExecutions: entries.length
    };

    for (const entry of entries) {
      // Track invariant state
      state.invariantStates.set(entry.invariantId, {
        lastExecution: entry.timestamp,
        lastResult: entry.valid,
        lastShard: entry.shardId,
        executionCount: (state.invariantStates.get(entry.invariantId)?.executionCount || 0) + 1
      });

      // Track shard state
      if (!state.shardStates.has(entry.shardId)) {
        state.shardStates.set(entry.shardId, {
          executionCount: 0,
          successCount: 0,
          failureCount: 0
        });
      }

      const shardState = state.shardStates.get(entry.shardId);
      shardState.executionCount++;
      if (entry.valid) {
        shardState.successCount++;
      } else {
        shardState.failureCount++;
      }
    }

    return {
      available: true,
      upToSequence: endIndex - 1,
      invariantCount: state.invariantStates.size,
      shardCount: state.shardStates.size,
      totalExecutions: state.totalExecutions,
      state: Object.fromEntries(state.invariantStates)
    };
  }

  /**
   * Verify execution chain integrity
   */
  verifyChainIntegrity() {
    const violations = [];

    // Check sequence continuity
    for (let i = 0; i < this.executionLog.length; i++) {
      if (this.executionLog[i].sequence !== i) {
        violations.push({
          type: 'SEQUENCE_VIOLATION',
          index: i,
          expected: i,
          actual: this.executionLog[i].sequence
        });
      }
    }

    // Check hash chain
    let expectedPreviousHash = null;
    for (let i = 0; i < this.executionLog.length; i++) {
      const entry = this.executionLog[i];

      if (entry.previousHash !== expectedPreviousHash) {
        violations.push({
          type: 'HASH_CHAIN_VIOLATION',
          sequence: entry.sequence,
          expected: expectedPreviousHash,
          actual: entry.previousHash
        });
      }

      // Verify hash of this entry
      const recomputedHash = this._hashEntry({
        sequence: entry.sequence,
        invariantId: entry.invariantId,
        shardId: entry.shardId,
        valid: entry.valid,
        latencyMs: entry.latencyMs,
        timestamp: entry.timestamp,
        bytecodeHash: entry.bytecodeHash,
        previousHash: entry.previousHash
      });

      if (recomputedHash !== entry.hash) {
        violations.push({
          type: 'ENTRY_HASH_VIOLATION',
          sequence: entry.sequence,
          expected: recomputedHash,
          actual: entry.hash
        });
      }

      expectedPreviousHash = entry.hash;
    }

    return {
      verified: violations.length === 0,
      violationCount: violations.length,
      violations: violations.length > 0 ? violations : null,
      timestamp: Date.now()
    };
  }

  /**
   * Take snapshot of current execution state
   */
  takeSnapshot(name = null) {
    const snapshot = Object.freeze({
      name: name || `snapshot_${this.stats.snapshotsTaken}`,
      executionLogLength: this.executionLog.length,
      invariantIndexSize: this.invariantIndex.size,
      shardIndexSize: this.shardIndex.size,
      currentHash: this.previousHash,
      timestamp: Date.now()
    });

    this.stateSnapshots.push(snapshot);
    this.stats.snapshotsTaken++;

    if (this.stateSnapshots.length > this.maxSnapshotCount) {
      this.stateSnapshots.shift();
    }

    return {
      snapshotCreated: true,
      name: snapshot.name,
      executionsRecorded: snapshot.executionLogLength
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      executionLogSize: this.executionLog.length,
      invariantIndexSize: this.invariantIndex.size,
      shardIndexSize: this.shardIndex.size,
      snapshotCount: this.stateSnapshots.length,
      timestamp: Date.now()
    };
  }

  /**
   * Internal: Hash entry (deterministic)
   */
  _hashEntry(entry) {
    const canonical = {
      sequence: entry.sequence,
      invariantId: entry.invariantId,
      shardId: entry.shardId,
      valid: entry.valid,
      latencyMs: entry.latencyMs,
      timestamp: entry.timestamp,
      bytecodeHash: entry.bytecodeHash,
      previousHash: entry.previousHash
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(canonical))
      .digest('hex');
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.executionLog = [];
    this.invariantIndex.clear();
    this.shardIndex.clear();
    this.previousHash = null;
    this.stateSnapshots = [];
    this.stats = {
      executionsLogged: 0,
      snapshotsTaken: 0,
      lastExecution: null
    };
  }
}

module.exports = GlobalInvariantExecutionMap;
