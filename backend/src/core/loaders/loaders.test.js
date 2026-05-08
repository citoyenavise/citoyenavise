/**
 * loaders.test.js - Test suite for PHASE 1.2 Runtime Loaders
 * Test all 7 loaders + ConstitutionLoaderManager
 */

const ModuleManifestLoader = require('./ModuleManifestLoader');
const SchemaRegistryLoader = require('./SchemaRegistryLoader');
const DependencyRulesLoader = require('./DependencyRulesLoader');
const CapabilityRegistryLoader = require('./CapabilityRegistryLoader');
const GovernancePoliciesLoader = require('./GovernancePoliciesLoader');
const IdentityRegistryLoader = require('./IdentityRegistryLoader');
const VersioningPolicyLoader = require('./VersioningPolicyLoader');
const ConstitutionLoaderManager = require('./ConstitutionLoaderManager');

describe('PHASE 1.2 Runtime Loaders', () => {
  describe('ModuleManifestLoader', () => {
    let loader;

    beforeEach(() => {
      loader = new ModuleManifestLoader();
    });

    test('should load ModuleManifest.json successfully', async () => {
      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.moduleCount).toBeGreaterThan(0);
    });

    test('should build module index', async () => {
      await loader.load();
      const allModules = loader.getAllModules();
      expect(allModules.length).toBeGreaterThan(0);
      expect(allModules[0]).toHaveProperty('name');
      expect(allModules[0]).toHaveProperty('hierarchy_level');
    });

    test('should retrieve module by name', async () => {
      await loader.load();
      const module = loader.getModule('logger');
      expect(module).toBeDefined();
      expect(module.name).toBe('logger');
    });

    test('should validate module exists', async () => {
      await loader.load();
      expect(loader.moduleExists('logger')).toBe(true);
      expect(loader.moduleExists('nonexistent')).toBe(false);
    });

    test('should get modules by hierarchy level', async () => {
      await loader.load();
      const level0 = loader.getModulesByLevel(0);
      expect(level0.length).toBeGreaterThan(0);
      expect(level0[0].hierarchy_level).toBe(0);
    });

    test('should prevent loading twice', async () => {
      await loader.load();
      expect(() => loader.load()).rejects.toThrow('already sealed');
    });

    test('should return metadata', async () => {
      await loader.load();
      const metadata = loader.getMetadata();
      expect(metadata.sealed).toBe(true);
      expect(metadata.immutable).toBe(true);
      expect(metadata.read_only).toBe(true);
    });
  });

  describe('SchemaRegistryLoader', () => {
    let loader;

    beforeEach(() => {
      loader = new SchemaRegistryLoader();
    });

    test('should load SchemaRegistry.json successfully', async () => {
      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.eventTypeCount).toBeGreaterThan(0);
    });

    test('should get all event schemas', async () => {
      await loader.load();
      const schemas = loader.getAllEventSchemas();
      expect(schemas.length).toBeGreaterThan(0);
      expect(schemas[0]).toHaveProperty('id');
      expect(schemas[0]).toHaveProperty('schema');
    });

    test('should validate event type exists', async () => {
      await loader.load();
      const allSchemas = loader.getAllEventSchemas();
      const eventId = allSchemas[0].id;
      expect(loader.eventTypeExists(eventId)).toBe(true);
    });

    test('should get events by emitter', async () => {
      await loader.load();
      const events = loader.getEventsByEmitter('logger');
      expect(Array.isArray(events)).toBe(true);
    });

    test('should validate event payload against schema', async () => {
      await loader.load();
      const allSchemas = loader.getAllEventSchemas();
      const eventId = allSchemas[0].id;
      const result = loader.validateEventPayload(eventId, {
        timestamp: '2026-05-07T10:00:00Z'
      });
      expect(result).toHaveProperty('valid');
    });
  });

  describe('DependencyRulesLoader', () => {
    let loader;

    beforeEach(() => {
      loader = new DependencyRulesLoader();
    });

    test('should load DependencyRules.json successfully', async () => {
      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.ruleCount).toBeGreaterThan(0);
    });

    test('should get all rules', async () => {
      await loader.load();
      const rules = loader.getAllRules();
      expect(rules.length).toBeGreaterThan(0);
    });

    test('should check dependency constraints', async () => {
      await loader.load();
      const canDependOn = loader.getCanDependOn('logger');
      expect(Array.isArray(canDependOn)).toBe(true);
    });

    test('should get critical rules', async () => {
      await loader.load();
      const critical = loader.getCriticalRules();
      expect(critical.length).toBeGreaterThan(0);
    });
  });

  describe('CapabilityRegistryLoader', () => {
    let loader;

    beforeEach(() => {
      loader = new CapabilityRegistryLoader();
    });

    test('should load CapabilitiesRegistry.json successfully', async () => {
      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.capabilityCount).toBeGreaterThan(0);
    });

    test('should get all capabilities', async () => {
      await loader.load();
      const capabilities = loader.getAllCapabilities();
      expect(capabilities.length).toBeGreaterThan(0);
    });

    test('should get scalability limits', async () => {
      await loader.load();
      const limits = loader.getAllScalabilityLimits();
      expect(limits).toBeDefined();
      expect(Object.keys(limits).length).toBeGreaterThan(0);
    });

    test('should get performance targets', async () => {
      await loader.load();
      const targets = loader.getAllPerformanceTargets();
      expect(targets).toBeDefined();
      expect(Object.keys(targets).length).toBeGreaterThan(0);
    });

    test('should check if within limit', async () => {
      await loader.load();
      const limits = loader.getAllScalabilityLimits();
      const limitKey = Object.keys(limits)[0];
      const result = loader.withinLimit(limitKey, 1);
      expect(result).toHaveProperty('within');
      expect(result).toHaveProperty('limit');
    });
  });

  describe('GovernancePoliciesLoader', () => {
    let loader;

    beforeEach(() => {
      loader = new GovernancePoliciesLoader();
    });

    test('should load GovernancePolicies.json successfully', async () => {
      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.policyCount).toBeGreaterThan(0);
    });

    test('should get all policies', async () => {
      await loader.load();
      const policies = loader.getAllPolicies();
      expect(policies.length).toBeGreaterThan(0);
    });

    test('should get mandatory policies', async () => {
      await loader.load();
      const mandatory = loader.getMandatoryPolicies();
      expect(mandatory.length).toBeGreaterThan(0);
      expect(mandatory[0].enforcement_level).toBe('MANDATORY');
    });

    test('should check if policy exists', async () => {
      await loader.load();
      const policies = loader.getAllPolicies();
      const policyId = policies[0].id;
      expect(loader.policyExists(policyId)).toBe(true);
    });
  });

  describe('IdentityRegistryLoader', () => {
    let loader;

    beforeEach(() => {
      loader = new IdentityRegistryLoader();
    });

    test('should load all identity files successfully', async () => {
      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.filesLoaded).toBe(4);
    });

    test('should get global identity', async () => {
      await loader.load();
      const identity = loader.getGlobalIdentity();
      expect(identity).toBeDefined();
      expect(identity.sealed).toBe(true);
    });

    test('should get request identity scheme', async () => {
      await loader.load();
      const scheme = loader.getRequestIdentityScheme();
      expect(scheme).toBeDefined();
    });

    test('should get event identity scheme', async () => {
      await loader.load();
      const scheme = loader.getEventIdentityScheme();
      expect(scheme).toBeDefined();
    });

    test('should get idempotency registry', async () => {
      await loader.load();
      const registry = loader.getIdempotencyRegistry();
      expect(registry).toBeDefined();
    });

    test('should check module idempotency', async () => {
      await loader.load();
      const isIdempotent = loader.isModuleIdempotent('users');
      expect(typeof isIdempotent).toBe('boolean');
    });
  });

  describe('VersioningPolicyLoader', () => {
    let loader;

    beforeEach(() => {
      loader = new VersioningPolicyLoader();
    });

    test('should load all versioning files successfully', async () => {
      const result = await loader.load();
      expect(result.success).toBe(true);
      expect(result.filesLoaded).toBe(3);
    });

    test('should get versioning policy', async () => {
      await loader.load();
      const policy = loader.getVersioningPolicy();
      expect(policy).toBeDefined();
      expect(policy.sealed).toBe(true);
    });

    test('should get compatibility rules', async () => {
      await loader.load();
      const rules = loader.getCompatibilityRules();
      expect(rules).toBeDefined();
    });

    test('should parse semantic version', async () => {
      await loader.load();
      const parsed = loader.parseVersion('1.2.3');
      expect(parsed).toBeDefined();
      expect(parsed.major).toBe(1);
      expect(parsed.minor).toBe(2);
      expect(parsed.patch).toBe(3);
    });

    test('should check version compatibility', async () => {
      await loader.load();
      const result = loader.areVersionsCompatible('1.0.0', '1.2.0');
      expect(result).toHaveProperty('compatible');
    });
  });

  describe('ConstitutionLoaderManager', () => {
    let manager;

    beforeEach(() => {
      manager = new ConstitutionLoaderManager();
    });

    test('should load entire constitution', async () => {
      const result = await manager.loadConstitution();
      expect(result.success).toBe(true);
      expect(result.modules).toBeGreaterThan(0);
      expect(result.eventTypes).toBeGreaterThan(0);
      expect(result.rules).toBeGreaterThan(0);
      expect(result.policies).toBeGreaterThan(0);
    });

    test('should get entire constitution', async () => {
      await manager.loadConstitution();
      const constitution = manager.getConstitution();
      expect(constitution).toBeDefined();
      expect(constitution.modules).toBeDefined();
      expect(constitution.eventTypes).toBeDefined();
      expect(constitution.rules).toBeDefined();
      expect(constitution.policies).toBeDefined();
      expect(constitution.metadata.sealed).toBe(true);
      expect(constitution.metadata.immutable).toBe(true);
      expect(constitution.metadata.read_only).toBe(true);
    });

    test('should verify constitution integrity', async () => {
      await manager.loadConstitution();
      const integrity = manager.verifyConstitutionIntegrity();
      expect(integrity).toHaveProperty('valid');
      expect(integrity).toHaveProperty('issues');
    });

    test('should get status', async () => {
      await manager.loadConstitution();
      const status = manager.getStatus();
      expect(status.loaded).toBe(true);
      expect(status.sealed).toBe(true);
      expect(status.modules).toBeGreaterThan(0);
    });

    test('should get detailed report', async () => {
      await manager.loadConstitution();
      const report = manager.getDetailedReport();
      expect(report.constitution.status).toBe('LOADED');
      expect(report.modules).toBeDefined();
      expect(report.events).toBeDefined();
      expect(report.governance).toBeDefined();
      expect(report.capabilities).toBeDefined();
      expect(report.versioning).toBeDefined();
    });

    test('should provide access to all loaders', async () => {
      await manager.loadConstitution();
      expect(manager.getModuleManifestLoader()).toBeDefined();
      expect(manager.getSchemaRegistryLoader()).toBeDefined();
      expect(manager.getDependencyRulesLoader()).toBeDefined();
      expect(manager.getCapabilityRegistryLoader()).toBeDefined();
      expect(manager.getGovernancePoliciesLoader()).toBeDefined();
      expect(manager.getIdentityRegistryLoader()).toBeDefined();
      expect(manager.getVersioningPolicyLoader()).toBeDefined();
    });

    test('should not allow access before loading', () => {
      expect(() => manager.getConstitution()).toThrow('Constitution not loaded');
      expect(() => manager.verifyConstitutionIntegrity()).toThrow('Constitution not loaded');
    });
  });
});
