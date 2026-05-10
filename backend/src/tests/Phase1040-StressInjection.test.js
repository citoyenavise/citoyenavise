/**
 * PHASE 10.4 — Stress Injection Simulation Layer Tests
 * 50 tests covering all 5 modules
 * ~800 LOC
 */

'use strict';

const StressInjectionEngine = require('../phases/phase10/StressInjectionEngine');
const ControlledChaosSimulator = require('../phases/phase10/ControlledChaosSimulator');
const ObservationPerturbationLayer = require('../phases/phase10/ObservationPerturbationLayer');
const ResilienceValidationCore = require('../phases/phase10/ResilienceValidationCore');
const ExtremeConditionRunner = require('../phases/phase10/ExtremeConditionRunner');

// Test tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg) {
  if (!value) {
    throw new Error(`${msg}: expected true`);
  }
}

function assertFrozen(obj, msg) {
  if (!Object.isFrozen(obj)) {
    throw new Error(`${msg}: object not frozen`);
  }
}

// ============================================================================
// SECTION 1: StressInjectionEngine (tests 1-10)
// ============================================================================

async function test001_StressInjectionEngine_constructor() {
  try {
    const engine = new StressInjectionEngine();
    assertEqual(engine.deterministicSeed, 42, 'seed default');
    assertEqual(engine.maxLatency, 5000, 'maxLatency default');
    assertEqual(engine.maxLoss, 0.5, 'maxLoss default');
    testResults.passed++;
    console.log('✅ TEST 1: StressInjectionEngine constructor with defaults');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${err.message}`);
    console.log(`❌ TEST 1: ${err.message}`);
  }
}

async function test002_StressInjectionEngine_isAuthoritative() {
  try {
    const engine = new StressInjectionEngine();
    assertEqual(engine.isAuthoritative(), false, 'isAuthoritative');
    testResults.passed++;
    console.log('✅ TEST 2: StressInjectionEngine isAuthoritative() === false');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${err.message}`);
    console.log(`❌ TEST 2: ${err.message}`);
  }
}

async function test003_generateNetworkLatency() {
  try {
    const engine = new StressInjectionEngine();
    const result = engine.generateNetworkLatency(100, 20);
    assertFrozen(result, 'result frozen');
    assertTrue(result.elapsedMs >= 0, 'elapsedMs exists');
    assertEqual(result.isAuthoritative, false, 'result not authoritative');
    testResults.passed++;
    console.log('✅ TEST 3: generateNetworkLatency() returns frozen result');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${err.message}`);
    console.log(`❌ TEST 3: ${err.message}`);
  }
}

async function test004_generatePacketLoss() {
  try {
    const engine = new StressInjectionEngine();
    const result = engine.generatePacketLoss(0);
    assertEqual(result.packetsLost, 0, 'no packets lost');
    assertEqual(result.packetsTotal, 1000, 'total packets');
    testResults.passed++;
    console.log('✅ TEST 4: generatePacketLoss() with 0 loss probability');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${err.message}`);
    console.log(`❌ TEST 4: ${err.message}`);
  }
}

async function test005_generateObservationNoise() {
  try {
    const engine = new StressInjectionEngine();
    const result = engine.generateObservationNoise(0.05);
    assertTrue(result.mnt >= 0, 'mnt non-negative');
    assertTrue(result.mnt <= 50, 'mnt capped');
    testResults.passed++;
    console.log('✅ TEST 5: generateObservationNoise() bounds checking');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${err.message}`);
    console.log(`❌ TEST 5: ${err.message}`);
  }
}

async function test006_generateTemporalDesync() {
  try {
    const engine = new StressInjectionEngine();
    const result = engine.generateTemporalDesync(1000);
    assertEqual(result.isAuthoritative, false, 'not authoritative');
    assertTrue(result.affectedNodes >= 0, 'affectedNodes non-negative');
    testResults.passed++;
    console.log('✅ TEST 6: generateTemporalDesync() returns valid result');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${err.message}`);
    console.log(`❌ TEST 6: ${err.message}`);
  }
}

