/**
 * TransactionLogModule
 * PHASE 7.4 — Persistence Layer & Durable Global Archive
 *
 * Append-only transaction log for all archive operations.
 * Enables deterministic replay and recovery.
 *
 * INVARIANT: Archive logs never influence Real-Time enforcement decisions.
 * All operations are observability-only, append-only by design.
 */

const crypto = require('crypto');

class TransactionLogModule {
  constructor(options = {}) {
    this.log = [];                      // TransactionEntry[] (append-only, frozen)
    this.logIndex = new Map();          // txId → log array index
    this.maxEntries = options.maxEntries || 50000;
    this.maxIdleMs = options.maxIdleMs || 24 * 60 * 60 * 1000; // 1 day
    this.maxAlerts = options.maxAlerts || 1000;

    this.logMetrics = {
      totalEntries: 0,
      archiveEntries: 0,
      evictionEntries: 0,
      consensusEntries: 0,
      reconciliationEntries: 0,
      snapshotEntries: 0,
      logErrors: 0,
      lastEntryTimestamp: null,
      createdAt: new Date().toISOString()
    };

    this.alerts = [];
  }

  /**
   * Log an archive operation with full compaction details for replay
   */
  logArchive(compactionInput, archiveResult, regionId = null) {
    if (!archiveResult || !archiveResult.archived) {
      return { logged: false, reason: 'ARCHIVE_FAILED' };
    }

    if (this.log.length >= this.maxEntries) {
      this.logMetrics.logErrors++;
      return { logged: false, reason: 'LOG_FULL' };
    }

    const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const entry = Object.freeze({
      txId,
      txType: 'ARCHIVE',
      timestamp: new Date().toISOString(),
      regionId,
      details: Object.freeze({
        segmentId: archiveResult.segmentId,
        compressed: archiveResult.compressed,
        batchId: compactionInput.batchId,
        timestamp: compactionInput.timestamp,
        sequenceRange: { ...compactionInput.sequenceRange },
        entriesCount: compactionInput.entriesCount,
        aggregatedMetrics: { ...compactionInput.aggregatedMetrics },
        nodeId: compactionInput.nodeId || null,
        rootHash: compactionInput.rootHash || null
      }),
      isAuthoritative: false
    });

    this.log.push(entry);
    this.logIndex.set(txId, this.log.length - 1);
    this.logMetrics.totalEntries++;
    this.logMetrics.archiveEntries++;
    this.logMetrics.lastEntryTimestamp = entry.timestamp;

    return { logged: true, txId };
  }

  /**
   * Log an eviction operation
   */
  logEviction(evictionResult, regionId = null) {
    if (!evictionResult) {
      return { logged: false, reason: 'INVALID_EVICTION' };
    }

    if (this.log.length >= this.maxEntries) {
      this.logMetrics.logErrors++;
      return { logged: false, reason: 'LOG_FULL' };
    }

    const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const entry = Object.freeze({
      txId,
      txType: 'EVICTION',
      timestamp: new Date().toISOString(),
      regionId,
      details: Object.freeze({
        evicted: evictionResult.evicted,
        retained: evictionResult.retained
      }),
      isAuthoritative: false
    });

    this.log.push(entry);
    this.logIndex.set(txId, this.log.length - 1);
    this.logMetrics.totalEntries++;
    this.logMetrics.evictionEntries++;
    this.logMetrics.lastEntryTimestamp = entry.timestamp;

    return { logged: true, txId };
  }

  /**
   * Log a consensus operation
   */
  logConsensus(consensusRecord, regionId = null) {
    if (!consensusRecord) {
      return { logged: false, reason: 'INVALID_CONSENSUS' };
    }

    if (this.log.length >= this.maxEntries) {
      this.logMetrics.logErrors++;
      return { logged: false, reason: 'LOG_FULL' };
    }

    const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const entry = Object.freeze({
      txId,
      txType: 'CONSENSUS',
      timestamp: new Date().toISOString(),
      regionId,
      details: Object.freeze({
        consensusId: consensusRecord.consensusId,
        state: consensusRecord.state,
        ackCount: consensusRecord.ackCount
      }),
      isAuthoritative: false
    });

    this.log.push(entry);
    this.logIndex.set(txId, this.log.length - 1);
    this.logMetrics.totalEntries++;
    this.logMetrics.consensusEntries++;
    this.logMetrics.lastEntryTimestamp = entry.timestamp;

    return { logged: true, txId };
  }

  /**
   * Log a reconciliation operation
   */
  logReconciliation(reconcileResult, regionId = null) {
    if (!reconcileResult) {
      return { logged: false, reason: 'INVALID_RECONCILIATION' };
    }

    if (this.log.length >= this.maxEntries) {
      this.logMetrics.logErrors++;
      return { logged: false, reason: 'LOG_FULL' };
    }

    const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const entry = Object.freeze({
      txId,
      txType: 'RECONCILIATION',
      timestamp: new Date().toISOString(),
      regionId,
      details: Object.freeze({
        segmentsSynced: reconcileResult.segmentsSynced,
        regionsAffected: [...reconcileResult.regionsAffected]
      }),
      isAuthoritative: false
    });

    this.log.push(entry);
    this.logIndex.set(txId, this.log.length - 1);
    this.logMetrics.totalEntries++;
    this.logMetrics.reconciliationEntries++;
    this.logMetrics.lastEntryTimestamp = entry.timestamp;

    return { logged: true, txId };
  }

