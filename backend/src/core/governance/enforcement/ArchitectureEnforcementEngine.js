/**
 * ArchitectureEnforcementEngine
 * PHASE 7.0.2 — Exécution des lois architecturales en runtime
 *
 * Transforme les specs PHASE 7.0.1 en enforcement executable.
 * Bloque les violations architecturales avant qu'elles ne se propagent.
 */

const SpecRegistry = require('../spec/index.js');
const DependencyGraph = require('../spec/DependencyGraph.js');
const InjectionMap = require('../spec/InjectionMap.js');
const ModuleContracts = require('../spec/ModuleContracts.js');
const EventRegistry = require('../spec/EventRegistry.js');
const SharedServicesRegistry = require('../spec/SharedServicesRegistry.js');
const ArchitectureGovernance = require('../spec/ArchitectureGovernance.js');
const BootstrapFlow = require('../spec/BootstrapFlow.js');
const Lifecycle = require('../spec/Lifecycle.js');
const HealthSystem = require('../spec/HealthSystem.js');
const EnforcementProofSystem = require('./EnforcementProofSystem');
const GlobalEventRegistry = require('../distributed/GlobalEventRegistry');

class ArchitectureEnforcementEngine {
  constructor(specRegistry = null) {
    // Load specifications
    this.spec = {
      DependencyGraph,
      InjectionMap,
      ModuleContracts,
      EventRegistry,
      SharedServicesRegistry,
      ArchitectureGovernance,
      BootstrapFlow,
      Lifecycle,
      HealthSystem
    };

    // Metrics counters
    this.metrics = {
      modulesValidated: 0,
      dependenciesValidated: 0,
      eventsValidated: 0,
      injectionsValidated: 0,
      lifecycleTransitions: 0,
      healthChecks: 0,
      warnings: 0,
      violations: 0,
      criticals: 0,
      fatals: 0,
      // PHASE 7.0.4: Enriched observability metrics
      enforcementSuccessCount: 0,
      enforcementViolationCount: 0,
      enforcementByModule: {},
      enforcementLatencyPerRule: {},
      // PHASE 7.3: Global idempotency metrics
      globalEventsDuplicated: 0,
      globalEventsDeduped: 0
    };

    // Audit trail (append-only)
    this.violationAudit = [];
    this.maxAuditSize = 10000;

    // PHASE 7.0.4: Proof system
    this.proofSystem = new EnforcementProofSystem();

    // PHASE 7.3: Global idempotency registry (cluster-wide deduplication)
    this.globalEventRegistry = new GlobalEventRegistry();

    // Lifecycle state tracking
    this.currentLifecycleState = 'UNDEFINED';
    this._bootstrapValid = false;

    // Run bootstrap validation
    this._runBootstrapValidation();
  }

  /**
   * BOOTSTRAP VALIDATION — Verify architecture at startup
   */
  _runBootstrapValidation() {
    try {
      // Verify dependency graph is acyclic
      if (!this.spec.DependencyGraph.isAcyclic()) {
        this._escalate(
          'FATAL',
          'DependencyGraph contains cycles',
          { graph: 'cyclic' }
        );
        this._bootstrapValid = false;
        return;
      }

      // Verify injection map consistency
      const injectionResult = this.spec.InjectionMap.validate();
      if (!injectionResult.valid) {
        this._escalate(
          'FATAL',
          'InjectionMap validation failed',
          injectionResult
        );
        this._bootstrapValid = false;
        return;
      }

      // Verify shared services singleton constraint
      const serviceResult = this.spec.SharedServicesRegistry.validateSingletonConstraint();
      if (!serviceResult.valid) {
        this._escalate(
          'FATAL',
          'SharedServicesRegistry singleton constraint violated',
          serviceResult
        );
        this._bootstrapValid = false;
        return;
      }

      this._bootstrapValid = true;
      console.log('[ArchitectureEnforcementEngine] Bootstrap validation PASSED');
    } catch (error) {
      this._escalate('FATAL', `Bootstrap validation error: ${error.message}`, { error });
      this._bootstrapValid = false;
    }
  }

  /**
   * AUDIT TRAIL — Append-only violation log
   */
  _appendAudit(entry) {
    this.violationAudit.push({
      ...entry,
      timestamp: new Date().toISOString()
    });

    // Cap at max size
    if (this.violationAudit.length > this.maxAuditSize) {
      this.violationAudit.shift();
    }
  }