async function test007_createStressScenario() {
  try {
    const engine = new StressInjectionEngine();
    const result = engine.createStressScenario([]);
    assertEqual(result.dimensions, 0, 'no dimensions');
    assertFrozen(result, 'result frozen');
    testResults.passed++;
    console.log('✅ TEST 7: createStressScenario() with empty types');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 7: ${err.message}`);
    console.log(`❌ TEST 7: ${err.message}`);
  }
}

async function test008_generateCascadingFailure() {
  try {
    const engine = new StressInjectionEngine();
    const result = engine.generateCascadingFailure({ stage1: 0.2, stage2: 0.4 });
    assertTrue(result.stages > 0, 'stages exist');
    assertEqual(result.isAuthoritative, false, 'not authoritative');
    testResults.passed++;
    console.log('✅ TEST 8: generateCascadingFailure() returns structure');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 8: ${err.message}`);
    console.log(`❌ TEST 8: ${err.message}`);
  }
}

async function test009_getMetrics() {
  try {
    const engine = new StressInjectionEngine();
    const metrics = engine.getMetrics();
    assertFrozen(metrics, 'metrics frozen');
    assertEqual(metrics.patternsGenerated, 0, 'zero patterns initially');
    testResults.passed++;
    console.log('✅ TEST 9: getMetrics() frozen + zero counters');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 9: ${err.message}`);
    console.log(`❌ TEST 9: ${err.message}`);
  }
}

async function test010_reset() {
  try {
    const engine = new StressInjectionEngine();
    engine.generateNetworkLatency();
    engine.reset();
    assertEqual(engine.stressMetrics.patternsGenerated, 0, 'metrics cleared');
    testResults.passed++;
    console.log('✅ TEST 10: reset() clears metrics');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 10: ${err.message}`);
    console.log(`❌ TEST 10: ${err.message}`);
  }
}

// ============================================================================
// SECTION 2: ControlledChaosSimulator (tests 11-20)
// ============================================================================

async function test011_ControlledChaosSimulator_constructor() {
  try {
    const sim = new ControlledChaosSimulator();
    assertEqual(sim.deterministicSeed, 42, 'seed default');
    assertEqual(sim.maxStressLevel, 1.0, 'maxStressLevel default');
    testResults.passed++;
    console.log('✅ TEST 11: ControlledChaosSimulator constructor');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 11: ${err.message}`);
    console.log(`❌ TEST 11: ${err.message}`);
  }
}

async function test012_ControlledChaosSimulator_isAuthoritative() {
  try {
    const sim = new ControlledChaosSimulator();
    assertEqual(sim.isAuthoritative(), false, 'isAuthoritative');
    testResults.passed++;
    console.log('✅ TEST 12: ControlledChaosSimulator isAuthoritative()');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 12: ${err.message}`);
    console.log(`❌ TEST 12: ${err.message}`);
  }
}

async function test013_simulateNetworkPartition() {
  try {
    const sim = new ControlledChaosSimulator();
    const result = sim.simulateNetworkPartition(1000);
    assertTrue(result.ndr >= 0 && result.ndr <= 100, 'ndr in bounds');
    testResults.passed++;
    console.log('✅ TEST 13: simulateNetworkPartition() ndr in [0,100]');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 13: ${err.message}`);
    console.log(`❌ TEST 13: ${err.message}`);
  }
}

async function test014_simulateHighLatencyEnvironment() {
  try {
    const sim = new ControlledChaosSimulator();
    const result = sim.simulateHighLatencyEnvironment(1000);
    assertTrue(typeof result.degradation === 'number', 'degradation exists');
    assertFrozen(result, 'result frozen');
    testResults.passed++;
    console.log('✅ TEST 14: simulateHighLatencyEnvironment() degradation');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 14: ${err.message}`);
    console.log(`❌ TEST 14: ${err.message}`);
  }
}

