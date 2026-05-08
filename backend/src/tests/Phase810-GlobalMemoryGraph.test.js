/**
 * Phase810-GlobalMemoryGraph.test.js
 * PHASE 8.1 — Tests complets pour GlobalMemoryGraph
 * 50 tests vanilla async, 6 sections
 */

const assert = require('assert');
const GlobalMemoryGraph = require('../core/governance/enforcement/GlobalMemoryGraph');
const { NODE_TYPES, EDGE_TYPES } = require('../core/governance/enforcement/GlobalMemoryGraph');

let testResults = { passed: 0, failed: 0, errors: [] };

// ─── SECTION 1: Node Insertion & Lookup (12 tests) ───

async function test101_AddEventNode() {
  console.log('\n=== TEST 101: GlobalMemoryGraph — Add EVENT_NODE ===');
  try {
    const graph = new GlobalMemoryGraph();
    const result = graph.addEventNode({
      decisionId: 'dec_1',
      module: 'RealTime',
      action: 'CAPTURE',
      decision: { valid: true },
      latencyMs: 5,
      severity: 'INFO'
    });
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.type, NODE_TYPES.EVENT_NODE);
    assert.ok(result.nodeId);
    assert.strictEqual(result.isAuthoritative, false);
    const node = graph.getNode(result.nodeId).node;
    assert.ok(Object.isFrozen(node));
    console.log(`✅ EVENT_NODE created and frozen: ${result.nodeId}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 101: ${error.message}`);
    throw error;
  }
}

async function test102_AddProofNode() {
  console.log('\n=== TEST 102: GlobalMemoryGraph — Add PROOF_NODE ===');
  try {
    const graph = new GlobalMemoryGraph();
    const result = graph.addProofNode(
      { valid: true },
      { proofHash: 'h1', previousHash: 'h0', entriesVerified: 10 }
    );
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.type, NODE_TYPES.PROOF_NODE);
    const node = graph.getNode(result.nodeId).node;
    assert.strictEqual(node.proofHash, 'h1');
    assert.ok(Object.isFrozen(node));
    console.log(`✅ PROOF_NODE created with proofHash: h1`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 102: ${error.message}`);
    throw error;
  }
}

async function test103_AddQuorumNode() {
  console.log('\n=== TEST 103: GlobalMemoryGraph — Add QUORUM_NODE ===');
  try {
    const graph = new GlobalMemoryGraph();
    const result = graph.addQuorumNode({
      consensusId: 'cons_1',
      requiredAcks: 2,
      ackCount: 2,
      regions: ['EU', 'US']
    });
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.type, NODE_TYPES.QUORUM_NODE);
    const node = graph.getNode(result.nodeId).node;
    assert.strictEqual(node.immutableMetadata.ackCount, 2);
    assert.ok(Object.isFrozen(node.immutableMetadata.regions));
    console.log(`✅ QUORUM_NODE created with ackCount=2`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 103: ${error.message}`);
    throw error;
  }
}

async function test104_AddSnapshotNode() {
  console.log('\n=== TEST 104: GlobalMemoryGraph — Add SNAPSHOT_NODE ===');
  try {
    const graph = new GlobalMemoryGraph();
    const result = graph.addSnapshotNode({
      snapshotId: 'snap_1',
      archiveSize: 1024,
      totalEntries: 100,
      takenAt: new Date().toISOString()
    });
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.type, NODE_TYPES.SNAPSHOT_NODE);
    const node = graph.getNode(result.nodeId).node;
    assert.strictEqual(node.immutableMetadata.snapshotId, 'snap_1');
    console.log(`✅ SNAPSHOT_NODE created with snapshotId: snap_1`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 104: ${error.message}`);
    throw error;
  }
}

async function test105_AddArchiveNode() {
  console.log('\n=== TEST 105: GlobalMemoryGraph — Add ARCHIVE_NODE ===');
  try {
    const graph = new GlobalMemoryGraph();
    const result = graph.addArchiveNode({
      segmentId: 'seg_1',
      batchId: 'batch_1',
      rootHash: 'rh1',
      entriesCount: 500
    });
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.type, NODE_TYPES.ARCHIVE_NODE);
    const node = graph.getNode(result.nodeId).node;
    assert.strictEqual(node.immutableMetadata.segmentId, 'seg_1');
    console.log(`✅ ARCHIVE_NODE created with segmentId: seg_1`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 105: ${error.message}`);
    throw error;
  }
}