  /**
   * ERROR ESCALATION — Handle violations by level
   */
  _escalate(level, message, context = {}) {
    const entry = { level, message, context };

    switch (level) {
      case 'WARNING':
        this.metrics.warnings++;
        console.log(`[WARN] ${message}`, context);
        this._appendAudit(entry);
        break;

      case 'VIOLATION':
        this.metrics.violations++;
        console.error(`[VIOLATION] ${message}`, context);
        this._appendAudit(entry);
        break;

      case 'CRITICAL':
        this.metrics.criticals++;
        console.error(`[CRITICAL] ${message}`, context);
        this._appendAudit(entry);
        break;

      case 'FATAL':
        this.metrics.fatals++;
        console.error(`[FATAL] ${message}`, context);
        this._appendAudit(entry);
        console.error('[FATAL] System diagnostics:', {
          bootstrapValid: this._bootstrapValid,
          currentState: this.currentLifecycleState,
          metricsSnapshot: this.metrics
        });
        break;
    }

    return entry;
  }

  /**
   * PHASE 7.0.4 — Record enforcement decision to proof system
   */
  _recordProof(context) {
    try {
      this.proofSystem.captureDecision({
        ...context,
        engineState: {
          currentLifecycleState: this.currentLifecycleState,
          bootstrapValid: this._bootstrapValid
        }
      });

      // Update observability metrics
      const mod = context.module;
      if (!this.metrics.enforcementByModule[mod]) {
        this.metrics.enforcementByModule[mod] = { success: 0, violation: 0 };
      }
      if (context.result?.valid) {
        this.metrics.enforcementSuccessCount++;
        this.metrics.enforcementByModule[mod].success++;
      } else {
        this.metrics.enforcementViolationCount++;
        this.metrics.enforcementByModule[mod].violation++;
      }

      // Track latency per action
      const action = context.action;
      if (!this.metrics.enforcementLatencyPerRule[action]) {
        this.metrics.enforcementLatencyPerRule[action] = [];
      }
      this.metrics.enforcementLatencyPerRule[action].push(context.latencyMs || 0);
      if (this.metrics.enforcementLatencyPerRule[action].length > 1000) {
        this.metrics.enforcementLatencyPerRule[action].shift();
      }
    } catch (e) {
      // Proof system failure never blocks enforcement
    }
  }

  /**
   * 1. MODULE LOAD VALIDATION
   */
  validateModule(moduleName) {
    const startTime = Date.now();
    let result = { valid: true };

    // Check if module is in DependencyGraph
    if (!(moduleName in this.spec.DependencyGraph.modules)) {
      result = {
        valid: false,
        reason: 'MODULE_NOT_IN_SPEC',
        level: 'VIOLATION',
        moduleName
      };
      this._escalate('VIOLATION', `Module '${moduleName}' not in architecture spec`, result);
      this.metrics.modulesValidated++;
      this._recordProof({
        module: moduleName,
        action: 'validateModule',
        ruleEvaluated: 'module_in_spec + has_contract',
        input: { moduleName },
        result,
        severity: 'VIOLATION',
        enforcementLayer: 'MODULE',
        startTime
      });
      return result;
    }

    // Check if module has a contract in ModuleContracts
    if (!(moduleName in this.spec.ModuleContracts)) {
      result = {
        valid: false,
        reason: 'NO_CONTRACT',
        level: 'VIOLATION',
        moduleName
      };
      this._escalate('VIOLATION', `Module '${moduleName}' has no contract`, result);
      this.metrics.modulesValidated++;
      this._recordProof({
        module: moduleName,
        action: 'validateModule',
        ruleEvaluated: 'module_in_spec + has_contract',
        input: { moduleName },
        result,
        severity: 'VIOLATION',
        enforcementLayer: 'MODULE',
        startTime
      });
      return result;
    }

    this.metrics.modulesValidated++;
    this._recordProof({
      module: moduleName,
      action: 'validateModule',
      ruleEvaluated: 'module_in_spec + has_contract',
      input: { moduleName },
      result,
      severity: 'INFO',
      enforcementLayer: 'MODULE',
      startTime
    });
    return result;
  }

