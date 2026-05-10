/**
 * PHASE 10.3 — ProbabilisticEvolutionGraph
 * Multi-Branch Probabilistic Evolution Graph
 * ~340 LOC
 */

'use strict';

class ProbabilisticEvolutionGraph {
  constructor(allTrajectories = [], options = {}) {
    this.allTrajectories = Object.freeze([...allTrajectories]);
    this.graphOptions = options;

    this.nodeCount = 0;
    this.edgeCount = 0;
    this.graph = null;

    this.graphMetrics = {
      graphsBuilt: 0,
      analysesComputed: 0,
      pathsIdentified: 0,
      createdAt: new Date().toISOString()
    };

    this._buildGraph();
  }

  // ============================================================================
  // Construction
  // ============================================================================

  _buildGraph() {
    try {
      const nodes = new Map();
      const edges = [];

      // Extract nodes from trajectories
      for (const traj of this.allTrajectories) {
        if (traj.states && Array.isArray(traj.states)) {
          for (const state of traj.states) {
            const nodeId = `node_${traj.id}_${state.step}`;
            nodes.set(nodeId, {
              id: nodeId,
              value: state.value,
              step: state.step,
              trajectoryId: traj.id
            });

            // Add edge from previous state
            if (state.step > 0) {
              const prevId = `node_${traj.id}_${state.step - 1}`;
              edges.push({
                source: prevId,
                target: nodeId,
                weight: 1.0,
                trajectoryId: traj.id
              });
            }
          }
        }
      }

      // Add convergence edges between trajectories
      this._addConvergenceEdges(nodes, edges);

      this.graph = Object.freeze({
        nodes: Object.freeze(new Map(nodes)),
        edges: Object.freeze([...edges]),
        nodeCount: nodes.size,
        edgeCount: edges.length
      });

      this.nodeCount = nodes.size;
      this.edgeCount = edges.length;
      this.graphMetrics.graphsBuilt++;

    } catch (err) {
      this.graph = null;
    }
  }

