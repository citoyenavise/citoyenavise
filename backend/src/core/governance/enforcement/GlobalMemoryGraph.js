/**
 * GlobalMemoryGraph
 * PHASE 8.1 — Représentation Causale Déterministe de l'Histoire du Cluster
 *
 * Construit un graphe orienté acyclique (DAG) immuable représentant:
 * - Chaque décision Real-Time capturée (EVENT_NODE)
 * - Chaque preuve cryptographique validée (PROOF_NODE)
 * - Chaque consensus multi-région (QUORUM_NODE)
 * - Chaque snapshot point-in-time (SNAPSHOT_NODE)
 * - Chaque archive long-terme (ARCHIVE_NODE)
 * - Chaque réplication inter-région (REGION_NODE)
 * - Chaque transaction WAL committée (TRANSACTION_NODE)
 * - Chaque recovery/replay (REPLAY_NODE)
 *
 * INVARIANT: Graphe append-only, immuable, déterministe.
 * Toutes structures sont Object.freeze() incluant nested arrays.
 * Jamais autoritaire (isAuthoritative === false TOUJOURS).
 */

const crypto = require('crypto');

// ─── NODE TYPES (8) ───

const NODE_TYPES = Object.freeze({
  EVENT_NODE:       'EVENT_NODE',       // Décision Real-Time capturée
  PROOF_NODE:       'PROOF_NODE',       // Preuve cryptographique
  QUORUM_NODE:      'QUORUM_NODE',      // Consensus multi-région validé
  SNAPSHOT_NODE:    'SNAPSHOT_NODE',    // Point-in-time snapshot d'archive
  ARCHIVE_NODE:     'ARCHIVE_NODE',     // Segment long-terme archivé
  REPLAY_NODE:      'REPLAY_NODE',      // Résultat de WAL replay/recovery
  REGION_NODE:      'REGION_NODE',      // Nœud cluster régional
  TRANSACTION_NODE: 'TRANSACTION_NODE'  // Transaction WAL committée
});

// ─── EDGE TYPES (7) ───

const EDGE_TYPES = Object.freeze({
  VALIDATED_BY:       'validated_by',       // EVENT_NODE → PROOF_NODE
  ACCEPTED_BY:        'accepted_by',        // PROOF_NODE → QUORUM_NODE
  DERIVED_FROM:       'derived_from',       // SNAPSHOT_NODE → EVENT_NODE
  PERSISTED_FROM:     'persisted_from',     // ARCHIVE_NODE → SNAPSHOT_NODE
  RECONSTRUCTED_FROM: 'reconstructed_from', // REPLAY_NODE → ARCHIVE_NODE
  REPLICATED_TO:      'replicated_to',      // REGION_NODE → REGION_NODE
  COMMITTED_INTO:     'committed_into'      // TRANSACTION_NODE → SNAPSHOT_NODE
});

class GlobalMemoryGraph {
  constructor(options = {}) {
    // Primary O(1) stores
    this.nodes = new Map();             // nodeId → frozenNode
    this.edges = new Map();             // edgeId → frozenEdge

    // Traversal indexes
    this.adjacency = new Map();         // nodeId → Set<edgeId> (outgoing)
    this.reverseAdjacency = new Map();  // nodeId → Set<edgeId> (incoming)
    this.temporalIndex = [];            // sorted [{ts, nodeId}]
    this.typeIndex = new Map();         // nodeType → Set<nodeId>
    this.regionIndex = new Map();       // regionId → Set<nodeId>
    this.sequenceIndex = [];            // sorted [{seq, nodeId}]

    this.maxNodes = options.maxNodes || 1_000_000;
    this.maxEdges = options.maxEdges || 5_000_000;
    this.maxAlerts = options.maxAlerts || 1000;

    this.globalSequence = 0;

    this.graphMetrics = {
      nodesAdded: 0,
      edgesAdded: 0,
      nodesByType: {},
      traversalsPerformed: 0,
      consistencyChecks: 0,
      lastConsistencyCheck: null,
      createdAt: new Date().toISOString()
    };

    this.alerts = [];
  }

