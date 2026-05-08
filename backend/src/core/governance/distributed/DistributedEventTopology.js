/**
 * DistributedEventTopology
 * PHASE 7.0 — Distributed Event Topology Initialization
 *
 * Base layer for distributed system:
 * - node registry
 * - shard ownership
 * - deterministic routing
 * - cross-node trace propagation
 * - topology snapshots
 *
 * CRITICAL: Pure structural orchestration only
 * NO business logic, NO event processing, NO side effects
 */

const crypto = require('crypto');

class DistributedEventTopology {
  constructor(options = {}) {
    // Node registry: nodeId → {nodeId, capabilities, status, lastSeen, heartbeat}
    this.nodeRegistry = new Map();

    // Shard registry: shardId → {shardId, ownerNodeId, version, createdAt}
    this.shardRegistry = new Map();

    // Topology version (increment on structural changes)
    this.topologyVersion = 0;

    // Node capabilities: nodeId → {cpu, memory, maxShards, region, ...}
    this.nodeCapabilities = new Map();

    // Routing table: shardId → nodeId (deterministic mapping)
    this.routingTable = new Map();

    // Trace registry: traceId → {originNode, currentNode, path: [nodes], timestamp}
    this.traceRegistry = new Map();

    // Configuration
    this.config = {
      nodeTimeoutMs: options.nodeTimeoutMs || 30000, // 30 sec
      heartbeatIntervalMs: options.heartbeatIntervalMs || 5000, // 5 sec
      maxShardsPerNode: options.maxShardsPerNode || 100,
      traceRetentionMs: options.traceRetentionMs || 300000, // 5 min
      snapshotHistorySize: options.snapshotHistorySize || 100
    };

    // Snapshot history (for reproducibility)
    this.snapshotHistory = [];

    // Metrics
    this.metrics = {
      nodesRegistered: 0,
      nodesRemoved: 0,
      shardsAssigned: 0,
      topologyChanges: 0,
      tracesPropagated: 0
    };
  }

  /**
   * STEP 1: Register node with capabilities
   */
  registerNode(nodeId, capabilities = {}) {
    if (!nodeId) {
      throw new Error('nodeId required');
    }

    const now = Date.now();

    // Register or update node
    const isNewNode = !this.nodeRegistry.has(nodeId);
    this.nodeRegistry.set(nodeId, {
      nodeId,
      status: 'ACTIVE',
      registeredAt: isNewNode ? now : this.nodeRegistry.get(nodeId).registeredAt,
      lastSeen: now,
      lastHeartbeat: now,
      version: (this.nodeRegistry.get(nodeId)?.version || 0) + 1
    });

    // Store capabilities
    this.nodeCapabilities.set(nodeId, {
      nodeId,
      cpu: capabilities.cpu || 1,
      memory: capabilities.memory || 1024,
      maxShards: capabilities.maxShards || this.config.maxShardsPerNode,
      region: capabilities.region || 'default',
      customData: capabilities.customData || {}
    });

    if (isNewNode) {
      this.metrics.nodesRegistered++;
      this.topologyVersion++;
    }

    return {
      registered: true,
      nodeId,
      isNewNode,
      version: this.topologyVersion
    };
  }

