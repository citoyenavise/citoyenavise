/**
 * immutability/index.js - Export all Immutability & Sealing Components
 * PHASE 1.2 STEP 8: Industrial Governance
 *
 * Central export point for all immutability and sealing components
 */

const ChecksumVerifier = require('./ChecksumVerifier');
const FreezeEnforcer = require('./FreezeEnforcer');
const ImmutableSnapshotManager = require('./ImmutableSnapshotManager');
const ConstitutionIntegrityValidator = require('./ConstitutionIntegrityValidator');

module.exports = {
  // Individual immutability components
  ChecksumVerifier,
  FreezeEnforcer,
  ImmutableSnapshotManager,
  ConstitutionIntegrityValidator,

  // Factory functions
  createChecksumVerifier(options) {
    return new ChecksumVerifier(options);
  },

  createFreezeEnforcer(options) {
    return new FreezeEnforcer(options);
  },

  createSnapshotManager(options) {
    return new ImmutableSnapshotManager(options);
  },

  createIntegrityValidator(options) {
    return new ConstitutionIntegrityValidator(options);
  },

  // Integrated factory for complete immutability layer
  createImmutabilityLayer(options = {}) {
    const checksumVerifier = new ChecksumVerifier(options);
    const freezeEnforcer = new FreezeEnforcer(options);
    const snapshotManager = new ImmutableSnapshotManager(options);
    const integrityValidator = new ConstitutionIntegrityValidator(options);

    return {
      checksumVerifier,
      freezeEnforcer,
      snapshotManager,
      integrityValidator,

      // Integrated methods
      registerConstitutionalFile(filename, content) {
        return integrityValidator.registerConstitutionalFile(filename, content);
      },

      validateAndSeal(filename, content) {
        return integrityValidator.validateAndSeal(filename, content);
      },

      validateAllFiles(fileContents) {
        return integrityValidator.validateAllFiles(fileContents);
      },

      getConstitutionStatus() {
        return integrityValidator.getConstitutionStatus();
      },

      verifyIntegrity() {
        return integrityValidator.verifyIntegrity();
      },

      getImmutabilityStatus() {
        return {
          timestamp: new Date().toISOString(),
          checksums: checksumVerifier.getMetrics(),
          freeze: freezeEnforcer.getMetrics(),
          snapshots: snapshotManager.getMetrics(),
          overall: integrityValidator.getMetrics()
        };
      },

      generateImmutabilityReport() {
        return integrityValidator.generateImmutabilityReport();
      },

      reset() {
        integrityValidator.reset();
        return { reset: true };
      }
    };
  },

  // Version info
  version: '1.0.0',
  phase: '1.2',
  step: '8',
  name: 'Immutability & Sealing Layer'
};
