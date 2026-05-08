/**
 * validators/index.js - Export all PHASE 1.3 Validators
 * PHASE 1.3: Validation Layer
 *
 * Central export point for all validation components
 */

const RuntimeValidationEngine = require('./RuntimeValidationEngine');
const BootstrapInvariantValidator = require('./BootstrapInvariantValidator');
const DependencyValidator = require('./DependencyValidator');
const EventSchemaValidator = require('./EventSchemaValidator');
const CapabilityValidator = require('./CapabilityValidator');
const VersionCompatibilityValidator = require('./VersionCompatibilityValidator');

module.exports = {
  // Main validation engine
  RuntimeValidationEngine,

  // Individual validators
  BootstrapInvariantValidator,
  DependencyValidator,
  EventSchemaValidator,
  CapabilityValidator,
  VersionCompatibilityValidator,

  // Factory function for quick initialization
  createValidationEngine(constitutionManager) {
    return new RuntimeValidationEngine(constitutionManager);
  },

  // Version info
  version: '1.0.0',
  phase: '1.3',
  name: 'Validation Layer'
};
