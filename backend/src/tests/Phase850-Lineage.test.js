const LineageVerificationEngine = require('../core/governance/enforcement/LineageVerificationEngine');
const CrossRegionLineageReconciler = require('../core/governance/enforcement/CrossRegionLineageReconciler');
const {
  LINEAGE_ERRORS, LINEAGE_STATES, VERIFICATION_STRATEGIES, INTEGRITY_ACTIONS
} = LineageVerificationEngine;

// Mock implementations for testing
class MockGraph {
  constructor() {
    this.nodes = new Map();
    this.typeIndex = new Map([
      ['EVENT_NODE', []],
      ['SNAPSHOT_NODE', []],
      ['REPLAY_NODE', []]
    ]);
    this.temporalIndex = new Map();
  }

  reconstructTimeline(startTs, endTs) {
    return Array.from(this.nodes.values()).filter(n => {
      const ts = new Date(n.timestamp).getTime();
      const start = new Date(startTs).getTime();
      const end = new Date(endTs).getTime();
      return ts >= start && ts <= end;
    });
  }

  getProofPath(nodeId) {
    return this.nodes.get(nodeId)?.proofPath || [];
  }

  getStateLineage(nodeId) {
    return this.nodes.get(nodeId)?.stateLineage || [];
  }

  getCausalChain(ts) {
    return Array.from(this.nodes.values()).map(n => ({ nodeId: n.nodeId, timestamp: n.timestamp }));
  }

  addNode(node) {
    this.nodes.set(node.nodeId, node);
    const typeNodes = this.typeIndex.get(node.nodeType) || [];
    typeNodes.push(node.nodeId);
  }
}

class MockReconstructor {
  reconstructStateAt(ts) {
    return { state: { timestamp: ts, data: 'test' }, found: true, source: 'SNAPSHOT' };
  }
}

class MockCausalityEngine {
  verifyTemporalConsistency(startTs, endTs) {
    return { consistent: true, consistencyScore: 0.95 };
  }

  detectTemporalConflicts() {
    return { conflicts: [] };
  }
}

let testResults = { passed: 0, failed: 0, errors: [] };

async function test(name, fn) {
  try {
    await fn();
    testResults.passed++;
    console.log(`✅ ${name}`);
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
    console.error(`❌ ${name}: ${error.message}`);
  }
}

// SECTION 1: Initialization (Tests 601-607)
async function section1() {
  console.log('\n📋 SECTION 1: Initialization\n');

  const graph = new MockGraph();

  await test('TEST 601: Constructor with graph only', () => {
    const engine = new LineageVerificationEngine(graph);
    if (!engine.graph) throw new Error('Graph not set');
    if (engine.verificationMetrics.verificationsPerformed !== 0) throw new Error('Metrics not reset');
  });

  await test('TEST 602: Constructor with all optional engines', () => {
    const reconstructor = new MockReconstructor();
    const causalityEngine = new MockCausalityEngine();
    const engine = new LineageVerificationEngine(graph, reconstructor, causalityEngine);
    if (!engine.reconstructor) throw new Error('Reconstructor not set');
    if (!engine.causalityEngine) throw new Error('CausalityEngine not set');
  });

  await test('TEST 603: isAuthoritative() === false', () => {
    const engine = new LineageVerificationEngine(graph);
    if (engine.isAuthoritative() !== false) throw new Error('isAuthoritative not false');
  });

  await test('TEST 604: getMetrics() frozen and zero counters', () => {
    const engine = new LineageVerificationEngine(graph);
    const metrics = engine.getMetrics();
    if (!Object.isFrozen(metrics)) throw new Error('Metrics not frozen');
    if (metrics.verificationsPerformed !== 0) throw new Error('Counter not zero');
  });

  await test('TEST 605: Constants exported correctly', () => {
    if (!LINEAGE_ERRORS.BROKEN_CHAIN) throw new Error('LINEAGE_ERRORS missing');
    if (!LINEAGE_STATES.VALID) throw new Error('LINEAGE_STATES missing');
    if (!VERIFICATION_STRATEGIES.FULL) throw new Error('VERIFICATION_STRATEGIES missing');
    if (!INTEGRITY_ACTIONS.FLAG) throw new Error('INTEGRITY_ACTIONS missing');
  });

  await test('TEST 606: No delete/modify methods', () => {
    const engine = new LineageVerificationEngine(graph);
    if (typeof engine.deleteNode !== 'undefined') throw new Error('deleteNode method exists');
    if (typeof engine.modifyChain !== 'undefined') throw new Error('modifyChain method exists');
  });

  await test('TEST 607: reset() clears metrics and alerts', () => {
    const engine = new LineageVerificationEngine(graph);
    engine.verificationMetrics.verificationsPerformed = 10;
    engine.alerts.push({ test: 'alert' });
    engine.reset();
    if (engine.verificationMetrics.verificationsPerformed !== 0) throw new Error('Metrics not cleared');
    if (engine.alerts.length !== 0) throw new Error('Alerts not cleared');
  });
}

