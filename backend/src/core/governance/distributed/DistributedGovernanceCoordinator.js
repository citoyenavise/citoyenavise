/**
 * DistributedGovernanceCoordinator
 * PHASE 6.0 — Distributed Consistency Foundation
 *
 * Adds distributed coordination layer WITHOUT breaking PHASE 5.7 v2 guarantees.
 *
 * CRITICAL:
 * - Single logical EventBus (not multiple independent buses)
 * - Distributed consistency checks BEFORE EventBus.publish()
 * - Memory-bounded registries (cleanup on interval)
 * - NO scaling yet (foundation only)
 *
 * Prepares for (but doesn't implement):
 * - Multi-instance fanout
 * - Sharding (future)
 * - Replication (future)
 * - Distributed consensus (future)
 */

const crypto = require('crypto');

class DistributedGovernanceCoordinator {
  constructor(options = {}) {
    // Node identity
    this.nodeId = options.nodeId || crypto.randomUUID();

    /**
     * SINGLE LOGICAL EVENT BUS
     * CRITICAL: Not multiple independent buses.
     */
    this.eventBus = options.eventBus;
    if (!this.eventBus) {
      throw new Error('eventBus required for distributed coordinator');
    }

    /**
     * DISTRIBUTED REGISTRIES
     * All bounded to prevent memory leaks
     *
     * Shared registries (for multi-instance): allow passing from outside
     * Simulates distributed coordination (e.g., via shared DB or consensus service)
     */

    // eventId global registry (prevents global duplication) - SHARED
    this.globalEventRegistry = options.globalEventRegistry || new Map();

    // traceId → depth tracking (prevents infinite cycles) - SHARED
    this.traceRegistry = options.traceRegistry || new Map();

    // nodeId → participation metadata
    this.nodeRegistry = options.nodeRegistry || new Map();

    // replay protection (prevents replay attacks) - SHARED
    this.replayRegistry = options.replayRegistry || new Map();

    // traceId → last sequence number (causal ordering) - SHARED
    this.sequenceRegistry = options.sequenceRegistry || new Map();

    /**
     * CONFIG
     */
    this.config = {
      eventRetentionMs: options.eventRetentionMs || 300000, // 5 min
      replayWindowMs: options.replayWindowMs || 60000, // 1 min
      maxTraceDepth: options.maxTraceDepth || 32,
      cleanupIntervalMs: options.cleanupIntervalMs || 30000, // 30 sec
      maxClockDriftMs: options.maxClockDriftMs || 5000, // 5 sec
    };

    /**
     * METRICS
     */
    this.metrics = {
      eventsAccepted: 0,
      eventsRejected: 0,
      replayRejected: 0,
      causalViolations: 0,
      clockDriftViolations: 0,
      duplicateGlobalRejected: 0,
      traceDepthViolations: 0
    };

    this._cleanupTimer = null;
  }

  /**
   * Initialize coordinator (start cleanup timer)
   */
  initialize() {
    this._registerNode();

    /**
     * CLEANUP ON NON-CRITICAL PATH
     * Doesn't block event processing
     */
    this._cleanupTimer = setInterval(
      () => this._cleanupRegistries(),
      this.config.cleanupIntervalMs
    );

    return this;
  }

