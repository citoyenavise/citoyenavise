/**
 * DistributedGovernanceKernel
 * PHASE 8.1 — Generic Distributed Governance Kernel
 *
 * Abstracts PHASE 7.0-7.7 architecture into reusable governance kernel.
 *
 * CRITICAL: Domain-agnostic, operation-driven, invariant-enforcing
 * - any distributed system can instantiate this kernel
 * - invariants become runtime laws
 * - determinism preserved across domains
 */

class DistributedGovernanceKernel {
  constructor(options = {}) {
    // Kernel identity
    this.kernelId = options.kernelId || `kernel_${Date.now()}`;

    // Registered domains
    this.domains = new Map(); // domainId → { config, adapter, invariants }

    // Global invariants (universal laws)
    this.globalInvariants = new Map(); // invariantId → { rule, level }

    // Plugin system
    this.plugins = new Map(); // pluginName → plugin instance
    this.pluginChain = [];

    // Operation execution model
    this.operationLog = [];
    this.maxOperationLog = options.maxOperationLog || 10000;

    // Execution state
    this.kernelState = {
      running: false,
      operationsExecuted: 0,
      invariantViolations: 0,
      domainsRegistered: 0
    };

    // Metrics
    this.metrics = {
      executionsSuccessful: 0,
      executionsFailed: 0,
      invariantChecks: 0,
      invariantViolations: 0,
      pluginExecutions: 0,
      lastExecution: null
    };
  }

  /**
   * Register domain (PHASE 8.1: domain agnostic)
   */
  registerDomain(domainConfig) {
    if (!domainConfig || !domainConfig.domainId) {
      return { registered: false, reason: 'INVALID_DOMAIN_CONFIG' };
    }

    const domain = {
      domainId: domainConfig.domainId,
      config: Object.freeze({ ...domainConfig }),
      adapter: domainConfig.adapter || null,
      invariants: new Map(),
      operationHandlers: new Map(),
      registeredAt: Date.now()
    };

    this.domains.set(domainConfig.domainId, domain);
    this.kernelState.domainsRegistered++;

    return {
      registered: true,
      domainId: domainConfig.domainId,
      timestamp: domain.registeredAt
    };
  }

  /**
   * Register domain invariant
   */
  registerInvariant(domainId, invariantId, rule) {
    const domain = this.domains.get(domainId);
    if (!domain) {
      return { registered: false, reason: 'DOMAIN_NOT_FOUND' };
    }

    const invariant = Object.freeze({
      invariantId,
      domainId,
      rule,
      level: rule.level || 'CRITICAL',
      registeredAt: Date.now()
    });

    domain.invariants.set(invariantId, invariant);
    this.globalInvariants.set(`${domainId}:${invariantId}`, invariant);

    return {
      registered: true,
      invariantId,
      level: invariant.level
    };
  }

  /**
   * Register operation handler
   */
  registerOperationHandler(domainId, operationType, handler) {
    const domain = this.domains.get(domainId);
    if (!domain) {
      return { registered: false, reason: 'DOMAIN_NOT_FOUND' };
    }

    domain.operationHandlers.set(operationType, handler);

    return {
      registered: true,
      domainId,
      operationType
    };
  }