  /**
   * Add EVENT_NODE (décision Real-Time capturée)
   */
  addEventNode(proofEntry) {
    if (!proofEntry || !proofEntry.decisionId) {
      return { added: false, reason: 'INVALID_EVENT_ENTRY' };
    }

    if (this.nodes.size >= this.maxNodes) {
      return { added: false, reason: 'MAX_NODES_EXCEEDED' };
    }

    this.globalSequence++;
    const nodeId = `gnode_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const node = Object.freeze({
      nodeId,
      type: NODE_TYPES.EVENT_NODE,
      timestamp,
      causalParents: Object.freeze([]),
      proofHash: null,
      regionId: proofEntry.regionId || null,
      sequence: this.globalSequence,
      immutableMetadata: Object.freeze({
        decisionId: proofEntry.decisionId,
        module: proofEntry.module || 'UNKNOWN',
        action: proofEntry.action || 'UNKNOWN',
        decision: proofEntry.decision || null,
        latencyMs: proofEntry.latencyMs || 0,
        severity: proofEntry.severity || 'INFO'
      }),
      isAuthoritative: false
    });

    this.nodes.set(nodeId, node);
    this._indexNode(node);

    return {
      added: true,
      nodeId,
      type: NODE_TYPES.EVENT_NODE,
      sequence: this.globalSequence,
      isAuthoritative: false
    };
  }

  /**
   * Add PROOF_NODE (preuve cryptographique)
   */
  addProofNode(verifyResult, proofEntry) {
    if (!proofEntry) {
      return { added: false, reason: 'INVALID_PROOF_ENTRY' };
    }

    if (this.nodes.size >= this.maxNodes) {
      return { added: false, reason: 'MAX_NODES_EXCEEDED' };
    }

    this.globalSequence++;
    const nodeId = `gnode_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const node = Object.freeze({
      nodeId,
      type: NODE_TYPES.PROOF_NODE,
      timestamp,
      causalParents: Object.freeze([]),
      proofHash: proofEntry.proofHash || null,
      regionId: proofEntry.regionId || null,
      sequence: this.globalSequence,
      immutableMetadata: Object.freeze({
        proofHash: proofEntry.proofHash || null,
        previousHash: proofEntry.previousHash || null,
        entriesVerified: proofEntry.entriesVerified || 0,
        validChain: verifyResult && verifyResult.valid === true
      }),
      isAuthoritative: false
    });

    this.nodes.set(nodeId, node);
    this._indexNode(node);

    return {
      added: true,
      nodeId,
      type: NODE_TYPES.PROOF_NODE,
      sequence: this.globalSequence,
      isAuthoritative: false
    };
  }

  /**
   * Add QUORUM_NODE (consensus multi-région)
   */
  addQuorumNode(consensusRecord) {
    if (!consensusRecord || !consensusRecord.consensusId) {
      return { added: false, reason: 'INVALID_QUORUM_ENTRY' };
    }

    if (this.nodes.size >= this.maxNodes) {
      return { added: false, reason: 'MAX_NODES_EXCEEDED' };
    }

    this.globalSequence++;
    const nodeId = `gnode_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const node = Object.freeze({
      nodeId,
      type: NODE_TYPES.QUORUM_NODE,
      timestamp,
      causalParents: Object.freeze([]),
      proofHash: null,
      regionId: null,
      sequence: this.globalSequence,
      immutableMetadata: Object.freeze({
        consensusId: consensusRecord.consensusId,
        requiredAcks: consensusRecord.requiredAcks || 0,
        ackCount: consensusRecord.ackCount || 0,
        regions: Object.freeze(consensusRecord.regions || [])
      }),
      isAuthoritative: false
    });

    this.nodes.set(nodeId, node);
    this._indexNode(node);

    return {
      added: true,
      nodeId,
      type: NODE_TYPES.QUORUM_NODE,
      sequence: this.globalSequence,
      isAuthoritative: false
    };
  }

  /**
   * Add SNAPSHOT_NODE (point-in-time snapshot)
   */
  addSnapshotNode(snapshotRecord) {
    if (!snapshotRecord || !snapshotRecord.snapshotId) {
      return { added: false, reason: 'INVALID_SNAPSHOT_ENTRY' };
    }

    if (this.nodes.size >= this.maxNodes) {
      return { added: false, reason: 'MAX_NODES_EXCEEDED' };
    }

    this.globalSequence++;
    const nodeId = `gnode_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const node = Object.freeze({
      nodeId,
      type: NODE_TYPES.SNAPSHOT_NODE,
      timestamp,
      causalParents: Object.freeze([]),
      proofHash: null,
      regionId: snapshotRecord.regionId || null,
      sequence: this.globalSequence,
      immutableMetadata: Object.freeze({
        snapshotId: snapshotRecord.snapshotId,
        archiveSize: snapshotRecord.archiveSize || 0,
        totalEntries: snapshotRecord.totalEntries || 0,
        takenAt: snapshotRecord.takenAt || timestamp
      }),
      isAuthoritative: false
    });

    this.nodes.set(nodeId, node);
    this._indexNode(node);

    return {
      added: true,
      nodeId,
      type: NODE_TYPES.SNAPSHOT_NODE,
      sequence: this.globalSequence,
      isAuthoritative: false
    };
  }

