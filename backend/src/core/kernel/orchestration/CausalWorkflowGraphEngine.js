/**
 * CausalWorkflowGraphEngine
 * PHASE 8.4 — Causal Workflow Graph Construction and Execution
 *
 * Builds and executes deterministic causal graphs across domains.
 *
 * CRITICAL:
 * ✔ causal ordering preserved globally
 * ✔ topological execution without cycles
 * ✔ deterministic graph construction
 * ✔ cross-domain dependency resolution
 */

const crypto = require('crypto');

class CausalWorkflowGraphEngine {
  constructor(options = {}) {
    // Workflow graph: nodes + edges representing causal dependencies
    this.graphs = new Map(); // workflowId → { nodes, edges, topology }

    // Topological sort results (cached)
    this.executionPlans = new Map(); // workflowId → [nodeIds in execution order]

    // Cycle detection and validation
    this.validationResults = new Map(); // workflowId → { valid, cycles?, anomalies? }

    // Metrics
    this.stats = {
      graphsBuilt: 0,
      cyclesDetected: 0,
      topologicalSorts: 0,
      executionErrors: 0,
      lastBuild: null
    };
  }

  /**
   * Build causal workflow graph from operations
   */
  buildWorkflowGraph(workflowId, operations) {
    if (!workflowId || !Array.isArray(operations)) {
      return { built: false, reason: 'INVALID_INPUT' };
    }

    try {
      const nodes = new Map(); // nodeId → { operationId, domain, dependencies[], timestamp }
      const edges = new Map(); // nodeId → [dependentNodeIds]
      const adjacencyList = new Map(); // for cycle detection

      // Build nodes from operations
      for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const nodeId = op.operationId || `op_${i}`;

        const node = Object.freeze({
          nodeId,
          operationId: op.operationId,
          domain: op.domain || 'UNKNOWN',
          type: op.type || 'OPERATION',
          dependencies: op.dependsOn || [],
          dependencyCount: (op.dependsOn || []).length,
          timestamp: op.timestamp || Date.now(),
          sequence: i,
          payload: op.payload || {}
        });

        nodes.set(nodeId, node);
        adjacencyList.set(nodeId, []);
      }

      // Build edges from dependencies
      for (const [nodeId, node] of nodes) {
        if (node.dependencies && node.dependencies.length > 0) {
          edges.set(nodeId, node.dependencies);

          // Update adjacency list for cycle detection
          for (const depId of node.dependencies) {
            if (adjacencyList.has(depId)) {
              adjacencyList.get(depId).push(nodeId);
            }
          }
        } else {
          edges.set(nodeId, []);
        }
      }

      // Create graph
      const graph = Object.freeze({
        workflowId,
        nodeCount: nodes.size,
        edgeCount: Array.from(edges.values()).reduce((sum, deps) => sum + deps.length, 0),
        nodes: Object.freeze(new Map(nodes)),
        edges: Object.freeze(new Map(edges)),
        adjacencyList,
        createdAt: Date.now()
      });

      this.graphs.set(workflowId, graph);

      this.stats.graphsBuilt++;
      this.stats.lastBuild = Date.now();

      return {
        built: true,
        workflowId,
        nodeCount: graph.nodeCount,
        edgeCount: graph.edgeCount
      };
    } catch (err) {
      return {
        built: false,
        reason: 'BUILD_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Resolve causal dependencies and validate graph structure
   */
  resolveCausalDependencies(workflowId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return { resolved: false, reason: 'WORKFLOW_NOT_FOUND' };
    }

    try {
      // STEP 1: Detect cycles (Tarjan's algorithm)
      const cycles = this._detectCycles(graph);

      if (cycles.length > 0) {
        this.stats.cyclesDetected++;
        return {
          resolved: false,
          reason: 'CYCLES_DETECTED',
          cycleCount: cycles.length,
          cycles
        };
      }

      // STEP 2: Topological sort
      const sorted = this._topologicalSort(graph);

      if (!sorted.valid) {
        return {
          resolved: false,
          reason: 'TOPOLOGICAL_SORT_FAILED',
          error: sorted.error
        };
      }

      // Store execution plan
      this.executionPlans.set(workflowId, sorted.order);

      // Validate all nodes are in plan
      const nodeCount = graph.nodeCount;
      if (sorted.order.length !== nodeCount) {
        return {
          resolved: false,
          reason: 'INCOMPLETE_SORT',
          expected: nodeCount,
          actual: sorted.order.length
        };
      }

      // Store validation result
      this.validationResults.set(workflowId, {
        valid: true,
        cycles: [],
        nodesCovered: sorted.order.length,
        timestamp: Date.now()
      });

      this.stats.topologicalSorts++;

      return {
        resolved: true,
        workflowId,
        cyclesFree: true,
        executionOrderLength: sorted.order.length
      };
    } catch (err) {
      return {
        resolved: false,
        reason: 'RESOLUTION_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Get execution plan (topologically sorted nodes)
   */
  getExecutionPlan(workflowId) {
    const plan = this.executionPlans.get(workflowId);
    if (!plan) {
      return { available: false, reason: 'PLAN_NOT_FOUND' };
    }

    return {
      available: true,
      workflowId,
      executionOrder: plan,
      stepCount: plan.length
    };
  }

  /**
   * Validate entire graph integrity
   */
  validateGraphIntegrity(workflowId) {
    const graph = this.graphs.get(workflowId);
    if (!graph) {
      return { valid: false, reason: 'WORKFLOW_NOT_FOUND' };
    }

    const violations = [];

    // Check 1: All dependencies exist as nodes
    for (const [nodeId, depIds] of graph.edges) {
      for (const depId of depIds) {
        if (!graph.nodes.has(depId)) {
          violations.push({
            type: 'MISSING_DEPENDENCY',
            nodeId,
            missingDependency: depId
          });
        }
      }
    }

    // Check 2: No self-loops
    for (const [nodeId, depIds] of graph.edges) {
      if (depIds.includes(nodeId)) {
        violations.push({
          type: 'SELF_LOOP',
          nodeId
        });
      }
    }

    // Check 3: Dependency count matches
    for (const [nodeId, node] of graph.nodes) {
      const actualDepCount = graph.edges.get(nodeId).length;
      if (actualDepCount !== node.dependencyCount) {
        violations.push({
          type: 'DEPENDENCY_COUNT_MISMATCH',
          nodeId,
          expected: node.dependencyCount,
          actual: actualDepCount
        });
      }
    }

    return {
      valid: violations.length === 0,
      violationCount: violations.length,
      violations: violations.length > 0 ? violations : null,
      timestamp: Date.now()
    };
  }

  /**
   * Internal: Detect cycles using DFS
   */
  _detectCycles(graph) {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (nodeId, path) => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const deps = graph.edges.get(nodeId) || [];
      for (const depId of deps) {
        if (!visited.has(depId)) {
          dfs(depId, [...path]);
        } else if (recursionStack.has(depId)) {
          // Cycle found
          const cycleStart = path.indexOf(depId);
          cycles.push(path.slice(cycleStart).concat([depId]));
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  /**
   * Internal: Topological sort (Kahn's algorithm)
   */
  _topologicalSort(graph) {
    try {
      const inDegree = new Map();
      const dependents = new Map(); // nodeId → [nodes that depend on this]

      // Initialize in-degrees and dependents
      for (const nodeId of graph.nodes.keys()) {
        inDegree.set(nodeId, 0);
        dependents.set(nodeId, []);
      }

      // Build graph: if nodeB depends on nodeA, then nodeA → nodeB
      for (const [nodeId, dependencies] of graph.edges) {
        for (const depId of dependencies) {
          if (dependents.has(depId)) {
            dependents.get(depId).push(nodeId);
          }
          // Increment in-degree of nodeId (it has depId as predecessor)
          inDegree.set(nodeId, inDegree.get(nodeId) + 1);
        }
      }

      // Collect nodes with no incoming edges (no dependencies)
      const queue = [];
      for (const [nodeId, degree] of inDegree) {
        if (degree === 0) {
          queue.push(nodeId);
        }
      }

      const order = [];
      while (queue.length > 0) {
        const nodeId = queue.shift();
        order.push(nodeId);

        // Process nodes that depend on this one
        for (const dependent of dependents.get(nodeId) || []) {
          inDegree.set(dependent, inDegree.get(dependent) - 1);
          if (inDegree.get(dependent) === 0) {
            queue.push(dependent);
          }
        }
      }

      if (order.length !== graph.nodeCount) {
        return {
          valid: false,
          error: 'INCOMPLETE_SORT'
        };
      }

      return {
        valid: true,
        order
      };
    } catch (err) {
      return {
        valid: false,
        error: err.message
      };
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      graphsStored: this.graphs.size,
      executionPlansStored: this.executionPlans.size,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.graphs.clear();
    this.executionPlans.clear();
    this.validationResults.clear();
    this.stats = {
      graphsBuilt: 0,
      cyclesDetected: 0,
      topologicalSorts: 0,
      executionErrors: 0,
      lastBuild: null
    };
  }
}

module.exports = CausalWorkflowGraphEngine;
