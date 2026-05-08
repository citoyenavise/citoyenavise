/**
 * enforcement/index.js - Export all PHASE 1.4 Enforcers
 * PHASE 1.4: Enforcement Layer
 *
 * Central export point for all enforcement components
 */

const RuntimeEnforcementEngine = require('./RuntimeEnforcementEngine');
const DependencyEnforcer = require('./DependencyEnforcer');
const CapabilityEnforcer = require('./CapabilityEnforcer');
const StateTransitionEnforcer = require('./StateTransitionEnforcer');
const AccessBoundaryEnforcer = require('./AccessBoundaryEnforcer');

module.exports = {
  // Main enforcement engine
  RuntimeEnforcementEngine,

  // Individual enforcers
  DependencyEnforcer,
  CapabilityEnforcer,
  StateTransitionEnforcer,
  AccessBoundaryEnforcer,

  // Factory function for quick initialization
  createEnforcementEngine(constitutionManager, validationEngine) {
    return new RuntimeEnforcementEngine(constitutionManager, validationEngine);
  },

  // Version info
  version: '1.0.0',
  phase: '1.4',
  name: 'Enforcement Layer'
};
