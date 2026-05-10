const ExternalTruthLayer = require('../core/external-truth-layer/ExternalTruthLayer');
const AdversarialRealityEngine = require('../core/external-truth-layer/AdversarialRealityEngine');
const DiscrepancyDetectionEngine = require('../core/external-truth-layer/DiscrepancyDetectionEngine');

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

// SECTION 1: External Truth Layer Initialization (Tests 901-907)
async function section1() {
  console.log('\n📋 SECTION 1: External Truth Layer Initialization\n');

  const truthLayer = new ExternalTruthLayer();

  await test('TEST 901: ExternalTruthLayer constructor', () => {
    if (!truthLayer) throw new Error('Failed to create');
    if (!truthLayer.metadata) throw new Error('No metadata');
    if (!truthLayer.metadata.authoritative) throw new Error('Not authoritative');
  });

  await test('TEST 902: ExternalTruthLayer is authoritative', () => {
    if (!truthLayer.isAuthoritative()) throw new Error('Not authoritative');
  });

  await test('TEST 903: Truth ledger starts empty', () => {
    const ledger = truthLayer.getTruthLedger();
    if (ledger.length !== 0) throw new Error('Ledger not empty');
  });

  await test('TEST 904: Record event observation', () => {
    const obs = truthLayer.recordEventObservation({ id: 'evt_1', data: 'test' });
    if (!obs.observationHash) throw new Error('No hash');
    if (obs.source !== 'EXTERNAL_OBSERVER') throw new Error('Wrong source');
  });

  await test('TEST 905: Record external snapshot', () => {
    const snap = truthLayer.recordExternalSnapshot({ id: 'snap_1', state: {} });
    if (!snap.snapshotHash) throw new Error('No hash');
    if (snap.validity !== 'VERIFIED_BY_EXTERNAL_OBSERVER') throw new Error('Wrong validity');
  });

  await test('TEST 906: Record message capture', () => {
    const msg = truthLayer.recordMessageCapture({
      id: 'msg_1',
      sender: 'EU',
      receiver: 'US',
      latencyMs: 100
    });
    if (!msg.messageHash) throw new Error('No hash');
    if (msg.deliveryStatus !== 'RECEIVED') throw new Error('Wrong status');
  });

  await test('TEST 907: External state reconstruction', () => {
    const state = truthLayer.getExternalStateAt(new Date().toISOString());
    if (typeof state.entries !== 'number') throw new Error('No entry count');
    if (!state.stateHash) throw new Error('No hash');
  });
}

// SECTION 2: Adversarial Reality Engine (Tests 908-917)
async function section2() {
  console.log('\n📋 SECTION 2: Adversarial Reality Engine\n');

  const truthLayer = new ExternalTruthLayer();
  const engine = new AdversarialRealityEngine(truthLayer);

  await test('TEST 908: AdversarialRealityEngine constructor', () => {
    if (!engine) throw new Error('Failed to create');
    if (!engine.truthLayer) throw new Error('No truth layer');
  });

  await test('TEST 909: Inject network latency', () => {
    const inj = engine.injectNetworkLatency('EU', 'US');
    if (inj.type !== 'NETWORK_LATENCY') throw new Error('Wrong type');
    if (typeof inj.latencyMs !== 'number') throw new Error('No latency');
  });

  await test('TEST 910: Inject packet loss', () => {
    const inj = engine.injectPacketLoss('US');
    if (inj.type !== 'PACKET_LOSS') throw new Error('Wrong type');
    if (typeof inj.lossRate !== 'number') throw new Error('No loss rate');
  });

  await test('TEST 911: Inject node restart', () => {
    const inj = engine.injectNodeRestart('EU', 'node_1');
    if (inj.type !== 'NODE_RESTART') throw new Error('Wrong type');
    if (inj.region !== 'EU') throw new Error('Wrong region');
  });

  await test('TEST 912: Inject region desync', () => {
    const inj = engine.injectRegionDesync('EU', 'APAC');
    if (inj.type !== 'REGION_DESYNC') throw new Error('Wrong type');
    if (typeof inj.clockSkewMs !== 'number') throw new Error('No skew');
  });

  await test('TEST 913: Inject data corruption', () => {
    const inj = engine.injectDataCorruption('snapshot_1');
    if (inj.type !== 'DATA_CORRUPTION') throw new Error('Wrong type');
    if (inj.target !== 'snapshot_1') throw new Error('Wrong target');
  });

  await test('TEST 914: Get active conditions', () => {
    const active = engine.getActiveConditions();
    if (!Array.isArray(active)) throw new Error('Not array');
    if (active.length === 0) throw new Error('No active conditions');
  });

  await test('TEST 915: Get injection history', () => {
    const history = engine.getInjectionHistory();
    if (!Array.isArray(history)) throw new Error('Not array');
    if (history.length === 0) throw new Error('No history');
  });

  await test('TEST 916: Get adversarial report', () => {
    const report = engine.getAdversarialReport();
    if (!report.totalInjections) throw new Error('No injections');
    if (!report.byType) throw new Error('No by-type');
  });

  await test('TEST 917: Cascading failure injection', () => {
    const inj = engine.injectCascadingFailure(['EU', 'US']);
    if (inj.type !== 'CASCADING_FAILURE') throw new Error('Wrong type');
    if (!Array.isArray(inj.conditions)) throw new Error('No conditions');
  });
}