  /**
   * 2. DEPENDENCY VALIDATION
   */
  validateDependency(module, dependency) {
    const startTime = Date.now();
    let result = { valid: true };

    // Check if module exists
    if (!(module in this.spec.DependencyGraph.modules)) {
      const error = new Error(`ARCHITECTURE_VIOLATION: module '${module}' unknown`);
      error.code = 'ARCHITECTURE_VIOLATION';
      result = { valid: false, reason: 'MODULE_UNKNOWN' };
      this._escalate('VIOLATION', `Unknown module in dependency check: ${module}`, { module, dependency });
      this.metrics.dependenciesValidated++;
      this._recordProof({
        module,
        action: 'validateDependency',
        ruleEvaluated: 'dependency_authorized + no_cycles',
        input: { module, dependency },
        result,
        severity: 'VIOLATION',
        enforcementLayer: 'DEPENDENCY',
        startTime
      });
      throw error;
    }

    // Check if dependency is authorized
    const allowedDeps = this.spec.DependencyGraph.modules[module];
    if (!allowedDeps.includes(dependency)) {
      const error = new Error(`ARCHITECTURE_VIOLATION: '${module}' → '${dependency}' not authorized`);
      error.code = 'ARCHITECTURE_VIOLATION';
      result = { valid: false, reason: 'UNAUTHORIZED_DEPENDENCY' };
      this._escalate('VIOLATION', `Unauthorized dependency`, { module, dependency });
      this.metrics.dependenciesValidated++;
      this._recordProof({
        module,
        action: 'validateDependency',
        ruleEvaluated: 'dependency_authorized + no_cycles',
        input: { module, dependency },
        result,
        severity: 'VIOLATION',
        enforcementLayer: 'DEPENDENCY',
        startTime
      });
      throw error;
    }

    // Verify graph is still acyclic
    if (!this.spec.DependencyGraph.isAcyclic()) {
      const error = new Error('ARCHITECTURE_VIOLATION: dependency graph has cycles');
      error.code = 'ARCHITECTURE_VIOLATION';
      result = { valid: false, reason: 'CYCLE_DETECTED' };
      this._escalate('CRITICAL', 'Dependency cycle detected', { module, dependency });
      this._recordProof({
        module,
        action: 'validateDependency',
        ruleEvaluated: 'dependency_authorized + no_cycles',
        input: { module, dependency },
        result,
        severity: 'CRITICAL',
        enforcementLayer: 'DEPENDENCY',
        startTime
      });
      throw error;
    }

    this.metrics.dependenciesValidated++;
    this._recordProof({
      module,
      action: 'validateDependency',
      ruleEvaluated: 'dependency_authorized + no_cycles',
      input: { module, dependency },
      result,
      severity: 'INFO',
      enforcementLayer: 'DEPENDENCY',
      startTime
    });
    return result;
  }

