/**
 * ClusterStateAggregator
 * PHASE 7.5 FINAL — Global Cluster State Fusion
 *
 * Merges observability data into coherent global state.
 *
 * CRITICAL: Eventual consistency only
 * - no runtime dependency
 * - quorum-based aggregation
 * - derived state only
 */

class ClusterStateAggregator {
  constructor(observabilityCore, options = {}) {
    this.core = observabilityCore;

    // Aggregated state (eventual consistency)
    this.aggregatedState = null;
    this.lastAggregationTime = null;

    // Health tracking
    this.nodeHealth = new Map(); // nodeId → health status
    this.shardHealth = new Map(); // shardId → health status
    this.clusterHealth = 'UNKNOWN';

    // Drift tracking
    this.driftHistory = [];
    this.maxDriftHistory = options.maxDriftHistory || 100;

    // Statistics
    this.stats = {
      aggregationsPerformed: 0,
      nodeHealthEvaluations: 0,
      shardHealthEvaluations: 0,
      driftDetections: 0,
      lastAggregation: null
    };
  }

  /**
   * Aggregate all node metrics
   */
  aggregateNodes() {
    if (!this.core.getClusterView().available) {
      return { aggregated: false, reason: 'NO_CLUSTER_VIEW' };
    }

    const clusterView = this.core.getClusterView().snapshot;
    const aggregation = {
      timestamp: Date.now(),
      nodeCount: clusterView.nodeCount,
      nodes: [],
      healthyNodes: 0,
      degradedNodes: 0,
      failedNodes: 0
    };

    for (const node of clusterView.nodes) {
      const nodeId = node.nodeId;
      const health = this._evaluateNodeHealth(node.metrics);

      this.nodeHealth.set(nodeId, health);
      aggregation.nodes.push({
        nodeId,
        health,
        metrics: node.metrics
      });

      if (health === 'HEALTHY') aggregation.healthyNodes++;
      else if (health === 'DEGRADED') aggregation.degradedNodes++;
      else if (health === 'FAILED') aggregation.failedNodes++;
    }

    this.stats.nodeHealthEvaluations += clusterView.nodeCount;

    return {
      aggregated: true,
      aggregation,
      timestamp: aggregation.timestamp
    };
  }

  /**
   * Aggregate all shard metrics
   */
  aggregateShards() {
    if (!this.core.getClusterView().available) {
      return { aggregated: false, reason: 'NO_CLUSTER_VIEW' };
    }

    const clusterView = this.core.getClusterView().snapshot;
    const aggregation = {
      timestamp: Date.now(),
      shardCount: clusterView.shardCount,
      shards: [],
      consistentShards: 0,
      degradedShards: 0,
      unreachableShards: 0
    };

    for (const shard of clusterView.shards) {
      const shardId = shard.shardId;
      const health = this._evaluateShardHealth(shard.metrics);

      this.shardHealth.set(shardId, health);
      aggregation.shards.push({
        shardId,
        health,
        metrics: shard.metrics
      });

      if (health === 'CONSISTENT') aggregation.consistentShards++;
      else if (health === 'DEGRADED') aggregation.degradedShards++;
      else if (health === 'UNREACHABLE') aggregation.unreachableShards++;
    }

    this.stats.shardHealthEvaluations += clusterView.shardCount;

    return {
      aggregated: true,
      aggregation,
      timestamp: aggregation.timestamp
    };
  }

  /**
   * Compute overall cluster health
   */
  computeClusterHealth() {
    const nodeAgg = this.aggregateNodes();
    const shardAgg = this.aggregateShards();

    if (!nodeAgg.aggregated || !shardAgg.aggregated) {
      return {
        computed: false,
        reason: 'INCOMPLETE_DATA',
        health: 'UNKNOWN'
      };
    }

    const nodeMetrics = nodeAgg.aggregation;
    const shardMetrics = shardAgg.aggregation;

    // Compute health score
    const nodeHealthRatio = nodeMetrics.healthyNodes / nodeMetrics.nodeCount;
    const shardHealthRatio = shardMetrics.consistentShards / shardMetrics.shardCount;

    let clusterHealth = 'HEALTHY';
    if (nodeHealthRatio < 0.75 || shardHealthRatio < 0.75) {
      clusterHealth = 'DEGRADED';
    }
    if (nodeHealthRatio < 0.5 || shardHealthRatio < 0.5) {
      clusterHealth = 'FAILED';
    }

    this.clusterHealth = clusterHealth;
    this.aggregatedState = {
      timestamp: Date.now(),
      health: clusterHealth,
      nodeMetrics,
      shardMetrics,
      healthScore: ((nodeHealthRatio + shardHealthRatio) / 2 * 100).toFixed(2)
    };

    this.stats.aggregationsPerformed++;
    this.lastAggregationTime = this.aggregatedState.timestamp;
    this.stats.lastAggregation = this.lastAggregationTime;

    return {
      computed: true,
      health: clusterHealth,
      healthScore: this.aggregatedState.healthScore,
      timestamp: this.aggregatedState.timestamp
    };
  }