async function test106_AddReplayNode() {
  console.log('\n=== TEST 106: GlobalMemoryGraph — Add REPLAY_NODE ===');
  try {
    const graph = new GlobalMemoryGraph();
    const result = graph.addReplayNode(
      { entriesReplayed: 20, startIndex: 0, checkpointId: 'ckpt_1' },
      { entryId: 'wal_1', regionId: 'EU' }
    );
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.type, NODE_TYPES.REPLAY_NODE);
    const node = graph.getNode(result.nodeId).node;
    assert.strictEqual(node.immutableMetadata.entriesReplayed, 20);
    console.log(`✅ REPLAY_NODE created with entriesReplayed=20`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 106: ${error.message}`);
    throw error;
  }
}

async function test107_AddRegionNode() {
  console.log('\n=== TEST 107: GlobalMemoryGraph — Add REGION_NODE ===');
  try {
    const graph = new GlobalMemoryGraph();
    const result = graph.addRegionNode('EU', { isHealthy: true, lagMs: 50 });
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.type, NODE_TYPES.REGION_NODE);
    const node = graph.getNode(result.nodeId).node;
    assert.strictEqual(node.regionId, 'EU');
    assert.ok(graph.regionIndex.has('EU'));
    console.log(`✅ REGION_NODE created for EU region`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 107: ${error.message}`);
    throw error;
  }
}

async function test108_AddTransactionNode() {
  console.log('\n=== TEST 108: GlobalMemoryGraph — Add TRANSACTION_NODE ===');
  try {
    const graph = new GlobalMemoryGraph();
    const result = graph.addTransactionNode({
      transactionId: 'txn_1',
      operationCount: 5,
      entryId: 'wal_ent_1'
    });
    assert.strictEqual(result.added, true);
    assert.strictEqual(result.type, NODE_TYPES.TRANSACTION_NODE);
    const node = graph.getNode(result.nodeId).node;
    assert.strictEqual(node.immutableMetadata.operationCount, 5);
    console.log(`✅ TRANSACTION_NODE created with operationCount=5`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 108: ${error.message}`);
    throw error;
  }
}

async function test109_GetNodeFound() {
  console.log('\n=== TEST 109: GlobalMemoryGraph — Get Node Found ===');
  try {
    const graph = new GlobalMemoryGraph();
    const addResult = graph.addEventNode({ decisionId: 'dec_1' });
    const getResult = graph.getNode(addResult.nodeId);
    assert.strictEqual(getResult.found, true);
    assert.ok(getResult.node);
    assert.strictEqual(getResult.node.nodeId, addResult.nodeId);
    console.log(`✅ Node retrieved successfully: ${addResult.nodeId}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 109: ${error.message}`);
    throw error;
  }
}

async function test110_GetNodeNotFound() {
  console.log('\n=== TEST 110: GlobalMemoryGraph — Get Node Not Found ===');
  try {
    const graph = new GlobalMemoryGraph();
    const result = graph.getNode('nonexistent_id');
    assert.strictEqual(result.found, false);
    assert.strictEqual(result.node, null);
    console.log(`✅ Non-existent node returns found: false`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 110: ${error.message}`);
    throw error;
  }
}

