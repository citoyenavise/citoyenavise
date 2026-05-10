const crypto = require('crypto');

const CONFLICT_TYPES = Object.freeze({
  DUPLICATE_DECISION_ID: 'DUPLICATE_DECISION_ID',
  TIMESTAMP_SEQUENCE_INVERSION: 'TIMESTAMP_SEQUENCE_INVERSION',
  MISSING_PROOF_LINK: 'MISSING_PROOF_LINK',
  QUORUM_BELOW_THRESHOLD: 'QUORUM_BELOW_THRESHOLD',
  ORPHAN_CAUSAL_CHAIN: 'ORPHAN_CAUSAL_CHAIN'
});

const ALERT_TYPES = Object.freeze({
  TEMPORAL_CONFLICT_DETECTED: 'TEMPORAL_CONFLICT_DETECTED',
  PROOF_COVERAGE_GAP: 'PROOF_COVERAGE_GAP',
  QUORUM_COVERAGE_INCOMPLETE: 'QUORUM_COVERAGE_INCOMPLETE',
  CAUSAL_ORDERING_VIOLATION: 'CAUSAL_ORDERING_VIOLATION'
});

const NODE_TYPES = Object.freeze({
  EVENT_NODE: 'EVENT_NODE',
  PROOF_NODE: 'PROOF_NODE',
  QUORUM_NODE: 'QUORUM_NODE',
  SNAPSHOT_NODE: 'SNAPSHOT_NODE',
  ARCHIVE_NODE: 'ARCHIVE_NODE',
  REPLAY_NODE: 'REPLAY_NODE',
  REGION_NODE: 'REGION_NODE',
  TRANSACTION_NODE: 'TRANSACTION_NODE'
});

const EDGE_TYPES = Object.freeze({
  VALIDATED_BY: 'validated_by',
  ACCEPTED_BY: 'accepted_by',
  DERIVED_FROM: 'derived_from',
  PERSISTED_FROM: 'persisted_from',
  RECONSTRUCTED_FROM: 'reconstructed_from',
  REPLICATED_TO: 'replicated_to',
  COMMITTED_INTO: 'committed_into'
});

class TemporalCausalityEngine {
  constructor(graph, crossRegionSync = null, proofSystem = null, options = {}) {
    this.graph = graph;
    this.crossRegionSync = crossRegionSync;
    this.proofSystem = proofSystem;

    this.maxTraversalDepth = options.maxTraversalDepth || 1000;
    this.conflictWindowMs = options.conflictWindowMs || 5000;
    this.maxAlerts = options.maxAlerts || 1000;

    this.causalityMetrics = {
      traversalsPerformed: 0,
      conflictsDetected: 0,
      consistencyChecks: 0,
      quorumValidations: 0,
      annotatedTimelinesBuilt: 0,
      lastCheckTime: null,
      createdAt: new Date().toISOString()
    };

    this.alerts = [];
  }

  getCausalChain(nodeId, maxDepth = this.maxTraversalDepth) {
    const rawResult = this.graph.getCausalChain(nodeId, maxDepth);

    const enrichedChain = [];
    const rawChain = rawResult.chain || [];

    for (const node of rawChain) {
      let proofStatus = 'NONE';
      let quorumNodeId = null;

      if (node.nodeType === NODE_TYPES.EVENT_NODE) {
        const proofPathResult = this.graph.getProofPath(node.immutableMetadata.decisionId);
        if (proofPathResult && proofPathResult.hasProof) {
          proofStatus = 'PARTIAL';
          if (proofPathResult.hasQuorum) {
            proofStatus = 'FULL';
            quorumNodeId = proofPathResult.quorumNodeId;
          }
        }
      }

      enrichedChain.push(Object.freeze({
        node: node,
        proofStatus: proofStatus,
        quorumNodeId: quorumNodeId
      }));
    }

    this.causalityMetrics.traversalsPerformed++;

    return Object.freeze({
      found: rawResult.found !== false,
      nodeId: nodeId,
      chain: enrichedChain,
      causalDepth: enrichedChain.length,
      isAuthoritative: false
    });
  }

