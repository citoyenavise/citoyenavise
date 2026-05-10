/**
 * PHASE 11.7 — RecursiveObserverGraph
 * Nested & Recursive Observation Layer Modeling
 * ~310 LOC
 */

'use strict';

class RecursiveObserverGraph {
  constructor(options = {}) {
    this.maxDepth = options.maxDepth || 7;
    this.convergenceThreshold = options.convergenceThreshold || 0.99;

    this.graphMetrics = {
      graphsBuilt: 0,
      levelsAnalyzed: 0,
      recursionLoopsDetected: 0,
      createdAt: new Date().toISOString()
    };

    this.graph = null;
  }

  // ============================================================================
  // Main API: buildRecursiveObserverGraph
  // ============================================================================

  buildRecursiveObserverGraph(baseObservers = [], maxDepth = null) {
    const startTime = Date.now();
    const depth = Math.min(maxDepth || this.maxDepth, this.maxDepth);

    try {
      const layers = [];

      if (!baseObservers || baseObservers.length === 0) {
        return Object.freeze({
          graph: null,
          depth: 0,
          layers: [],
          elapsedMs: Date.now() - startTime,
          isAuthoritative: false
        });
      }

      // Build recursive observation layers
      let currentLayer = baseObservers;

      for (let level = 0; level < depth; level++) {
        const metaObservers = this._buildMetaObserverLayer(currentLayer, level);

        layers.push({
          level: level,
          observer_count: metaObservers.length,
          observers: Object.freeze([...metaObservers]),
          converged: false
        });

        currentLayer = metaObservers;

        if (metaObservers.length === 0) break;
      }

      this.graph = Object.freeze({
        layers: Object.freeze([...layers]),
        max_depth: depth,
        timestamp: new Date().toISOString()
      });

      this.graphMetrics.graphsBuilt++;
      this.graphMetrics.levelsAnalyzed += layers.length;

      return Object.freeze({
        graph: this.graph,
        depth: layers.length,
        layers: layers.length,
        no_single_truth_layer: true,
        all_levels_valid: true,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        graph: null,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: detectRecursionInstability
  // ============================================================================

  detectRecursionInstability(observerGraph) {
    try {
      if (!observerGraph) {
        return Object.freeze({
          unstable: false,
          isAuthoritative: false
        });
      }

      const layers = observerGraph.layers || [];
      if (layers.length < 2) {
        return Object.freeze({
          unstable: false,
          isAuthoritative: false
        });
      }

      // Check for self-referential instability
      let instabilities = 0;

      for (let i = 0; i < layers.length - 1; i++) {
        const current = layers[i];
        const next = layers[i + 1];

        if (next.observer_count === current.observer_count) {
          instabilities++;
        }
      }

      const unstable = instabilities > layers.length / 2;

      if (unstable) {
        this.graphMetrics.recursionLoopsDetected++;
      }

      return Object.freeze({
        unstable: unstable,
        instabilities_detected: instabilities,
        self_referential: unstable,
        stable_recursion: !unstable,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        unstable: false,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: measureRecursionConvergence
  // ============================================================================

  measureRecursionConvergence(observerGraph) {
    try {
      if (!observerGraph) {
        return Object.freeze({
          convergent: false,
          convergenceScore: 0,
          isAuthoritative: false
        });
      }

      const layers = observerGraph.layers || [];
      if (layers.length < 2) {
        return Object.freeze({
          convergent: false,
          convergenceScore: 0,
          isAuthoritative: false
        });
      }

      let similarity = 0;
      let comparisons = 0;

      for (let i = 0; i < layers.length - 1; i++) {
        const current = layers[i].observer_count;
        const next = layers[i + 1].observer_count;
        const maxCount = Math.max(current, next);

        if (maxCount > 0) {
          similarity += Math.min(current, next) / maxCount;
          comparisons++;
        }
      }

      const convergenceScore = comparisons > 0 ? similarity / comparisons : 0;
      const convergent = convergenceScore > this.convergenceThreshold;

      return Object.freeze({
        convergent: convergent,
        convergenceScore: convergenceScore,
        no_single_converged_truth: !convergent,
        plurality_maintained: !convergent,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        convergent: false,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: identifyRecursiveLoops
  // ============================================================================

  identifyRecursiveLoops(observerGraph) {
    try {
      if (!observerGraph) {
        return Object.freeze({
          loops: [],
          count: 0,
          isAuthoritative: false
        });
      }

      const loops = [];
      const layers = observerGraph.layers || [];

      for (let i = 0; i < layers.length; i++) {
        for (let j = i + 1; j < Math.min(i + 4, layers.length); j++) {
          if (layers[i].observer_count === layers[j].observer_count) {
            loops.push({
              from_level: i,
              to_level: j,
              loop_detected: true,
              self_referential: true
            });
          }
        }
      }

      return Object.freeze({
        loops: Object.freeze([...loops]),
        count: loops.length,
        recursive_loops_present: loops.length > 0,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        loops: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: getRecursiveGraph
  // ============================================================================

  getRecursiveGraph() {
    try {
      if (!this.graph) {
        return Object.freeze({
          graph: null,
          isAuthoritative: false
        });
      }

      return Object.freeze({
        graph: this.graph,
        depth: this.graph.layers.length,
        total_observers: this.graph.layers.reduce((sum, l) => sum + l.observer_count, 0),
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        graph: null,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _buildMetaObserverLayer(observers, level) {
    if (!observers || observers.length === 0) return [];

    const metaCount = Math.max(1, Math.floor(observers.length * (0.8 + Math.random() * 0.2)));
    const metaObservers = [];

    for (let i = 0; i < metaCount; i++) {
      metaObservers.push({
        id: `meta_observer_l${level}_${i}`,
        level: level,
        type: 'META_OBSERVER',
        observes: observers.length
      });
    }

    return metaObservers;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  getMetrics() {
    return Object.freeze({
      ...this.graphMetrics,
      timestamp: new Date().toISOString()
    });
  }

  isAuthoritative() {
    return false;
  }
}

module.exports = RecursiveObserverGraph;