async function test015_simulateHighNoisyEnvironment() {
  try {
    const sim = new ControlledChaosSimulator();
    const result = sim.simulateHighNoisyEnvironment(0.2);
    assertTrue(result.corruptedObservations >= 0, 'non-negative corrupted');
    assertEqual(result.totalObservations, 1000, 'total observations');
    testResults.passed++;
    console.log('✅ TEST 15: simulateHighNoisyEnvironment() count');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 15: ${err.message}`);
    console.log(`❌ TEST 15: ${err.message}`);
  }
}

async function test016_simulateObserverFailures() {
  try {
    const sim = new ControlledChaosSimulator();
    const result = sim.simulateObserverFailures(0);
    assertEqual(result.failedObservers, 0, 'no failures with 0 rate');
    assertEqual(result.crd, 0, 'crd is 0');
    testResults.passed++;
    console.log('✅ TEST 16: simulateObserverFailures() zero rate');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 16: ${err.message}`);
    console.log(`❌ TEST 16: ${err.message}`);
  }
}

async function test017_runMultiDimensionalStress() {
  try {
    const sim = new ControlledChaosSimulator();
    const result = sim.runMultiDimensionalStress([0.1, 0.2, 0.3]);
    assertTrue(result.mst >= 0 && result.mst <= 1, 'mst in bounds');
    testResults.passed++;
    console.log('✅ TEST 17: runMultiDimensionalStress() mst in [0,1]');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 17: ${err.message}`);
    console.log(`❌ TEST 17: ${err.message}`);
  }
}

async function test018_simulateCascadingFailures() {
  try {
    const sim = new ControlledChaosSimulator();
    const result = sim.simulateCascadingFailures();
    assertTrue(result.stages > 0, 'stages > 0');
    assertFrozen(result, 'result frozen');
    testResults.passed++;
    console.log('✅ TEST 18: simulateCascadingFailures() stages');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 18: ${err.message}`);
    console.log(`❌ TEST 18: ${err.message}`);
  }
}

async function test019_getMetrics_chaos() {
  try {
    const sim = new ControlledChaosSimulator();
    const metrics = sim.getMetrics();
    assertFrozen(metrics, 'metrics frozen');
    testResults.passed++;
    console.log('✅ TEST 19: getMetrics() chaos frozen');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 19: ${err.message}`);
    console.log(`❌ TEST 19: ${err.message}`);
  }
}

async function test020_reset_chaos() {
  try {
    const sim = new ControlledChaosSimulator();
    sim.simulateNetworkPartition(1000);
    sim.reset();
    assertEqual(sim.chaosMetrics.simulationsRun, 0, 'metrics cleared');
    testResults.passed++;
    console.log('✅ TEST 20: reset() chaos clears metrics');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 20: ${err.message}`);
    console.log(`❌ TEST 20: ${err.message}`);
  }
}

// ============================================================================
// SECTION 3: ObservationPerturbationLayer (tests 21-30)
// ============================================================================

async function test021_ObservationPerturbationLayer_constructor() {
  try {
    const layer = new ObservationPerturbationLayer([]);
    assertEqual(layer.observationStreams.length, 0, 'empty streams');
    testResults.passed++;
    console.log('✅ TEST 21: ObservationPerturbationLayer constructor');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 21: ${err.message}`);
    console.log(`❌ TEST 21: ${err.message}`);
  }
}

async function test022_ObservationPerturbationLayer_isAuthoritative() {
  try {
    const layer = new ObservationPerturbationLayer();
    assertEqual(layer.isAuthoritative(), false, 'isAuthoritative');
    testResults.passed++;
    console.log('✅ TEST 22: ObservationPerturbationLayer isAuthoritative()');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 22: ${err.message}`);
    console.log(`❌ TEST 22: ${err.message}`);
  }
}