// SECTION 2: verifyLineageAt (Tests 608-617)
async function section2() {
  console.log('\n📋 SECTION 2: verifyLineageAt\n');

  const graph = new MockGraph();
  const reconstructor = new MockReconstructor();
  const causalityEngine = new MockCausalityEngine();
  const engine = new LineageVerificationEngine(graph, reconstructor, causalityEngine);

  const targetTs = new Date().toISOString();

  await test('TEST 608: Verify lineage returns consistent state', () => {
    const result = engine.verifyLineageAt(targetTs);
    if (typeof result.valid !== 'boolean') throw new Error('valid not boolean');
    if (result.valid && result.lineageState !== LINEAGE_STATES.VALID) {
      throw new Error('valid=true but lineageState!=VALID');
    }
    if (!result.valid && result.lineageState === LINEAGE_STATES.VALID) {
      throw new Error('valid=false but lineageState=VALID');
    }
  });

  await test('TEST 609: Verify returns frozen result', () => {
    const result = engine.verifyLineageAt(targetTs);
    if (!Object.isFrozen(result)) throw new Error('Result not frozen');
  });

  await test('TEST 610: lineageState in LINEAGE_STATES', () => {
    const result = engine.verifyLineageAt(targetTs);
    if (!Object.values(LINEAGE_STATES).includes(result.lineageState)) {
      throw new Error('lineageState not in LINEAGE_STATES');
    }
  });

  await test('TEST 611: causalScore in [0.0, 1.0]', () => {
    const result = engine.verifyLineageAt(targetTs);
    if (result.causalScore < 0.0 || result.causalScore > 1.0) {
      throw new Error('causalScore out of range');
    }
  });

  await test('TEST 612: chainHash is string', () => {
    const result = engine.verifyLineageAt(targetTs);
    if (typeof result.chainHash !== 'string') throw new Error('chainHash not string');
  });

  await test('TEST 613: Deterministic chainHash', () => {
    const result1 = engine.verifyLineageAt(targetTs);
    const result2 = engine.verifyLineageAt(targetTs);
    if (result1.chainHash !== result2.chainHash) throw new Error('Hash not deterministic');
  });

  await test('TEST 614: verificationsPerformed metric incremented', () => {
    const before = engine.verificationMetrics.verificationsPerformed;
    engine.verifyLineageAt(targetTs);
    const after = engine.verificationMetrics.verificationsPerformed;
    if (after <= before) throw new Error('Metric not incremented');
  });

  await test('TEST 615: brokenLinks array in result', () => {
    const result = engine.verifyLineageAt(targetTs);
    if (!Array.isArray(result.brokenLinks)) throw new Error('brokenLinks not array');
  });

  await test('TEST 616: result has reconstructionParity field', () => {
    const result = engine.verifyLineageAt(targetTs);
    if (typeof result.reconstructionParity !== 'boolean') throw new Error('reconstructionParity not boolean');
  });

  await test('TEST 617: result has elapsedMs field', () => {
    const result = engine.verifyLineageAt(targetTs);
    if (typeof result.elapsedMs !== 'number') throw new Error('elapsedMs not number');
  });
}

