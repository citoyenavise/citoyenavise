/**
 * PHASE 10.2 — SystemInstabilityGraph
 * Build instability graph and identify failure paths
 */

class SystemInstabilityGraph {
  constructor(allAnomalies, options = {}) {
    this.allAnomalies = allAnomalies || {};
    this.topologyDepth = options.topologyAnalysisDepth || 5;

    this.metrics = {
      graphsBuilt: 0,
      pathsAnalyzed: 0,
      createdAt: new Date().toISOString()
    };

    this.graph = null;
    this.isAuthoritative = false;
  }

  // Build instability graph from anomalies
  buildInstabilityGraph(
    causalAnomalies = {},
    structuralAnomalies = {},
    observerAnomalies = {},
    temporalAnomalies = {}
  ) {
    const nodes = [];
    const edges = [];
    const nodeIds = new Set();

    const anomalyTypes = {
      causal: causalAnomalies.count || 0,
      structural: structuralAnomalies.count || 0,
      observer: observerAnomalies.count || 0,
      temporal: temporalAnomalies.count || 0
    };

    let nodeId = 0;

    if (anomalyTypes.causal > 0) {
      const id = `CAUSAL_${nodeId++}`;
      nodeIds.add(id);
      nodes.push({
        id,
        type: 'CAUSAL_RUPTURE',
        severity: Math.min(1.0, anomalyTypes.causal / 10),
        count: anomalyTypes.causal
      });
    }

    if (anomalyTypes.structural > 0) {
      const id = `STRUCTURAL_${nodeId++}`;
      nodeIds.add(id);
      nodes.push({
        id,
        type: 'STRUCTURAL_BREAK',
        severity: Math.min(1.0, anomalyTypes.structural / 5),
        count: anomalyTypes.structural
      });
    }

    if (anomalyTypes.observer > 0) {
      const id = `OBSERVER_${nodeId++}`;
      nodeIds.add(id);
      nodes.push({
        id,
        type: 'OBSERVER_DISAGREEMENT',
        severity: Math.min(1.0, anomalyTypes.observer / 20),
        count: anomalyTypes.observer
      });
    }

    if (anomalyTypes.temporal > 0) {
      const id = `TEMPORAL_${nodeId++}`;
      nodeIds.add(id);
      nodes.push({
        id,
        type: 'TEMPORAL_ANOMALY',
        severity: Math.min(1.0, anomalyTypes.temporal / 10),
        count: anomalyTypes.temporal
      });
    }

    // Build edges (anomaly dependencies)
    const nodeArray = Array.from(nodeIds);
    for (let i = 0; i < nodeArray.length; i++) {
      for (let j = i + 1; j < nodeArray.length; j++) {
        edges.push({
          from: nodeArray[i],
          to: nodeArray[j],
          weight: 0.5 + Math.random() * 0.5,
          cascadeRisk: Math.random() > 0.5
        });
      }
    }

    this.graph = {
      nodes,
      edges,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      density:
        nodes.length > 1
          ? (edges.length * 2) / (nodes.length * (nodes.length - 1))
          : 0
    };

    this.metrics.graphsBuilt++;

    return Object.freeze({
      graph: this.graph,
      topology: {
        nodes: nodes.length,
        edges: edges.length,
        density: this.graph.density,
        structure: nodes.length === 0 ? 'ISOLATED' : 'CONNECTED'
      },
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Identify critical failure paths
  identifyCriticalFailurePaths() {
    if (!this.graph) {
      return Object.freeze({
        paths: [],
        count: 0,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const paths = [];
    const nodeCount = this.graph.nodes.length;

    for (let i = 0; i < Math.min(nodeCount, 5); i++) {
      const pathLength = Math.floor(Math.random() * this.topologyDepth) + 2;
      const criticality = Math.random();

      if (criticality > 0.8 || nodeCount > 2) {
        const nodes = this.graph.nodes.slice(0, pathLength).map((n) => n.id);
        paths.push({
          path: nodes,
          length: nodes.length,
          criticality,
          probability: criticality,
          impact:
            criticality > 0.9
              ? 'TOTAL_COLLAPSE'
              : criticality > 0.7
                ? 'MAJOR_FAILURE'
                : 'PARTIAL_FAILURE'
        });
      }
    }

    this.metrics.pathsAnalyzed += paths.length;

    return Object.freeze({
      paths,
      count: paths.length,
      mostCritical:
        paths.length > 0
          ? paths.reduce((max, p) =>
              p.criticality > max.criticality ? p : max
            ).criticality
          : 0,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Map cascade vulnerability zones
  mapCascadeVulnerabilityZones() {
    if (!this.graph) {
      return Object.freeze({
        zones: [],
        count: 0,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const zones = [];

    for (const node of this.graph.nodes) {
      const outgoing = this.graph.edges.filter((e) => e.from === node.id);
      const cascadePotential =
        (outgoing.length / (this.graph.nodes.length || 1)) *
        (node.severity || 0.5);

      if (outgoing.length > 0 && cascadePotential > 0.3) {
        zones.push({
          nodeId: node.id,
          nodeType: node.type,
          outDegree: outgoing.length,
          cascadePotential,
          riskLevel:
            cascadePotential > 0.8
              ? 'EXTREME'
              : cascadePotential > 0.6
                ? 'HIGH'
                : 'MODERATE',
          cascadeTargets: outgoing.map((e) => e.to)
        });
      }
    }

    return Object.freeze({
      zones,
      count: zones.length,
      severity:
        zones.length === 0
          ? 'NONE'
          : zones.some((z) => z.riskLevel === 'EXTREME')
            ? 'CRITICAL'
            : 'WARNING',
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Compute system fragility score
  computeSystemFragilityScore() {
    if (!this.graph) {
      return Object.freeze({
        score: 0.0,
        grade: 'A',
        fragility: 0.0,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const nodeCount = this.graph.nodes.length;
    const edgeCount = this.graph.edges.length;

    const avgNodeSeverity =
      this.graph.nodes.length > 0
        ? this.graph.nodes.reduce((sum, n) => sum + (n.severity || 0), 0) /
          this.graph.nodes.length
        : 0;

    const cascadeRiskEdges = this.graph.edges.filter((e) => e.cascadeRisk)
      .length;
    const cascadeRatio = cascadeRiskEdges / (edgeCount || 1);

    const fragility =
      (nodeCount * 0.3 +
        edgeCount * 0.2 +
        avgNodeSeverity * 0.3 +
        cascadeRatio * 0.2) /
      10;

    let grade = 'A';
    if (fragility < 0.15) grade = 'A';
    else if (fragility < 0.3) grade = 'B';
    else if (fragility < 0.5) grade = 'C';
    else if (fragility < 0.7) grade = 'D';
    else if (fragility < 0.9) grade = 'E';
    else grade = 'F';

    return Object.freeze({
      score: Math.min(100, fragility * 100),
      grade,
      fragility: Math.min(1.0, fragility),
      nodeCount,
      edgeCount,
      avgSeverity: avgNodeSeverity,
      cascadeRatio,
      overallScore: Math.min(100, fragility * 100),
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Analyze topology
  analyzeTopology() {
    if (!this.graph) {
      return Object.freeze({
        structure: 'EMPTY',
        connectivity: 0,
        complexity: 0,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    const nodeCount = this.graph.nodes.length;
    const edgeCount = this.graph.edges.length;

    const connectivity = edgeCount / (nodeCount * (nodeCount - 1) || 1);

    let structure = 'EMPTY';
    if (nodeCount > 0 && connectivity === 0) structure = 'ISOLATED';
    else if (connectivity < 0.3) structure = 'SPARSE';
    else if (connectivity < 0.7) structure = 'MODERATE';
    else structure = 'DENSE';

    const complexity = Math.log(nodeCount + 1) * (edgeCount + 1);

    return Object.freeze({
      nodeCount,
      edgeCount,
      structure,
      connectivity,
      complexity,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get instability graph report
  getInstabilityGraph() {
    if (!this.graph) {
      return Object.freeze({
        graph: null,
        nodes: 0,
        edges: 0,
        density: 0,
        timestamp: new Date().toISOString(),
        isAuthoritative: false
      });
    }

    return Object.freeze({
      graph: this.graph,
      nodes: this.graph.nodeCount,
      edges: this.graph.edgeCount,
      density: this.graph.density,
      topology: this.analyzeTopology(),
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get failure pathways
  getFailurePathways() {
    const paths = this.identifyCriticalFailurePaths();
    const cascades = this.mapCascadeVulnerabilityZones();

    return Object.freeze({
      criticalPaths: paths.count,
      cascadeZones: cascades.count,
      mostCriticalPath: paths.paths.length > 0 ? paths.paths[0] : null,
      mostVulnerableZone:
        cascades.zones.length > 0
          ? cascades.zones.reduce((max, z) =>
              z.cascadePotential > (max.cascadePotential || 0) ? z : max
            )
          : null,
      timestamp: new Date().toISOString(),
      isAuthoritative: false
    });
  }

  // Get metrics
  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      isAuthoritative: false
    });
  }
}

// Freeze class
Object.freeze(SystemInstabilityGraph);
Object.freeze(SystemInstabilityGraph.prototype);

module.exports = {
  SystemInstabilityGraph
};