async function test023_corruptObservations() {
  try {
    const layer = new ObservationPerturbationLayer(Array(100).fill({}));
    const result = layer.corruptObservations(0.2);
    assertEqual(result.preserved + result.corrupted, result.total, 'sum equals total');
    testResults.passed++;
    console.log('✅ TEST 23: corruptObservations() sum check');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 23: ${err.message}`);
    console.log(`❌ TEST 23: ${err.message}`);
  }
}

async function test024_delayObservations() {
  try {
    const layer = new ObservationPerturbationLayer();
    const result = layer.delayObservations(500);
    assertTrue(typeof result.delayed === 'number', 'delayed exists');
    assertFrozen(result, 'result frozen');
    testResults.passed++;
    console.log('✅ TEST 24: delayObservations() has field');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 24: ${err.message}`);
    console.log(`❌ TEST 24: ${err.message}`);
  }
}

async function test025_dropObservations() {
  try {
    const layer = new ObservationPerturbationLayer(Array(100).fill({}));
    const result = layer.dropObservations(0.1);
    assertTrue(result.dropped + result.remaining === result.total, 'fields sum');
    testResults.passed++;
    console.log('✅ TEST 25: dropObservations() remaining');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 25: ${err.message}`);
    console.log(`❌ TEST 25: ${err.message}`);
  }
}

async function test026_addNoiseToObservations() {
  try {
    const layer = new ObservationPerturbationLayer();
    const result = layer.addNoiseToObservations(0.05);
    assertTrue(result.mnt >= 0 && result.mnt <= 50, 'mnt in bounds');
    testResults.passed++;
    console.log('✅ TEST 26: addNoiseToObservations() mnt bounds');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 26: ${err.message}`);
    console.log(`❌ TEST 26: ${err.message}`);
  }
}

async function test027_degradeConsensusQuality() {
  try {
    const layer = new ObservationPerturbationLayer();
    const result = layer.degradeConsensusQuality(0.2);
    assertTrue(result.crd >= 0 && result.crd <= 1, 'crd in bounds');
    testResults.passed++;
    console.log('✅ TEST 27: degradeConsensusQuality() crd bounds');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 27: ${err.message}`);
    console.log(`❌ TEST 27: ${err.message}`);
  }
}

async function test028_distortAnomalySignals() {
  try {
    const layer = new ObservationPerturbationLayer();
    const result = layer.distortAnomalySignals(0.15);
    assertTrue(result.ads >= 0 && result.ads <= 1, 'ads in bounds');
    testResults.passed++;
    console.log('✅ TEST 28: distortAnomalySignals() ads bounds');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 28: ${err.message}`);
    console.log(`❌ TEST 28: ${err.message}`);
  }
}

async function test029_getMetrics_perturbation() {
  try {
    const layer = new ObservationPerturbationLayer();
    const metrics = layer.getMetrics();
    assertFrozen(metrics, 'metrics frozen');
    testResults.passed++;
    console.log('✅ TEST 29: getMetrics() perturbation frozen');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 29: ${err.message}`);
    console.log(`❌ TEST 29: ${err.message}`);
  }
}

async function test030_no_mutation_streams() {
  try {
    const streams = [{ id: 1 }, { id: 2 }];
    const layer = new ObservationPerturbationLayer(streams);
    layer.corruptObservations(0.5);
    assertEqual(streams.length, 2, 'original untouched');
    testResults.passed++;
    console.log('✅ TEST 30: No mutation of original streams');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 30: ${err.message}`);
    console.log(`❌ TEST 30: ${err.message}`);
  }
}

// ============================================================================
// SECTION 4: ResilienceValidationCore (tests 31-40)
// ============================================================================

async function test031_ResilienceValidationCore_constructor() {
  try {
    const core = new ResilienceValidationCore([]);
    assertEqual(core.allModels.length, 0, 'empty models');
    testResults.passed++;
    console.log('✅ TEST 31: ResilienceValidationCore constructor');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 31: ${err.message}`);
    console.log(`❌ TEST 31: ${err.message}`);
  }
}

async function test032_ResilienceValidationCore_isAuthoritative() {
  try {
    const core = new ResilienceValidationCore();
    assertEqual(core.isAuthoritative(), false, 'isAuthoritative');
    testResults.passed++;
    console.log('✅ TEST 32: ResilienceValidationCore isAuthoritative()');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 32: ${err.message}`);
    console.log(`❌ TEST 32: ${err.message}`);
  }
}