  /**
   * Add ARCHIVE_NODE (segment long-terme archivé)
   */
  addArchiveNode(archiveSegment) {
    if (!archiveSegment || !archiveSegment.segmentId) {
      return { added: false, reason: 'INVALID_ARCHIVE_ENTRY' };
    }

    if (this.nodes.size >= this.maxNodes) {
      return { added: false, reason: 'MAX_NODES_EXCEEDED' };
    }

    this.globalSequence++;
    const nodeId = `gnode_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const node = Object.freeze({
      nodeId,
      type: NODE_TYPES.ARCHIVE_NODE,
      timestamp,
      causalParents: Object.freeze([]),
      proofHash: null,
      regionId: archiveSegment.regionId || null,
      sequence: this.globalSequence,
      immutableMetadata: Object.freeze({
        segmentId: archiveSegment.segmentId,
        batchId: archiveSegment.batchId || null,
        rootHash: archiveSegment.rootHash || null,
        entriesCount: archiveSegment.entriesCount || 0,
        compressed: archiveSegment.compressed || false
      }),
      isAuthoritative: false
    });

    this.nodes.set(nodeId, node);
    this._indexNode(node);

    return {
      added: true,
      nodeId,
      type: NODE_TYPES.ARCHIVE_NODE,
      sequence: this.globalSequence,
      isAuthoritative: false
    };
  }

  /**
   * Add REPLAY_NODE (résultat de WAL replay/recovery)
   */
  addReplayNode(replayResult, walEntry) {
    if (!walEntry || !walEntry.entryId) {
      return { added: false, reason: 'INVALID_REPLAY_ENTRY' };
    }

    if (this.nodes.size >= this.maxNodes) {
      return { added: false, reason: 'MAX_NODES_EXCEEDED' };
    }

    this.globalSequence++;
    const nodeId = `gnode_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const node = Object.freeze({
      nodeId,
      type: NODE_TYPES.REPLAY_NODE,
      timestamp,
      causalParents: Object.freeze([]),
      proofHash: null,
      regionId: walEntry.regionId || null,
      sequence: this.globalSequence,
      immutableMetadata: Object.freeze({
        walEntryId: walEntry.entryId,
        entriesReplayed: replayResult && replayResult.entriesReplayed || 0,
        startIndex: replayResult && replayResult.startIndex || 0,
        fromCheckpointId: replayResult && replayResult.checkpointId || null
      }),
      isAuthoritative: false
    });

    this.nodes.set(nodeId, node);
    this._indexNode(node);

    return {
      added: true,
      nodeId,
      type: NODE_TYPES.REPLAY_NODE,
      sequence: this.globalSequence,
      isAuthoritative: false
    };
  }

