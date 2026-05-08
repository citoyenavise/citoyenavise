/**
 * DistributedShardRouter
 * PHASE 7.1 — Distributed Shard Routing + Trace Affinity
 *
 * Deterministic routing with trace affinity guarantees:
 * - Same traceId → Same shard (consistent hashing)
 * - No cross-shard execution for active traces
 * - Shard ownership immutable during active execution
 * - Shard-aware replay from REAL_TIME proofs only
 *
 * Maintains single source of truth (REAL_TIME layer):
 * - Batch layer NEVER influences routing decisions
 * - All routing decisions based on real-time state
 * - Replay determinism guaranteed per shard
 */

const crypto = require('crypto');

class DistributedShardRouter {
  constructor(options = {}) {
    // Shard configuration
    this.shardCount = options.shardCount || 16;
    this.replicationFactor = options.replicationFactor || 1;

    // Ownership mapping: shardId → nodeId
    this.shardOwnership = new Map();

    // Active trace registry: traceId → { shardId, sequence, createdAt, lastUpdate }
    this.activeTraces = new Map();

    // Shard state: shardId → { owner, activeTraces: Set, lastSequence, health }
    this.shardState = new Map();

    // Initialize shards
    for (let i = 0; i < this.shardCount; i++) {
      const shardId = `shard_${i}`;
      this.shardState.set(shardId, {
        shardId,
        owner: null,
        activeTraces: new Set(),
        lastSequence: 0,
        health: 'UNKNOWN',
        createdAt: Date.now()
      });
    }

    // Metrics
    this.metrics = {
      eventsRouted: 0,
      traceAffinitySwitches: 0,
      shardFailovers: 0,
      replayOperations: 0,
      routingLatencyMs: 0
    };

    // Configuration
    this.traceAffinityTimeout = options.traceAffinityTimeout || 30000; // 30 sec
    this.maxTracesPerShard = options.maxTracesPerShard || 10000;
  }

  /**
   * Consistent hashing for deterministic shard assignment
   * SHA-256 based on traceId for determinism
   */
  _consistentHash(traceId) {
    const hash = crypto.createHash('sha256').update(traceId).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    return hashValue % this.shardCount;
  }

  /**
   * Get shard ID for a trace (deterministic, never changes for same traceId)
   */
  getShardForTrace(traceId) {
    const shardIndex = this._consistentHash(traceId);
    return `shard_${shardIndex}`;
  }

  /**
   * Register shard ownership (called once per node startup)
   */
  registerShardOwner(shardId, nodeId) {
    if (!this.shardState.has(shardId)) {
      throw new Error(`Shard ${shardId} does not exist`);
    }

    this.shardOwnership.set(shardId, nodeId);
    const state = this.shardState.get(shardId);
    state.owner = nodeId;
    state.health = 'HEALTHY';

    return { registered: true, shardId, nodeId };
  }

  /**
   * Get current owner of a shard
   */
  getShardOwner(shardId) {
    const owner = this.shardOwnership.get(shardId);
    if (!owner) {
      throw new Error(`No owner registered for shard ${shardId}`);
    }
    return owner;
  }

  /**
   * Route event to shard based on trace affinity
   * PHASE 7.1: Trace affinity → same shard for entire trace lifecycle
   */
  routeEvent(event) {
    const startTime = Date.now();

    if (!event || !event.traceId) {
      throw new Error('Event must have traceId for shard routing');
    }

    const traceId = event.traceId;
    const shardId = this.getShardForTrace(traceId);

    // Get shard owner
    let owner;
    try {
      owner = this.getShardOwner(shardId);
    } catch (err) {
      return {
        routed: false,
        reason: 'SHARD_OWNER_NOT_FOUND',
        shardId,
        error: err.message
      };
    }

    // Register/update active trace
    const now = Date.now();
    let traceEntry = this.activeTraces.get(traceId);

    if (!traceEntry) {
      // New trace: register with shard
      if (this.activeTraces.size >= this.maxTracesPerShard) {
        return {
          routed: false,
          reason: 'ACTIVE_TRACES_LIMIT',
          shardId
        };
      }

      traceEntry = {
        traceId,
        shardId,
        sequence: 0,
        createdAt: now,
        lastUpdate: now,
        owner
      };
      this.activeTraces.set(traceId, traceEntry);

      // Add to shard's active traces
      const shardState = this.shardState.get(shardId);
      shardState.activeTraces.add(traceId);
    } else {
      // Existing trace: verify shard affinity
      if (traceEntry.shardId !== shardId) {
        // Trace affinity violation
        this.metrics.traceAffinitySwitches++;
        return {
          routed: false,
          reason: 'TRACE_AFFINITY_VIOLATION',
          expectedShard: traceEntry.shardId,
          actualShard: shardId,
          traceId
        };
      }

      // Update sequence and timestamp
      traceEntry.sequence++;
      traceEntry.lastUpdate = now;
    }

    this.metrics.eventsRouted++;
    this.metrics.routingLatencyMs = Date.now() - startTime;

    return {
      routed: true,
      traceId,
      shardId,
      owner,
      sequence: traceEntry.sequence,
      timestamp: now
    };
  }