async function test033_measureObservationRobustness() {
  try {
    const core = new ResilienceValidationCore();
    const result = core.measureObservationRobustness(0.5);
    assertTrue(result.ora >= 0 && result.ora <= 100, 'ora in bounds');
    testResults.passed++;
    console.log('✅ TEST 33: measureObservationRobustness() ora bounds');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 33: ${err.message}`);
    console.log(`❌ TEST 33: ${err.message}`);
  }
}

async function test034_testAnomalyDetectionStability() {
  try {
    const core = new ResilienceValidationCore();
    const result = core.testAnomalyDetectionStability(0.5);
    assertTrue(result.ads >= 0 && result.ads <= 1, 'ads in bounds');
    testResults.passed++;
    console.log('✅ TEST 34: testAnomalyDetectionStability() ads bounds');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 34: ${err.message}`);
    console.log(`❌ TEST 34: ${err.message}`);
  }
}

async function test035_validatePredictionUnderStress() {
  try {
    const core = new ResilienceValidationCore();
    const result = core.validatePredictionUnderStress(0.5);
    assertTrue(result.pus > 0, 'pus positive');
    testResults.passed++;
    console.log('✅ TEST 35: validatePredictionUnderStress() pus > 0');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 35: ${err.message}`);
    console.log(`❌ TEST 35: ${err.message}`);
  }
}

async function test036_computeResilienceScore() {
  try {
    const core = new ResilienceValidationCore();
    const result = core.computeResilienceScore({ ora: 75, ndr: 80 });
    assertTrue(result.rqs >= 0 && result.rqs <= 100, 'rqs in bounds');
    assertFrozen(result.components, 'components frozen');
    testResults.passed++;
    console.log('✅ TEST 36: computeResilienceScore() rqs bounds');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 36: ${err.message}`);
    console.log(`❌ TEST 36: ${err.message}`);
  }
}

async function test037_identifyFailureThresholds() {
  try {
    const core = new ResilienceValidationCore();
    const result = core.identifyFailureThresholds();
    assertTrue(Array.isArray(result.thresholds), 'thresholds is array');
    assertFrozen(result.thresholds, 'thresholds frozen');
    testResults.passed++;
    console.log('✅ TEST 37: identifyFailureThresholds() structure');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 37: ${err.message}`);
    console.log(`❌ TEST 37: ${err.message}`);
  }
}

async function test038_ResilienceValidationCore_results_frozen() {
  try {
    const core = new ResilienceValidationCore();
    assertFrozen(core.measureObservationRobustness(0.5), 'robustness frozen');
    assertFrozen(core.testAnomalyDetectionStability(0.5), 'anomaly frozen');
    testResults.passed++;
    console.log('✅ TEST 38: ResilienceValidationCore results frozen');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 38: ${err.message}`);
    console.log(`❌ TEST 38: ${err.message}`);
  }
}

async function test039_no_mutation_baselineMetrics() {
  try {
    const baseline = { metric1: 100, metric2: 200 };
    const core = new ResilienceValidationCore([], baseline);
    core.computeResilienceScore({ ora: 75 });
    assertEqual(baseline.metric1, 100, 'baseline untouched');
    testResults.passed++;
    console.log('✅ TEST 39: No mutation of baselineMetrics');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 39: ${err.message}`);
    console.log(`❌ TEST 39: ${err.message}`);
  }
}

async function test040_getMetrics_core() {
  try {
    const core = new ResilienceValidationCore();
    const metrics = core.getMetrics();
    assertEqual(metrics.robustnessTests, 0, 'zero robustness tests');
    testResults.passed++;
    console.log('✅ TEST 40: getMetrics() core zero counters');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 40: ${err.message}`);
    console.log(`❌ TEST 40: ${err.message}`);
  }
}

