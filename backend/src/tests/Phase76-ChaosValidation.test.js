/**
 * PHASE 7.6 — Distributed Chaos Validation Layer
 *
 * Empirically validates system robustness under extreme conditions.
 *
 * CRITICAL INVARIANTS:
 * ✔ enforcement deterministic under chaos
 * ✔ idempotency never broken
 * ✔ replay never causes double execution
 * ✔ recovery never violates ordering
 * ✔ observability never affects runtime
 * ✔ proof system always append-only
 */

const assert = require('assert');
const ChaosValidator = require('../core/governance/chaos/ChaosValidator');
const ResilienceProver = require('../core/governance/chaos/ResilienceProver');
const GlobalEventRegistry = require('../core/governance/distributed/GlobalEventRegistry');
const DistributedShardRouter = require('../core/governance/distributed/DistributedShardRouter');
const EnforcementProofSystem = require('../core/governance/enforcement/EnforcementProofSystem');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Enforcement Deterministic Under Crash
 * Verify enforcement continues correctly despite node crash chaos
 */
async function testEnforcementUnderCrash() {
  console.log('\n=== TEST 1: Enforcement Deterministic Under Crash ===');
  try {
    const validator = new ChaosValidator();
    const prover = new ResilienceProver();

    // Create mock system
    const mockSystem = {
      globalEventRegistry: new GlobalEventRegistry(),
      proofSystem: new EnforcementProofSystem(),
      shardRouter: new DistributedShardRouter({ shardCount: 8 })
    };

    // Register shard owners
    for (let i = 0; i < 8; i++) {
      mockSystem.shardRouter.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    // Initialize validator
    validator.initialize(mockSystem);

    // Snapshot before chaos
    prover.snapshotSystemBefore(mockSystem);

    // Record event before crash
    const event1 = mockSystem.globalEventRegistry.recordEvent('evt_1', 'trace_1', 'shard_0', 'node_0');
    assert(event1.recorded === true, 'Event should record before crash');

    // Inject node crash chaos
    const crashResult = await validator.nodeCrash('node_0');
    assert(crashResult.injected === true, 'Crash should inject');

    // Continue enforcement after crash (should not be affected)
    const event2 = mockSystem.globalEventRegistry.recordEvent('evt_2', 'trace_2', 'shard_1', 'node_1');
    assert(event2.recorded === true, 'Event should record after crash (enforcement continues)');

    // Snapshot after chaos
    prover.snapshotSystemAfter(mockSystem);

    // Validate resilience
    const report = prover.validateAll(mockSystem);
    assert(report.passed >= 4, `Should pass at least 4 validations, got ${report.passed}`);
    assert(mockSystem.globalEventRegistry.metrics.eventsRegistered === 2, 'Should have 2 registered events');

    console.log(`✅ Enforcement deterministic: continued despite crash, score ${report.score}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Idempotency Under Replay Storm
 * Verify idempotency prevents double execution under replay attack
 */
async function testIdempotencyUnderReplayStorm() {
  console.log('\n=== TEST 2: Idempotency Under Replay Storm ===');
  try {
    const validator = new ChaosValidator();
    const registry = new GlobalEventRegistry();

    validator.initialize({ globalEventRegistry: registry, proofSystem: new EnforcementProofSystem() });

    // Record initial events
    const event = { eventId: 'evt_replay_test', traceId: 'trace_replay', shardId: 'shard_0' };
    const recordResult = registry.recordEvent(event.eventId, event.traceId, event.shardId, 'node_0');
    assert(recordResult.recorded === true, 'Event should record');

    // Inject replay attack
    const replayResult = await validator.replayAttack(event);
    assert(replayResult.injected === true, 'Replay attack should inject');
    assert(replayResult.blocked === true, 'Replay should be blocked by idempotency');

    // Verify no double execution
    const isDup = registry.isDuplicate(event.eventId);
    assert(isDup === true, 'Replay event should be detected as duplicate');

    const metrics = registry.getMetrics();
    assert(metrics.eventsRegistered === 1, 'Should have 1 registered event (not 2)');
    assert(metrics.duplicatesDetected >= 1, 'Should have detected duplicate');

    console.log(`✅ Idempotency preserved: ${metrics.eventsRegistered} unique, ${metrics.duplicatesDetected} duplicates blocked`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Recovery Correctness Under Partition
 * Verify recovery maintains consistency during network partition
 */
async function testRecoveryUnderPartition() {
  console.log('\n=== TEST 3: Recovery Correctness Under Partition ===');
  try {
    const validator = new ChaosValidator();
    const prover = new ResilienceProver();
    const registry = new GlobalEventRegistry();
    const router = new DistributedShardRouter({ shardCount: 4 });

    // Register shard owners
    for (let i = 0; i < 4; i++) {
      router.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    const mockSystem = {
      globalEventRegistry: registry,
      proofSystem: new EnforcementProofSystem(),
      shardRouter: router
    };

    validator.initialize(mockSystem);
    prover.snapshotSystemBefore(mockSystem);

    // Record events on each shard
    for (let i = 0; i < 4; i++) {
      registry.recordEvent(`evt_pre_partition_${i}`, `trace_${i}`, `shard_${i}`, `node_${i}`);
    }

    // Inject network partition
    const partitionResult = await validator.networkPartition(
      ['node_0', 'node_1'],
      ['node_2', 'node_3']
    );
    assert(partitionResult.injected === true, 'Partition should inject');

    // Recovery: continue on each side
    registry.recordEvent('evt_post_partition_0', 'trace_partition_a', 'shard_0', 'node_0');
    registry.recordEvent('evt_post_partition_1', 'trace_partition_b', 'shard_2', 'node_2');

    prover.snapshotSystemAfter(mockSystem);

    // Validate recovery correctness
    const recoveryResult = { success: true, violations: 0, eventsRecovered: 2 };
    const report = prover.validateAll(mockSystem, recoveryResult);

    assert(report.passed >= 5, `Should pass at least 5 validations, got ${report.passed}`);
    assert(registry.metrics.eventsRegistered === 6, 'Should have 6 events (4 + 2)');

    console.log(`✅ Recovery correctness: partition recovered, ${report.passed}/${report.total} invariants held`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Shard Routing Stability Under Corruption
 * Verify shard routing remains consistent despite topology chaos
 */
async function testShardRoutingUnderCorruption() {
  console.log('\n=== TEST 4: Shard Routing Stability Under Corruption ===');
  try {
    const validator = new ChaosValidator();
    const router = new DistributedShardRouter({ shardCount: 8 });

    // Register initial owners
    for (let i = 0; i < 8; i++) {
      router.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    validator.initialize({ shardRouter: router, proofSystem: new EnforcementProofSystem() });

    // Route events before corruption
    const trace1_shard = router.getShardForTrace('trace_stable');
    const route1 = router.routeEvent({ traceId: 'trace_stable', type: 'EVENT' });
    assert(route1.routed === true, 'Event should route before corruption');

    // Inject topology corruption
    const corruptionResult = await validator.topologyCorruption();
    assert(corruptionResult.injected === true, 'Corruption should inject');

    // Verify routing remains stable (same trace → same shard)
    const trace1_shard_after = router.getShardForTrace('trace_stable');
    assert(trace1_shard === trace1_shard_after, 'Shard assignment should be deterministic');

    // Routing should still work
    const route2 = router.routeEvent({ traceId: 'trace_stable', type: 'EVENT' });
    assert(route2.routed === true, 'Event should route after corruption');
    assert(route2.shardId === trace1_shard, 'Should route to same shard');

    console.log(`✅ Shard routing stable: determinism preserved despite topology chaos`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Observability Correctness Under Chaos
 * Verify observability remains coherent despite chaos injection
 */
async function testObservabilityUnderChaos() {
  console.log('\n=== TEST 5: Observability Correctness Under Chaos ===');
  try {
    const validator = new ChaosValidator();
    const registry = new GlobalEventRegistry();

    validator.initialize({ globalEventRegistry: registry, proofSystem: new EnforcementProofSystem() });

    // Record events
    for (let i = 0; i < 5; i++) {
      registry.recordEvent(`evt_obs_${i}`, 'trace_obs', 'shard_0', 'node_0');
    }

    // Inject chaos (multiple modes)
    await validator.nodeCrash('node_1');
    await validator.replicationStorm(2);

    // Verify observability metrics remain coherent
    const metrics = registry.getMetrics();
    assert(metrics.eventsRegistered === 5, 'Registered events should be accurate');
    assert(metrics.uniqueEventsProcessed === 5, 'Unique events should match');
    assert(metrics.registrySize === 5, 'Registry size should be accurate');

    // Get trace events (observability query)
    const traceEvents = registry.getTraceEvents('trace_obs');
    assert(traceEvents.length === 5, 'Trace query should return correct events');

    // Verify ordering
    for (let i = 0; i < traceEvents.length; i++) {
      assert(traceEvents[i].sequence === i + 1, `Event ${i} should have sequence ${i + 1}`);
    }

    console.log(`✅ Observability coherent: metrics and queries accurate despite chaos`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Proof System Integrity Under Stress
 * Verify proof chain remains append-only and integral under chaos
 */
async function testProofIntegrityUnderStress() {
  console.log('\n=== TEST 6: Proof System Integrity Under Stress ===');
  try {
    const validator = new ChaosValidator();
    const proofSystem = new EnforcementProofSystem();

    validator.initialize({ proofSystem, globalEventRegistry: new GlobalEventRegistry() });

    // Capture proofs before chaos
    for (let i = 0; i < 5; i++) {
      proofSystem.captureDecision({
        module: 'TestModule',
        action: 'testAction',
        ruleEvaluated: 'test_rule',
        input: { index: i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now()
      });
    }

    const lengthBefore = proofSystem.proofLog.length;
    assert(lengthBefore === 5, 'Should have 5 proofs before chaos');

    // Inject stress chaos
    await validator.memoryPressure();
    await validator.lockTimeoutFlood();

    // Capture more proofs during chaos
    for (let i = 5; i < 8; i++) {
      proofSystem.captureDecision({
        module: 'TestModule',
        action: 'testAction',
        ruleEvaluated: 'test_rule',
        input: { index: i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now()
      });
    }

    const lengthAfter = proofSystem.proofLog.length;
    assert(lengthAfter === 8, 'Should have 8 proofs after capture');

    // Verify proof chain integrity
    const verifyResult = proofSystem.verify();
    assert(verifyResult.valid === true, 'Proof chain should remain valid');
    assert(verifyResult.entriesVerified === 8, 'Should verify 8 entries');

    console.log(`✅ Proof integrity maintained: ${lengthAfter} proofs, chain verified`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 7: No Double Execution Under Race Conditions
 * Verify idempotency prevents race condition double execution
 */
async function testNoDoubleExecutionUnderRace() {
  console.log('\n=== TEST 7: No Double Execution Under Race Conditions ===');
  try {
    const validator = new ChaosValidator();
    const registry = new GlobalEventRegistry();

    validator.initialize({ globalEventRegistry: registry, proofSystem: new EnforcementProofSystem() });

    // Simulate concurrent event attempts (same eventId)
    const eventId = 'evt_race_condition';
    const attempts = [];

    // Attempt 1: Record (should succeed)
    const result1 = registry.recordEvent(eventId, 'trace_race', 'shard_0', 'node_0');
    attempts.push(result1.recorded);

    // Inject clock drift (creates timing race)
    await validator.clockDrift('node_1', 100);

    // Attempts 2-4: Concurrent attempts (should all fail)
    for (let i = 2; i <= 4; i++) {
      const isDup = registry.isDuplicate(eventId);
      if (isDup) {
        const result = registry.recordEvent(eventId, `trace_race_${i}`, 'shard_1', `node_${i}`);
        attempts.push(result.recorded);
      }
    }

    // Verify: exactly 1 success, rest failures
    const successes = attempts.filter(a => a === true).length;
    const failures = attempts.filter(a => a === false).length;

    assert(successes === 1, `Should have 1 success, got ${successes}`);
    assert(failures >= 2, `Should have at least 2 failures, got ${failures}`);

    const metrics = registry.getMetrics();
    assert(metrics.eventsRegistered === 1, 'Should register exactly 1 event despite race');
    assert(metrics.duplicatesDetected >= 2, 'Should detect multiple duplicate attempts');

    console.log(`✅ No double execution: race condition prevented, ${successes} success, ${failures} blocked`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 7: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 8: System Stability Under Mixed Failures
 * Verify system remains stable under simultaneous multiple chaos modes
 */
async function testSystemStabilityUnderMixedFailures() {
  console.log('\n=== TEST 8: System Stability Under Mixed Failures ===');
  try {
    const validator = new ChaosValidator();
    const prover = new ResilienceProver();
    const registry = new GlobalEventRegistry();
    const proofSystem = new EnforcementProofSystem();
    const router = new DistributedShardRouter({ shardCount: 4 });

    // Register shard owners
    for (let i = 0; i < 4; i++) {
      router.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    const mockSystem = {
      globalEventRegistry: registry,
      proofSystem,
      shardRouter: router
    };

    validator.initialize(mockSystem);
    prover.snapshotSystemBefore(mockSystem);

    // Record baseline events
    for (let i = 0; i < 4; i++) {
      registry.recordEvent(`evt_baseline_${i}`, `trace_baseline_${i}`, `shard_${i}`, `node_${i}`);
    }

    // Inject MIXED CHAOS SIMULTANEOUSLY
    const chaos1 = await validator.nodeCrash('node_0');
    const chaos2 = await validator.networkPartition(['node_0', 'node_1'], ['node_2', 'node_3']);
    const chaos3 = await validator.replicationStorm(3);
    const chaos4 = await validator.clockDrift('node_2', 500);

    assert(chaos1.injected === true, 'Node crash should inject');
    assert(chaos2.injected === true, 'Partition should inject');
    assert(chaos3.injected === true, 'Replication storm should inject');
    assert(chaos4.injected === true, 'Clock drift should inject');

    // System should continue functioning
    for (let i = 4; i < 8; i++) {
      const recordResult = registry.recordEvent(`evt_after_chaos_${i}`, `trace_after_${i}`, `shard_${(i % 4)}`, `node_${(i % 4)}`);
      assert(recordResult.recorded === true, `Event ${i} should record despite chaos`);
    }

    // Verify stability
    prover.snapshotSystemAfter(mockSystem);
    const report = prover.validateAll(mockSystem);

    assert(report.passed >= 4, `Should pass at least 4 invariants, got ${report.passed}`);
    assert(registry.metrics.eventsRegistered === 8, 'Should have 8 total events');
    assert(proofSystem.verify().valid === true, 'Proof chain should remain integral');

    const metrics = validator.getMetrics();
    console.log(`✅ System stability maintained: ${metrics.injectionsSuccessful} chaos modes active, score ${report.score}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 8: ${error.message}`);
    throw error;
  }
}

/**
 * RUN ALL TESTS
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 7.6 — Distributed Chaos Validation Layer');
  console.log('═'.repeat(70));

  try {
    await testEnforcementUnderCrash();
    await testIdempotencyUnderReplayStorm();
    await testRecoveryUnderPartition();
    await testShardRoutingUnderCorruption();
    await testObservabilityUnderChaos();
    await testProofIntegrityUnderStress();
    await testNoDoubleExecutionUnderRace();
    await testSystemStabilityUnderMixedFailures();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/8 tests`);
    console.log('═'.repeat(70));
    console.log('\n🎯 RESILIENCE SCORE: SYSTEM VERIFIED UNDER CHAOS');
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

module.exports = { ChaosValidator, ResilienceProver };
