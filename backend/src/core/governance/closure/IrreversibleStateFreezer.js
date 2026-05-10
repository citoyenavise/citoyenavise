/**
 * PHASE 9.9 — IrreversibleStateFreezer
 * Makes entire system state permanently non-modifiable
 * Enforces read-only access forever after freeze
 */

const FREEZE_STATES = {
  UNFROZEN: 'UNFROZEN',
  FREEZING: 'FREEZING',
  FROZEN: 'FROZEN',
  VERIFIED: 'VERIFIED'
};

const FREEZE_ERRORS = {
  WRITE_ATTEMPTED: 'WRITE_ATTEMPTED',
  MUTATION_ATTEMPTED: 'MUTATION_ATTEMPTED',
  EXTENSION_ATTEMPTED: 'EXTENSION_ATTEMPTED',
  FREEZE_FAILED: 'FREEZE_FAILED'
};

class IrreversibleStateFreezer {
  constructor(graph, options = {}) {
    this.graph = graph;

    this.freezeState = FREEZE_STATES.UNFROZEN;
    this.frozenTime = null;
    this.writeAttempts = [];
    this.mutationAttempts = [];

    this.metrics = {
      freezesExecuted: 0,
      writeAttemptsBlocked: 0,
      mutationAttemptsBlocked: 0,
      createdAt: new Date().toISOString()
    };

    this.isAuthoritative = false;
  }

  // Freeze all state permanently
  async freezeAllState() {
    this.freezeState = FREEZE_STATES.FREEZING;

    try {
      // Step 1: Deep freeze graph structure
      this._freezeGraphStructure();

      // Step 2: Lock all data structures
      this._lockDataStructures();

      // Step 3: Prevent state extension
      this._preventStateExtension();

      // Step 4: Mark as frozen
      this.freezeState = FREEZE_STATES.FROZEN;
      this.frozenTime = new Date().toISOString();
      this.metrics.freezesExecuted++;

      return {
        success: true,
        frozen: true,
        timestamp: this.frozenTime
      };
    } catch (error) {
      this.freezeState = FREEZE_STATES.UNFROZEN;
      throw new Error(`State freeze failed: ${error.message}`);
    }
  }

  // Deep freeze graph structure recursively
  _freezeGraphStructure() {
    if (!this.graph) return;

    // Freeze main graph object
    Object.freeze(this.graph);

    // Freeze all nodes
    if (this.graph.nodes) {
      for (const node of this.graph.nodes) {
        Object.freeze(node);

        // Freeze node properties
        if (node.data) {
          Object.freeze(node.data);
        }

        if (node.metadata) {
          Object.freeze(node.metadata);
        }
      }

      Object.freeze(this.graph.nodes);
    }

    // Freeze all edges
    if (this.graph.edges) {
      for (const edge of this.graph.edges) {
        Object.freeze(edge);

        if (edge.metadata) {
          Object.freeze(edge.metadata);
        }
      }

      Object.freeze(this.graph.edges);
    }

    // Freeze indices
    if (this.graph.typeIndex) {
      Object.freeze(this.graph.typeIndex);
    }

    if (this.graph.temporalIndex) {
      Object.freeze(this.graph.temporalIndex);
    }

    if (this.graph.causalIndex) {
      Object.freeze(this.graph.causalIndex);
    }
  }

  // Lock data structures at functional level
  _lockDataStructures() {
    if (!this.graph) return;

    // Override write methods to reject writes
    const methods = ['addNode', 'addEdge', 'updateNode', 'updateEdge', 'deleteNode', 'deleteEdge'];

    for (const method of methods) {
      if (this.graph[method]) {
        const original = this.graph[method];

        this.graph[method] = () => {
          this.metrics.writeAttemptsBlocked++;
          this.writeAttempts.push({
            method,
            timestamp: new Date().toISOString()
          });

          throw new Error(
            `System is frozen. ${method}() is not permitted.`
          );
        };

        Object.freeze(this.graph[method]);
      }
    }

    // Lock write methods
    if (this.graph.write) {
      const original = this.graph.write;

      this.graph.write = () => {
        this.metrics.writeAttemptsBlocked++;
        this.writeAttempts.push({
          method: 'write',
          timestamp: new Date().toISOString()
        });

        throw new Error('System is frozen. Write operations are not permitted.');
      };

      Object.freeze(this.graph.write);
    }
  }

  // Prevent any state extension
  _preventStateExtension() {
    if (!this.graph) return;

    // Prevent adding new properties
    Object.preventExtensions(this.graph);

    // Prevent adding to node list
    if (this.graph.nodes) {
      Object.preventExtensions(this.graph.nodes);
    }

    // Prevent adding to edge list
    if (this.graph.edges) {
      Object.preventExtensions(this.graph.edges);
    }

    // Override append methods
    const appendMethods = ['append', 'push', 'insert', 'extend'];

    for (const method of appendMethods) {
      if (this.graph[method]) {
        this.graph[method] = () => {
          this.metrics.mutationAttemptsBlocked++;
          this.mutationAttempts.push({
            method,
            type: 'EXTENSION_ATTEMPTED',
            timestamp: new Date().toISOString()
          });

          throw new Error(
            `System is frozen. No new state can be added (${method}).`
          );
        };

        Object.freeze(this.graph[method]);
      }
    }
  }

