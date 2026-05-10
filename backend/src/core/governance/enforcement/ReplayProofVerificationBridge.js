/**
 * ReplayProofVerificationBridge
 * PHASE 7.3 — Global Archive Consistency & Cross-Region Replay Verification
 *
 * Bridges BatchArchiveManager replay and ProofChainConsolidator verification.
 * Enables deterministic state reconstruction at timestamp T with proof chain anchoring.
 *
 * Verification hierarchy: Proof Chain > Event Log > Archive
 *
 * INVARIANT: Bridge never influences Real-Time enforcement decisions.
 */

const ProofChainConsolidator = require('../observability/ProofChainConsolidator');

class ReplayProofVerificationBridge {
  constructor(options = {}) {
    this.archive = options.archive;
    this.consolidator = options.consolidator || new ProofChainConsolidator();
    this.verificationHistory = [];
    this.bridgeMetrics = {
      replaysVerified: 0,
      replaysRejected: 0,
      timestampReconstructionsPerformed: 0,
      proofAnchorsValidated: 0,
      createdAt: new Date().toISOString()
    };
    this.maxHistory = options.maxHistory || 200;
  }

  /**
   * Verify integrity of a replayed segment
   */
  verifyReplay(segmentId) {
    if (!this.archive) {
      this.bridgeMetrics.replaysRejected++;
      return { verified: false, reason: 'NO_ARCHIVE', isAuthoritative: false };
    }

    const replayResult = this.archive.replaySegment(segmentId);
    if (!replayResult.replayed) {
      this.bridgeMetrics.replaysRejected++;
      return { verified: false, reason: 'SEGMENT_NOT_FOUND', isAuthoritative: false };
    }

    const segment = replayResult.segment;

    // Verify basic segment invariants
    const proofAnchored = segment.rootHash !== null;
    const isFrozen = Object.isFrozen(segment);
    const sequenceValid = segment.sequenceRange.start <= segment.sequenceRange.end;

    const verified = isFrozen && sequenceValid;
    this.bridgeMetrics.replaysVerified += verified ? 1 : 0;
    this.bridgeMetrics.replaysRejected += verified ? 0 : 1;
    if (proofAnchored) this.bridgeMetrics.proofAnchorsValidated++;

    const record = Object.freeze({
      segmentId,
      verified,
      proofAnchored,
      isFrozen,
      sequenceValid,
      verifiedAt: new Date().toISOString(),
      isAuthoritative: false
    });

    this.verificationHistory.push(record);
    if (this.verificationHistory.length > this.maxHistory) {
      this.verificationHistory = this.verificationHistory.slice(-this.maxHistory);
    }

    return record;
  }

  /**
   * Reconstruct global state at timestamp T
   */
  reconstructAtTimestamp(timestampMs) {
    if (!this.archive) {
      return {
        reconstructed: false,
        reason: 'NO_ARCHIVE',
        isAuthoritative: false
      };
    }

    // Collect all segments up to timestampMs
    const segments = this.archive.getSegmentsByTimeRange(0, timestampMs);
    if (segments.length === 0) {
      return {
        reconstructed: false,
        reason: 'NO_SEGMENTS_IN_RANGE',
        isAuthoritative: false
      };
    }

    // Sort segments by timestamp (deterministic ordering)
    const sorted = [...segments].sort((a, b) =>
      new Date(a.segmentTimestamp).getTime() - new Date(b.segmentTimestamp).getTime()
    );

    // Aggregate state from sorted segments
    let totalSuccess = 0;
    let totalViolations = 0;
    let totalEntries = 0;
    const byModule = {};
    const latestSequence = { start: Infinity, end: -Infinity };

    for (const segment of sorted) {
      totalSuccess += segment.aggregatedMetrics.successCount;
      totalViolations += segment.aggregatedMetrics.violationCount;
      totalEntries += segment.entriesCount;
      for (const [mod, counts] of Object.entries(segment.aggregatedMetrics.byModule || {})) {
        if (!byModule[mod]) byModule[mod] = { success: 0, violation: 0 };
        byModule[mod].success += (counts.success || 0);
        byModule[mod].violation += (counts.violation || 0);
      }
      if (segment.sequenceRange.start < latestSequence.start) {
        latestSequence.start = segment.sequenceRange.start;
      }
      if (segment.sequenceRange.end > latestSequence.end) {
        latestSequence.end = segment.sequenceRange.end;
      }
    }

    // Build global proof anchor via consolidator
    this.consolidator.reset();
    for (const segment of sorted) {
      if (segment.rootHash) {
        this.consolidator.registerNodeProofs(segment.batchId, [{ hash: segment.rootHash }]);
      }
    }
    const globalRoot = this.consolidator.buildGlobalRoot();

    this.bridgeMetrics.timestampReconstructionsPerformed++;

    const result = Object.freeze({
      reconstructed: true,
      atTimestamp: timestampMs,
      atTimestampISO: new Date(timestampMs).toISOString(),
      segmentsReplayed: sorted.length,
      globalSequenceRange: Object.freeze({
        start: latestSequence.start === Infinity ? null : latestSequence.start,
        end: latestSequence.end === -Infinity ? null : latestSequence.end
      }),
      globalRootHash: globalRoot.computed ? globalRoot.rootHash : null,
      reconstructedState: Object.freeze({
        totalSuccess,
        totalViolations,
        totalEntries,
        violationRatePercent: totalEntries > 0
          ? parseFloat(((totalViolations / totalEntries) * 100).toFixed(2))
          : 0,
        byModule: Object.freeze(byModule)
      }),
      isAuthoritative: false
    });

    this.verificationHistory.push(result);
    if (this.verificationHistory.length > this.maxHistory) {
      this.verificationHistory = this.verificationHistory.slice(-this.maxHistory);
    }

    return result;
  }

  /**
   * Get verification history
   */
  getVerificationHistory(n = 20) {
    if (n <= 0) return [...this.verificationHistory];
    return this.verificationHistory.slice(-n);
  }

  /**
   * Get bridge metrics
   */
  getBridgeMetrics() {
    return {
      isAuthoritative: false,
      ...this.bridgeMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * INVARIANT: never authoritative
   */
  isAuthoritative() {
    return false;
  }

  /**
   * Reset state (tests)
   */
  reset() {
    this.verificationHistory = [];
    this.bridgeMetrics = {
      replaysVerified: 0,
      replaysRejected: 0,
      timestampReconstructionsPerformed: 0,
      proofAnchorsValidated: 0,
      createdAt: new Date().toISOString()
    };
    if (this.consolidator && this.consolidator.reset) {
      this.consolidator.reset();
    }
  }
}

module.exports = ReplayProofVerificationBridge;