  /**
   * 3. EVENT CONTRACT VALIDATION
   * PHASE 7.3: STEP 0 — Global idempotency check (BEFORE enforcement)
   */
  validateEvent(eventType, producer, event) {
    const startTime = Date.now();
    let result = { valid: true };

    // PHASE 7.3: STEP 0 — Check for duplicate eventId (cluster-wide idempotency)
    if (event && event.eventId) {
      const isDuplicate = this.globalEventRegistry.isDuplicate(event.eventId);
      if (isDuplicate) {
        this.metrics.eventsValidated++;
        this.metrics.globalEventsDuplicated++;
        result = { valid: false, action: 'DROP', alert: true, reason: 'DUPLICATE_EVENT_ID' };
        this._escalate('VIOLATION', `Duplicate event rejected: ${event.eventId}`, { eventId: event.eventId });
        this._recordProof({
          module: producer || 'unknown',
          action: 'validateEvent',
          ruleEvaluated: 'global_idempotency_check + event_not_duplicate',
          input: { eventType, producer, eventId: event.eventId },
          result,
          severity: 'VIOLATION',
          enforcementLayer: 'EVENT_BUS',
          startTime
        });
        return result;
      }
    }

    // Check if event type exists (filter out methods by checking .schema)
    const definition = this.spec.EventRegistry[eventType];
    if (!definition || typeof definition !== 'object' || !definition.schema) {
      this.metrics.eventsValidated++;
      result = { valid: false, action: 'DROP', alert: true, reason: 'UNKNOWN_EVENT_TYPE' };
      this._escalate('VIOLATION', `Unknown event type: ${eventType}`, { eventType });
      this._recordProof({
        module: producer || 'unknown',
        action: 'validateEvent',
        ruleEvaluated: 'event_in_registry + schema_valid + source_matches',
        input: { eventType, producer },
        result,
        severity: 'VIOLATION',
        enforcementLayer: 'EVENT_BUS',
        startTime
      });
      return result;
    }

    // Validate event schema using EventRegistry.validate()
    const schemaResult = this.spec.EventRegistry.validate(eventType, event);
    if (!schemaResult.valid) {
      this.metrics.eventsValidated++;
      result = { valid: false, action: 'DROP', alert: true, reason: 'SCHEMA_INVALID' };
      this._escalate('VIOLATION', `Event schema invalid: ${schemaResult.error}`, { eventType, error: schemaResult.error });
      this._recordProof({
        module: producer || 'unknown',
        action: 'validateEvent',
        ruleEvaluated: 'event_in_registry + schema_valid + source_matches',
        input: { eventType, producer },
        result,
        severity: 'VIOLATION',
        enforcementLayer: 'EVENT_BUS',
        startTime
      });
      return result;
    }

    // Verify event source matches canonical source
    if (event.source && event.source !== definition.source) {
      this.metrics.eventsValidated++;
      result = { valid: false, action: 'DROP', alert: true, reason: 'SOURCE_MISMATCH' };
      this._escalate('VIOLATION', `Event source mismatch`, {
        eventType,
        expected: definition.source,
        got: event.source
      });
      this._recordProof({
        module: producer || 'unknown',
        action: 'validateEvent',
        ruleEvaluated: 'event_in_registry + schema_valid + source_matches',
        input: { eventType, producer },
        result,
        severity: 'VIOLATION',
        enforcementLayer: 'EVENT_BUS',
        startTime
      });
      return result;
    }

    this.metrics.eventsValidated++;

    // PHASE 7.3: Record valid event in global registry for cluster-wide idempotency
    if (event && event.eventId && event.traceId) {
      const registryResult = this.globalEventRegistry.recordEvent(
        event.eventId,
        event.traceId,
        event.shardId || 'unknown',
        event.nodeId || 'unknown'
      );
      if (registryResult.recorded) {
        this.metrics.globalEventsDeduped++;
      }
    }

    this._recordProof({
      module: producer || 'unknown',
      action: 'validateEvent',
      ruleEvaluated: 'event_in_registry + schema_valid + source_matches + global_idempotency',
      input: { eventType, producer },
      result,
      severity: 'INFO',
      enforcementLayer: 'EVENT_BUS',
      startTime
    });
    return result;
  }

  /**
   * 4. INJECTION VALIDATION
   */
  validateInjection(module, service) {
    const startTime = Date.now();
    let result = { valid: true };

    // Check if module has authorization for this service
    const allowedServices = this.spec.InjectionMap.modules[module];
    if (!allowedServices || !allowedServices.includes(service)) {
      result = {
        valid: false,
        reason: 'UNAUTHORIZED_INJECTION',
        action: 'BLOCK'
      };
      this._escalate('VIOLATION', `Unauthorized injection: ${module} → ${service}`, result);
      this.metrics.injectionsValidated++;
      this._recordProof({
        module,
        action: 'validateInjection',
        ruleEvaluated: 'injection_authorized + service_exists',
        input: { module, service },
        result,
        severity: 'VIOLATION',
        enforcementLayer: 'INJECTION',
        startTime
      });
      return result;
    }

    // Verify service exists in SharedServicesRegistry (direct key access)
    const serviceEntry = this.spec.SharedServicesRegistry[service];
    if (!serviceEntry || typeof serviceEntry !== 'object' || !serviceEntry.serviceId) {
      result = {
        valid: false,
        reason: 'UNAUTHORIZED_INJECTION',
        action: 'BLOCK'
      };
      this._escalate('VIOLATION', `Service not found in registry: ${service}`, result);
      this.metrics.injectionsValidated++;
      this._recordProof({
        module,
        action: 'validateInjection',
        ruleEvaluated: 'injection_authorized + service_exists',
        input: { module, service },
        result,
        severity: 'VIOLATION',
        enforcementLayer: 'INJECTION',
        startTime
      });
      return result;
    }

    this.metrics.injectionsValidated++;
    this._recordProof({
      module,
      action: 'validateInjection',
      ruleEvaluated: 'injection_authorized + service_exists',
      input: { module, service },
      result,
      severity: 'INFO',
      enforcementLayer: 'INJECTION',
      startTime
    });
    return result;
  }

