/**
 * ImmutableSnapshotManager.js - Manage immutable snapshots of constitutional data
 * Immutability & Sealing - PHASE 1.2 STEP 8
 *
 * Responsibility: Create and manage immutable snapshots
 * - Create frozen snapshots of constitutional data
 * - Track snapshot versions
 * - Provide safe read-only access
 * - Validate snapshot integrity
 */

class ImmutableSnapshotManager {
  constructor(options = {}) {
    this.snapshots = new Map();
    this.snapshotHistory = [];
    this.snapshotVersions = new Map();

    this.config = {
      autoSnapshot: options.autoSnapshot !== false,
      maxSnapshotHistory: options.maxSnapshotHistory || 100,
      versionTracking: options.versionTracking !== false,
      timestampSnapshots: options.timestampSnapshots !== false
    };

    this.metrics = {
      snapshotsCreated: 0,
      snapshotReads: 0,
      snapshotVersions: 0,
      averageSnapshotSize_bytes: 0
    };
  }

  /**
   * Create immutable snapshot
   */
  createSnapshot(snapshotName, data) {
    const startTime = Date.now();

    // Deep clone the data
    const cloned = JSON.parse(JSON.stringify(data));

    // Deep freeze the cloned data
    this._deepFreeze(cloned);

    const snapshotId = `snapshot_${Date.now()}`;
    const snapshot = {
      snapshotId,
      snapshotName,
      data: cloned,
      createdAt: new Date().toISOString(),
      createdTimestamp: Date.now(),
      size_bytes: JSON.stringify(cloned).length,
      accessCount: 0,
      lastAccessedAt: null,
      hash: this._hashSnapshot(cloned),
      frozen: Object.isFrozen(cloned),
      version: 1
    };

    // Store snapshot
    this.snapshots.set(snapshotName, snapshot);

    // Track version
    if (!this.snapshotVersions.has(snapshotName)) {
      this.snapshotVersions.set(snapshotName, []);
    }
    this.snapshotVersions.get(snapshotName).push({
      version: 1,
      snapshotId,
      createdAt: snapshot.createdAt
    });

    // Add to history
    this.snapshotHistory.push({
      action: 'CREATE',
      snapshotName,
      snapshotId,
      timestamp: new Date().toISOString(),
      duration_ms: Date.now() - startTime
    });

    if (this.snapshotHistory.length > this.config.maxSnapshotHistory) {
      this.snapshotHistory.shift();
    }

    this.metrics.snapshotsCreated++;
    this.metrics.snapshotVersions = this._countTotalVersions();

    return {
      success: true,
      snapshotId,
      snapshotName,
      createdAt: snapshot.createdAt,
      size_bytes: snapshot.size_bytes,
      frozen: snapshot.frozen
    };
  }

  /**
   * Get snapshot (read-only access)
   */
  getSnapshot(snapshotName) {
    const snapshot = this.snapshots.get(snapshotName);

    if (!snapshot) {
      return {
        success: false,
        reason: `Snapshot not found: ${snapshotName}`
      };
    }

    // Update access info
    snapshot.accessCount++;
    snapshot.lastAccessedAt = new Date().toISOString();
    this.metrics.snapshotReads++;

    // Return frozen data
    return {
      success: true,
      snapshotName,
      snapshotId: snapshot.snapshotId,
      data: snapshot.data, // Already frozen
      createdAt: snapshot.createdAt,
      frozen: snapshot.frozen,
      accessCount: snapshot.accessCount
    };
  }

  /**
   * Deep freeze object
   */
  _deepFreeze(object) {
    Object.freeze(object);
    Object.preventExtensions(object);

    for (const key of Object.getOwnPropertyNames(object)) {
      if (object[key] !== null &&
          (typeof object[key] === 'object' || typeof object[key] === 'function') &&
          !Object.isFrozen(object[key])) {
        this._deepFreeze(object[key]);
      }
    }

    return object;
  }

  /**
   * Hash snapshot for integrity verification
   */
  _hashSnapshot(data) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  /**
   * Verify snapshot integrity
   */
  verifySnapshot(snapshotName) {
    const snapshot = this.snapshots.get(snapshotName);

    if (!snapshot) {
      return {
        verified: false,
        reason: `Snapshot not found: ${snapshotName}`
      };
    }

    const currentHash = this._hashSnapshot(snapshot.data);
    const hashMatch = currentHash === snapshot.hash;

    return {
      verified: hashMatch,
      snapshotName,
      snapshotId: snapshot.snapshotId,
      expected_hash: snapshot.hash,
      current_hash: currentHash,
      frozen: Object.isFrozen(snapshot.data),
      integrity: hashMatch && snapshot.frozen ? 'VALID' : 'COMPROMISED'
    };
  }