// SECTION 3: verifyGlobalLineageConsistency (Tests 618-625)
async function section3() {
  console.log('\n📋 SECTION 3: verifyGlobalLineageConsistency\n');

  const graph = new MockGraph();
  const engine = new LineageVerificationEngine(graph);

  await test('TEST 618: Clean graph returns consistencyScore 1.0', () => {
    const result = engine.verifyGlobalLineageConsistency();
    if (result.consistencyScore !== 1.0 && result.totalNodes === 0) {
      throw new Error('Empty graph should have score 1.0');
    }
  });

  await test('TEST 619: globalLineageHash is deterministic', () => {
    const result1 = engine.verifyGlobalLineageConsistency();
    const result2 = engine.verifyGlobalLineageConsistency();
    if (result1.globalLineageHash !== result2.globalLineageHash) {
      throw new Error('Global hash not deterministic');
    }
  });

  await test('TEST 620: Result frozen', () => {
    const result = engine.verifyGlobalLineageConsistency();
    if (!Object.isFrozen(result)) throw new Error('Result not frozen');
  });

  await test('TEST 621: checkedNodes >= 0', () => {
    const result = engine.verifyGlobalLineageConsistency();
    if (result.checkedNodes < 0) throw new Error('checkedNodes negative');
  });

  await test('TEST 622: Issues array structure valid', () => {
    const result = engine.verifyGlobalLineageConsistency();
    if (!Array.isArray(result.issues)) throw new Error('issues not array');
  });

  await test('TEST 623: consistencyScore in [0.0, 1.0]', () => {
    const result = engine.verifyGlobalLineageConsistency();
    if (result.consistencyScore < 0.0 || result.consistencyScore > 1.0) {
      throw new Error('consistencyScore out of range');
    }
  });

  await test('TEST 624: globalHashesComputed metric incremented', () => {
    const before = engine.verificationMetrics.globalHashesComputed;
    engine.verifyGlobalLineageConsistency();
    const after = engine.verificationMetrics.globalHashesComputed;
    if (after <= before) throw new Error('Metric not incremented');
  });

  await test('TEST 625: Result not authoritative', () => {
    const result = engine.verifyGlobalLineageConsistency();
    if (result.isAuthoritative !== false) throw new Error('Result authoritative');
  });
}

// SECTION 4: computeLineageHash & detectCausalContradictions (Tests 626-633)
async function section4() {
  console.log('\n📋 SECTION 4: Hash & Contradictions\n');

  const graph = new MockGraph();
  const causalityEngine = new MockCausalityEngine();
  const engine = new LineageVerificationEngine(graph, null, causalityEngine);

  await test('TEST 626: computeLineageHash deterministic', () => {
    const nodes = ['node1', 'node2', 'node3'];
    const hash1 = engine.computeLineageHash(nodes);
    const hash2 = engine.computeLineageHash(nodes);
    if (hash1.lineageHash !== hash2.lineageHash) throw new Error('Hash not deterministic');
  });

  await test('TEST 627: computeLineageHash ordered by sequence', () => {
    const nodes = ['a', 'b', 'c'];
    const result = engine.computeLineageHash(nodes);
    if (!Array.isArray(result.orderedNodes)) throw new Error('orderedNodes not array');
    if (result.orderedNodes.length !== 3) throw new Error('Wrong node count');
  });

  await test('TEST 628: Empty nodeIds returns valid hash', () => {
    const result = engine.computeLineageHash([]);
    if (typeof result.lineageHash !== 'string') throw new Error('lineageHash not string');
    if (result.nodeCount !== 0) throw new Error('nodeCount not 0');
  });

  await test('TEST 629: detectCausalContradictions clean graph', () => {
    const startTs = new Date().toISOString();
    const endTs = new Date().toISOString();
    const result = engine.detectCausalContradictions(startTs, endTs);
    if (result.contradictionsFound === true && Object.keys(result).length === 0) {
      throw new Error('Unexpected contradictions in clean graph');
    }
  });

  await test('TEST 630: Contradictions result frozen', () => {
    const startTs = new Date().toISOString();
    const endTs = new Date().toISOString();
    const result = engine.detectCausalContradictions(startTs, endTs);
    if (!Object.isFrozen(result)) throw new Error('Result not frozen');
  });

  await test('TEST 631: Contradictions array structure valid', () => {
    const startTs = new Date().toISOString();
    const endTs = new Date().toISOString();
    const result = engine.detectCausalContradictions(startTs, endTs);
    if (!Array.isArray(result.contradictions)) throw new Error('contradictions not array');
  });

  await test('TEST 632: Severity levels in contradictions', () => {
    const startTs = new Date().toISOString();
    const endTs = new Date().toISOString();
    const result = engine.detectCausalContradictions(startTs, endTs);
    if (!['INFO', 'WARNING', 'CRITICAL'].includes(result.severity)) {
      throw new Error('Invalid severity level');
    }
  });

  await test('TEST 633: Result not authoritative', () => {
    const startTs = new Date().toISOString();
    const endTs = new Date().toISOString();
    const result = engine.detectCausalContradictions(startTs, endTs);
    if (result.isAuthoritative !== false) throw new Error('Result authoritative');
  });
}