  /**
   * Detect drift in cluster state
   */
  detectDrift() {
    if (!this.aggregatedState) {
      return { detected: false, reason: 'NO_AGGREGATED_STATE' };
    }

    const driftRecord = {
      timestamp: Date.now(),
      health: this.clusterHealth,
      nodeHealthyPercent: (this.aggregatedState.nodeMetrics.healthyNodes / this.aggregatedState.nodeMetrics.nodeCount * 100).toFixed(2),
      shardConsistentPercent: (this.aggregatedState.shardMetrics.consistentShards / this.aggregatedState.shardMetrics.shardCount * 100).toFixed(2)
    };

    this.driftHistory.push(driftRecord);
    if (this.driftHistory.length > this.maxDriftHistory) {
      this.driftHistory.shift();
    }

    this.stats.driftDetections++;

    // Detect drift trend
    if (this.driftHistory.length > 1) {
      const prev = this.driftHistory[this.driftHistory.length - 2];
      const curr = driftRecord;

      const healthDrift = prev.health !== curr.health;
      const nodeDrift = Math.abs(parseFloat(prev.nodeHealthyPercent) - parseFloat(curr.nodeHealthyPercent)) > 10;
      const shardDrift = Math.abs(parseFloat(prev.shardConsistentPercent) - parseFloat(curr.shardConsistentPercent)) > 10;

      return {
        detected: healthDrift || nodeDrift || shardDrift,
        driftRecord,
        trends: {
          healthChanged: healthDrift,
          nodesUnstable: nodeDrift,
          shardsUnstable: shardDrift
        }
      };
    }

    return {
      detected: false,
      driftRecord,
      reason: 'INSUFFICIENT_HISTORY'
    };
  }

  /**
   * Internal: Evaluate node health
   */
  _evaluateNodeHealth(metrics) {
    if (!metrics) return 'UNKNOWN';

    const healthStatus = metrics.health || 'UNKNOWN';
    if (healthStatus === 'HEALTHY') return 'HEALTHY';
    if (healthStatus === 'DEGRADED') return 'DEGRADED';
    return 'FAILED';
  }

  /**
   * Internal: Evaluate shard health
   */
  _evaluateShardHealth(metrics) {
    if (!metrics) return 'UNKNOWN';

    // Check if shard has owner (minimal consistency check)
    if (!metrics.owner) return 'UNREACHABLE';

    // Check active traces
    if (metrics.activeTraces === undefined) return 'DEGRADED';

    return 'CONSISTENT';
  }

  /**
   * Get aggregated state
   */
  getAggregatedState() {
    return {
      available: this.aggregatedState !== null,
      state: this.aggregatedState,
      health: this.clusterHealth,
      lastUpdateTime: this.lastAggregationTime,
      timestamp: Date.now()
    };
  }

  /**
   * Get health summary
   */
  getHealthSummary() {
    this.computeClusterHealth();
    return {
      clusterHealth: this.clusterHealth,
      nodeHealth: Array.from(this.nodeHealth.entries()).map(([id, health]) => ({ nodeId: id, health })),
      shardHealth: Array.from(this.shardHealth.entries()).map(([id, health]) => ({ shardId: id, health })),
      timestamp: Date.now()
    };
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      nodeHealthCount: this.nodeHealth.size,
      shardHealthCount: this.shardHealth.size,
      driftHistorySize: this.driftHistory.length,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.aggregatedState = null;
    this.lastAggregationTime = null;
    this.nodeHealth.clear();
    this.shardHealth.clear();
    this.clusterHealth = 'UNKNOWN';
    this.driftHistory = [];
    this.stats = {
      aggregationsPerformed: 0,
      nodeHealthEvaluations: 0,
      shardHealthEvaluations: 0,
      driftDetections: 0,
      lastAggregation: null
    };
  }
}

module.exports = ClusterStateAggregator;