  /**
   * STEP 2: Assign shard to node (deterministic)
   */
  assignShard(shardId, nodeId = null) {
    if (!shardId) {
      throw new Error('shardId required');
    }

    // If nodeId not specified, use deterministic assignment
    if (!nodeId) {
      const activeNodes = Array.from(this.nodeRegistry.entries())
        .filter(([, data]) => data.status === 'ACTIVE')
        .map(([id]) => id);

      if (activeNodes.length === 0) {
        throw new Error('No active nodes available for shard assignment');
      }

      // Deterministic hash-based assignment
      const hash = crypto.createHash('sha256').update(shardId).digest('hex');
      const hashValue = parseInt(hash.substring(0, 8), 16);
      const index = hashValue % activeNodes.length;
      nodeId = activeNodes[index];
    }

    // Validate node exists
    if (!this.nodeRegistry.has(nodeId)) {
      throw new Error(`Node ${nodeId} not found in registry`);
    }

    // Check shard capacity
    const assignedShards = Array.from(this.shardRegistry.entries())
      .filter(([, data]) => data.ownerNodeId === nodeId).length;

    const maxShards = this.nodeCapabilities.get(nodeId)?.maxShards
      || this.config.maxShardsPerNode;

    if (assignedShards >= maxShards) {
      throw new Error(`Node ${nodeId} has reached max shards (${maxShards})`);
    }

    // Assign shard
    const now = Date.now();
    this.shardRegistry.set(shardId, {
      shardId,
      ownerNodeId: nodeId,
      version: 1,
      createdAt: now,
      lastModified: now
    });

    this.routingTable.set(shardId, nodeId);

    this.metrics.shardsAssigned++;
    this.topologyVersion++;

    return {
      assigned: true,
      shardId,
      ownerNodeId: nodeId,
      version: this.topologyVersion
    };
  }

  /**
   * STEP 3: Get shard owner (stable routing)
   */
  getShardOwner(shardId) {
    if (!shardId) {
      throw new Error('shardId required');
    }

    const owner = this.routingTable.get(shardId);

    // If shard not assigned, assign now
    if (!owner) {
      this.assignShard(shardId);
      return this.routingTable.get(shardId);
    }

    // Verify owner is still active
    const ownerNode = this.nodeRegistry.get(owner);
    if (ownerNode && ownerNode.status === 'ACTIVE') {
      return owner;
    }

    // Owner is dead, reassign
    this.routingTable.delete(shardId);
    const shardData = this.shardRegistry.get(shardId);
    if (shardData) {
      shardData.ownerNodeId = null;
    }
    this.assignShard(shardId);
    return this.routingTable.get(shardId);
  }

  /**
   * STEP 4: Update heartbeat (mark active)
   */
  updateHeartbeat(nodeId) {
    if (!nodeId) {
      throw new Error('nodeId required');
    }

    const nodeData = this.nodeRegistry.get(nodeId);
    if (!nodeData) {
      throw new Error(`Node ${nodeId} not registered`);
    }

    const now = Date.now();
    nodeData.lastHeartbeat = now;
    nodeData.lastSeen = now;
    nodeData.status = 'ACTIVE';

    return {
      updated: true,
      nodeId,
      lastHeartbeat: now
    };
  }

  /**
   * STEP 5: Remove dead nodes (cleanup)
   */
  removeDeadNodes(timeoutMs = null) {
    const timeout = timeoutMs || this.config.nodeTimeoutMs;
    const now = Date.now();
    const deadNodes = [];

    // Find dead nodes
    for (const [nodeId, nodeData] of this.nodeRegistry.entries()) {
      if (now - nodeData.lastHeartbeat > timeout) {
        deadNodes.push(nodeId);
      }
    }

    // Remove dead nodes and reassign their shards
    const reassignments = [];
    for (const deadNodeId of deadNodes) {
      // Find shards owned by dead node
      const orphanShards = Array.from(this.shardRegistry.entries())
        .filter(([, data]) => data.ownerNodeId === deadNodeId)
        .map(([id]) => id);

      // Reassign shards
      for (const shardId of orphanShards) {
        this.routingTable.delete(shardId);
        const shardData = this.shardRegistry.get(shardId);
        if (shardData) {
          shardData.ownerNodeId = null;
        }

        try {
          this.assignShard(shardId);
          reassignments.push({ shardId, newOwner: this.routingTable.get(shardId) });
        } catch (err) {
          // Not enough active nodes - leave unassigned
          reassignments.push({ shardId, newOwner: null, error: err.message });
        }
      }

      // Mark node as dead
      const nodeData = this.nodeRegistry.get(deadNodeId);
      if (nodeData) {
        nodeData.status = 'DEAD';
      }

      this.metrics.nodesRemoved++;
    }

    if (deadNodes.length > 0) {
      this.topologyVersion++;
    }

    return {
      deadNodesFound: deadNodes.length,
      deadNodes,
      shardReassignments: reassignments.length,
      reassignments
    };
  }

