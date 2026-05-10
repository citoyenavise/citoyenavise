/**
 * PHASE 7.4 — Persistence Layer & Durable Global Archive
 *
 * Tests SnapshotManager and TransactionLogModule with:
 * - Periodic snapshot capture and restoration
 * - Append-only transaction logging
 * - Deterministic recovery from snapshots + logs
 * - Real-time isolation guarantees
 */

const assert = require('assert');
const SnapshotManager = require('../core/governance/enforcement/SnapshotManager');
const TransactionLogModule = require('../core/governance/enforcement/TransactionLogModule');
const BatchArchiveManager = require('../core/governance/enforcement/BatchArchiveManager');
const EnforcementProofSystem = require('../core/governance/enforcement/EnforcementProofSystem');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Snapshot Taking and Retrieval
 */
async function testSnapshotTakingAndRetrieval() {
  console.log('\n=== TEST 1: Snapshot Taking and Retrieval ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();

    // Archive 3 segments
    const archiveIds = [];
    for (let i = 0; i < 3; i++) {
      const result = archive.archiveCompaction({
        batchId: `batch_snap_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: {
          successCount: 9,
          violationCount: 1,
          byModule: {}
        }
      });
      archiveIds.push(result.segmentId);
    }

    // Take snapshot
    const snapResult = snapManager.takeSnapshot(archive);
    assert(snapResult.taken === true, 'Should take snapshot');
    const snapshotId = snapResult.snapshotId;
    assert(snapResult.segmentsCaptured === 3, 'Should capture 3 segments');

    // Verify snapshot exists
    const snapshot = snapManager.getSnapshotById(snapshotId);
    assert(snapshot !== null, 'Snapshot should exist');
    assert(snapshot.archiveSize === 3, 'Snapshot should record 3 segments');
    assert(Object.isFrozen(snapshot), 'Snapshot should be frozen');

    // Verify latest snapshot
    const latest = snapManager.getLatestSnapshot();
    assert(latest.snapshotId === snapshotId, 'Latest snapshot should match');

    // Verify isAuthoritative
    assert(snapshot.isAuthoritative === false, 'Snapshot isAuthoritative must be false');

    console.log(`✅ Snapshot taking verified: ${snapshotId}, captured 3 segments`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Transaction Log Append-Only
 */
async function testTransactionLogAppendOnly() {
  console.log('\n=== TEST 2: Transaction Log Append-Only ===');
  try {
    const archive = new BatchArchiveManager();
    const txLog = new TransactionLogModule();

    // Archive 5 operations
    const loggedIds = [];
    for (let i = 0; i < 5; i++) {
      const compactionInput = {
        batchId: `batch_log_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: {
          successCount: 9,
          violationCount: 1,
          byModule: {}
        }
      };
      const archiveResult = archive.archiveCompaction(compactionInput);
      const logResult = txLog.logArchive(compactionInput, archiveResult);
      assert(logResult.logged === true, `Should log archive ${i}`);
      loggedIds.push(logResult.txId);
    }

    // Verify log size
    assert(txLog.log.length === 5, 'Log should have 5 entries');
    assert(txLog.logMetrics.totalEntries === 5, 'Metrics should show 5 entries');
    assert(txLog.logMetrics.archiveEntries === 5, 'Metrics should show 5 archive entries');

    // Verify all entries are frozen
    for (const entry of txLog.log) {
      assert(Object.isFrozen(entry), 'Entry should be frozen');
      assert(entry.isAuthoritative === false, 'Entry isAuthoritative must be false');
    }

    // Verify immutability (attempt to modify)
    const firstEntry = txLog.log[0];
    firstEntry.details.batchId = 'modified'; // Attempt modification
    assert(firstEntry.details.batchId === 'batch_log_0', 'Frozen object should not be modified');

    console.log(`✅ Transaction log append-only verified: 5 entries logged, all frozen`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Recovery from Snapshot
 */
async function testRecoveryFromSnapshot() {
  console.log('\n=== TEST 3: Recovery from Snapshot ===');
  try {
    const archive1 = new BatchArchiveManager();
    const snapManager = new SnapshotManager();

    // Archive 4 segments
    const archiveData = [];
    for (let i = 0; i < 4; i++) {
      const result = archive1.archiveCompaction({
        batchId: `batch_rec_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: {
          successCount: 8 + i,
          violationCount: 2 - i,
          byModule: { Mod: { success: 8 + i, violation: 2 - i } }
        }
      });
      archiveData.push(result);
    }

    // Take snapshot
    const snapResult = snapManager.takeSnapshot(archive1);
    const snapshotId = snapResult.snapshotId;
    assert(snapResult.segmentsCaptured === 4, 'Should capture 4 segments');

    // Create fresh archive and restore from snapshot
    const archive2 = new BatchArchiveManager();
    assert(archive2.segments.size === 0, 'Fresh archive should be empty');

    const restoreResult = snapManager.restoreFromSnapshot(snapshotId, archive2);
    assert(restoreResult.restored === true, 'Should restore successfully');
    assert(restoreResult.segmentsRestored === 4, 'Should restore 4 segments');

    // Verify restored archive matches original
    assert(archive2.segments.size === 4, 'Restored archive should have 4 segments');
    const originalSegments = archive1.getSegmentsByTimeRange(0, Date.now());
    const restoredSegments = archive2.getSegmentsByTimeRange(0, Date.now());
    assert(originalSegments.length === restoredSegments.length, 'Segment counts should match');

    // Verify batches match by batchId
    const originalBatchIds = new Set(originalSegments.map(s => s.batchId));
    const restoredBatchIds = new Set(restoredSegments.map(s => s.batchId));
    for (const batchId of originalBatchIds) {
      assert(restoredBatchIds.has(batchId), `Restored archive should have ${batchId}`);
    }

    console.log(`✅ Recovery from snapshot verified: 4 segments restored successfully`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Log Replay Reconstruction
 */
async function testLogReplayReconstruction() {
  console.log('\n=== TEST 4: Log Replay Reconstruction ===');
  try {
    const archive1 = new BatchArchiveManager();
    const txLog = new TransactionLogModule();

    // Log 3 archive operations
    const compactions = [
      {
        batchId: 'batch_rep_0',
        timestamp: new Date().toISOString(),
        sequenceRange: { start: 1, end: 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      },
      {
        batchId: 'batch_rep_1',
        timestamp: new Date().toISOString(),
        sequenceRange: { start: 11, end: 20 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 8, violationCount: 2, byModule: {} }
      },
      {
        batchId: 'batch_rep_2',
        timestamp: new Date().toISOString(),
        sequenceRange: { start: 21, end: 30 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 7, violationCount: 3, byModule: {} }
      }
    ];

    for (const compaction of compactions) {
      const archResult = archive1.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
    }

    assert(txLog.log.length === 3, 'Log should have 3 entries');

    // Create fresh archive and replay from log
    const archive2 = new BatchArchiveManager();
    const replayResult = txLog.replayFromIndex(archive2, 0);
    assert(replayResult.replayed === true, 'Should replay successfully');
    assert(replayResult.entriesReplayed === 3, 'Should replay 3 entries');

    // Verify reconstructed archive matches original
    assert(archive2.segments.size === 3, 'Replayed archive should have 3 segments');
    const originalSegments = archive1.getSegmentsByTimeRange(0, Date.now());
    const replayedSegments = archive2.getSegmentsByTimeRange(0, Date.now());
    assert(originalSegments.length === replayedSegments.length, 'Segment counts should match');

    // Verify by batchId
    const originalBatchIds = new Set(originalSegments.map(s => s.batchId));
    const replayedBatchIds = new Set(replayedSegments.map(s => s.batchId));
    for (const batchId of originalBatchIds) {
      assert(replayedBatchIds.has(batchId), `Replayed archive should have ${batchId}`);
    }

    console.log(`✅ Log replay reconstruction verified: 3 segments replayed from log`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Snapshot Eviction
 */
async function testSnapshotEviction() {
  console.log('\n=== TEST 5: Snapshot Eviction ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager({ maxSnapshotAgeMs: 100 }); // 100ms for testing

    // Take first snapshot (old)
    const snap1 = snapManager.takeSnapshot(archive);
    const snap1Id = snap1.snapshotId;

    // Wait a bit, then take second snapshot (recent)
    await new Promise(resolve => setTimeout(resolve, 150));
    const snap2 = snapManager.takeSnapshot(archive);
    const snap2Id = snap2.snapshotId;

    // Verify both exist
    assert(snapManager.snapshots.size === 2, 'Should have 2 snapshots');

    // Evict old snapshots
    const evictResult = snapManager.evictOldSnapshots();
    assert(evictResult.evicted === 1, 'Should evict 1 snapshot');
    assert(evictResult.retained === 1, 'Should retain 1 snapshot');

    // Verify old snapshot is gone, recent remains
    assert(snapManager.getSnapshotById(snap1Id) === null, 'Old snapshot should be evicted');
    assert(snapManager.getSnapshotById(snap2Id) !== null, 'Recent snapshot should remain');

    console.log(`✅ Snapshot eviction verified: old snapshot evicted, recent retained`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Real-Time Isolation
 */
async function testRealTimeIsolation() {
  console.log('\n=== TEST 6: Real-Time Isolation ===');
  try {
    const proofSystem = new EnforcementProofSystem();
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const txLog = new TransactionLogModule();

    // Capture real-time proofs
    for (let i = 0; i < 10; i++) {
      proofSystem.captureDecision({
        module: 'PersistenceTestModule',
        action: 'persist',
        ruleEvaluated: 'isolation_rule',
        input: { i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
    }

    // Verify before persistence ops
    const verifyBefore = proofSystem.verify();
    assert(verifyBefore.valid === true, 'Real-time chain should be valid');
    const chainLengthBefore = verifyBefore.entriesVerified;

    // === PHASE 7.4 OPERATIONS ===

    // Archive + log
    const compaction = {
      batchId: 'batch_iso',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 10 },
      entriesCount: 10,
      aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
    };
    const archiveResult = archive.archiveCompaction(compaction);
    txLog.logArchive(compaction, archiveResult);

    // Snapshot
    snapManager.takeSnapshot(archive);

    // Replay from log
    const freshArchive = new BatchArchiveManager();
    txLog.replayFromIndex(freshArchive, 0);

    // === END PHASE 7.4 OPS ===

    // Verify after persistence ops
    const verifyAfter = proofSystem.verify();
    assert(verifyAfter.valid === true, 'Real-time chain should still be valid');
    assert(verifyAfter.entriesVerified === chainLengthBefore,
      `Chain length should not change: before=${chainLengthBefore}, after=${verifyAfter.entriesVerified}`);

    console.log(`✅ Real-time isolation verified: chainLength=${chainLengthBefore} stable`);
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
  console.log('🧪 PHASE 7.4 — Persistence Layer & Durable Global Archive');
  console.log('═'.repeat(70));

  try {
    await testSnapshotTakingAndRetrieval();
    await testTransactionLogAppendOnly();
    await testRecoveryFromSnapshot();
    await testLogReplayReconstruction();
    await testSnapshotEviction();
    await testRealTimeIsolation();

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

module.exports = { SnapshotManager, TransactionLogModule };