async function test111_NodeImmutability() {
  console.log('\n=== TEST 111: GlobalMemoryGraph — Node Immutability ===');
  try {
    const graph = new GlobalMemoryGraph();
    const addResult = graph.addEventNode({ decisionId: 'dec_1' });
    const node = graph.getNode(addResult.nodeId).node;
    assert.ok(Object.isFrozen(node));
    assert.ok(Object.isFrozen(node.causalParents));
    assert.ok(Object.isFrozen(node.immutableMetadata));
    console.log(`✅ Node and nested structures are frozen`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 111: ${error.message}`);
    throw error;
  }
}

async function test112_GlobalSequenceMonotonic() {
  console.log('\n=== TEST 112: GlobalMemoryGraph — Global Sequence Monotonic ===');
  try {
    const graph = new GlobalMemoryGraph();
    const r1 = graph.addEventNode({ decisionId: 'dec_1' });
    const r2 = graph.addEventNode({ decisionId: 'dec_2' });
    const r3 = graph.addEventNode({ decisionId: 'dec_3' });
    assert.ok(r1.sequence < r2.sequence);
    assert.ok(r2.sequence < r3.sequence);
    assert.strictEqual(r3.sequence, 3);
    console.log(`✅ Global sequence monotonic: ${r1.sequence} < ${r2.sequence} < ${r3.sequence}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 112: ${error.message}`);
    throw error;
  }
}

// ─── SECTION 2: Edge Management (8 tests) ───

async function test113_AddEdgeEventToProof() {
  console.log('\n=== TEST 113: GlobalMemoryGraph — Edge EVENT→PROOF ===');
  try {
    const graph = new GlobalMemoryGraph();
    const eventResult = graph.addEventNode({ decisionId: 'dec_1' });
    const proofResult = graph.addProofNode({ valid: true }, { proofHash: 'h1' });
    const edgeResult = graph.addEdge(eventResult.nodeId, proofResult.nodeId, EDGE_TYPES.VALIDATED_BY);
    assert.strictEqual(edgeResult.connected, true);
    assert.strictEqual(edgeResult.edgeType, EDGE_TYPES.VALIDATED_BY);
    console.log(`✅ Edge EVENT→PROOF created: ${edgeResult.edgeId}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 113: ${error.message}`);
    throw error;
  }
}

async function test114_AddEdgeProofToQuorum() {
  console.log('\n=== TEST 114: GlobalMemoryGraph — Edge PROOF→QUORUM ===');
  try {
    const graph = new GlobalMemoryGraph();
    const proofResult = graph.addProofNode({ valid: true }, { proofHash: 'h1' });
    const quorumResult = graph.addQuorumNode({ consensusId: 'c1', requiredAcks: 2, ackCount: 2 });
    const edgeResult = graph.addEdge(proofResult.nodeId, quorumResult.nodeId, EDGE_TYPES.ACCEPTED_BY);
    assert.strictEqual(edgeResult.connected, true);
    assert.strictEqual(edgeResult.edgeType, EDGE_TYPES.ACCEPTED_BY);
    console.log(`✅ Edge PROOF→QUORUM created: ${edgeResult.edgeId}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 114: ${error.message}`);
    throw error;
  }
}

async function test115_AddEdgeSnapshotToEvent() {
  console.log('\n=== TEST 115: GlobalMemoryGraph — Edge SNAPSHOT→EVENT ===');
  try {
    const graph = new GlobalMemoryGraph();
    const eventResult = graph.addEventNode({ decisionId: 'dec_1' });
    const snapResult = graph.addSnapshotNode({ snapshotId: 'snap_1' });
    const edgeResult = graph.addEdge(snapResult.nodeId, eventResult.nodeId, EDGE_TYPES.DERIVED_FROM);
    assert.strictEqual(edgeResult.connected, true);
    assert.strictEqual(edgeResult.edgeType, EDGE_TYPES.DERIVED_FROM);
    console.log(`✅ Edge SNAPSHOT→EVENT created: ${edgeResult.edgeId}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 115: ${error.message}`);
    throw error;
  }
}

async function test116_AddEdgeArchiveToSnapshot() {
  console.log('\n=== TEST 116: GlobalMemoryGraph — Edge ARCHIVE→SNAPSHOT ===');
  try {
    const graph = new GlobalMemoryGraph();
    const snapResult = graph.addSnapshotNode({ snapshotId: 'snap_1' });
    const archResult = graph.addArchiveNode({ segmentId: 'seg_1' });
    const edgeResult = graph.addEdge(archResult.nodeId, snapResult.nodeId, EDGE_TYPES.PERSISTED_FROM);
    assert.strictEqual(edgeResult.connected, true);
    assert.strictEqual(edgeResult.edgeType, EDGE_TYPES.PERSISTED_FROM);
    console.log(`✅ Edge ARCHIVE→SNAPSHOT created: ${edgeResult.edgeId}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 116: ${error.message}`);
    throw error;
  }
}

async function test117_AddEdgeRegionToRegion() {
  console.log('\n=== TEST 117: GlobalMemoryGraph — Edge REGION→REGION ===');
  try {
    const graph = new GlobalMemoryGraph();
    const r1 = graph.addRegionNode('EU');
    const r2 = graph.addRegionNode('US');
    const edgeResult = graph.addEdge(r1.nodeId, r2.nodeId, EDGE_TYPES.REPLICATED_TO);
    assert.strictEqual(edgeResult.connected, true);
    assert.strictEqual(edgeResult.edgeType, EDGE_TYPES.REPLICATED_TO);
    console.log(`✅ Edge REGION→REGION created: ${edgeResult.edgeId}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 117: ${error.message}`);
    throw error;
  }
}

async function test118_AddEdgeInvalidType() {
  console.log('\n=== TEST 118: GlobalMemoryGraph — Edge Invalid Type Rejected ===');
  try {
    const graph = new GlobalMemoryGraph();
    const event = graph.addEventNode({ decisionId: 'dec_1' });
    const snap = graph.addSnapshotNode({ snapshotId: 'snap_1' });
    const edgeResult = graph.addEdge(event.nodeId, snap.nodeId, EDGE_TYPES.VALIDATED_BY);
    assert.strictEqual(edgeResult.connected, false);
    assert.ok(edgeResult.reason);
    console.log(`✅ Invalid edge rejected with reason: ${edgeResult.reason}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 118: ${error.message}`);
    throw error;
  }
}

async function test119_AddEdgeUnknownNode() {
  console.log('\n=== TEST 119: GlobalMemoryGraph — Edge Unknown Node Rejected ===');
  try {
    const graph = new GlobalMemoryGraph();
    const event = graph.addEventNode({ decisionId: 'dec_1' });
    const edgeResult = graph.addEdge(event.nodeId, 'nonexistent', EDGE_TYPES.VALIDATED_BY);
    assert.strictEqual(edgeResult.connected, false);
    assert.strictEqual(edgeResult.reason, 'NODE_NOT_FOUND');
    console.log(`✅ Edge with unknown node rejected`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 119: ${error.message}`);
    throw error;
  }
}