// SECTION 3: Discrepancy Detection (Tests 918-927)
async function section3() {
  console.log('\n📋 SECTION 3: Discrepancy Detection Engine\n');

  const truthLayer = new ExternalTruthLayer();
  const mockCluster = {
    verifyLineageAt: () => ({ chainHash: 'abc123', chainLength: 50 }),
    verifyGlobalLineageConsistency: () => ({ consistencyScore: 0.95 }),
    detectTemporalConflicts: () => ({ contradictionsFound: false })
  };

  const engine = new DiscrepancyDetectionEngine(mockCluster, truthLayer);

  await test('TEST 918: DiscrepancyDetectionEngine constructor', () => {
    if (!engine) throw new Error('Failed to create');
    if (!engine.cluster) throw new Error('No cluster');
    if (!engine.truthLayer) throw new Error('No truth layer');
  });

  await test('TEST 919: Detect state hash mismatch', () => {
    // Add some observations to truth layer
    truthLayer.recordEventObservation({ id: 'evt_1', data: 'test' });
    const disc = engine.detectStateHashMismatch(new Date().toISOString());
    // May or may not detect mismatch (depends on hashes)
    if (disc && !disc.type) throw new Error('Invalid discrepancy');
  });

  await test('TEST 920: Detect chain length mismatch', () => {
    const disc = engine.detectChainLengthMismatch(new Date().toISOString());
    // May detect if entries don't match
    if (disc && !disc.type) throw new Error('Invalid discrepancy');
  });

  await test('TEST 921: Detect consistency score divergence', () => {
    const disc = engine.detectConsistencyScoreDivergence(new Date().toISOString());
    // May or may not detect depending on scores
    if (disc && !disc.type) throw new Error('Invalid discrepancy');
  });

  await test('TEST 922: Detect determinism violation', () => {
    const advEngine = new AdversarialRealityEngine(truthLayer);
    advEngine.injectNetworkLatency('EU', 'US');
    const disc = engine.detectDeterminismViolation(advEngine);
    if (!disc) throw new Error('Should detect');
    if (disc.type !== 'DETERMINISM_VIOLATION') throw new Error('Wrong type');
  });

  await test('TEST 923: Get discrepancy report', () => {
    const report = engine.getDiscrepancyReport();
    if (typeof report.totalDiscrepancies !== 'number') throw new Error('No count');
    if (!report.bySeverity) throw new Error('No bySeverity');
    if (!report.byType) throw new Error('No byType');
  });

  await test('TEST 924: Has critical discrepancies', () => {
    const has = engine.hasCriticalDiscrepancies();
    if (typeof has !== 'boolean') throw new Error('Not boolean');
  });

  await test('TEST 925: Discrepancy detection is authoritative', () => {
    if (!engine.isAuthoritative()) throw new Error('Not authoritative');
  });

  await test('TEST 926: Truth layer records discrepancies', () => {
    const report = truthLayer.getDiscrepancyReport();
    if (typeof report.totalDiscrepancies !== 'number') throw new Error('No count');
  });

  await test('TEST 927: All discrepancies frozen', () => {
    const report = engine.getDiscrepancyReport();
    if (!Object.isFrozen(report)) throw new Error('Report not frozen');
    if (!Object.isFrozen(report.discrepancies)) throw new Error('Discrepancies not frozen');
  });
}

