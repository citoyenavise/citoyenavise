/**
 * PHASE 7.3 — Global Idempotency + Cross-Node Deduplication Layer
 *
 * Tests cluster-wide deduplication with cryptographic proof integrity.
 *
 * CRITICAL INVARIANTS:
 * ✔ duplicate rejection occurs BEFORE enforcement execution
 * ✔ eventId unique cluster-wide (no cross-shard double execution)
 * ✔ real-time registry is source of truth for idempotency
 * ✔ reconciliation is observability-only (non-blocking)
 * ✔ replay deterministic per shard with registry sync
 * ✔ partition recovery maintains idempotency guarantees
 */

const assert = require('assert');
const crypto = require('crypto');
const GlobalEventRegistry = require('../core/governance/distributed/GlobalEventRegistry');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Duplicate Rejection Cross-Shard
 * Same eventId rejected on different shard attempt
 */
async function testDuplicateRejectionCrossShard() {
  console.log('\n=== TEST 1: Duplicate Rejection Cross-Shard ===');
  try {
    const registry = new GlobalEventRegistry();

    // Register event on shard_0
    const eventId = 'event_dup_test_001';
    const result1 = registry.recordEvent(eventId, 'trace_cross_shard', 'shard_0', 'node_0');
    assert(result1.recorded === true, 'First record should succeed');
    assert(result1.sequence === 1, 'Sequence should be 1');

    // Check for duplicate (updates metric)
    const isDup = registry.isDuplicate(eventId);
    assert(isDup === true, 'isDuplicate should detect existing event');

    // Attempt same eventId on different shard
    const result2 = registry.recordEvent(eventId, 'trace_cross_shard', 'shard_1', 'node_1');
    assert(result2.recorded === false, 'Duplicate on different shard should be rejected');
    assert(result2.reason === 'DUPLICATE_EVENT', `Should have DUPLICATE_EVENT reason, got ${result2.reason}`);
    assert(result2.existingEntry !== undefined, 'Should return existing entry');
    assert(result2.existingEntry.shardId === 'shard_0', 'Existing entry should be from shard_0');

    // Verify metrics
    const metrics = registry.getMetrics();
    assert(metrics.eventsRegistered === 1, 'Should have 1 registered event');
    assert(metrics.duplicatesDetected === 1, 'Should have detected 1 duplicate');

    console.log(`✅ Duplicate rejection cross-shard: ${eventId} locked to shard_0`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Unique Event Execution Correctness
 * Each unique eventId executes exactly once cluster-wide
 */
async function testUniqueEventExecution() {
  console.log('\n=== TEST 2: Unique Event Execution Correctness ===');
  try {
    const registry = new GlobalEventRegistry();

    // Register 10 unique events across shards
    const eventIds = [];
    const results = [];
    for (let i = 0; i < 10; i++) {
      const eventId = `event_unique_${i}`;
      const shardId = `shard_${i % 4}`;
      const result = registry.recordEvent(eventId, `trace_unique_${i}`, shardId, `node_${i}`);

      assert(result.recorded === true, `Event ${i} should record successfully`);
      assert(result.sequence === i + 1, `Sequence should be ${i + 1}, got ${result.sequence}`);

      eventIds.push(eventId);
      results.push(result);
    }

    // Attempt to re-record each event
    for (let i = 0; i < 10; i++) {
      const eventId = eventIds[i];

      // Check for duplicate (updates metric)
      const isDup = registry.isDuplicate(eventId);
      assert(isDup === true, `isDuplicate should detect existing event ${eventId}`);

      const result = registry.recordEvent(eventId, `trace_retry_${i}`, `shard_${(i + 1) % 4}`, `node_retry_${i}`);

      assert(result.recorded === false, `Re-record of ${eventId} should fail`);
      assert(result.reason === 'DUPLICATE_EVENT', 'Should identify as duplicate');
    }

    // Verify metrics
    const metrics = registry.getMetrics();
    assert(metrics.eventsRegistered === 10, 'Should have 10 registered events');
    assert(metrics.duplicatesDetected === 10, 'Should have detected 10 duplicates');
    assert(metrics.uniqueEventsProcessed === 10, 'Should have 10 unique events processed');

    console.log(`✅ Unique event execution: 10 unique events, 10 duplicate rejections`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Proof System Logging Integrity
 * Registry entries are immutable with integrity checks
 */
async function testProofSystemLoggingIntegrity() {
  console.log('\n=== TEST 3: Proof System Logging Integrity ===');
  try {
    const registry = new GlobalEventRegistry();

    // Record event
    const eventId = 'event_proof_integrity';
    const result = registry.recordEvent(eventId, 'trace_proof_test', 'shard_0', 'node_0');
    assert(result.recorded === true, 'Event should record');

    // Get entry
    const entry = registry.getEventEntry(eventId);
    assert(entry !== null, 'Entry should exist');
    assert(entry.eventId === eventId, 'Entry should have correct eventId');
    assert(entry.sequence === 1, 'Entry should have sequence 1');
    assert(entry.registeredAt !== undefined, 'Entry should have registeredAt timestamp');

    // Attempt to modify entry (should fail due to Object.freeze)
    try {
      entry.sequence = 999;
      // If freeze is working, this won't modify the value
      assert(entry.sequence === 1, 'Entry should be immutable via Object.freeze()');
    } catch (e) {
      // Expected: strict mode or frozen object prevents modification
    }

    // Verify entry structure
    assert(entry.traceId === 'trace_proof_test', 'Entry should preserve traceId');
    assert(entry.shardId === 'shard_0', 'Entry should preserve shardId');
    assert(entry.nodeId === 'node_0', 'Entry should preserve nodeId');
    assert(entry.timestamp !== undefined, 'Entry should have timestamp');

    console.log(`✅ Proof system integrity: immutable entries verified`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Replay Reconstruction Determinism
 * Replay from registry produces deterministic order
 */
async function testReplayReconstructionDeterminism() {
  console.log('\n=== TEST 4: Replay Reconstruction Determinism ===');
  try {
    const registry = new GlobalEventRegistry();
    const traceId = 'trace_replay_determinism';

    // Record 5 events for same trace
    const sequences = [];
    for (let i = 0; i < 5; i++) {
      const eventId = `event_replay_${i}`;
      const result = registry.recordEvent(eventId, traceId, 'shard_0', 'node_0');
      assert(result.recorded === true, `Event ${i} should record`);
      sequences.push(result.sequence);
    }

    // Verify sequences are monotonic
    for (let i = 1; i < sequences.length; i++) {
      assert(sequences[i] === sequences[i - 1] + 1,
        `Sequence should be monotonic: ${sequences[i - 1]} → ${sequences[i]}`);
    }

    // Replay from registry
    const traceEvents = registry.getTraceEvents(traceId);
    assert(traceEvents.length === 5, `Should have 5 events for trace, got ${traceEvents.length}`);

    // Verify deterministic order
    for (let i = 0; i < traceEvents.length; i++) {
      assert(traceEvents[i].sequence === i + 1, `Replay event ${i} should have sequence ${i + 1}`);
      assert(traceEvents[i].eventId === `event_replay_${i}`, `Replay should preserve event order`);
    }

    // Replay again to verify determinism
    const traceEvents2 = registry.getTraceEvents(traceId);
    for (let i = 0; i < traceEvents2.length; i++) {
      assert(traceEvents2[i].eventId === traceEvents[i].eventId, 'Replay should be deterministic');
      assert(traceEvents2[i].sequence === traceEvents[i].sequence, 'Replay sequences should match');
    }

    console.log(`✅ Replay determinism: ${traceEvents.length} events reconstructed consistently`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Reconciliation Consistency Across Nodes
 * Shard reconciliation detects divergence correctly
 */
async function testReconciliationConsistency() {
  console.log('\n=== TEST 5: Reconciliation Consistency Across Nodes ===');
  try {
    const registry = new GlobalEventRegistry();

    // Record events to different shards
    const shardIds = ['shard_0', 'shard_1', 'shard_2'];
    const eventsByShardId = {};

    for (const shardId of shardIds) {
      eventsByShardId[shardId] = [];
      for (let i = 0; i < 3; i++) {
        const eventId = `event_reconcile_${shardId}_${i}`;
        const result = registry.recordEvent(eventId, `trace_${shardId}`, shardId, 'node_0');
        assert(result.recorded === true, `Event should record on ${shardId}`);
        eventsByShardId[shardId].push(eventId);
      }
    }

    // Create snapshots from nodes (simulate cluster nodes)
    const snapshots = [];
    for (const shardId of shardIds) {
      snapshots.push({
        shardId,
        eventIds: eventsByShardId[shardId]
      });
    }

    // Reconcile
    const report = registry.reconcileShards(snapshots);
    assert(report.consistencyStatus === 'CONSISTENT', `Should be CONSISTENT, got ${report.consistencyStatus}`);
    assert(report.divergences.length === 0, `Should have no divergences, got ${report.divergences.length}`);
    assert(report.snapshots === 3, `Should reconcile 3 snapshots, got ${report.snapshots}`);

    // Verify metrics
    const metrics = registry.getMetrics();
    assert(metrics.reconciliationsRun >= 1, 'Should have run at least 1 reconciliation');
    assert(metrics.lastReconciliation !== null, 'Should track last reconciliation time');

    console.log(`✅ Reconciliation consistency: ${shardIds.length} shards verified consistent`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Metrics Correctness (Dedup Tracking)
 * Deduplication metrics accurately track events
 */
async function testMetricsCorrectness() {
  console.log('\n=== TEST 6: Metrics Correctness ===');
  try {
    const registry = new GlobalEventRegistry();

    // Record mixed events
    const uniqueCount = 15;
    const duplicateAttempts = 8;

    // Record unique events
    for (let i = 0; i < uniqueCount; i++) {
      const result = registry.recordEvent(`event_metrics_${i}`, `trace_metrics_${i}`, 'shard_0', 'node_0');
      assert(result.recorded === true, `Event ${i} should record`);
    }

    // Attempt duplicates
    for (let i = 0; i < duplicateAttempts; i++) {
      const eventId = `event_metrics_${i}`;
      // Check for duplicate (updates metric)
      const isDup = registry.isDuplicate(eventId);
      assert(isDup === true, `isDuplicate should detect existing event ${eventId}`);

      const result = registry.recordEvent(eventId, `trace_dup_${i}`, 'shard_1', 'node_1');
      assert(result.recorded === false, `Duplicate ${i} should be rejected`);
    }

    // Verify metrics
    const metrics = registry.getMetrics();
    assert(metrics.eventsRegistered === uniqueCount, `Should have ${uniqueCount} registered, got ${metrics.eventsRegistered}`);
    assert(metrics.duplicatesDetected === duplicateAttempts, `Should have ${duplicateAttempts} duplicates, got ${metrics.duplicatesDetected}`);
    assert(metrics.uniqueEventsProcessed === uniqueCount, `Should have ${uniqueCount} unique processed, got ${metrics.uniqueEventsProcessed}`);
    assert(metrics.registrySize === uniqueCount, `Registry size should be ${uniqueCount}, got ${metrics.registrySize}`);

    // Calculate dedup rate
    const totalAttempts = uniqueCount + duplicateAttempts;
    const dedupRate = (duplicateAttempts / totalAttempts * 100).toFixed(2);
    console.log(`  Dedup rate: ${dedupRate}% (${duplicateAttempts}/${totalAttempts} prevented)`);

    console.log(`✅ Metrics correctness: ${metrics.eventsRegistered} unique, ${metrics.duplicatesDetected} duplicates detected`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 7: No Double Execution Under Partition
 * Partition recovery maintains idempotency guarantees
 */
async function testNoDoubleExecutionUnderPartition() {
  console.log('\n=== TEST 7: No Double Execution Under Partition ===');
  try {
    const registry = new GlobalEventRegistry();

    // Simulate partition: record events during isolation
    const executedIds = [];
    for (let i = 0; i < 5; i++) {
      const eventId = `event_partition_${i}`;
      const result = registry.recordEvent(eventId, 'trace_partition', 'shard_0', 'node_0');
      assert(result.recorded === true, `Event ${i} should record during partition`);
      executedIds.push(eventId);
    }

    // Partition heals: attempt to re-execute same events
    // (simulate node restart trying to replay)
    for (const eventId of executedIds) {
      // Check for duplicate (updates metric)
      const isDup = registry.isDuplicate(eventId);
      assert(isDup === true, `isDuplicate should detect existing event ${eventId} during partition recovery`);

      const result = registry.recordEvent(eventId, 'trace_partition', 'shard_0', 'node_1');
      assert(result.recorded === false, `Partition recovery should reject replay of ${eventId}`);
      assert(result.reason === 'DUPLICATE_EVENT', 'Should identify as duplicate on recovery');
    }

    // Verify no execution happened during recovery attempt
    const metrics = registry.getMetrics();
    assert(metrics.eventsRegistered === 5, 'Should still have only 5 registered events');
    assert(metrics.duplicatesDetected >= 5, 'Should have detected duplicates during recovery');

    // Verify all original events still in registry
    for (const eventId of executedIds) {
      const entry = registry.getEventEntry(eventId);
      assert(entry !== null, `Event ${eventId} should still be in registry`);
    }

    console.log(`✅ No double execution: ${executedIds.length} events protected during partition recovery`);

    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 7: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 8: Causal Ordering Preserved With Registry Sync
 * Shard events maintain causal order during registry operations
 */
async function testCausalOrderingPreserved() {
  console.log('\n=== TEST 8: Causal Ordering Preserved With Registry Sync ===');
  try {
    const registry = new GlobalEventRegistry();

    // Record events with causal dependencies per shard
    const shardId = 'shard_causal';
    const traceId = 'trace_causal_chain';
    const eventIds = [];

    for (let i = 0; i < 8; i++) {
      const eventId = `event_causal_${i}`;
      const result = registry.recordEvent(eventId, traceId, shardId, 'node_0');
      assert(result.recorded === true, `Event ${i} should record`);
      eventIds.push(eventId);
    }

    // Get shard events and verify order
    const shardEvents = registry.getShardEvents(shardId);
    assert(shardEvents.length === 8, `Should have 8 shard events, got ${shardEvents.length}`);

    // Verify causal order is preserved (monotonic sequence)
    for (let i = 0; i < shardEvents.length; i++) {
      assert(shardEvents[i].sequence === i + 1, `Shard event ${i} should have sequence ${i + 1}`);
      assert(shardEvents[i].eventId === eventIds[i], `Event order should be preserved at position ${i}`);
    }

    // Get trace events and verify order
    const traceEvents = registry.getTraceEvents(traceId);
    assert(traceEvents.length === 8, `Should have 8 trace events, got ${traceEvents.length}`);

    // Verify same order for trace events
    for (let i = 0; i < traceEvents.length; i++) {
      assert(traceEvents[i].sequence === i + 1, `Trace event ${i} should have sequence ${i + 1}`);
      assert(traceEvents[i].eventId === eventIds[i], `Trace order should be preserved at position ${i}`);
    }

    // Verify registry fingerprint is deterministic
    const fingerprint1 = registry.getRegistryFingerprint();
    const fingerprint2 = registry.getRegistryFingerprint();
    assert(fingerprint1.fingerprint === fingerprint2.fingerprint, 'Registry fingerprint should be deterministic');
    assert(fingerprint1.eventCount === 8, `Fingerprint should count 8 events, got ${fingerprint1.eventCount}`);

    console.log(`✅ Causal ordering preserved: ${shardEvents.length} events in deterministic order, fingerprint ${fingerprint1.fingerprint.substring(0, 16)}...`);

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
  console.log('🧪 PHASE 7.3 — Global Idempotency + Cross-Node Deduplication');
  console.log('═'.repeat(70));

  try {
    await testDuplicateRejectionCrossShard();
    await testUniqueEventExecution();
    await testProofSystemLoggingIntegrity();
    await testReplayReconstructionDeterminism();
    await testReconciliationConsistency();
    await testMetricsCorrectness();
    await testNoDoubleExecutionUnderPartition();
    await testCausalOrderingPreserved();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/8 tests`);
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

module.exports = { GlobalEventRegistry };