async function test120_EdgeImmutability() {
  console.log('\n=== TEST 120: GlobalMemoryGraph — Edge Immutability ===');
  try {
    const graph = new GlobalMemoryGraph();
    const e1 = graph.addEventNode({ decisionId: 'dec_1' });
    const e2 = graph.addProofNode({ valid: true }, { proofHash: 'h1' });
    const edgeResult = graph.addEdge(e1.nodeId, e2.nodeId, EDGE_TYPES.VALIDATED_BY);
    const edge = graph.edges.get(edgeResult.edgeId);
    assert.ok(Object.isFrozen(edge));
    assert.ok(Object.isFrozen(edge.metadata));
    console.log(`✅ Edge and metadata frozen`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 120: ${error.message}`);
    throw error;
  }
}

// ─── SECTION 3: Causal Navigation APIs (10 tests) ───

async function test121_GetCausalChain() {
  console.log('\n=== TEST 121: GlobalMemoryGraph — Get Causal Chain ===');
  try {
    const graph = new GlobalMemoryGraph();
    const e1 = graph.addEventNode({ decisionId: 'dec_1' });
    const e2 = graph.addProofNode({ valid: true }, { proofHash: 'h1' });
    graph.addEdge(e1.nodeId, e2.nodeId, EDGE_TYPES.VALIDATED_BY);
    const result = graph.getCausalChain(e2.nodeId);
    assert.strictEqual(result.found, true);
    assert.ok(Array.isArray(result.chain));
    assert.ok(result.chain.length > 0);
    console.log(`✅ Causal chain returned: ${result.chain.length} ancestors`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 121: ${error.message}`);
    throw error;
  }
}

async function test122_GetCausalChainRootNode() {
  console.log('\n=== TEST 122: GlobalMemoryGraph — Causal Chain Root Node ===');
  try {
    const graph = new GlobalMemoryGraph();
    const root = graph.addEventNode({ decisionId: 'dec_1' });
    const result = graph.getCausalChain(root.nodeId);
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.chain.length, 0);
    console.log(`✅ Root node has empty causal chain`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 122: ${error.message}`);
    throw error;
  }
}

async function test123_GetStateLineage() {
  console.log('\n=== TEST 123: GlobalMemoryGraph — Get State Lineage ===');
  try {
    const graph = new GlobalMemoryGraph();
    const event = graph.addEventNode({ decisionId: 'dec_1' });
    const snap = graph.addSnapshotNode({ snapshotId: 'snap_1' });
    graph.addEdge(snap.nodeId, event.nodeId, EDGE_TYPES.DERIVED_FROM);
    const result = graph.getStateLineage('snap_1');
    assert.strictEqual(result.found, true);
    assert.ok(Array.isArray(result.lineage));
    console.log(`✅ State lineage retrieved: ${result.lineage.length} nodes`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 123: ${error.message}`);
    throw error;
  }
}

async function test124_GetProofPathFull() {
  console.log('\n=== TEST 124: GlobalMemoryGraph — Get Proof Path Full ===');
  try {
    const graph = new GlobalMemoryGraph();
    const event = graph.addEventNode({ decisionId: 'dec_1' });
    const proof = graph.addProofNode({ valid: true }, { proofHash: 'h1' });
    const quorum = graph.addQuorumNode({ consensusId: 'c1', requiredAcks: 2, ackCount: 2 });
    graph.addEdge(event.nodeId, proof.nodeId, EDGE_TYPES.VALIDATED_BY);
    graph.addEdge(proof.nodeId, quorum.nodeId, EDGE_TYPES.ACCEPTED_BY);
    const result = graph.getProofPath('dec_1');
    assert.strictEqual(result.found, true);
    assert.ok(result.hasQuorum);
    assert.ok(result.quorumNodeId);
    console.log(`✅ Full proof path with quorum: ${result.path.length} nodes`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 124: ${error.message}`);
    throw error;
  }
}

async function test125_GetProofPathPartial() {
  console.log('\n=== TEST 125: GlobalMemoryGraph — Get Proof Path Partial ===');
  try {
    const graph = new GlobalMemoryGraph();
    const event = graph.addEventNode({ decisionId: 'dec_1' });
    const proof = graph.addProofNode({ valid: true }, { proofHash: 'h1' });
    graph.addEdge(event.nodeId, proof.nodeId, EDGE_TYPES.VALIDATED_BY);
    const result = graph.getProofPath('dec_1');
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.hasQuorum, false);
    console.log(`✅ Partial proof path without quorum: ${result.path.length} nodes`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 125: ${error.message}`);
    throw error;
  }
}

