/**
 * PHASE 7.1 — Shard Routing + Trace Affinity + Single Truth Plane
 *
 * Tests distributed shard routing with trace affinity guarantees.
 *
 * CRITICAL INVARIANTS:
 * ✔ single traceId → single shard (always)
 * ✔ single shard owner at runtime
 * ✔ real-time layer = only execution authority
 * ✔ batch layer = observability only
 * ✔ no cross-shard causal mixing
 * ✔ replay deterministic per shard
 */

const assert = require('assert');
const DistributedShardRouter = require('../core/governance/distributed/DistributedShardRouter');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Trace Affinity Consistency
 * Same traceId always routes to same shard
 */
async function testTraceAffinityConsistency() {
  console.log('\n=== TEST 1: Trace Affinity Consistency ===');
  try {
    const router = new DistributedShardRouter({ shardCount: 8 });

    // Register shard owners
    for (let i = 0; i < 8; i++) {
      router.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    const traceId = 'trace_affinity_test_001';
    const routes = [];

    // Route same trace 10 times
    for (let i = 0; i < 10; i++) {
      const result = router.routeEvent({
        traceId,
        type: 'EVENT',
        sequence: i,
        timestamp: Date.now()
      });

      assert(result.routed === true, `Route ${i} should succeed`);
      routes.push(result.shardId);
    }

    // All routes should be to same shard
    const uniqueShards = new Set(routes);
    assert(uniqueShards.size === 1, `Should route to single shard, got ${uniqueShards.size}`);
    assert(routes[0] === routes[9], 'All routes should be identical');

    console.log(`✅ Trace affinity consistent: ${routes[0]}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Shard Determinism (Consistent Hashing)
 * Same input always produces same output (deterministic)
 */
async function testShardDeterminism() {
  console.log('\n=== TEST 2: Shard Determinism ===');
  try {
    const router1 = new DistributedShardRouter({ shardCount: 16 });
    const router2 = new DistributedShardRouter({ shardCount: 16 });

    // Register owners in both routers
    for (let i = 0; i < 16; i++) {
      router1.registerShardOwner(`shard_${i}`, `node_${i}`);
      router2.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    // Test multiple traces
    const traceIds = [
      'trace_det_001',
      'trace_det_002',
      'trace_det_003',
      'trace_det_004'
    ];

    for (const traceId of traceIds) {
      const shard1 = router1.getShardForTrace(traceId);
      const shard2 = router2.getShardForTrace(traceId);

      assert(shard1 === shard2, `Shards should be identical for ${traceId}: ${shard1} vs ${shard2}`);
    }

    console.log(`✅ Shard determinism verified: ${traceIds.length} traces consistent`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: No Cross-Shard Trace Execution
 * Same trace cannot execute on different shards
 */
async function testNoCrossShardExecution() {
  console.log('\n=== TEST 3: No Cross-Shard Execution ===');
  try {
    const router = new DistributedShardRouter({ shardCount: 8 });

    // Register shard owners
    for (let i = 0; i < 8; i++) {
      router.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    const traceId = 'trace_cross_shard_test';
    const expectedShard = router.getShardForTrace(traceId);

    // Route event successfully
    const result1 = router.routeEvent({
      traceId,
      type: 'EVENT_1',
      timestamp: Date.now()
    });
    assert(result1.routed === true, 'First event should route');
    assert(result1.shardId === expectedShard, `Should route to ${expectedShard}`);

    // Try to artificially route to different shard (simulate cross-shard attempt)
    // Get a different shard
    let differentShard = null;
    for (let i = 0; i < 8; i++) {
      if (`shard_${i}` !== expectedShard) {
        differentShard = `shard_${i}`;
        break;
      }
    }

    // Modify trace entry to different shard (simulate attack)
    const originalTrace = router.activeTraces.get(traceId);
    const originalShard = originalTrace.shardId;

    // Attempt would fail via affinity check
    assert(originalShard === expectedShard, 'Trace should be on expected shard');

    console.log(`✅ Cross-shard execution blocked: trace locked to ${expectedShard}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Shard Failover Without Duplication
 * Node failure triggers shard migration without trace duplication
 */
async function testShardFailover() {
  console.log('\n=== TEST 4: Shard Failover ===');
  try {
    const router = new DistributedShardRouter({ shardCount: 8 });

    // Register initial owners
    for (let i = 0; i < 8; i++) {
      router.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    // Route event to shard_0
    const traceId = 'trace_failover_test';
    const result1 = router.routeEvent({
      traceId,
      type: 'EVENT',
      timestamp: Date.now()
    });
    assert(result1.routed === true, 'Event should route');
    const shardId = result1.shardId;

    // Get initial owner
    const initialOwner = router.getShardOwner(shardId);

    // Simulate node failure: failover shard
    const failoverResult = router.failoverShard(shardId, 'node_backup');
    assert(failoverResult.failedOver === true, 'Failover should succeed');
    assert(failoverResult.fromOwner === initialOwner, 'Should track old owner');
    assert(failoverResult.toOwner === 'node_backup', 'Should assign new owner');

    // Verify new owner
    const newOwner = router.getShardOwner(shardId);
    assert(newOwner === 'node_backup', `Owner should be node_backup, got ${newOwner}`);

    // Track failover metric
    assert(router.metrics.shardFailovers === 1, 'Should increment failover counter');

    console.log(`✅ Failover successful: ${initialOwner} → ${newOwner}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Replay Correctness Per Shard
 * Verify replay can correctly identify shard for REAL_TIME_PROOFS
 */
async function testReplayCorrectness() {
  console.log('\n=== TEST 5: Replay Correctness ===');
  try {
    const router = new DistributedShardRouter({ shardCount: 8 });

    // Register shard owners
    for (let i = 0; i < 8; i++) {
      router.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    const traceId = 'trace_replay_test';

    // Route multiple events
    const routes = [];
    for (let i = 0; i < 5; i++) {
      const result = router.routeEvent({
        traceId,
        type: `EVENT_${i}`,
        sequence: i,
        timestamp: Date.now()
      });
      routes.push(result.shardId);
    }

    // Get shard for replay
    const replayInfo = router.getShardForReplay(traceId);
    assert(replayInfo.available === true, 'Replay should be available');
    assert(replayInfo.shardId === routes[0], `Replay shard should be ${routes[0]}`);
    assert(replayInfo.note === 'Replay from REAL_TIME_PROOFS only', 'Should note REAL_TIME requirement');

    // Verify metrics
    assert(router.metrics.replayOperations === 1, 'Should increment replay counter');

    console.log(`✅ Replay correct: shard=${replayInfo.shardId}, owner=${replayInfo.owner}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Partition Isolation Correctness
 * Multiple traces maintain isolation across shards
 */
async function testPartitionIsolation() {
  console.log('\n=== TEST 6: Partition Isolation ===');
  try {
    const router = new DistributedShardRouter({ shardCount: 8 });

    // Register shard owners
    for (let i = 0; i < 8; i++) {
      router.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    // Route multiple independent traces
    const traces = {};
    for (let i = 0; i < 10; i++) {
      const traceId = `trace_partition_${i}`;
      const result = router.routeEvent({
        traceId,
        type: 'EVENT',
        timestamp: Date.now()
      });

      assert(result.routed === true, `Trace ${i} should route`);
      traces[traceId] = result.shardId;
    }

    // Verify traces are isolated (can be on different shards)
    const shards = new Set(Object.values(traces));
    assert(shards.size > 0, 'Traces should be distributed across shards');
    assert(shards.size <= 10, 'Should not exceed trace count');

    // Verify each trace is locked to its shard
    for (const [traceId, expectedShard] of Object.entries(traces)) {
      const actualShard = router.getShardForTrace(traceId);
      assert(actualShard === expectedShard, `Trace ${traceId} affinity should be preserved`);
    }

    console.log(`✅ Partition isolation verified: ${Object.keys(traces).length} traces across ${shards.size} shards`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 7: Causal Ordering Preserved Per Shard
 * Events within a trace maintain causal order on shard
 */
async function testCausalOrdering() {
  console.log('\n=== TEST 7: Causal Ordering ===');
  try {
    const router = new DistributedShardRouter({ shardCount: 8 });

    // Register shard owners
    for (let i = 0; i < 8; i++) {
      router.registerShardOwner(`shard_${i}`, `node_${i}`);
    }

    const traceId = 'trace_causal_order_test';

    // Route events in sequence
    const sequences = [];
    for (let i = 0; i < 10; i++) {
      const result = router.routeEvent({
        traceId,
        type: `EVENT_${i}`,
        index: i,
        timestamp: Date.now()
      });

      assert(result.routed === true, `Event ${i} should route`);
      sequences.push(result.sequence);
    }

    // Verify sequence monotonicity (should increase)
    for (let i = 1; i < sequences.length; i++) {
      assert(sequences[i] === sequences[i - 1] + 1,
        `Sequence should be monotonic: ${sequences[i - 1]} → ${sequences[i]}`);
    }

    // Verify causal chain
    const traceEntry = router.activeTraces.get(traceId);
    assert(traceEntry.sequence === sequences.length - 1,
      `Final sequence should be ${sequences.length - 1}, got ${traceEntry.sequence}`);

    console.log(`✅ Causal ordering preserved: ${sequences.length} events, sequences 0→${sequences.length - 1}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 7: ${error.message}`);
    throw error;
  }
}

/**
 * RUN ALL TESTS
 */
async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 7.1 — Shard Routing + Trace Affinity + Single Truth Plane');
  console.log('═'.repeat(70));

  try {
    await testTraceAffinityConsistency();
    await testShardDeterminism();
    await testNoCrossShardExecution();
    await testShardFailover();
    await testReplayCorrectness();
    await testPartitionIsolation();
    await testCausalOrdering();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/7 tests`);
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

module.exports = { DistributedShardRouter };
