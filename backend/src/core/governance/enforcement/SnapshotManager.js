/**
 * SnapshotManager
 * PHASE 7.4 — Persistence Layer & Durable Global Archive
 *
 * Manages periodic immutable snapshots of BatchArchiveManager state.
 * Snapshots enable fast recovery and point-in-time reconstruction.
 *
 * INVARIANT: Archive snapshots never influence Real-Time enforcement decisions.
 * All operations are observability-only, read-only by design.
 */

const crypto = require('crypto');

class SnapshotManager {
  constructor(options = {}) {
    this.snapshots = new Map();        // snapshotId → frozen SnapshotRecord
    this.snapshotIndex = [];           // sorted [{ ts, snapshotId }] (binary search)
    this.maxSnapshots = options.maxSnapshots || 100;
    this.maxSnapshotAgeMs = options.maxSnapshotAgeMs || 24 * 60 * 60 * 1000; // 1 day
    this.maxAlerts = options.maxAlerts || 1000;

    this.snapshotMetrics = {
      snapshotsTaken: 0,
      snapshotsEvicted: 0,
      restoresPerformed: 0,
      lastSnapshotTimestamp: null,
      snapshotErrors: 0,
      createdAt: new Date().toISOString()
    };

    this.alerts = [];
  }

  /**
   * Take a snapshot of current archive state
   */
  takeSnapshot(archive, options = {}) {
    if (!archive) {
      return { taken: false, reason: 'NO_ARCHIVE' };
    }

    if (this.snapshots.size >= this.maxSnapshots) {
      this.snapshotMetrics.snapshotErrors++;
      return { taken: false, reason: 'SNAPSHOTS_FULL' };
    }

    const snapshotId = `snap_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const allSegments = archive.getSegmentsByTimeRange(0, Date.now());

    const record = Object.freeze({
      snapshotId,
      takenAt: new Date().toISOString(),
      regionId: options.regionId || null,
      archiveSize: archive.segments.size,
      totalEntries: archive.archiveMetrics.totalEntriesArchived,
      segmentsData: Object.freeze([...allSegments]),
      archiveMetricsSnapshot: Object.freeze({
        ...archive.getArchiveMetrics()
      }),
      temporalIndexSnapshot: Object.freeze([...archive.temporalIndex]),
      isAuthoritative: false
    });

    this.snapshots.set(snapshotId, record);
    this._insertIntoSnapshotIndex(new Date(record.takenAt).getTime(), snapshotId);
    this.snapshotMetrics.snapshotsTaken++;
    this.snapshotMetrics.lastSnapshotTimestamp = record.takenAt;

    return { taken: true, snapshotId, segmentsCaptured: record.archiveSize };
  }

  /**
   * Get latest snapshot
   */
  getLatestSnapshot() {
    if (this.snapshotIndex.length === 0) return null;
    const latestId = this.snapshotIndex[this.snapshotIndex.length - 1].snapshotId;
    return this.snapshots.get(latestId) || null;
  }

  /**
   * Get snapshot by ID
   */
  getSnapshotById(snapshotId) {
    return this.snapshots.get(snapshotId) || null;
  }

  /**
   * Get snapshot closest to (before) timestamp
   */
  getSnapshotByTimestamp(ts) {
    const targetTs = typeof ts === 'string' ? new Date(ts).getTime() : ts;

    // Binary search for largest ts <= targetTs
    let lo = 0, hi = this.snapshotIndex.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.snapshotIndex[mid].ts <= targetTs) lo = mid + 1;
      else hi = mid;
    }

    if (lo === 0) return null; // No snapshot before target time
    const snapshotId = this.snapshotIndex[lo - 1].snapshotId;
    return this.snapshots.get(snapshotId) || null;
  }

  /**
   * List all snapshots (sorted by time)
   */
  listSnapshots() {
    const result = [];
    for (const { snapshotId } of this.snapshotIndex) {
      const snapshot = this.snapshots.get(snapshotId);
      if (snapshot) result.push(snapshot);
    }
    return result;
  }

  /**
   * Restore archive from snapshot
   */
  restoreFromSnapshot(snapshotId, archive) {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      return { restored: false, reason: 'SNAPSHOT_NOT_FOUND' };
    }

    // Clear archive then replay segments from snapshot
    archive.reset();
    let restored = 0;

    for (const segment of snapshot.segmentsData) {
      const result = archive.archiveCompaction({
        batchId: segment.batchId,
        timestamp: segment.segmentTimestamp,
        sequenceRange: { ...segment.sequenceRange },
        entriesCount: segment.entriesCount,
        aggregatedMetrics: { ...segment.aggregatedMetrics }
      }, { nodeId: segment.nodeId, rootHash: segment.rootHash });

      if (result.archived) restored++;
    }

    this.snapshotMetrics.restoresPerformed++;

    return {
      restored: true,
      snapshotId,
      segmentsRestored: restored,
      snapshotTakenAt: snapshot.takenAt,
      isAuthoritative: false
    };
  }

  /**
   * Evict snapshots older than maxSnapshotAgeMs
   */
  evictOldSnapshots() {
    const cutoff = Date.now() - this.maxSnapshotAgeMs;
    let evicted = 0;
    const toEvict = [];

    // Identify old snapshots
    for (const [snapshotId, snapshot] of this.snapshots) {
      if (new Date(snapshot.takenAt).getTime() < cutoff) {
        toEvict.push(snapshotId);
      }
    }

    // Remove them
    for (const snapshotId of toEvict) {
      this.snapshots.delete(snapshotId);
      evicted++;
      this.snapshotMetrics.snapshotsEvicted++;
    }

    // Rebuild snapshot index
    if (evicted > 0) {
      this.snapshotIndex = this.snapshotIndex.filter(entry =>
        this.snapshots.has(entry.snapshotId)
      );
    }

    return { evicted, retained: this.snapshots.size };
  }

  /**
   * Get snapshot metrics
   */
  getSnapshotMetrics() {
    return {
      isAuthoritative: false,
      ...this.snapshotMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Check for alerts
   */
  checkAlerts() {
    const newAlerts = [];

    // NO_SNAPSHOT
    if (this.snapshots.size === 0) {
      const alert = Object.freeze({
        type: 'NO_SNAPSHOT',
        severity: 'WARNING',
        message: 'No snapshots have been taken',
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // SNAPSHOT_STALE
    if (this.snapshotMetrics.lastSnapshotTimestamp) {
      const lastSnapshotTime = new Date(this.snapshotMetrics.lastSnapshotTimestamp).getTime();
      if (Date.now() - lastSnapshotTime > this.maxSnapshotAgeMs) {
        const alert = Object.freeze({
          type: 'SNAPSHOT_STALE',
          severity: 'WARNING',
          value: Date.now() - lastSnapshotTime,
          threshold: this.maxSnapshotAgeMs,
          message: `Latest snapshot is older than max age (${this.maxSnapshotAgeMs}ms)`,
          timestamp: new Date().toISOString(),
          isAuthoritative: false
        });
        newAlerts.push(alert);
        this.alerts.push(alert);
      }
    }

    // SNAPSHOTS_CAPACITY_HIGH
    const capacityUsage = this.snapshots.size / this.maxSnapshots;
    if (capacityUsage > 0.9 && capacityUsage < 1) {
      const alert = Object.freeze({
        type: 'SNAPSHOTS_CAPACITY_HIGH',
        severity: 'WARNING',
        value: capacityUsage,
        threshold: 0.9,
        message: `Snapshot capacity at ${(capacityUsage * 100).toFixed(1)}% (${this.snapshots.size}/${this.maxSnapshots})`,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
      newAlerts.push(alert);
      this.alerts.push(alert);
    }

    // SNAPSHOTS_FULL
    if (capacityUsage >= 1) {
      const alert = Object.freeze({
        type: 'SNAPSHOTS_FULL',
        severity: 'CRITICAL',
        value: this.snapshots.size,
        threshold: this.maxSnapshots,
        message: `Snapshots are FULL: ${this.snapshots.size}/${this.maxSnapshots}`,
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
    this.snapshots.clear();
    this.snapshotIndex = [];
    this.snapshotMetrics = {
      snapshotsTaken: 0,
      snapshotsEvicted: 0,
      restoresPerformed: 0,
      lastSnapshotTimestamp: null,
      snapshotErrors: 0,
      createdAt: new Date().toISOString()
    };
    this.alerts = [];
  }

  /**
   * INTERNAL: Binary search insert into snapshot index
   */
  _insertIntoSnapshotIndex(ts, snapshotId) {
    let lo = 0, hi = this.snapshotIndex.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.snapshotIndex[mid].ts <= ts) lo = mid + 1;
      else hi = mid;
    }
    this.snapshotIndex.splice(lo, 0, { ts, snapshotId });
  }
}

module.exports = SnapshotManager;