async function test126_GetReplayDependencies() {
  console.log('\n=== TEST 126: GlobalMemoryGraph — Get Replay Dependencies ===');
  try {
    const graph = new GlobalMemoryGraph();
    const replay = graph.addReplayNode({ entriesReplayed: 10 }, { entryId: 'wal_1' });
    const archive = graph.addArchiveNode({ segmentId: 'seg_1' });
    const snap = graph.addSnapshotNode({ snapshotId: 'snap_1' });
    graph.addEdge(replay.nodeId, archive.nodeId, EDGE_TYPES.RECONSTRUCTED_FROM);
    graph.addEdge(archive.nodeId, snap.nodeId, EDGE_TYPES.PERSISTED_FROM);
    const result = graph.getReplayDependencies('wal_1');
    assert.strictEqual(result.found, true);
    assert.ok(Array.isArray(result.dependencies));
    console.log(`✅ Replay dependencies: ${result.dependencies.length} nodes`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 126: ${error.message}`);
    throw error;
  }
}

async function test127_ReconstructTimeline() {
  console.log('\n=== TEST 127: GlobalMemoryGraph — Reconstruct Timeline ===');
  try {
    const graph = new GlobalMemoryGraph();
    const now = Date.now();
    const e1 = graph.addEventNode({ decisionId: 'dec_1' });
    const e2 = graph.addEventNode({ decisionId: 'dec_2' });
    const startTime = new Date(now - 10000);
    const endTime = new Date(now + 10000);
    const result = graph.reconstructTimeline(startTime, endTime);
    assert.strictEqual(result.found, true);
    assert.ok(result.nodes.length >= 2);
    console.log(`✅ Timeline reconstructed: ${result.nodes.length} nodes`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 127: ${error.message}`);
    throw error;
  }
}

async function test128_ReconstructTimelineEmptyRange() {
  console.log('\n=== TEST 128: GlobalMemoryGraph — Timeline Empty Range ===');
  try {
    const graph = new GlobalMemoryGraph();
    graph.addEventNode({ decisionId: 'dec_1' });
    const result = graph.reconstructTimeline(
      new Date('2020-01-01'),
      new Date('2020-01-02')
    );
    assert.strictEqual(result.found, true);
    assert.strictEqual(result.nodes.length, 0);
    console.log(`✅ Empty range returns empty nodes array`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 128: ${error.message}`);
    throw error;
  }
}

async function test129_GetRegionReplicationGraph() {
  console.log('\n=== TEST 129: GlobalMemoryGraph — Region Replication Graph ===');
  try {
    const graph = new GlobalMemoryGraph();
    const r1 = graph.addRegionNode('EU');
    const r2 = graph.addRegionNode('US');
    graph.addEdge(r1.nodeId, r2.nodeId, EDGE_TYPES.REPLICATED_TO);
    const result = graph.getRegionReplicationGraph('EU');
    assert.strictEqual(result.found, true);
    assert.ok(Array.isArray(result.nodes));
    assert.ok(Array.isArray(result.replicationEdges));
    console.log(`✅ Region graph: ${result.nodes.length} nodes, ${result.replicationEdges.length} edges`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 129: ${error.message}`);
    throw error;
  }
}

async function test130_DeterministicTraversal() {
  console.log('\n=== TEST 130: GlobalMemoryGraph — Deterministic Traversal ===');
  try {
    const graph = new GlobalMemoryGraph();
    const e1 = graph.addEventNode({ decisionId: 'dec_1' });
    const e2 = graph.addProofNode({ valid: true }, { proofHash: 'h1' });
    graph.addEdge(e1.nodeId, e2.nodeId, EDGE_TYPES.VALIDATED_BY);
    const r1 = graph.getCausalChain(e2.nodeId);
    const r2 = graph.getCausalChain(e2.nodeId);
    assert.strictEqual(r1.chain.length, r2.chain.length);
    assert.strictEqual(r1.depth, r2.depth);
    console.log(`✅ Traversals are deterministic`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 130: ${error.message}`);
    throw error;
  }
}

// ─── SECTION 4: Cross-Module Integration (8 tests) ───

async function test131_ProofSystemIntegration() {
  console.log('\n=== TEST 131: GlobalMemoryGraph — Proof System Integration ===');
  try {
    const graph = new GlobalMemoryGraph();
    const proofEntry = {
      decisionId: 'dec_1',
      module: 'ProofSystem',
      action: 'VERIFY',
      decision: { valid: true }
    };
    const eventResult = graph.addEventNode(proofEntry);
    const proofResult = graph.addProofNode({ valid: true }, { proofHash: 'h1', entriesVerified: 5 });
    graph.addEdge(eventResult.nodeId, proofResult.nodeId, EDGE_TYPES.VALIDATED_BY);
    assert.strictEqual(eventResult.added, true);
    assert.strictEqual(proofResult.added, true);
    console.log(`✅ Proof system integration: EVENT→PROOF chain`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 131: ${error.message}`);
    throw error;
  }
}