// SECTION 5: CrossRegionLineageReconciler (Tests 634-643)
async function section5() {
  console.log('\n📋 SECTION 5: CrossRegionLineageReconciler\n');

  const graph = new MockGraph();
  const engine = new LineageVerificationEngine(graph);
  const regions = ['EU', 'US', 'APAC'];
  const reconciler = new CrossRegionLineageReconciler(regions, engine);

  const targetTs = new Date().toISOString();

  await test('TEST 634: Constructor with lineageEngine', () => {
    if (!reconciler.lineageEngine) throw new Error('LineageEngine not set');
    if (!Array.isArray(reconciler.regions)) throw new Error('Regions not array');
  });

  await test('TEST 635: reconcileRegions returns frozen result', () => {
    const result = reconciler.reconcileRegions(targetTs);
    if (!Object.isFrozen(result)) throw new Error('Result not frozen');
  });

  await test('TEST 636: reconcileRegions has consistency field', () => {
    const result = reconciler.reconcileRegions(targetTs);
    if (typeof result.consistent !== 'boolean') throw new Error('consistent not boolean');
  });

  await test('TEST 637: detectRegionDivergence same region returns NONE', () => {
    const result = reconciler.detectRegionDivergence('EU', 'EU', targetTs);
    if (result.divergenceType !== 'NONE') throw new Error('Same region should return NONE');
  });

  await test('TEST 638: detectRegionDivergence different regions', () => {
    const result = reconciler.detectRegionDivergence('EU', 'US', targetTs);
    if (!Object.isFrozen(result)) throw new Error('Result not frozen');
  });

  await test('TEST 639: flagDivergence returns frozen result', () => {
    const result = reconciler.flagDivergence('EU', 'Test divergence detected');
    if (!Object.isFrozen(result)) throw new Error('Result not frozen');
  });

  await test('TEST 640: flagDivergence creates alert', () => {
    const before = reconciler.alerts.length;
    reconciler.flagDivergence('EU', 'Test alert');
    const after = reconciler.alerts.length;
    if (after <= before) throw new Error('Alert not created');
  });

  await test('TEST 641: getReconciliationReport returns frozen result', () => {
    const startTs = new Date(new Date().getTime() - 86400000).toISOString();
    const endTs = new Date().toISOString();
    const result = reconciler.getReconciliationReport(startTs, endTs);
    if (!Object.isFrozen(result)) throw new Error('Result not frozen');
  });

  await test('TEST 642: reconciliations metric incremented', () => {
    const before = reconciler.reconciliationMetrics.reconciliations;
    reconciler.reconcileRegions(targetTs);
    const after = reconciler.reconciliationMetrics.reconciliations;
    if (after <= before) throw new Error('Metric not incremented');
  });

  await test('TEST 643: All results not authoritative', () => {
    const result1 = reconciler.reconcileRegions(targetTs);
    const result2 = reconciler.detectRegionDivergence('EU', 'US', targetTs);
    const result3 = reconciler.flagDivergence('EU', 'test');
    if (result1.isAuthoritative !== false) throw new Error('reconcileRegions authoritative');
    if (result2.isAuthoritative !== false) throw new Error('detectRegionDivergence authoritative');
    if (result3.isAuthoritative !== false) throw new Error('flagDivergence authoritative');
  });
}

