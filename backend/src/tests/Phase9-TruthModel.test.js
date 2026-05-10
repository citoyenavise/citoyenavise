/**
 * PHASE 9.0 — Truth Model Tests
 *
 * Validates mathematical formalization of distributed system truth:
 * - Internal State IS(t)
 * - External Observation EO(t)
 * - Projection Function P(IS(t))
 * - Divergence Function D(t)
 * - State Classification via thresholds
 * - Truth Function T(t)
 * - Collapse Detection via variance
 */

const ExternalObservationMapping = require('../core/external-truth-layer/ExternalObservationMapping');
const DivergenceFunctionEngine = require('../core/external-truth-layer/DivergenceFunctionEngine');
const CollapseDetectionModel = require('../core/external-truth-layer/CollapseDetectionModel');

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

// ============================================================================
// SECTION 1: External Observation Mapping (Projection Function P(IS(t)))
// ============================================================================

async function section1() {
  console.log('\n📋 SECTION 1: External Observation Mapping (P(IS(t)))\n');

  const mapper = new ExternalObservationMapping();

  await test('TEST 1001: Constructor', () => {
    if (!mapper) throw new Error('Failed to create');
    if (!mapper.hashAlgorithm) throw new Error('No hash algorithm');
  });

  await test('TEST 1002: Project empty internal state', () => {
    const is = {};
    const proj = mapper.projectInternalState(is);
    if (!proj.projected_state_hash) throw new Error('No state hash');
    if (!proj.projection_hash) throw new Error('No projection hash');
  });

  await test('TEST 1003: Projection is non-authoritative', () => {
    const is = { snapshots: [], wal_entries: [] };
    const proj = mapper.projectInternalState(is);
    if (proj.isAuthoritative !== false) throw new Error('Should not be authoritative');
  });

  await test('TEST 1004: Project internal state with snapshots', () => {
    const is = {
      snapshots: [{ id: 'snap_1', data: {} }],
      wal_entries: [{ id: 'wal_1', op: 'write' }]
    };
    const proj = mapper.projectInternalState(is);
    if (!proj.projected_state_hash) throw new Error('No state hash');
  });

  await test('TEST 1005: Projections are deterministic', () => {
    const is = { snapshots: [{ id: 'snap_1' }], wal_entries: [] };
    const proj1 = mapper.projectInternalState(is);
    const proj2 = mapper.projectInternalState(is);
    if (proj1.projected_state_hash !== proj2.projected_state_hash) {
      throw new Error('Projections not deterministic');
    }
  });

  await test('TEST 1006: Project consistency score', () => {
    const is = {
      snapshots: [{ id: 's1' }],
      wal_entries: [{ id: 'w1' }],
      consistency_score: 0.95
    };
    const proj = mapper.projectInternalState(is);
    if (proj.projected_consistency_score !== 0.95) throw new Error('Score not projected');
  });

  await test('TEST 1007: Project latencies', () => {
    const is = {
      region_state: { EU: {}, US: {}, APAC: {} },
      adversarial_conditions: []
    };
    const proj = mapper.projectInternalState(is);
    if (!proj.projected_latencies) throw new Error('No latencies');
    if (!proj.projected_latencies.EU_to_US) throw new Error('No EU_to_US latency');
  });

  await test('TEST 1008: Get projection components', () => {
    const components = mapper.getProjectionComponents();
    if (!components.state_hash) throw new Error('Missing state_hash');
    if (!components.consistency_score) throw new Error('Missing consistency_score');
  });

  await test('TEST 1009: Metrics tracking', () => {
    const metrics = mapper.getMetrics();
    if (typeof metrics.projectionsComputed !== 'number') throw new Error('No projection count');
    if (typeof metrics.cache_efficiency !== 'number') throw new Error('No cache efficiency');
  });

  await test('TEST 1010: Cache clearing', () => {
    mapper.clearCache();
    const metrics = mapper.getMetrics();
    if (metrics.cache_size !== 0) throw new Error('Cache not cleared');
  });
}

// ============================================================================
// SECTION 2: Divergence Function Engine (D(t))
// ============================================================================

