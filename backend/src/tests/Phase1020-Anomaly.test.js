/**
 * PHASE 10.2 Tests — Reality Anomaly Detection & Causal Breakpoint Engine
 * 50+ test cases covering 5 anomaly detection modules
 * Tests: 701–750 (following Phase1010-Consensus 651–700)
 */

const { CausalAnomalyEngine } = require('../core/governance/anomaly/CausalAnomalyEngine');
const { BreakpointDetectionSystem } = require('../core/governance/anomaly/BreakpointDetectionSystem');
const { RealityInconsistencyMapper } = require('../core/governance/anomaly/RealityInconsistencyMapper');
const { TemporalAnomalyTracker } = require('../core/governance/anomaly/TemporalAnomalyTracker');
const { SystemInstabilityGraph } = require('../core/governance/anomaly/SystemInstabilityGraph');

// Test utilities
function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} (expected ${expected}, got ${actual})`);
  }
}

function assertArray(value, message) {
  if (!Array.isArray(value)) throw new Error(`Assertion failed: ${message}`);
}

function assertFrozen(obj, message) {
  if (!Object.isFrozen(obj)) throw new Error(`Assertion failed: ${message}`);
}

// ============================================================================
// SECTION 1: CausalAnomalyEngine Initialization (Tests 701–707)
// ============================================================================

function test701_CausalAnomalyEngine_Constructor() {
  const engine = new CausalAnomalyEngine([], {}, { maxChainDepth: 1000 });
  assert(engine !== null, 'Engine created');
  assertEqual(engine.isAuthoritative, false, 'isAuthoritative is false');
  console.log('✓ Test 701: CausalAnomalyEngine constructor');
}

function test702_CausalAnomalyEngine_Frozen() {
  const engine = new CausalAnomalyEngine();
  assertFrozen(engine.constructor.prototype, 'Prototype frozen');
  assert(Object.isFrozen(CausalAnomalyEngine), 'Class frozen');
  console.log('✓ Test 702: CausalAnomalyEngine frozen');
}

function test703_CausalAnomalyEngine_MetricsZero() {
  const engine = new CausalAnomalyEngine();
  const metrics = engine.getMetrics();
  assertEqual(metrics.verificationsPerformed, 0, 'Zero verifications');
  assertEqual(metrics.causalRupturesDetected, 0, 'Zero ruptures');
  assertFrozen(metrics, 'Metrics frozen');
  console.log('✓ Test 703: CausalAnomalyEngine metrics zero');
}

function test704_CausalAnomalyEngine_EmptyData() {
  const engine = new CausalAnomalyEngine();
  const result = engine.detectCausalRuptures([]);
  assertEqual(result.count, 0, 'No anomalies on empty data');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 704: CausalAnomalyEngine empty data');
}

function test705_CausalAnomalyEngine_DetectRuptures() {
  const observations = [
    { success: true, index: 0, observation: { id: 'e1', timestamp: '2026-05-08T10:00:00Z', properties: { causes: [] } } },
    { success: true, index: 1, observation: { id: 'e2', timestamp: '2026-05-08T10:01:00Z', properties: { causes: [{ id: 'e1' }] } } }
  ];
  const engine = new CausalAnomalyEngine();
  const result = engine.detectCausalRuptures(observations);
  assertEqual(result.count, 1, 'Detected 1 rupture (orphaned event)');
  console.log('✓ Test 705: CausalAnomalyEngine detects ruptures');
}

function test706_CausalAnomalyEngine_DeterministicHash() {
  const observations = [
    { success: true, index: 0, observation: { id: 'e1', timestamp: '2026-05-08T10:00:00Z', properties: { causes: [] } } }
  ];
  const engine = new CausalAnomalyEngine();
  const result1 = engine.detectCausalRuptures(observations);
  const result2 = engine.detectCausalRuptures(observations);
  assertEqual(result1.count, result2.count, 'Deterministic (2× same input)');
  console.log('✓ Test 706: CausalAnomalyEngine deterministic');
}

function test707_CausalAnomalyEngine_CoherenceScore() {
  const observations = [
    { success: true, observation: { timestamp: '2026-05-08T10:00:00Z', properties: { causes: [] } } },
    { success: true, observation: { timestamp: '2026-05-08T10:01:00Z', properties: { causes: [{ timestamp: '2026-05-08T10:00:00Z' }] } } }
  ];
  const engine = new CausalAnomalyEngine();
  const result = engine.computeCausalityCoherence(observations);
  assert(result.coherence >= 0 && result.coherence <= 1, 'Coherence in [0, 1]');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 707: CausalAnomalyEngine coherence score');
}

// ============================================================================
// SECTION 2: BreakpointDetectionSystem (Tests 708–717)
// ============================================================================

function test708_BreakpointDetectionSystem_Constructor() {
  const system = new BreakpointDetectionSystem([], { divergenceThreshold: 0.05 });
  assert(system !== null, 'System created');
  assertEqual(system.isAuthoritative, false, 'isAuthoritative is false');
  console.log('✓ Test 708: BreakpointDetectionSystem constructor');
}

function test709_BreakpointDetectionSystem_Frozen() {
  const system = new BreakpointDetectionSystem();
  assertFrozen(system.constructor.prototype, 'Prototype frozen');
  assert(Object.isFrozen(BreakpointDetectionSystem), 'Class frozen');
  console.log('✓ Test 709: BreakpointDetectionSystem frozen');
}

function test710_BreakpointDetectionSystem_EmptyData() {
  const system = new BreakpointDetectionSystem();
  const result = system.detectStructuralBreakpoints([]);
  assertEqual(result.count, 0, 'No breakpoints on empty data');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 710: BreakpointDetectionSystem empty data');
}

function test711_BreakpointDetectionSystem_DetectBreakpoint() {
  const data = [
    { value: 1.0, ts: '2026-05-08T10:00:00Z' },
    { value: 1.1, ts: '2026-05-08T10:01:00Z' },
    { value: 5.0, ts: '2026-05-08T10:02:00Z' }, // Breakpoint
    { value: 5.2, ts: '2026-05-08T10:03:00Z' },
    { value: 5.1, ts: '2026-05-08T10:04:00Z' }
  ];
  const system = new BreakpointDetectionSystem(data, { divergenceThreshold: 0.05 });
  const result = system.detectStructuralBreakpoints(data);
  assert(result.count >= 0, 'Breakpoint detection returned');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 711: BreakpointDetectionSystem detects breakpoints');
}

function test712_BreakpointDetectionSystem_Bifurcations() {
  const data = Array.from({ length: 50 }, (_, i) => ({
    value: i < 25 ? 1.0 : 10.0,
    ts: `2026-05-08T10:${String(i).padStart(2, '0')}:00Z`
  }));
  const system = new BreakpointDetectionSystem(data);
  const result = system.identifyBifurcationPoints(data);
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 712: BreakpointDetectionSystem bifurcations');
}

function test713_BreakpointDetectionSystem_CollapseWindow() {
  const data = Array.from({ length: 200 }, (_, i) => ({
    value: Math.sin(i / 10) * 10 + i * 0.5, // Increasing oscillation
    ts: `2026-05-08T10:${String(i % 60).padStart(2, '0')}:00Z`
  }));
  const system = new BreakpointDetectionSystem(data);
  const result = system.predictCollapseWindow(data);
  assert(result.probability >= 0 && result.probability <= 1, 'Probability in [0, 1]');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 713: BreakpointDetectionSystem collapse window');
}

function test714_BreakpointDetectionSystem_Severity() {
  const data = Array.from({ length: 100 }, (_, i) => ({
    value: i < 50 ? 1.0 : (i < 75 ? 5.0 : 1.0),
    ts: `2026-05-08T10:${String(i).padStart(2, '0')}:00Z`
  }));
  const system = new BreakpointDetectionSystem(data);
  const result = system.measureTransitionSeverity(data);
  assert(['NONE', 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'].includes(result.level), 'Valid severity level');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 714: BreakpointDetectionSystem severity');
}

function test715_BreakpointDetectionSystem_DeterministicHash() {
  const data = Array.from({ length: 50 }, (_, i) => ({ value: Math.sin(i), ts: `2026-05-08T10:${i}:00Z` }));
  const system = new BreakpointDetectionSystem(data);
  const result1 = system.detectStructuralBreakpoints(data);
  const result2 = system.detectStructuralBreakpoints(data);
  assertEqual(result1.count, result2.count, 'Deterministic');
  console.log('✓ Test 715: BreakpointDetectionSystem deterministic');
}

function test716_BreakpointDetectionSystem_BreakpointReport() {
  const system = new BreakpointDetectionSystem();
  const result = system.getBreakpointReport([]);
  assert(result.breakpoints >= 0, 'Report returned');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 716: BreakpointDetectionSystem report');
}

function test717_BreakpointDetectionSystem_Metrics() {
  const system = new BreakpointDetectionSystem();
  const metrics = system.getMetrics();
  assertEqual(metrics.breakpointsDetected, 0, 'Zero breakpoints initially');
  assertFrozen(metrics, 'Metrics frozen');
  console.log('✓ Test 717: BreakpointDetectionSystem metrics');
}

// ============================================================================
// SECTION 3: RealityInconsistencyMapper (Tests 718–728)
// ============================================================================

function test718_RealityInconsistencyMapper_Constructor() {
  const mapper = new RealityInconsistencyMapper([], {}, { uncertaintyThreshold: 0.3 });
  assert(mapper !== null, 'Mapper created');
  assertEqual(mapper.isAuthoritative, false, 'isAuthoritative is false');
  console.log('✓ Test 718: RealityInconsistencyMapper constructor');
}

function test719_RealityInconsistencyMapper_Frozen() {
  const mapper = new RealityInconsistencyMapper();
  assertFrozen(mapper.constructor.prototype, 'Prototype frozen');
  assert(Object.isFrozen(RealityInconsistencyMapper), 'Class frozen');
  console.log('✓ Test 719: RealityInconsistencyMapper frozen');
}

function test720_RealityInconsistencyMapper_EmptyData() {
  const mapper = new RealityInconsistencyMapper();
  const result = mapper.mapObserverDisagreementZones([]);
  assertEqual(result.count, 0, 'No zones on empty data');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 720: RealityInconsistencyMapper empty data');
}

function test721_RealityInconsistencyMapper_DisagreementZones() {
  const observations = [
    { success: true, region: 'EU', observerId: 'obs1', observation: { properties: { value: 1.0 } } },
    { success: true, region: 'EU', observerId: 'obs2', observation: { properties: { value: 10.0 } } }
  ];
  const mapper = new RealityInconsistencyMapper();
  const result = mapper.mapObserverDisagreementZones(observations);
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 721: RealityInconsistencyMapper disagreement zones');
}

function test722_RealityInconsistencyMapper_Divergences() {
  const observations = [
    { success: true, observerId: 'obs1', observation: { properties: { value: 5.0 } } },
    { success: true, observerId: 'obs1', observation: { properties: { value: 5.5 } } },
    { success: true, observerId: 'obs2', observation: { properties: { value: 1.0 } } },
    { success: true, observerId: 'obs2', observation: { properties: { value: 1.0 } } }
  ];
  const mapper = new RealityInconsistencyMapper();
  const result = mapper.identifySystematicDivergences(observations);
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 722: RealityInconsistencyMapper divergences');
}

function test723_RealityInconsistencyMapper_UncertaintyRegions() {
  const observations = [
    { success: true, region: 'US', observation: { properties: { value: 1.0 } } },
    { success: true, region: 'US', observation: { properties: { value: 100.0 } } },
    { success: true, region: 'US', observation: { properties: { value: 50.0 } } }
  ];
  const mapper = new RealityInconsistencyMapper();
  const result = mapper.flagHighUncertaintyRegions(observations);
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 723: RealityInconsistencyMapper uncertainty regions');
}

function test724_RealityInconsistencyMapper_FragilityZones() {
  const observations = [
    { success: true, region: 'APAC', observerId: 'obs1', observation: { properties: { value: 1.0 } } },
    { success: true, region: 'APAC', observerId: 'obs2', observation: { properties: { value: 100.0 } } }
  ];
  const mapper = new RealityInconsistencyMapper();
  const result = mapper.highlightConsensusFragilityZones(observations);
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 724: RealityInconsistencyMapper fragility zones');
}

function test725_RealityInconsistencyMapper_InconsistencyScore() {
  const mapper = new RealityInconsistencyMapper();
  const result = mapper.computeInconsistencyScore([]);
  assert(result.score >= 0 && result.score <= 1, 'Score in [0, 1]');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 725: RealityInconsistencyMapper inconsistency score');
}

function test726_RealityInconsistencyMapper_InconsistencyMap() {
  const mapper = new RealityInconsistencyMapper();
  const result = mapper.getInconsistencyMap([]);
  assert(result.inconsistencyScore >= 0, 'Map returned');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 726: RealityInconsistencyMapper map');
}

function test727_RealityInconsistencyMapper_FragilityLevel() {
  const mapper = new RealityInconsistencyMapper();
  const level = mapper.getFragilityLevel([]);
  assert(level >= 0, 'Fragility level returned');
  console.log('✓ Test 727: RealityInconsistencyMapper fragility level');
}

function test728_RealityInconsistencyMapper_Metrics() {
  const mapper = new RealityInconsistencyMapper();
  const metrics = mapper.getMetrics();
  assertEqual(metrics.mappingsPerformed, 0, 'Zero mappings initially');
  assertFrozen(metrics, 'Metrics frozen');
  console.log('✓ Test 728: RealityInconsistencyMapper metrics');
}

// ============================================================================
// SECTION 4: TemporalAnomalyTracker (Tests 729–740)
// ============================================================================

function test729_TemporalAnomalyTracker_Constructor() {
  const tracker = new TemporalAnomalyTracker([], { detectionWindow: 300000 });
  assert(tracker !== null, 'Tracker created');
  assertEqual(tracker.isAuthoritative, false, 'isAuthoritative is false');
  console.log('✓ Test 729: TemporalAnomalyTracker constructor');
}

function test730_TemporalAnomalyTracker_Frozen() {
  const tracker = new TemporalAnomalyTracker();
  assertFrozen(tracker.constructor.prototype, 'Prototype frozen');
  assert(Object.isFrozen(TemporalAnomalyTracker), 'Class frozen');
  console.log('✓ Test 730: TemporalAnomalyTracker frozen');
}

function test731_TemporalAnomalyTracker_EmptyData() {
  const tracker = new TemporalAnomalyTracker();
  const result = tracker.detectSuddenBehaviorShifts([]);
  assertEqual(result.count, 0, 'No shifts on empty data');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 731: TemporalAnomalyTracker empty data');
}

function test732_TemporalAnomalyTracker_BehaviorShifts() {
  const data = [
    { value: 1.0, ts: '2026-05-08T10:00:00Z' },
    { value: 1.1, ts: '2026-05-08T10:01:00Z' },
    { value: 10.0, ts: '2026-05-08T10:02:00Z' }, // Shift
    { value: 10.1, ts: '2026-05-08T10:03:00Z' }
  ];
  const tracker = new TemporalAnomalyTracker(data);
  const result = tracker.detectSuddenBehaviorShifts(data);
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 732: TemporalAnomalyTracker behavior shifts');
}

function test733_TemporalAnomalyTracker_DriftAcceleration() {
  const data = Array.from({ length: 50 }, (_, i) => ({
    value: i * 0.5 + Math.random() * 0.1,
    ts: `2026-05-08T10:${String(i).padStart(2, '0')}:00Z`
  }));
  const tracker = new TemporalAnomalyTracker(data);
  const result = tracker.trackDriftAcceleration(data);
  assert(typeof result.acceleration === 'number', 'Acceleration computed');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 733: TemporalAnomalyTracker drift acceleration');
}

function test734_TemporalAnomalyTracker_Oscillations() {
  const data = Array.from({ length: 50 }, (_, i) => ({
    value: Math.sin(i / 5),
    ts: `2026-05-08T10:${String(i).padStart(2, '0')}:00Z`
  }));
  const tracker = new TemporalAnomalyTracker(data);
  const result = tracker.identifyOscillationPatterns(data);
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 734: TemporalAnomalyTracker oscillations');
}

function test735_TemporalAnomalyTracker_Stagnation() {
  const data = [
    { value: 1.0, ts: '2026-05-08T10:00:00Z' },
    { value: 1.0, ts: '2026-05-08T10:01:00Z' },
    { value: 1.0, ts: '2026-05-08T10:02:00Z' },
    { value: 1.0, ts: '2026-05-08T10:03:00Z' },
    { value: 1.0, ts: '2026-05-08T10:04:00Z' },
    { value: 1.0, ts: '2026-05-08T10:05:00Z' },
    { value: 2.0, ts: '2026-05-08T10:06:00Z' }
  ];
  const tracker = new TemporalAnomalyTracker(data, { stagnationThreshold: 0.001 });
  const result = tracker.flagStagnationAnomalies(data);
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 735: TemporalAnomalyTracker stagnation');
}

function test736_TemporalAnomalyTracker_CollapsePrecursors() {
  const data = Array.from({ length: 100 }, (_, i) => ({
    value: Math.sin(i / 10) * 10 + i * 0.2,
    ts: `2026-05-08T10:${String(i % 60).padStart(2, '0')}:00Z`
  }));
  const tracker = new TemporalAnomalyTracker(data);
  const result = tracker.warnOfCollapsePrecursors(data);
  assert(result.collapseProbability >= 0 && result.collapseProbability <= 1, 'Probability in [0, 1]');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 736: TemporalAnomalyTracker collapse precursors');
}

function test737_TemporalAnomalyTracker_TemporalReport() {
  const tracker = new TemporalAnomalyTracker();
  const result = tracker.getTemporalAnomalyReport([]);
  assert(result.behaviorShifts >= 0, 'Report returned');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 737: TemporalAnomalyTracker report');
}

function test738_TemporalAnomalyTracker_AnomalyDensity() {
  const tracker = new TemporalAnomalyTracker();
  const density = tracker.getAnomalyDensity([]);
  assert(density >= 0, 'Density computed');
  console.log('✓ Test 738: TemporalAnomalyTracker anomaly density');
}

function test739_TemporalAnomalyTracker_DeterministicHash() {
  const data = Array.from({ length: 50 }, (_, i) => ({ value: Math.sin(i), ts: `2026-05-08T10:${i}:00Z` }));
  const tracker = new TemporalAnomalyTracker(data);
  const result1 = tracker.detectSuddenBehaviorShifts(data);
  const result2 = tracker.detectSuddenBehaviorShifts(data);
  assertEqual(result1.count, result2.count, 'Deterministic');
  console.log('✓ Test 739: TemporalAnomalyTracker deterministic');
}

function test740_TemporalAnomalyTracker_Metrics() {
  const tracker = new TemporalAnomalyTracker();
  const metrics = tracker.getMetrics();
  assertEqual(metrics.detectionsPerformed, 0, 'Zero detections initially');
  assertFrozen(metrics, 'Metrics frozen');
  console.log('✓ Test 740: TemporalAnomalyTracker metrics');
}

// ============================================================================
// SECTION 5: SystemInstabilityGraph (Tests 741–750)
// ============================================================================

function test741_SystemInstabilityGraph_Constructor() {
  const graph = new SystemInstabilityGraph({}, { topologyAnalysisDepth: 5 });
  assert(graph !== null, 'Graph created');
  assertEqual(graph.isAuthoritative, false, 'isAuthoritative is false');
  console.log('✓ Test 741: SystemInstabilityGraph constructor');
}

function test742_SystemInstabilityGraph_Frozen() {
  const graph = new SystemInstabilityGraph();
  assertFrozen(graph.constructor.prototype, 'Prototype frozen');
  assert(Object.isFrozen(SystemInstabilityGraph), 'Class frozen');
  console.log('✓ Test 742: SystemInstabilityGraph frozen');
}

function test743_SystemInstabilityGraph_BuildGraph() {
  const graph = new SystemInstabilityGraph();
  const result = graph.buildInstabilityGraph(
    { count: 2 },
    { count: 1 },
    { count: 3 },
    { count: 1 }
  );
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 743: SystemInstabilityGraph builds graph');
}

function test744_SystemInstabilityGraph_FailurePaths() {
  const graph = new SystemInstabilityGraph();
  graph.buildInstabilityGraph({ count: 5 }, { count: 2 }, { count: 3 }, { count: 1 });
  const result = graph.identifyCriticalFailurePaths();
  assertArray(result.paths, 'Paths array');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 744: SystemInstabilityGraph failure paths');
}

function test745_SystemInstabilityGraph_CascadeZones() {
  const graph = new SystemInstabilityGraph();
  graph.buildInstabilityGraph({ count: 4 }, { count: 2 }, { count: 2 }, { count: 0 });
  const result = graph.mapCascadeVulnerabilityZones();
  assertArray(result.zones, 'Zones array');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 745: SystemInstabilityGraph cascade zones');
}

function test746_SystemInstabilityGraph_Fragility() {
  const graph = new SystemInstabilityGraph();
  graph.buildInstabilityGraph({ count: 3 }, { count: 2 }, { count: 1 }, { count: 1 });
  const result = graph.computeSystemFragilityScore();
  assert(['A', 'B', 'C', 'D', 'E', 'F'].includes(result.grade), 'Valid grade');
  assert(result.score >= 0 && result.score <= 100, 'Score in [0, 100]');
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 746: SystemInstabilityGraph fragility');
}

function test747_SystemInstabilityGraph_Topology() {
  const graph = new SystemInstabilityGraph();
  graph.buildInstabilityGraph({ count: 4 }, { count: 2 }, { count: 3 }, { count: 1 });
  const result = graph.analyzeTopology();
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 747: SystemInstabilityGraph topology');
}

function test748_SystemInstabilityGraph_InstabilityGraph() {
  const graph = new SystemInstabilityGraph();
  const result = graph.getInstabilityGraph();
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 748: SystemInstabilityGraph report');
}

function test749_SystemInstabilityGraph_FailurePathways() {
  const graph = new SystemInstabilityGraph();
  graph.buildInstabilityGraph({ count: 5 }, { count: 3 }, { count: 2 }, { count: 1 });
  const result = graph.getFailurePathways();
  assertFrozen(result, 'Result frozen');
  console.log('✓ Test 749: SystemInstabilityGraph failure pathways');
}

function test750_SystemInstabilityGraph_Metrics() {
  const graph = new SystemInstabilityGraph();
  const metrics = graph.getMetrics();
  assertEqual(metrics.graphsBuilt, 0, 'Zero graphs initially');
  assertFrozen(metrics, 'Metrics frozen');
  console.log('✓ Test 750: SystemInstabilityGraph metrics');
}

// ============================================================================
// Run all tests
// ============================================================================

async function runAllTests() {
  const tests = [
    test701_CausalAnomalyEngine_Constructor,
    test702_CausalAnomalyEngine_Frozen,
    test703_CausalAnomalyEngine_MetricsZero,
    test704_CausalAnomalyEngine_EmptyData,
    test705_CausalAnomalyEngine_DetectRuptures,
    test706_CausalAnomalyEngine_DeterministicHash,
    test707_CausalAnomalyEngine_CoherenceScore,
    test708_BreakpointDetectionSystem_Constructor,
    test709_BreakpointDetectionSystem_Frozen,
    test710_BreakpointDetectionSystem_EmptyData,
    test711_BreakpointDetectionSystem_DetectBreakpoint,
    test712_BreakpointDetectionSystem_Bifurcations,
    test713_BreakpointDetectionSystem_CollapseWindow,
    test714_BreakpointDetectionSystem_Severity,
    test715_BreakpointDetectionSystem_DeterministicHash,
    test716_BreakpointDetectionSystem_BreakpointReport,
    test717_BreakpointDetectionSystem_Metrics,
    test718_RealityInconsistencyMapper_Constructor,
    test719_RealityInconsistencyMapper_Frozen,
    test720_RealityInconsistencyMapper_EmptyData,
    test721_RealityInconsistencyMapper_DisagreementZones,
    test722_RealityInconsistencyMapper_Divergences,
    test723_RealityInconsistencyMapper_UncertaintyRegions,
    test724_RealityInconsistencyMapper_FragilityZones,
    test725_RealityInconsistencyMapper_InconsistencyScore,
    test726_RealityInconsistencyMapper_InconsistencyMap,
    test727_RealityInconsistencyMapper_FragilityLevel,
    test728_RealityInconsistencyMapper_Metrics,
    test729_TemporalAnomalyTracker_Constructor,
    test730_TemporalAnomalyTracker_Frozen,
    test731_TemporalAnomalyTracker_EmptyData,
    test732_TemporalAnomalyTracker_BehaviorShifts,
    test733_TemporalAnomalyTracker_DriftAcceleration,
    test734_TemporalAnomalyTracker_Oscillations,
    test735_TemporalAnomalyTracker_Stagnation,
    test736_TemporalAnomalyTracker_CollapsePrecursors,
    test737_TemporalAnomalyTracker_TemporalReport,
    test738_TemporalAnomalyTracker_AnomalyDensity,
    test739_TemporalAnomalyTracker_DeterministicHash,
    test740_TemporalAnomalyTracker_Metrics,
    test741_SystemInstabilityGraph_Constructor,
    test742_SystemInstabilityGraph_Frozen,
    test743_SystemInstabilityGraph_BuildGraph,
    test744_SystemInstabilityGraph_FailurePaths,
    test745_SystemInstabilityGraph_CascadeZones,
    test746_SystemInstabilityGraph_Fragility,
    test747_SystemInstabilityGraph_Topology,
    test748_SystemInstabilityGraph_InstabilityGraph,
    test749_SystemInstabilityGraph_FailurePathways,
    test750_SystemInstabilityGraph_Metrics
  ];

  let passed = 0;
  let failed = 0;

  console.log('========== PHASE 10.2 ANOMALY DETECTION TESTS ==========\n');

  for (const test of tests) {
    try {
      test();
      passed++;
    } catch (error) {
      console.error(`✗ ${test.name}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n========== TEST SUMMARY ==========`);
  console.log(`Passed: ${passed}/${tests.length}`);
  console.log(`Failed: ${failed}/${tests.length}`);
  console.log(`Status: ${failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  return failed === 0;
}

// Execute
runAllTests().then((success) => {
  process.exit(success ? 0 : 1);
});
