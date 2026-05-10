/**
 * PHASE 7.3 — Global Archive Consistency & Cross-Region Replay Verification
 *
 * Tests CrossRegionArchiveSyncModule and ReplayProofVerificationBridge with:
 * - Async quorum consensus (PENDING → QUORUM_VALIDATED)
 * - Cross-region segment propagation
 * - Archive divergence detection
 * - Deterministic reconciliation
 * - Timestamp-based state reconstruction
 * - Real-time isolation guarantees
 */

const assert = require('assert');
const CrossRegionArchiveSyncModule = require('../core/governance/enforcement/CrossRegionArchiveSyncModule');
const ReplayProofVerificationBridge = require('../core/governance/enforcement/ReplayProofVerificationBridge');
const BatchArchiveManager = require('../core/governance/enforcement/BatchArchiveManager');
const EnforcementProofSystem = require('../core/governance/enforcement/EnforcementProofSystem');

let testResults = { passed: 0, failed: 0, errors: [] };

/**
 * TEST 1: Consensus Quorum
 * Verify MAJORITY quorum (2/3 acks → QUORUM_VALIDATED)
 */
async function testConsensusQuorum() {
  console.log('\n=== TEST 1: Consensus Quorum ===');
  try {
    const syncModule = new CrossRegionArchiveSyncModule({ quorumMode: 'MAJORITY' });
    const eu = new BatchArchiveManager();
    const us = new BatchArchiveManager();
    const apac = new BatchArchiveManager();

    syncModule.registerRegion('eu-west', eu);
    syncModule.registerRegion('us-east', us);
    syncModule.registerRegion('apac-sg', apac);

    // Archive a segment in EU
    const archiveResult = eu.archiveCompaction({
      batchId: 'batch_consensus_1',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 10 },
      entriesCount: 10,
      aggregatedMetrics: {
        successCount: 9,
        violationCount: 1,
        byModule: { TestModule: { success: 9, violation: 1 } }
      }
    });

    const segment = eu.getSegmentById(archiveResult.segmentId);

    // Submit for consensus
    const submitResult = syncModule.submitForConsensus(segment, 'eu-west');
    assert(submitResult.submitted === true, 'Should submit for consensus');

    const consensusId = submitResult.consensusId;
    const initialState = syncModule.getConsensusState(consensusId);
    assert(initialState.state === 'PENDING', 'Initial state should be PENDING');
    assert(initialState.ackCount === 1, 'EU ack counted');

    // US acknowledges
    const usAck = syncModule.acknowledgeConsensus(consensusId, 'us-east');
    assert(usAck.acknowledged === true, 'US should acknowledge');
    assert(usAck.ackCount === 2, 'Should have 2 acks');
    assert(usAck.quorumReached === true, 'MAJORITY (2/3) reached');
    assert(usAck.state === 'QUORUM_VALIDATED', 'State should be QUORUM_VALIDATED');

    const finalState = syncModule.getConsensusState(consensusId);
    assert(finalState.state === 'QUORUM_VALIDATED', 'Final state should be QUORUM_VALIDATED');
    assert(finalState.isAuthoritative === false, 'Consensus record isAuthoritative must be false');

    console.log(`✅ Consensus quorum verified: MAJORITY (2/3) → QUORUM_VALIDATED`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 1: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 2: Cross-Region Propagation
 * Verify segment propagates from EU to US + APAC
 */
async function testCrossRegionPropagation() {
  console.log('\n=== TEST 2: Cross-Region Propagation ===');
  try {
    const syncModule = new CrossRegionArchiveSyncModule();
    const eu = new BatchArchiveManager();
    const us = new BatchArchiveManager();
    const apac = new BatchArchiveManager();

    syncModule.registerRegion('eu-west', eu);
    syncModule.registerRegion('us-east', us);
    syncModule.registerRegion('apac-sg', apac);

    // Archive in EU
    const euResult = eu.archiveCompaction({
      batchId: 'batch_prop_1',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 20 },
      entriesCount: 20,
      aggregatedMetrics: {
        successCount: 18,
        violationCount: 2,
        byModule: {}
      }
    });

    const segmentId = euResult.segmentId;

    // Verify EU has it
    assert(eu.getSegmentById(segmentId) !== null, 'EU should have segment');
    assert(us.getSegmentById(segmentId) === null, 'US should not have segment yet');
    assert(apac.getSegmentById(segmentId) === null, 'APAC should not have segment yet');

    // Propagate
    const propResult = syncModule.propagateSegment(segmentId, 'eu-west');
    assert(propResult.propagated === true, 'Should propagate');
    assert(propResult.targets.length === 2, 'Should target 2 regions');

    // Allow async propagation to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify propagation (check by batchId since new segmentIds are generated)
    const usSegments = us.getSegmentsByTimeRange(0, Date.now());
    const usHasSegment = usSegments.some(s => s.batchId === 'batch_prop_1');
    assert(usHasSegment, 'US should have batch_prop_1 after propagation');

    const apacSegments = apac.getSegmentsByTimeRange(0, Date.now());
    const apacHasSegment = apacSegments.some(s => s.batchId === 'batch_prop_1');
    assert(apacHasSegment, 'APAC should have batch_prop_1 after propagation');

    const usSegment = usSegments.find(s => s.batchId === 'batch_prop_1');
    assert(usSegment.entriesCount === 20, 'Propagated segment entriesCount should match');
    assert(Object.isFrozen(usSegment), 'Propagated segment should be frozen');

    console.log(`✅ Cross-region propagation verified: EU → US, APAC`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 2: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 3: Divergence Detection
 * Verify divergence detected when segment in EU but not US/APAC
 */
async function testDivergenceDetection() {
  console.log('\n=== TEST 3: Divergence Detection ===');
  try {
    const syncModule = new CrossRegionArchiveSyncModule();
    const eu = new BatchArchiveManager();
    const us = new BatchArchiveManager();
    const apac = new BatchArchiveManager();

    syncModule.registerRegion('eu-west', eu);
    syncModule.registerRegion('us-east', us);
    syncModule.registerRegion('apac-sg', apac);

    // Archive X only in EU
    const euResult = eu.archiveCompaction({
      batchId: 'batch_div_1',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 15 },
      entriesCount: 15,
      aggregatedMetrics: {
        successCount: 14,
        violationCount: 1,
        byModule: {}
      }
    });

    const segmentId = euResult.segmentId;

    // Archive Y in US only (different segment)
    const usResult = us.archiveCompaction({
      batchId: 'batch_div_2',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 16, end: 30 },
      entriesCount: 15,
      aggregatedMetrics: {
        successCount: 14,
        violationCount: 1,
        byModule: {}
      }
    });

    // Detect divergence
    const divergence = syncModule.detectDivergence();

    assert(divergence.divergent === true, 'Should detect divergence');
    assert(divergence.details.length === 2, 'Should have 2 divergences (batch_div_1 missing in US/APAC, batch_div_2 missing in EU/APAC)');

    const xDivergence = divergence.details.find(d => d.batchId === 'batch_div_1');
    assert(xDivergence !== undefined, 'batch_div_1 divergence should be found');
    assert(xDivergence.presentIn.includes('eu-west'), 'batch_div_1 present in EU');
    assert(xDivergence.missingFrom.includes('us-east'), 'batch_div_1 missing in US');
    assert(xDivergence.missingFrom.includes('apac-sg'), 'batch_div_1 missing in APAC');

    console.log(`✅ Divergence detection verified: ${divergence.details.length} divergences found`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 3: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 4: Reconciliation
 * Verify reconciliation converges all regions
 */
async function testReconciliation() {
  console.log('\n=== TEST 4: Reconciliation ===');
  try {
    const syncModule = new CrossRegionArchiveSyncModule();
    const eu = new BatchArchiveManager();
    const us = new BatchArchiveManager();
    const apac = new BatchArchiveManager();

    syncModule.registerRegion('eu-west', eu);
    syncModule.registerRegion('us-east', us);
    syncModule.registerRegion('apac-sg', apac);

    // Archive only in EU
    const euResult = eu.archiveCompaction({
      batchId: 'batch_rec_1',
      timestamp: new Date().toISOString(),
      sequenceRange: { start: 1, end: 25 },
      entriesCount: 25,
      aggregatedMetrics: {
        successCount: 23,
        violationCount: 2,
        byModule: {}
      }
    });

    // Detect divergence
    let divergence = syncModule.detectDivergence();
    assert(divergence.divergent === true, 'Should have divergence');

    // Reconcile
    const reconcileResult = syncModule.reconcile();

    assert(reconcileResult.reconciled === true, 'Should reconcile');
    assert(reconcileResult.segmentsSynced === 2, 'Should sync 2 batches (into US and APAC)');
    assert(reconcileResult.regionsAffected.length === 2, 'Should affect 2 regions');
    assert(reconcileResult.isAuthoritative === false, 'Reconciliation result isAuthoritative must be false');

    // Verify no more divergence
    divergence = syncModule.detectDivergence();
    assert(divergence.divergent === false, 'Should have no divergence after reconciliation');

    // Verify all regions have batch_rec_1
    const euSegments = eu.getSegmentsByTimeRange(0, Date.now());
    const usSegments = us.getSegmentsByTimeRange(0, Date.now());
    const apacSegments = apac.getSegmentsByTimeRange(0, Date.now());
    assert(euSegments.some(s => s.batchId === 'batch_rec_1'), 'EU should have batch_rec_1');
    assert(usSegments.some(s => s.batchId === 'batch_rec_1'), 'US should have batch_rec_1');
    assert(apacSegments.some(s => s.batchId === 'batch_rec_1'), 'APAC should have batch_rec_1');

    console.log(`✅ Reconciliation verified: converged all regions`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 4: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 5: Replay Determinism
 * Verify reconstructAtTimestamp(T) is deterministic
 */
async function testReplayDeterminism() {
  console.log('\n=== TEST 5: Replay Determinism ===');
  try {
    const archive = new BatchArchiveManager();
    const bridge = new ReplayProofVerificationBridge({ archive });

    const baseTime = Date.now() - 5 * 60 * 1000; // 5 min ago

    // Archive 3 segments at different times
    for (let i = 0; i < 3; i++) {
      const ts = baseTime + i * 60 * 1000;
      archive.archiveCompaction({
        batchId: `batch_det_${i}`,
        timestamp: new Date(ts).toISOString(),
        sequenceRange: { start: i * 10 + 1, end: i * 10 + 10 },
        entriesCount: 10,
        aggregatedMetrics: {
          successCount: 8 + i,
          violationCount: 2 - i,
          byModule: { Module: { success: 8 + i, violation: 2 - i } }
        }
      });
    }

    const queryTime = baseTime + 2 * 60 * 1000;

    // Reconstruct twice
    const result1 = bridge.reconstructAtTimestamp(queryTime);
    const result2 = bridge.reconstructAtTimestamp(queryTime);

    assert(result1.reconstructed === true, 'First reconstruction should succeed');
    assert(result2.reconstructed === true, 'Second reconstruction should succeed');

    // Verify determinism
    assert(result1.segmentsReplayed === result2.segmentsReplayed,
      `segmentsReplayed should be same: ${result1.segmentsReplayed} vs ${result2.segmentsReplayed}`);
    assert(result1.reconstructedState.totalEntries === result2.reconstructedState.totalEntries,
      `totalEntries should be same: ${result1.reconstructedState.totalEntries} vs ${result2.reconstructedState.totalEntries}`);
    assert(result1.reconstructedState.totalSuccess === result2.reconstructedState.totalSuccess,
      `totalSuccess should be same: ${result1.reconstructedState.totalSuccess} vs ${result2.reconstructedState.totalSuccess}`);
    assert(result1.reconstructedState.totalViolations === result2.reconstructedState.totalViolations,
      `totalViolations should be same: ${result1.reconstructedState.totalViolations} vs ${result2.reconstructedState.totalViolations}`);

    assert(result1.isAuthoritative === false, 'Reconstruction isAuthoritative must be false');
    assert(Object.isFrozen(result1), 'Result should be frozen');

    console.log(`✅ Replay determinism verified: segmentsReplayed=${result1.segmentsReplayed}, totalEntries=${result1.reconstructedState.totalEntries}`);
    testResults.passed++;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push(`TEST 5: ${error.message}`);
    throw error;
  }
}

/**
 * TEST 6: Real-Time Isolation
 * Verify Phase 7.3 ops don't affect real-time proof chain
 */
async function testRealTimeIsolation() {
  console.log('\n=== TEST 6: Real-Time Isolation ===');
  try {
    const proofSystem = new EnforcementProofSystem();
    const archive = new BatchArchiveManager();
    const syncModule = new CrossRegionArchiveSyncModule();
    const bridge = new ReplayProofVerificationBridge({ archive });

    // Capture real-time proofs
    for (let i = 0; i < 10; i++) {
      proofSystem.captureDecision({
        module: 'IsolationModule',
        action: 'validate',
        ruleEvaluated: 'isolation_rule',
        input: { i },
        result: { valid: true },
        severity: 'INFO',
        enforcementLayer: 'TEST',
        startTime: Date.now() - 10
      });
    }

    // Verify before any Phase 7.3 ops
    const verifyBefore = proofSystem.verify();
    assert(verifyBefore.valid === true, 'Real-time chain should be valid');
    const chainLengthBefore = verifyBefore.entriesVerified;

    // Compact and archive
    const compactResult = proofSystem.compactProofs();
    const archiveResult = archive.archiveCompaction(compactResult.compacted, {});
    assert(archiveResult.archived === true, 'Should archive');

    // Register archive and do sync ops
    const eu = new BatchArchiveManager();
    syncModule.registerRegion('eu', eu);
    syncModule.registerRegion('us', archive);

    // Sync ops
    const segment = archive.getSegmentById(archiveResult.segmentId);
    const syncResult = syncModule.submitForConsensus(segment, 'us');
    syncModule.detectDivergence();
    syncModule.reconcile();

    // Bridge operations
    bridge.verifyReplay(archiveResult.segmentId);
    bridge.reconstructAtTimestamp(Date.now());

    // Verify after all Phase 7.3 ops
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
  console.log('🧪 PHASE 7.3 — Global Archive Consistency & Cross-Region Replay');
  console.log('═'.repeat(70));

  try {
    await testConsensusQuorum();
    await testCrossRegionPropagation();
    await testDivergenceDetection();
    await testReconciliation();
    await testReplayDeterminism();
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

module.exports = { CrossRegionArchiveSyncModule, ReplayProofVerificationBridge };
