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
      fatals: 0
    };

    // Audit trail (append-only)
    this.violationAudit = [];
    this.maxAuditSize = 10000;

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
   * 1. MODULE LOAD VALIDATION
   */
  validateModule(moduleName) {
    // Check if module is in DependencyGraph
    if (!(moduleName in this.spec.DependencyGraph.modules)) {
      const result = {
        valid: false,
        reason: 'MODULE_NOT_IN_SPEC',
        level: 'VIOLATION',
        moduleName
      };
      this._escalate('VIOLATION', `Module '${moduleName}' not in architecture spec`, result);
      this.metrics.modulesValidated++;
      return result;
    }

    // Check if module has a contract in ModuleContracts
    if (!(moduleName in this.spec.ModuleContracts)) {
      const result = {
        valid: false,
        reason: 'NO_CONTRACT',
        level: 'VIOLATION',
        moduleName
      };
      this._escalate('VIOLATION', `Module '${moduleName}' has no contract`, result);
      this.metrics.modulesValidated++;
      return result;
    }

    this.metrics.modulesValidated++;
    return { valid: true };
  }

  /**
   * 2. DEPENDENCY VALIDATION
   */
  validateDependency(module, dependency) {
    // Check if module exists
    if (!(module in this.spec.DependencyGraph.modules)) {
      const error = new Error(`ARCHITECTURE_VIOLATION: module '${module}' unknown`);
      error.code = 'ARCHITECTURE_VIOLATION';
      this._escalate('VIOLATION', `Unknown module in dependency check: ${module}`, { module, dependency });
      this.metrics.dependenciesValidated++;
      throw error;
    }

    // Check if dependency is authorized
    const allowedDeps = this.spec.DependencyGraph.modules[module];
    if (!allowedDeps.includes(dependency)) {
      const error = new Error(`ARCHITECTURE_VIOLATION: '${module}' → '${dependency}' not authorized`);
      error.code = 'ARCHITECTURE_VIOLATION';
      this._escalate('VIOLATION', `Unauthorized dependency`, { module, dependency });
      this.metrics.dependenciesValidated++;
      throw error;
    }

    // Verify graph is still acyclic
    if (!this.spec.DependencyGraph.isAcyclic()) {
      const error = new Error('ARCHITECTURE_VIOLATION: dependency graph has cycles');
      error.code = 'ARCHITECTURE_VIOLATION';
      this._escalate('CRITICAL', 'Dependency cycle detected', { module, dependency });
      throw error;
    }

    this.metrics.dependenciesValidated++;
    return { valid: true };
  }

  /**
   * 3. EVENT CONTRACT VALIDATION
   */
  validateEvent(eventType, producer, event) {
    // Check if event type exists (filter out methods by checking .schema)
    const definition = this.spec.EventRegistry[eventType];
    if (!definition || typeof definition !== 'object' || !definition.schema) {
      this.metrics.eventsValidated++;
      this._escalate('VIOLATION', `Unknown event type: ${eventType}`, { eventType });
      return { valid: false, action: 'DROP', alert: true };
    }

    // Validate event schema using EventRegistry.validate()
    const schemaResult = this.spec.EventRegistry.validate(eventType, event);
    if (!schemaResult.valid) {
      this.metrics.eventsValidated++;
      this._escalate('VIOLATION', `Event schema invalid: ${schemaResult.error}`, { eventType, error: schemaResult.error });
      return { valid: false, action: 'DROP', alert: true };
    }

    // Verify event source matches canonical source
    if (event.source && event.source !== definition.source) {
      this.metrics.eventsValidated++;
      this._escalate('VIOLATION', `Event source mismatch`, {
        eventType,
        expected: definition.source,
        got: event.source
      });
      return { valid: false, action: 'DROP', alert: true };
    }

    this.metrics.eventsValidated++;
    return { valid: true };
  }

  /**
   * 4. INJECTION VALIDATION
   */
  validateInjection(module, service) {
    // Check if module has authorization for this service
    const allowedServices = this.spec.InjectionMap.modules[module];
    if (!allowedServices || !allowedServices.includes(service)) {
      const result = {
        valid: false,
        reason: 'UNAUTHORIZED_INJECTION',
        action: 'BLOCK',
        module,
        service
      };
      this._escalate('VIOLATION', `Unauthorized injection: ${module} → ${service}`, result);
      this.metrics.injectionsValidated++;
      return result;
    }

    // Verify service exists in SharedServicesRegistry (direct key access)
    const serviceEntry = this.spec.SharedServicesRegistry[service];
    if (!serviceEntry || typeof serviceEntry !== 'object' || !serviceEntry.serviceId) {
      const result = {
        valid: false,
        reason: 'UNAUTHORIZED_INJECTION',
        action: 'BLOCK',
        module,
        service
      };
      this._escalate('VIOLATION', `Service not found in registry: ${service}`, result);
      this.metrics.injectionsValidated++;
      return result;
    }

    this.metrics.injectionsValidated++;
    return { valid: true };
  }

  /**
   * 5. LIFECYCLE VALIDATION
   */
  validateLifecycle(fromState, toState) {
    // Construct transition key
    const transitionKey = `${fromState} → ${toState}`;

    // Check if transition is valid
    if (!(transitionKey in this.spec.Lifecycle.transitions)) {
      const result = {
        valid: false,
        level: 'CRITICAL',
        fromState,
        toState
      };
      this._escalate('CRITICAL', `Invalid lifecycle transition: ${transitionKey}`, result);
      this.metrics.lifecycleTransitions++;
      return result;
    }

    // Update current state
    this.currentLifecycleState = toState;
    this.metrics.lifecycleTransitions++;
    return { valid: true };
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
   * INTROSPECTION — Get full engine report
   */
  getReport() {
    return {
      metrics: { ...this.metrics },
      violationAudit: this.violationAudit.slice(-100),
      currentLifecycleState: this.currentLifecycleState,
      bootstrapValid: this._bootstrapValid,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ArchitectureEnforcementEngine;
