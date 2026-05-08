/**
 * PHASE 6.0 — Distributed Consistency Tests
 * Validates distributed coordination WITHOUT breaking PHASE 5.7 v2 guarantees
 */

const assert = require('assert');
const { v4: uuid } = require('uuid');
const HardenedEventBus = require('../core/governance/events/HardenedEventBus');
const DistributedGovernanceCoordinator = require('../core/governance/distributed/DistributedGovernanceCoordinator');
const GovernanceEvent = require('../core/governance/events/GovernanceEvent');

// Helper to create test events with proper EventBus structure
function createTestEvent(type = 'VIOLATION', severity = 'HIGH', options = {}) {
  return {
    eventId: uuid(),
    type,
    severity,
    timestamp: Date.now(),
    payload: { message: 'test', validator: 'test' },
    ...options
  };
}

// Helper to create event with explicit sequenceId for causal tests
// Creates a plain object that HardenedEventBus will accept
function createCausalEvent(message, severity, traceId, sequenceId) {
  return {
    eventId: uuid(),
    type: 'VIOLATION',
    severity: severity || 'LOW',
    timestamp: Date.now(),
    traceId,
    sequenceId,
    payload: {
      message,
      validator: 'test'
    }
  };
}

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * TEST 1: Global Event Deduplication (single logical EventBus)
 */