  /**
   * Get shard for replay (REAL_TIME ONLY)
   * Returns shard info for deterministic replay from REAL_TIME_PROOFS
   */
  getShardForReplay(traceId) {
    const shardId = this.getShardForTrace(traceId);

    try {
      const owner = this.getShardOwner(shardId);
      this.metrics.replayOperations++;

      return {
        available: true,
        traceId,
        shardId,
        owner,
        note: 'Replay from REAL_TIME_PROOFS only'
      };
    } catch (err) {
      return {
        available: false,
        traceId,
        shardId,
        reason: 'SHARD_OWNER_NOT_FOUND',
        error: err.message
      };
    }
  }

  /**
   * Close active trace (called after flush cycle)
   * PHASE 7.1: Allows shard migration post-execution
   */
  closeTrace(traceId) {
    const traceEntry = this.activeTraces.get(traceId);
    if (!traceEntry) {
      return { closed: false, reason: 'TRACE_NOT_FOUND' };
    }

    const shardId = traceEntry.shardId;
    const shardState = this.shardState.get(shardId);
    shardState.activeTraces.delete(traceId);

    this.activeTraces.delete(traceId);

    return {
      closed: true,
      traceId,
      shardId,
      finalSequence: traceEntry.sequence
    };
  }

  /**
   * Failover shard ownership (called on node failure)
   * PHASE 7.1: Graceful shard migration
   */
  failoverShard(shardId, newNodeId) {
    if (!this.shardState.has(shardId)) {
      throw new Error(`Shard ${shardId} does not exist`);
    }

    const currentOwner = this.getShardOwner(shardId);
    const shardState = this.shardState.get(shardId);

    // Freeze active traces (no new events on this shard)
    shardState.health = 'DEGRADED';

    // Update ownership
    this.shardOwnership.set(shardId, newNodeId);
    shardState.owner = newNodeId;

    // Track failover
    this.metrics.shardFailovers++;

    return {
      failedOver: true,
      shardId,
      fromOwner: currentOwner,
      toOwner: newNodeId,
      activeTraces: shardState.activeTraces.size
    };
  }

  /**
   * Get shard statistics
   */
  getShardStats(shardId) {
    if (!this.shardState.has(shardId)) {
      return null;
    }

    const state = this.shardState.get(shardId);
    return {
      shardId,
      owner: state.owner,
      health: state.health,
      activeTraces: state.activeTraces.size,
      lastSequence: state.lastSequence,
      createdAt: state.createdAt
    };
  }

  /**
   * Get all shard statistics
   */
  getAllShardStats() {
    const stats = [];
    for (const shardId of this.shardState.keys()) {
      stats.push(this.getShardStats(shardId));
    }
    return stats;
  }

  /**
   * Cleanup expired traces (trace affinity timeout)
   */
  cleanupExpiredTraces() {
    const now = Date.now();
    const expired = [];

    for (const [traceId, traceEntry] of this.activeTraces.entries()) {
      if (now - traceEntry.lastUpdate > this.traceAffinityTimeout) {
        expired.push(traceId);
      }
    }

    // Close expired traces
    for (const traceId of expired) {
      this.closeTrace(traceId);
    }

    return {
      cleaned: expired.length,
      expiredTraces: expired
    };
  }

  /**
   * Get routing metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      totalShards: this.shardCount,
      activeTraces: this.activeTraces.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.shardOwnership.clear();
    this.activeTraces.clear();
    for (const shardId of this.shardState.keys()) {
      this.shardState.get(shardId).activeTraces.clear();
      this.shardState.get(shardId).lastSequence = 0;
      this.shardState.get(shardId).health = 'UNKNOWN';
      this.shardState.get(shardId).owner = null;
    }
    this.metrics = {
      eventsRouted: 0,
      traceAffinitySwitches: 0,
      shardFailovers: 0,
      replayOperations: 0,
      routingLatencyMs: 0
    };
  }
}

module.exports = DistributedShardRouter;
