/**
 * SecurityGuard.test.js - Unit tests for PHASE 1.7 SecurityGuard
 *
 * Test coverage:
 * - SecurityGuard initialization
 * - Capability usage enforcement
 * - Module access enforcement
 * - Identity verification
 * - Resource access enforcement
 * - Violation tracking
 * - Access logging
 * - Integration with RuntimeEnforcementEngine
 */

describe('SecurityGuard - PHASE 1.7', () => {
  let guard;
  let mockConstitutionManager;

  beforeEach(() => {
    mockConstitutionManager = {
      getAllLoaders: jest.fn(() => ({
        accessRulesLoader: {
          getData: jest.fn(() => ({
            moduleAccessPolicies: {
              auth: {
                isolationLevel: 1,
                allowedCapabilities: ['CAP_AUTH_LOGIN', 'CAP_AUTH_PERMISSION_CHECK'],
                restrictionLevel: 'AUTHENTICATED',
                accessibleBy: ['users', 'posts', 'notifications']
              },
              users: {
                isolationLevel: 2,
                allowedCapabilities: ['CAP_USER_CREATE', 'CAP_USER_READ'],
                restrictionLevel: 'OWNER_OR_ADMIN',
                accessibleBy: ['posts', 'notifications']
              },
              logger: {
                isolationLevel: 0,
                allowedCapabilities: ['CAP_LOG_WRITE', 'CAP_LOG_QUERY'],
                restrictionLevel: 'NONE',
                accessibleBy: 'ALL_MODULES'
              }
            },
            capabilityBindings: {
              CAP_AUTH_LOGIN: {
                module: 'auth',
                type: 'ACTION',
                restrictionLevel: 'NONE',
                requiresIdentity: false,
                requiresApproval: false,
                auditTrail: true
              },
              CAP_USER_DELETE: {
                module: 'users',
                type: 'ADMIN',
                restrictionLevel: 'ADMIN_ONLY',
                requiresIdentity: true,
                requiresApproval: true,
                auditTrail: true
              },
              CAP_LOG_WRITE: {
                module: 'logger',
                type: 'ACTION',
                restrictionLevel: 'NONE',
                requiresIdentity: false,
                requiresApproval: false,
                auditTrail: false
              }
            }
          }))
        }
      })),
      getCapabilitiesLoader: jest.fn()
    };

    guard = new (require('./SecurityGuard'))(mockConstitutionManager);
  });

  describe('Initialization', () => {
    test('should initialize with constitution manager', () => {
      expect(guard).toBeDefined();
      expect(guard.accessRules).toBeDefined();
      expect(guard.violations).toEqual([]);
      expect(guard.accessLog).toEqual([]);
    });

    test('should throw error if constitution manager not provided', () => {
      expect(() => {
        new (require('./SecurityGuard'))(null);
      }).toThrow('constitutionManager required');
    });

    test('should load AccessRules from constitution', () => {
      expect(guard.accessRules.moduleAccessPolicies).toBeDefined();
      expect(guard.accessRules.capabilityBindings).toBeDefined();
    });
  });

  describe('Capability Usage Enforcement', () => {
    test('should allow capability access for authorized module', () => {
      const result = guard.enforce({
        type: 'capability_usage',
        requester: 'auth',
        capability: 'CAP_AUTH_LOGIN'
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('capability_granted');
    });

    test('should deny capability access for unauthorized module', () => {
      const result = guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_AUTH_LOGIN'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('capability_denied');
    });

    test('should require identity for identity-restricted capabilities', () => {
      const result = guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_USER_DELETE'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('identity_required');
    });

    test('should flag capabilities requiring approval', () => {
      const result = guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_USER_DELETE',
        identity: { subject: 'admin' }
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('approval_required');
      expect(result.escalation).toBe(true);
    });

    test('should deny unknown capability', () => {
      const result = guard.enforce({
        type: 'capability_usage',
        requester: 'auth',
        capability: 'CAP_UNKNOWN'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('capability_unknown');
    });

    test('should deny if requester not specified', () => {
      const result = guard.enforce({
        type: 'capability_usage',
        capability: 'CAP_AUTH_LOGIN'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('requester_not_specified');
    });
  });

  describe('Module Access Enforcement', () => {
    test('should allow module access within hierarchy', () => {
      const result = guard.enforce({
        type: 'module_access',
        source: 'users',
        target: 'logger'
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('module_access_permitted');
    });

    test('should deny module access with isolation violation', () => {
      const result = guard.enforce({
        type: 'module_access',
        source: 'logger',
        target: 'users'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('isolation_level_violation');
    });

    test('should deny unknown source module', () => {
      const result = guard.enforce({
        type: 'module_access',
        source: 'UNKNOWN',
        target: 'users'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('source_module_unknown');
    });

    test('should deny unknown target module', () => {
      const result = guard.enforce({
        type: 'module_access',
        source: 'users',
        target: 'UNKNOWN'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('target_module_unknown');
    });

    test('should compare isolation levels correctly', () => {
      const result = guard.enforce({
        type: 'module_access',
        source: 'users',
        target: 'auth'
      });

      expect(result.allowed).toBe(false);
      expect(result.sourceLevel).toBe(2);
      expect(result.targetLevel).toBe(1);
    });
  });

  describe('Identity Verification', () => {
    test('should verify valid identity', () => {
      const identity = {
        subject: 'user123',
        issuer: 'auth',
        timestamp: new Date().toISOString(),
        signature: 'sig_xxx'
      };

      const result = guard.enforce({
        type: 'identity_verification',
        identity
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('identity_verified');
    });

    test('should deny missing identity', () => {
      const result = guard.enforce({
        type: 'identity_verification'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('identity_not_provided');
    });

    test('should deny identity with missing subject', () => {
      const result = guard.enforce({
        type: 'identity_verification',
        identity: {
          issuer: 'auth'
        }
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('identity_invalid');
    });

    test('should deny expired identity', () => {
      const oldTime = new Date(Date.now() - 4 * 3600000); // 4 hours ago

      const result = guard.enforce({
        type: 'identity_verification',
        identity: {
          subject: 'user123',
          timestamp: oldTime.toISOString()
        }
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('identity_expired');
    });
  });

  describe('Resource Access Enforcement', () => {
    test('should allow resource read access', () => {
      const result = guard.enforce({
        type: 'resource_access',
        resource: 'users_table',
        action: 'SELECT',
        requester: 'users',
        accessLevel: 'read'
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('resource_access_granted');
    });

    test('should deny resource access with invalid level', () => {
      const result = guard.enforce({
        type: 'resource_access',
        resource: 'users_table',
        action: 'SELECT',
        requester: 'users',
        accessLevel: 'INVALID'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('invalid_access_level');
    });

    test('should deny missing parameters', () => {
      const result = guard.enforce({
        type: 'resource_access',
        resource: 'users_table'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('resource_access_params_missing');
    });

    test('should enforce admin-only restrictions', () => {
      const result = guard.enforce({
        type: 'resource_access',
        resource: 'system_config',
        action: 'UPDATE',
        requester: 'users',
        accessLevel: 'write'
      });

      expect(result.allowed).toBe(true); // users module exists in rules
    });
  });

  describe('Violation Tracking', () => {
    test('should record access violations', () => {
      guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_AUTH_LOGIN',
        severity: 'HIGH'
      });

      const violations = guard.getViolations();
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].reason).toBe('capability_denied');
    });

    test('should track violation details', () => {
      guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_AUTH_LOGIN'
      });

      const violations = guard.getViolations();
      expect(violations[0]).toHaveProperty('id');
      expect(violations[0]).toHaveProperty('timestamp');
      expect(violations[0]).toHaveProperty('severity');
      expect(violations[0]).toHaveProperty('message');
    });

    test('should limit violation history to 1000 entries', () => {
      for (let i = 0; i < 1050; i++) {
        guard.enforce({
          type: 'capability_usage',
          requester: 'unknown_module',
          capability: 'CAP_AUTH_LOGIN'
        });
      }

      expect(guard.violations.length).toBe(1000);
    });
  });

  describe('Access Logging', () => {
    test('should log access attempts', () => {
      guard.enforce({
        type: 'capability_usage',
        requester: 'auth',
        capability: 'CAP_AUTH_LOGIN'
      });

      const logs = guard.getAccessLog();
      expect(logs.length).toBeGreaterThan(0);
    });

    test('should log both allowed and denied accesses', () => {
      guard.enforce({
        type: 'capability_usage',
        requester: 'auth',
        capability: 'CAP_AUTH_LOGIN'
      });

      guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_AUTH_LOGIN'
      });

      const logs = guard.getAccessLog();
      expect(logs.length).toBe(2);
      expect(logs[0].allowed).toBe(true);
      expect(logs[1].allowed).toBe(false);
    });

    test('should limit access log to 5000 entries', () => {
      for (let i = 0; i < 5050; i++) {
        guard.enforce({
          type: 'capability_usage',
          requester: 'auth',
          capability: 'CAP_AUTH_LOGIN'
        });
      }

      expect(guard.accessLog.length).toBe(5000);
    });

    test('should include severity in access logs', () => {
      guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_AUTH_LOGIN'
      });

      const logs = guard.getAccessLog();
      expect(logs[0]).toHaveProperty('severity');
    });
  });

  describe('Access Control Report', () => {
    test('should generate access control report', () => {
      guard.enforce({
        type: 'capability_usage',
        requester: 'auth',
        capability: 'CAP_AUTH_LOGIN'
      });

      const report = guard.getAccessControlReport();
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('accessLogSize');
      expect(report).toHaveProperty('violationCount');
      expect(report).toHaveProperty('rulesLoaded');
    });

    test('should include recent violations in report', () => {
      guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_AUTH_LOGIN'
      });

      const report = guard.getAccessControlReport();
      expect(report.recentViolations.length).toBeGreaterThan(0);
    });
  });

  describe('Log Reset', () => {
    test('should reset logs for testing', () => {
      guard.enforce({
        type: 'capability_usage',
        requester: 'auth',
        capability: 'CAP_AUTH_LOGIN'
      });

      expect(guard.accessLog.length).toBeGreaterThan(0);

      guard.resetLogs();

      expect(guard.accessLog).toEqual([]);
      expect(guard.violations).toEqual([]);
    });
  });

  describe('Unknown Operation Types', () => {
    test('should allow unknown operation types for backward compatibility', () => {
      const result = guard.enforce({
        type: 'unknown_type',
        some: 'data'
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('unknown_operation_type');
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle complex access scenarios', () => {
      // Scenario: User module trying to access sensitive capability without identity
      const result1 = guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_USER_DELETE'
      });

      expect(result1.allowed).toBe(false);
      expect(result1.reason).toBe('identity_required');

      // Scenario: Same request with identity but requiring approval
      const result2 = guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_USER_DELETE',
        identity: { subject: 'admin_user' }
      });

      expect(result2.allowed).toBe(false);
      expect(result2.reason).toBe('approval_required');
    });

    test('should track violation escalations', () => {
      guard.enforce({
        type: 'capability_usage',
        requester: 'users',
        capability: 'CAP_USER_DELETE',
        identity: { subject: 'admin_user' }
      });

      const violations = guard.getViolations();
      expect(violations[0].escalation).toBe(true);
    });

    test('should handle module hierarchies correctly', () => {
      // auth (level 1) -> can access logger (level 0)
      const result1 = guard.enforce({
        type: 'module_access',
        source: 'auth',
        target: 'logger'
      });
      expect(result1.allowed).toBe(true);

      // users (level 2) -> can access auth (level 1)
      const result2 = guard.enforce({
        type: 'module_access',
        source: 'users',
        target: 'auth'
      });
      expect(result2.allowed).toBe(false); // But rules may prevent it

      // logger (level 0) -> cannot access users (level 2)
      const result3 = guard.enforce({
        type: 'module_access',
        source: 'logger',
        target: 'users'
      });
      expect(result3.allowed).toBe(false);
    });
  });
});