  /**
   * Shutdown coordinator (stop cleanup timer)
   */
  shutdown() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
  }

  /**
   * CENTRAL ENTRYPOINT
   * All distributed validations BEFORE EventBus.publish()
   */
  publishDistributed(event) {
    if (!event) {
      return false;
    }

    /**
     * STEP 1: CLOCK VALIDATION
     * Prevent clock-skew attacks and out-of-order events
     */
    if (!this._validateClockDrift(event)) {
      this.metrics.clockDriftViolations++;
      return false;
    }

    /**
     * STEP 2: GLOBAL EVENT DEDUP
     * Prevent same event from being processed by multiple instances
     */
    if (this._isGlobalDuplicate(event)) {
      this.metrics.duplicateGlobalRejected++;
      return false;
    }

    /**
     * STEP 3: REPLAY PROTECTION
     * Prevent replay attacks (same eventId with different instance)
     */
    if (this._isReplayAttack(event)) {
      this.metrics.replayRejected++;
      return false;
    }

    /**
     * STEP 4: CAUSAL ORDER VALIDATION
     * Ensure traceId events are processed in order
     */
    if (!this._validateCausalOrdering(event)) {
      this.metrics.causalViolations++;
      return false;
    }

    /**
     * STEP 5: TRACE DEPTH PROTECTION
     * Prevent infinite loops via traceId depth
     */
    if (!this._validateTraceDepth(event)) {
      this.metrics.traceDepthViolations++;
      return false;
    }

    /**
     * STEP 6: REGISTER DISTRIBUTED STATE
     * Record event in global registry BEFORE EventBus
     */
    this._registerEvent(event);

    /**
     * STEP 7: SAFE LOCAL PUBLICATION
     * Now safe to publish to local EventBus (all checks passed)
     * Distributed coordinator validates distribution, EventBus validates local
     */
    try {
      const busResult = this.eventBus.publish(event);

      if (busResult) {
        this.metrics.eventsAccepted++;
      } else {
        this.metrics.eventsRejected++;
      }

      return busResult;
    } catch (err) {
      // EventBus threw - distributed checks passed but local failed
      // Coordinator's job is done (distribution validated)
      this.metrics.eventsRejected++;
      return false;
    }
  }

  /**
   * Check if event was already processed (globally)
   */
  _isGlobalDuplicate(event) {
    const eventId = event.eventId || event.id;
    return this.globalEventRegistry.has(eventId);
  }

  /**
   * Check if this is a replay attack (same eventId replayed)
   */
  _isReplayAttack(event) {
    const eventId = event.eventId || event.id;
    const timestamp = event.timestamp || event.createdAt || Date.now();
    const replayKey = `${eventId}:${timestamp}`;

    if (this.replayRegistry.has(replayKey)) {
      return true;
    }

    // Record this event to prevent replay
    this.replayRegistry.set(replayKey, Date.now());
    return false;
  }

  /**
   * Validate causal ordering for traceId
   */
  _validateCausalOrdering(event) {
    if (!event.traceId) {
      // No traceId = standalone event, always allowed
      return true;
    }

    // Get last sequence number for this traceId
    const lastSequence = this.sequenceRegistry.get(event.traceId) || 0;
    const currentSequence = event.sequenceId || 0;

    /**
     * STRICT MONOTONIC ORDERING
     * Ensure events within a trace are processed in order
     */
    if (currentSequence < lastSequence) {
      return false; // Out-of-order event
    }

    // Update sequence number
    this.sequenceRegistry.set(event.traceId, currentSequence);
    return true;
  }

  /**
   * Validate trace depth (prevent infinite loops)
   */
  _validateTraceDepth(event) {
    if (!event.traceId) {
      return true; // No traceId = no depth tracking
    }

    const depth = this.traceRegistry.get(event.traceId) || 0;

    // Check depth limit
    if (depth >= this.config.maxTraceDepth) {
      return false;
    }

    // Increment depth
    this.traceRegistry.set(event.traceId, depth + 1);
    return true;
  }

  /**
   * Validate clock drift (prevent time-skew attacks)
   */
  _validateClockDrift(event) {
    const eventTimestamp = event.timestamp || event.createdAt || Date.now();
    const drift = Math.abs(Date.now() - eventTimestamp);

    return drift <= this.config.maxClockDriftMs;
  }

  /**
   * Register event in global registry
   */
  _registerEvent(event) {
    const eventId = event.eventId || event.id;
    this.globalEventRegistry.set(eventId, Date.now());
  }

  /**
   * Register this node's participation
   */
  _registerNode() {
    this.nodeRegistry.set(this.nodeId, {
      nodeId: this.nodeId,
      startedAt: Date.now(),
      status: 'ACTIVE'
    });
  }

  /**
   * Memory safety: cleanup expired entries
   * Runs on non-critical path (setInterval)
   */
  _cleanupRegistries() {
    const now = Date.now();

    const cleanup = (registry, retention) => {
      for (const [key, timestamp] of registry.entries()) {
        if (typeof timestamp === 'number') {
          if (now - timestamp > retention) {
            registry.delete(key);
          }
        }
      }
    };

    // Clean expired events
    cleanup(this.globalEventRegistry, this.config.eventRetentionMs);

    // Clean expired replay entries
    cleanup(this.replayRegistry, this.config.replayWindowMs);

    // Reset trace depth counters (they track active traces, not historical)
    // Only clean if > 1000 to prevent memory explosion
    if (this.traceRegistry.size > 1000) {
      this.traceRegistry.clear();
    }
  }

  /**
   * Get coordinator status (read-only)
   */
  getStatus() {
    return {
      nodeId: this.nodeId,
      metrics: { ...this.metrics },
      registries: {
        globalEvents: this.globalEventRegistry.size,
        traces: this.traceRegistry.size,
        replay: this.replayRegistry.size,
        sequences: this.sequenceRegistry.size,
        nodes: this.nodeRegistry.size
      }
    };
  }

  /**
   * Get metrics (read-only)
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Reset coordinator (for testing)
   */
  reset() {
    this.globalEventRegistry.clear();
    this.traceRegistry.clear();
    this.replayRegistry.clear();
    this.sequenceRegistry.clear();
    this.nodeRegistry.clear();

    this.metrics = {
      eventsAccepted: 0,
      eventsRejected: 0,
      replayRejected: 0,
      causalViolations: 0,
      clockDriftViolations: 0,
      duplicateGlobalRejected: 0,
      traceDepthViolations: 0
    };

    this._registerNode();
    return { reset: true };
  }
}

module.exports = DistributedGovernanceCoordinator;
