/**
 * PHASE 7.0.4 — System Governance Consolidation + Observability Enforcement
 *
 * Tests EnforcementProofSystem cryptographic chaining and ArchitectureEnforcementEngine integration
 */

const assert = require('assert');
const EnforcementProofSystem = require('../core/governance/enforcement/EnforcementProofSystem');
const ArchitectureEnforcementEngine = require('../core/governance/enforcement/ArchitectureEnforcementEngine');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Proof capture with SHA-256 hash generation
 * Verify that captureDecision creates proof entry with non-null hash
 */
async function testProofCaptureWithHash() {
  console.log('\n=== TEST 1: Proof Capture with Hash ===');
  try {
    const proofSystem = new EnforcementProofSystem();

    const context = {
      module: 'TestModule',
      action: 'testAction',
      ruleEvaluated: 'test_rule',
      input: { test: 'input' },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'TEST',
      startTime: Date.now() - 100
    };

    const proof = proofSystem.captureDecision(context);

    assert(proof !== null, 'Proof should not be null');
    assert(proof.hash !== null, 'Hash should not be null');
    assert(proof.hash.length === 64, `Hash should be 64 chars (SHA-256 hex), got ${proof.hash.length}`);
    assert(proof.sequence === 1, 'First proof should have sequence 1');
    assert(proof.previousHash === null, 'First proof should have null previousHash');
    console.log(`✅ Hash generated: ${proof.hash.substring(0, 16)}...`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: SHA-256 chaining
 * Verify that previousHash of each proof = hash of previous proof
 */
async function testProofChaining() {
  console.log('\n=== TEST 2: Proof Chaining ===');
  try {
    const proofSystem = new EnforcementProofSystem();

    const proof1 = proofSystem.captureDecision({
      module: 'Module1',
      action: 'action1',
      ruleEvaluated: 'rule1',
      input: { a: 1 },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'TEST',
      startTime: Date.now() - 100
    });

    const proof2 = proofSystem.captureDecision({
      module: 'Module2',
      action: 'action2',
      ruleEvaluated: 'rule2',
      input: { b: 2 },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'TEST',
      startTime: Date.now() - 100
    });

    const proof3 = proofSystem.captureDecision({
      module: 'Module3',
      action: 'action3',
      ruleEvaluated: 'rule3',
      input: { c: 3 },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'TEST',
      startTime: Date.now() - 100
    });

    assert(proof2.previousHash === proof1.hash, 'Proof 2 previousHash should equal Proof 1 hash');
    assert(proof3.previousHash === proof2.hash, 'Proof 3 previousHash should equal Proof 2 hash');
    console.log(`✅ Chain verified: proof1 → proof2 → proof3`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Tamper detection via verify()
 * Verify that incorrect hash values cause verify() to fail
 */
async function testTamperDetection() {
  console.log('\n=== TEST 3: Tamper Detection ===');
  try {
    const proofSystem = new EnforcementProofSystem();

    // Create a chain of proofs
    proofSystem.captureDecision({
      module: 'Module1',
      action: 'action1',
      ruleEvaluated: 'rule1',
      input: { a: 1 },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'TEST',
      startTime: Date.now() - 100
    });

    proofSystem.captureDecision({
      module: 'Module2',
      action: 'action2',
      ruleEvaluated: 'rule2',
      input: { b: 2 },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'TEST',
      startTime: Date.now() - 100
    });

    // Verify chain is intact
    const verifyBefore = proofSystem.verify();
    assert(verifyBefore.valid === true, 'Chain should be valid before tampering');
    assert(verifyBefore.entriesVerified === 2, 'Should verify 2 entries');

    // Create a new proof system with manually tampered state
    const tamperedSystem = new EnforcementProofSystem();

    // Manually inject a proof with wrong sequence
    const proof1 = tamperedSystem.captureDecision({
      module: 'Module1',
      action: 'action1',
      ruleEvaluated: 'rule1',
      input: { a: 1 },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'TEST',
      startTime: Date.now() - 100
    });

    // Manually inject a proof with wrong previousHash
    const fakeProof = {
      sequence: 2,
      decisionId: `enf_${Date.now()}_fake`,
      module: 'Module2',
      action: 'action2',
      ruleEvaluated: 'rule2',
      decision: 'ALLOWED',
      severity: 'INFO',
      enforcementLayer: 'TEST',
      input: { b: 2 },
      result: { valid: true },
      traceId: null,
      latencyMs: 0,
      engineState: null,
      previousHash: 'wrong_hash_value',
      capturedAt: new Date().toISOString()
    };
    fakeProof.hash = tamperedSystem._calculateHash(fakeProof);
    Object.freeze(fakeProof);
    tamperedSystem.proofLog.push(fakeProof);

    // Verify detects the break
    const verifyTampered = tamperedSystem.verify();
    assert(verifyTampered.valid === false, 'verify() should detect broken previousHash chain');
    console.log(`✅ Tampering detected: ${verifyTampered.error}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Enriched metrics tracking
 * Verify that proofSystem tracks successCount, violationCount, byModule, latencyPerRule
 */
async function testEnrichedMetrics() {
  console.log('\n=== TEST 4: Enriched Metrics ===');
  try {
    const proofSystem = new EnforcementProofSystem();

    // Capture 2 successes and 1 violation
    proofSystem.captureDecision({
      module: 'Module1',
      action: 'validateModule',
      ruleEvaluated: 'rule1',
      input: { a: 1 },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'MODULE',
      startTime: Date.now() - 50
    });

    proofSystem.captureDecision({
      module: 'Module2',
      action: 'validateDependency',
      ruleEvaluated: 'rule2',
      input: { b: 2 },
      result: { valid: false },
      severity: 'VIOLATION',
      enforcementLayer: 'DEPENDENCY',
      startTime: Date.now() - 100
    });

    proofSystem.captureDecision({
      module: 'Module1',
      action: 'validateModule',
      ruleEvaluated: 'rule3',
      input: { c: 3 },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'MODULE',
      startTime: Date.now() - 25
    });

    const metrics = proofSystem.getMetrics();

    assert(metrics.totalCaptured === 3, `Should have 3 proofs, got ${metrics.totalCaptured}`);
    assert(metrics.successCount === 2, `Should have 2 successes, got ${metrics.successCount}`);
    assert(metrics.violationCount === 1, `Should have 1 violation, got ${metrics.violationCount}`);

    // Check byModule metrics
    assert(metrics.byModule['Module1'] !== undefined, 'Module1 should be in byModule');
    assert(metrics.byModule['Module1'].count === 2, `Module1 count should be 2, got ${metrics.byModule['Module1'].count}`);
    assert(metrics.byModule['Module2'] !== undefined, 'Module2 should be in byModule');
    assert(metrics.byModule['Module2'].count === 1, `Module2 count should be 1, got ${metrics.byModule['Module2'].count}`);

    // Check latencyPerRule
    assert(metrics.latencyPerRule['validateModule'] !== undefined, 'validateModule should be in latencyPerRule');
    assert(Array.isArray(metrics.latencyPerRule['validateModule']), 'latencies should be array');
    assert(metrics.latencyPerRule['validateModule'].length === 2, 'Should have 2 validateModule latencies');

    console.log(`✅ Metrics correct: successes=${metrics.successCount}, violations=${metrics.violationCount}`);
    console.log(`   byModule: ${JSON.stringify(metrics.byModule)}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Replay filtering
 * Verify that replay(filter) returns only matching proofs
 */
async function testReplayFiltering() {
  console.log('\n=== TEST 5: Replay Filtering ===');
  try {
    const proofSystem = new EnforcementProofSystem();

    proofSystem.captureDecision({
      module: 'Module1',
      action: 'validateModule',
      ruleEvaluated: 'rule1',
      input: { a: 1 },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'MODULE',
      startTime: Date.now() - 50
    });

    proofSystem.captureDecision({
      module: 'Module2',
      action: 'validateDependency',
      ruleEvaluated: 'rule2',
      input: { b: 2 },
      result: { valid: false },
      severity: 'VIOLATION',
      enforcementLayer: 'DEPENDENCY',
      startTime: Date.now() - 100
    });

    proofSystem.captureDecision({
      module: 'Module1',
      action: 'validateModule',
      ruleEvaluated: 'rule3',
      input: { c: 3 },
      result: { valid: true },
      severity: 'INFO',
      enforcementLayer: 'MODULE',
      startTime: Date.now() - 25
    });

    // Replay with filter
    const validateModuleOnly = proofSystem.replay({ action: 'validateModule' });
    assert(validateModuleOnly.length === 2, `Should return 2 validateModule proofs, got ${validateModuleOnly.length}`);
    assert(validateModuleOnly.every((p) => p.action === 'validateModule'), 'All should be validateModule');

    const module1Only = proofSystem.replay({ module: 'Module1' });
    assert(module1Only.length === 2, `Should return 2 Module1 proofs, got ${module1Only.length}`);
    assert(module1Only.every((p) => p.module === 'Module1'), 'All should be Module1');

    const blockedOnly = proofSystem.replay({ decision: 'BLOCKED' });
    assert(blockedOnly.length === 1, `Should return 1 BLOCKED proof, got ${blockedOnly.length}`);

    console.log(`✅ Replay filtering works: validateModule(2), Module1(2), BLOCKED(1)`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: ArchitectureEnforcementEngine integration
 * Verify that Engine calls proofSystem.captureDecision on validateModule()
 */
async function testEngineIntegration() {
  console.log('\n=== TEST 6: Engine Integration ===');
  try {
    const engine = new ArchitectureEnforcementEngine();
    const proofLogBefore = engine.proofSystem.proofLog.length;

    // Call validateModule
    engine.validateModule('HardenedEventBus');

    const proofLogAfter = engine.proofSystem.proofLog.length;
    assert(proofLogAfter > proofLogBefore, 'ProofLog should have new entry');

    // Verify metrics are updated
    const report = engine.getReport();
    assert(report.metrics.enforcementSuccessCount >= 0, 'Should have enforcementSuccessCount metric');
    assert(report.proofSystemStats !== undefined, 'Report should include proofSystemStats');
    assert(report.proofSystemStats.totalCaptured > 0, 'ProofSystem should have captured decisions');

    // Verify last proof
    const lastProofs = engine.proofSystem.getLastNProofs(1);
    assert(lastProofs.length > 0, 'Should have at least one proof');
    assert(lastProofs[0].module === 'HardenedEventBus', 'Proof module should match');
    assert(lastProofs[0].action === 'validateModule', 'Proof action should be validateModule');

    console.log(`✅ Engine integrated: ${engine.proofSystem.getMetrics().totalCaptured} proofs captured`);

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
  console.log('🧪 PHASE 7.0.4 — System Governance Consolidation + Observability Enforcement');
  console.log('═'.repeat(70));

  try {
    await testProofCaptureWithHash();
    await testProofChaining();
    await testTamperDetection();
    await testEnrichedMetrics();
    await testReplayFiltering();
    await testEngineIntegration();

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
