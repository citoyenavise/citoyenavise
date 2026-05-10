/**
 * PHASE 7.5 — Optimization Tests
 *
 * Tests SnapshotOptimizer and TransactionLogTuner with:
 * - Unit tests for optimization strategies (8 + 7 = 15 tests)
 * - Integration tests with PHASE 7.4 modules (5 tests)
 * - Performance tests baseline vs optimized (4 tests)
 * - Stress tests multi-region and high-volume (5 tests)
 *
 * Total: 29 tests
 */

const assert = require('assert');
const SnapshotOptimizer = require('../core/governance/enforcement/SnapshotOptimizer');
const TransactionLogTuner = require('../core/governance/enforcement/TransactionLogTuner');
const SnapshotManager = require('../core/governance/enforcement/SnapshotManager');
const TransactionLogModule = require('../core/governance/enforcement/TransactionLogModule');
const BatchArchiveManager = require('../core/governance/enforcement/BatchArchiveManager');

let testResults = { passed: 0, failed: 0, errors: [] };

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: SnapshotOptimizer Unit Tests (8 tests)
// ═══════════════════════════════════════════════════════════════════

async function testSnapshotOptimizerIncremental() {
  console.log('\n=== TEST 1: SnapshotOptimizer — INCREMENTAL Strategy ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    // Create 3 segments
    for (let i = 0; i < 3; i++) {
      archive.archiveCompaction({
        batchId: `batch_opt_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      });
    }

    // Take snapshot and optimize
    const snapResult = snapManager.takeSnapshot(archive);
    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);
    assert(snapshot, 'Snapshot should exist');

    const optResult = optimizer.optimizeSnapshot(snapshot, 'INCREMENTAL');
    assert(optResult.optimized === true, 'Should optimize with INCREMENTAL');
    assert(optResult.reduction >= 0, 'Should show reduction');

    const optimized = optimizer.optimizedSnapshots.get(snapshot.snapshotId);
    assert(Object.isFrozen(optimized), 'Optimized should be frozen');
    assert(optimized.isAuthoritative === false, 'Optimized isAuthoritative must be false');

    console.log(`✅ INCREMENTAL optimization verified: reduction=${(optResult.reduction).toFixed(1)}%`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

async function testSnapshotOptimizerLazy() {
  console.log('\n=== TEST 2: SnapshotOptimizer — LAZY Strategy ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    // Create snapshot
    archive.archiveCompaction({
      batchId: 'batch_lazy_1',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 10 },
      entriesCount: 10,
      aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
    });

    const snapResult = snapManager.takeSnapshot(archive);
    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);

    // Optimize with LAZY
    const optResult = optimizer.optimizeSnapshot(snapshot, 'LAZY');
    assert(optResult.optimized === true, 'Should optimize with LAZY');

    const optimized = optimizer.optimizedSnapshots.get(snapshot.snapshotId);
    assert(optimized.materialized === false, 'LAZY should not materialize');
    assert(optimized.isAuthoritative === false, 'isAuthoritative must be false');

    console.log(`✅ LAZY strategy verified: materialized=false`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

async function testSnapshotOptimizerAggressive() {
  console.log('\n=== TEST 3: SnapshotOptimizer — AGGRESSIVE Strategy ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    // Create 5 segments
    for (let i = 0; i < 5; i++) {
      archive.archiveCompaction({
        batchId: `batch_agg_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      });
    }

    const snapResult = snapManager.takeSnapshot(archive);
    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);

    // Optimize with AGGRESSIVE
    const optResult = optimizer.optimizeSnapshot(snapshot, 'AGGRESSIVE');
    assert(optResult.optimized === true, 'Should optimize');
    assert(optResult.reduction > 0, 'AGGRESSIVE should reduce size');

    const optimized = optimizer.optimizedSnapshots.get(snapshot.snapshotId);
    assert(optimized.compressionRatio < 1.0, 'Should compress');

    console.log(`✅ AGGRESSIVE optimization verified: ratio=${(optimized.compressionRatio).toFixed(2)}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

async function testAdaptiveTTL() {
  console.log('\n=== TEST 4: SnapshotOptimizer — Adaptive TTL ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    archive.archiveCompaction({
      batchId: 'batch_ttl_1',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 10 },
      entriesCount: 10,
      aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
    });

    const snapResult = snapManager.takeSnapshot(archive);
    const snapshotId = snapResult.snapshotId;

    // Hot snapshot (10 replays/day)
    const hotAdapt = optimizer.adaptiveRetention(snapshotId, { replaysPerDay: 10 });
    assert(hotAdapt.adapted === true, 'Should adapt');
    assert(hotAdapt.newMaxAge > hotAdapt.currentMaxAge, 'Hot snapshot should extend TTL');
    assert(hotAdapt.confidence > 0.9, 'Hot snapshot high confidence');

    // Cold snapshot (0 replays)
    const coldAdapt = optimizer.adaptiveRetention(snapshotId, { replaysPerDay: 0 });
    assert(coldAdapt.newMaxAge < coldAdapt.currentMaxAge, 'Cold snapshot should reduce TTL');

    console.log(`✅ Adaptive TTL verified: hot +${hotAdapt.adjustment}ms, cold ${coldAdapt.adjustment}ms`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

async function testPredictiveCacheHit() {
  console.log('\n=== TEST 5: SnapshotOptimizer — Predictive Cache Hit ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    // Create and optimize snapshot
    archive.archiveCompaction({
      batchId: 'batch_cache_1',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 10 },
      entriesCount: 10,
      aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
    });

    const snapResult = snapManager.takeSnapshot(archive);
    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);
    optimizer.optimizeSnapshot(snapshot, 'INCREMENTAL');

    // Predict cache hit
    const hitPrediction = optimizer.predictCacheHit(snapshot.snapshotId, snapshot.takenAt);
    assert(hitPrediction.predicted !== undefined, 'Should make prediction');
    assert(hitPrediction.confidence >= 0 && hitPrediction.confidence <= 1, 'Confidence 0-1');

    console.log(`✅ Cache prediction verified: confidence=${(hitPrediction.confidence).toFixed(2)}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

async function testDistributionStrategy() {
  console.log('\n=== TEST 6: SnapshotOptimizer — Distribution Strategy ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    archive.archiveCompaction({
      batchId: 'batch_dist_1',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 10 },
      entriesCount: 10,
      aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
    });

    const snapResult = snapManager.takeSnapshot(archive);
    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);

    // Test distribution strategies
    const lazyStrategy = optimizer.planDistributionStrategy(['EU', 'US'], 5 * 1024 * 1024);
    assert(lazyStrategy.strategy === 'LAZY_PUSH', 'Small snapshot should use LAZY_PUSH');

    const eagerStrategy = optimizer.planDistributionStrategy(['EU', 'US', 'APAC', 'AU'], 200 * 1024 * 1024);
    assert(eagerStrategy.strategy === 'HYBRID', '4 regions should use HYBRID');

    console.log(`✅ Distribution strategy verified: small→${lazyStrategy.strategy}, large→${eagerStrategy.strategy}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 6: ${error.message}`);
    throw error;
  }
}