  /**
   * Log a snapshot operation
   */
  logSnapshot(snapshotResult, regionId = null) {
    if (!snapshotResult || !snapshotResult.taken) {
      return { logged: false, reason: 'SNAPSHOT_FAILED' };
    }

    if (this.log.length >= this.maxEntries) {
      this.logMetrics.logErrors++;
      return { logged: false, reason: 'LOG_FULL' };
    }

    const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const entry = Object.freeze({
      txId,
      txType: 'SNAPSHOT',
      timestamp: new Date().toISOString(),
      regionId,
      details: Object.freeze({
        snapshotId: snapshotResult.snapshotId,
        segmentsCaptured: snapshotResult.segmentsCaptured
      }),
      isAuthoritative: false
    });

    this.log.push(entry);
    this.logIndex.set(txId, this.log.length - 1);
    this.logMetrics.totalEntries++;
    this.logMetrics.snapshotEntries++;
    this.logMetrics.lastEntryTimestamp = entry.timestamp;

    return { logged: true, txId };
  }

  /**
   * Get log entry by ID
   */
  getEntryById(txId) {
    const idx = this.logIndex.get(txId);
    return idx !== undefined ? this.log[idx] : null;
  }

  /**
   * Get entries in time range
   */
  getEntriesInRange(startTs, endTs) {
    const start = typeof startTs === 'string' ? new Date(startTs).getTime() : startTs;
    const end = typeof endTs === 'string' ? new Date(endTs).getTime() : endTs;

    return this.log.filter(entry => {
      const entryTs = new Date(entry.timestamp).getTime();
      return entryTs >= start && entryTs <= end;
    });
  }

  /**
   * Get entries by type
   */
  getEntriesByType(txType) {
    return this.log.filter(entry => entry.txType === txType);
  }

  /**
   * Replay ARCHIVE entries from given index
   */
  replayFromIndex(archive, fromIndex = 0) {
    if (!archive) {
      return { replayed: false, reason: 'NO_ARCHIVE' };
    }

    let replayed = 0;
    const archiveEntries = this.log
      .slice(fromIndex)
      .filter(e => e.txType === 'ARCHIVE');

    for (const entry of archiveEntries) {
      const result = archive.archiveCompaction({
        batchId: entry.details.batchId,
        timestamp: entry.details.timestamp,
        sequenceRange: { ...entry.details.sequenceRange },
        entriesCount: entry.details.entriesCount,
        aggregatedMetrics: { ...entry.details.aggregatedMetrics }
      }, { nodeId: entry.details.nodeId, rootHash: entry.details.rootHash });

      if (result.archived) replayed++;
    }

    return {
      replayed: true,
      fromIndex,
      entriesReplayed: replayed,
      isAuthoritative: false
    };
  }

  /**
   * Get log metrics
   */
  getLogMetrics() {
    return {
      isAuthoritative: false,
      ...this.logMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check for alerts
   */
  checkAlerts() {
    const newAlerts = [];

    // LOG_SIZE_HIGH
    const sizeUsage = this.log.length / this.maxEntries;
    if (sizeUsage > 0.9 && sizeUsage < 1) {
      const alert = Object.freeze({
        type: 'LOG_SIZE_HIGH',
        severity: 'WARNING',
        value: this.log.length,
        threshold: this.maxEntries,
        message: `Transaction log at ${(sizeUsage * 100).toFixed(1)}% capacity`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // LOG_FULL
    if (sizeUsage >= 1) {
      const alert = Object.freeze({
        type: 'LOG_FULL',
        severity: 'CRITICAL',
        value: this.log.length,
        threshold: this.maxEntries,
        message: `Transaction log is FULL: ${this.log.length}/${this.maxEntries}`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // LOG_STALE
    if (this.logMetrics.lastEntryTimestamp) {
      const lastEntryTime = new Date(this.logMetrics.lastEntryTimestamp).getTime();
      if (Date.now() - lastEntryTime > this.maxIdleMs) {
        const alert = Object.freeze({
          type: 'LOG_STALE',
          severity: 'WARNING',
          value: Date.now() - lastEntryTime,
          threshold: this.maxIdleMs,
          message: `No log entries for ${this.maxIdleMs}ms`,
          timestamp: new Date().toISOString(),
          isAuthoritative: false
        });
        newAlerts.push(alert);
        this.alerts.push(alert);
      }
    }

    // WRITE_ERRORS
    if (this.logMetrics.logErrors > 0) {
      const alert = Object.freeze({
        type: 'WRITE_ERRORS',
        severity: 'WARNING',
        value: this.logMetrics.logErrors,
        message: `Transaction log has ${this.logMetrics.logErrors} write errors`,
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
    this.log = [];
    this.logIndex.clear();
    this.logMetrics = {
      totalEntries: 0,
      archiveEntries: 0,
      evictionEntries: 0,
      consensusEntries: 0,
      reconciliationEntries: 0,
      snapshotEntries: 0,
      logErrors: 0,
      lastEntryTimestamp: null,
      createdAt: new Date().toISOString()
    };
    this.alerts = [];
  }
}

module.exports = TransactionLogModule;