async function section2() {
  console.log('\n📋 SECTION 2: Divergence Function Engine (D(t))\n');

  const engine = new DivergenceFunctionEngine();

  await test('TEST 2001: Constructor', () => {
    if (!engine) throw new Error('Failed to create');
    if (!engine.weights) throw new Error('No weights');
  });

  await test('TEST 2002: Weights normalized', () => {
    let totalWeight = 0;
    for (const weight of Object.values(engine.weights)) {
      totalWeight += weight;
    }
    if (Math.abs(totalWeight - 1.0) > 0.01) throw new Error('Weights not normalized');
  });

  await test('TEST 2003: Compute divergence on matching observation and projection', () => {
    const eo = {
      sampled_state_hash: 'abc123',
      external_consistency: 0.95,
      region_latency: { EU_to_US: 50, US_to_APAC: 50, APAC_to_EU: 50 },
      packet_loss: { EU: 0.0, US: 0.0, APAC: 0.0 },
      node_status: { EU: { node_1: 'up' }, US: { node_1: 'up' }, APAC: { node_1: 'up' } }
    };

    const proj = {
      projected_state_hash: 'abc123',
      projected_consistency_score: 0.95,
      projected_latencies: { EU_to_US: 50, US_to_APAC: 50, APAC_to_EU: 50 },
      projected_packet_loss: { EU: 0.0, US: 0.0, APAC: 0.0 },
      projected_node_status: { EU: { node_1: 'up' }, US: { node_1: 'up' }, APAC: { node_1: 'up' } }
    };

    const div = engine.computeDivergence(eo, proj);
    if (div.total_divergence > 0.1) throw new Error('Should have low divergence');
  });

  await test('TEST 2004: Compute divergence on mismatching states', () => {
    const eo = {
      sampled_state_hash: 'abc123',
      external_consistency: 0.5,
      region_latency: { EU_to_US: 500, US_to_APAC: 500, APAC_to_EU: 500 },
      packet_loss: { EU: 0.5, US: 0.0, APAC: 0.0 },
      node_status: { EU: { node_1: 'down' }, US: { node_1: 'up' }, APAC: { node_1: 'up' } }
    };

    const proj = {
      projected_state_hash: 'def456',
      projected_consistency_score: 0.95,
      projected_latencies: { EU_to_US: 50, US_to_APAC: 50, APAC_to_EU: 50 },
      projected_packet_loss: { EU: 0.0, US: 0.0, APAC: 0.0 },
      projected_node_status: { EU: { node_1: 'up' }, US: { node_1: 'up' }, APAC: { node_1: 'up' } }
    };

    const div = engine.computeDivergence(eo, proj);
    // Weighted components: state hash (20%), consistency (15%), latency (15%), packet loss (15%), nodes (15%)
    // We have divergence across state hash, consistency, latency, packet loss, and node status
    // Should be at least 0.10 (10%)
    if (div.total_divergence < 0.10) throw new Error('Should have some divergence');
    if (div.total_divergence === 0) throw new Error('Divergence should not be zero');
  });

  await test('TEST 2005: Divergence is normalized to [0, 1]', () => {
    const eo = { sampled_state_hash: 'a' };
    const proj = { projected_state_hash: 'b' };
    const div = engine.computeDivergence(eo, proj);
    if (div.total_divergence < 0 || div.total_divergence > 1.0) {
      throw new Error('Divergence out of range');
    }
  });

  await test('TEST 2006: Component divergences computed', () => {
    const eo = {
      sampled_state_hash: 'abc',
      external_consistency: 0.8,
      region_latency: { EU_to_US: 100, US_to_APAC: 100, APAC_to_EU: 100 },
      packet_loss: { EU: 0.1, US: 0.0, APAC: 0.0 },
      node_status: { EU: { n1: 'up' }, US: { n1: 'up' }, APAC: { n1: 'up' } }
    };

    const proj = {
      projected_state_hash: 'abc',
      projected_consistency_score: 0.8,
      projected_latencies: { EU_to_US: 100, US_to_APAC: 100, APAC_to_EU: 100 },
      projected_packet_loss: { EU: 0.0, US: 0.0, APAC: 0.0 },
      projected_node_status: { EU: { n1: 'up' }, US: { n1: 'up' }, APAC: { n1: 'up' } }
    };

    const div = engine.computeDivergence(eo, proj);
    if (!div.components) throw new Error('No components');
    if (typeof div.components.CONSISTENCY_SCORE === 'undefined') throw new Error('Missing consistency');
  });

  await test('TEST 2007: Divergence history tracked', () => {
    const eo = { sampled_state_hash: 'a' };
    const proj = { projected_state_hash: 'b' };
    engine.computeDivergence(eo, proj);
    const history = engine.getDivergenceHistory();
    if (history.history.length === 0) throw new Error('No history recorded');
  });

  await test('TEST 2008: Metrics updated', () => {
    const metrics = engine.getMetrics();
    if (metrics.divergencesComputed < 1) throw new Error('No metrics');
  });

  await test('TEST 2009: Reset clears history', () => {
    engine.reset();
    const history = engine.getDivergenceHistory();
    if (history.history.length > 0) throw new Error('History not cleared');
  });

  await test('TEST 2010: Divergence non-authoritative', () => {
    const eo = { sampled_state_hash: 'x' };
    const proj = { projected_state_hash: 'y' };
    const div = engine.computeDivergence(eo, proj);
    if (div.isAuthoritative !== false) throw new Error('Should not be authoritative');
  });
}

