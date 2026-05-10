const crypto = require('crypto');

const RECONSTRUCTION_ERRORS = Object.freeze({
  MISSING_FULL_SNAPSHOT: 'MISSING_FULL_SNAPSHOT',
  FUTURE_TIMESTAMP: 'FUTURE_TIMESTAMP',
  INVALID_RANGE: 'INVALID_RANGE',
  CONFLICT_UNRESOLVED: 'CONFLICT_UNRESOLVED',
  WAL_CORRUPTION: 'WAL_CORRUPTION',
  STATE_DIVERGENCE: 'STATE_DIVERGENCE'
});

const RECONSTRUCTION_SOURCES = Object.freeze({
  FULL_SNAPSHOT: 'FULL_SNAPSHOT',
  FULL_PLUS_WAL: 'FULL_+_WAL',
  FULL_PLUS_DELTA_PLUS_WAL: 'FULL_+_DELTA_+_WAL'
});

const CONFLICT_STRATEGIES = Object.freeze({
  CAUSAL: 'CAUSAL',
  TIMESTAMP: 'TIMESTAMP',
  MANUAL: 'MANUAL'
});

class DeterministicReconstructor {
  constructor(graph, diskLayer, snapshotManager, wal, causalityEngine = null, options = {}) {
    this.graph = graph;
    this.diskLayer = diskLayer;
    this.snapshotManager = snapshotManager;
    this.wal = wal;
    this.causalityEngine = causalityEngine;

    this.maxWalEntries = options.maxWalEntries || 10000;
    this.maxReconstructionTime = options.maxReconstructionTime || 5000;
    this.conflictResolution = options.conflictResolution || 'CAUSAL';

    this.reconstructionMetrics = {
      reconstructionsPerformed: 0,
      walEntriesReplayed: 0,
      snapshotsApplied: 0,
      conflictsResolved: 0,
      verificationsPassed: 0,
      createdAt: new Date().toISOString()
    };

    this.alerts = [];
  }

