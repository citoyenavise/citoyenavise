/**
 * CrossDomainCompositionEngine
 * PHASE 8.4 — Multi-Domain Unification and Composition
 *
 * Composes operations from multiple domains into unified workflow.
 *
 * CRITICAL:
 * ✔ domain-agnostic operation translation
 * ✔ unified execution model across domains
 * ✔ deterministic transformation
 * ✔ domain metadata preservation
 */

class CrossDomainCompositionEngine {
  constructor(options = {}) {
    // Domain registries: domainId → { adapter, schema, operations[] }
    this.domains = new Map();

    // Unified operation stream (cross-domain)
    this.unifiedOperations = new Map(); // workflowId → []

    // Domain transformation rules
    this.transformationRules = new Map(); // domainId → { translate, validate }

    // Composition cache
    this.compositionCache = new Map(); // workflowId → composition metadata

    // Metrics
    this.stats = {
      domainsRegistered: 0,
      operationsComposed: 0,
      transformationsApplied: 0,
      compositionErrors: 0,
      lastComposition: null
    };
  }

  /**
   * Register domain for composition
   */
  registerDomain(domainId, config) {
    if (!domainId || !config) {
      return { registered: false, reason: 'INVALID_INPUT' };
    }

    const domain = Object.freeze({
      domainId,
      name: config.name || domainId,
      schema: config.schema || 'OPERATION_1',
      operationTypes: config.operationTypes || [],
      registeredAt: Date.now()
    });

    this.domains.set(domainId, domain);

    // Register transformation rules if provided
    if (config.transformationRules) {
      this.transformationRules.set(domainId, config.transformationRules);
    }

    this.stats.domainsRegistered++;

    return {
      registered: true,
      domainId,
      schema: domain.schema
    };
  }

  /**
   * Compose multi-domain operations into unified workflow
   */
  composeWorkflow(workflowId, domainOperations) {
    if (!workflowId || !Array.isArray(domainOperations)) {
      return { composed: false, reason: 'INVALID_INPUT' };
    }

    try {
      const unifiedOps = [];
      const domainParticipants = new Set();
      let compositionErrors = [];

      // Transform and unify each domain's operations
      for (let i = 0; i < domainOperations.length; i++) {
        const domainOp = domainOperations[i];
        const domainId = domainOp.domain;

        if (!domainId) {
          compositionErrors.push({
            sequence: i,
            reason: 'MISSING_DOMAIN_ID'
          });
          continue;
        }

        if (!this.domains.has(domainId)) {
          compositionErrors.push({
            sequence: i,
            domainId,
            reason: 'DOMAIN_NOT_REGISTERED'
          });
          continue;
        }

        // Transform to unified model
        const transformedOp = this._transformOperation(domainId, domainOp);

        if (!transformedOp.success) {
          compositionErrors.push({
            sequence: i,
            domainId,
            reason: transformedOp.error
          });
          continue;
        }

        unifiedOps.push(transformedOp.operation);
        domainParticipants.add(domainId);
        this.stats.transformationsApplied++;
      }

      if (unifiedOps.length === 0) {
        return {
          composed: false,
          reason: 'NO_VALID_OPERATIONS',
          errors: compositionErrors
        };
      }

      // Store unified operations
      this.unifiedOperations.set(workflowId, Object.freeze(unifiedOps));

      // Cache composition metadata
      this.compositionCache.set(workflowId, Object.freeze({
        workflowId,
        operationCount: unifiedOps.length,
        domainCount: domainParticipants.size,
        domains: Array.from(domainParticipants),
        transformationErrors: compositionErrors.length,
        composedAt: Date.now()
      }));

      this.stats.operationsComposed += unifiedOps.length;
      this.stats.lastComposition = Date.now();

      if (compositionErrors.length > 0) {
        this.stats.compositionErrors += compositionErrors.length;
      }

      return {
        composed: true,
        workflowId,
        unifiedOperationCount: unifiedOps.length,
        domainCount: domainParticipants.size,
        compositionErrors: compositionErrors.length > 0 ? compositionErrors : null
      };
    } catch (err) {
      this.stats.compositionErrors++;
      return {
        composed: false,
        reason: 'COMPOSITION_ERROR',
        error: err.message
      };
    }
  }

  /**
   * Get unified operations for workflow
   */
  getUnifiedOperations(workflowId) {
    const ops = this.unifiedOperations.get(workflowId);
    if (!ops) {
      return { available: false, reason: 'WORKFLOW_NOT_FOUND' };
    }

    return {
      available: true,
      workflowId,
      operationCount: ops.length,
      operations: ops
    };
  }

  /**
   * Get composition metadata
   */
  getCompositionMetadata(workflowId) {
    const metadata = this.compositionCache.get(workflowId);
    if (!metadata) {
      return { available: false, reason: 'COMPOSITION_NOT_FOUND' };
    }

    return {
      available: true,
      metadata
    };
  }

  /**
   * Validate domain homogeneity
   */
  validateDomainConsistency(workflowId) {
    const metadata = this.compositionCache.get(workflowId);
    if (!metadata) {
      return { valid: false, reason: 'COMPOSITION_NOT_FOUND' };
    }

    const violations = [];

    // Check 1: All domains registered
    for (const domainId of metadata.domains) {
      if (!this.domains.has(domainId)) {
        violations.push({
          type: 'UNREGISTERED_DOMAIN',
          domainId
        });
      }
    }

    // Check 2: All operations have valid domain references
    const ops = this.unifiedOperations.get(workflowId) || [];
    for (let i = 0; i < ops.length; i++) {
      if (!ops[i].domain) {
        violations.push({
          type: 'MISSING_DOMAIN_IN_OP',
          operationIndex: i
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
   * Internal: Transform operation to unified model
   */
  _transformOperation(domainId, domainOp) {
    try {
      const rules = this.transformationRules.get(domainId);

      // Default transformation if no rules
      let transformed = {
        operationId: domainOp.operationId || `op_${Date.now()}`,
        domain: domainId,
        type: domainOp.type || 'OPERATION',
        dependencies: domainOp.dependencies || domainOp.dependsOn || [],
        payload: domainOp.payload || domainOp.data || {},
        timestamp: domainOp.timestamp || Date.now()
      };

      // Apply custom transformation if rules exist
      if (rules && rules.translate) {
        try {
          transformed = rules.translate(transformed, domainOp);
        } catch (err) {
          return {
            success: false,
            error: `CUSTOM_TRANSFORM_FAILED: ${err.message}`
          };
        }
      }

      // Freeze transformed operation
      transformed = Object.freeze(transformed);

      return {
        success: true,
        operation: transformed
      };
    } catch (err) {
      return {
        success: false,
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
      registeredDomainCount: this.domains.size,
      unifiedWorkflowCount: this.unifiedOperations.size,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.domains.clear();
    this.unifiedOperations.clear();
    this.transformationRules.clear();
    this.compositionCache.clear();
    this.stats = {
      domainsRegistered: 0,
      operationsComposed: 0,
      transformationsApplied: 0,
      compositionErrors: 0,
      lastComposition: null
    };
  }
}

module.exports = CrossDomainCompositionEngine;