// ============================================================================
// SECTION 3: Collapse Detection Model (T(t) & Collapse Detection)
// ============================================================================

async function section3() {
  console.log('\n📋 SECTION 3: Collapse Detection Model (T(t))\n');

  const detector = new CollapseDetectionModel();

  await test('TEST 3001: Constructor', () => {
    if (!detector) throw new Error('Failed to create');
    if (!detector.thresholds) throw new Error('No thresholds');
  });

  await test('TEST 3002: Thresholds configured', () => {
    if (detector.thresholds.epsilon_1 >= detector.thresholds.epsilon_2) {
      throw new Error('Thresholds not ordered');
    }
    if (detector.thresholds.epsilon_2 >= detector.thresholds.epsilon_3) {
      throw new Error('Thresholds not ordered');
    }
  });

  await test('TEST 3003: Classify state TRUE', () => {
    const classification = detector.classifyState(0.02);
    if (classification.state !== 'TRUE') throw new Error('Should be TRUE');
    if (!classification.is_accurate) throw new Error('Should be accurate');
  });

  await test('TEST 3004: Classify state DEGRADED', () => {
    const classification = detector.classifyState(0.10);
    if (classification.state !== 'DEGRADED') throw new Error('Should be DEGRADED');
    if (!classification.is_operable) throw new Error('Should be operable');
  });

  await test('TEST 3005: Classify state BROKEN', () => {
    const classification = detector.classifyState(0.30);
    if (classification.state !== 'BROKEN') throw new Error('Should be BROKEN');
    if (classification.is_at_risk !== true) throw new Error('Should be at risk');
  });

  await test('TEST 3006: Classify state COLLAPSED', () => {
    const classification = detector.classifyState(0.60);
    if (classification.state !== 'COLLAPSED') throw new Error('Should be COLLAPSED');
    if (!classification.requires_intervention) throw new Error('Should require intervention');
  });

  await test('TEST 3007: Analyze for collapse (low divergence)', () => {
    const div = { total_divergence: 0.1, components: { STATE_HASH: 0.05 } };
    const analysis = detector.analyzeForCollapse(div);
    if (analysis.is_collapse) throw new Error('Should not detect collapse');
  });

  await test('TEST 3008: Analyze for collapse (high z-score)', () => {
    // Need to build history first
    for (let i = 0; i < 60; i++) {
      const div = { total_divergence: 0.1, components: { STATE_HASH: 0.05 } };
      detector.analyzeForCollapse(div);
    }

    // Now inject spike
    const spike = { total_divergence: 0.75, components: { STATE_HASH: 0.5 } };
    const analysis = detector.analyzeForCollapse(spike);
    if (analysis.z_score <= 3.0) throw new Error('Z-score not elevated');
  });

  await test('TEST 3009: Compute truth verdict', () => {
    const divResult = { total_divergence: 0.02, components: { STATE_HASH: 0.01 } };
    const is = { snapshots: [], wal_entries: [] };
    const truth = detector.computeTruth(divResult, is);
    if (!truth.state) throw new Error('No state in verdict');
    if (truth.authoritative !== true) throw new Error('Truth not authoritative');
  });

  await test('TEST 3010: Truth function authoritative', () => {
    const truth = detector.computeTruth(
      { total_divergence: 0.0, components: {} },
      {}
    );
    if (!truth.authoritative) throw new Error('Truth should be authoritative');
  });
}

// ============================================================================
// SECTION 4: Truth Model Integration
// ============================================================================