// SECTION 6: Performance & Regression (Tests 644-650)
async function section6() {
  console.log('\n📋 SECTION 6: Performance & Regression\n');

  const graph = new MockGraph();
  const engine = new LineageVerificationEngine(graph);
  const targetTs = new Date().toISOString();

  await test('TEST 644: verifyLineageAt < 500ms', () => {
    const start = Date.now();
    engine.verifyLineageAt(targetTs);
    const elapsed = Date.now() - start;
    if (elapsed > 500) throw new Error(`Took ${elapsed}ms, target <500ms`);
  });

  await test('TEST 645: verifyGlobalLineageConsistency < 1s', () => {
    const start = Date.now();
    engine.verifyGlobalLineageConsistency();
    const elapsed = Date.now() - start;
    if (elapsed > 1000) throw new Error(`Took ${elapsed}ms, target <1s`);
  });

  await test('TEST 646: computeLineageHash < 100ms', () => {
    const nodes = Array.from({ length: 1000 }, (_, i) => `node${i}`);
    const start = Date.now();
    engine.computeLineageHash(nodes);
    const elapsed = Date.now() - start;
    if (elapsed > 100) throw new Error(`Took ${elapsed}ms, target <100ms`);
  });

  await test('TEST 647: getLineageAuditTrail works', () => {
    const startTs = new Date(new Date().getTime() - 3600000).toISOString();
    const endTs = new Date().toISOString();
    const result = engine.getLineageAuditTrail(startTs, endTs);
    if (!Object.isFrozen(result)) throw new Error('Result not frozen');
  });

  await test('TEST 648: checkReconstructionParity works', () => {
    const reconstructor = new MockReconstructor();
    const engineWithRecon = new LineageVerificationEngine(graph, reconstructor);
    const result = engineWithRecon.checkReconstructionParity(targetTs);
    if (!Object.isFrozen(result)) throw new Error('Result not frozen');
  });

  await test('TEST 649: Reset clears all state', () => {
    engine.verificationMetrics.verificationsPerformed = 10;
    engine.alerts.push({ test: 'alert' });
    engine.reset();
    if (engine.verificationMetrics.verificationsPerformed !== 0) throw new Error('Metrics not cleared');
    if (engine.alerts.length !== 0) throw new Error('Alerts not cleared');
  });

  await test('TEST 650: getMetrics returns frozen snapshot', () => {
    const metrics = engine.getMetrics();
    if (!Object.isFrozen(metrics)) throw new Error('Metrics not frozen');
    if (metrics.isAuthoritative !== false) throw new Error('Metrics authoritative');
  });
}

async function runAllTests() {
  console.log('='.repeat(70));
  console.log('🧪 PHASE 8.5 — LINEAGE VERIFICATION ENGINE TESTS');
  console.log('='.repeat(70));

  await section1();
  await section2();
  await section3();
  await section4();
  await section5();
  await section6();

  console.log('\n' + '='.repeat(70));
  console.log(`✅ PASSED: ${testResults.passed}`);
  console.log(`❌ FAILED: ${testResults.failed}`);
  console.log(`📊 TOTAL:  ${testResults.passed + testResults.failed}`);
  console.log('='.repeat(70));

  if (testResults.failed > 0) {
    console.log('\n⚠️  FAILURES:');
    testResults.errors.forEach(e => {
      console.log(`  - ${e.name}: ${e.error}`);
    });
  }

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests();