  /**
   * Add REGION_NODE (nœud cluster régional)
   */
  addRegionNode(regionId, meta = {}) {
    if (!regionId) {
      return { added: false, reason: 'INVALID_REGION_ID' };
    }

    if (this.nodes.size >= this.maxNodes) {
      return { added: false, reason: 'MAX_NODES_EXCEEDED' };
    }

    this.globalSequence++;
    const nodeId = `gnode_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const node = Object.freeze({
      nodeId,
      type: NODE_TYPES.REGION_NODE,
      timestamp,
      causalParents: Object.freeze([]),
      proofHash: null,
      regionId,
      sequence: this.globalSequence,
      immutableMetadata: Object.freeze({
        regionId,
        registeredAt: meta.registeredAt || timestamp,
        isHealthy: meta.isHealthy !== false,
        lagMs: meta.lagMs || 0
      }),
      isAuthoritative: false
    });

    this.nodes.set(nodeId, node);
    this._indexNode(node);

    if (!this.regionIndex.has(regionId)) {
      this.regionIndex.set(regionId, new Set());
    }
    this.regionIndex.get(regionId).add(nodeId);

    return {
      added: true,
      nodeId,
      type: NODE_TYPES.REGION_NODE,
      sequence: this.globalSequence,
      isAuthoritative: false
    };
  }

  /**
   * Add TRANSACTION_NODE (transaction WAL committée)
   */
  addTransactionNode(walEntry) {
    if (!walEntry || !walEntry.transactionId) {
      return { added: false, reason: 'INVALID_TRANSACTION_ENTRY' };
    }

    if (this.nodes.size >= this.maxNodes) {
      return { added: false, reason: 'MAX_NODES_EXCEEDED' };
    }

    this.globalSequence++;
    const nodeId = `gnode_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const node = Object.freeze({
      nodeId,
      type: NODE_TYPES.TRANSACTION_NODE,
      timestamp,
      causalParents: Object.freeze([]),
      proofHash: null,
      regionId: walEntry.regionId || null,
      sequence: this.globalSequence,
      immutableMetadata: Object.freeze({
        transactionId: walEntry.transactionId,
        operationCount: walEntry.operationCount || 0,
        committedAt: walEntry.committedAt || timestamp,
        walEntryId: walEntry.entryId || null
      }),
      isAuthoritative: false
    });

    this.nodes.set(nodeId, node);
    this._indexNode(node);

    return {
      added: true,
      nodeId,
      type: NODE_TYPES.TRANSACTION_NODE,
      sequence: this.globalSequence,
      isAuthoritative: false
    };
  }