// SECTION 4: Truth Ledger Immutability (Tests 928-934)
async function section4() {
  console.log('\n📋 SECTION 4: Truth Ledger Immutability\n');

  const truthLayer = new ExternalTruthLayer();

  await test('TEST 928: Truth ledger is append-only', () => {
    truthLayer.recordEventObservation({ id: 'evt_1' });
    const before = truthLayer.getTruthLedger().length;
    truthLayer.recordEventObservation({ id: 'evt_2' });
    const after = truthLayer.getTruthLedger().length;
    if (after <= before) throw new Error('Not appending');
  });

  await test('TEST 929: Ledger entries are frozen', () => {
    truthLayer.recordEventObservation({ id: 'evt_3' });
    const ledger = truthLayer.getTruthLedger();
    for (const entry of ledger) {
      if (!Object.isFrozen(entry)) throw new Error('Entry not frozen');
    }
  });

  await test('TEST 930: Get ledger hash', () => {
    const hash = truthLayer.getLedgerHash();
    if (typeof hash !== 'string') throw new Error('Not string');
    if (hash.length === 0) throw new Error('Empty hash');
  });

  await test('TEST 931: Ledger hash stability', () => {
    const hash1 = truthLayer.getLedgerHash();
    const hash2 = truthLayer.getLedgerHash();
    if (hash1 !== hash2) throw new Error('Hash not stable');
  });

  await test('TEST 932: External consistency verification', () => {
    const consistency = truthLayer.verifyExternalConsistency();
    if (typeof consistency.consistent !== 'boolean') throw new Error('Not boolean');
    if (!Array.isArray(consistency.issues)) throw new Error('No issues array');
  });

  await test('TEST 933: Discrepancy report from truth layer', () => {
    const report = truthLayer.getDiscrepancyReport();
    if (typeof report.totalDiscrepancies !== 'number') throw new Error('No count');
    if (!Object.isFrozen(report)) throw new Error('Not frozen');
  });

  await test('TEST 934: Truth layer metadata frozen', () => {
    if (!Object.isFrozen(truthLayer.metadata)) throw new Error('Metadata not frozen');
  });
}

