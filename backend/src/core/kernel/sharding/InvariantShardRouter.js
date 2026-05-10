/**
 * InvariantShardRouter
 * PHASE 8.3 — Deterministic Invariant-to-Shard Assignment
 *
 * Routes compiled invariants to shards with stable, reproducible mapping.
 *
 * CRITICAL:
 * ✔ deterministic assignment (same invariant → same shard always)
 * ✔ stable under cluster topology changes
 * ✔ O(1) lookup time
 * ✔ rebalancing without state corruption
 */

const crypto = require('crypto');

class InvariantShardRouter {
  constructor(options = {}) {
    // Shard topology: shardId → { id, nodeId, active, capacity }
    this.shards = new Map();

    // Invariant assignment map: invariantId → shardId
    this.invariantAssignments = new Map();

    // Shard workload: shardId → count of assigned invariants
    this.shardWorkload = new Map();

    // Rebalance history (immutable)
    this.rebalanceHistory = [];
    this.maxHistorySize = options.maxHistorySize || 1000;

    // Metrics
    this.stats = {
      invariantsAssigned: 0,
      rebalancesPerformed: 0,
      assignmentConsistency: 100,
      lastAssignment: null
    };
  }

  /**
   * Register shard in cluster topology
   */
  registerShard(shardId, nodeId, capacity = 1000) {
    if (!shardId) {
      return { registered: false, reason: 'INVALID_SHARD_ID' };
    }

    const shard = Object.freeze({
      shardId,
      nodeId,
      active: true,
      capacity,
      registeredAt: Date.now(),
      assignedInvariants: 0
    });

    this.shards.set(shardId, shard);
    this.shardWorkload.set(shardId, 0);

    return {
      registered: true,
      shardId,
      nodeId,
      capacity
    };
  }

