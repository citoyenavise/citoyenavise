/**
 * PHASE 7.0.5 — Batch Layer Optimization & Observability Enhancement
 *
 * Tests BatchLayerOptimization class with percentiles, alerts, and isolation guarantees
 * CRITICAL INVARIANTS:
 * ✔ Batch layer NEVER authoritative
 * ✔ Enhanced metrics contain p50/p95/p99 percentiles
 * ✔ Alerts trigger on thresholds (violation rate, latency, queue fill)
 * ✔ Batch state changes don't affect real-time chain
 */

const assert = require('assert');
const EnforcementProofSystem = require('../core/governance/enforcement/EnforcementProofSystem');
const BatchLayerOptimization = require('../core/governance/enforcement/BatchLayerOptimization');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Batch Layer Never Authoritative
 * Verify that batch layer always returns isAuthoritative === false
 */
async function testBatchLayerNeverAuthoritative() {
  console.log('\n=== TEST 1: Batch Layer Never Authoritative ===');
  try {
    const proofSystem = new EnforcementProofSystem();
    const batchLayer = new BatchLayerOptimization(proofSystem);

    // isAuthoritative() must always be false
    assert(
      batchLayer.isAuthoritative() === false,
      'BatchLayer.isAuthoritative() must be false'
    );

    // verifyBatch() must also return isAuthoritative === false
    const batchVerify = proofSystem.verifyBatch();
    assert(
      batchVerify.isAuthoritative === false,
      'ProofSystem.verifyBatch() must return isAuthoritative === false'
    );

    // Capture some proofs
    for (let i = 0; i < 5; i++) {
      proofSystem.captureDecision({
        module: 'TestModule',
        action: 'validateModule',
        ruleEvaluated: 'test_rule',
        input: { i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
    }

    // Still never authoritative
    assert(batchLayer.isAuthoritative() === false, 'Invariant: batch never authoritative');

    console.log(`✅ Batch layer never authoritative: isAuthoritative() = false`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Percentile Calculations
 * Verify p50/p95/p99 are calculated correctly
 */
async function testPercentileCalculations() {
  console.log('\n=== TEST 2: Percentile Calculations ===');
  try {
    const proofSystem = new EnforcementProofSystem();
    const batchLayer = new BatchLayerOptimization(proofSystem);

    // Inject known latencies: [1, 2, 3, ..., 100]
    for (let i = 1; i <= 100; i++) {
      proofSystem.captureDecision({
        module: 'TestModule',
        action: 'testAction',
        ruleEvaluated: 'test_rule',
        input: { value: i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - i // latency = i ms
      });
    }

    // Get enhanced metrics with percentiles
    const enhanced = batchLayer.getEnhancedMetrics();
    assert(enhanced.latencyPercentiles !== undefined, 'latencyPercentiles should exist');
    assert(enhanced.latencyPercentiles.testAction !== undefined, 'testAction metrics should exist');

    const testMetrics = enhanced.latencyPercentiles.testAction;
    assert(testMetrics.p50 !== undefined, 'p50 should be defined');
    assert(testMetrics.p95 !== undefined, 'p95 should be defined');
    assert(testMetrics.p99 !== undefined, 'p99 should be defined');

    // Verify percentiles are reasonable
    // For [1..100], p50 ≈ 50, p95 ≈ 95, p99 ≈ 99
    assert(testMetrics.p50 > 40 && testMetrics.p50 < 60, `p50 should be ~50, got ${testMetrics.p50}`);
    assert(testMetrics.p95 > 85 && testMetrics.p95 < 100, `p95 should be ~95, got ${testMetrics.p95}`);
    assert(testMetrics.p99 > 95 && testMetrics.p99 <= 100, `p99 should be ~99, got ${testMetrics.p99}`);

    console.log(
      `✅ Percentiles calculated: p50=${testMetrics.p50}, p95=${testMetrics.p95}, p99=${testMetrics.p99}`
    );
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Alert on Violation Rate Threshold
 * Trigger VIOLATION_RATE alert when violations exceed 30%
 */
async function testAlertViolationRate() {
  console.log('\n=== TEST 3: Alert Violation Rate Threshold ===');
  try {
    const proofSystem = new EnforcementProofSystem();
    const batchLayer = new BatchLayerOptimization(proofSystem, {
      violationRatePercent: 30
    });

    // Inject 10 decisions: 7 violations (70%), 3 successes
    for (let i = 0; i < 10; i++) {
      const isViolation = i < 7;
      proofSystem.captureDecision({
        module: 'TestModule',
        action: 'validateModule',
        ruleEvaluated: 'test_rule',
        input: { i },
        result: { valid: !isViolation },
        severity: isViolation ? 'VIOLATION' : 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
    }

    // Check alerts — should trigger VIOLATION_RATE alert
    const alerts = batchLayer.checkAlerts();
    const violationRateAlert = alerts.find((a) => a.type === 'VIOLATION_RATE');

    assert(violationRateAlert !== undefined, 'VIOLATION_RATE alert should be triggered');
    assert(violationRateAlert.severity === 'WARNING', 'Alert severity should be WARNING');
    assert(violationRateAlert.value > 30, `Violation rate ${violationRateAlert.value} should exceed 30%`);

    console.log(`✅ Violation rate alert triggered: ${violationRateAlert.value}% > 30%`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Alert on Latency p95 Threshold
 * Trigger LATENCY_P95 alert when p95 exceeds threshold
 */
async function testAlertLatencyP95() {
  console.log('\n=== TEST 4: Alert Latency p95 Threshold ===');
  try {
    const proofSystem = new EnforcementProofSystem();
    const batchLayer = new BatchLayerOptimization(proofSystem, {
      p95LatencyMs: 100
    });

    // Inject decisions with high latencies: [150, 150, 150, 150, 150, 10, 10, 10, 10, 10]
    // p95 will be ~150, exceeding the 100ms threshold
    const latencies = [150, 150, 150, 150, 150, 10, 10, 10, 10, 10];
    for (let i = 0; i < latencies.length; i++) {
      const latency = latencies[i];
      proofSystem.captureDecision({
        module: 'TestModule',
        action: 'slowAction',
        ruleEvaluated: 'test_rule',
        input: { i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - latency
      });
    }

    // Check alerts
    const alerts = batchLayer.checkAlerts();
    const latencyAlert = alerts.find((a) => a.type === 'LATENCY_P95');

    assert(latencyAlert !== undefined, 'LATENCY_P95 alert should be triggered');
    assert(latencyAlert.action === 'slowAction', 'Alert should be for slowAction');
    assert(latencyAlert.value > 100, `p95 latency ${latencyAlert.value}ms should exceed 100ms`);

    console.log(`✅ Latency alert triggered: p95=${latencyAlert.value}ms > 100ms`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Enhanced Metrics Coherence
 * Verify that enhanced metrics are coherent with proof system metrics
 */
async function testEnhancedMetricsCoherence() {
  console.log('\n=== TEST 5: Enhanced Metrics Coherence ===');
  try {
    const proofSystem = new EnforcementProofSystem();
    const batchLayer = new BatchLayerOptimization(proofSystem);

    // Inject 10 mixed decisions
    for (let i = 0; i < 10; i++) {
      proofSystem.captureDecision({
        module: `Module${i % 3}`,
        action: 'validateModule',
        ruleEvaluated: 'test_rule',
        input: { i },
        result: { valid: i % 2 === 0 }, // 5 success, 5 violation
        severity: i % 2 === 0 ? 'INFO' : 'VIOLATION',
        enforcementLayer: 'TEST',
        startTime: Date.now() - (10 + i)
      });
    }

    // Get enhanced metrics
    const enhanced = batchLayer.getEnhancedMetrics();

    // Verify coherence with proof system
    const proofMetrics = proofSystem.getMetrics();
    assert(
      enhanced.totalCaptured === proofMetrics.totalCaptured,
      'totalCaptured should match'
    );
    assert(
      enhanced.successCount === proofMetrics.successCount,
      'successCount should match'
    );
    assert(
      enhanced.violationCount === proofMetrics.violationCount,
      'violationCount should match'
    );
    assert(
      enhanced.chainLength === proofMetrics.chainLength,
      'chainLength should match'
    );

    // Verify rates are calculated
    assert(enhanced.successRate > 0, 'successRate should be > 0');
    assert(enhanced.violationRate > 0, 'violationRate should be > 0');
    assert(
      Math.abs(enhanced.successRate + enhanced.violationRate - 100) < 0.1,
      'rates should sum to 100%'
    );

    console.log(
      `✅ Enhanced metrics coherent: ${enhanced.totalCaptured} total, ${enhanced.successCount} success, ${enhanced.violationCount} violations`
    );
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Batch Independent From Real-Time
 * Modify batch layer state, verify real-time chain unaffected
 */
async function testBatchIndependentFromRealTime() {
  console.log('\n=== TEST 6: Batch Independent From Real-Time ===');
  try {
    const proofSystem = new EnforcementProofSystem();
    const batchLayer = new BatchLayerOptimization(proofSystem);

    // Capture initial proofs
    const initialProofs = [];
    for (let i = 0; i < 5; i++) {
      const proof = proofSystem.captureDecision({
        module: 'TestModule',
        action: 'validateModule',
        ruleEvaluated: 'test_rule',
        input: { i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
      initialProofs.push(proof);
    }

    // Verify initial real-time chain
    const verifyBefore = proofSystem.verify();
    assert(verifyBefore.valid === true, 'Real-time chain should be valid');

    // Modify batch layer state (alerts, etc.)
    batchLayer.checkAlerts();
    batchLayer.recordCompaction({ flushed: 5 });

    // Real-time chain must still be valid
    const verifyAfter = proofSystem.verify();
    assert(verifyAfter.valid === true, 'Real-time chain should still be valid after batch ops');
    assert(
      verifyAfter.entriesVerified === verifyBefore.entriesVerified,
      'Verified entries count should not change'
    );

    // Verify hash chain is unchanged
    for (let i = 0; i < initialProofs.length; i++) {
      assert(
        initialProofs[i].hash === proofSystem.proofLog[i].hash,
        `Hash at ${i} should not change`
      );
      assert(
        initialProofs[i].previousHash === proofSystem.proofLog[i].previousHash,
        `PreviousHash at ${i} should not change`
      );
    }

    console.log(
      `✅ Batch independent: real-time chain valid after batch modifications`
    );
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * RUN ALL TESTS
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 7.0.5 — Batch Layer Optimization & Observability Enhancement');
  console.log('═'.repeat(70));

  try {
    await testBatchLayerNeverAuthoritative();
    await testPercentileCalculations();
    await testAlertViolationRate();
    await testAlertLatencyP95();
    await testEnhancedMetricsCoherence();
    await testBatchIndependentFromRealTime();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/6 tests`);
    console.log('═'.repeat(70));
    process.exit(testResults.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    console.error('Errors:', testResults.errors);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests();
}

module.exports = { BatchLayerOptimization, EnforcementProofSystem };
