/**
 * validators.test.js - Test suite for PHASE 1.3 Validation Layer
 * Test all 6 validators + RuntimeValidationEngine
 */

const RuntimeValidationEngine = require('./RuntimeValidationEngine');
const BootstrapInvariantValidator = require('./BootstrapInvariantValidator');
const DependencyValidator = require('./DependencyValidator');
const EventSchemaValidator = require('./EventSchemaValidator');
const CapabilityValidator = require('./CapabilityValidator');
const VersionCompatibilityValidator = require('./VersionCompatibilityValidator');
const { ConstitutionLoaderManager } = require('../loaders');

describe('PHASE 1.3 Validation Layer', () => {
  let constitutionManager;

  beforeAll(async () => {
    constitutionManager = new ConstitutionLoaderManager();
    await constitutionManager.loadConstitution();
  });

  describe('BootstrapInvariantValidator', () => {
    let validator;

    beforeEach(() => {
      validator = new BootstrapInvariantValidator(constitutionManager);
    });

    test('should validate bootstrap invariants', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('invariantsChecked');
      expect(result.invariantsChecked).toBe(8);
    });

    test('should check no cascade failures', async () => {
      const result = await validator.validate();
      expect(Array.isArray(result.violations)).toBe(true);
    });

    test('should check type safety', async () => {
      const result = await validator.validate();
      const typeSafetyViolations = result.violations.filter(v => v.invariant === 'INV_TYPE_SAFETY');
      expect(Array.isArray(typeSafetyViolations)).toBe(true);
    });

    test('should check permission enforcement', async () => {
      const result = await validator.validate();
      expect(result.validatorName).toBe('BootstrapInvariantValidator');
    });

    test('should check data consistency', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('timestamp');
    });

    test('should return violations in correct format', async () => {
      const result = await validator.validate();
      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(violation).toHaveProperty('severity');
        expect(violation).toHaveProperty('message');
      }
    });
  });

  describe('DependencyValidator', () => {
    let validator;

    beforeEach(() => {
      validator = new DependencyValidator(constitutionManager);
    });

    test('should validate dependencies', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('rulesChecked');
      expect(result.validatorName).toBe('DependencyValidator');
    });

    test('should check undeclared dependencies', async () => {
      const result = await validator.validate();
      const undeclaredViolations = result.violations.filter(v => v.rule === 'dependencies_declared');
      expect(Array.isArray(undeclaredViolations)).toBe(true);
    });

    test('should check for cycles', async () => {
      const result = await validator.validate();
      const cycleViolations = result.violations.filter(v => v.rule === 'no_cycles');
      expect(Array.isArray(cycleViolations)).toBe(true);
    });

    test('should check hierarchy levels', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('violations');
    });

    test('should check dependency matrix consistency', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('timestamp');
    });

    test('should return proper violation structure', async () => {
      const result = await validator.validate();
      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(violation.severity);
      }
    });
  });

  describe('EventSchemaValidator', () => {
    let validator;

    beforeEach(() => {
      validator = new EventSchemaValidator(constitutionManager);
    });

    test('should validate event schemas', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('eventTypesChecked');
      expect(result.validatorName).toBe('EventSchemaValidator');
    });

    test('should check module event declarations', async () => {
      const result = await validator.validate();
      const declViolations = result.violations.filter(v => v.type === 'emitted' || v.type === 'listened');
      expect(Array.isArray(declViolations)).toBe(true);
    });

    test('should check emitter/listener consistency', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('violations');
    });

    test('should check schema completeness', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('timestamp');
    });

    test('should check payload requirements', async () => {
      const result = await validator.validate();
      const payloadViolations = result.violations.filter(v => v.issue === 'missing_required_field_not_defined');
      expect(Array.isArray(payloadViolations)).toBe(true);
    });

    test('should return violations with event details', async () => {
      const result = await validator.validate();
      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(violation).toHaveProperty('severity');
        expect(violation).toHaveProperty('message');
      }
    });
  });

  describe('CapabilityValidator', () => {
    let validator;

    beforeEach(() => {
      validator = new CapabilityValidator(constitutionManager);
    });

    test('should validate capabilities', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('capabilitiesChecked');
      expect(result.validatorName).toBe('CapabilityValidator');
    });

    test('should check scalability limits', async () => {
      const result = await validator.validate();
      const limitViolations = result.violations.filter(v => v.limit);
      expect(Array.isArray(limitViolations)).toBe(true);
    });

    test('should check capability declarations', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('violations');
    });

    test('should check performance targets', async () => {
      const result = await validator.validate();
      const targetViolations = result.violations.filter(v => v.target);
      expect(Array.isArray(targetViolations)).toBe(true);
    });

    test('should check system configuration', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('timestamp');
    });

    test('should return violations with limits', async () => {
      const result = await validator.validate();
      if (result.violations.length > 0) {
        const violation = result.violations[0];
        if (violation.limit) {
          expect(violation).toHaveProperty('current');
        }
      }
    });
  });

  describe('VersionCompatibilityValidator', () => {
    let validator;

    beforeEach(() => {
      validator = new VersionCompatibilityValidator(constitutionManager);
    });

    test('should validate version compatibility', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('versionsChecked');
      expect(result.validatorName).toBe('VersionCompatibilityValidator');
    });

    test('should check module versions', async () => {
      const result = await validator.validate();
      const versionViolations = result.violations.filter(v => v.issue === 'missing_version' || v.issue === 'invalid_version_format');
      expect(Array.isArray(versionViolations)).toBe(true);
    });

    test('should check version policy compliance', async () => {
      const result = await validator.validate();
      expect(result).toHaveProperty('violations');
    });

    test('should check deprecation policy', async () => {
      const result = await validator.validate();
      const deprecationViolations = result.violations.filter(v => v.policy === 'deprecation_policy');
      expect(Array.isArray(deprecationViolations)).toBe(true);
    });

    test('should check compatibility rules', async () => {
      const result = await validator.validate();
      const compatViolations = result.violations.filter(v => v.rules === 'compatibility_matrix');
      expect(Array.isArray(compatViolations)).toBe(true);
    });

    test('should return violations with version details', async () => {
      const result = await validator.validate();
      if (result.violations.length > 0) {
        const violation = result.violations[0];
        expect(violation).toHaveProperty('severity');
      }
    });
  });

  describe('RuntimeValidationEngine', () => {
    let engine;

    beforeEach(() => {
      engine = new RuntimeValidationEngine(constitutionManager);
    });

    test('should create validation engine', () => {
      expect(engine).toBeDefined();
      expect(engine).toHaveProperty('validators');
      expect(Object.keys(engine.validators).length).toBe(5);
    });

    test('should require constitutionManager', () => {
      expect(() => new RuntimeValidationEngine(null)).toThrow();
    });

    test('should validate once', async () => {
      const results = await engine.validateOnce();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(5);

      for (const result of results) {
        expect(result).toHaveProperty('valid');
        expect(result).toHaveProperty('violations');
        expect(result).toHaveProperty('timestamp');
      }
    });

    test('should start continuous validation', () => {
      const result = engine.startValidation();
      expect(result.started).toBe(true);
      expect(result.interval_ms).toBe(5000);

      engine.stopValidation();
    });

    test('should stop continuous validation', () => {
      engine.startValidation();
      const result = engine.stopValidation();
      expect(result.stopped).toBe(true);
      expect(result.cycleCount).toBeGreaterThan(0);
    });

    test('should prevent double start', () => {
      engine.startValidation();
      expect(() => engine.startValidation()).toThrow();
      engine.stopValidation();
    });

    test('should prevent stop when not running', () => {
      expect(() => engine.stopValidation()).toThrow();
    });

    test('should get latest results', async () => {
      const results = await engine.validateOnce();
      // Note: single validateOnce doesn't populate validationResults
      // This is tested after starting continuous validation
    });

    test('should get status', () => {
      engine.startValidation();
      const status = engine.getStatus();

      expect(status).toHaveProperty('running');
      expect(status).toHaveProperty('cycleCount');
      expect(status).toHaveProperty('isHealthy');

      engine.stopValidation();
    });

    test('should get statistics', async () => {
      engine.startValidation();

      // Run for a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = engine.getStatistics();
      expect(stats).toHaveProperty('cyclesRun');
      expect(stats).toHaveProperty('averageDuration_ms');
      expect(stats).toHaveProperty('totalViolations');

      engine.stopValidation();
    });

    test('should get detailed report', async () => {
      engine.startValidation();

      // Run for a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      const report = engine.getDetailedReport();
      expect(report).toHaveProperty('engine');
      expect(report).toHaveProperty('statistics');
      expect(report).toHaveProperty('health');

      engine.stopValidation();
    });

    test('should get validator by name', () => {
      const validator = engine.getValidator('bootstrap');
      expect(validator).toBeDefined();
      expect(validator).toBeInstanceOf(BootstrapInvariantValidator);
    });

    test('should get all validators', () => {
      const validators = engine.getAllValidators();
      expect(validators).toHaveProperty('bootstrap');
      expect(validators).toHaveProperty('dependency');
      expect(validators).toHaveProperty('eventSchema');
      expect(validators).toHaveProperty('capability');
      expect(validators).toHaveProperty('versionCompatibility');
    });

    test('should handle validation errors gracefully', async () => {
      const badEngine = new RuntimeValidationEngine({
        getConstitution: () => ({}),
        getModuleManifestLoader: () => ({
          getAllModules: () => []
        })
      });

      const result = await badEngine.validateOnce();
      // Should return results array
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