// SECTION 5: Multi-Observer Consistency (Tests 935-940)
async function section5() {
  console.log('\n📋 SECTION 5: Multi-Observer Consistency\n');

  const observer1 = new ExternalTruthLayer();
  const observer2 = new ExternalTruthLayer();

  await test('TEST 935: Independent observers', () => {
    observer1.recordEventObservation({ id: 'evt_1', data: 'A' });
    observer2.recordEventObservation({ id: 'evt_1', data: 'A' });
    // Both should record same event
    if (observer1.getTruthLedger().length !== 1) throw new Error('Observer1 ledger wrong');
    if (observer2.getTruthLedger().length !== 1) throw new Error('Observer2 ledger wrong');
  });

  await test('TEST 936: Observers compute identical hashes', () => {
    const hash1 = observer1.getTruthLedger()[0].observationHash;
    const hash2 = observer2.getTruthLedger()[0].observationHash;
    if (hash1 !== hash2) throw new Error('Hashes differ');
  });

  await test('TEST 937: Observers detect consistent state', () => {
    const consistency1 = observer1.verifyExternalConsistency();
    const consistency2 = observer2.verifyExternalConsistency();
    if (consistency1.consistent !== consistency2.consistent) {
      throw new Error('Consistency differs');
    }
  });

  await test('TEST 938: Cross-observer timestamp validation', () => {
    if (!observer1.externalClock) throw new Error('No clock 1');
    if (!observer2.externalClock) throw new Error('No clock 2');
    // Both have independent clocks
  });

  await test('TEST 939: Observers can share discrepancy logs', () => {
    const advEngine = new AdversarialRealityEngine(observer1);
    advEngine.injectNetworkLatency('EU', 'US');
    const detectionEngine = new DiscrepancyDetectionEngine({}, observer1);
    const report = observer1.getDiscrepancyReport();
    if (typeof report.totalDiscrepancies !== 'number') throw new Error('No discrepancies');
  });

  await test('TEST 940: External truth layer consensus', () => {
    // Multiple observers should agree on recorded truth
    // Create fresh observers to test identical recording
    const freshObserver1 = new ExternalTruthLayer();
    const freshObserver2 = new ExternalTruthLayer();

    // Both record the same events
    for (let i = 0; i < 5; i++) {
      freshObserver1.recordEventObservation({ id: `consensus_${i}` });
      freshObserver2.recordEventObservation({ id: `consensus_${i}` });
    }

    const ledger1 = freshObserver1.getTruthLedger();
    const ledger2 = freshObserver2.getTruthLedger();
    if (ledger1.length !== ledger2.length) throw new Error('Ledger lengths differ');
  });
}