  getStateLineage(snapshotId) {
    const rawLineage = this.graph.getStateLineage(snapshotId);

    if (!rawLineage.found) {
      return Object.freeze({
        found: false,
        snapshotId,
        lineage: [],
        depth: 0,
        fullyCovered: false,
        isAuthoritative: false
      });
    }

    const enrichedLineage = [];
    let fullyCovered = true;

    for (const node of rawLineage.lineage) {
      let proofStatus = 'NONE';
      const regionsCovered = [];

      if (node.nodeType === NODE_TYPES.EVENT_NODE) {
        const proofPathResult = this.graph.getProofPath(node.immutableMetadata.decisionId);
        if (proofPathResult.hasProof) {
          proofStatus = 'PARTIAL';
          if (proofPathResult.hasQuorum) {
            proofStatus = 'FULL';
            if (this.crossRegionSync && proofPathResult.quorumNodeId) {
              const quorumNode = this.graph.nodes?.get(proofPathResult.quorumNodeId);
              if (quorumNode && quorumNode.immutableMetadata?.regions) {
                regionsCovered.push(...quorumNode.immutableMetadata.regions);
              }
            }
          }
        }
      }

      if (proofStatus !== 'FULL') {
        fullyCovered = false;
      }

      enrichedLineage.push(Object.freeze({
        node: node,
        proofStatus: proofStatus,
        regionsCovered: regionsCovered
      }));
    }

    return Object.freeze({
      found: true,
      snapshotId: snapshotId,
      lineage: enrichedLineage,
      depth: enrichedLineage.length,
      fullyCovered: fullyCovered,
      isAuthoritative: false
    });
  }

  getCausalWindow(nodeId, maxDepth = this.maxTraversalDepth) {
    if (!this.graph.nodes.has(nodeId)) {
      return Object.freeze({
        found: false,
        nodeId,
        window: [],
        windowSize: 0,
        depth: 0,
        isAuthoritative: false
      });
    }

    const window = [];
    const visited = new Set();
    const queue = [{ id: nodeId, depth: 0 }];
    let maxDepthReached = 0;

    while (queue.length > 0) {
      const { id, depth } = queue.shift();

      if (visited.has(id)) continue;
      if (depth > maxDepth) continue;

      visited.add(id);
      const node = this.graph.nodes.get(id);
      if (node) {
        window.push(node);
        maxDepthReached = Math.max(maxDepthReached, depth);
      }

      const outEdges = this.graph.adjacency.get(id) || new Set();
      for (const edgeId of outEdges) {
        const edge = this.graph.edges.get(edgeId);
        if (edge && !visited.has(edge.toNodeId)) {
          queue.push({ id: edge.toNodeId, depth: depth + 1 });
        }
      }
    }

    return Object.freeze({
      found: true,
      nodeId: nodeId,
      window: window,
      windowSize: window.length,
      depth: maxDepthReached,
      isAuthoritative: false
    });
  }

  verifyTemporalConsistency(startTs, endTs) {
    const timelineResult = this.graph.reconstructTimeline(startTs, endTs);
    const nodes = timelineResult.nodes || [];

    const sortedNodes = [...nodes].sort((a, b) => a.sequence - b.sequence);

    const violations = [];
    const checks = {
      sequenceMonotonic: true,
      timestampAlignment: true,
      proofCoverage: true,
      proofHashPresent: true,
      quorumAckComplete: true
    };

    // Check 1: Sequence monotonicity
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      if (sortedNodes[i].sequence >= sortedNodes[i + 1].sequence) {
        checks.sequenceMonotonic = false;
        violations.push({
          type: CONFLICT_TYPES.TIMESTAMP_SEQUENCE_INVERSION,
          nodeId: sortedNodes[i + 1].nodeId,
          detail: `Sequence not monotonic: ${sortedNodes[i].sequence} >= ${sortedNodes[i + 1].sequence}`,
          severity: 'WARNING'
        });
        break;
      }
    }

    // Check 2: Timestamp/sequence alignment
    for (let i = 0; i < sortedNodes.length - 1; i++) {
      const tsA = new Date(sortedNodes[i].timestamp).getTime();
      const tsB = new Date(sortedNodes[i + 1].timestamp).getTime();
      if (tsA > tsB + this.conflictWindowMs) {
        checks.timestampAlignment = false;
        violations.push({
          type: CONFLICT_TYPES.TIMESTAMP_SEQUENCE_INVERSION,
          nodeId: sortedNodes[i + 1].nodeId,
          detail: `Timestamp/sequence inversion: seq[${i}]<seq[${i+1}] but ts[${i}]>ts[${i+1}]`,
          severity: 'WARNING'
        });
        break;
      }
    }

