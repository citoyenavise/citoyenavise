/**
 * DistributedBatchEngine
 * PHASE 7.1 — Distributed Batch Processing Across Cluster
 *
 * Orchestrates batch processing across multiple cluster nodes.
 * Each node runs its own EnforcementProofSystem + BatchLayerOptimization.
 * Engine manages routing, replication, aggregation, and failover.
 *
 * INVARIANT: Distributed batch NEVER influences Real-Time enforcement decisions.
 * All operations are observability-only, asynchronous, non-blocking.
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const EnforcementProofSystem = require('./EnforcementProofSystem');
const BatchLayerOptimization = require('./BatchLayerOptimization');
const ProofChainConsolidator = require('../observability/ProofChainConsolidator');

/**
 * Internal class: represents a single batch node in the cluster
 */
class BatchNode {
  constructor(nodeId, options = {}) {
    this.nodeId = nodeId;
    this.status = 'ACTIVE'; // ACTIVE | DEGRADED | FAILED
    this.proofSystem = new EnforcementProofSystem(options.proofSystemOptions);
    this.batchLayer = new BatchLayerOptimization(this.proofSystem, options.batchOptions);
    this.capabilities = {
      maxBatchSize: options.maxBatchSize || 5000,
      region: options.region || 'default'
    };
    this.lastHeartbeat = Date.now();
    this.metrics = {
      decisionsRouted: 0,
      decisionsReplicated: 0
    };
  }

  isAlive() {
    return this.status !== 'FAILED';
  }
}

/**
 * DistributedBatchEngine: Cluster-wide batch orchestration
 * Pattern: extends EventEmitter like DistributedReplicationManager
 */
class DistributedBatchEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.nodes = new Map(); // nodeId → BatchNode
    this.shardCount = options.shardCount || 3;
    this.shardOwnership = new Map(); // shardId → nodeId
    this.consolidator = new ProofChainConsolidator();
    this.replicationFactor = options.replicationFactor || 1;
    this.nodeHeartbeatTimeoutMs = options.nodeHeartbeatTimeoutMs || 30000;

    // Cluster-level metrics
    this.clusterMetrics = {
      totalDecisionsRouted: 0,
      totalDecisionsReplicated: 0,
      nodeFailovers: 0,
      consolidationsPerformed: 0,
      createdAt: new Date().toISOString()
    };

    // Initialize shard ownership map
    for (let i = 0; i < this.shardCount; i++) {
      this.shardOwnership.set(`shard_${i}`, null);
    }
  }

  /**
   * Register a new node in the cluster
   */
  registerNode(nodeId, options = {}) {
    if (this.nodes.has(nodeId)) {
      return {
        registered: false,
        reason: 'NODE_ALREADY_EXISTS',
        nodeId
      };
    }

    const node = new BatchNode(nodeId, options);
    this.nodes.set(nodeId, node);

    // Rebalance all shard assignments using consistent hashing
    this._rebalanceShards();

    this.emit('node:registered', { nodeId, status: node.status });
    return {
      registered: true,
      nodeId,
      shardsAssigned: [...this.shardOwnership.values()].filter((o) => o === nodeId).length
    };
  }

  /**
   * Rebalance shard ownership across active nodes using round-robin
   * Ensures each shard is assigned to exactly one active node
   */
  _rebalanceShards() {
    const activeNodeIds = [...this.nodes.values()]
      .filter((n) => n.isAlive())
      .map((n) => n.nodeId)
      .sort(); // Sort for consistent ordering

    if (activeNodeIds.length === 0) {
      return;
    }

    // Assign each shard to a node using round-robin distribution
    for (let i = 0; i < this.shardCount; i++) {
      const shardId = `shard_${i}`;
      const nodeIdx = i % activeNodeIds.length;
      this.shardOwnership.set(shardId, activeNodeIds[nodeIdx]);
    }
  }

  /**
   * Unregister node (mark FAILED and redistribute shards)
   */
  unregisterNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { removed: false, reason: 'NODE_NOT_FOUND' };
    }

    node.status = 'FAILED';

    // Rebalance shards across remaining active nodes
    this._rebalanceShards();

    const redistributed = [...this.shardOwnership.values()].filter((o) => o !== nodeId).length;
    this.clusterMetrics.nodeFailovers++;
    this.emit('node:unregistered', { nodeId, redistributed });
    return { removed: true, nodeId, redistributed };
  }

  /**
   * Deterministic consistent hash routing
   * Pattern: identical to DistributedShardRouter._consistentHash()
   */
  _routeDecision(decisionId) {
    const hash = crypto.createHash('sha256').update(decisionId).digest('hex');
    const shardIdx = parseInt(hash.substring(0, 8), 16) % this.shardCount;
    const shardId = `shard_${shardIdx}`;
    const nodeId = this.shardOwnership.get(shardId);

    if (!nodeId) {
      return this._fallbackNode();
    }

    const node = this.nodes.get(nodeId);
    if (!node || !node.isAlive()) {
      return this._fallbackNode();
    }

    return { shardId, nodeId, node };
  }

  /**
   * Fallback routing when primary shard owner is down
   */
  _fallbackNode() {
    const active = [...this.nodes.values()].filter((n) => n.isAlive());
    if (active.length === 0) {
      return null;
    }
    // Pick first active node, assign to shard_0
    return { shardId: 'shard_0', nodeId: active[0].nodeId, node: active[0] };
  }

  /**
   * Pick an active node (excluding the given one)
   */
  _pickActiveNode(excludeNodeId) {
    const active = [...this.nodes.values()].filter((n) => n.nodeId !== excludeNodeId && n.isAlive());
    return active.length > 0 ? active[0] : null;
  }

  /**
   * Capture decision with distributed routing
   * Non-blocking: returns immediately, replication happens async
   */
  captureDistributed(context) {
    const route = this._routeDecision(context.decisionId || context.module);
    if (!route) {
      return {
        captured: false,
        reason: 'NO_ACTIVE_NODE'
      };
    }

    // Capture on the routed node (real-time path)
    const proof = route.node.proofSystem.captureDecision(context);
    route.node.metrics.decisionsRouted++;
    this.clusterMetrics.totalDecisionsRouted++;

    // Async replication (fire-and-forget, non-blocking)
    if (this.replicationFactor > 1) {
      this._replicateAsync(context, route.nodeId);
    }

    this.emit('decision:captured', {
      nodeId: route.nodeId,
      shardId: route.shardId,
      proof
    });

    return {
      captured: true,
      nodeId: route.nodeId,
      shardId: route.shardId
    };
  }

  /**
   * Asynchronous replication to peer nodes
   * CRITICAL: Never blocks enforcement, uses setImmediate()
   */
  _replicateAsync(context, sourceNodeId) {
    const peers = [...this.nodes.values()]
      .filter((n) => n.nodeId !== sourceNodeId && n.isAlive())
      .slice(0, this.replicationFactor - 1);

    for (const peer of peers) {
      // Non-blocking: defer to next event loop iteration
      setImmediate(() => {
        try {
          peer.proofSystem.captureDecision({ ...context, replicated: true });
          peer.metrics.decisionsReplicated++;
          this.clusterMetrics.totalDecisionsReplicated++;
          this.emit('decision:replicated', { nodeId: peer.nodeId });
        } catch {
          // Replication failure is silent — never blocks real-time path
        }
      });
    }
  }

  /**
   * Simulate node crash (for testing failover)
   */
  simulateNodeCrash(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { crashed: false, reason: 'NODE_NOT_FOUND' };
    }

    node.status = 'FAILED';

    // Rebalance shards across remaining active nodes
    this._rebalanceShards();

    const redistributed = [...this.shardOwnership.values()].filter((o) => o !== nodeId).length;
    this.clusterMetrics.nodeFailovers++;
    this.emit('node:crashed', { nodeId, redistributed });
    return { crashed: true, nodeId, redistributed };
  }

  /**
   * Get cluster-wide aggregated metrics
   */
  getClusterMetrics() {
    const perNode = {};
    let totalCaptured = 0;
    let totalViolations = 0;
    let totalProofErrors = 0;

    for (const [nodeId, node] of this.nodes) {
      if (!node.isAlive()) continue;

      const m = node.proofSystem.getMetrics();
      perNode[nodeId] = {
        status: node.status,
        chainLength: m.chainLength,
        totalCaptured: m.totalCaptured,
        successCount: m.successCount,
        violationCount: m.violationCount,
        batchQueueDepth: m.batchQueueDepth,
        batchFlushed: m.batchFlushed,
        batchAutoCompactCount: m.batchAutoCompactCount,
        lastFlushTimestamp: m.lastFlushTimestamp,
        lastFlushDurationMs: m.lastFlushDurationMs,
        proofSystemErrors: m.proofSystemErrors,
        decisionsRouted: node.metrics.decisionsRouted,
        decisionsReplicated: node.metrics.decisionsReplicated
      };

      totalCaptured += m.totalCaptured;
      totalViolations += m.violationCount;
      totalProofErrors += m.proofSystemErrors;
    }

    return {
      isAuthoritative: false, // INVARIANT
      clusterTotals: {
        totalCaptured,
        totalViolations,
        violationRatePercent: totalCaptured > 0 ? parseFloat(((totalViolations / totalCaptured) * 100).toFixed(2)) : 0,
        totalDecisionsRouted: this.clusterMetrics.totalDecisionsRouted,
        totalDecisionsReplicated: this.clusterMetrics.totalDecisionsReplicated,
        nodeFailovers: this.clusterMetrics.nodeFailovers,
        totalProofErrors
      },
      clusterStatus: {
        activeNodes: [...this.nodes.values()].filter((n) => n.isAlive()).length,
        totalNodes: this.nodes.size,
        shardCount: this.shardCount,
        shardDistribution: this._getShardDistribution()
      },
      perNode,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get shard distribution per node
   */
  _getShardDistribution() {
    const distribution = {};
    for (const [shardId, nodeId] of this.shardOwnership) {
      if (!distribution[nodeId]) {
        distribution[nodeId] = [];
      }
      distribution[nodeId].push(shardId);
    }
    return distribution;
  }

  /**
   * Check cluster-wide alerts (union of all node alerts)
   */
  checkClusterAlerts() {
    const allAlerts = [];

    for (const [nodeId, node] of this.nodes) {
      if (!node.isAlive()) continue;
      const nodeAlerts = node.batchLayer.checkAlerts();
      for (const alert of nodeAlerts) {
        allAlerts.push({
          ...alert,
          nodeId,
          isAuthoritative: false
        });
      }
    }

    return allAlerts;
  }

  /**
   * Get all cluster alerts (union)
   */
  getAllClusterAlerts() {
    const allAlerts = [];
    for (const [nodeId, node] of this.nodes) {
      if (!node.isAlive()) continue;
      const nodeAlerts = node.batchLayer.getAllAlerts();
      for (const alert of nodeAlerts) {
        allAlerts.push({
          ...alert,
          nodeId
        });
      }
    }
    return allAlerts;
  }

  /**
   * Consolidate all node proofs into global root hash
   * Uses ProofChainConsolidator.buildGlobalRoot()
   */
  consolidateClusterProofs() {
    let nodesConsolidated = 0;

    for (const [nodeId, node] of this.nodes) {
      if (!node.isAlive()) continue;
      const proofs = node.proofSystem.proofLog;
      if (proofs.length > 0) {
        this.consolidator.registerNodeProofs(nodeId, proofs);
        nodesConsolidated++;
      }
    }

    const result = this.consolidator.buildGlobalRoot();
    this.clusterMetrics.consolidationsPerformed++;

    return {
      rootHash: result.rootHash,
      nodesConsolidated,
      isAuthoritative: false,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get cluster topology status
   */
  getClusterStatus() {
    return {
      isAuthoritative: false,
      totalNodes: this.nodes.size,
      activeNodes: [...this.nodes.values()].filter((n) => n.isAlive()).length,
      failedNodes: [...this.nodes.values()].filter((n) => n.status === 'FAILED').length,
      shardCount: this.shardCount,
      shardOwnership: Object.fromEntries(this.shardOwnership),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * INVARIANT: Batch is never authoritative
   */
  isAuthoritative() {
    return false;
  }

  /**
   * Get summary of cluster state
   */
  getSummary() {
    return {
      isAuthoritative: false,
      clusterMetrics: this.getClusterMetrics(),
      clusterStatus: this.getClusterStatus(),
      clusterAlerts: this.checkClusterAlerts(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Reset all nodes and cluster state (for testing)
   */
  reset() {
    for (const node of this.nodes.values()) {
      node.proofSystem.reset();
      node.batchLayer.reset();
      node.metrics = { decisionsRouted: 0, decisionsReplicated: 0 };
    }
    this.clusterMetrics = {
      totalDecisionsRouted: 0,
      totalDecisionsReplicated: 0,
      nodeFailovers: 0,
      consolidationsPerformed: 0,
      createdAt: new Date().toISOString()
    };
    this.consolidator.reset();
  }
}

module.exports = DistributedBatchEngine;
