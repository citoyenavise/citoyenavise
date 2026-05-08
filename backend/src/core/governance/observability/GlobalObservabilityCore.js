/**
 * GlobalObservabilityCore
 * PHASE 7.5 FINAL — Unified Global Observability Authority
 *
 * Single source of truth for cluster observability.
 *
 * CRITICAL: Read-only, zero mutations
 * - ingest only
 * - no enforcement influence
 * - complete cluster view
 */

class GlobalObservabilityCore {
  constructor(options = {}) {
    // Single authority for observability
    this.nodeMetrics = new Map(); // nodeId → metrics snapshot
    this.shardMetrics = new Map(); // shardId → metrics snapshot
    this.proofMetrics = null; // global proof aggregation
    this.clusterMetrics = null; // synthesized cluster state

    // Telemetry ingestion
    this.telemetryLog = [];
    this.maxTelemetrySize = options.maxTelemetrySize || 10000;

    // Normalized view
    this.unifiedSnapshot = null;
    this.lastUpdateTime = null;

    // Statistics
    this.stats = {
      metricsIngested: 0,
      snapshotsBuilt: 0,
      normalizations: 0,
      lastIngest: null,
      clusterViewTimestamp: null
    };
  }

  /**
   * Ingest node metrics (read-only append)
   */
  ingestNodeMetrics(nodeId, metrics) {
    if (!nodeId || !metrics) {
      return { ingested: false, reason: 'INVALID_INPUT' };
    }

    const snapshot = {
      nodeId,
      metrics: Object.freeze({ ...metrics }),
      timestamp: Date.now(),
      ingestionOrder: this.stats.metricsIngested
    };

    this.nodeMetrics.set(nodeId, snapshot);
    this.stats.metricsIngested++;
    this.stats.lastIngest = snapshot.timestamp;

    this._addTelemetry({
      type: 'NODE_METRICS',
      nodeId,
      timestamp: snapshot.timestamp
    });

    return { ingested: true, nodeId, timestamp: snapshot.timestamp };
  }

  /**
   * Ingest shard metrics (read-only append)
   */
  ingestShardMetrics(shardId, metrics) {
    if (!shardId || !metrics) {
      return { ingested: false, reason: 'INVALID_INPUT' };
    }

    const snapshot = {
      shardId,
      metrics: Object.freeze({ ...metrics }),
      timestamp: Date.now(),
      ingestionOrder: this.stats.metricsIngested
    };

    this.shardMetrics.set(shardId, snapshot);
    this.stats.metricsIngested++;
    this.stats.lastIngest = snapshot.timestamp;

    this._addTelemetry({
      type: 'SHARD_METRICS',
      shardId,
      timestamp: snapshot.timestamp
    });

    return { ingested: true, shardId, timestamp: snapshot.timestamp };
  }

  /**
   * Ingest proof system metrics
   */
  ingestProofMetrics(proofMetrics) {
    if (!proofMetrics) {
      return { ingested: false, reason: 'INVALID_INPUT' };
    }

    this.proofMetrics = Object.freeze({
      ...proofMetrics,
      ingestionTimestamp: Date.now(),
      ingestionOrder: this.stats.metricsIngested
    });

    this.stats.metricsIngested++;
    this.stats.lastIngest = this.proofMetrics.ingestionTimestamp;

    this._addTelemetry({
      type: 'PROOF_METRICS',
      timestamp: this.proofMetrics.ingestionTimestamp
    });

    return { ingested: true, timestamp: this.proofMetrics.ingestionTimestamp };
  }

  /**
   * Normalize telemetry into unified format
   */
  normalizeTelemetry() {
    try {
      const normalized = {
        timestamp: Date.now(),
        nodes: this._normalizeNodes(),
        shards: this._normalizeShards(),
        proofs: this._normalizeProofs(),
        cluster: {}
      };

      this.stats.normalizations++;

      return {
        normalized: true,
        data: normalized,
        sourceCount: (this.nodeMetrics.size + this.shardMetrics.size + (this.proofMetrics ? 1 : 0))
      };
    } catch (err) {
      return {
        normalized: false,
        error: err.message
      };
    }
  }

