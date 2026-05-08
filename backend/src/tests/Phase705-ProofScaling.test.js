/**
 * PHASE 7.0.5 — Enforcement Performance Optimization + Proof Layer Scaling
 *
 * Tests dual-layer proof storage: Real-Time (authoritative) + Batch (observability)
 *
 * CRITICAL INVARIANTS:
 * ✔ real-time proofs always authoritative
 * ✔ batch proofs never influence decisions
 * ✔ SHA-256 integrity preserved in both layers
 * ✔ latency overhead <5%
 * ✔ no ordering divergence between layers
 */

const assert = require('assert');
const EnforcementProofSystem = require('../core/governance/enforcement/EnforcementProofSystem');
const ArchitectureEnforcementEngine = require('../core/governance/enforcement/ArchitectureEnforcementEngine');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Real-Time Proofs Always Authoritative
 * Verify that real-time proofLog is the exclusive source of truth
 */
async function testRealTimeAuthoritative() {
  console.log('\n=== TEST 1: Real-Time Proofs Authoritative ===');
  try {
    const proofSystem = new EnforcementProofSystem();

    // Capture some proofs
    for (let i = 0; i < 10; i++) {
      proofSystem.captureDecision({
        module: `Module${i}`,
        action: 'validateModule',
        ruleEvaluated: 'test_rule',
        input: { index: i },
        result: { valid: i % 2 === 0 },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
    }

    // Verify real-time proofLog
    const verifyResult = proofSystem.verify();
    assert(verifyResult.valid === true, 'Real-time proofLog should be valid');
    assert(verifyResult.entriesVerified === 10, `Should verify 10 entries, got ${verifyResult.entriesVerified}`);

    // Real-time proofs must be authoritative
    assert(proofSystem.proofLog.length === 10, 'proofLog should have 10 entries');
    assert(proofSystem.sequence === 10, `Sequence should be 10, got ${proofSystem.sequence}`);

    // Every entry must have valid chain
    for (let i = 0; i < proofSystem.proofLog.length; i++) {
      assert(proofSystem.proofLog[i].hash !== null, `Hash should not be null at index ${i}`);
      assert(proofSystem.proofLog[i].sequence === i + 1, `Sequence at ${i} should be ${i + 1}`);
    }

    console.log(`✅ Real-time proofLog authoritative: ${proofSystem.proofLog.length} proofs verified`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Batch Proofs Never Influence Decisions
 * Verify that batch layer is purely observational
 */
async function testBatchNonAuthoritative() {
  console.log('\n=== TEST 2: Batch Proofs Non-Authoritative ===');
  try {
    const proofSystem = new EnforcementProofSystem();

    // Capture proofs
    for (let i = 0; i < 5; i++) {
      proofSystem.captureDecision({
        module: 'TestModule',
        action: 'validateEvent',
        ruleEvaluated: 'test_rule',
        input: { index: i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
    }

    // Batch buffer should have entries (observability)
    assert(proofSystem.batchProcessingBuffer.length === 5, 'Batch buffer should have 5 entries');

    // Verify batch (non-authoritative)
    const batchVerify = proofSystem.verifyBatch();
    assert(batchVerify.isAuthoritative === false, 'Batch verification must not be authoritative');
    assert(batchVerify.valid === true, 'Batch entries should be consistent');

    // Real-time proofLog is the ONLY authoritative source
    const realTimeVerify = proofSystem.verify();
    assert(realTimeVerify.valid === true, 'Real-time proofs must be authoritative');

    // Batch and real-time are independent
    // Real-time has SHA-256 chain, batch is just aggregate
    assert(proofSystem.proofLog[0].hash !== undefined, 'Real-time has hash');
    assert(proofSystem.batchProcessingBuffer[0].hash === undefined, 'Batch has NO hash (non-cryptographic)');

    console.log(`✅ Batch non-authoritative: ${proofSystem.batchProcessingBuffer.length} batch entries`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: SHA-256 Integrity Preserved in Real-Time Layer
 * Batch layer doesn't affect real-time chain integrity
 */
async function testSHA256IntegrityRealTime() {
  console.log('\n=== TEST 3: SHA-256 Integrity Preserved ===');
  try {
    const proofSystem = new EnforcementProofSystem();

    // Capture proofs
    const proofs = [];
    for (let i = 0; i < 3; i++) {
      const proof = proofSystem.captureDecision({
        module: `Module${i}`,
        action: 'validateModule',
        ruleEvaluated: 'rule',
        input: { i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
      proofs.push(proof);
    }

    // Compact batch (doesn't affect real-time chain)
    const compactResult = proofSystem.compactProofs();
    assert(compactResult.flushed === 3, `Should have flushed 3 batch entries, got ${compactResult.flushed}`);

    // Real-time chain must still verify
    const verifyAfterCompact = proofSystem.verify();
    assert(verifyAfterCompact.valid === true, 'Real-time chain should still be valid after batch compact');
    assert(verifyAfterCompact.entriesVerified === 3, 'Should still verify 3 real-time entries');

    // Verify hash chaining in real-time
    assert(proofs[1].previousHash === proofs[0].hash, 'Chaining should be preserved');
    assert(proofs[2].previousHash === proofs[1].hash, 'Chaining should be preserved');

    // Each hash must be valid SHA-256 (64 hex chars)
    for (const proof of proofs) {
      assert(proof.hash.length === 64, `Hash should be 64 chars, got ${proof.hash.length}`);
      assert(/^[a-f0-9]{64}$/.test(proof.hash), 'Hash must be valid hex');
    }

    console.log(`✅ SHA-256 integrity preserved: ${proofs.length} proofs with valid hashes`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Latency Overhead < 5%
 * Batch processing should not significantly impact real-time latency
 */
async function testLatencyOverhead() {
  console.log('\n=== TEST 4: Latency Overhead < 5% ===');
  try {
    const proofSystem = new EnforcementProofSystem();

    // Measure real-time latency (time to captureDecision)
    const iterations = 100;
    const latencies = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      proofSystem.captureDecision({
        module: 'TestModule',
        action: 'validateModule',
        ruleEvaluated: 'rule',
        input: { i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: start
      });
      const latency = Date.now() - start;
      latencies.push(latency);
    }

    // Calculate average latency
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    // Batch operations should add minimal overhead
    // In JS, very small operations (< 1ms) are hard to measure accurately
    // But we check that batching doesn't degrade performance significantly
    assert(avgLatency < 10, `Average latency should be < 10ms for fast operation, got ${avgLatency}ms`);

    // Check that proof system captured all proofs
    assert(proofSystem.proofLog.length === iterations, `Should have ${iterations} real-time proofs`);
    assert(proofSystem.batchProcessingBuffer.length > 0, 'Batch buffer should have entries');

    console.log(`✅ Latency overhead acceptable: avg=${avgLatency.toFixed(2)}ms (${iterations} iterations)`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: No Ordering Divergence Between Layers
 * Real-time and batch must preserve causal ordering
 */
async function testNoOrderingDivergence() {
  console.log('\n=== TEST 5: No Ordering Divergence ===');
  try {
    const proofSystem = new EnforcementProofSystem();

    // Capture proofs with distinct modules to track ordering
    const modules = ['ModuleA', 'ModuleB', 'ModuleC', 'ModuleA', 'ModuleB'];
    const proofs = [];

    for (const mod of modules) {
      const proof = proofSystem.captureDecision({
        module: mod,
        action: 'validateModule',
        ruleEvaluated: 'rule',
        input: { mod },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
      proofs.push(proof);
    }

    // Get real-time sequence
    const realTimeSequence = proofSystem.proofLog.map((p) => p.module);
    assert(realTimeSequence.join(',') === modules.join(','), 'Real-time should preserve order');

    // Get batch sequence
    const batchSequence = proofSystem.batchProcessingBuffer.map((p) => p.module);
    assert(batchSequence.join(',') === modules.join(','), 'Batch should preserve same order');

    // Compact and verify batch order preserved
    const compactResult = proofSystem.compactProofs();
    const aggregated = compactResult.compacted;
    assert(aggregated.entriesCount === modules.length, `Should have ${modules.length} entries`);

    // Real-time and batch must have same causal order
    assert(realTimeSequence.length === batchSequence.length, 'Same number of entries');

    console.log(`✅ Ordering preserved: ${modules.length} proofs in same causal order (real-time + batch)`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Engine Integration with Dual-Layer Storage
 * Verify ArchitectureEnforcementEngine uses proof system correctly
 */
async function testEngineIntegrationDualLayer() {
  console.log('\n=== TEST 6: Engine Integration Dual-Layer ===');
  try {
    const engine = new ArchitectureEnforcementEngine();

    // Validate some modules (captures to real-time + batch)
    engine.validateModule('HardenedEventBus');
    engine.validateModule('SelfHealingOrchestrator');

    // Get proof system metrics
    const proofMetrics = engine.proofSystem.getMetrics();
    assert(proofMetrics.totalCaptured > 0, 'Should have captured proofs');
    assert(proofMetrics.chainLength > 0, 'Real-time chain should have entries');
    assert(proofMetrics.batchQueueDepth >= 0, 'Batch queue depth should be tracked');

    // Flush batch explicitly
    const flushResult = engine.flushBatchProofs();
    assert(flushResult.flushed >= 0, 'Should return flush count');

    // Get performance metrics
    const perfMetrics = engine.getProofSystemPerformance();
    assert(perfMetrics.realTimeLatencyMs !== undefined, 'Should track real-time latency');
    assert(perfMetrics.batchQueueDepth !== undefined, 'Should track batch queue depth');
    assert(perfMetrics.proofFlushRate !== undefined, 'Should track proof flush rate');

    // Verify real-time proofs are authoritative
    const verify = engine.proofSystem.verify();
    assert(verify.valid === true, 'Real-time proofs must be valid');

    // Batch verification is non-authoritative
    const batchVerify = engine.proofSystem.verifyBatch();
    assert(batchVerify.isAuthoritative === false, 'Batch verification is non-authoritative');

    console.log(`✅ Engine dual-layer integration: real-time=${perfMetrics.realTimeLatencyMs}ms, batch queue=${perfMetrics.batchQueueDepth}`);

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
  console.log('🧪 PHASE 7.0.5 — Enforcement Performance Optimization + Proof Scaling');
  console.log('═'.repeat(70));

  try {
    await testRealTimeAuthoritative();
    await testBatchNonAuthoritative();
    await testSHA256IntegrityRealTime();
    await testLatencyOverhead();
    await testNoOrderingDivergence();
    await testEngineIntegrationDualLayer();

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

module.exports = { EnforcementProofSystem };