  // Lock all data structures at binary level
  async lockDataStructures() {
    try {
      // In production, this would use lower-level OS or runtime features
      // For now, we use JavaScript's Object.freeze mechanisms
      this._freezeGraphStructure();

      return {
        success: true,
        locked: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Make all snapshots read-only forever
  preventStateExtension() {
    this._preventStateExtension();

    return {
      success: true,
      extensionPrevented: true
    };
  }

  // Verify freeze integrity
  async verifyFreezeIntegrity() {
    try {
      // Test 1: Try to write
      let writeBlocked = true;

      if (this.graph?.write) {
        try {
          this.graph.write({ data: 'test' });
          writeBlocked = false;
        } catch (e) {
          writeBlocked = true;
        }
      }

      // Test 2: Try to mutate
      let mutateBlocked = true;

      if (this.graph?.nodes?.[0]) {
        try {
          this.graph.nodes[0].data = { modified: true };
          mutateBlocked = false;
        } catch (e) {
          mutateBlocked = true;
        }
      }

      // Test 3: Try to extend
      let extendBlocked = true;

      if (this.graph?.append) {
        try {
          this.graph.append({ data: 'new' });
          extendBlocked = false;
        } catch (e) {
          extendBlocked = true;
        }
      }

      const allBlocked = writeBlocked && mutateBlocked && extendBlocked;

      if (allBlocked) {
        this.freezeState = FREEZE_STATES.VERIFIED;
      }

      return {
        verified: allBlocked,
        writeBlocked,
        mutateBlocked,
        extendBlocked,
        frozen: allBlocked
      };
    } catch (error) {
      return {
        verified: false,
        error: error.message,
        frozen: false
      };
    }
  }

  // Test that mutations are completely rejected
  async testMutationRejection() {
    const rejectionTests = [];

    // Test direct writes
    try {
      if (this.graph?.write) {
        this.graph.write({ data: 'test' });
      }

      rejectionTests.push({ test: 'direct_write', rejected: false });
    } catch (e) {
      rejectionTests.push({ test: 'direct_write', rejected: true });
    }

    // Test field mutation
    try {
      if (this.graph?.nodes?.[0]) {
        this.graph.nodes[0].data = { modified: true };
      }

      rejectionTests.push({ test: 'field_mutation', rejected: false });
    } catch (e) {
      rejectionTests.push({ test: 'field_mutation', rejected: true });
    }

    // Test state extension
    try {
      if (this.graph?.push) {
        this.graph.push({ data: 'new' });
      }

      rejectionTests.push({ test: 'state_extension', rejected: false });
    } catch (e) {
      rejectionTests.push({ test: 'state_extension', rejected: true });
    }

    // Test snapshot modification
    try {
      if (this.graph?.snapshots?.[0]) {
        this.graph.snapshots[0].state = { modified: true };
      }

      rejectionTests.push({ test: 'snapshot_modify', rejected: false });
    } catch (e) {
      rejectionTests.push({ test: 'snapshot_modify', rejected: true });
    }

    const allRejected = rejectionTests.every((t) => t.rejected);

    return {
      allRejected,
      tests: rejectionTests,
      mutationsRejected: allRejected
    };
  }

  // Get freeze status
  getFreezeStatus() {
    return {
      state: this.freezeState,
      frozen: this.freezeState === FREEZE_STATES.FROZEN ||
              this.freezeState === FREEZE_STATES.VERIFIED,
      verified: this.freezeState === FREEZE_STATES.VERIFIED,
      frozenTime: this.frozenTime,
      timestamp: new Date().toISOString()
    };
  }

  // Check if system can accept new state
  canAcceptNewState() {
    return this.freezeState === FREEZE_STATES.UNFROZEN;
  }

  // Get metrics (frozen)
  getMetrics() {
    return Object.freeze({
      ...this.metrics,
      currentState: this.freezeState,
      writeAttemptsBlocked: this.metrics.writeAttemptsBlocked,
      mutationAttemptsBlocked: this.metrics.mutationAttemptsBlocked,
      isAuthoritative: false
    });
  }

  // Get all write attempts (frozen list)
  getWriteAttempts() {
    return Object.freeze([...this.writeAttempts]);
  }

  // Get all mutation attempts (frozen list)
  getMutationAttempts() {
    return Object.freeze([...this.mutationAttempts]);
  }
}

// Freeze class
Object.freeze(IrreversibleStateFreezer);
Object.freeze(IrreversibleStateFreezer.prototype);

module.exports = {
  IrreversibleStateFreezer,
  FREEZE_STATES,
  FREEZE_ERRORS
};