  /**
   * Add edge between two nodes (avec validation matrice)
   */
  addEdge(fromNodeId, toNodeId, edgeType, metadata = {}) {
    const fromNode = this.nodes.get(fromNodeId);
    const toNode = this.nodes.get(toNodeId);

    if (!fromNode || !toNode) {
      return { connected: false, reason: 'NODE_NOT_FOUND' };
    }

    const validation = this._validateEdgeType(fromNode.type, toNode.type, edgeType);
    if (!validation.valid) {
      return { connected: false, reason: validation.reason };
    }

    if (this.edges.size >= this.maxEdges) {
      return { connected: false, reason: 'MAX_EDGES_EXCEEDED' };
    }

    const edgeId = `gedge_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const edge = Object.freeze({
      edgeId,
      fromNodeId,
      toNodeId,
      edgeType,
      timestamp,
      metadata: Object.freeze(metadata),
      isAuthoritative: false
    });

    this.edges.set(edgeId, edge);

    this.adjacency.get(fromNodeId).add(edgeId);
    this.reverseAdjacency.get(toNodeId).add(edgeId);

    this.graphMetrics.edgesAdded++;

    return {
      connected: true,
      edgeId,
      edgeType,
      isAuthoritative: false
    };
  }

  /**
   * Get node by ID
   */
  getNode(nodeId) {
    const node = this.nodes.get(nodeId);
    return {
      found: !!node,
      node: node || null,
      isAuthoritative: false
    };
  }

  /**
   * Get causal chain (ancestors)
   */
  getCausalChain(nodeId, maxDepth = 1000) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return { found: false, nodeId, isAuthoritative: false };
    }

    const chain = [];
    const visited = new Set();
    const queue = [nodeId];
    let depth = 0;

    while (queue.length > 0 && depth < maxDepth) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const parentEdges = this.reverseAdjacency.get(current) || new Set();
      for (const edgeId of parentEdges) {
        const edge = this.edges.get(edgeId);
        const parentNode = this.nodes.get(edge.fromNodeId);
        if (parentNode && !visited.has(edge.fromNodeId)) {
          chain.push(parentNode);
          queue.push(edge.fromNodeId);
        }
      }

      depth++;
    }

    this.graphMetrics.traversalsPerformed++;

    if (depth >= maxDepth) {
      this._addAlert({
        type: 'TRAVERSAL_DEPTH_EXCEEDED',
        severity: 'INFO',
        message: `getCausalChain exceeded maxDepth ${maxDepth}`,
        timestamp: new Date().toISOString()
      });
    }

    return {
      found: true,
      nodeId,
      chain,
      depth,
      isAuthoritative: false
    };
  }

  /**
   * Get state lineage (SNAPSHOT → EVENT chain)
   */
  getStateLineage(snapshotId) {
    const snapshotNodes = this.typeIndex.get(NODE_TYPES.SNAPSHOT_NODE) || new Set();
    let snapshotNode = null;

    for (const nid of snapshotNodes) {
      const n = this.nodes.get(nid);
      if (n && n.immutableMetadata.snapshotId === snapshotId) {
        snapshotNode = n;
        break;
      }
    }

    if (!snapshotNode) {
      return { found: false, snapshotId, isAuthoritative: false };
    }

    const lineage = [];
    const visited = new Set([snapshotNode.nodeId]);
    const queue = [snapshotNode];

    while (queue.length > 0) {
      const current = queue.shift();
      const parentEdges = this.reverseAdjacency.get(current.nodeId) || new Set();

      for (const edgeId of parentEdges) {
        const edge = this.edges.get(edgeId);
        if (edge && edge.edgeType === EDGE_TYPES.DERIVED_FROM) {
          const parent = this.nodes.get(edge.fromNodeId);
          if (parent && !visited.has(parent.nodeId)) {
            lineage.push(parent);
            visited.add(parent.nodeId);
            queue.push(parent);
          }
        }
      }
    }

    this.graphMetrics.traversalsPerformed++;

    return {
      found: true,
      snapshotId,
      lineage,
      depth: lineage.length,
      isAuthoritative: false
    };
  }

  /**
   * Get proof path (EVENT → PROOF → QUORUM)
   */
  getProofPath(eventId) {
    const eventNodes = this.typeIndex.get(NODE_TYPES.EVENT_NODE) || new Set();
    let eventNode = null;

    for (const nid of eventNodes) {
      const n = this.nodes.get(nid);
      if (n && n.immutableMetadata.decisionId === eventId) {
        eventNode = n;
        break;
      }
    }

    if (!eventNode) {
      return { found: false, eventId, isAuthoritative: false };
    }

    const path = [eventNode];
    const visited = new Set([eventNode.nodeId]);
    let currentNode = eventNode;
    let quorumNodeId = null;

    while (true) {
      const outEdges = this.adjacency.get(currentNode.nodeId) || new Set();
      let nextNode = null;

      for (const edgeId of outEdges) {
        const edge = this.edges.get(edgeId);
        if (
          (currentNode.type === NODE_TYPES.EVENT_NODE && edge.edgeType === EDGE_TYPES.VALIDATED_BY) ||
          (currentNode.type === NODE_TYPES.PROOF_NODE && edge.edgeType === EDGE_TYPES.ACCEPTED_BY)
        ) {
          const targetNode = this.nodes.get(edge.toNodeId);
          if (targetNode && !visited.has(targetNode.nodeId)) {
            nextNode = targetNode;
            visited.add(targetNode.nodeId);
            if (targetNode.type === NODE_TYPES.QUORUM_NODE) {
              quorumNodeId = targetNode.nodeId;
            }
            break;
          }
        }
      }

      if (!nextNode) break;
      path.push(nextNode);
      currentNode = nextNode;
    }

    this.graphMetrics.traversalsPerformed++;

    return {
      found: true,
      eventId,
      path,
      hasQuorum: !!quorumNodeId,
      quorumNodeId,
      isAuthoritative: false
    };
  }

  /**
   * Get replay dependencies (REPLAY → ARCHIVE → SNAPSHOT)
   */
  getReplayDependencies(replayId) {
    const replayNodes = this.typeIndex.get(NODE_TYPES.REPLAY_NODE) || new Set();
    let replayNode = null;

    for (const nid of replayNodes) {
      const n = this.nodes.get(nid);
      if (n && n.immutableMetadata.walEntryId === replayId) {
        replayNode = n;
        break;
      }
    }

    if (!replayNode) {
      return { found: false, replayId, isAuthoritative: false };
    }

    const dependencies = [];
    const visited = new Set([replayNode.nodeId]);
    const queue = [replayNode];

    while (queue.length > 0) {
      const current = queue.shift();
      const parentEdges = this.reverseAdjacency.get(current.nodeId) || new Set();

      for (const edgeId of parentEdges) {
        const edge = this.edges.get(edgeId);
        if (
          (current.type === NODE_TYPES.REPLAY_NODE && edge.edgeType === EDGE_TYPES.RECONSTRUCTED_FROM) ||
          (current.type === NODE_TYPES.ARCHIVE_NODE && edge.edgeType === EDGE_TYPES.PERSISTED_FROM)
        ) {
          const parent = this.nodes.get(edge.fromNodeId);
          if (parent && !visited.has(parent.nodeId)) {
            dependencies.push(parent);
            visited.add(parent.nodeId);
            queue.push(parent);
          }
        }
      }
    }

    this.graphMetrics.traversalsPerformed++;

    return {
      found: true,
      replayId,
      dependencies,
      isAuthoritative: false
    };
  }

  /**
   * Verify graph consistency
   */
  verifyGraphConsistency() {
    const violations = [];
    const checks = [];

    this.graphMetrics.consistencyChecks++;
    this.graphMetrics.lastConsistencyCheck = new Date().toISOString();

    // Check 1: All nodes frozen
    for (const node of this.nodes.values()) {
      if (!Object.isFrozen(node)) {
        violations.push(`Node ${node.nodeId} not frozen`);
      }
      if (!Object.isFrozen(node.causalParents)) {
        violations.push(`Node ${node.nodeId} causalParents not frozen`);
      }
    }
    checks.push('All nodes frozen');

    // Check 2: All edges frozen
    for (const edge of this.edges.values()) {
      if (!Object.isFrozen(edge)) {
        violations.push(`Edge ${edge.edgeId} not frozen`);
      }
    }
    checks.push('All edges frozen');

    // Check 3: Valid edge types (matrice)
    for (const edge of this.edges.values()) {
      const fromNode = this.nodes.get(edge.fromNodeId);
      const toNode = this.nodes.get(edge.toNodeId);
      if (fromNode && toNode) {
        const validation = this._validateEdgeType(fromNode.type, toNode.type, edge.edgeType);
        if (!validation.valid) {
          violations.push(`Invalid edge ${edge.edgeId}: ${fromNode.type} -${edge.edgeType}-> ${toNode.type}`);
        }
      }
    }
    checks.push('Edge types valid');

    // Check 4: PROOF_NODE proofHash non-null
    const proofNodes = this.typeIndex.get(NODE_TYPES.PROOF_NODE) || new Set();
    for (const nid of proofNodes) {
      const node = this.nodes.get(nid);
      if (!node.proofHash) {
        violations.push(`PROOF_NODE ${nid} missing proofHash`);
      }
    }
    checks.push('PROOF_NODE proofHash present');

    // Check 5: nodesByType counts consistent
    const actualCounts = {};
    for (const [type, nodeSet] of this.typeIndex) {
      actualCounts[type] = nodeSet.size;
    }
    if (JSON.stringify(actualCounts) !== JSON.stringify(this.graphMetrics.nodesByType)) {
      violations.push('nodesByType counts inconsistent');
    }
    checks.push('nodesByType counts consistent');

    return {
      consistent: violations.length === 0,
      checks,
      violations,
      nodesVerified: this.nodes.size,
      edgesVerified: this.edges.size,
      isAuthoritative: false
    };
  }

  /**
   * Reconstruct timeline (range query via temporal index)
   */
  reconstructTimeline(startTs, endTs) {
    const startMs = typeof startTs === 'string' ? new Date(startTs).getTime() : startTs;
    const endMs = typeof endTs === 'string' ? new Date(endTs).getTime() : endTs;

    const nodes = [];
    for (const entry of this.temporalIndex) {
      const nodeTs = typeof entry.ts === 'string' ? new Date(entry.ts).getTime() : entry.ts;
      if (nodeTs >= startMs && nodeTs <= endMs) {
        const node = this.nodes.get(entry.nodeId);
        if (node) nodes.push(node);
      }
    }

    this.graphMetrics.traversalsPerformed++;

    return {
      found: true,
      nodes,
      startTs: new Date(startMs).toISOString(),
      endTs: new Date(endMs).toISOString(),
      count: nodes.length,
      isAuthoritative: false
    };
  }

  /**
   * Get region replication graph
   */
  getRegionReplicationGraph(regionId) {
    const regionNodes = this.regionIndex.get(regionId);
    if (!regionNodes) {
      return { found: false, regionId, isAuthoritative: false };
    }

    const nodes = [];
    const replicationEdges = [];

    for (const nid of regionNodes) {
      const node = this.nodes.get(nid);
      if (node) nodes.push(node);
    }

    for (const nid of regionNodes) {
      const outEdges = this.adjacency.get(nid) || new Set();
      for (const edgeId of outEdges) {
        const edge = this.edges.get(edgeId);
        if (edge && edge.edgeType === EDGE_TYPES.REPLICATED_TO) {
          replicationEdges.push(edge);
        }
      }
    }

    this.graphMetrics.traversalsPerformed++;

    return {
      found: true,
      regionId,
      nodes,
      replicationEdges,
      isAuthoritative: false
    };
  }

  /**
   * Get graph metrics
   */
  getGraphMetrics() {
    return Object.freeze({
      isAuthoritative: false,
      nodesAdded: this.graphMetrics.nodesAdded,
      edgesAdded: this.graphMetrics.edgesAdded,
      nodesByType: { ...this.graphMetrics.nodesByType },
      traversalsPerformed: this.graphMetrics.traversalsPerformed,
      consistencyChecks: this.graphMetrics.consistencyChecks,
      lastConsistencyCheck: this.graphMetrics.lastConsistencyCheck,
      nodeCount: this.nodes.size,
      edgeCount: this.edges.size,
      avgDegree: (this.graphMetrics.edgesAdded / Math.max(this.graphMetrics.nodesAdded, 1)).toFixed(2),
      timestamp: new Date().toISOString(),
      createdAt: this.graphMetrics.createdAt
    });
  }

  /**
   * Check alerts
   */
  checkAlerts() {
    const newAlerts = [];

    if (this.nodes.size > this.maxNodes * 0.9) {
      const alert = Object.freeze({
        type: 'GRAPH_SIZE_HIGH',
        severity: 'WARNING',
        value: this.nodes.size,
        threshold: this.maxNodes * 0.9,
        message: `Graph size ${this.nodes.size} > 90% threshold`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    const consistency = this.verifyGraphConsistency();
    if (consistency.violations.length > 0) {
      const alert = Object.freeze({
        type: 'ORPHAN_NODE_DETECTED',
        severity: 'WARNING',
        value: consistency.violations.length,
        message: `${consistency.violations.length} consistency violations detected`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    return newAlerts;
  }

  /**
   * Get all alerts
   */
  getAllAlerts() {
    return [...this.alerts];
  }

  /**
   * INVARIANT: never authoritative
   */
  isAuthoritative() {
    return false;
  }

  /**
   * Reset state (tests)
   */
  reset() {
    this.nodes.clear();
    this.edges.clear();
    this.adjacency.clear();
    this.reverseAdjacency.clear();
    this.temporalIndex = [];
    this.typeIndex.clear();
    this.regionIndex.clear();
    this.sequenceIndex = [];
    this.globalSequence = 0;
    this.graphMetrics = {
      nodesAdded: 0,
      edgesAdded: 0,
      nodesByType: {},
      traversalsPerformed: 0,
      consistencyChecks: 0,
      lastConsistencyCheck: null,
      createdAt: new Date().toISOString()
    };
    this.alerts = [];
  }

  // ─── INTERNAL METHODS ───

  _indexNode(node) {
    // Update graphMetrics
    this.graphMetrics.nodesAdded++;
    if (!this.graphMetrics.nodesByType[node.type]) {
      this.graphMetrics.nodesByType[node.type] = 0;
    }
    this.graphMetrics.nodesByType[node.type]++;

    // Update typeIndex
    if (!this.typeIndex.has(node.type)) {
      this.typeIndex.set(node.type, new Set());
    }
    this.typeIndex.get(node.type).add(node.nodeId);

    // Update regionIndex if applicable
    if (node.regionId) {
      if (!this.regionIndex.has(node.regionId)) {
        this.regionIndex.set(node.regionId, new Set());
      }
      this.regionIndex.get(node.regionId).add(node.nodeId);
    }

    // Insert into temporalIndex (sorted by timestamp)
    this._insertIntoTemporalIndex(node.timestamp, node.nodeId);

    // Insert into sequenceIndex (sorted by sequence)
    this._insertIntoSequenceIndex(node.sequence, node.nodeId);

    // Initialize adjacency/reverseAdjacency
    this.adjacency.set(node.nodeId, new Set());
    this.reverseAdjacency.set(node.nodeId, new Set());
  }

  _insertIntoTemporalIndex(ts, nodeId) {
    const tsMs = typeof ts === 'string' ? new Date(ts).getTime() : ts;
    let inserted = false;

    for (let i = 0; i < this.temporalIndex.length; i++) {
      const entryMs = typeof this.temporalIndex[i].ts === 'string'
        ? new Date(this.temporalIndex[i].ts).getTime()
        : this.temporalIndex[i].ts;
      if (tsMs < entryMs) {
        this.temporalIndex.splice(i, 0, { ts, nodeId });
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.temporalIndex.push({ ts, nodeId });
    }
  }

  _insertIntoSequenceIndex(seq, nodeId) {
    let inserted = false;

    for (let i = 0; i < this.sequenceIndex.length; i++) {
      if (seq < this.sequenceIndex[i].seq) {
        this.sequenceIndex.splice(i, 0, { seq, nodeId });
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.sequenceIndex.push({ seq, nodeId });
    }
  }

  _validateEdgeType(fromType, toType, edgeType) {
    const validMatrix = {
      [NODE_TYPES.EVENT_NODE]: { [EDGE_TYPES.VALIDATED_BY]: NODE_TYPES.PROOF_NODE },
      [NODE_TYPES.PROOF_NODE]: { [EDGE_TYPES.ACCEPTED_BY]: NODE_TYPES.QUORUM_NODE },
      [NODE_TYPES.SNAPSHOT_NODE]: { [EDGE_TYPES.DERIVED_FROM]: NODE_TYPES.EVENT_NODE },
      [NODE_TYPES.ARCHIVE_NODE]: { [EDGE_TYPES.PERSISTED_FROM]: NODE_TYPES.SNAPSHOT_NODE },
      [NODE_TYPES.REPLAY_NODE]: { [EDGE_TYPES.RECONSTRUCTED_FROM]: NODE_TYPES.ARCHIVE_NODE },
      [NODE_TYPES.REGION_NODE]: { [EDGE_TYPES.REPLICATED_TO]: NODE_TYPES.REGION_NODE },
      [NODE_TYPES.TRANSACTION_NODE]: { [EDGE_TYPES.COMMITTED_INTO]: NODE_TYPES.SNAPSHOT_NODE }
    };

    const edgeTypeMap = validMatrix[fromType];
    if (!edgeTypeMap || edgeTypeMap[edgeType] !== toType) {
      return {
        valid: false,
        reason: `Invalid edge type: ${fromType} -${edgeType}-> ${toType}`
      };
    }

    return { valid: true };
  }

  _addAlert(alert) {
    if (this.alerts.length < this.maxAlerts) {
      this.alerts.push(Object.freeze(alert));
    }
  }
}

module.exports = GlobalMemoryGraph;
module.exports.NODE_TYPES = NODE_TYPES;
module.exports.EDGE_TYPES = EDGE_TYPES;