async function test132_ArchiveIntegration() {
  console.log('\n=== TEST 132: GlobalMemoryGraph — Archive Integration ===');
  try {
    const graph = new GlobalMemoryGraph();
    const archiveSegment = {
      segmentId: 'seg_1',
      batchId: 'batch_1',
      rootHash: 'rh1',
      entriesCount: 1000
    };
    const archResult = graph.addArchiveNode(archiveSegment);
    assert.strictEqual(archResult.added, true);
    assert.strictEqual(graph.nodes.size, 1);
    console.log(`✅ Archive integration: ARCHIVE_NODE created`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 132: ${error.message}`);
    throw error;
  }
}

async function test133_SnapshotIntegration() {
  console.log('\n=== TEST 133: GlobalMemoryGraph — Snapshot Integration ===');
  try {
    const graph = new GlobalMemoryGraph();
    const snapRecord = {
      snapshotId: 'snap_1',
      archiveSize: 2048,
      totalEntries: 200,
      takenAt: new Date().toISOString()
    };
    const snapResult = graph.addSnapshotNode(snapRecord);
    assert.strictEqual(snapResult.added, true);
    const metrics = graph.getGraphMetrics();
    assert.strictEqual(metrics.nodesByType[NODE_TYPES.SNAPSHOT_NODE], 1);
    console.log(`✅ Snapshot integration: SNAPSHOT_NODE created`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 133: ${error.message}`);
    throw error;
  }
}

async function test134_WALIntegration() {
  console.log('\n=== TEST 134: GlobalMemoryGraph — WAL Integration ===');
  try {
    const graph = new GlobalMemoryGraph();
    const walEntry = {
      transactionId: 'txn_1',
      operationCount: 3,
      entryId: 'wal_ent_1'
    };
    const txnResult = graph.addTransactionNode(walEntry);
    assert.strictEqual(txnResult.added, true);
    assert.strictEqual(txnResult.type, NODE_TYPES.TRANSACTION_NODE);
    console.log(`✅ WAL integration: TRANSACTION_NODE created`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 134: ${error.message}`);
    throw error;
  }
}

async function test135_DTLogIntegration() {
  console.log('\n=== TEST 135: GlobalMemoryGraph — DTLog Integration ===');
  try {
    const graph = new GlobalMemoryGraph();
    const consensusRecord = {
      consensusId: 'cons_1',
      requiredAcks: 2,
      ackCount: 2,
      regions: ['EU', 'US']
    };
    const quorumResult = graph.addQuorumNode(consensusRecord);
    assert.strictEqual(quorumResult.added, true);
    assert.strictEqual(quorumResult.type, NODE_TYPES.QUORUM_NODE);
    console.log(`✅ DTLog integration: QUORUM_NODE created`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 135: ${error.message}`);
    throw error;
  }
}

async function test136_CrossRegionIntegration() {
  console.log('\n=== TEST 136: GlobalMemoryGraph — Cross-Region Integration ===');
  try {
    const graph = new GlobalMemoryGraph();
    const r1 = graph.addRegionNode('EU', { isHealthy: true, lagMs: 50 });
    const r2 = graph.addRegionNode('US', { isHealthy: true, lagMs: 100 });
    const edgeResult = graph.addEdge(r1.nodeId, r2.nodeId, EDGE_TYPES.REPLICATED_TO);
    assert.strictEqual(edgeResult.connected, true);
    console.log(`✅ Cross-region integration: EU→US replication edge`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 136: ${error.message}`);
    throw error;
  }
}

async function test137_FullCausalChain() {
  console.log('\n=== TEST 137: GlobalMemoryGraph — Full Causal Chain ===');
  try {
    const graph = new GlobalMemoryGraph();
    const event = graph.addEventNode({ decisionId: 'dec_1' });
    const proof = graph.addProofNode({ valid: true }, { proofHash: 'h1' });
    const quorum = graph.addQuorumNode({ consensusId: 'c1', requiredAcks: 2, ackCount: 2 });
    const snap = graph.addSnapshotNode({ snapshotId: 'snap_1' });
    const arch = graph.addArchiveNode({ segmentId: 'seg_1' });
    graph.addEdge(event.nodeId, proof.nodeId, EDGE_TYPES.VALIDATED_BY);
    graph.addEdge(proof.nodeId, quorum.nodeId, EDGE_TYPES.ACCEPTED_BY);
    graph.addEdge(snap.nodeId, event.nodeId, EDGE_TYPES.DERIVED_FROM);
    graph.addEdge(arch.nodeId, snap.nodeId, EDGE_TYPES.PERSISTED_FROM);
    assert.strictEqual(graph.nodes.size, 5);
    assert.strictEqual(graph.edges.size, 4);
    console.log(`✅ Full chain: EVENT→PROOF→QUORUM + ARCHIVE→SNAPSHOT→EVENT (5 nodes, 4 edges)`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 137: ${error.message}`);
    throw error;
  }
}

async function test138_RealtimeIsolation() {
  console.log('\n=== TEST 138: GlobalMemoryGraph — Real-Time Isolation ===');
  try {
    const graph = new GlobalMemoryGraph();
    const t0 = Date.now();
    for (let i = 0; i < 10; i++) {
      graph.addEventNode({ decisionId: `dec_${i}` });
    }
    const t1 = Date.now();
    const graphOps = t1 - t0;
    assert.ok(graphOps < 100);
    console.log(`✅ Real-time isolation: 10 captureDecision ops in ${graphOps}ms < 100ms`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 138: ${error.message}`);
    throw error;
  }
}

// ─── SECTION 5: Invariants & Consistency (7 tests) ───

async function test139_IsAuthoritative() {
  console.log('\n=== TEST 139: GlobalMemoryGraph — isAuthoritative() ===');
  try {
    const graph = new GlobalMemoryGraph();
    assert.strictEqual(graph.isAuthoritative(), false);
    console.log(`✅ isAuthoritative() === false`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 139: ${error.message}`);
    throw error;
  }
}

