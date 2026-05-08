/**
 * DomainAdapterRegistry
 * PHASE 8.1 — Domain Adapter System for Operation Translation
 *
 * Transforms domain-specific models into kernel operation-driven model.
 *
 * CRITICAL: Enables event-driven systems to work with operation-driven kernel
 * - events become operations
 * - domain logic becomes invariants
 * - shard abstraction hidden
 */

class DomainAdapterRegistry {
  constructor() {
    // Registered adapters: domainId → adapter
    this.adapters = new Map();

    // Translation rules: domain → { eventToOperation, constraintToInvariant }
    this.translationRules = new Map();

    // Metrics
    this.stats = {
      adaptersRegistered: 0,
      translationsPerformed: 0,
      normalizations: 0,
      lastTranslation: null
    };
  }

  /**
   * Register domain adapter
   */
  registerAdapter(domainId, adapter) {
    if (!domainId || !adapter) {
      return { registered: false, reason: 'INVALID_INPUT' };
    }

    const adapterEntry = {
      domainId,
      adapter: Object.freeze({
        name: adapter.name,
        translate: adapter.translate || this._defaultTranslate.bind(this),
        normalize: adapter.normalize || this._defaultNormalize.bind(this),
        validateConstraints: adapter.validateConstraints || null
      }),
      registeredAt: Date.now()
    };

    this.adapters.set(domainId, adapterEntry);
    this.stats.adaptersRegistered++;

    return {
      registered: true,
      domainId,
      adapterName: adapter.name
    };
  }

  /**
   * Register translation rules for domain
   */
  registerTranslationRules(domainId, rules) {
    if (!domainId || !rules) {
      return { registered: false, reason: 'INVALID_INPUT' };
    }

    const ruleEntry = {
      domainId,
      eventToOperation: rules.eventToOperation || {},
      constraintToInvariant: rules.constraintToInvariant || {},
      registeredAt: Date.now()
    };

    this.translationRules.set(domainId, Object.freeze(ruleEntry));

    return {
      registered: true,
      domainId,
      rulesCount: Object.keys(rules.eventToOperation || {}).length
    };
  }

  /**
   * Translate input (event or domain operation) to kernel operation
   */
  translate(input) {
    if (!input || !input.domainId) {
      return { translated: false, reason: 'INVALID_INPUT' };
    }

    try {
      const adapter = this.adapters.get(input.domainId);
      if (!adapter) {
        return { translated: false, reason: 'ADAPTER_NOT_FOUND' };
      }

      // Call adapter's translate function
      const operation = adapter.adapter.translate(input);

      this.stats.translationsPerformed++;
      this.stats.lastTranslation = Date.now();

      return {
        translated: true,
        operation: Object.freeze(operation),
        originalDomain: input.domainId
      };
    } catch (err) {
      return {
        translated: false,
        error: err.message
      };
    }
  }

  /**
   * Normalize operation to canonical kernel form
   */
  normalizeOperation(operation) {
    if (!operation || !operation.domainId) {
      return { normalized: false, reason: 'INVALID_OPERATION' };
    }

    try {
      const adapter = this.adapters.get(operation.domainId);
      if (!adapter) {
        return { normalized: false, reason: 'ADAPTER_NOT_FOUND' };
      }

      const normalized = adapter.adapter.normalize(operation);

      this.stats.normalizations++;

      return {
        normalized: true,
        operation: Object.freeze({
          ...normalized,
          canonicalForm: true
        })
      };
    } catch (err) {
      return {
        normalized: false,
        error: err.message
      };
    }
  }

  /**
   * Enforce domain constraints via invariants
   */
  enforceDomainConstraints(domainId) {
    const rules = this.translationRules.get(domainId);
    if (!rules) {
      return {
        enforced: false,
        reason: 'NO_RULES_REGISTERED'
      };
    }

    try {
      const invariants = [];

      // Transform each constraint into invariant rule
      for (const [constraintId, constraint] of Object.entries(rules.constraintToInvariant)) {
        invariants.push({
          invariantId: `${domainId}:${constraintId}`,
          rule: {
            level: constraint.level || 'CRITICAL',
            evaluate: constraint.check || (() => true)
          }
        });
      }

      return {
        enforced: true,
        domainId,
        invariantsGenerated: invariants.length,
        invariants
      };
    } catch (err) {
      return {
        enforced: false,
        error: err.message
      };
    }
  }

  /**
   * Default translate function (identity mapping)
   */
  _defaultTranslate(input) {
    // For event-driven domains: convert event to operation
    return {
      domainId: input.domainId,
      type: input.eventType || input.type,
      operationId: input.eventId || input.operationId,
      payload: input.payload || input,
      timestamp: input.timestamp || Date.now(),
      traceId: input.traceId || null,
      shardId: input.shardId || null
    };
  }

  /**
   * Default normalize function (canonical form)
   */
  _defaultNormalize(operation) {
    return {
      domainId: operation.domainId,
      type: operation.type,
      operationId: operation.operationId,
      payload: operation.payload,
      timestamp: operation.timestamp,
      validated: true,
      normalized: true
    };
  }

  /**
   * Get adapter for domain
   */
  getAdapter(domainId) {
    const entry = this.adapters.get(domainId);
    return entry ? entry.adapter : null;
  }

  /**
   * Get translation rules for domain
   */
  getTranslationRules(domainId) {
    return this.translationRules.get(domainId) || null;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      adaptersCount: this.adapters.size,
      rulesCount: this.translationRules.size,
      timestamp: Date.now()
    };
  }

  /**
   * Reset (for testing)
   */
  reset() {
    this.adapters.clear();
    this.translationRules.clear();
    this.stats = {
      adaptersRegistered: 0,
      translationsPerformed: 0,
      normalizations: 0,
      lastTranslation: null
    };
  }
}

module.exports = DomainAdapterRegistry;
