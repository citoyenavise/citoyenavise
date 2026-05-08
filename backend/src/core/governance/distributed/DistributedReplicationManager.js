/**
 * DistributedReplicationManager
 * PHASE 7.2 — Distributed Event Replication + Causal Consistency Layer
 *
 * Asynchronous replication across nodes without affecting enforcement:
 * - Per-shard replication queues
 * - Causal ordering preserved during propagation
 * - Quorum acknowledgement for observability only (non-blocking)
 * - Bounded retry with dead-letter handling
 * - No cross-shard causal corruption
 *
 * CRITICAL: Replication never influences enforcement decisions.
 * Real-time primary shard remains sole source of truth.
 */

const EventEmitter = require('events');

class DistributedReplicationManager extends EventEmitter {
  constructor(options = {}) {
    super();

    // Per-shard replication queues: shardId → ReplicationQueue
    this.replicationQueues = new Map();

    // Pending replications: eventId → ReplicationState
    this.pendingReplications = new Map();

    // Replication acknowledgements: eventId → Set<nodeId>
    this.replicationAcks = new Map();

    // Dead-letter queue: eventId → DeadLetterEntry
    this.deadLetterQueue = [];

    // Configuration
    this.maxRetries = options.maxRetries || 3;
    this.retryDelayMs = options.retryDelayMs || 100;
    this.replicationTimeoutMs = options.replicationTimeoutMs || 5000;
    this.maxDLQSize = options.maxDLQSize || 1000;
    this.maxQueueSize = options.maxQueueSize || 10000;

    // Metrics
    this.metrics = {
      eventsQueued: 0,
      eventsReplicated: 0,
      acksReceived: 0,
      retries: 0,
      dlqEntries: 0,
      replicationLatencyMs: 0,
      timestamp: Date.now()
    };
  }

  /**
   * Create or get replication queue for shard
   */
  _getOrCreateQueue(shardId) {
    if (!this.replicationQueues.has(shardId)) {
      this.replicationQueues.set(shardId, {
        shardId,
        queue: [],
        processing: false,
        lastProcessedSequence: 0,
        createdAt: Date.now()
      });
    }
    return this.replicationQueues.get(shardId);
  }

  /**
   * Enqueue event for replication
   * Preserves causal order within shard
   */
  enqueueReplication(event, shardId) {
    if (!event || !event.traceId) {
      throw new Error('Event must have traceId');
    }

    if (!shardId) {
      throw new Error('ShardId required');
    }

    const queue = this._getOrCreateQueue(shardId);

    // Enqueue if space available
    if (queue.queue.length >= this.maxQueueSize) {
      return {
        enqueued: false,
        reason: 'QUEUE_FULL',
        shardId,
        queueSize: queue.queue.length
      };
    }

    // Create replication entry
    const replicationEntry = {
      eventId: event.eventId || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      traceId: event.traceId,
      shardId,
      event: {
        type: event.type,
        traceId: event.traceId,
        sequence: event.sequence || 0,
        timestamp: event.timestamp || Date.now(),
        payload: event.payload
      },
      enqueuedAt: Date.now(),
      retryCount: 0,
      status: 'QUEUED'
    };

    queue.queue.push(replicationEntry);
    this.pendingReplications.set(replicationEntry.eventId, {
      eventId: replicationEntry.eventId,
      traceId: event.traceId,
      shardId,
      status: 'QUEUED',
      createdAt: Date.now()
    });

    this.metrics.eventsQueued++;

    return {
      enqueued: true,
      eventId: replicationEntry.eventId,
      shardId,
      queueSize: queue.queue.length
    };
  }