async function test140_AppendOnly() {
  console.log('\n=== TEST 140: GlobalMemoryGraph — Append-Only ===');
  try {
    const graph = new GlobalMemoryGraph();
    assert.strictEqual(typeof graph.delete, 'undefined');
    assert.strictEqual(typeof graph.remove, 'undefined');
    assert.strictEqual(typeof graph.modify, 'undefined');
    console.log(`✅ No delete/remove/modify methods exist`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 140: ${error.message}`);
    throw error;
  }
}

async function test141_VerifyConsistencyClean() {
  console.log('\n=== TEST 141: GlobalMemoryGraph — Verify Consistency Clean ===');
  try {
    const graph = new GlobalMemoryGraph();
    graph.addEventNode({ decisionId: 'dec_1' });
    graph.addProofNode({ valid: true }, { proofHash: 'h1' });
    const result = graph.verifyGraphConsistency();
    assert.strictEqual(result.consistent, true);
    assert.strictEqual(result.violations.length, 0);
    console.log(`✅ Clean graph: consistent=true, violations=0`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 141: ${error.message}`);
    throw error;
  }
}

async function test142_VerifyConsistencyMissingProofHash() {
  console.log('\n=== TEST 142: GlobalMemoryGraph — Missing proofHash Detection ===');
  try {
    const graph = new GlobalMemoryGraph();
    const proofResult = graph.addProofNode({ valid: true }, { proofHash: null });
    const node = graph.getNode(proofResult.nodeId).node;
    assert.strictEqual(node.proofHash, null);
    const consistency = graph.verifyGraphConsistency();
    const hasMissingProofViolation = consistency.violations.some(v => v.includes('proofHash'));
    assert.ok(hasMissingProofViolation);
    console.log(`✅ Missing proofHash detected by verifyGraphConsistency`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 142: ${error.message}`);
    throw error;
  }
}

async function test143_OrphanDetection() {
  console.log('\n=== TEST 143: GlobalMemoryGraph — Orphan Detection ===');
  try {
    const graph = new GlobalMemoryGraph();
    graph.addEventNode({ decisionId: 'dec_1' });
    graph.addEventNode({ decisionId: 'dec_2' });
    const result = graph.verifyGraphConsistency();
    assert.ok(result.checks.includes('All nodes frozen'));
    console.log(`✅ Consistency checks performed: ${result.checks.length} checks`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 143: ${error.message}`);
    throw error;
  }
}

async function test144_NoOrphanViAPI() {
  console.log('\n=== TEST 144: GlobalMemoryGraph — No Orphan Via API ===');
  try {
    const graph = new GlobalMemoryGraph();
    const event = graph.addEventNode({ decisionId: 'dec_1' });
    const edgeResult = graph.addEdge(event.nodeId, 'nonexistent_id', EDGE_TYPES.VALIDATED_BY);
    assert.strictEqual(edgeResult.connected, false);
    console.log(`✅ API prevents orphan edge creation`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 144: ${error.message}`);
    throw error;
  }
}

async function test145_ResetState() {
  console.log('\n=== TEST 145: GlobalMemoryGraph — Reset State ===');
  try {
    const graph = new GlobalMemoryGraph();
    graph.addEventNode({ decisionId: 'dec_1' });
    graph.addEventNode({ decisionId: 'dec_2' });
    assert.strictEqual(graph.nodes.size, 2);
    graph.reset();
    assert.strictEqual(graph.nodes.size, 0);
    assert.strictEqual(graph.globalSequence, 0);
    console.log(`✅ Reset clears all state`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 145: ${error.message}`);
    throw error;
  }
}

// ─── SECTION 6: Performance & Regression (5 tests) ───

async function test146_Performance1000Nodes() {
  console.log('\n=== TEST 146: GlobalMemoryGraph — Perf 1000 Nodes ===');
  try {
    const graph = new GlobalMemoryGraph();
    const t0 = Date.now();
    for (let i = 0; i < 1000; i++) {
      graph.addEventNode({ decisionId: `dec_${i}` });
    }
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 1000);
    console.log(`✅ 1000 nodes added in ${elapsed}ms < 1000ms`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 146: ${error.message}`);
    throw error;
  }
}

async function test147_PerfReconstructTimeline() {
  console.log('\n=== TEST 147: GlobalMemoryGraph — Perf Timeline ===');
  try {
    const graph = new GlobalMemoryGraph();
    for (let i = 0; i < 1000; i++) {
      graph.addEventNode({ decisionId: `dec_${i}` });
    }
    const now = Date.now();
    const t0 = Date.now();
    const result = graph.reconstructTimeline(new Date(now - 60000), new Date(now + 60000));
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 100);
    console.log(`✅ reconstructTimeline 1000 nodes in ${elapsed}ms < 100ms`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 147: ${error.message}`);
    throw error;
  }
}