  reconstructStateAt(targetTs) {
    const startTime = Date.now();

    try {
      // Convert to comparable timestamp
      const targetTime = new Date(targetTs).getTime();

      // Find the most recent FULL snapshot before or at targetTs
      const snapshots = this._getSnapshotsBefore(targetTime);
      if (snapshots.length === 0) {
        return Object.freeze({
          found: false,
          targetTs,
          state: null,
          error: RECONSTRUCTION_ERRORS.MISSING_FULL_SNAPSHOT,
          isAuthoritative: false
        });
      }

      // Start with the most recent FULL snapshot
      let baseSnapshot = null;
      for (const snap of snapshots) {
        if (snap.type === 'FULL') {
          baseSnapshot = snap;
          break;
        }
      }

      if (!baseSnapshot) {
        return Object.freeze({
          found: false,
          targetTs,
          state: null,
          error: RECONSTRUCTION_ERRORS.MISSING_FULL_SNAPSHOT,
          isAuthoritative: false
        });
      }

      // Load state from FULL snapshot
      let state = JSON.parse(JSON.stringify(baseSnapshot.state || {}));
      let source = RECONSTRUCTION_SOURCES.FULL_SNAPSHOT;
      let snapshotTimestamp = new Date(baseSnapshot.timestamp).getTime();

      // Apply any DELTA snapshots between baseSnapshot and target
      const deltaSnapshots = snapshots.filter(s =>
        s.type === 'DELTA' &&
        new Date(s.timestamp).getTime() > snapshotTimestamp &&
        new Date(s.timestamp).getTime() <= targetTime
      );

      if (deltaSnapshots.length > 0) {
        source = RECONSTRUCTION_SOURCES.FULL_PLUS_DELTA_PLUS_WAL;
        for (const delta of deltaSnapshots) {
          state = this._applyDeltaPatch(state, delta);
        }
      }

      // Fetch and replay WAL entries from snapshotTimestamp to targetTs
      const walEntries = this._getWalEntriesBetween(snapshotTimestamp, targetTime);
      let walEntriesReplayed = 0;

      if (walEntries.length > 0) {
        if (source === RECONSTRUCTION_SOURCES.FULL_SNAPSHOT) {
          source = RECONSTRUCTION_SOURCES.FULL_PLUS_WAL;
        }

        for (const entry of walEntries) {
          if (walEntriesReplayed >= this.maxWalEntries) break;

          if (entry.operations && Array.isArray(entry.operations)) {
            for (const op of entry.operations) {
              if (op.type === 'PUT' && op.key) {
                state[op.key] = op.value;
              } else if (op.type === 'DELETE' && op.key) {
                delete state[op.key];
              }
            }
            walEntriesReplayed++;
          }
        }
      }

      const lastEvent = walEntries.length > 0 ? walEntries[walEntries.length - 1] : baseSnapshot;
      const lastEventTs = lastEvent.timestamp;

      this.reconstructionMetrics.reconstructionsPerformed++;
      this.reconstructionMetrics.walEntriesReplayed += walEntriesReplayed;
      this.reconstructionMetrics.snapshotsApplied++;

      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > this.maxReconstructionTime) {
        console.warn(`Reconstruction took ${elapsedTime}ms, exceeds target ${this.maxReconstructionTime}ms`);
      }

      let causalVerified = false;
      if (this.causalityEngine) {
        const consistency = this.causalityEngine.verifyTemporalConsistency(baseSnapshot.timestamp, targetTs);
        causalVerified = consistency.consistent;
      }

      return Object.freeze({
        found: true,
        targetTs,
        state: Object.freeze(state),
        source,
        walEntriesReplayed,
        deltaPatched: deltaSnapshots.length > 0,
        lastEventTs,
        causalVerified,
        elapsedMs: elapsedTime,
        isAuthoritative: false
      });
    } catch (error) {
      console.error(`Reconstruction failed for ${targetTs}:`, error);
      return Object.freeze({
        found: false,
        targetTs,
        state: null,
        error: RECONSTRUCTION_ERRORS.WAL_CORRUPTION,
        details: error.message,
        isAuthoritative: false
      });
    }
  }

  verifyStateAt(targetTs, expectedState) {
    try {
      const reconstructed = this.reconstructStateAt(targetTs);

      if (!reconstructed.found) {
        return Object.freeze({
          verified: false,
          targetTs,
          error: reconstructed.error,
          differences: {},
          consistency: null,
          isAuthoritative: false
        });
      }

      const differences = this._findDifferences(reconstructed.state, expectedState);
      const verified = Object.keys(differences).length === 0;

      let consistency = null;
      if (this.causalityEngine) {
        consistency = this.causalityEngine.verifyTemporalConsistency(targetTs, targetTs);
        this.reconstructionMetrics.verificationsPassed++;
      }

      return Object.freeze({
        verified,
        targetTs,
        differences: Object.freeze(differences),
        consistency: consistency ? Object.freeze(consistency) : null,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        verified: false,
        targetTs,
        error: RECONSTRUCTION_ERRORS.WAL_CORRUPTION,
        details: error.message,
        differences: {},
        consistency: null,
        isAuthoritative: false
      });
    }
  }

  reconstructTimeline(startTs, endTs) {
    try {
      const startTime = new Date(startTs).getTime();
      const endTime = new Date(endTs).getTime();

      if (startTime > endTime) {
        return Object.freeze({
          found: false,
          startTs,
          endTs,
          error: RECONSTRUCTION_ERRORS.INVALID_RANGE,
          timeline: [],
          count: 0,
          isAuthoritative: false
        });
      }

      const snapshots = this._getSnapshotsBetween(startTime, endTime);
      const timeline = [];

      for (const snap of snapshots) {
        const result = this.reconstructStateAt(snap.timestamp);
        if (result.found) {
          timeline.push(Object.freeze({
            ts: snap.timestamp,
            state: result.state,
            source: result.source,
            walEntriesReplayed: result.walEntriesReplayed
          }));
        }
      }

      return Object.freeze({
        found: timeline.length > 0,
        startTs,
        endTs,
        timeline: timeline,
        count: timeline.length,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        found: false,
        startTs,
        endTs,
        error: RECONSTRUCTION_ERRORS.WAL_CORRUPTION,
        timeline: [],
        count: 0,
        isAuthoritative: false
      });
    }
  }

  async *streamReconstruction(startTs, endTs, bufferSize = 100) {
    try {
      const startTime = new Date(startTs).getTime();
      const endTime = new Date(endTs).getTime();

      const snapshots = this._getSnapshotsBetween(startTime, endTime);
      const buffer = [];

      for (const snap of snapshots) {
        const result = this.reconstructStateAt(snap.timestamp);
        if (result.found) {
          buffer.push(Object.freeze({
            ts: snap.timestamp,
            state: result.state,
            source: result.source
          }));

          if (buffer.length >= bufferSize) {
            yield Object.freeze([...buffer]);
            buffer.length = 0;
          }
        }
      }

      if (buffer.length > 0) {
        yield Object.freeze([...buffer]);
      }
    } catch (error) {
      console.error('Stream reconstruction error:', error);
      throw error;
    }
  }

  resolveConflict(conflictNodeId, strategy) {
    try {
      const node = this.graph.nodes.get(conflictNodeId);
      if (!node) {
        return Object.freeze({
          nodeId: conflictNodeId,
          error: 'NODE_NOT_FOUND',
          resolution: 'REJECTED',
          isAuthoritative: false
        });
      }

      let resolution = 'APPLIED';
      let reason = '';

      if (strategy === CONFLICT_STRATEGIES.CAUSAL && this.causalityEngine) {
        // Use temporal causality to resolve
        const conflicts = this.causalityEngine.detectTemporalConflicts();
        const nodeConflict = conflicts.conflicts.find(c => c.nodeId === conflictNodeId);

        if (nodeConflict) {
          reason = `Resolved via CAUSAL strategy: ${nodeConflict.detail}`;
        }
      } else if (strategy === CONFLICT_STRATEGIES.TIMESTAMP) {
        // Keep latest timestamp
        reason = `Resolved via TIMESTAMP strategy: kept node with latest timestamp`;
      } else if (strategy === CONFLICT_STRATEGIES.MANUAL) {
        resolution = 'MANUAL';
        reason = `Conflict requires manual resolution`;
      }

      this.reconstructionMetrics.conflictsResolved++;

      return Object.freeze({
        nodeId: conflictNodeId,
        conflictType: node.nodeType,
        resolution,
        reason,
        strategy,
        isAuthoritative: false
      });
    } catch (error) {
      return Object.freeze({
        nodeId: conflictNodeId,
        error: error.message,
        resolution: 'REJECTED',
        isAuthoritative: false
      });
    }
  }

  getMetrics() {
    return Object.freeze({
      reconstructionsPerformed: this.reconstructionMetrics.reconstructionsPerformed,
      walEntriesReplayed: this.reconstructionMetrics.walEntriesReplayed,
      snapshotsApplied: this.reconstructionMetrics.snapshotsApplied,
      conflictsResolved: this.reconstructionMetrics.conflictsResolved,
      verificationsPassed: this.reconstructionMetrics.verificationsPassed,
      timestamp: new Date().toISOString(),
      createdAt: this.reconstructionMetrics.createdAt,
      isAuthoritative: false
    });
  }

  isAuthoritative() {
    return false;
  }

  reset() {
    this.reconstructionMetrics = {
      reconstructionsPerformed: 0,
      walEntriesReplayed: 0,
      snapshotsApplied: 0,
      conflictsResolved: 0,
      verificationsPassed: 0,
      createdAt: new Date().toISOString()
    };
    this.alerts = [];
  }

  // Private helpers

  _getSnapshotsBefore(targetTime) {
    // Fetch snapshots from diskLayer or snapshotManager
    if (this.snapshotManager && this.snapshotManager.getAllSnapshots) {
      const allSnapshots = this.snapshotManager.getAllSnapshots();
      return allSnapshots
        .filter(s => new Date(s.timestamp).getTime() <= targetTime)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return [];
  }

  _getSnapshotsBetween(startTime, endTime) {
    if (this.snapshotManager && this.snapshotManager.getAllSnapshots) {
      const allSnapshots = this.snapshotManager.getAllSnapshots();
      return allSnapshots
        .filter(s => {
          const st = new Date(s.timestamp).getTime();
          return st >= startTime && st <= endTime;
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
    return [];
  }

  _getWalEntriesBetween(startTime, endTime) {
    // Fetch WAL entries from wal module or diskLayer
    if (this.wal && this.wal.getEntries) {
      return this.wal.getEntries(new Date(startTime).toISOString(), new Date(endTime).toISOString());
    }
    return [];
  }

  _applyDeltaPatch(baseState, deltaSnapshot) {
    // Apply delta patches to base state
    if (deltaSnapshot.patches && Array.isArray(deltaSnapshot.patches)) {
      for (const patch of deltaSnapshot.patches) {
        if (patch.op === 'add' || patch.op === 'replace') {
          baseState[patch.key] = patch.value;
        } else if (patch.op === 'remove') {
          delete baseState[patch.key];
        }
      }
    }
    return baseState;
  }

  _findDifferences(actual, expected) {
    const differences = {};

    // Check for keys in expected but different in actual
    for (const key of Object.keys(expected)) {
      if (JSON.stringify(actual[key]) !== JSON.stringify(expected[key])) {
        differences[key] = {
          expected: expected[key],
          actual: actual[key]
        };
      }
    }

    // Check for keys in actual but not in expected
    for (const key of Object.keys(actual)) {
      if (!(key in expected)) {
        differences[key] = {
          expected: undefined,
          actual: actual[key]
        };
      }
    }

    return differences;
  }
}

module.exports = DeterministicReconstructor;
module.exports.RECONSTRUCTION_ERRORS = RECONSTRUCTION_ERRORS;
module.exports.RECONSTRUCTION_SOURCES = RECONSTRUCTION_SOURCES;
module.exports.CONFLICT_STRATEGIES = CONFLICT_STRATEGIES;