  _addConvergenceEdges(nodes, edges) {
    const steps = new Map();

    // Group nodes by step
    for (const [id, node] of nodes) {
      if (!steps.has(node.step)) {
        steps.set(node.step, []);
      }
      steps.get(node.step).push(id);
    }

    // Add convergence edges between trajectories at same step
    for (const [step, nodeIds] of steps) {
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          edges.push({
            source: nodeIds[i],
            target: nodeIds[j],
            weight: 0.3,
            type: 'CONVERGENCE'
          });
        }
      }
    }
  }

  // ============================================================================
  // Main API: buildEvolutionGraph
  // ============================================================================

  buildEvolutionGraph() {
    const startTime = Date.now();

    try {
      return Object.freeze({
        graph: this.graph,
        nodeCount: this.nodeCount,
        edgeCount: this.edgeCount,
        trajectoryCount: this.allTrajectories.length,
        graphDensity: this._computeGraphDensity(),
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
  // Main API: assignBranchProbabilities
  // ============================================================================

  assignBranchProbabilities() {
    const startTime = Date.now();

    try {
      if (!this.graph) {
        return Object.freeze({
          branchProbabilities: [],
          isAuthoritative: false
        });
      }

      const probabilities = [];

      for (const traj of this.allTrajectories) {
        probabilities.push({
          trajectoryId: traj.id,
          probability: 1.0 / this.allTrajectories.length,
          weight: traj.variance || 0.5,
          likelihood: this._computeLikelihood(traj)
        });
      }

      // Normalize
      const total = probabilities.reduce((sum, p) => sum + p.likelihood, 0);
      for (const p of probabilities) {
        p.normalizedProbability = total > 0 ? p.likelihood / total : 1.0 / probabilities.length;
      }

      this.graphMetrics.analysesComputed++;

      return Object.freeze({
        branchProbabilities: Object.freeze([...probabilities]),
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        branchProbabilities: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computeLikelihoodMeasures
  // ============================================================================

  computeLikelihoodMeasures() {
    try {
      if (!this.graph) {
        return Object.freeze({
          likelihoods: [],
          isAuthoritative: false
        });
      }

      const likelihoods = [];

      for (const traj of this.allTrajectories) {
        const likelihood = this._computeLikelihood(traj);
        likelihoods.push({
          trajectoryId: traj.id,
          likelihood: likelihood,
          probability: likelihood / this.allTrajectories.length
        });
      }

      return Object.freeze({
        likelihoods: Object.freeze([...likelihoods]),
        averageLikelihood: likelihoods.reduce((sum, l) => sum + l.likelihood, 0) / likelihoods.length,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        likelihoods: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: identifyHighProbabilityPaths
  // ============================================================================

  identifyHighProbabilityPaths() {
    const startTime = Date.now();

    try {
      const probs = [];

      for (const traj of this.allTrajectories) {
        probs.push({
          trajectoryId: traj.id,
          probability: this._computeLikelihood(traj),
          finalState: traj.finalValue || 0.5
        });
      }

      // Sort by probability
      const sorted = probs.sort((a, b) => b.probability - a.probability);
      const highProbPaths = sorted.slice(0, Math.ceil(sorted.length * 0.2));

      this.graphMetrics.pathsIdentified += highProbPaths.length;

      return Object.freeze({
        highProbabilityPaths: Object.freeze([...highProbPaths]),
        count: highProbPaths.length,
        averageProbability: highProbPaths.reduce((sum, p) => sum + p.probability, 0) / highProbPaths.length,
        elapsedMs: Date.now() - startTime,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        highProbabilityPaths: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: computePathDivergence
  // ============================================================================

  computePathDivergence() {
    try {
      let totalDivergence = 0;
      let pairCount = 0;

      for (let i = 0; i < this.allTrajectories.length; i++) {
        for (let j = i + 1; j < this.allTrajectories.length; j++) {
          const div = this._computeTrajDivergence(this.allTrajectories[i], this.allTrajectories[j]);
          totalDivergence += div;
          pairCount++;
        }
      }

      const averageDivergence = pairCount > 0 ? totalDivergence / pairCount : 0;

      return Object.freeze({
        averageDivergence: averageDivergence,
        maxDivergence: 1.0,
        minDivergence: 0.0,
        trajectoryCount: this.allTrajectories.length,
        pairComparisons: pairCount,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        averageDivergence: 0.0,
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: findConvergencePoints
  // ============================================================================

  findConvergencePoints() {
    try {
      const convergencePoints = [];

      if (!this.graph || !this.graph.nodes) {
        return Object.freeze({
          convergencePoints: [],
          isAuthoritative: false
        });
      }

      // Group nodes by step
      const byStep = new Map();
      for (const [, node] of this.graph.nodes) {
        if (!byStep.has(node.step)) {
          byStep.set(node.step, []);
        }
        byStep.get(node.step).push(node);
      }

      // Identify convergence
      for (const [step, nodes] of byStep) {
        if (nodes.length > 1) {
          const values = nodes.map(n => n.value);
          const variance = values.reduce((sum, v) => sum + Math.pow(v - values[0], 2), 0) / values.length;

          if (variance < 0.1) {
            convergencePoints.push({
              step: step,
              nodeCount: nodes.length,
              convergenceStrength: 1.0 - variance,
              averageValue: values.reduce((a, b) => a + b, 0) / values.length
            });
          }
        }
      }

      return Object.freeze({
        convergencePoints: Object.freeze([...convergencePoints]),
        totalConvergences: convergencePoints.length,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        convergencePoints: [],
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Main API: getEvolutionGraph
  // ============================================================================

  getEvolutionGraph() {
    return Object.freeze({
      graph: this.graph,
      nodeCount: this.nodeCount,
      edgeCount: this.edgeCount,
      isAuthoritative: false
    });
  }

  // ============================================================================
  // Main API: getScenarioDistribution
  // ============================================================================

  getScenarioDistribution() {
    try {
      const distribution = {};

      for (const traj of this.allTrajectories) {
        const prob = this._computeLikelihood(traj);
        distribution[traj.id] = prob;
      }

      return Object.freeze({
        scenarioProbabilities: distribution,
        scenarioCount: this.allTrajectories.length,
        isAuthoritative: false
      });

    } catch (err) {
      return Object.freeze({
        scenarioProbabilities: {},
        error: err.message,
        isAuthoritative: false
      });
    }
  }

  // ============================================================================
  // Private Utilities
  // ============================================================================

  _computeGraphDensity() {
    if (!this.graph) return 0;
    const maxEdges = this.nodeCount * (this.nodeCount - 1) / 2;
    return maxEdges > 0 ? this.edgeCount / maxEdges : 0;
  }

  _computeLikelihood(trajectory) {
    if (!trajectory) return 0;
    const variance = trajectory.variance || 0.5;
    return Math.exp(-variance * 0.5);
  }

  _computeTrajDivergence(traj1, traj2) {
    if (!traj1 || !traj2) return 0;
    const s1 = traj1.states || [];
    const s2 = traj2.states || [];
    const minLen = Math.min(s1.length, s2.length);

    if (minLen === 0) return 0;

    let divergence = 0;
    for (let i = 0; i < minLen; i++) {
      const v1 = s1[i].value || 0;
      const v2 = s2[i].value || 0;
      divergence += Math.abs(v1 - v2);
    }

    return divergence / minLen;
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

module.exports = ProbabilisticEvolutionGraph;