async function test148_PerfCausalChain() {
  console.log('\n=== TEST 148: GlobalMemoryGraph — Perf Causal Chain ===');
  try {
    const graph = new GlobalMemoryGraph();
    let prev = null;
    for (let i = 0; i < 50; i++) {
      const node = graph.addEventNode({ decisionId: `dec_${i}` });
      if (prev) {
        graph.addEdge(node.nodeId, prev.nodeId, i % 2 === 0 ? EDGE_TYPES.VALIDATED_BY : EDGE_TYPES.DERIVED_FROM);
      }
      prev = node;
    }
    const t0 = Date.now();
    const result = graph.getCausalChain(prev.nodeId, 50);
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 100);
    console.log(`✅ getCausalChain depth 50 in ${elapsed}ms < 100ms`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 148: ${error.message}`);
    throw error;
  }
}

async function test149_RegressionPhase800() {
  console.log('\n=== TEST 149: GlobalMemoryGraph — Regression PHASE 8.0 ===');
  try {
    const graph = new GlobalMemoryGraph();
    const node = graph.addEventNode({ decisionId: 'dec_1' });
    assert.strictEqual(node.isAuthoritative, false);
    const metrics = graph.getGraphMetrics();
    assert.strictEqual(metrics.isAuthoritative, false);
    console.log(`✅ PHASE 8.0 invariants maintained`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 149: ${error.message}`);
    throw error;
  }
}

async function test150_GraphMetricsFrozen() {
  console.log('\n=== TEST 150: GlobalMemoryGraph — Metrics Frozen ===');
  try {
    const graph = new GlobalMemoryGraph();
    graph.addEventNode({ decisionId: 'dec_1' });
    const metrics = graph.getGraphMetrics();
    assert.ok(Object.isFrozen(metrics));
    assert.strictEqual(metrics.nodesByType[NODE_TYPES.EVENT_NODE], 1);
    console.log(`✅ Metrics frozen, nodesByType accurate`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 150: ${error.message}`);
    throw error;
  }
}

// ─── RUN ALL TESTS ───

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  PHASE 8.1 — GlobalMemoryGraph Tests (50)                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');

  try {
    // SECTION 1
    await test101_AddEventNode();
    await test102_AddProofNode();
    await test103_AddQuorumNode();
    await test104_AddSnapshotNode();
    await test105_AddArchiveNode();
    await test106_AddReplayNode();
    await test107_AddRegionNode();
    await test108_AddTransactionNode();
    await test109_GetNodeFound();
    await test110_GetNodeNotFound();
    await test111_NodeImmutability();
    await test112_GlobalSequenceMonotonic();

    // SECTION 2
    await test113_AddEdgeEventToProof();
    await test114_AddEdgeProofToQuorum();
    await test115_AddEdgeSnapshotToEvent();
    await test116_AddEdgeArchiveToSnapshot();
    await test117_AddEdgeRegionToRegion();
    await test118_AddEdgeInvalidType();
    await test119_AddEdgeUnknownNode();
    await test120_EdgeImmutability();

    // SECTION 3
    await test121_GetCausalChain();
    await test122_GetCausalChainRootNode();
    await test123_GetStateLineage();
    await test124_GetProofPathFull();
    await test125_GetProofPathPartial();
    await test126_GetReplayDependencies();
    await test127_ReconstructTimeline();
    await test128_ReconstructTimelineEmptyRange();
    await test129_GetRegionReplicationGraph();
    await test130_DeterministicTraversal();

    // SECTION 4
    await test131_ProofSystemIntegration();
    await test132_ArchiveIntegration();
    await test133_SnapshotIntegration();
    await test134_WALIntegration();
    await test135_DTLogIntegration();
    await test136_CrossRegionIntegration();
    await test137_FullCausalChain();
    await test138_RealtimeIsolation();

    // SECTION 5
    await test139_IsAuthoritative();
    await test140_AppendOnly();
    await test141_VerifyConsistencyClean();
    await test142_VerifyConsistencyMissingProofHash();
    await test143_OrphanDetection();
    await test144_NoOrphanViAPI();
    await test145_ResetState();

    // SECTION 6
    await test146_Performance1000Nodes();
    await test147_PerfReconstructTimeline();
    await test148_PerfCausalChain();
    await test149_RegressionPhase800();
    await test150_GraphMetricsFrozen();
  } catch (error) {
    // One test failed, but continue to show summary
  }

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ${testResults.passed}/50 PASSED, ${testResults.failed} FAILED                          ║`);
  console.log('╚═══════════════════════════════════════════════════════════╝');

  if (testResults.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    testResults.errors.forEach(err => console.log(`  - ${err}`));
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  runAllTests();
}

module.exports = { testResults };
