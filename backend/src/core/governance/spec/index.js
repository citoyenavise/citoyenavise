/**
 * Architecture Specification Index
 * PHASE 7.0.1 — Canonical System Specifications
 *
 * Single import point for all system specifications.
 */

const BootstrapFlow = require('./BootstrapFlow');
const DependencyGraph = require('./DependencyGraph');
const ModuleContracts = require('./ModuleContracts');
const EventRegistry = require('./EventRegistry');
const SharedServicesRegistry = require('./SharedServicesRegistry');
const InjectionMap = require('./InjectionMap');
const Lifecycle = require('./Lifecycle');
const HealthSystem = require('./HealthSystem');
const ErrorIsolation = require('./ErrorIsolation');
const ArchitectureGovernance = require('./ArchitectureGovernance');

module.exports = {
  BootstrapFlow,
  DependencyGraph,
  ModuleContracts,
  EventRegistry,
  SharedServicesRegistry,
  InjectionMap,
  Lifecycle,
  HealthSystem,
  ErrorIsolation,
  ArchitectureGovernance,

  // Validation entry point
  validateArchitecture() {
    const results = {
      dependencyGraph: DependencyGraph.isAcyclic(),
      injectionMap: InjectionMap.validate(),
      sharedServices: SharedServicesRegistry.validateSingletonConstraint(),
      governance: ArchitectureGovernance.validate()
    };

    const allValid = Object.values(results).every((r) => r.valid !== false);

    return {
      valid: allValid,
      results,
      timestamp: new Date().toISOString()
    };
  }
};
