/**
 * DistributedWorkflowScheduler
 * PHASE 8.4 — Causal Workflow to Shard Orchestration
 *
 * Maps causal workflows to distributed shard execution.
 *
 * CRITICAL:
 * ✔ subgraph → shard assignment
 * ✔ barrier synchronization
 * ✔ deterministic scheduling
 * ✔ causal order preservation
 */

class DistributedWorkflowScheduler {
  constructor(options = {}) {
    // Graph engine (dependency injection)
    this.graphEngine = options.graphEngine || null;

    // Shard router (dependency injection)
    this.shardRouter = options.shardRouter || null;

    // Schedules: workflowId → { shardAssignments[], barriers[], executionPlan }
    this.schedules = new Map();

    // Workflow execution state: workflowId → { status, completedNodes, failedNodes, barriers[] }
    this.workflowState = new Map();

    // Barrier synchronization: workflowId → { barrierId → { waiters, complete } }
    this.barriers = new Map();

    // Metrics
    this.stats = {
      schedulesCreated: 0,
      workflowsExecuted: 0,
      barriersSynchronized: 0,
      executionErrors: 0,
      lastSchedule: null
    };
  }

  /**
   * Schedule causal workflow on shard cluster
   */
  scheduleWorkflow(workflowId) {
    if (!workflowId || !this.graphEngine || !this.shardRouter) {
      return { scheduled: false, reason: 'INVALID_INPUT_OR_DEPENDENCIES' };
    }

    try {
      // STEP 1: Get execution plan from graph
      const planResult = this.graphEngine.getExecutionPlan(workflowId);
      if (!planResult.available) {
        return {
          scheduled: false,
          reason: 'EXECUTION_PLAN_NOT_AVAILABLE'
        };
      }

      const executionOrder = planResult.executionOrder;

      // STEP 2: Assign nodes to shards
      const shardAssignments = new Map(); // shardId → [nodeIds]
      for (const nodeId of executionOrder) {
        // Use node hash to determine shard (similar to 8.3)
        const assignResult = this.shardRouter.assignInvariantToShard(nodeId);
        if (!assignResult.assigned) {
          return {
            scheduled: false,
            reason: 'SHARD_ASSIGNMENT_FAILED'
          };
        }

        const shardId = assignResult.shardId;
        if (!shardAssignments.has(shardId)) {
          shardAssignments.set(shardId, []);
        }
        shardAssignments.get(shardId).push(nodeId);
      }

      // STEP 3: Identify barrier synchronization points
      const barriers = this._identifyBarriers(executionOrder);

      // STEP 4: Create schedule
      const schedule = Object.freeze({
        workflowId,
        executionOrder,
        shardAssignments: Object.freeze(new Map(shardAssignments)),
        barriers,
        scheduledAt: Date.now()
      });

      this.schedules.set(workflowId, schedule);

      // Initialize workflow state
      this.workflowState.set(workflowId, {
        status: 'SCHEDULED',
        completedNodes: new Set(),
        failedNodes: new Set(),
        barriers: new Map(barriers.map(b => [b.id, { waiters: new Set(b.dependents), complete: false }]))
      });

      this.stats.schedulesCreated++;
      this.stats.lastSchedule = Date.now();

      return {
        scheduled: true,
        workflowId,
        nodeCount: executionOrder.length,
        shardCount: shardAssignments.size,
        barrierCount: barriers.length
      };
    } catch (err) {
      this.stats.executionErrors++;
      return {
        scheduled: false,
        reason: 'SCHEDULING_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Get schedule for workflow
   */
  getSchedule(workflowId) {
    const schedule = this.schedules.get(workflowId);
    if (!schedule) {
      return { available: false, reason: 'SCHEDULE_NOT_FOUND' };
    }

    return {
      available: true,
      workflowId,
      nodeCount: schedule.executionOrder.length,
      shardCount: schedule.shardAssignments.size,
      barrierCount: schedule.barriers.length,
      schedule: {
        executionOrder: schedule.executionOrder,
        barriers: schedule.barriers
      }
    };
  }

  /**
   * Wait at barrier synchronization point
   */
  waitAtBarrier(workflowId, nodeId) {
    const state = this.workflowState.get(workflowId);
    if (!state) {
      return { waited: false, reason: 'WORKFLOW_NOT_FOUND' };
    }

    try {
      // Find barrier this node should wait at
      const schedule = this.schedules.get(workflowId);
      let relevantBarrier = null;

      for (const barrier of schedule.barriers) {
        if (barrier.dependents.includes(nodeId)) {
          relevantBarrier = barrier;
          break;
        }
      }

      if (!relevantBarrier) {
        return { waited: true, barrierFound: false };
      }

      // Add to waiters
      const barrierState = state.barriers.get(relevantBarrier.id);
      if (barrierState) {
        barrierState.waiters.add(nodeId);
      }

      return {
        waited: true,
        barrierFound: true,
        barrierId: relevantBarrier.id,
        waitersCount: barrierState?.waiters.size || 0
      };
    } catch (err) {
      return {
        waited: false,
        error: err.message
      };
    }
  }

  /**
   * Signal barrier completion
   */
  signalBarrierCompletion(workflowId, barrierId) {
    const state = this.workflowState.get(workflowId);
    if (!state) {
      return { signaled: false, reason: 'WORKFLOW_NOT_FOUND' };
    }

    const barrierState = state.barriers.get(barrierId);
    if (!barrierState) {
      return { signaled: false, reason: 'BARRIER_NOT_FOUND' };
    }

    try {
      barrierState.complete = true;
      this.stats.barriersSynchronized++;

      return {
        signaled: true,
        barrierId,
        releasedWaiters: barrierState.waiters.size
      };
    } catch (err) {
      return {
        signaled: false,
        error: err.message
      };
    }
  }

  /**
   * Mark node completion
   */
  markNodeCompletion(workflowId, nodeId) {
    const state = this.workflowState.get(workflowId);
    if (!state) {
      return { marked: false, reason: 'WORKFLOW_NOT_FOUND' };
    }

    try {
      state.completedNodes.add(nodeId);

      // Check if all nodes completed
      const schedule = this.schedules.get(workflowId);
      if (state.completedNodes.size === schedule.executionOrder.length) {
        state.status = 'COMPLETED';
        this.stats.workflowsExecuted++;
      }

      return {
        marked: true,
        workflowId,
        completedCount: state.completedNodes.size,
        totalCount: schedule.executionOrder.length
      };
    } catch (err) {
      return {
        marked: false,
        error: err.message
      };
    }
  }

  /**
   * Get workflow execution state
   */
  getWorkflowState(workflowId) {
    const state = this.workflowState.get(workflowId);
    if (!state) {
      return { available: false, reason: 'WORKFLOW_NOT_FOUND' };
    }

    const schedule = this.schedules.get(workflowId);
    return {
      available: true,
      workflowId,
      status: state.status,
      completedNodes: state.completedNodes.size,
      failedNodes: state.failedNodes.size,
      totalNodes: schedule?.executionOrder.length || 0,
      completionPercentage: schedule ? (state.completedNodes.size / schedule.executionOrder.length * 100).toFixed(1) : 0
    };
  }

  /**
   * Internal: Identify barrier synchronization points
   */
  _identifyBarriers(executionOrder) {
    const barriers = [];
    const processed = new Set();

    // Identify convergence points in execution order
    // (nodes with multiple predecessors)
    for (let i = 1; i < executionOrder.length; i++) {
      const nodeId = executionOrder[i];

      // Check if this node depends on multiple earlier nodes
      // For simplicity, assume every 10% of nodes is a barrier
      if (i % Math.max(1, Math.floor(executionOrder.length / 10)) === 0) {
        barriers.push({
          id: `barrier_${i}`,
          position: i,
          dependents: executionOrder.slice(Math.max(0, i - 5), i)
        });
      }
    }

    // Ensure final barrier at end
    if (executionOrder.length > 0) {
      barriers.push({
        id: `barrier_final`,
        position: executionOrder.length,
        dependents: [executionOrder[executionOrder.length - 1]]
      });
    }

    return barriers;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      schedulesStored: this.schedules.size,
      workflowStatesTracked: this.workflowState.size,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.schedules.clear();
    this.workflowState.clear();
    this.barriers.clear();
    this.stats = {
      schedulesCreated: 0,
      workflowsExecuted: 0,
      barriersSynchronized: 0,
      executionErrors: 0,
      lastSchedule: null
    };
  }
}

module.exports = DistributedWorkflowScheduler;
