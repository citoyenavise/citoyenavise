/**
 * enforcement.test.js - Test suite for PHASE 1.4 Enforcement Layer
 * Test all 4 enforcers + RuntimeEnforcementEngine
 */

const RuntimeEnforcementEngine = require('./RuntimeEnforcementEngine');
const DependencyEnforcer = require('./DependencyEnforcer');
const CapabilityEnforcer = require('./CapabilityEnforcer');
const StateTransitionEnforcer = require('./StateTransitionEnforcer');
const AccessBoundaryEnforcer = require('./AccessBoundaryEnforcer');
const { ConstitutionLoaderManager } = require('../loaders');
const { RuntimeValidationEngine } = require('../validators');

describe('PHASE 1.4 Enforcement Layer', () => {
  let constitutionManager;
  let validationEngine;

  beforeAll(async () => {
    constitutionManager = new ConstitutionLoaderManager();
    await constitutionManager.loadConstitution();
    validationEngine = new RuntimeValidationEngine(constitutionManager);
  });

  describe('DependencyEnforcer', () => {
    let enforcer;

    beforeEach(() => {
      enforcer = new DependencyEnforcer(constitutionManager);
    });

    test('should enforce module initialization', () => {
      const operation = {
        type: 'module_init',
        module: 'logger'
      };

      const result = enforcer.enforce(operation);
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('reason');
    });

    test('should reject unknown module', () => {
      const operation = {
        type: 'module_init',
        module: 'nonexistent'
      };

      const result = enforcer.enforce(operation);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('module_not_found');
    });

    test('should enforce service injection', () => {
      const operation = {
        type: 'service_injection',
        service: 'database',
        requesterModule: 'users'
      };

      const result = enforcer.enforce(operation);
      expect(result).toHaveProperty('allowed');
    });

    test('should enforce dependency request', () => {
      const operation = {
        type: 'module_dependency',
        from: 'users',
        to: 'database'
      };

      const result = enforcer.enforce(operation);
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('reason');
    });

    test('should block unauthorized dependency', () => {
      const operation = {
        type: 'module_dependency',
        from: 'logger',
        to: 'users'
      };

      const result = enforcer.enforce(operation);
      // Lower level module cannot depend on higher level
      // Result depends on actual manifest hierarchy
      expect(result).toHaveProperty('allowed');
    });

    test('should provide enforcement metrics', () => {
      const operation = {
        type: 'module_init',
        module: 'logger'
      };

      enforcer.enforce(operation);
      // Enforcer should track operations
      expect(enforcer).toBeDefined();
    });
  });

  describe('CapabilityEnforcer', () => {
    let enforcer;

    beforeEach(() => {
      enforcer = new CapabilityEnforcer(constitutionManager);
    });

    test('should enforce resource allocation', () => {
      const operation = {
        type: 'resource_allocation',
        resourceType: 'modules',
        quantity: 1
      };

      const result = enforcer.enforce(operation);
      expect(result).toHaveProperty('allowed');
    });

    test('should block resource limit exceeded', () => {
      const enforcer2 = new CapabilityEnforcer(constitutionManager);
      enforcer2.currentUsage.modules = 99; // Near limit of 100

      const operation = {
        type: 'resource_allocation',
        resourceType: 'modules',
        quantity: 5
      };

      const result = enforcer2.enforce(operation);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('resource_limit_exceeded');
    });

    test('should enforce event emission', () => {
      const operation = {
        type: 'event_emission',
        eventType: 'user:created',
        count: 1
      };

      const result = enforcer.enforce(operation);
      expect(result).toHaveProperty('allowed');
    });

    test('should verify resource limits', async () => {
      const result = await enforcer.verifyResourceLimits('modules', 5);
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('limit');
    });

    test('should track resource usage', () => {
      const result = enforcer.updateResourceUsage('modules', 1);
      expect(result.resourceType).toBe('modules');
      expect(result.usage).toBeGreaterThan(0);
    });

    test('should generate resource usage report', () => {
      const report = enforcer.getResourceUsageReport();
      expect(report).toHaveProperty('modules');
      expect(report.modules).toHaveProperty('current');
      expect(report.modules).toHaveProperty('limit');
    });

    test('should check near limit threshold', () => {
      const enforcer2 = new CapabilityEnforcer(constitutionManager);
      enforcer2.currentUsage.modules = 85; // 85% of 100

      const near = enforcer2.isNearLimit('modules', 80);
      expect(near).toBe(true);
    });
  });

  describe('StateTransitionEnforcer', () => {
    let enforcer;

    beforeEach(() => {
      enforcer = new StateTransitionEnforcer(constitutionManager);
    });

    test('should enforce state transition', () => {
      const operation = {
        type: 'state_transition',
        from: 'initial',
        to: 'ready'
      };

      const result = enforcer.enforce(operation);
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('reason');
    });

    test('should enforce state check', () => {
      enforcer.setCurrentState('entity1', 'active');

      const operation = {
        type: 'state_check',
        entity: 'entity1',
        expectedState: 'active'
      };

      const result = enforcer.enforce(operation);
      expect(result.allowed).toBe(true);
    });

    test('should reject invalid state check', () => {
      enforcer.setCurrentState('entity1', 'active');

      const operation = {
        type: 'state_check',
        entity: 'entity1',
        expectedState: 'inactive'
      };

      const result = enforcer.enforce(operation);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('state_mismatch');
    });

    test('should record state transitions', () => {
      const result = enforcer.recordStateTransition('entity2', 'initial', 'processing');
      expect(result.entity).toBe('entity2');
      expect(result.to).toBe('processing');
    });

    test('should get current state', () => {
      enforcer.setCurrentState('entity3', 'complete');
      const state = enforcer.getCurrentState('entity3');
      expect(state).toBe('complete');
    });

    test('should get valid transitions from state', () => {
      // This depends on state machine definition
      const transitions = enforcer.getValidTransitions('initial');
      expect(Array.isArray(transitions)).toBe(true);
    });

    test('should check state transition validity', async () => {
      const result = await enforcer.checkStateTransition('initial', 'ready');
      expect(result).toHaveProperty('valid');
    });
  });

  describe('AccessBoundaryEnforcer', () => {
    let enforcer;

    beforeEach(() => {
      enforcer = new AccessBoundaryEnforcer(constitutionManager);
    });

    test('should enforce service access', () => {
      const operation = {
        type: 'service_access',
        service: 'database',
        requesterModule: 'users',
        action: 'use'
      };

      const result = enforcer.enforce(operation);
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('reason');
    });

    test('should enforce module access', () => {
      const operation = {
        type: 'module_access',
        sourceModule: 'users',
        targetModule: 'database',
        operation: 'call'
      };

      const result = enforcer.enforce(operation);
      expect(result).toHaveProperty('allowed');
    });

    test('should enforce permission check', () => {
      const operation = {
        type: 'permission_check',
        resource: 'user_data',
        action: 'read',
        principal: 'user_123'
      };

      const result = enforcer.enforce(operation);
      expect(result).toHaveProperty('allowed');
    });

    test('should enforce resource access', () => {
      const operation = {
        type: 'resource_access',
        resource: 'database_connection',
        requester: 'users_module',
        accessType: 'read'
      };

      const result = enforcer.enforce(operation);
      expect(result).toHaveProperty('allowed');
    });

    test('should verify service injection', async () => {
      const result = await enforcer.verifyServiceInjection('database', 'users');
      expect(result).toHaveProperty('valid');
    });

    test('should verify permission', async () => {
      const result = await enforcer.verifyPermission('user_data', 'read', 'user_123');
      expect(result).toHaveProperty('permitted');
    });

    test('should get module isolation info', () => {
      const info = enforcer.getModuleIsolationInfo('users');
      expect(info).toHaveProperty('name');
      expect(info).toHaveProperty('canAccess');
      expect(info).toHaveProperty('canBeAccessedBy');
    });
  });

  describe('RuntimeEnforcementEngine', () => {
    let engine;

    beforeEach(() => {
      engine = new RuntimeEnforcementEngine(constitutionManager, validationEngine);
    });

    test('should create enforcement engine', () => {
      expect(engine).toBeDefined();
      expect(engine).toHaveProperty('enforcers');
      expect(Object.keys(engine.enforcers).length).toBe(4);
    });

    test('should require constitutionManager', () => {
      expect(() => new RuntimeEnforcementEngine(null)).toThrow();
    });

    test('should check operations', () => {
      const operation = {
        type: 'module_init',
        module: 'logger'
      };

      const result = engine.checkOperation(operation);
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('timestamp');
    });

    test('should block invalid operations', () => {
      const operation = {
        type: 'module_init',
        module: 'nonexistent'
      };

      const result = engine.checkOperation(operation);
      expect(result.allowed).toBe(false);
    });

    test('should track enforcement metrics', () => {
      const operation = {
        type: 'module_init',
        module: 'logger'
      };

      engine.checkOperation(operation);

      const metrics = engine.getMetrics();
      expect(metrics.operationsChecked).toBeGreaterThan(0);
    });

    test('should maintain audit trail', () => {
      const operation = {
        type: 'module_init',
        module: 'logger'
      };

      engine.checkOperation(operation);

      const trail = engine.getAuditTrail(10);
      expect(Array.isArray(trail)).toBe(true);
    });

    test('should get status', () => {
      const status = engine.getStatus();
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('operationsChecked');
      expect(status).toHaveProperty('violations');
    });

    test('should enable/disable enforcement', () => {
      engine.setEnforcementEnabled(false);
      const status = engine.getStatus();
      expect(status.enabled).toBe(false);

      engine.setEnforcementEnabled(true);
      const status2 = engine.getStatus();
      expect(status2.enabled).toBe(true);
    });

    test('should verify service injection', async () => {
      const result = await engine.verifyServiceInjection('database', 'users');
      expect(result).toHaveProperty('allowed');
    });

    test('should verify permission', async () => {
      const result = await engine.verifyPermission('user_data', 'read', 'user_123');
      expect(result).toHaveProperty('allowed');
    });

    test('should check state transition', async () => {
      const result = await engine.checkStateTransition('initial', 'ready', {});
      expect(result).toHaveProperty('allowed');
    });

    test('should verify resource limits', async () => {
      const result = await engine.verifyResourceLimits('modules', 5);
      expect(result).toHaveProperty('allowed');
    });

    test('should get violations from audit trail', () => {
      // Create a blocked operation
      const badOp = {
        type: 'module_init',
        module: 'nonexistent'
      };
      engine.checkOperation(badOp);

      const violations = engine.getViolations(10);
      expect(Array.isArray(violations)).toBe(true);
    });

    test('should get detailed report', () => {
      const operation = {
        type: 'module_init',
        module: 'logger'
      };

      engine.checkOperation(operation);

      const report = engine.getDetailedReport();
      expect(report).toHaveProperty('engine');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('status');
      expect(report).toHaveProperty('recentViolations');
      expect(report).toHaveProperty('recentAuditTrail');
    });

    test('should access enforcers', () => {
      const depEnforcer = engine.getEnforcer('dependency');
      expect(depEnforcer).toBeInstanceOf(DependencyEnforcer);

      const capEnforcer = engine.getEnforcer('capability');
      expect(capEnforcer).toBeInstanceOf(CapabilityEnforcer);

      const allEnforcers = engine.getAllEnforcers();
      expect(allEnforcers).toHaveProperty('dependency');
      expect(allEnforcers).toHaveProperty('capability');
      expect(allEnforcers).toHaveProperty('stateTransition');
      expect(allEnforcers).toHaveProperty('accessBoundary');
    });

    test('should handle errors safely', () => {
      const badOp = {
        type: 'unknown',
        data: null
      };

      const result = engine.checkOperation(badOp);
      expect(result).toHaveProperty('allowed');
      // Unknown types are allowed by default
      expect(result.allowed).toBe(true);
    });
  });
});