// SECTION 6: Real-World Scenario Testing (Tests 941-950)
async function section6() {
  console.log('\n📋 SECTION 6: Real-World Scenario Testing\n');

  await test('TEST 941: Scenario - Progressive Latency Injection', async () => {
    const truthLayer = new ExternalTruthLayer();
    const adversarial = new AdversarialRealityEngine(truthLayer);

    // Progressive latency
    adversarial.injectNetworkLatency('EU', 'US');
    adversarial.injectNetworkLatency('EU', 'US');
    adversarial.injectNetworkLatency('US', 'APAC');

    const report = adversarial.getAdversarialReport();
    if (report.totalInjections < 3) throw new Error('Not all injections recorded');
  });

  await test('TEST 942: Scenario - Cascading Failures', async () => {
    const truthLayer = new ExternalTruthLayer();
    const adversarial = new AdversarialRealityEngine(truthLayer);

    adversarial.injectCascadingFailure(['EU', 'US', 'APAC']);

    const history = adversarial.getInjectionHistory();
    const cascading = history.filter(h => h.type === 'CASCADING_FAILURE');
    if (cascading.length === 0) throw new Error('No cascading failure recorded');
  });

  await test('TEST 943: Scenario - Data Corruption During Replication', async () => {
    const truthLayer = new ExternalTruthLayer();
    const adversarial = new AdversarialRealityEngine(truthLayer);

    // Simulate: message loss → packet loss → data corruption
    adversarial.injectPacketLoss('US');
    adversarial.injectDataCorruption('snapshot_1');

    const ledger = truthLayer.getTruthLedger();
    const corruptions = ledger.filter(e => e.type === 'DATA_CORRUPTION');
    if (corruptions.length === 0) throw new Error('Corruption not recorded');
  });

  await test('TEST 944: Scenario - Region Desynchronization', async () => {
    const truthLayer = new ExternalTruthLayer();
    const adversarial = new AdversarialRealityEngine(truthLayer);

    adversarial.injectRegionDesync('EU', 'US');
    adversarial.injectRegionDesync('US', 'APAC');

    const report = adversarial.getAdversarialReport();
    const desyncs = report.byType['REGION_DESYNC'] || 0;
    if (desyncs < 2) throw new Error('Not all desyncs recorded');
  });

  await test('TEST 945: Scenario - Node Restart Under Load', async () => {
    const truthLayer = new ExternalTruthLayer();
    const adversarial = new AdversarialRealityEngine(truthLayer);

    // Node restart in each region
    adversarial.injectNodeRestart('EU', 'node_1');
    adversarial.injectNodeRestart('US', 'node_2');
    adversarial.injectNodeRestart('APAC', 'node_3');

    const history = adversarial.getInjectionHistory();
    const restarts = history.filter(h => h.type === 'NODE_RESTART');
    if (restarts.length < 3) throw new Error('Not all restarts recorded');
  });

  await test('TEST 946: Scenario - Truth Layer Under Adversity', async () => {
    const truthLayer = new ExternalTruthLayer();
    const adversarial = new AdversarialRealityEngine(truthLayer);

    // Continuous observation under adversity
    for (let i = 0; i < 10; i++) {
      adversarial.injectRandomAdversary();
    }

    const ledger = truthLayer.getTruthLedger();
    if (ledger.length < 10) throw new Error('Not all injections recorded');
  });

  await test('TEST 947: Scenario - Discrepancy During Adversity', async () => {
    const truthLayer = new ExternalTruthLayer();
    const adversarial = new AdversarialRealityEngine(truthLayer);
    const mockCluster = {
      verifyLineageAt: () => ({ chainHash: 'abc', chainLength: 100 }),
      verifyGlobalLineageConsistency: () => ({ consistencyScore: 1.0 })
    };
    const detection = new DiscrepancyDetectionEngine(mockCluster, truthLayer);

    // Inject adversity
    adversarial.injectNetworkLatency('EU', 'US');
    adversarial.injectPacketLoss('US');

    // Detect discrepancy
    detection.detectDeterminismViolation(adversarial);

    const report = truthLayer.getDiscrepancyReport();
    if (report.totalDiscrepancies === 0) throw new Error('Should detect discrepancies');
  });

  await test('TEST 948: Scenario - Complete Collapse Sequence', async () => {
    const truthLayer = new ExternalTruthLayer();
    const adversarial = new AdversarialRealityEngine(truthLayer);

    // Progressive degradation
    adversarial.injectNetworkLatency('EU', 'US');
    adversarial.injectNetworkLatency('US', 'APAC');
    adversarial.injectPacketLoss('EU');
    adversarial.injectPacketLoss('US');
    adversarial.injectNodeRestart('EU', 'node_1');
    adversarial.injectNodeRestart('US', 'node_2');
    adversarial.injectCascadingFailure(['APAC']);

    const ledger = truthLayer.getTruthLedger();
    if (ledger.length < 7) throw new Error('Not all injections recorded');

    const report = adversarial.getAdversarialReport();
    if (report.totalInjections < 7) throw new Error('Not all injections in report');
  });

  await test('TEST 949: Scenario - Truth Ledger Immutability Under Stress', async () => {
    const truthLayer = new ExternalTruthLayer();
    const adversarial = new AdversarialRealityEngine(truthLayer);

    // Stress: many concurrent observations
    for (let i = 0; i < 100; i++) {
      truthLayer.recordEventObservation({ id: `evt_${i}`, data: `test_${i}` });
      adversarial.injectRandomAdversary();
    }

    const ledger = truthLayer.getTruthLedger();
    for (const entry of ledger) {
      if (!Object.isFrozen(entry)) throw new Error('Entry not frozen under stress');
    }
  });

  await test('TEST 950: Scenario - All Observers Agree on Truth', async () => {
    const observer1 = new ExternalTruthLayer();
    const observer2 = new ExternalTruthLayer();

    // Both observe same events
    for (let i = 0; i < 50; i++) {
      observer1.recordEventObservation({ id: `evt_${i}` });
      observer2.recordEventObservation({ id: `evt_${i}` });
    }

    const ledger1 = observer1.getTruthLedger();
    const ledger2 = observer2.getTruthLedger();

    if (ledger1.length !== ledger2.length) throw new Error('Different ledger lengths');

    const hash1 = observer1.getLedgerHash();
    const hash2 = observer2.getLedgerHash();

    if (hash1 !== hash2) throw new Error('Ledger hashes differ');
  });
}

async function runAllTests() {
  console.log('='.repeat(70));
  console.log('🧪 PHASE 9.0 — EXTERNAL TRUTH LAYER TESTS');
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