  /**
   * Execute operation (universal kernel operation model)
   */
  async executeOperation(operation) {
    if (!operation || !operation.domainId || !operation.type) {
      return {
        executed: false,
        reason: 'INVALID_OPERATION'
      };
    }

    const startTime = Date.now();
    const domain = this.domains.get(operation.domainId);

    if (!domain) {
      return {
        executed: false,
        reason: 'DOMAIN_NOT_FOUND',
        domainId: operation.domainId
      };
    }

    try {
      // STEP 1: Validate invariants before execution
      const invariantResult = await this._validateInvariants(operation.domainId, operation);
      if (!invariantResult.valid) {
        this.metrics.invariantViolations++;
        this.kernelState.invariantViolations++;
        return {
          executed: false,
          reason: 'INVARIANT_VIOLATION',
          violation: invariantResult.violation
        };
      }

      // STEP 2: Adapt operation if domain adapter exists
      let adaptedOperation = operation;
      if (domain.adapter && domain.adapter.translate) {
        adaptedOperation = domain.adapter.translate(operation);
      }

      // STEP 3: Execute operation handler
      const handler = domain.operationHandlers.get(operation.type);
      if (!handler) {
        return {
          executed: false,
          reason: 'NO_HANDLER_REGISTERED',
          operationType: operation.type
        };
      }

      const result = await handler(adaptedOperation);

      // STEP 4: Run plugin chain (post-execution hooks)
      for (const plugin of this.pluginChain) {
        if (plugin.onOperationExecuted) {
          try {
            await plugin.onOperationExecuted(operation, result);
            this.metrics.pluginExecutions++;
          } catch (err) {
            // Plugin error: log but don't block kernel
          }
        }
      }

      // STEP 5: Log operation (append-only)
      this._logOperation({
        domainId: operation.domainId,
        type: operation.type,
        operationId: operation.operationId || `op_${Date.now()}`,
        result: result.success !== false ? 'SUCCESS' : 'FAILED',
        latencyMs: Date.now() - startTime,
        timestamp: Date.now()
      });

      this.kernelState.operationsExecuted++;
      this.metrics.executionsSuccessful++;
      this.metrics.lastExecution = Date.now();
      this.metrics.invariantChecks++;

      return {
        executed: true,
        domainId: operation.domainId,
        operationType: operation.type,
        result,
        latencyMs: Date.now() - startTime
      };
    } catch (err) {
      this.metrics.executionsFailed++;
      this.metrics.invariantChecks++;
      return {
        executed: false,
        reason: 'EXECUTION_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Attach plugin to kernel
   */
  attachPlugin(plugin) {
    if (!plugin || !plugin.name) {
      return { attached: false, reason: 'INVALID_PLUGIN' };
    }

    // Validate plugin cannot modify core enforcement
    if (plugin.canModifyEnforcement) {
      return {
        attached: false,
        reason: 'PLUGIN_CANNOT_MODIFY_ENFORCEMENT'
      };
    }

    this.plugins.set(plugin.name, plugin);
    this.pluginChain.push(plugin);

    return {
      attached: true,
      pluginName: plugin.name,
      chainPosition: this.pluginChain.length - 1
    };
  }

  /**
   * Validate all invariants for operation
   */
  async _validateInvariants(domainId, operation) {
    const domain = this.domains.get(domainId);
    if (!domain || domain.invariants.size === 0) {
      return { valid: true };
    }

    // Evaluate each invariant
    for (const [invariantId, invariant] of domain.invariants.entries()) {
      if (invariant.rule.evaluate) {
        const isValid = await invariant.rule.evaluate(operation);
        if (!isValid) {
          return {
            valid: false,
            violation: {
              invariantId,
              domainId,
              level: invariant.level,
              operation: operation.type
            }
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Internal: Log operation (append-only)
   */
  _logOperation(entry) {
    this.operationLog.push({
      ...entry,
      sequence: this.operationLog.length
    });

    if (this.operationLog.length > this.maxOperationLog) {
      this.operationLog.shift();
    }
  }

  /**
   * Get kernel state
   */
  getKernelState() {
    return {
      kernelId: this.kernelId,
      running: this.kernelState.running,
      operationsExecuted: this.kernelState.operationsExecuted,
      invariantViolations: this.kernelState.invariantViolations,
      domainsRegistered: this.kernelState.domainsRegistered,
      pluginsAttached: this.plugins.size,
      globalInvariants: this.globalInvariants.size,
      timestamp: Date.now()
    };
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      operationLogSize: this.operationLog.length,
      timestamp: Date.now()
    };
  }

  /**
   * Get operation history (audit)
   */
  getOperationHistory(limit = 100) {
    return this.operationLog.slice(-limit);
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.domains.clear();
    this.globalInvariants.clear();
    this.plugins.clear();
    this.pluginChain = [];
    this.operationLog = [];
    this.kernelState = {
      running: false,
      operationsExecuted: 0,
      invariantViolations: 0,
      domainsRegistered: 0
    };
    this.metrics = {
      executionsSuccessful: 0,
      executionsFailed: 0,
      invariantChecks: 0,
      invariantViolations: 0,
      pluginExecutions: 0,
      lastExecution: null
    };
  }
}

module.exports = DistributedGovernanceKernel;