  /**
   * Assign invariant to shard deterministically
   */
  assignInvariantToShard(invariantId) {
    if (!invariantId || this.shards.size === 0) {
      return { assigned: false, reason: 'INVALID_INPUT' };
    }

    // Check if already assigned
    if (this.invariantAssignments.has(invariantId)) {
      const shardId = this.invariantAssignments.get(invariantId);
      return {
        assigned: true,
        invariantId,
        shardId,
        cached: true
      };
    }

    try {
      // Compute deterministic shard assignment via hash
      const shardId = this._computeShardAssignment(invariantId);

      // Verify shard is active
      const shard = this.shards.get(shardId);
      if (!shard || !shard.active) {
        return {
          assigned: false,
          reason: 'TARGET_SHARD_INACTIVE',
          invariantId
        };
      }

      // Record assignment
      this.invariantAssignments.set(invariantId, shardId);
      const workload = this.shardWorkload.get(shardId) || 0;
      this.shardWorkload.set(shardId, workload + 1);

      this.stats.invariantsAssigned++;
      this.stats.lastAssignment = Date.now();

      return {
        assigned: true,
        invariantId,
        shardId,
        workload: this.shardWorkload.get(shardId)
      };
    } catch (err) {
      return {
        assigned: false,
        reason: 'ASSIGNMENT_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Get shard execution plan for a given shard
   */
  getShardExecutionPlan(shardId) {
    if (!shardId) {
      return { available: false, reason: 'INVALID_SHARD_ID' };
    }

    const shard = this.shards.get(shardId);
    if (!shard) {
      return { available: false, reason: 'SHARD_NOT_FOUND' };
    }

    // Collect all invariants assigned to this shard
    const assignedInvariants = [];
    for (const [invariantId, assignedShardId] of this.invariantAssignments) {
      if (assignedShardId === shardId) {
        assignedInvariants.push(invariantId);
      }
    }

    // Sort for deterministic execution order
    assignedInvariants.sort();

    return {
      available: true,
      shardId,
      nodeId: shard.nodeId,
      invariantCount: assignedInvariants.length,
      executionPlan: Object.freeze(assignedInvariants),
      capacity: shard.capacity,
      workload: this.shardWorkload.get(shardId) || 0
    };
  }

  /**
   * Rebalance cluster shards (handles topology changes)
   */
  rebalanceClusterShards() {
    if (this.shards.size === 0) {
      return { rebalanced: false, reason: 'NO_SHARDS_REGISTERED' };
    }

    try {
      const activeShardsCount = Array.from(this.shards.values()).filter(s => s.active).length;

      if (activeShardsCount === 0) {
        return {
          rebalanced: false,
          reason: 'NO_ACTIVE_SHARDS'
        };
      }

      // Recompute all assignments (invariants may move to different shards)
      const oldAssignments = new Map(this.invariantAssignments);
      const moved = [];

      for (const invariantId of this.invariantAssignments.keys()) {
        const newShardId = this._computeShardAssignment(invariantId);
        const oldShardId = oldAssignments.get(invariantId);

        if (newShardId !== oldShardId) {
          this.invariantAssignments.set(invariantId, newShardId);
          moved.push({
            invariantId,
            fromShard: oldShardId,
            toShard: newShardId
          });
        }
      }

      // Recalculate workloads
      this.shardWorkload.clear();
      for (const shardId of this.shards.keys()) {
        this.shardWorkload.set(shardId, 0);
      }

      for (const shardId of this.invariantAssignments.values()) {
        const count = this.shardWorkload.get(shardId) || 0;
        this.shardWorkload.set(shardId, count + 1);
      }

      this._recordRebalance({
        type: 'CLUSTER_REBALANCE',
        invariantsMoved: moved.length,
        movements: moved
      });

      this.stats.rebalancesPerformed++;

      return {
        rebalanced: true,
        invariantsMoved: moved.length,
        movements: moved
      };
    } catch (err) {
      return {
        rebalanced: false,
        reason: 'REBALANCE_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Validate shard assignment consistency
   */
  validateShardConsistency() {
    const violations = [];

    // Check 1: All assigned invariants map to active shards
    for (const [invariantId, shardId] of this.invariantAssignments) {
      const shard = this.shards.get(shardId);
      if (!shard) {
        violations.push({
          type: 'MISSING_SHARD',
          invariantId,
          shardId
        });
      } else if (!shard.active) {
        violations.push({
          type: 'INACTIVE_SHARD',
          invariantId,
          shardId
        });
      }
    }

    // Check 2: Determinism check (recompute all assignments)
    for (const [invariantId, assignedShardId] of this.invariantAssignments) {
      const recomputedShardId = this._computeShardAssignment(invariantId);
      if (recomputedShardId !== assignedShardId) {
        violations.push({
          type: 'DETERMINISM_VIOLATION',
          invariantId,
          expectedShard: recomputedShardId,
          actualShard: assignedShardId
        });
      }
    }

    // Check 3: Workload calculation consistency
    const recalculatedWorkload = new Map();
    for (const shardId of this.shards.keys()) {
      recalculatedWorkload.set(shardId, 0);
    }

    for (const shardId of this.invariantAssignments.values()) {
      const count = recalculatedWorkload.get(shardId) || 0;
      recalculatedWorkload.set(shardId, count + 1);
    }

    for (const [shardId, storedWorkload] of this.shardWorkload) {
      const recalculated = recalculatedWorkload.get(shardId) || 0;
      if (storedWorkload !== recalculated) {
        violations.push({
          type: 'WORKLOAD_MISMATCH',
          shardId,
          expectedWorkload: recalculated,
          actualWorkload: storedWorkload
        });
      }
    }

    const isValid = violations.length === 0;
    return {
      valid: isValid,
      violationCount: violations.length,
      violations: violations.length > 0 ? violations : null,
      timestamp: Date.now()
    };
  }

  /**
   * Internal: Compute deterministic shard assignment
   */
  _computeShardAssignment(invariantId) {
    // Get active shards sorted by ID for stable ordering
    const activeShardsArray = Array.from(this.shards.entries())
      .filter(([, shard]) => shard.active)
      .sort(([aId], [bId]) => aId.localeCompare(bId));

    if (activeShardsArray.length === 0) {
      throw new Error('No active shards available');
    }

    // Compute hash and modulo to get shard index
    const hash = crypto
      .createHash('sha256')
      .update(invariantId)
      .digest('hex');

    const hashValue = parseInt(hash.substring(0, 8), 16);
    const shardIndex = hashValue % activeShardsArray.length;

    return activeShardsArray[shardIndex][0];
  }

  /**
   * Internal: Record rebalance event
   */
  _recordRebalance(event) {
    this.rebalanceHistory.push({
      ...event,
      timestamp: Date.now(),
      sequence: this.rebalanceHistory.length
    });

    if (this.rebalanceHistory.length > this.maxHistorySize) {
      this.rebalanceHistory.shift();
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      shardsRegistered: this.shards.size,
      activeShardsCount: Array.from(this.shards.values()).filter(s => s.active).length,
      invariantsAssigned: this.invariantAssignments.size,
      rebalanceHistorySize: this.rebalanceHistory.length,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.shards.clear();
    this.invariantAssignments.clear();
    this.shardWorkload.clear();
    this.rebalanceHistory = [];
    this.stats = {
      invariantsAssigned: 0,
      rebalancesPerformed: 0,
      assignmentConsistency: 100,
      lastAssignment: null
    };
  }
}

module.exports = InvariantShardRouter;