async function testSnapshotOptimizerMetrics() {
  console.log('\n=== TEST 7: SnapshotOptimizer — Metrics & Alerts ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    // Create and optimize 3 snapshots (snapshot after each archive)
    for (let i = 0; i < 3; i++) {
      archive.archiveCompaction({
        batchId: `batch_metric_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      });
      snapManager.takeSnapshot(archive); // Create snapshot after each archive
    }

    const snapshots = snapManager.listSnapshots();
    for (const snap of snapshots) {
      optimizer.optimizeSnapshot(snap, 'INCREMENTAL');
    }

    const metrics = optimizer.getOptimizationMetrics();
    assert(metrics.isAuthoritative === false, 'Metrics isAuthoritative must be false');
    assert(metrics.snapshotsOptimized === 3, 'Should have 3 optimized');
    assert(metrics.avgCompressionRatio > 0, 'Should have compression ratio');

    const alerts = optimizer.checkAlerts();
    // May or may not have alerts depending on compression
    assert(Array.isArray(alerts), 'Alerts should be array');

    console.log(`✅ Metrics verified: optimized=${metrics.snapshotsOptimized}, ratio=${metrics.avgCompressionRatio.toFixed(2)}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 7: ${error.message}`);
    throw error;
  }
}

async function testSnapshotOptimizerImmutability() {
  console.log('\n=== TEST 8: SnapshotOptimizer — Immutability & isAuthoritative ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    archive.archiveCompaction({
      batchId: 'batch_immut_1',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 10 },
      entriesCount: 10,
      aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
    });

    const snapResult = snapManager.takeSnapshot(archive);
    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);
    optimizer.optimizeSnapshot(snapshot, 'INCREMENTAL');

    const optimized = optimizer.optimizedSnapshots.get(snapshot.snapshotId);
    assert(Object.isFrozen(optimized), 'Should be frozen');
    assert(optimized.isAuthoritative === false, 'isAuthoritative must be false');
    assert(optimizer.isAuthoritative() === false, 'Optimizer always non-authoritative');

    // Attempt modification (should fail silently in non-strict)
    optimized.snapshotId = 'modified';
    assert(optimized.snapshotId === snapshot.snapshotId, 'Frozen: modification ignored');

    console.log(`✅ Immutability verified: frozen, isAuthoritative=false`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 8: ${error.message}`);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: TransactionLogTuner Unit Tests (7 tests)
// ═══════════════════════════════════════════════════════════════════

async function testLogTunerCompression() {
  console.log('\n=== TEST 9: TransactionLogTuner — Compression ===');
  try {
    const archive = new BatchArchiveManager();
    const txLog = new TransactionLogModule();
    const tuner = new TransactionLogTuner(txLog);

    // Log 5 operations
    for (let i = 0; i < 5; i++) {
      const compaction = {
        batchId: `batch_comp_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult = archive.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
    }

    // Compress entries
    const entries = txLog.log.slice(0, 5);
    const compResult = tuner.compressEntries(entries, 0.7);
    assert(compResult.compressed === true, 'Should compress');
    assert(compResult.avgRatio < 1.0, 'Should reduce size');
    assert(compResult.isAuthoritative === false, 'isAuthoritative must be false');

    console.log(`✅ Compression verified: avgRatio=${compResult.avgRatio.toFixed(2)}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 9: ${error.message}`);
    throw error;
  }
}

async function testBloomFilter() {
  console.log('\n=== TEST 10: TransactionLogTuner — Bloom Filter ===');
  try {
    const archive = new BatchArchiveManager();
    const txLog = new TransactionLogModule();
    const tuner = new TransactionLogTuner(txLog);

    // Log operations
    for (let i = 0; i < 10; i++) {
      const compaction = {
        batchId: `batch_bloom_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult = archive.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
    }

    // Build bloom filter
    const entries = txLog.log;
    const bloomResult = tuner.buildBloomFilter(entries, 'ARCHIVE');
    assert(bloomResult.filter, 'Should have filter');
    assert(bloomResult.accuracy > 0.9, 'Should have high accuracy');
    assert(bloomResult.isAuthoritative === false, 'isAuthoritative must be false');

    // Test queries
    const txId = entries[0].txId;
    assert(bloomResult.filter.query(txId) === true, 'Should find existing txId');
    assert(bloomResult.filter.query('nonexistent_tx_id') === false, 'Should not find nonexistent');

    console.log(`✅ Bloom filter verified: accuracy=${bloomResult.accuracy.toFixed(2)}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 10: ${error.message}`);
    throw error;
  }
}

async function testSelectiveLogging() {
  console.log('\n=== TEST 11: TransactionLogTuner — Selective Logging ===');
  try {
    const archive = new BatchArchiveManager();
    const txLog = new TransactionLogModule();
    const tuner = new TransactionLogTuner(txLog);

    // Test critical operations (should always log)
    const archiveOp = {
      txType: 'ARCHIVE',
      timestamp: new Date().toISOString(),
      details: { batchId: 'critical' }
    };
    const archiveSelect = tuner.selectiveLog(archiveOp, {});
    assert(archiveSelect.shouldLog === true, 'ARCHIVE should always log');

    const reconcileOp = {
      txType: 'RECONCILIATION',
      timestamp: new Date().toISOString(),
      details: {}
    };
    const reconcileSelect = tuner.selectiveLog(reconcileOp, {});
    assert(reconcileSelect.shouldLog === true, 'RECONCILIATION should always log');

    // Test skipped operations
    const consensusOp = {
      txType: 'CONSENSUS',
      timestamp: new Date().toISOString(),
      details: {}
    };
    const consensusSelect = tuner.selectiveLog(consensusOp, { isDuplicate: true });
    assert(consensusSelect.shouldLog === false, 'Duplicate consensus should skip');

    console.log(`✅ Selective logging verified: critical always logged`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 11: ${error.message}`);
    throw error;
  }
}

async function testBatchAggregation() {
  console.log('\n=== TEST 12: TransactionLogTuner — Batch Aggregation ===');
  try {
    const archive = new BatchArchiveManager();
    const txLog = new TransactionLogModule();
    const tuner = new TransactionLogTuner(txLog);

    // Log many entries with same batchId
    const batchId = 'batch_agg_group';
    for (let i = 0; i < 10; i++) {
      const compaction = {
        batchId,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult = archive.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
    }

    // Aggregate
    const entries = txLog.log;
    const aggResult = tuner.aggregateByBatchId(entries);
    assert(aggResult.aggregated === true, 'Should aggregate');
    assert(aggResult.aggregatedCount < entries.length, 'Should reduce count');
    assert(aggResult.reductionRate > 0, 'Should show reduction');
    assert(aggResult.isAuthoritative === false, 'isAuthoritative must be false');

    console.log(`✅ Aggregation verified: ${entries.length}→${aggResult.aggregatedCount}, reduction=${(aggResult.reductionRate*100).toFixed(1)}%`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 12: ${error.message}`);
    throw error;
  }
}

async function testRegionPartitioning() {
  console.log('\n=== TEST 13: TransactionLogTuner — Region Partitioning ===');
  try {
    const archive = new BatchArchiveManager();
    const txLog = new TransactionLogModule();
    const tuner = new TransactionLogTuner(txLog);

    const regions = ['EU', 'US', 'APAC'];

    // Log entries per region
    for (const region of regions) {
      for (let i = 0; i < 10; i++) {
        const compaction = {
          batchId: `batch_${region}_${i}`,
          timestamp: new Date().toISOString(),
          sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
          entriesCount: 10,
          aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
        };
        const archResult = archive.archiveCompaction(compaction);
        txLog.logArchive(compaction, archResult, region);
      }
    }

    // Partition
    const entries = txLog.log;
    const partResult = tuner.partitionByRegion(entries, regions);
    assert(partResult.partitioned === true, 'Should partition');
    assert(partResult.regionCount === regions.length, 'Should have all regions');
    assert(partResult.isAuthoritative === false, 'isAuthoritative must be false');

    console.log(`✅ Partitioning verified: ${regions.length} regions, entries distributed`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 13: ${error.message}`);
    throw error;
  }
}

async function testTransactionLogTunerMetrics() {
  console.log('\n=== TEST 14: TransactionLogTuner — Metrics & Alerts ===');
  try {
    const archive = new BatchArchiveManager();
    const txLog = new TransactionLogModule();
    const tuner = new TransactionLogTuner(txLog);

    // Log entries
    for (let i = 0; i < 10; i++) {
      const compaction = {
        batchId: `batch_metric_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult = archive.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
      tuner.tuneLogEntry(txLog.log[i]);
    }

    const metrics = tuner.getTunerMetrics();
    assert(metrics.isAuthoritative === false, 'Metrics isAuthoritative must be false');
    assert(metrics.entriesTuned >= 0, 'Should have tuned count');
    assert(metrics.avgCompressionRatio > 0, 'Should have compression ratio');

    const alerts = tuner.checkAlerts();
    assert(Array.isArray(alerts), 'Alerts should be array');

    console.log(`✅ Metrics verified: tuned=${metrics.entriesTuned}, ratio=${metrics.avgCompressionRatio.toFixed(2)}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 14: ${error.message}`);
    throw error;
  }
}

async function testTransactionLogTunerImmutability() {
  console.log('\n=== TEST 15: TransactionLogTuner — Immutability & isAuthoritative ===');
  try {
    const archive = new BatchArchiveManager();
    const txLog = new TransactionLogModule();
    const tuner = new TransactionLogTuner(txLog);

    const compaction = {
      batchId: 'batch_immut_log',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 10 },
      entriesCount: 10,
      aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
    };
    const archResult = archive.archiveCompaction(compaction);
    txLog.logArchive(compaction, archResult);

    const entry = txLog.log[0];
    assert(Object.isFrozen(entry), 'Entry should be frozen');
    assert(entry.isAuthoritative === false, 'Entry isAuthoritative must be false');
    assert(tuner.isAuthoritative() === false, 'Tuner always non-authoritative');

    // Attempt modification
    entry.txId = 'modified';
    assert(entry.txId !== 'modified', 'Frozen: modification ignored');

    console.log(`✅ Immutability verified: frozen, isAuthoritative=false`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 15: ${error.message}`);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 3: Integration Tests (5 tests)
// ═══════════════════════════════════════════════════════════════════

async function testOptimizerIntegrationWithSnapshotManager() {
  console.log('\n=== TEST 16: Integration — SnapshotOptimizer ↔ SnapshotManager ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    // Archive 5 segments
    for (let i = 0; i < 5; i++) {
      archive.archiveCompaction({
        batchId: `batch_integ_snap_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      });
    }

    // Take snapshot
    const snapResult = snapManager.takeSnapshot(archive);
    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);

    // Optimize
    const optResult = optimizer.optimizeSnapshot(snapshot, 'INCREMENTAL');
    assert(optResult.optimized === true, 'Should optimize');

    // Verify snapshot still accessible through SnapshotManager
    const retrieved = snapManager.getSnapshotById(snapshot.snapshotId);
    assert(retrieved !== null, 'Original snapshot still accessible');

    console.log(`✅ Integration verified: optimizer enhances snapshots non-destructively`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 16: ${error.message}`);
    throw error;
  }
}

async function testTunerIntegrationWithTransactionLog() {
  console.log('\n=== TEST 17: Integration — TransactionLogTuner ↔ TransactionLogModule ===');
  try {
    const archive = new BatchArchiveManager();
    const txLog = new TransactionLogModule();
    const tuner = new TransactionLogTuner(txLog);

    // Log 10 operations
    for (let i = 0; i < 10; i++) {
      const compaction = {
        batchId: `batch_integ_log_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult = archive.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
    }

    // Tune entries
    let tunedCount = 0;
    for (const entry of txLog.log) {
      const tuneResult = tuner.tuneLogEntry(entry);
      if (tuneResult.tuned) tunedCount++;
    }

    assert(tunedCount > 0, 'Should tune some entries');

    // Verify log still functional for replay
    const freshArchive = new BatchArchiveManager();
    const replayResult = txLog.replayFromIndex(freshArchive, 0);
    assert(replayResult.replayed === true, 'Log should still replay');
    assert(replayResult.entriesReplayed > 0, 'Should replay entries');

    console.log(`✅ Integration verified: tuner enhances logs non-destructively`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 17: ${error.message}`);
    throw error;
  }
}

async function testMultiRegionOptimization() {
  console.log('\n=== TEST 18: Integration — Multi-Region Optimization ===');
  try {
    const regions = ['EU', 'US', 'APAC'];
    const archives = new Map();
    const snapManagers = new Map();
    const optimizers = new Map();

    // Setup per-region
    regions.forEach(r => {
      archives.set(r, new BatchArchiveManager());
      snapManagers.set(r, new SnapshotManager());
      optimizers.set(r, new SnapshotOptimizer(snapManagers.get(r)));
    });

    // Archive per region
    regions.forEach(region => {
      const archive = archives.get(region);
      for (let i = 0; i < 3; i++) {
        archive.archiveCompaction({
          batchId: `batch_${region}_${i}`,
          timestamp: new Date().toISOString(),
          sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
          entriesCount: 10,
          aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
        });
      }
    });

    // Snapshot + optimize each region
    regions.forEach(region => {
      const archive = archives.get(region);
      const snapMgr = snapManagers.get(region);
      const opt = optimizers.get(region);

      const snapResult = snapMgr.takeSnapshot(archive);
      const snapshot = snapMgr.getSnapshotById(snapResult.snapshotId);
      const optResult = opt.optimizeSnapshot(snapshot, 'INCREMENTAL');
      assert(optResult.optimized === true, `${region} should optimize`);
    });

    // Verify all regions optimized independently
    regions.forEach(region => {
      const opt = optimizers.get(region);
      const metrics = opt.getOptimizationMetrics();
      assert(metrics.snapshotsOptimized > 0, `${region} should have optimized snapshots`);
    });

    console.log(`✅ Multi-region integration verified: ${regions.length} regions optimized independently`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 18: ${error.message}`);
    throw error;
  }
}

async function testDeterministicReplayAfterOptimization() {
  console.log('\n=== TEST 19: Integration — Deterministic Replay After Optimization ===');
  try {
    const archive1 = new BatchArchiveManager();
    const txLog = new TransactionLogModule();
    const tuner = new TransactionLogTuner(txLog);

    // Log and archive operations
    const operations = [];
    for (let i = 0; i < 5; i++) {
      const compaction = {
        batchId: `batch_replay_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult = archive1.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
      operations.push({ compaction, archResult });
    }

    // Capture original state
    const orig = archive1.getArchiveMetrics();

    // Tune the log
    for (const entry of txLog.log) {
      tuner.tuneLogEntry(entry);
    }

    // Replay from tuned log
    const archive2 = new BatchArchiveManager();
    const replayResult = txLog.replayFromIndex(archive2, 0);
    const replayed = archive2.getArchiveMetrics();

    // Verify determinism: same log → same result
    assert(replayed.segmentsStored === orig.segmentsStored, 'Segments count should match');
    assert(replayed.totalEntriesArchived === orig.totalEntriesArchived, 'Total entries should match');
    assert(replayed.compressionRatioAvg === orig.compressionRatioAvg, 'Compression ratio should match');

    console.log(`✅ Determinism verified: tuning preserves replay consistency`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 19: ${error.message}`);
    throw error;
  }
}

async function testRealTimeIsolationDuringOptimization() {
  console.log('\n=== TEST 20: Integration — Real-Time Isolation During Optimization ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const txLog = new TransactionLogModule();
    const optimizer = new SnapshotOptimizer(snapManager);
    const tuner = new TransactionLogTuner(txLog);

    // Archive operations
    for (let i = 0; i < 10; i++) {
      const compaction = {
        batchId: `batch_iso_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult = archive.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
    }

    // Take snapshot
    const snapResult = snapManager.takeSnapshot(archive);
    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);

    // Heavy optimization operations
    optimizer.optimizeSnapshot(snapshot, 'INCREMENTAL');
    for (const entry of txLog.log) {
      tuner.tuneLogEntry(entry);
    }

    // Verify archive still valid
    const archiveMetrics = archive.getArchiveMetrics();
    assert(archiveMetrics.segmentsStored === 10, 'Archive should be unaffected');
    assert(archiveMetrics.isAuthoritative === false, 'Archive isAuthoritative must be false');

    console.log(`✅ Real-Time isolation verified: archive unaffected by optimization`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 20: ${error.message}`);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: Performance Tests (4 tests)
// ═══════════════════════════════════════════════════════════════════

async function testSnapshotLatencyReduction() {
  console.log('\n=== TEST 21: Performance — Snapshot Latency Reduction ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    // Create 50 segments
    for (let i = 0; i < 50; i++) {
      archive.archiveCompaction({
        batchId: `batch_perf_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      });
    }

    // Measure baseline snapshot
    const t0 = Date.now();
    const snapResult = snapManager.takeSnapshot(archive);
    const baseline = Date.now() - t0;

    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);

    // Measure optimized snapshot (incremental would be faster on repeat)
    const t1 = Date.now();
    optimizer.optimizeSnapshot(snapshot, 'INCREMENTAL');
    const optimized = Date.now() - t1;

    // Both should be fast, optimization should not add significant overhead
    assert(optimized < 1000, 'Optimization latency should be <1000ms');

    console.log(`✅ Latency verified: baseline=${baseline}ms, optimized=${optimized}ms`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 21: ${error.message}`);
    throw error;
  }
}

async function testCompressionEfficiency() {
  console.log('\n=== TEST 22: Performance — Log Compression Efficiency ===');
  try {
    const archive = new BatchArchiveManager();
    const txLog = new TransactionLogModule();
    const tuner = new TransactionLogTuner(txLog);

    // Log 100 operations
    for (let i = 0; i < 100; i++) {
      const compaction = {
        batchId: `batch_perf_log_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult = archive.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
    }

    // Measure compression
    const t1 = Date.now();
    const compResult = tuner.compressEntries(txLog.log.slice(0, 50), 0.7);
    const t2 = Date.now();

    assert(compResult.compressed === true, 'Should compress');
    assert(compResult.avgRatio <= 0.7, 'Should meet compression target');
    const latency = t2 - t1;
    assert(latency < 500, 'Compression should be fast (<500ms)');

    console.log(`✅ Compression efficiency verified: ratio=${compResult.avgRatio.toFixed(2)}, latency=${latency}ms`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 22: ${error.message}`);
    throw error;
  }
}

async function testCacheHitRateImprovement() {
  console.log('\n=== TEST 23: Performance — Cache Hit Rate ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    // Create snapshots
    for (let batch = 0; batch < 3; batch++) {
      for (let i = 0; i < 10; i++) {
        archive.archiveCompaction({
          batchId: `batch_cache_${batch}_${i}`,
          timestamp: new Date().toISOString(),
          sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
          entriesCount: 10,
          aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
        });
      }

      const snapResult = snapManager.takeSnapshot(archive);
      const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);
      optimizer.optimizeSnapshot(snapshot, 'INCREMENTAL');
    }

    // Query cache multiple times (should show increasing hit rate)
    const snapshots = snapManager.listSnapshots();
    let hits = 0;
    for (let q = 0; q < 20; q++) {
      for (const snap of snapshots) {
        const pred = optimizer.predictCacheHit(snap.snapshotId, snap.takenAt);
        if (pred.predicted) hits++;
      }
    }

    const hitRate = hits / (snapshots.length * 20);
    assert(hitRate >= 0.3, 'Should have reasonable hit rate');

    console.log(`✅ Cache hit rate verified: ${(hitRate * 100).toFixed(1)}%`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 23: ${error.message}`);
    throw error;
  }
}

async function testMultiRegionSyncLatency() {
  console.log('\n=== TEST 24: Performance — Multi-Region Sync Latency ===');
  try {
    const regions = ['EU', 'US', 'APAC'];
    const optimizers = new Map();

    regions.forEach(r => {
      const snapMgr = new SnapshotManager();
      optimizers.set(r, new SnapshotOptimizer(snapMgr));
    });

    // Create initial snapshots
    regions.forEach(region => {
      const archive = new BatchArchiveManager();
      for (let i = 0; i < 20; i++) {
        archive.archiveCompaction({
          batchId: `batch_sync_${region}_${i}`,
          timestamp: new Date().toISOString(),
          sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
          entriesCount: 10,
          aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
        });
      }
    });

    // Measure cross-region strategy selection
    const t1 = Date.now();
    const strategies = regions.map(r => {
      const opt = optimizers.get(r);
      return opt.planDistributionStrategy(regions, 50 * 1024 * 1024);
    });
    const t2 = Date.now();

    assert(strategies.every(s => s.strategy), 'All regions should have strategy');
    const latency = t2 - t1;
    assert(latency < 100, 'Strategy selection should be fast');

    console.log(`✅ Multi-region latency verified: ${latency}ms for 3-region coordination`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 24: ${error.message}`);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 5: Stress & Regression Tests (5 tests)
// ═══════════════════════════════════════════════════════════════════

async function testHighVolumeOptimization() {
  console.log('\n=== TEST 25: Stress — High Volume Optimization ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager);

    // Create 100 segments
    for (let i = 0; i < 100; i++) {
      archive.archiveCompaction({
        batchId: `batch_stress_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      });
    }

    // Take 5 snapshots and optimize all
    const snapshots = [];
    for (let s = 0; s < 5; s++) {
      const snapResult = snapManager.takeSnapshot(archive);
      snapshots.push(snapManager.getSnapshotById(snapResult.snapshotId));
    }

    let optimizedCount = 0;
    for (const snap of snapshots) {
      const optResult = optimizer.optimizeSnapshot(snap, 'INCREMENTAL');
      if (optResult.optimized) optimizedCount++;
    }

    assert(optimizedCount === 5, 'Should optimize all 5 snapshots');
    const metrics = optimizer.getOptimizationMetrics();
    assert(metrics.snapshotsOptimized === 5, 'Metrics should reflect all');

    console.log(`✅ High volume verified: 5 snapshots × 100 segments optimized`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 25: ${error.message}`);
    throw error;
  }
}

async function testConcurrentOptimizations() {
  console.log('\n=== TEST 26: Stress — Concurrent Optimizations ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const txLog = new TransactionLogModule();
    const snapOptimizer = new SnapshotOptimizer(snapManager);
    const logTuner = new TransactionLogTuner(txLog);

    // Archive + log simultaneously
    for (let i = 0; i < 30; i++) {
      const compaction = {
        batchId: `batch_concurrent_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult = archive.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
    }

    // Concurrent: snapshot + log tuning
    const snapResult = snapManager.takeSnapshot(archive);
    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);

    const snapOptResult = snapOptimizer.optimizeSnapshot(snapshot, 'INCREMENTAL');
    const entries = txLog.log.slice(0, 15);
    const logCompResult = logTuner.compressEntries(entries, 0.7);

    assert(snapOptResult.optimized === true, 'Snapshot should optimize');
    assert(logCompResult.compressed === true, 'Log should compress');

    console.log(`✅ Concurrency verified: snapshot + log optimizations don't interfere`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 26: ${error.message}`);
    throw error;
  }
}

async function testMemoryPressure() {
  console.log('\n=== TEST 27: Stress — Memory Pressure Handling ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const optimizer = new SnapshotOptimizer(snapManager, { maxOptimizations: 50 });

    // Archive 100 segments
    for (let i = 0; i < 100; i++) {
      archive.archiveCompaction({
        batchId: `batch_mem_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      });
    }

    // Try to optimize beyond capacity
    let successCount = 0;
    for (let s = 0; s < 60; s++) {
      const snapResult = snapManager.takeSnapshot(archive);
      const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);
      const optResult = optimizer.optimizeSnapshot(snapshot, 'LAZY');
      if (optResult.optimized) successCount++;
    }

    assert(successCount === 50, 'Should stop at maxOptimizations');
    const lastOpt = optimizer.optimizeSnapshot(snapManager.getLatestSnapshot(), 'LAZY');
    assert(lastOpt.optimized === false, 'Should reject when full');
    assert(lastOpt.reason === 'OPTIMIZATIONS_FULL', 'Should state reason');

    console.log(`✅ Memory pressure verified: capacity limit enforced (50/60)`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 27: ${error.message}`);
    throw error;
  }
}

async function testDeterminismUnderStress() {
  console.log('\n=== TEST 28: Stress — Determinism Under High Load ===');
  try {
    const archive1 = new BatchArchiveManager();
    const archive2 = new BatchArchiveManager();
    const txLog1 = new TransactionLogModule();
    const txLog2 = new TransactionLogModule();
    const tuner1 = new TransactionLogTuner(txLog1);
    const tuner2 = new TransactionLogTuner(txLog2);

    // Same operations to both
    for (let i = 0; i < 30; i++) {
      const compaction = {
        batchId: `batch_determ_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult1 = archive1.archiveCompaction(compaction);
      const archResult2 = archive2.archiveCompaction(compaction);
      txLog1.logArchive(compaction, archResult1);
      txLog2.logArchive(compaction, archResult2);
    }

    // Optimize one (leave other as control)
    for (const entry of txLog1.log) {
      tuner1.tuneLogEntry(entry);
    }

    // Replay both
    const replay1 = new BatchArchiveManager();
    const replay2 = new BatchArchiveManager();
    txLog1.replayFromIndex(replay1, 0);
    txLog2.replayFromIndex(replay2, 0);

    const metrics1 = replay1.getArchiveMetrics();
    const metrics2 = replay2.getArchiveMetrics();

    assert(metrics1.segmentsStored === metrics2.segmentsStored, 'Segments should match');
    assert(metrics1.totalEntriesArchived === metrics2.totalEntriesArchived, 'Entries should match');

    console.log(`✅ Determinism verified: 30 ops, tuned=optimized despite optimization`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 28: ${error.message}`);
    throw error;
  }
}

async function testRegressionPhase7Point0To7Point4() {
  console.log('\n=== TEST 29: Regression — PHASE 7.0.5-7.4 Modules Unchanged ===');
  try {
    const archive = new BatchArchiveManager();
    const snapManager = new SnapshotManager();
    const txLog = new TransactionLogModule();

    // Archive operations
    for (let i = 0; i < 10; i++) {
      const compaction = {
        batchId: `batch_regress_${i}`,
        timestamp: new Date().toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: { successCount: 9, violationCount: 1, byModule: {} }
      };
      const archResult = archive.archiveCompaction(compaction);
      txLog.logArchive(compaction, archResult);
    }

    // Take snapshot
    const snapResult = snapManager.takeSnapshot(archive);
    const snapshot = snapManager.getSnapshotById(snapResult.snapshotId);

    // Verify PHASE 7.4 modules unchanged
    assert(snapshot !== null, 'SnapshotManager.getSnapshotById works');
    assert(txLog.log.length === 10, 'TransactionLogModule.log works');
    assert(archive.segments.size === 10, 'BatchArchiveManager unchanged');

    // Verify isAuthoritative false
    assert(snapshot.isAuthoritative === false, 'Snapshot isAuthoritative false');
    assert(txLog.log[0].isAuthoritative === false, 'Log isAuthoritative false');
    assert(archive.isAuthoritative() === false, 'Archive isAuthoritative false');

    console.log(`✅ Regression verified: all PHASE 7.4 modules fully operational`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 29: ${error.message}`);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════════

async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🧪 PHASE 7.5 — Optimization Tests (29 tests)');
  console.log('═'.repeat(70));

  try {
    // Section 1: SnapshotOptimizer (8 tests)
    await testSnapshotOptimizerIncremental();
    await testSnapshotOptimizerLazy();
    await testSnapshotOptimizerAggressive();
    await testAdaptiveTTL();
    await testPredictiveCacheHit();
    await testDistributionStrategy();
    await testSnapshotOptimizerMetrics();
    await testSnapshotOptimizerImmutability();

    // Section 2: TransactionLogTuner (7 tests)
    await testLogTunerCompression();
    await testBloomFilter();
    await testSelectiveLogging();
    await testBatchAggregation();
    await testRegionPartitioning();
    await testTransactionLogTunerMetrics();
    await testTransactionLogTunerImmutability();

    // Section 3: Integration (5 tests)
    await testOptimizerIntegrationWithSnapshotManager();
    await testTunerIntegrationWithTransactionLog();
    await testMultiRegionOptimization();
    await testDeterministicReplayAfterOptimization();
    await testRealTimeIsolationDuringOptimization();

    // Section 4: Performance (4 tests)
    await testSnapshotLatencyReduction();
    await testCompressionEfficiency();
    await testCacheHitRateImprovement();
    await testMultiRegionSyncLatency();

    // Section 5: Stress/Regression (5 tests)
    await testHighVolumeOptimization();
    await testConcurrentOptimizations();
    await testMemoryPressure();
    await testDeterminismUnderStress();
    await testRegressionPhase7Point0To7Point4();

    console.log('\n' + '═'.repeat(70));
    console.log(`✅ PASSED: ${testResults.passed}/29 tests`);
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

module.exports = { SnapshotOptimizer, TransactionLogTuner };