    // Check 3: EVENT_NODE proof coverage
    for (const node of sortedNodes) {
      if (node.nodeType === NODE_TYPES.EVENT_NODE) {
        const outEdges = this.graph.adjacency.get(node.nodeId) || new Set();
        let hasProof = false;
        for (const edgeId of outEdges) {
          const edge = this.graph.edges.get(edgeId);
          if (edge && edge.edgeType === EDGE_TYPES.VALIDATED_BY) {
            hasProof = true;
            break;
          }
        }
        if (!hasProof) {
          checks.proofCoverage = false;
          violations.push({
            type: CONFLICT_TYPES.MISSING_PROOF_LINK,
            nodeId: node.nodeId,
            detail: `EVENT_NODE without VALIDATED_BY edge`,
            severity: 'WARNING'
          });
        }
      }
    }

    // Check 4: PROOF_NODE hash non-null
    for (const node of sortedNodes) {
      if (node.nodeType === NODE_TYPES.PROOF_NODE) {
        if (!node.immutableMetadata || !node.immutableMetadata.proofHash) {
          checks.proofHashPresent = false;
          violations.push({
            type: CONFLICT_TYPES.MISSING_PROOF_LINK,
            nodeId: node.nodeId,
            detail: `PROOF_NODE with null or missing proofHash`,
            severity: 'WARNING'
          });
        }
      }
    }

    // Check 5: QUORUM_NODE ackCount
    for (const node of sortedNodes) {
      if (node.nodeType === NODE_TYPES.QUORUM_NODE) {
        const meta = node.immutableMetadata || {};
        if (meta.ackCount === undefined || meta.requiredAcks === undefined) {
          checks.quorumAckComplete = false;
          violations.push({
            type: CONFLICT_TYPES.QUORUM_BELOW_THRESHOLD,
            nodeId: node.nodeId,
            detail: `QUORUM_NODE missing ackCount or requiredAcks`,
            severity: 'WARNING'
          });
        } else if (meta.ackCount < meta.requiredAcks) {
          checks.quorumAckComplete = false;
          violations.push({
            type: CONFLICT_TYPES.QUORUM_BELOW_THRESHOLD,
            nodeId: node.nodeId,
            detail: `QUORUM_NODE ackCount (${meta.ackCount}) < requiredAcks (${meta.requiredAcks})`,
            severity: 'WARNING'
          });
        }
      }
    }

    const checksPassedCount = Object.values(checks).filter(v => v === true).length;
    const consistencyScore = checksPassedCount / 5;
    const consistent = checksPassedCount === 5;

    this.causalityMetrics.consistencyChecks++;