// ============================================================================
// SECTION 5: ExtremeConditionRunner (tests 41-50)
// ============================================================================

async function test041_ExtremeConditionRunner_constructor() {
  try {
    const runner = new ExtremeConditionRunner({});
    assertEqual(Object.keys(runner.allStressComponents).length, 0, 'empty components');
    testResults.passed++;
    console.log('✅ TEST 41: ExtremeConditionRunner constructor');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 41: ${err.message}`);
    console.log(`❌ TEST 41: ${err.message}`);
  }
}

async function test042_ExtremeConditionRunner_isAuthoritative() {
  try {
    const runner = new ExtremeConditionRunner();
    assertEqual(runner.isAuthoritative(), false, 'isAuthoritative');
    testResults.passed++;
    console.log('✅ TEST 42: ExtremeConditionRunner isAuthoritative()');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 42: ${err.message}`);
    console.log(`❌ TEST 42: ${err.message}`);
  }
}

async function test043_runStressScenario() {
  try {
    const runner = new ExtremeConditionRunner();
    const result = runner.runStressScenario({ stress1: 0.5 });
    assertTrue(result.elapsedMs >= 0, 'elapsedMs exists');
    assertFrozen(result, 'result frozen');
    testResults.passed++;
    console.log('✅ TEST 43: runStressScenario() has elapsedMs');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 43: ${err.message}`);
    console.log(`❌ TEST 43: ${err.message}`);
  }
}

async function test044_runMultiStressScenario() {
  try {
    const runner = new ExtremeConditionRunner();
    const result = runner.runMultiStressScenario([{ stress: 0.1 }, { stress: 0.2 }]);
    assertTrue(result.odc !== null, 'odc exists');
    assertFrozen(result.odc, 'odc frozen');
    testResults.passed++;
    console.log('✅ TEST 44: runMultiStressScenario() odc');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 44: ${err.message}`);
    console.log(`❌ TEST 44: ${err.message}`);
  }
}

async function test045_runProgressiveStress() {
  try {
    const runner = new ExtremeConditionRunner();
    const result = runner.runProgressiveStress(0.1, 1.0);
    assertTrue(result.failurePoint !== null, 'failure point detected');
    assertEqual(result.levels > 0, true, 'levels > 0');
    testResults.passed++;
    console.log('✅ TEST 45: runProgressiveStress() failure point');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 45: ${err.message}`);
    console.log(`❌ TEST 45: ${err.message}`);
  }
}

async function test046_getResilienceReport() {
  try {
    const runner = new ExtremeConditionRunner();
    const report = runner.getResilienceReport();
    assertTrue(typeof report.rqs === 'number', 'rqs exists');
    assertTrue(report.metrics.ora !== undefined, 'ora exists');
    assertTrue(report.metrics.ert !== undefined, 'ert exists');
    assertFrozen(report.metrics, 'metrics frozen');
    testResults.passed++;
    console.log('✅ TEST 46: getResilienceReport() structure');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 46: ${err.message}`);
    console.log(`❌ TEST 46: ${err.message}`);
  }
}

async function test047_getFailureThresholds() {
  try {
    const runner = new ExtremeConditionRunner();
    const result = runner.getFailureThresholds();
    assertTrue(result.cft >= 0 && result.cft <= 100, 'cft in bounds');
    assertFrozen(result.thresholds, 'thresholds frozen');
    testResults.passed++;
    console.log('✅ TEST 47: getFailureThresholds() cft bounds');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 47: ${err.message}`);
    console.log(`❌ TEST 47: ${err.message}`);
  }
}

async function test048_ExtremeConditionRunner_performance() {
  try {
    const runner = new ExtremeConditionRunner();
    const start = Date.now();
    runner.runStressScenario({ stress: 0.5 });
    const elapsed = Date.now() - start;
    assertTrue(elapsed < 2000, 'scenario < 2000ms');
    testResults.passed++;
    console.log('✅ TEST 48: ExtremeConditionRunner performance < 2000ms');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 48: ${err.message}`);
    console.log(`❌ TEST 48: ${err.message}`);
  }
}

