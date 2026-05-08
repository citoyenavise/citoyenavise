/**
 * loaders/index.js - Export all PHASE 1.2 Runtime Loaders
 * PHASE 1.2: Runtime Loaders
 *
 * Central export point for all constitutional loaders
 */

const ModuleManifestLoader = require('./ModuleManifestLoader');
const SchemaRegistryLoader = require('./SchemaRegistryLoader');
const DependencyRulesLoader = require('./DependencyRulesLoader');
const CapabilityRegistryLoader = require('./CapabilityRegistryLoader');
const GovernancePoliciesLoader = require('./GovernancePoliciesLoader');
const IdentityRegistryLoader = require('./IdentityRegistryLoader');
const VersioningPolicyLoader = require('./VersioningPolicyLoader');
const ConstitutionLoaderManager = require('./ConstitutionLoaderManager');

module.exports = {
  // Individual loaders
  ModuleManifestLoader,
  SchemaRegistryLoader,
  DependencyRulesLoader,
  CapabilityRegistryLoader,
  GovernancePoliciesLoader,
  IdentityRegistryLoader,
  VersioningPolicyLoader,

  // Manager for orchestrated loading
  ConstitutionLoaderManager,

  // Factory function for quick initialization
  createConstitutionManager() {
    return new ConstitutionLoaderManager();
  },

  // Version info
  version: '1.0.0',
  phase: '1.2',
  name: 'Runtime Loaders'
};