    return Object.freeze({
      consistent: consistent,
      consistencyScore: consistencyScore,
      checks: Object.freeze(checks),
      violations: violations,
      nodesAnalyzed: nodes.length,
      isAuthoritative: false
    });
  }

  getQuorumImpact(eventId) {
    let eventNode = null;
    const eventNodeSet = this.graph.typeIndex.get(NODE_TYPES.EVENT_NODE) || new Set();

    for (const nodeId of eventNodeSet) {
      const node = this.graph.nodes.get(nodeId);
      if (node && node.immutableMetadata && node.immutableMetadata.decisionId === eventId) {
        eventNode = node;
        break;
      }
    }

    if (!eventNode) {
      return Object.freeze({
        found: false,
        eventId,
        hasQuorum: false,
        quorumNodeId: null,
        ackCount: 0,
        requiredAcks: 0,
        regionsAcknowledged: [],
        coverageRatio: 0,
        impactScore: 0,
        isAuthoritative: false
      });
    }

    const proofPathResult = this.graph.getProofPath(eventId);

    if (!proofPathResult.hasQuorum) {
      return Object.freeze({
        found: true,
        eventId,
        hasQuorum: false,
        quorumNodeId: null,
        ackCount: 0,
        requiredAcks: 0,
        regionsAcknowledged: [],
        coverageRatio: 0,
        impactScore: 0,
        isAuthoritative: false
      });
    }

    const quorumNode = this.graph.nodes.get(proofPathResult.quorumNodeId);
    const meta = quorumNode?.immutableMetadata || {};
    const regions = meta.regions || [];
    const ackCount = meta.ackCount || 0;
    const requiredAcks = meta.requiredAcks || 1;

    const coverageRatio = regions.length > 0 ? ackCount / regions.length : 0;
    const impactScore = (ackCount / requiredAcks) * coverageRatio;

    this.causalityMetrics.quorumValidations++;

    return Object.freeze({
      found: true,
      eventId,
      hasQuorum: true,
      quorumNodeId: proofPathResult.quorumNodeId,
      ackCount,
      requiredAcks,
      regionsAcknowledged: regions,
      coverageRatio: coverageRatio,
      impactScore: Math.min(impactScore, 1.0),
      isAuthoritative: false
    });
  }

  detectTemporalConflicts() {
    const conflicts = [];
    const conflictsByType = {};

    // DUPLICATE_DECISION_ID
    const eventNodeSet = this.graph.typeIndex.get(NODE_TYPES.EVENT_NODE) || new Set();
    const decisionIdMap = new Map();

    for (const nodeId of eventNodeSet) {
      const node = this.graph.nodes.get(nodeId);
      if (node && node.immutableMetadata && node.immutableMetadata.decisionId) {
        const decisionId = node.immutableMetadata.decisionId;
        if (!decisionIdMap.has(decisionId)) {
          decisionIdMap.set(decisionId, []);
        }
        decisionIdMap.get(decisionId).push(node);
      }
    }

    for (const [decisionId, nodes] of decisionIdMap.entries()) {
      if (nodes.length > 1) {
        const timestamps = nodes.map(n => new Date(n.timestamp).getTime());
        const uniqueTimestamps = new Set(timestamps);
        if (uniqueTimestamps.size > 1) {
          conflicts.push({
            type: CONFLICT_TYPES.DUPLICATE_DECISION_ID,
            nodeId: nodes[0].nodeId,
            detail: `Duplicate decisionId ${decisionId} with different timestamps`,
            severity: 'CRITICAL'
          });
          conflictsByType[CONFLICT_TYPES.DUPLICATE_DECISION_ID] = (conflictsByType[CONFLICT_TYPES.DUPLICATE_DECISION_ID] || 0) + 1;
        }
      }
    }

    // TIMESTAMP_SEQUENCE_INVERSION
    const sortedBySeq = [...(this.graph.sequenceIndex || [])];
    for (let i = 0; i < sortedBySeq.length - 1; i++) {
      const nodeA = this.graph.nodes.get(sortedBySeq[i].nodeId);
      const nodeB = this.graph.nodes.get(sortedBySeq[i + 1].nodeId);

      if (nodeA && nodeB) {
        const tsA = new Date(nodeA.timestamp).getTime();
        const tsB = new Date(nodeB.timestamp).getTime();
        if (tsA > tsB + this.conflictWindowMs) {
          conflicts.push({
            type: CONFLICT_TYPES.TIMESTAMP_SEQUENCE_INVERSION,
            nodeId: nodeB.nodeId,
            detail: `Timestamp inversion: seq[${i}]<seq[${i+1}] but ts[${i}]>ts[${i+1}]`,
            severity: 'WARNING'
          });
          conflictsByType[CONFLICT_TYPES.TIMESTAMP_SEQUENCE_INVERSION] = (conflictsByType[CONFLICT_TYPES.TIMESTAMP_SEQUENCE_INVERSION] || 0) + 1;
          break;
        }
      }
    }

    // MISSING_PROOF_LINK
    for (const nodeId of eventNodeSet) {
      const node = this.graph.nodes.get(nodeId);
      if (node) {
        const outEdges = this.graph.adjacency.get(nodeId) || new Set();
        let hasProof = false;
        for (const edgeId of outEdges) {
          const edge = this.graph.edges.get(edgeId);
          if (edge && edge.edgeType === EDGE_TYPES.VALIDATED_BY) {
            hasProof = true;
            break;
          }
        }
        if (!hasProof) {
          conflicts.push({
            type: CONFLICT_TYPES.MISSING_PROOF_LINK,
            nodeId: nodeId,
            detail: `EVENT_NODE without VALIDATED_BY edge`,
            severity: 'WARNING'
          });
          conflictsByType[CONFLICT_TYPES.MISSING_PROOF_LINK] = (conflictsByType[CONFLICT_TYPES.MISSING_PROOF_LINK] || 0) + 1;
        }
      }
    }

    // QUORUM_BELOW_THRESHOLD
    const quorumNodeSet = this.graph.typeIndex.get(NODE_TYPES.QUORUM_NODE) || new Set();
    for (const nodeId of quorumNodeSet) {
      const node = this.graph.nodes.get(nodeId);
      if (node && node.immutableMetadata) {
        const { ackCount = 0, requiredAcks = 1 } = node.immutableMetadata;
        if (ackCount < requiredAcks) {
          conflicts.push({
            type: CONFLICT_TYPES.QUORUM_BELOW_THRESHOLD,
            nodeId: nodeId,
            detail: `QUORUM_NODE ackCount (${ackCount}) < requiredAcks (${requiredAcks})`,
            severity: 'WARNING'
          });
          conflictsByType[CONFLICT_TYPES.QUORUM_BELOW_THRESHOLD] = (conflictsByType[CONFLICT_TYPES.QUORUM_BELOW_THRESHOLD] || 0) + 1;
        }
      }
    }

    this.causalityMetrics.conflictsDetected += conflicts.length;

    return Object.freeze({
      conflictsFound: conflicts.length > 0,
      conflicts: conflicts,
      totalConflicts: conflicts.length,
      byType: Object.freeze(conflictsByType),
      isAuthoritative: false
    });
  }

  getAnnotatedTimeline(startTs, endTs) {
    const timelineResult = this.graph.reconstructTimeline(startTs, endTs);
    const nodes = timelineResult.nodes || [];

    const sortedNodes = [...nodes].sort((a, b) => a.sequence - b.sequence);
    const annotatedNodes = [];
    let proofCoveredCount = 0;
    let quorumCoveredCount = 0;

    for (const node of sortedNodes) {
      let proofStatus = 'NONE';
      let hasQuorum = false;
      let causalDepth = 0;

      if (node.nodeType === NODE_TYPES.EVENT_NODE) {
        const proofPathResult = this.graph.getProofPath(node.immutableMetadata.decisionId);
        if (proofPathResult.hasProof) {
          proofStatus = 'PARTIAL';
          proofCoveredCount++;
          if (proofPathResult.hasQuorum) {
            proofStatus = 'FULL';
            hasQuorum = true;
            quorumCoveredCount++;
          }
        }
      }

      const causalChainResult = this.graph.getCausalChain(node.nodeId);
      causalDepth = causalChainResult.chain ? causalChainResult.chain.length : 0;

      annotatedNodes.push(Object.freeze({
        node: node,
        proofStatus: proofStatus,
        hasQuorum: hasQuorum,
        causalDepth: causalDepth
      }));
    }

    const proofCoverageRatio = nodes.length > 0 ? proofCoveredCount / nodes.length : 0;
    const quorumRatio = nodes.length > 0 ? quorumCoveredCount / nodes.length : 0;

    const nodesByType = {};
    for (const node of nodes) {
      nodesByType[node.nodeType] = (nodesByType[node.nodeType] || 0) + 1;
    }

    this.causalityMetrics.annotatedTimelinesBuilt++;

    return Object.freeze({
      found: true,
      startTs: startTs,
      endTs: endTs,
      annotatedNodes: annotatedNodes,
      count: nodes.length,
      timelineStats: Object.freeze({
        nodesByType: Object.freeze(nodesByType),
        proofCoverageRatio: proofCoverageRatio,
        quorumRatio: quorumRatio
      }),
      isAuthoritative: false
    });
  }

  getRegionCoverage(startTs, endTs) {
    const quorumNodeSet = this.graph.typeIndex.get(NODE_TYPES.QUORUM_NODE) || new Set();
    const quorumsByTimestamp = [];
    let totalQuorumCount = 0;

    for (const nodeId of quorumNodeSet) {
      const node = this.graph.nodes.get(nodeId);
      if (node) {
        const nodeTs = new Date(node.timestamp).getTime();
        const startMs = new Date(startTs).getTime();
        const endMs = new Date(endTs).getTime();

        if (nodeTs >= startMs && nodeTs <= endMs) {
          quorumsByTimestamp.push(node);
          totalQuorumCount++;
        }
      }
    }

    const regionCounts = new Map();
    const regionTotals = new Map();
    let totalRegions = new Set();

    for (const quorum of quorumsByTimestamp) {
      const regions = quorum.immutableMetadata?.regions || [];
      for (const region of regions) {
        totalRegions.add(region);
        regionTotals.set(region, (regionTotals.get(region) || 0) + 1);
        if (quorum.immutableMetadata?.ackCount >= quorum.immutableMetadata?.requiredAcks) {
          regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
        }
      }
    }

    const coverageByRegion = {};
    for (const region of totalRegions) {
      const ackCount = regionCounts.get(region) || 0;
      const totalCount = regionTotals.get(region) || 0;
      coverageByRegion[region] = totalCount > 0 ? ackCount / totalCount : 0;
    }

    const missingRegions = [];
    if (this.crossRegionSync && this.crossRegionSync.regions) {
      for (const regionId of this.crossRegionSync.regions.keys()) {
        if (!totalRegions.has(regionId)) {
          missingRegions.push(regionId);
        }
      }
    }

    const overallCoverage = totalRegions.size > 0
      ? Array.from(totalRegions).reduce((sum, r) => sum + (coverageByRegion[r] || 0), 0) / totalRegions.size
      : 0;

    return Object.freeze({
      startTs: startTs,
      endTs: endTs,
      quorumCount: totalQuorumCount,
      coverageByRegion: Object.freeze(coverageByRegion),
      overallCoverage: overallCoverage,
      missingRegions: missingRegions,
      isAuthoritative: false
    });
  }

  getMetrics() {
    return Object.freeze({
      traversalsPerformed: this.causalityMetrics.traversalsPerformed,
      conflictsDetected: this.causalityMetrics.conflictsDetected,
      consistencyChecks: this.causalityMetrics.consistencyChecks,
      quorumValidations: this.causalityMetrics.quorumValidations,
      annotatedTimelinesBuilt: this.causalityMetrics.annotatedTimelinesBuilt,
      lastCheckTime: this.causalityMetrics.lastCheckTime,
      timestamp: new Date().toISOString(),
      createdAt: this.causalityMetrics.createdAt,
      isAuthoritative: false
    });
  }

  checkAlerts() {
    const newAlerts = [];
    const lastAlertCount = this.alerts.length;

    const conflictResult = this.detectTemporalConflicts();
    if (conflictResult.conflictsFound) {
      newAlerts.push({
        type: ALERT_TYPES.TEMPORAL_CONFLICT_DETECTED,
        severity: 'CRITICAL',
        message: `${conflictResult.totalConflicts} temporal conflicts detected`,
        timestamp: new Date().toISOString(),
        details: conflictResult.byType
      });
    }

    for (const conflict of conflictResult.conflicts) {
      if (conflict.type === CONFLICT_TYPES.TIMESTAMP_SEQUENCE_INVERSION) {
        newAlerts.push({
          type: ALERT_TYPES.CAUSAL_ORDERING_VIOLATION,
          severity: 'WARNING',
          message: `Causal ordering violation detected`,
          timestamp: new Date().toISOString()
        });
        break;
      }
    }

    this.alerts.push(...newAlerts);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    return newAlerts;
  }

  getAllAlerts() {
    return Object.freeze([...this.alerts]);
  }

  isAuthoritative() {
    return false;
  }

  reset() {
    this.causalityMetrics = {
      traversalsPerformed: 0,
      conflictsDetected: 0,
      consistencyChecks: 0,
      quorumValidations: 0,
      annotatedTimelinesBuilt: 0,
      lastCheckTime: null,
      createdAt: new Date().toISOString()
    };
    this.alerts = [];
  }
}

module.exports = TemporalCausalityEngine;
module.exports.CONFLICT_TYPES = CONFLICT_TYPES;
module.exports.ALERT_TYPES = ALERT_TYPES;
module.exports.NODE_TYPES = NODE_TYPES;
module.exports.EDGE_TYPES = EDGE_TYPES;
