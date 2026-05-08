/**
 * PHASE 6.1 — DISTRIBUTED FAULT SIMULATION & CHAOS VALIDATION
 * Validates distributed consistency guarantees under hostile conditions
 */

const assert = require('assert');
const { v4: uuid } = require('uuid');
const HardenedEventBus = require('../core/governance/events/HardenedEventBus');
const DistributedGovernanceCoordinator = require('../core/governance/distributed/DistributedGovernanceCoordinator');
const DistributedChaosValidator = require('../core/governance/distributed/DistributedChaosValidator');

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * TEST 1: Node Crash Recovery
 */
async function testNodeCrashRecovery() {
  console.log('\n=== TEST 1: Node Crash Recovery ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1'
    }).initialize();

    const chaosValidator = new DistributedChaosValidator({
      eventBus,
      coordinator
    });

    // Simulate node-2 crash
    const result = chaosValidator.simulateNodeCrash('node-2');

    assert(result.simulationId, 'Simulation should have ID');
    assert(result.type === 'NODE_CRASH', 'Type should be NODE_CRASH');
    assert(result.status === 'PASSED', 'Node crash recovery should pass');
    assert(!result.details.hasZombies, 'Should have no zombie registries');

    coordinator.shutdown();

    console.log(`✅ Node crash recovery verified: crashed=${result.details.crashDetected}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Network Partition Isolation
 */
async function testNetworkPartitionIsolation() {
  console.log('\n=== TEST 2: Network Partition Isolation ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1'
    }).initialize();

    const chaosValidator = new DistributedChaosValidator({
      eventBus,
      coordinator
    });

    // Simulate partition
    const result = chaosValidator.simulatePartition(
      ['node-1', 'node-2'],
      ['node-3', 'node-4']
    );

    assert(result.simulationId, 'Simulation should have ID');
    assert(result.type === 'PARTITION', 'Type should be PARTITION');
    assert(result.status === 'PASSED', 'Partition detection should pass');
    assert(result.singleBusVerified, 'Should verify single logical bus');

    coordinator.shutdown();

    console.log(`✅ Network partition isolation verified: partitionDetected=${result.partitionDetected}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Clock Drift Rejection
 */
async function testClockDriftRejection() {
  console.log('\n=== TEST 3: Clock Drift Rejection ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1',
      maxClockDriftMs: 5000 // 5 second max
    }).initialize();

    const chaosValidator = new DistributedChaosValidator({
      eventBus,
      coordinator
    });

    // Test with excessive drift (10 seconds)
    const result = chaosValidator.simulateClockDrift('node-1', 10000);

    assert(result.simulationId, 'Simulation should have ID');
    assert(result.type === 'CLOCK_DRIFT', 'Type should be CLOCK_DRIFT');
    assert(result.status === 'PASSED', 'Clock drift rejection should pass');
    assert(result.rejected, 'Event should be rejected for excessive drift');
    assert(result.correctBehavior, 'Drift validation behavior should be correct');

    coordinator.shutdown();

    console.log(`✅ Clock drift rejection verified: driftMs=${result.driftMs}, rejected=${result.rejected}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Replay Attack Rejection
 */
async function testReplayAttackRejection() {
  console.log('\n=== TEST 4: Replay Attack Rejection ===');
  try {
    const eventBus = new HardenedEventBus();
    const sharedReplayRegistry = new Map();

    const coordinator1 = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1',
      replayRegistry: sharedReplayRegistry
    }).initialize();

    const chaosValidator = new DistributedChaosValidator({
      eventBus,
      coordinator: coordinator1
    });

    // Create event (don't pre-register - let chaos validator do it)
    const testEvent = {
      eventId: uuid(),
      type: 'TEST',
      timestamp: Date.now(),
      traceId: uuid()
    };

    // Simulate replay attack (includes registration and detection)
    const result = chaosValidator.simulateReplayAttack(testEvent);

    assert(result.simulationId, 'Simulation should have ID');
    assert(result.type === 'REPLAY_ATTACK', 'Type should be REPLAY_ATTACK');
    assert(result.status === 'PASSED', 'Replay attack rejection should pass');
    assert(result.replayDetected, 'Replay attack should be detected');

    coordinator1.shutdown();

    console.log(`✅ Replay attack rejection verified: detected=${result.replayDetected}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Causal Ordering Enforcement
 */
async function testCausalOrderingEnforcement() {
  console.log('\n=== TEST 5: Causal Ordering Enforcement ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1'
    }).initialize();

    const chaosValidator = new DistributedChaosValidator({
      eventBus,
      coordinator
    });

    const traceId = uuid();

    // Simulate causal desync (sequence 5 expected, got 3)
    const result = chaosValidator.simulateCausalDesync(traceId, 5, 3);

    assert(result.simulationId, 'Simulation should have ID');
    assert(result.type === 'CAUSAL_DESYNC', 'Type should be CAUSAL_DESYNC');
    assert(result.status === 'PASSED', 'Causal ordering enforcement should pass');
    assert(result.rejected, 'Out-of-order event should be rejected');
    assert(result.correctBehavior, 'Ordering validation behavior should be correct');

    coordinator.shutdown();

    console.log(`✅ Causal ordering enforcement verified: expectedSeq=${result.expectedSequence}, actualSeq=${result.actualSequence}, rejected=${result.rejected}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Network Latency Handling
 */
async function testNetworkLatencyHandling() {
  console.log('\n=== TEST 6: Network Latency Handling ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1'
    }).initialize();

    const chaosValidator = new DistributedChaosValidator({
      eventBus,
      coordinator
    });

    // Simulate high latency (5 seconds)
    const result = chaosValidator.simulateLatency('node-1', 5000);

    assert(result.simulationId, 'Simulation should have ID');
    assert(result.type === 'LATENCY', 'Type should be LATENCY');
    assert(result.status === 'PASSED', 'Latency handling should pass');
    assert(result.orderingPreserved, 'Event ordering should be preserved despite latency');

    coordinator.shutdown();

    console.log(`✅ Network latency handling verified: latencyMs=${result.latencyMs}, orderingPreserved=${result.orderingPreserved}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 7: Registry Consistency Under Corruption
 */
async function testRegistryConsistencyUnderCorruption() {
  console.log('\n=== TEST 7: Registry Consistency Under Corruption ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1'
    }).initialize();

    const chaosValidator = new DistributedChaosValidator({
      eventBus,
      coordinator
    });

    // Simulate registry corruption
    const result = chaosValidator.simulateRegistryCorruption();

    assert(result.simulationId, 'Simulation should have ID');
    assert(result.type === 'REGISTRY_CORRUPTION', 'Type should be REGISTRY_CORRUPTION');
    assert(result.status === 'PASSED', 'Registry consistency should be maintained');
    assert(result.corruptionDetected, 'Corruption should be detected');
    assert(result.recovered, 'Registry should recover after corruption');

    coordinator.shutdown();

    console.log(`✅ Registry consistency verified: detected=${result.corruptionDetected}, recovered=${result.recovered}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 7: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 8: Split-Brain Detection
 */
async function testSplitBrainDetection() {
  console.log('\n=== TEST 8: Split-Brain Detection ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1'
    }).initialize();

    const chaosValidator = new DistributedChaosValidator({
      eventBus,
      coordinator
    });

    // Simulate split-brain scenario
    const result = chaosValidator.simulateSplitBrain();

    assert(result.simulationId, 'Simulation should have ID');
    assert(result.type === 'SPLIT_BRAIN', 'Type should be SPLIT_BRAIN');
    assert(result.status === 'PASSED', 'Split-brain detection should pass');
    assert(result.singleLogicalBusVerified, 'Should verify single logical bus prevents split-brain');

    coordinator.shutdown();

    console.log(`✅ Split-brain detection verified: singleBusVerified=${result.singleLogicalBusVerified}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 8: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 9: Distributed Idempotency Survival Under Chaos
 */
async function testDistributedIdempotencySurvival() {
  console.log('\n=== TEST 9: Distributed Idempotency Survival ===');
  try {
    const eventBus = new HardenedEventBus();
    const sharedGlobalRegistry = new Map();

    const coordinator1 = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1',
      globalEventRegistry: sharedGlobalRegistry
    }).initialize();

    const coordinator2 = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-2',
      globalEventRegistry: sharedGlobalRegistry
    }).initialize();

    const chaosValidator = new DistributedChaosValidator({
      eventBus,
      coordinator: coordinator1
    });

    // Create event
    const testEvent = {
      eventId: uuid(),
      type: 'TEST',
      timestamp: Date.now(),
      traceId: uuid()
    };

    // Publish from node 1
    const beforeGlobalDup = coordinator2.metrics.duplicateGlobalRejected;
    coordinator1.publishDistributed(testEvent);

    // Attempt to publish from node 2 (should be rejected by global dedup)
    const r2 = coordinator2.publishDistributed(testEvent);
    const afterGlobalDup = coordinator2.metrics.duplicateGlobalRejected;

    // Now run chaos test (should not break this)
    chaosValidator.runAllChaosTests();

    const status = chaosValidator.getStatus();
    assert(status.allPassed, 'All chaos tests should pass');

    // Verify idempotency still works (dedup metric should increment)
    assert(afterGlobalDup > beforeGlobalDup, 'Distributed idempotency should survive chaos');

    coordinator1.shutdown();
    coordinator2.shutdown();

    console.log(`✅ Distributed idempotency survival verified: chaos tests=${status.passedTests}/${status.totalTests}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 9: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 10: Audit Trail Coherence After Chaos
 */
async function testAuditTrailCoherenceAfterChaos() {
  console.log('\n=== TEST 10: Audit Trail Coherence After Chaos ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1'
    }).initialize();

    const chaosValidator = new DistributedChaosValidator({
      eventBus,
      coordinator
    });

    // Get initial state
    const initialSize = coordinator.globalEventRegistry.size;

    // Run all chaos tests
    const chaosResults = chaosValidator.runAllChaosTests();

    // Verify audit trail is still coherent
    const finalSize = coordinator.globalEventRegistry.size;
    const registriesClean = finalSize <= initialSize + 10; // Small tolerance

    assert(chaosResults.length > 0, 'Chaos tests should have been executed');
    assert(registriesClean, 'Registries should remain bounded after chaos');

    coordinator.shutdown();

    console.log(`✅ Audit trail coherence verified: initialSize=${initialSize}, finalSize=${finalSize}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 10: ${error.message}`);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 6.1 — DISTRIBUTED FAULT SIMULATION & CHAOS VALIDATION');
  console.log('═'.repeat(70));

  try {
    await testNodeCrashRecovery();
    await testNetworkPartitionIsolation();
    await testClockDriftRejection();
    await testReplayAttackRejection();
    await testCausalOrderingEnforcement();
    await testNetworkLatencyHandling();
    await testRegistryConsistencyUnderCorruption();
    await testSplitBrainDetection();
    await testDistributedIdempotencySurvival();
    await testAuditTrailCoherenceAfterChaos();

    // Print results
    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/10 tests`);
    console.log(`❌ FAILED: ${testResults.failed}/10 tests`);

    if (testResults.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      testResults.errors.forEach((error) => console.log(`  - ${error}`));
    }

    console.log('\n' + '═'.repeat(70));
    if (testResults.failed === 0) {
      console.log('🎉 ALL CHAOS VALIDATION TESTS PASSED');
      console.log('✅ DISTRIBUTED CONSISTENCY SURVIVES HOSTILE CONDITIONS');
      console.log('✅ PHASE 6.1 FOUNDATION VALIDATED');
    } else {
      console.log('⚠️  SOME TESTS FAILED — REVIEW ERRORS ABOVE');
    }
    console.log('═'.repeat(70) + '\n');

    process.exit(testResults.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, testResults };