  /**
   * Build unified cluster snapshot (read-only)
   */
  buildUnifiedSnapshot() {
    try {
      const snapshot = {
        timestamp: Date.now(),
        nodeCount: this.nodeMetrics.size,
        shardCount: this.shardMetrics.size,
        nodes: Array.from(this.nodeMetrics.values()).map(n => ({
          nodeId: n.nodeId,
          metrics: n.metrics,
          ingestionTime: n.timestamp
        })),
        shards: Array.from(this.shardMetrics.values()).map(s => ({
          shardId: s.shardId,
          metrics: s.metrics,
          ingestionTime: s.timestamp
        })),
        proofs: this.proofMetrics ? {
          metrics: this.proofMetrics,
          ingestionTime: this.proofMetrics.ingestionTimestamp
        } : null
      };

      // Freeze for immutability
      this.unifiedSnapshot = Object.freeze(snapshot);
      this.lastUpdateTime = snapshot.timestamp;
      this.stats.snapshotsBuilt++;
      this.stats.clusterViewTimestamp = snapshot.timestamp;

      return {
        built: true,
        snapshot: this.unifiedSnapshot,
        timestamp: snapshot.timestamp
      };
    } catch (err) {
      return {
        built: false,
        error: err.message
      };
    }
  }

  /**
   * Get unified cluster view (read-only)
   */
  getClusterView() {
    if (!this.unifiedSnapshot) {
      return {
        available: false,
        reason: 'NO_SNAPSHOT_BUILT',
        hasData: this.nodeMetrics.size > 0 || this.shardMetrics.size > 0
      };
    }

    return {
      available: true,
      snapshot: this.unifiedSnapshot,
      lastUpdateTime: this.lastUpdateTime,
      sourceMetrics: this.stats.metricsIngested,
      snapshotAge: Date.now() - this.lastUpdateTime
    };
  }

  /**
   * Get observability statistics
   */
  getStats() {
    return {
      ...this.stats,
      nodeMetricsCount: this.nodeMetrics.size,
      shardMetricsCount: this.shardMetrics.size,
      hasProofMetrics: this.proofMetrics !== null,
      telemetryLogSize: this.telemetryLog.length,
      timestamp: Date.now()
    };
  }

  /**
   * Internal: Normalize node metrics
   */
  _normalizeNodes() {
    const normalized = {};
    for (const [nodeId, snapshot] of this.nodeMetrics.entries()) {
      normalized[nodeId] = {
        health: snapshot.metrics.health || 'UNKNOWN',
        eventsProcessed: snapshot.metrics.eventsProcessed || 0,
        latencyMs: snapshot.metrics.latencyMs || 0,
        timestamp: snapshot.timestamp
      };
    }
    return normalized;
  }

  /**
   * Internal: Normalize shard metrics
   */
  _normalizeShards() {
    const normalized = {};
    for (const [shardId, snapshot] of this.shardMetrics.entries()) {
      normalized[shardId] = {
        owner: snapshot.metrics.owner || 'UNKNOWN',
        activeTraces: snapshot.metrics.activeTraces || 0,
        queueSize: snapshot.metrics.queueSize || 0,
        timestamp: snapshot.timestamp
      };
    }
    return normalized;
  }

  /**
   * Internal: Normalize proof metrics
   */
  _normalizeProofs() {
    if (!this.proofMetrics) {
      return null;
    }
    return {
      proofCount: this.proofMetrics.totalCaptured || 0,
      chainValid: this.proofMetrics.chainValid || false,
      lastProofTimestamp: this.proofMetrics.lastProofTimestamp || null
    };
  }

  /**
   * Internal: Add telemetry entry (bounded)
   */
  _addTelemetry(entry) {
    this.telemetryLog.push({
      ...entry,
      sequence: this.telemetryLog.length
    });

    if (this.telemetryLog.length > this.maxTelemetrySize) {
      this.telemetryLog.shift();
    }
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.nodeMetrics.clear();
    this.shardMetrics.clear();
    this.proofMetrics = null;
    this.clusterMetrics = null;
    this.telemetryLog = [];
    this.unifiedSnapshot = null;
    this.lastUpdateTime = null;
    this.stats = {
      metricsIngested: 0,
      snapshotsBuilt: 0,
      normalizations: 0,
      lastIngest: null,
      clusterViewTimestamp: null
    };
  }
}

module.exports = GlobalObservabilityCore;
