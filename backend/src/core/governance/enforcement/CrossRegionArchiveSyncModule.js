/**
 * CrossRegionArchiveSyncModule
 * PHASE 7.3 — Global Archive Consistency & Cross-Region Replay Verification
 *
 * Manages asynchronous quorum consensus and cross-region synchronization (EU, US, APAC).
 * Detects archive divergence and reconciles missing segments between regions.
 *
 * INVARIANT: Archive never influences Real-Time enforcement decisions.
 * All operations are observability-only; consensus is non-blocking (setImmediate).
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class CrossRegionArchiveSyncModule extends EventEmitter {
  constructor(options = {}) {
    super();
    this.regions = new Map();          // regionId → BatchArchiveManager
    this.pendingConsensus = new Map(); // consensusId → frozen ConsensusRecord
    this.syncState = new Map();        // segmentId → { regionId → boolean }
    this.divergenceLog = [];           // frozen divergence events
    this.syncMetrics = {
      segmentsPropagated: 0,
      divergencesDetected: 0,
      reconciliationsPerformed: 0,
      consensusReached: 0,
      consensusRejected: 0,
      createdAt: new Date().toISOString()
    };
    this.quorumMode = options.quorumMode || 'MAJORITY'; // MAJORITY | CONSENSUS
    this.maxDivergenceLog = options.maxDivergenceLog || 500;
    this.alerts = [];
    this.maxAlerts = options.maxAlerts || 1000;
  }

  /**
   * Register a region with its archive
   */
  registerRegion(regionId, archive) {
    if (!regionId || !archive) {
      return { registered: false, reason: 'INVALID_INPUT' };
    }
    this.regions.set(regionId, archive);
    this.emit('region:registered', { regionId });
    return { registered: true, regionId };
  }

  /**
   * Submit a segment for consensus validation
   */
  submitForConsensus(segment, sourceRegionId) {
    const regionCount = this.regions.size;
    if (regionCount === 0) {
      return { submitted: false, reason: 'NO_REGIONS' };
    }

    // Quorum threshold: MAJORITY = floor(n/2) + 1
    const requiredAcks = this.quorumMode === 'CONSENSUS'
      ? regionCount
      : Math.floor(regionCount / 2) + 1;

    const consensusId = `cons_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const record = Object.freeze({
      consensusId,
      segmentId: segment.segmentId,
      sourceRegion: sourceRegionId,
      state: 'PENDING',
      requiredAcks,
      acks: Object.freeze({ [sourceRegionId]: new Date().toISOString() }),
      ackCount: 1,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });

    this.pendingConsensus.set(consensusId, record);

    // Async propagation to other regions (non-blocking)
    setImmediate(() => this._propagateForConsensus(consensusId, segment, sourceRegionId));

    this.emit('consensus:submitted', { consensusId, segmentId: segment.segmentId });
    return { submitted: true, consensusId };
  }

  /**
   * Acknowledge consensus from a region
   */
  acknowledgeConsensus(consensusId, regionId) {
    const record = this.pendingConsensus.get(consensusId);
    if (!record) {
      return { acknowledged: false, reason: 'CONSENSUS_NOT_FOUND' };
    }
    if (record.state !== 'PENDING') {
      return { acknowledged: false, reason: `ALREADY_${record.state}` };
    }

    // Build new frozen record with updated acks
    const newAcks = Object.freeze({ ...record.acks, [regionId]: new Date().toISOString() });
    const ackCount = Object.keys(newAcks).length;
    const quorumReached = ackCount >= record.requiredAcks;

    const updated = Object.freeze({
      ...record,
      acks: newAcks,
      ackCount,
      state: quorumReached ? 'QUORUM_VALIDATED' : 'PENDING'
    });

    this.pendingConsensus.set(consensusId, updated);

    if (quorumReached) {
      this.syncMetrics.consensusReached++;
      this.emit('consensus:validated', { consensusId, segmentId: record.segmentId });
    }

    return { acknowledged: true, ackCount, quorumReached, state: updated.state };
  }

  /**
   * Get consensus state by ID
   */
  getConsensusState(consensusId) {
    return this.pendingConsensus.get(consensusId) || null;
  }

  /**
   * Propagate segment to all other regions
   */
  propagateSegment(segmentId, sourceRegionId) {
    const sourceArchive = this.regions.get(sourceRegionId);
    if (!sourceArchive) {
      return { propagated: false, reason: 'SOURCE_REGION_NOT_FOUND' };
    }

    const segment = sourceArchive.getSegmentById(segmentId);
    if (!segment) {
      return { propagated: false, reason: 'SEGMENT_NOT_FOUND' };
    }

    const targets = [];
    for (const [regionId, archive] of this.regions) {
      if (regionId === sourceRegionId) continue;

      // Async propagation (non-blocking)
      setImmediate(() => {
        const result = archive.archiveCompaction({
          batchId: segment.batchId,
          timestamp: segment.segmentTimestamp,
          sequenceRange: { ...segment.sequenceRange },
          entriesCount: segment.entriesCount,
          aggregatedMetrics: { ...segment.aggregatedMetrics }
        }, { nodeId: segment.nodeId, rootHash: segment.rootHash });

        if (result.archived) {
          this.syncMetrics.segmentsPropagated++;
          this.emit('segment:propagated', { segmentId, sourceRegionId, targetRegionId: regionId });
        }
      });

      targets.push(regionId);
    }

    return { propagated: true, segmentId, targets };
  }

  /**
   * Detect divergence between regions (by batchId, not segmentId)
   */
  detectDivergence() {
    const regionIds = [...this.regions.keys()];
    if (regionIds.length < 2) {
      return { divergent: false, details: [] };
    }

    // Collect all batch IDs per region
    const regionBatches = new Map();
    for (const [regionId, archive] of this.regions) {
      const segments = archive.getSegmentsByTimeRange(0, Date.now());
      const batchIds = new Set(segments.map(s => s.batchId));
      regionBatches.set(regionId, batchIds);
    }

    // Find batches present in some regions but not all
    const allBatchIds = new Set();
    for (const batchIds of regionBatches.values()) {
      for (const id of batchIds) allBatchIds.add(id);
    }

    const details = [];
    for (const batchId of allBatchIds) {
      const presentIn = regionIds.filter(r => regionBatches.get(r).has(batchId));
      if (presentIn.length < regionIds.length) {
        const missingFrom = regionIds.filter(r => !regionBatches.get(r).has(batchId));
        const divergence = Object.freeze({
          batchId,
          presentIn,
          missingFrom,
          divergenceType: 'MISSING_BATCH',
          detectedAt: new Date().toISOString()
        });
        details.push(divergence);
        this.divergenceLog.push(divergence);
        this.syncMetrics.divergencesDetected++;
      }
    }

    // Cap divergence log
    if (this.divergenceLog.length > this.maxDivergenceLog) {
      this.divergenceLog = this.divergenceLog.slice(-this.maxDivergenceLog);
    }

    return { divergent: details.length > 0, details };
  }

  /**
   * Reconcile divergences
   */
  reconcile() {
    const divergence = this.detectDivergence();
    if (!divergence.divergent) {
      return { reconciled: true, segmentsSynced: 0, regionsAffected: [] };
    }

    let segmentsSynced = 0;
    const regionsAffected = new Set();

    for (const { batchId, presentIn, missingFrom } of divergence.details) {
      const sourceRegion = presentIn[0];
      const sourceArchive = this.regions.get(sourceRegion);
      // Find a segment with this batchId
      const sourceSegments = sourceArchive.getSegmentsByTimeRange(0, Date.now());
      const segment = sourceSegments.find(s => s.batchId === batchId);
      if (!segment) continue;

      for (const targetRegionId of missingFrom) {
        const targetArchive = this.regions.get(targetRegionId);
        if (!targetArchive) continue;

        // Re-archive the segment in the missing region
        const result = targetArchive.archiveCompaction({
          batchId: segment.batchId,
          timestamp: segment.segmentTimestamp,
          sequenceRange: { ...segment.sequenceRange },
          entriesCount: segment.entriesCount,
          aggregatedMetrics: { ...segment.aggregatedMetrics }
        }, { nodeId: segment.nodeId, rootHash: segment.rootHash });

        if (result.archived) {
          segmentsSynced++;
          regionsAffected.add(targetRegionId);
        }
      }
    }

    this.syncMetrics.reconciliationsPerformed++;
    return {
      reconciled: true,
      segmentsSynced,
      regionsAffected: [...regionsAffected],
      isAuthoritative: false
    };
  }

  /**
   * Get sync state for a segment
   */
  getSyncState(segmentId) {
    const state = {};
    for (const [regionId, archive] of this.regions) {
      state[regionId] = archive.getSegmentById(segmentId) !== null;
    }
    return state;
  }

  /**
   * Get sync metrics
   */
  getSyncMetrics() {
    return {
      isAuthoritative: false,
      ...this.syncMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check for alerts
   */
  checkAlerts() {
    const newAlerts = [];
    const divergence = this.detectDivergence();

    // DIVERGENCE_DETECTED
    if (divergence.divergent && divergence.details.length > 0) {
      const alert = Object.freeze({
        type: 'DIVERGENCE_DETECTED',
        severity: 'WARNING',
        value: divergence.details.length,
        message: `Archive divergence detected: ${divergence.details.length} segments not in sync`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // Cap alert history
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    return newAlerts;
  }

  /**
   * Get all historical alerts
   */
  getAllAlerts() {
    return [...this.alerts];
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
    this.regions.clear();
    this.pendingConsensus.clear();
    this.syncState.clear();
    this.divergenceLog = [];
    this.syncMetrics = {
      segmentsPropagated: 0,
      divergencesDetected: 0,
      reconciliationsPerformed: 0,
      consensusReached: 0,
      consensusRejected: 0,
      createdAt: new Date().toISOString()
    };
    this.alerts = [];
  }

  /**
   * INTERNAL: Propagate for consensus
   */
  _propagateForConsensus(consensusId, segment, sourceRegionId) {
    for (const [regionId, archive] of this.regions) {
      if (regionId === sourceRegionId) continue;

      // Each region acknowledges
      this.acknowledgeConsensus(consensusId, regionId);
    }
  }
}

module.exports = CrossRegionArchiveSyncModule;