  /**
   * 5. LIFECYCLE VALIDATION
   */
  validateLifecycle(fromState, toState) {
    const startTime = Date.now();
    const transitionKey = `${fromState} → ${toState}`;
    let result = { valid: true };

    // Check if transition is valid
    if (!(transitionKey in this.spec.Lifecycle.transitions)) {
      result = {
        valid: false,
        reason: 'INVALID_TRANSITION'
      };
      this._escalate('CRITICAL', `Invalid lifecycle transition: ${transitionKey}`, result);
      this.metrics.lifecycleTransitions++;
      this._recordProof({
        module: 'ArchitectureEnforcementEngine',
        action: 'validateLifecycle',
        ruleEvaluated: 'transition_valid',
        input: { fromState, toState },
        result,
        severity: 'CRITICAL',
        enforcementLayer: 'LIFECYCLE',
        startTime
      });
      return result;
    }

    // Update current state
    this.currentLifecycleState = toState;
    this.metrics.lifecycleTransitions++;
    this._recordProof({
      module: 'ArchitectureEnforcementEngine',
      action: 'validateLifecycle',
      ruleEvaluated: 'transition_valid',
      input: { fromState, toState },
      result,
      severity: 'INFO',
      enforcementLayer: 'LIFECYCLE',
      startTime
    });
    return result;
  }

  /**
   * 6. RUNTIME HEALTH MONITORING
   */
  monitorSystemHealth(checkResults) {
    // Delegate to HealthSystem
    const statusLevel = this.spec.HealthSystem.getHealthStatus(checkResults);
    this.metrics.healthChecks++;

    // Update lifecycle if degraded
    if (statusLevel.value === 1) {
      // DEGRADED
      this.currentLifecycleState = 'DEGRADED';
    } else if (statusLevel.value >= 2) {
      // CRITICAL or OFFLINE
      if (this.currentLifecycleState !== 'SHUTDOWN') {
        this.currentLifecycleState = 'DEGRADED';
      }
    }

    return statusLevel;
  }

  /**
   * PHASE 7.0.5 — Flush batch proofs to observability layer
   * Non-blocking: safe to call during enforcement
   */
  flushBatchProofs() {
    return this.proofSystem.compactProofs();
  }

  /**
   * PHASE 7.0.5 — Get proof system performance metrics
   */
  getProofSystemPerformance() {
    const proofMetrics = this.proofSystem.getMetrics();
    return {
      realTimeLatencyMs: proofMetrics.realTimeLatencyMs,
      batchQueueDepth: proofMetrics.batchQueueDepth,
      proofFlushRate: proofMetrics.proofFlushRate,
      chainLength: proofMetrics.chainLength,
      batchFlushed: proofMetrics.batchFlushed
    };
  }

  /**
   * INTROSPECTION — Get full engine report
   */
  getReport() {
    return {
      metrics: { ...this.metrics },
      violationAudit: this.violationAudit.slice(-100),
      currentLifecycleState: this.currentLifecycleState,
      bootstrapValid: this._bootstrapValid,
      proofSystemStats: this.proofSystem.getMetrics(),
      proofPerformance: this.getProofSystemPerformance(),
      globalIdempotencyStats: this.globalEventRegistry.getMetrics(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * PHASE 7.0.3 — System readiness guard for orchestrators
   * Validates that the system is in an operational state (READY or DEGRADED)
   */
  validateSystemReadiness() {
    const startTime = Date.now();
    const operationalStates = ['READY', 'DEGRADED'];
    const isOperational = operationalStates.includes(this.currentLifecycleState);
    let result = { valid: true };

    if (!isOperational) {
      result = {
        valid: false,
        reason: 'SYSTEM_NOT_READY',
        currentState: this.currentLifecycleState
      };
      this._escalate('CRITICAL', `System not in operational state: ${this.currentLifecycleState}`, {});
      this._recordProof({
        module: 'ArchitectureEnforcementEngine',
        action: 'validateSystemReadiness',
        ruleEvaluated: 'system_in_operational_state',
        input: { currentState: this.currentLifecycleState },
        result,
        severity: 'CRITICAL',
        enforcementLayer: 'HEALTH',
        startTime
      });
      return result;
    }

    result = { valid: true, currentState: this.currentLifecycleState };
    this._recordProof({
      module: 'ArchitectureEnforcementEngine',
      action: 'validateSystemReadiness',
      ruleEvaluated: 'system_in_operational_state',
      input: { currentState: this.currentLifecycleState },
      result,
      severity: 'INFO',
      enforcementLayer: 'HEALTH',
      startTime
    });
    return result;
  }
}

module.exports = ArchitectureEnforcementEngine;
