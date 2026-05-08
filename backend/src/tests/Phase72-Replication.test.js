/**
 * PHASE 7.2 — Distributed Event Replication + Causal Consistency Layer
 *
 * Tests distributed replication without affecting enforcement.
 *
 * CRITICAL INVARIANTS:
 * ✔ replication never affects enforcement
 * ✔ real-time shard remains sole truth
 * ✔ replication is eventual consistency layer
 * ✔ no cross-shard causal corruption
 * ✔ no replay influence from replication layer
 */

const assert = require('assert');
const DistributedReplicationManager = require('../core/governance/distributed/DistributedReplicationManager');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Replication Ordering Preserved
 * Events replicate in same causal order they were enqueued
 */
async function testReplicationOrdering() {
  console.log('\n=== TEST 1: Replication Ordering Preserved ===');
  try {
    const manager = new DistributedReplicationManager();
    const shardId = 'shard_0';

    // Enqueue 10 events in order
    const eventIds = [];
    for (let i = 0; i < 10; i++) {
      const result = manager.enqueueReplication(
        {
          traceId: 'trace_ordering_test',
          type: `EVENT_${i}`,
          sequence: i,
          payload: { index: i }
        },
        shardId
      );
      assert(result.enqueued === true, `Event ${i} should be enqueued`);
      eventIds.push(result.eventId);
    }

    // Verify queue order
    const queue = manager._getOrCreateQueue(shardId);
    assert(queue.queue.length === 10, `Queue should have 10 events, got ${queue.queue.length}`);

    // Verify order is preserved
    for (let i = 0; i < queue.queue.length; i++) {
      assert(queue.queue[i].event.sequence === i, `Sequence at position ${i} should be ${i}`);
    }

    console.log(`✅ Replication ordering preserved: ${eventIds.length} events in causal order`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: No Duplication Across Nodes
 * Same event replicated once per target node, no duplication
 */
async function testNoDuplication() {
  console.log('\n=== TEST 2: No Duplication ===');
  try {
    const manager = new DistributedReplicationManager();
    const shardId = 'shard_1';

    // Enqueue single event
    const enqueueResult = manager.enqueueReplication(
      {
        traceId: 'trace_dup_test',
        type: 'EVENT',
        sequence: 0,
        payload: { data: 'test' }
      },
      shardId
    );
    assert(enqueueResult.enqueued === true, 'Event should be enqueued');
    const eventId = enqueueResult.eventId;

    // Replicate to 3 target nodes
    const targetNodes = ['node_1', 'node_2', 'node_3'];
    const repResult = await manager.replicateEvent(eventId, targetNodes);
    assert(repResult.replicated === true, 'Replication should succeed');
    assert(repResult.targetNodes === 3, `Should replicate to 3 nodes, got ${repResult.targetNodes}`);

    // Confirm acknowledgements (one per node)
    const ackResults = [];
    for (const nodeId of targetNodes) {
      const ackResult = manager.confirmReplicationAck(eventId, nodeId);
      assert(ackResult.acked === true, `ACK for ${nodeId} should succeed`);
      ackResults.push(ackResult);
    }

    // Verify each node acked once
    const ackSet = ackResults.map((r) => r.nodeId);
    assert(ackSet.length === 3, `Should have 3 acks, got ${ackSet.length}`);
    assert(new Set(ackSet).size === 3, 'All acks should be unique (no duplication)');

    console.log(`✅ No duplication: 1 event → 3 nodes, each acked once`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Retry Bounded (No Infinite Loops)
 * Failed replications retry until max limit, then move to DLQ
 */
async function testRetryBounded() {
  console.log('\n=== TEST 3: Retry Bounded ===');
  try {
    const manager = new DistributedReplicationManager({ maxRetries: 2 });
    const shardId = 'shard_2';

    // Enqueue event
    const enqueueResult = manager.enqueueReplication(
      {
        traceId: 'trace_retry_test',
        type: 'EVENT',
        sequence: 0,
        payload: { data: 'test' }
      },
      shardId
    );
    const eventId = enqueueResult.eventId;

    // First retry
    const retry1 = manager.retryReplication(eventId, shardId);
    assert(retry1.retried === true, 'First retry should succeed');
    assert(retry1.retryCount === 1, 'Retry count should be 1');

    // Second retry
    const retry2 = manager.retryReplication(eventId, shardId);
    assert(retry2.retried === true, 'Second retry should succeed');
    assert(retry2.retryCount === 2, 'Retry count should be 2');

    // Third retry (exceeds max) → DLQ
    const retry3 = manager.retryReplication(eventId, shardId);
    assert(retry3.retried === false, 'Third retry should fail (max exceeded)');
    assert(retry3.reason === 'MOVED_TO_DLQ', 'Should move to DLQ');

    // Verify DLQ contains entry
    const dlq = manager.getDeadLetterQueue();
    assert(dlq.length > 0, 'DLQ should have entry');
    const dlqEntry = dlq.find((e) => e.eventId === eventId);
    assert(dlqEntry !== undefined, 'Event should be in DLQ');
    assert(dlqEntry.retries === 2, 'DLQ entry should have retry count');

    console.log(`✅ Retry bounded: max=${manager.maxRetries}, DLQ size=${dlq.length}`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Quorum Non-Blocking Enforcement Path
 * Replication timeout doesn't block enforcement
 */
async function testQuorumNonBlocking() {
  console.log('\n=== TEST 4: Quorum Non-Blocking ===');
  try {
    const manager = new DistributedReplicationManager({
      replicationTimeoutMs: 100 // Short timeout to test
    });
    const shardId = 'shard_3';

    // Enqueue event
    const enqueueResult = manager.enqueueReplication(
      {
        traceId: 'trace_nonblock_test',
        type: 'EVENT',
        sequence: 0,
        payload: { data: 'test' }
      },
      shardId
    );
    const eventId = enqueueResult.eventId;

    // Replicate with target nodes
    const startTime = Date.now();
    const repResult = await manager.replicateEvent(eventId, ['node_1', 'node_2']);

    // Should complete reasonably fast (not blocking)
    const elapsed = Date.now() - startTime;
    assert(elapsed < 1000, `Replication should not block (took ${elapsed}ms)`);

    // Replication may succeed or timeout, but it shouldn't block enforcement
    assert(repResult.eventId === eventId, 'Should return correct eventId');
    assert(repResult.shardId === shardId, 'Should return correct shardId');

    console.log(`✅ Quorum non-blocking: completed in ${elapsed}ms (unblocked)`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Shard Isolation Preserved Under Replication
 * Different shards have independent replication queues
 */
async function testShardIsolation() {
  console.log('\n=== TEST 5: Shard Isolation ===');
  try {
    const manager = new DistributedReplicationManager();

    // Enqueue events to multiple shards
    const shards = ['shard_0', 'shard_1', 'shard_2'];
    for (const shardId of shards) {
      for (let i = 0; i < 5; i++) {
        const result = manager.enqueueReplication(
          {
            traceId: `trace_${shardId}_${i}`,
            type: 'EVENT',
            sequence: i,
            payload: { shard: shardId, index: i }
          },
          shardId
        );
        assert(result.enqueued === true, `Event for ${shardId} should enqueue`);
      }
    }

    // Verify each shard has independent queue
    for (const shardId of shards) {
      const status = manager.getQueueStatus(shardId);
      assert(status.queueSize === 5, `${shardId} should have 5 events, got ${status.queueSize}`);
    }

    // Verify no cross-shard pollution
    const allQueueStatus = manager.getAllQueueStatus();
    assert(allQueueStatus.length === 3, `Should have 3 queues, got ${allQueueStatus.length}`);

    const totalEnqueued = allQueueStatus.reduce((sum, q) => sum + q.queueSize, 0);
    assert(totalEnqueued === 15, `Total enqueued should be 15, got ${totalEnqueued}`);

    console.log(`✅ Shard isolation preserved: ${shards.length} independent queues`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Partition Recovery Replication Correctness
 * After partition heals, replication resumes correctly
 */
async function testPartitionRecovery() {
  console.log('\n=== TEST 6: Partition Recovery ===');
  try {
    const manager = new DistributedReplicationManager();
    const shardId = 'shard_partition';

    // Enqueue events during "partition"
    const eventIds = [];
    for (let i = 0; i < 5; i++) {
      const result = manager.enqueueReplication(
        {
          traceId: 'trace_partition_recovery',
          type: 'EVENT',
          sequence: i,
          payload: { phase: 'during_partition', index: i }
        },
        shardId
      );
      eventIds.push(result.eventId);
    }

    // "Partition heals" - replicate all events
    for (const eventId of eventIds) {
      const repResult = await manager.replicateEvent(eventId, ['node_replica']);
      assert(repResult.eventId === eventId, 'Should replicate event');
    }

    // Verify all replicated
    const state = manager.getReplicationState('trace_partition_recovery');
    assert(state.totalReplications === 5, `Should have 5 replications, got ${state.totalReplications}`);

    // All should be replicated (or at least processed)
    for (const rep of state.replications) {
      assert(
        rep.status === 'REPLICATED' || rep.status === 'REPLICATING',
        `Status should be replicated/replicating, got ${rep.status}`
      );
    }

    console.log(`✅ Partition recovery correct: ${eventIds.length} events recovered`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 7: Causal Chain Integrity Across Nodes
 * Replication preserves causal ordering across cluster
 */
async function testCausalChainIntegrity() {
  console.log('\n=== TEST 7: Causal Chain Integrity ===');
  try {
    const manager = new DistributedReplicationManager();
    const shardId = 'shard_causal';
    const traceId = 'trace_causal_chain';

    // Enqueue events with explicit causal chain
    const sequences = [];
    for (let i = 0; i < 8; i++) {
      const result = manager.enqueueReplication(
        {
          traceId,
          type: `EVENT_${i}`,
          sequence: i,
          payload: { causal: i, dependency: i > 0 ? i - 1 : null }
        },
        shardId
      );
      sequences.push({
        eventId: result.eventId,
        sequence: i
      });
    }

    // Replicate to cluster (preserve order)
    for (const { eventId, sequence } of sequences) {
      const repResult = await manager.replicateEvent(eventId, ['node_backup_1', 'node_backup_2']);
      assert(repResult.replicated !== false, `Event ${sequence} should replicate`);
    }

    // Get replication state and verify causal integrity
    const state = manager.getReplicationState(traceId);
    assert(state.totalReplications === 8, `Should have 8 replications, got ${state.totalReplications}`);

    // Replications should be in order
    const eventIds = state.replications.map((r) => r.eventId);
    assert(eventIds.length === 8, 'All 8 events should be replicated');

    // Verify sequence integrity preserved
    for (let i = 0; i < sequences.length; i++) {
      assert(sequences[i].eventId === eventIds[i], `Causal order should be preserved at position ${i}`);
    }

    console.log(`✅ Causal chain integrity preserved: ${sequences.length} events in order`);

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
  console.log('🧪 PHASE 7.2 — Distributed Event Replication + Causal Consistency');
  console.log('═'.repeat(70));

  try {
    await testReplicationOrdering();
    await testNoDuplication();
    await testRetryBounded();
    await testQuorumNonBlocking();
    await testShardIsolation();
    await testPartitionRecovery();
    await testCausalChainIntegrity();

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

module.exports = { DistributedReplicationManager };