  /**
   * Verify all snapshots
   */
  verifyAllSnapshots() {
    const results = [];

    for (const [snapshotName] of this.snapshots) {
      results.push(this.verifySnapshot(snapshotName));
    }

    const allValid = results.every(r => r.integrity === 'VALID');

    return {
      timestamp: new Date().toISOString(),
      snapshotsChecked: results.length,
      snapshotsValid: results.filter(r => r.integrity === 'VALID').length,
      snapshotsCompromised: results.filter(r => r.integrity === 'COMPROMISED').length,
      allValid,
      results
    };
  }

  /**
   * Get snapshot metadata
   */
  getSnapshotMetadata(snapshotName) {
    const snapshot = this.snapshots.get(snapshotName);

    if (!snapshot) {
      return null;
    }

    return {
      snapshotName,
      snapshotId: snapshot.snapshotId,
      createdAt: snapshot.createdAt,
      size_bytes: snapshot.size_bytes,
      accessCount: snapshot.accessCount,
      lastAccessedAt: snapshot.lastAccessedAt,
      frozen: snapshot.frozen,
      version: snapshot.version,
      hash: snapshot.hash
    };
  }

  /**
   * Get all snapshot metadata
   */
  getAllSnapshotMetadata() {
    const metadata = [];

    for (const [snapshotName, snapshot] of this.snapshots) {
      metadata.push({
        snapshotName,
        snapshotId: snapshot.snapshotId,
        createdAt: snapshot.createdAt,
        size_bytes: snapshot.size_bytes,
        accessCount: snapshot.accessCount,
        frozen: snapshot.frozen,
        version: snapshot.version
      });
    }

    return metadata;
  }

  /**
   * Get snapshot version history
   */
  getSnapshotVersionHistory(snapshotName) {
    return this.snapshotVersions.get(snapshotName) || [];
  }

  /**
   * Count total versions
   */
  _countTotalVersions() {
    let total = 0;

    for (const versions of this.snapshotVersions.values()) {
      total += versions.length;
    }

    return total;
  }

  /**
   * Get snapshot history
   */
  getSnapshotHistory(limit = 50) {
    return this.snapshotHistory.slice(-limit);
  }

  /**
   * Calculate average snapshot size
   */
  _updateAverageSize() {
    if (this.snapshots.size === 0) {
      this.metrics.averageSnapshotSize_bytes = 0;
      return;
    }

    let totalSize = 0;

    for (const snapshot of this.snapshots.values()) {
      totalSize += snapshot.size_bytes;
    }

    this.metrics.averageSnapshotSize_bytes = Math.round(totalSize / this.snapshots.size);
  }

  /**
   * Get metrics
   */
  getMetrics() {
    this._updateAverageSize();

    return {
      timestamp: new Date().toISOString(),
      ...this.metrics,
      snapshotsActive: this.snapshots.size
    };
  }

  /**
   * Generate snapshot report
   */
  generateSnapshotReport() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        snapshotsCreated: this.metrics.snapshotsCreated,
        snapshotsActive: this.snapshots.size,
        totalVersions: this.metrics.snapshotVersions,
        snapshotReads: this.metrics.snapshotReads
      },
      integrity: this.verifyAllSnapshots(),
      metadata: this.getAllSnapshotMetadata(),
      metrics: this.getMetrics(),
      recentHistory: this.getSnapshotHistory(10)
    };
  }

  /**
   * List all snapshots
   */
  listSnapshots() {
    const list = [];

    for (const snapshotName of this.snapshots.keys()) {
      list.push(snapshotName);
    }

    return list;
  }

  /**
   * Delete snapshot (if needed for cleanup)
   */
  deleteSnapshot(snapshotName) {
    if (this.snapshots.has(snapshotName)) {
      this.snapshots.delete(snapshotName);

      this.snapshotHistory.push({
        action: 'DELETE',
        snapshotName,
        timestamp: new Date().toISOString()
      });

      return { success: true, deleted: snapshotName };
    }

    return { success: false, reason: `Snapshot not found: ${snapshotName}` };
  }

  /**
   * Reset manager
   */
  reset() {
    this.snapshots.clear();
    this.snapshotHistory = [];
    this.snapshotVersions.clear();
    this.metrics = {
      snapshotsCreated: 0,
      snapshotReads: 0,
      snapshotVersions: 0,
      averageSnapshotSize_bytes: 0
    };

    return { reset: true };
  }
}

module.exports = ImmutableSnapshotManager;