async function test049_ExtremeConditionRunner_results_frozen() {
  try {
    const runner = new ExtremeConditionRunner();
    assertFrozen(runner.runStressScenario({}), 'runStressScenario frozen');
    assertFrozen(runner.getResilienceReport(), 'report frozen');
    testResults.passed++;
    console.log('✅ TEST 49: ExtremeConditionRunner results frozen');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 49: ${err.message}`);
    console.log(`❌ TEST 49: ${err.message}`);
  }
}

async function test050_reset_runner() {
  try {
    const runner = new ExtremeConditionRunner();
    runner.runStressScenario({});
    runner.reset();
    assertEqual(runner.runnerMetrics.scenariosExecuted, 0, 'scenarios reset');
    testResults.passed++;
    console.log('✅ TEST 50: reset() clears runner metrics');
  } catch (err) {
    testResults.failed++;
    testResults.errors.push(`TEST 50: ${err.message}`);
    console.log(`❌ TEST 50: ${err.message}`);
  }
}

// ============================================================================
// Run all tests
// ============================================================================

(async () => {
  console.log('='.repeat(70));
  console.log('🧪 PHASE 10.4 — STRESS INJECTION ENGINE TESTS');
  console.log('='.repeat(70));
  console.log('');

  const testFunctions = [
    test001_StressInjectionEngine_constructor,
    test002_StressInjectionEngine_isAuthoritative,
    test003_generateNetworkLatency,
    test004_generatePacketLoss,
    test005_generateObservationNoise,
    test006_generateTemporalDesync,
    test007_createStressScenario,
    test008_generateCascadingFailure,
    test009_getMetrics,
    test010_reset,
    test011_ControlledChaosSimulator_constructor,
    test012_ControlledChaosSimulator_isAuthoritative,
    test013_simulateNetworkPartition,
    test014_simulateHighLatencyEnvironment,
    test015_simulateHighNoisyEnvironment,
    test016_simulateObserverFailures,
    test017_runMultiDimensionalStress,
    test018_simulateCascadingFailures,
    test019_getMetrics_chaos,
    test020_reset_chaos,
    test021_ObservationPerturbationLayer_constructor,
    test022_ObservationPerturbationLayer_isAuthoritative,
    test023_corruptObservations,
    test024_delayObservations,
    test025_dropObservations,
    test026_addNoiseToObservations,
    test027_degradeConsensusQuality,
    test028_distortAnomalySignals,
    test029_getMetrics_perturbation,
    test030_no_mutation_streams,
    test031_ResilienceValidationCore_constructor,
    test032_ResilienceValidationCore_isAuthoritative,
    test033_measureObservationRobustness,
    test034_testAnomalyDetectionStability,
    test035_validatePredictionUnderStress,
    test036_computeResilienceScore,
    test037_identifyFailureThresholds,
    test038_ResilienceValidationCore_results_frozen,
    test039_no_mutation_baselineMetrics,
    test040_getMetrics_core,
    test041_ExtremeConditionRunner_constructor,
    test042_ExtremeConditionRunner_isAuthoritative,
    test043_runStressScenario,
    test044_runMultiStressScenario,
    test045_runProgressiveStress,
    test046_getResilienceReport,
    test047_getFailureThresholds,
    test048_ExtremeConditionRunner_performance,
    test049_ExtremeConditionRunner_results_frozen,
    test050_reset_runner
  ];

  for (const testFn of testFunctions) {
    await testFn();
  }

  console.log('');
  console.log('='.repeat(70));
  console.log(`✅ PASSED: ${testResults.passed}`);
  console.log(`❌ FAILED: ${testResults.failed}`);
  console.log(`📊 TOTAL:  ${testResults.passed + testResults.failed}`);
  console.log('='.repeat(70));

  process.exit(testResults.failed > 0 ? 1 : 0);
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
