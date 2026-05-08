// Tests Blueprint Phase 1 - Structure et Intégration

const {
  Orchestrator,
  StateMachine,
  EventValidator,
  Logger,
  Invariant,
  Conventions,
  VersionManager,
  OrchestratorContext,
} = require('../core');

describe('Blueprint Phase 1 - Core Structure', () => {
  let orchestrator;
  let logger;

  beforeEach(() => {
    logger = new Logger('TestSuite');
    orchestrator = new Orchestrator({
      stateMachineConfig: {
        initialState: 'IDLE',
      },
    });
  });

  // Tests Orchestrator
  describe('Orchestrator', () => {
    test('should initialize successfully', async () => {
      const result = await orchestrator.initialize({ userId: 'test123' });
      expect(result.success).toBe(true);
      expect(result.version).toBe('1.0.0');
    });

    test('should register modules', () => {
      const module = {
        id: 'test',
        version: '1.0.0',
      };

      orchestrator.registerModule('test', module);
      expect(orchestrator.modules.has('test')).toBe(true);
    });

    test('should manage invariants', () => {
      const invariant = new Invariant(
        'test_invariant',
        () => true,
        { message: 'Test invariant' }
      );

      orchestrator.addInvariant(invariant);
      const validation = orchestrator.validateInvariants();
      expect(validation.valid).toBe(true);
    });
  });

  // Tests State Machine
  describe('StateMachine', () => {
    let stateMachine;

    beforeEach(() => {
      stateMachine = new StateMachine({
        initialState: 'IDLE',
      });
    });

    test('should initialize with initial state', async () => {
      await stateMachine.initialize();
      expect(stateMachine.getCurrentState()).toBe('IDLE');
    });

    test('should track state history', async () => {
      await stateMachine.initialize();
      const history = stateMachine.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });
  });

  // Tests Events
  describe('EventValidator', () => {
    let validator;

    beforeEach(() => {
      validator = new EventValidator();
    });

    test('should create valid events', () => {
      const event = validator.createEvent('test.event', { data: 'test' }, 'test-source');
      expect(event.eventId).toBeDefined();
      expect(event.eventType).toBe('test.event');
      expect(event.source).toBe('test-source');
    });

    test('should validate events', () => {
      const event = validator.createEvent('test.event', {}, 'test-source');
      const validation = validator.validate(event, 'BASE');
      expect(validation.valid).toBe(true);
    });

    test('should enrich events', () => {
      const event = validator.createEvent('test.event', {}, 'test-source');
      const enriched = validator.enrich(event, { custom: 'metadata' });
      expect(enriched.metadata.custom).toBe('metadata');
    });
  });

  // Tests Logger
  describe('Logger', () => {
    test('should create logger instance', () => {
      const log = new Logger('TestLogger');
      expect(log.context).toBe('TestLogger');
    });

    test('should create child logger', () => {
      const log = new Logger('Parent');
      const child = log.child('Child');
      expect(child.context).toBe('Parent:Child');
    });
  });

  // Tests Invariants
  describe('Invariants', () => {
    test('should create invariant with check function', () => {
      const invariant = new Invariant(
        'test_invariant',
        (ctx) => ctx.value > 0,
        { message: 'Value must be positive' }
      );

      expect(invariant.check({ value: 5 })).toBe(true);
      expect(invariant.check({ value: -1 })).toBe(false);
    });
  });

  // Tests Conventions
  describe('Conventions', () => {
    test('should validate module ID naming', () => {
      expect(Conventions.validateName('auth_module', 'MODULE_ID_PATTERN')).toBe(true);
      expect(Conventions.validateName('AuthModule', 'MODULE_ID_PATTERN')).toBe(false);
    });

    test('should validate version format', () => {
      expect(Conventions.validateVersion('1.0.0')).toBe(true);
      expect(Conventions.validateVersion('1.0')).toBe(false);
    });
  });

  // Tests Context
  describe('OrchestratorContext', () => {
    let context;

    beforeEach(() => {
      context = new OrchestratorContext({
        userId: 'test123',
      });
    });

    test('should set and get values', () => {
      context.set('user.name', 'John');
      expect(context.get('user.name')).toBe('John');
    });

    test('should merge data', () => {
      context.merge({ newField: 'value' });
      expect(context.get('newField')).toBe('value');
    });

    test('should freeze and unfreeze', () => {
      context.freeze();
      expect(() => context.set('test', 'value')).toThrow();
      context.unfreeze();
      context.set('test', 'value');
      expect(context.get('test')).toBe('value');
    });

    test('should validate against schema', () => {
      const schema = {
        'session.userId': { required: true, type: 'string' },
      };
      const validation = context.validate(schema);
      expect(validation.valid).toBe(true);
    });
  });

  // Tests VersionManager
  describe('VersionManager', () => {
    let versionManager;

    beforeEach(() => {
      versionManager = new VersionManager({ systemVersion: '1.0.0' });
      versionManager.initialize();
    });

    test('should register module versions', () => {
      versionManager.registerModuleVersion('auth', '1.0.0');
      expect(versionManager.getModuleVersion('auth')).toBe('1.0.0');
    });

    test('should check version compatibility', () => {
      versionManager.registerModuleVersion('auth', '1.2.0');
      const compatibility = versionManager.checkCompatibility('auth', '1.0.0', '1.2.0');
      expect(compatibility.compatible).toBe(true);
    });

    test('should compare versions', () => {
      expect(versionManager.compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(versionManager.compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(versionManager.compareVersions('1.0.0', '1.0.0')).toBe(0);
    });
  });

  // Integration Tests
  describe('Phase 1 Integration', () => {
    test('should initialize full system', async () => {
      const system = new Orchestrator({
        stateMachineConfig: { initialState: 'IDLE' },
      });

      const result = await system.initialize({ userId: 'test123' });
      expect(result.success).toBe(true);

      // Register modules
      system.registerModule('auth', { id: 'auth', version: '1.0.0' });
      system.registerModule('users', { id: 'users', version: '1.0.0' });

      // Add invariants
      system.addInvariant(
        new Invariant('test', () => true, { message: 'Test' })
      );

      // Validate
      const validation = system.validateInvariants();
      expect(validation.valid).toBe(true);

      // Get state
      expect(system.getCurrentState()).toBe('IDLE');
    });

    test('should process events through system', () => {
      const validator = new EventValidator();
      const event = validator.createEvent('test.event', { data: 'test' }, 'test');
      const validation = validator.validate(event, 'BASE');
      expect(validation.valid).toBe(true);
    });
  });
});