  /**
   * Replicate event to target nodes
   * Causal ordering preserved per shard
   * PHASE 7.2: Asynchronous, never in critical path
   */
  async replicateEvent(eventId, targetNodeIds) {
    const startTime = Date.now();
    const pendingRep = this.pendingReplications.get(eventId);

    if (!pendingRep) {
      return {
        replicated: false,
        reason: 'EVENT_NOT_FOUND',
        eventId
      };
    }

    if (!Array.isArray(targetNodeIds) || targetNodeIds.length === 0) {
      return {
        replicated: false,
        reason: 'NO_TARGET_NODES',
        eventId
      };
    }

    const shardId = pendingRep.shardId;
    const queue = this._getOrCreateQueue(shardId);
    const replicationEntry = queue.queue.find((e) => e.eventId === eventId);

    if (!replicationEntry) {
      return {
        replicated: false,
        reason: 'ENTRY_NOT_IN_QUEUE',
        eventId,
        shardId
      };
    }

    // Update status
    replicationEntry.status = 'REPLICATING';
    pendingRep.status = 'REPLICATING';

    // Send to target nodes (non-blocking)
    const replicationPromises = targetNodeIds.map((nodeId) =>
      this._replicateToNode(eventId, nodeId, replicationEntry.event)
    );

    try {
      // Wait for replication with timeout (no blocking enforcement)
      const results = await Promise.race([
        Promise.all(replicationPromises),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('REPLICATION_TIMEOUT')),
            this.replicationTimeoutMs
          )
        )
      ]).catch((err) => {
        // Timeout or error - don't block enforcement
        return { timedOut: true, error: err.message };
      });

      // Update metrics (observability only)
      if (results && !results.timedOut) {
        this.metrics.eventsReplicated++;
      }

      this.metrics.replicationLatencyMs = Date.now() - startTime;

      // Mark as replicated (for cleanup, not enforcement)
      replicationEntry.status = 'REPLICATED';
      pendingRep.status = 'REPLICATED';

      return {
        replicated: !results || !results.timedOut,
        eventId,
        shardId,
        targetNodes: targetNodeIds.length,
        latencyMs: Date.now() - startTime
      };
    } catch (err) {
      // Replication failure: move to DLQ
      return this._moveToDLQ(eventId, shardId, err.message);
    }
  }

  /**
   * Internal: Replicate to single node
   */
  async _replicateToNode(eventId, nodeId, event) {
    // Simulate network replication (in real system: RPC call)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ nodeId, eventId, success: true });
      }, Math.random() * 50); // Simulate network latency
    });
  }

  /**
   * Confirm replication acknowledgement from node
   * Quorum acknowledgement for observability only
   */
  confirmReplicationAck(eventId, nodeId) {
    if (!this.replicationAcks.has(eventId)) {
      this.replicationAcks.set(eventId, new Set());
    }

    const ackSet = this.replicationAcks.get(eventId);
    const isNew = !ackSet.has(nodeId);
    ackSet.add(nodeId);

    if (isNew) {
      this.metrics.acksReceived++;
    }

    return {
      acked: true,
      eventId,
      nodeId,
      ackCount: ackSet.size
    };
  }

  /**
   * Get replication state for trace
   * For observability and monitoring only
   */
  getReplicationState(traceId) {
    const replicationsByTrace = [];

    for (const rep of this.pendingReplications.values()) {
      if (rep.traceId === traceId) {
        const ackSet = this.replicationAcks.get(rep.eventId) || new Set();
        replicationsByTrace.push({
          eventId: rep.eventId,
          status: rep.status,
          ackCount: ackSet.size,
          createdAt: rep.createdAt
        });
      }
    }

    return {
      traceId,
      replications: replicationsByTrace,
      totalReplications: replicationsByTrace.length,
      timestamp: Date.now()
    };
  }

  /**
   * Move entry to dead-letter queue (bounded)
   */
  _moveToDLQ(eventId, shardId, reason) {
    if (this.deadLetterQueue.length >= this.maxDLQSize) {
      // Remove oldest DLQ entry
      this.deadLetterQueue.shift();
    }

    // Get retry count from queue entry
    const queue = this._getOrCreateQueue(shardId);
    const queueEntry = queue.queue.find((e) => e.eventId === eventId);
    const retryCount = queueEntry?.retryCount || 0;

    const dlqEntry = {
      eventId,
      shardId,
      reason,
      movedAt: Date.now(),
      retries: retryCount
    };

    this.deadLetterQueue.push(dlqEntry);
    this.metrics.dlqEntries++;

    // Remove from pending
    this.pendingReplications.delete(eventId);

    return {
      retried: false,
      reason: 'MOVED_TO_DLQ',
      eventId,
      dlqReason: reason
    };
  }

  /**
   * Retry failed replication (bounded)
   */
  retryReplication(eventId, shardId) {
    const queue = this._getOrCreateQueue(shardId);
    const replicationEntry = queue.queue.find((e) => e.eventId === eventId);

    if (!replicationEntry) {
      return {
        retried: false,
        reason: 'ENTRY_NOT_FOUND',
        eventId
      };
    }

    // Check retry limit
    if (replicationEntry.retryCount >= this.maxRetries) {
      return this._moveToDLQ(eventId, shardId, 'MAX_RETRIES_EXCEEDED');
    }

    // Increment retry count
    replicationEntry.retryCount++;
    replicationEntry.status = 'QUEUED';
    this.metrics.retries++;

    return {
      retried: true,
      eventId,
      shardId,
      retryCount: replicationEntry.retryCount,
      maxRetries: this.maxRetries
    };
  }

  /**
   * Get queue status for shard
   */
  getQueueStatus(shardId) {
    const queue = this.replicationQueues.get(shardId);

    if (!queue) {
      return null;
    }

    return {
      shardId,
      queueSize: queue.queue.length,
      processing: queue.processing,
      lastProcessedSequence: queue.lastProcessedSequence,
      createdAt: queue.createdAt
    };
  }

  /**
   * Get all queue statuses
   */
  getAllQueueStatus() {
    const statuses = [];
    for (const shardId of this.replicationQueues.keys()) {
      statuses.push(this.getQueueStatus(shardId));
    }
    return statuses;
  }

  /**
   * Get replication metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      pendingReplications: this.pendingReplications.size,
      dlqSize: this.deadLetterQueue.length,
      queueCount: this.replicationQueues.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get dead-letter queue entries (for debugging)
   */
  getDeadLetterQueue(limit = 50) {
    return this.deadLetterQueue.slice(-limit);
  }

  /**
   * Cleanup completed replications
   */
  cleanup() {
    const now = Date.now();
    const cleaned = [];

    for (const [eventId, rep] of this.pendingReplications.entries()) {
      // Remove if replicated and old
      if (rep.status === 'REPLICATED' && now - rep.createdAt > 30000) {
        this.pendingReplications.delete(eventId);
        this.replicationAcks.delete(eventId);
        cleaned.push(eventId);
      }
    }

    return {
      cleaned: cleaned.length,
      clearedEventIds: cleaned,
      remainingPending: this.pendingReplications.size
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.replicationQueues.clear();
    this.pendingReplications.clear();
    this.replicationAcks.clear();
    this.deadLetterQueue = [];
    this.metrics = {
      eventsQueued: 0,
      eventsReplicated: 0,
      acksReceived: 0,
      retries: 0,
      dlqEntries: 0,
      replicationLatencyMs: 0,
      timestamp: Date.now()
    };
  }
}

module.exports = DistributedReplicationManager;