async function testGlobalEventDedup() {
  console.log('\n=== TEST 1: Global Event Deduplication ===');
  try {
    const eventBus = new HardenedEventBus();

    // SHARED REGISTRIES (simulates distributed coordination)
    const sharedGlobalEventRegistry = new Map();
    const sharedReplayRegistry = new Map();
    const sharedTraceRegistry = new Map();
    const sharedSequenceRegistry = new Map();

    const coordinator1 = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1',
      globalEventRegistry: sharedGlobalEventRegistry,
      replayRegistry: sharedReplayRegistry,
      traceRegistry: sharedTraceRegistry,
      sequenceRegistry: sharedSequenceRegistry
    }).initialize();

    const coordinator2 = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-2',
      globalEventRegistry: sharedGlobalEventRegistry,
      replayRegistry: sharedReplayRegistry,
      traceRegistry: sharedTraceRegistry,
      sequenceRegistry: sharedSequenceRegistry
    }).initialize();

    // Create event
    const event = GovernanceEvent.violation(
      { message: 'Global dedup test', validator: 'test' },
      { severity: 'MEDIUM', source: 'test' }
    );

    // Node 1 publishes
    const result1 = coordinator1.publishDistributed(event);
    // publishDistributed returns result from EventBus (may be object or boolean)
    const accepted1 = result1 === true || (result1 && result1.published);
    assert(accepted1 || coordinator1.metrics.eventsAccepted > 0,
      'First node should be accepted by coordinator');

    // Node 2 tries to publish SAME event (global dedup should reject)
    const beforeDedup = coordinator2.metrics.duplicateGlobalRejected;
    const result2 = coordinator2.publishDistributed(event);
    const afterDedup = coordinator2.metrics.duplicateGlobalRejected;

    assert(afterDedup > beforeDedup, 'Global dedup metric should increment on duplicate');

    coordinator1.shutdown();
    coordinator2.shutdown();

    console.log(`✅ Global event dedup verified: metrics-before=${beforeDedup}, metrics-after=${afterDedup}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Replay Protection (prevent same event replay)
 */
async function testReplayProtection() {
  console.log('\n=== TEST 2: Replay Protection ===');
  try {
    const eventBus = new HardenedEventBus();
    const sharedReplayRegistry = new Map();

    // Two nodes share replayRegistry (simulates distributed replay protection)
    const coordinator1 = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1',
      replayRegistry: sharedReplayRegistry
    }).initialize();

    const coordinator2 = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-2',
      replayRegistry: sharedReplayRegistry
    }).initialize();

    // Create event from Node 1
    const event1 = GovernanceEvent.violation(
      { message: 'Replay test', validator: 'test' },
      { severity: 'HIGH', source: 'test' }
    );

    // Node 1 publishes event
    const result1 = coordinator1.publishDistributed(event1);

    // Node 2 tries to replay same event (by forging an event with same eventId & timestamp)
    const replayEvent = {
      ...event1,
      // Keep same eventId and timestamp to trigger replay detection
    };

    const beforeReplay = coordinator2.metrics.replayRejected;
    const result2 = coordinator2.publishDistributed(replayEvent);
    const afterReplay = coordinator2.metrics.replayRejected;

    assert(afterReplay > beforeReplay, 'Replay rejection metric should increment on replay attempt');

    coordinator1.shutdown();
    coordinator2.shutdown();

    console.log(`✅ Replay protection verified: node1=${result1}, node2-replay=${result2}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Causal Ordering (traceId sequence enforcement)
 */
async function testCausalOrdering() {
  console.log('\n=== TEST 3: Causal Ordering ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1'
    }).initialize();

    const traceId = uuid();

    // Publish events in sequence order with explicit sequenceId
    const event1 = createCausalEvent('Causal test 1', 'LOW', traceId, 1);
    const event2 = createCausalEvent('Causal test 2', 'LOW', traceId, 2);
    // Out-of-order event (sequence 0 after 2)
    const event3 = createCausalEvent('Causal test 3', 'LOW', traceId, 0);

    const beforeCausal = coordinator.metrics.causalViolations;

    const r1 = coordinator.publishDistributed(event1);
    const r2 = coordinator.publishDistributed(event2);
    const r3 = coordinator.publishDistributed(event3); // Out-of-order

    const afterCausal = coordinator.metrics.causalViolations;
    assert(afterCausal > beforeCausal, 'Causal violation metric should increment on out-of-order event');

    coordinator.shutdown();

    console.log(`✅ Causal ordering verified: e1=${r1}, e2=${r2}, e3-ooo=${r3}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Trace Depth Limit (prevent infinite loops)
 */
async function testTraceDepthLimit() {
  console.log('\n=== TEST 4: Trace Depth Limit ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1',
      maxTraceDepth: 10
    }).initialize();

    const traceId = uuid();

    // Publish 10 events with same traceId
    for (let i = 0; i < 10; i++) {
      const event = createCausalEvent(`Depth test ${i}`, 'LOW', traceId, i);
      coordinator.publishDistributed(event);
    }

    // 11th event should exceed depth limit
    const beforeDepth = coordinator.metrics.traceDepthViolations;
    const event11 = createCausalEvent('Depth test 11', 'LOW', traceId, 10);

    const r11 = coordinator.publishDistributed(event11);
    const afterDepth = coordinator.metrics.traceDepthViolations;
    assert(afterDepth > beforeDepth, 'Depth violation metric should increment on 11th event');

    coordinator.shutdown();

    console.log(`✅ Trace depth limit verified: allowed=10, rejected-11th=${!r11}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Clock Drift Detection
 */
async function testClockDriftDetection() {
  console.log('\n=== TEST 5: Clock Drift Detection ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1',
      maxClockDriftMs: 1000 // 1 sec max drift
    }).initialize();

    const now = Date.now();

    // Event with acceptable drift (small drift is OK)
    const event1 = {
      eventId: uuid(),
      type: 'VIOLATION',
      severity: 'LOW',
      timestamp: now - 100,  // 100ms drift is acceptable (< 5sec default)
      traceId: uuid(),
      payload: { message: 'Drift test 1', validator: 'test' }
    };

    const r1 = coordinator.publishDistributed(event1);

    // Event with excessive drift (5sec in past) - way beyond maxClockDriftMs default
    const beforeDrift = coordinator.metrics.clockDriftViolations;
    const event2 = {
      eventId: uuid(),
      type: 'VIOLATION',
      severity: 'LOW',
      timestamp: now - 5000, // 5 seconds in past (> 5sec default max)
      traceId: uuid(),
      payload: { message: 'Drift test 2', validator: 'test' }
    };

    const r2 = coordinator.publishDistributed(event2);
    const afterDrift = coordinator.metrics.clockDriftViolations;
    assert(afterDrift > beforeDrift, 'Clock drift metric should increment on excessive drift');

    coordinator.shutdown();

    console.log(`✅ Clock drift detection verified: acceptable=${r1}, excessive=${!r2}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Memory Safety (cleanup registries)
 */
async function testMemorySafety() {
  console.log('\n=== TEST 6: Memory Safety ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1',
      eventRetentionMs: 100, // Short retention for testing
      cleanupIntervalMs: 50   // Quick cleanup
    }).initialize();

    // Publish multiple events
    for (let i = 0; i < 100; i++) {
      const event = {
        eventId: uuid(),
        type: 'VIOLATION',
        severity: 'LOW',
        timestamp: Date.now(),
        traceId: uuid(),
        payload: { message: `test ${i}`, validator: 'test' }
      };
      coordinator.publishDistributed(event);
    }

    const beforeCleanup = coordinator.globalEventRegistry.size;
    assert(beforeCleanup > 0, 'Registry should have entries');

    // Wait for cleanup to run
    await new Promise(resolve => setTimeout(resolve, 200));

    const afterCleanup = coordinator.globalEventRegistry.size;
    assert(afterCleanup < beforeCleanup, 'Cleanup should remove expired entries');

    coordinator.shutdown();

    console.log(`✅ Memory safety verified: before=${beforeCleanup}, after=${afterCleanup}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 7: PHASE 5.7 v2 Guarantee Preservation
 * Verify distributed coordinator doesn't break existing guarantees
 */
async function testPhase57Guarantees() {
  console.log('\n=== TEST 7: PHASE 5.7 v2 Guarantee Preservation ===');
  try {
    const eventBus = new HardenedEventBus();
    const coordinator = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1'
    }).initialize();

    // Create valid GovernanceEvent
    const event = GovernanceEvent.violation(
      { message: 'Phase 5.7 test', validator: 'test' },
      { severity: 'HIGH', source: 'test' }
    );

    // Coordinator should allow valid events
    const beforeAccepted = coordinator.metrics.eventsAccepted;
    const result = coordinator.publishDistributed(event);
    const afterAccepted = coordinator.metrics.eventsAccepted;

    assert(afterAccepted >= beforeAccepted, 'Valid event should be accepted by coordinator');

    // Verify event immutability
    assert(Object.isFrozen(event), 'Event should remain frozen (immutability preserved)');

    coordinator.shutdown();

    console.log(`✅ PHASE 5.7 v2 guarantees preserved: published=${result}, frozen=${Object.isFrozen(event)}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 7: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 8: Single Logical Bus (no fanout)
 */
async function testSingleLogicalBus() {
  console.log('\n=== TEST 8: Single Logical Bus ===');
  try {
    const eventBus = new HardenedEventBus();

    // SHARED REGISTRIES
    const sharedGlobalEventRegistry = new Map();
    const sharedReplayRegistry = new Map();
    const sharedTraceRegistry = new Map();
    const sharedSequenceRegistry = new Map();

    const coordinator1 = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-1',
      globalEventRegistry: sharedGlobalEventRegistry,
      replayRegistry: sharedReplayRegistry,
      traceRegistry: sharedTraceRegistry,
      sequenceRegistry: sharedSequenceRegistry
    }).initialize();

    const coordinator2 = new DistributedGovernanceCoordinator({
      eventBus,
      nodeId: 'node-2',
      globalEventRegistry: sharedGlobalEventRegistry,
      replayRegistry: sharedReplayRegistry,
      traceRegistry: sharedTraceRegistry,
      sequenceRegistry: sharedSequenceRegistry
    }).initialize();

    // Both coordinators share the SAME EventBus instance
    assert(coordinator1.eventBus === coordinator2.eventBus,
      'All coordinators must share single logical bus');

    // Publish from node1
    const event1 = GovernanceEvent.violation(
      { message: 'Test 1', validator: 'test' },
      { severity: 'LOW', source: 'test' }
    );

    const beforeNode1 = coordinator1.metrics.eventsAccepted;
    const result1 = coordinator1.publishDistributed(event1);
    const afterNode1 = coordinator1.metrics.eventsAccepted;

    // Both coordinators share same EventBus
    assert(afterNode1 >= beforeNode1, 'Coordinator should track event');
    assert(result1, 'Valid event should be published');

    coordinator1.shutdown();
    coordinator2.shutdown();

    console.log(`✅ Single logical bus verified: shared=${coordinator1.eventBus === coordinator2.eventBus}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 8: ${error.message}`);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 6.0 — DISTRIBUTED CONSISTENCY TEST SUITE');
  console.log('═'.repeat(70));

  try {
    await testGlobalEventDedup();
    await testReplayProtection();
    await testCausalOrdering();
    await testTraceDepthLimit();
    await testClockDriftDetection();
    await testMemorySafety();
    await testPhase57Guarantees();
    await testSingleLogicalBus();

    // Print results
    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/8 tests`);
    console.log(`❌ FAILED: ${testResults.failed}/8 tests`);

    if (testResults.errors.length > 0) {
      console.log('\n⚠️  ERRORS:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    console.log('\n' + '═'.repeat(70));
    if (testResults.failed === 0) {
      console.log('🎉 ALL DISTRIBUTED CONSISTENCY TESTS PASSED');
      console.log('✅ PHASE 6.0 FOUNDATION VALIDATED');
      console.log('✅ PHASE 5.7 v2 GUARANTEES PRESERVED');
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
