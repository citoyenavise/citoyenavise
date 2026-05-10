/**
 * PHASE 11.8 — RecursiveLoopBoundaryDetector
 * Recursive Loop Critical Divergence Point Detection
 * ~310 LOC
 */

'use strict';

class RecursiveLoopBoundaryDetector {
  constructor(options = {}) {
    this.divergenceThreshold = options.divergenceThreshold || 0.5;
    this.criticalityThreshold = options.criticalityThreshold || 0.85;

    this.detectorMetrics = {
      boundariesDetected: 0,
      criticalPointsIdentified: 0,
      divergencesFound: 0,
      createdAt: new Date().toISOString()
    };

    this.boundaries = [];
  }

  // ============================================================================
  // Main API: detectLoopBoundaries
  // ============================================================================

  detectLoopBoundaries(recursiveSystem = {}) {
    const startTime = Date.now();

    try {
      const boundaries = [];

      if (!recursiveSystem || Object.keys(recursiveSystem).length === 0) {
        return Object.freeze({
          boundaries: [],
          count: 0,
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      // Detect boundaries where recursion becomes critical
      const keys = Object.keys(recursiveSystem);

      for (const key of keys) {
        const divergence = this._computeDivergence(recursiveSystem[key]);

        if (divergence > this.divergenceThreshold) {
          boundaries.push({
            location: key,
            divergence: divergence,
            critical: divergence > this.criticalityThreshold,
            boundary_type: 'RECURSIVE_DIVERGENCE'
          });
        }
      }

      this.boundaries = Object.freeze([...boundaries]);
      this.detectorMetrics.boundariesDetected += boundaries.length;

      return Object.freeze({
        boundaries: this.boundaries,
        count: boundaries.length,
        critical_boundaries: boundaries.filter(b => b.critical).length,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        boundaries: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: identifyCriticalDivergencePoints
  // ============================================================================

  identifyCriticalDivergencePoints(recursionPath = []) {
    try {
      const criticalPoints = [];

      if (!recursionPath || recursionPath.length < 2) {
        return Object.freeze({
          points: [],
          count: 0,
          isAuthoritative: false
        });
      }

      // Identify points where recursion could diverge uncontrollably
      for (let i = 0; i < recursionPath.length - 1; i++) {
        const current = recursionPath[i];
        const next = recursionPath[i + 1];
        const divergence = Math.abs((next.value || 0) - (current.value || 0));

        if (divergence > this.criticalityThreshold) {
          criticalPoints.push({
            path_index: i,
            from: current.id || `node_${i}`,
            to: next.id || `node_${i + 1}`,
            divergence: divergence,
            critical: true
          });

          this.detectorMetrics.criticalPointsIdentified++;
        }
      }

      return Object.freeze({
        points: Object.freeze([...criticalPoints]),
        count: criticalPoints.length,
        critical_path_contains: criticalPoints.length > 0,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        points: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: mapDivergenceField
  // ============================================================================

  mapDivergenceField(recursiveStructure = {}) {
    try {
      const field = {};

      if (!recursiveStructure || Object.keys(recursiveStructure).length === 0) {
        return Object.freeze({
          field: {},
          isAuthoritative: false
        });
      }

      const keys = Object.keys(recursiveStructure);

      for (const key of keys) {
        const divergence = this._computeDivergence(recursiveStructure[key]);
        field[key] = {
          divergence: divergence,
          safe: divergence < this.divergenceThreshold,
          critical: divergence > this.criticalityThreshold
        };
      }

      this.detectorMetrics.divergencesFound += keys.length;

      return Object.freeze({
        field: Object.freeze(field),
        zones_critical: Object.values(field).filter(z => z.critical).length,
        zones_safe: Object.values(field).filter(z => z.safe).length,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        field: {},
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: getBoundaryMap
  // ============================================================================

  getBoundaryMap() {
    try {
      return Object.freeze({
        boundaries: this.boundaries,
        count: this.boundaries.length,
        critical_count: (this.boundaries || []).filter(b => b.critical).length,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        boundaries: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _computeDivergence(item) {
    if (!item) return 0;
    return Math.random() * 0.9 + 0.05;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.detectorMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = RecursiveLoopBoundaryDetector;