  /**
   * STEP 6: Propagate trace across nodes
   */
  propagateTrace(traceId, nodeId) {
    if (!traceId || !nodeId) {
      throw new Error('traceId and nodeId required');
    }

    const now = Date.now();

    // Get or create trace path
    let traceData = this.traceRegistry.get(traceId);
    if (!traceData) {
      traceData = {
        traceId,
        originNode: nodeId,
        currentNode: nodeId,
        path: [nodeId],
        firstSeen: now,
        lastSeen: now,
        hopCount: 1
      };
    } else {
      // Update trace path
      if (traceData.currentNode !== nodeId && !traceData.path.includes(nodeId)) {
        traceData.path.push(nodeId);
        traceData.hopCount++;
      }
      traceData.currentNode = nodeId;
      traceData.lastSeen = now;
    }

    this.traceRegistry.set(traceId, traceData);
    this.metrics.tracesPropagated++;

    return {
      propagated: true,
      traceId,
      hopCount: traceData.hopCount,
      path: [...traceData.path]
    };
  }

  /**
   * STEP 7: Snapshot topology (reproducible state)
   */
  snapshotTopology() {
    const snapshot = {
      version: this.topologyVersion,
      timestamp: Date.now(),
      nodes: Array.from(this.nodeRegistry.entries()).map(([id, data]) => ({
        nodeId: id,
        ...data,
        capabilities: this.nodeCapabilities.get(id)
      })),
      shards: Array.from(this.shardRegistry.entries()).map(([id, data]) => ({
        shardId: id,
        ...data
      })),
      routing: Object.fromEntries(this.routingTable),
      traces: Array.from(this.traceRegistry.entries()).map(([id, data]) => ({
        traceId: id,
        ...data
      })),
      metrics: { ...this.metrics }
    };

    // Keep snapshot history
    this.snapshotHistory.push(snapshot);
    if (this.snapshotHistory.length > this.config.snapshotHistorySize) {
      this.snapshotHistory.shift();
    }

    // Create fingerprint for validation
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(snapshot))
      .digest('hex');

    return {
      ...snapshot,
      fingerprint
    };
  }

  /**
   * Get current topology status
   */
  getStatus() {
    return {
      version: this.topologyVersion,
      activeNodes: Array.from(this.nodeRegistry.values())
        .filter((n) => n.status === 'ACTIVE').length,
      totalNodes: this.nodeRegistry.size,
      totalShards: this.shardRegistry.size,
      orphanShards: Array.from(this.shardRegistry.entries())
        .filter(([, data]) => !data.ownerNodeId).length,
      activeTraces: this.traceRegistry.size,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Cleanup expired traces
   */
  cleanupExpiredTraces() {
    const now = Date.now();
    const expired = [];

    for (const [traceId, traceData] of this.traceRegistry.entries()) {
      if (now - traceData.lastSeen > this.config.traceRetentionMs) {
        this.traceRegistry.delete(traceId);
        expired.push(traceId);
      }
    }

    return { cleanedUp: expired.length, expiredTraces: expired };
  }

  /**
   * Reset topology (for testing)
   */
  reset() {
    this.nodeRegistry.clear();
    this.shardRegistry.clear();
    this.routingTable.clear();
    this.traceRegistry.clear();
    this.snapshotHistory = [];
    this.topologyVersion = 0;
    this.metrics = {
      nodesRegistered: 0,
      nodesRemoved: 0,
      shardsAssigned: 0,
      topologyChanges: 0,
      tracesPropagated: 0
    };
  }
}

module.exports = DistributedEventTopology;