async function section4() {
  console.log('\n📋 SECTION 4: Truth Model Integration\n');

  const mapper = new ExternalObservationMapping();
  const divergenceEngine = new DivergenceFunctionEngine();
  const detector = new CollapseDetectionModel();

  await test('TEST 4001: Full pipeline - healthy system', () => {
    // IS(t): What cluster claims
    const is = {
      snapshots: [{ id: 's1' }],
      wal_entries: [{ id: 'w1' }],
      consistency_score: 0.98,
      region_state: { EU: {}, US: {}, APAC: {} }
    };

    // P(IS(t)): Project to observable space
    const projection = mapper.projectInternalState(is);

    // EO(t): What we observe externally (matches projection)
    const observation = {
      sampled_state_hash: projection.projected_state_hash,
      external_consistency: 0.98,
      region_latency: { EU_to_US: 50, US_to_APAC: 50, APAC_to_EU: 50 },
      packet_loss: { EU: 0.0, US: 0.0, APAC: 0.0 },
      node_status: { EU: { n1: 'up' }, US: { n1: 'up' }, APAC: { n1: 'up' } }
    };

    // D(t): Compute divergence
    const divergence = divergenceEngine.computeDivergence(observation, projection);

    // T(t): Get truth verdict
    const truth = detector.computeTruth(divergence, is);

    if (truth.state !== 'TRUE') throw new Error('Should be TRUE');
    if (!truth.is_accurate) throw new Error('Should be accurate');
  });

  await test('TEST 4002: Full pipeline - degraded system', () => {
    const is = {
      snapshots: [{ id: 's1' }],
      wal_entries: [{ id: 'w1' }],
      consistency_score: 0.95,
      region_state: { EU: {}, US: {}, APAC: {} }
    };

    const projection = mapper.projectInternalState(is);

    // Observation diverges slightly
    const observation = {
      sampled_state_hash: projection.projected_state_hash,
      external_consistency: 0.80,
      region_latency: { EU_to_US: 150, US_to_APAC: 200, APAC_to_EU: 150 },
      packet_loss: { EU: 0.02, US: 0.02, APAC: 0.01 },
      node_status: { EU: { n1: 'up' }, US: { n1: 'up' }, APAC: { n1: 'up' } }
    };

    const divergence = divergenceEngine.computeDivergence(observation, projection);
    const truth = detector.computeTruth(divergence, is);

    if (truth.state !== 'DEGRADED') throw new Error('Should be DEGRADED');
    if (!truth.is_operable) throw new Error('Should be operable');
  });

  await test('TEST 4003: All outputs frozen', () => {
    const projection = mapper.projectInternalState({});
    if (!Object.isFrozen(projection)) throw new Error('Projection not frozen');

    const divergence = divergenceEngine.computeDivergence({}, {});
    if (!Object.isFrozen(divergence)) throw new Error('Divergence not frozen');

    const classification = detector.classifyState(0.1);
    if (!Object.isFrozen(classification)) throw new Error('Classification not frozen');
  });

  await test('TEST 4004: Truth derivation chain complete', () => {
    const is = { snapshots: [] };
    const proj = mapper.projectInternalState(is);
    const eo = { sampled_state_hash: proj.projected_state_hash };
    const div = divergenceEngine.computeDivergence(eo, proj);
    const truth = detector.computeTruth(div, is);

    if (!truth.state) throw new Error('Incomplete chain');
    if (truth.authoritative !== true) throw new Error('Final verdict not authoritative');
  });

  await test('TEST 4005: No self-certification allowed', () => {
    // If we only trust IS(t).consistency_score without external comparison, that's self-certification
    // Our truth function should ONLY depend on D(t) = distance(EO, P(IS))

    const is = { consistency_score: 0.99 }; // Cluster claims high consistency
    const proj = mapper.projectInternalState(is);
    const eo = {
      external_consistency: 0.1, // But external measurement shows low
      sampled_state_hash: 'different'
    };

    const divergence = divergenceEngine.computeDivergence(eo, proj);
    const truth = detector.computeTruth(divergence, is);

    // Truth should reflect the DIVERGENCE, not the cluster's self-report
    if (truth.state === 'TRUE') throw new Error('Self-certification detected!');
  });
}

// ============================================================================
// SECTION 5: Real-World Scenarios
// ============================================================================

async function section5() {
  console.log('\n📋 SECTION 5: Real-World Scenarios\n');

  const mapper = new ExternalObservationMapping();
  const divergenceEngine = new DivergenceFunctionEngine();
  const detector = new CollapseDetectionModel();

  await test('TEST 5001: Scenario - Network Latency Injection', () => {
    const is = {
      region_state: { EU: {}, US: {}, APAC: {} },
      adversarial_conditions: [{ type: 'NETWORK_LATENCY', latencyMs: 800 }]
    };

    const proj = mapper.projectInternalState(is);
    const eo = {
      region_latency: { EU_to_US: 800, US_to_APAC: 50, APAC_to_EU: 50 },
      sampled_state_hash: proj.projected_state_hash,
      external_consistency: 0.9,
      packet_loss: { EU: 0.0, US: 0.0, APAC: 0.0 },
      node_status: { EU: { n1: 'up' }, US: { n1: 'up' }, APAC: { n1: 'up' } }
    };

    const divergence = divergenceEngine.computeDivergence(eo, proj);
    const truth = detector.computeTruth(divergence, is, {
      is_under_adversarial_conditions: true
    });

    // Truth function should produce valid verdict with adversarial context noted
    if (!truth.state) throw new Error('No state in verdict');
    if (!truth.context) throw new Error('No context in verdict');
  });

  await test('TEST 5002: Scenario - Data Corruption', () => {
    const is = { snapshots: [{ id: 's1' }] };
    const proj = mapper.projectInternalState(is);

    const eo = {
      sampled_state_hash: 'corrupted_hash',
      corrupted_entries: [{ id: 'e1' }, { id: 'e2' }],
      total_entries: 100,
      external_consistency: 0.5,
      region_latency: { EU_to_US: 50, US_to_APAC: 50, APAC_to_EU: 50 },
      packet_loss: { EU: 0.0, US: 0.0, APAC: 0.0 },
      node_status: { EU: { n1: 'up' }, US: { n1: 'up' }, APAC: { n1: 'up' } }
    };

    const divergence = divergenceEngine.computeDivergence(eo, proj);
    const truth = detector.computeTruth(divergence, is);

    // Truth function should produce valid verdict for corruption scenario
    if (!truth.state) throw new Error('No state in verdict');
    if (!truth.divergence && truth.divergence !== 0) throw new Error('No divergence in verdict');
  });

  await test('TEST 5003: Scenario - Regional Clock Desync', () => {
    const is = {
      region_state: { EU: {}, US: {} },
      events: [{ ts: '2026-05-08T10:00:00Z' }]
    };

    const proj = mapper.projectInternalState(is);

    // EU observes event at 10:00, US at 10:05 (5s clock skew)
    const eo = {
      sampled_state_hash: proj.projected_state_hash,
      message_observations: [
        { sent_at: '2026-05-08T10:00:00Z', received_at: '2026-05-08T10:00:05Z' }
      ],
      external_consistency: 0.85,
      region_latency: { EU_to_US: 50 },
      packet_loss: { EU: 0.0 },
      node_status: { EU: { n1: 'up' }, US: { n1: 'up' } }
    };

    const divergence = divergenceEngine.computeDivergence(eo, proj);
    const truth = detector.computeTruth(divergence, is);

    // Temporal divergence should be detected
    if (truth.state === 'TRUE') throw new Error('Should detect temporal divergence');
  });

  await test('TEST 5004: Metrics and reporting', () => {
    const mapperMetrics = mapper.getMetrics();
    const divergenceMetrics = divergenceEngine.getMetrics();
    const detectorMetrics = detector.getMetrics();

    if (!mapperMetrics.projectionsComputed) throw new Error('No mapper metrics');
    if (!divergenceMetrics.divergencesComputed) throw new Error('No divergence metrics');
    if (!detectorMetrics.window_size) throw new Error('No detector metrics');
  });

  await test('TEST 5005: State transitions', () => {
    // Start at TRUE
    let div = 0.02;
    let state = detector.classifyState(div).state;
    if (state !== 'TRUE') throw new Error('Should start TRUE');

    // Transition to DEGRADED
    div = 0.10;
    state = detector.classifyState(div).state;
    if (state !== 'DEGRADED') throw new Error('Should be DEGRADED');

    // Transition to BROKEN
    div = 0.30;
    state = detector.classifyState(div).state;
    if (state !== 'BROKEN') throw new Error('Should be BROKEN');

    // Transition to COLLAPSED
    div = 0.60;
    state = detector.classifyState(div).state;
    if (state !== 'COLLAPSED') throw new Error('Should be COLLAPSED');
  });
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('='.repeat(70));
  console.log('🧪 PHASE 9.0 — TRUTH MODEL FORMALIZATION TESTS');
  console.log('='.repeat(70));

  await section1();
  await section2();
  await section3();
  await section4();
  await section5();

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
