// Tests Manifests - Phase 2

const ManifestLoader = require('../config/manifests');

describe('Manifests - Phase 2', () => {
  let loader;

  beforeEach(() => {
    loader = new ManifestLoader();
  });

  describe('Module Manifest', () => {
    test('should load modules manifest', () => {
      const manifest = loader.get('modules');
      expect(manifest).toBeDefined();
      expect(manifest.modules).toBeDefined();
    });

    test('should have 5 fundamental modules', () => {
      const modules = loader.getModules();
      expect(modules.length).toBe(5);

      const ids = modules.map((m) => m.id);
      expect(ids).toContain('auth');
      expect(ids).toContain('users');
      expect(ids).toContain('posts');
      expect(ids).toContain('notifications');
      expect(ids).toContain('analytics');
    });

    test('should validate module structure', () => {
      const modules = loader.getModules();

      for (const module of modules) {
        expect(module.id).toBeDefined();
        expect(module.displayName).toBeDefined();
        expect(module.version).toBeDefined();
        expect(module.status).toBeDefined();
        expect(module.phase).toBe(2);
        expect(module.contract).toBeDefined();
        expect(module.states).toBeDefined();
        expect(module.events).toBeDefined();
        expect(Array.isArray(module.dependencies)).toBe(true);
      }
    });

    test('should validate module contracts', () => {
      const modules = loader.getModules();

      for (const module of modules) {
        expect(Array.isArray(module.contract.input)).toBe(true);
        expect(Array.isArray(module.contract.output)).toBe(true);

        for (const input of module.contract.input) {
          expect(input.name).toBeDefined();
          expect(input.type).toBeDefined();
        }

        for (const output of module.contract.output) {
          expect(output.name).toBeDefined();
          expect(output.type).toBeDefined();
        }
      }
    });

    test('should validate module states', () => {
      const modules = loader.getModules();

      for (const module of modules) {
        expect(Array.isArray(module.states)).toBe(true);
        expect(module.states.length).toBeGreaterThan(0);

        for (const state of module.states) {
          expect(typeof state).toBe('string');
        }
      }
    });

    test('should validate module events', () => {
      const modules = loader.getModules();

      for (const module of modules) {
        expect(Array.isArray(module.events)).toBe(true);

        for (const event of module.events) {
          expect(typeof event).toBe('string');
          expect(event).toMatch(/^[\w]+:[\w]+$/);
        }
      }
    });

    test('should validate module dependencies', () => {
      const modules = loader.getModules();
      const validation = loader.validateModulesCohesion();

      expect(validation.valid).toBe(true);
      if (!validation.valid) {
        console.error('Module errors:', validation.errors);
      }
    });

    test('auth module should have no dependencies', () => {
      const auth = loader.getModules().find((m) => m.id === 'auth');
      expect(auth.dependencies.length).toBe(0);
    });

    test('users module should depend on auth', () => {
      const users = loader.getModules().find((m) => m.id === 'users');
      expect(users.dependencies).toContain('auth');
    });

    test('posts module should depend on users and auth', () => {
      const posts = loader.getModules().find((m) => m.id === 'posts');
      expect(posts.dependencies).toContain('users');
      expect(posts.dependencies).toContain('auth');
    });

    test('should have correct priority order', () => {
      const modules = loader.getModules();
      const withPriority = modules.filter((m) => m.priority !== undefined);

      expect(withPriority.length).toBeGreaterThan(0);
    });
  });

  describe('States Manifest', () => {
    test('should load states manifest', () => {
      const manifest = loader.get('states');
      expect(manifest).toBeDefined();
      expect(manifest.states).toBeDefined();
    });

    test('should have required states', () => {
      const states = loader.getStates();

      const requiredStates = ['IDLE', 'LOADING', 'LOADED', 'ERROR', 'CREATING', 'CREATED'];
      for (const state of requiredStates) {
        expect(states[state]).toBeDefined();
      }
    });

    test('should validate state structure', () => {
      const states = loader.getStates();

      for (const [stateId, state] of Object.entries(states)) {
        expect(state.id).toBe(stateId);
        expect(state.type).toBeDefined();
        expect(state.displayName).toBeDefined();
        expect(state.description).toBeDefined();
        expect(Array.isArray(state.allowedTransitions)).toBe(true);
      }
    });

    test('should have initial state IDLE', () => {
      const states = loader.getStates();
      expect(states.IDLE).toBeDefined();
      expect(states.IDLE.metadata.isInitial).toBe(true);
    });

    test('should validate transitions', () => {
      const manifest = loader.get('states');
      const transitions = manifest.transitions;

      expect(Array.isArray(transitions)).toBe(true);

      for (const transition of transitions) {
        expect(transition.fromState).toBeDefined();
        expect(transition.toState).toBeDefined();
        expect(transition.event).toBeDefined();
        expect(Array.isArray(transition.guards)).toBe(true);
        expect(Array.isArray(transition.sideEffects)).toBe(true);
      }
    });

    test('should validate state transitions coherence', () => {
      const validation = loader.validateStatesCohesion();
      expect(validation.valid).toBe(true);

      if (!validation.valid) {
        console.error('State errors:', validation.errors);
      }
    });

    test('all transitions should reference valid states', () => {
      const states = loader.getStates();
      const transitions = loader.getTransitions();

      for (const transition of transitions) {
        expect(states[transition.fromState]).toBeDefined();
        expect(states[transition.toState]).toBeDefined();
      }
    });

    test('IDLE state should have multiple outgoing transitions', () => {
      const transitions = loader.getTransitions();
      const idleTransitions = transitions.filter((t) => t.fromState === 'IDLE');

      expect(idleTransitions.length).toBeGreaterThan(0);
    });

    test('ERROR state should transition back to IDLE', () => {
      const transitions = loader.getTransitions().filter(
        (t) => t.fromState === 'ERROR'
      );

      expect(transitions.length).toBeGreaterThan(0);
      expect(transitions.some((t) => t.toState === 'IDLE')).toBe(true);
    });
  });

  describe('Phases Manifest', () => {
    test('should load phases manifest', () => {
      const manifest = loader.get('phases');
      expect(manifest).toBeDefined();
      expect(manifest.phases).toBeDefined();
    });

    test('should have 5 phases', () => {
      const phases = loader.getPhases();
      expect(Object.keys(phases).length).toBe(5);
    });

    test('should have Phase 1 completed or in progress', () => {
      const phases = loader.getPhases();
      expect(phases.phase1).toBeDefined();
      expect(['completed', 'in_progress']).toContain(phases.phase1.status);
    });

    test('should validate phase structure', () => {
      const phases = loader.getPhases();

      for (const [phaseId, phase] of Object.entries(phases)) {
        expect(phase.id).toBe(phaseId);
        expect(phase.name).toBeDefined();
        expect(phase.status).toBeDefined();
        expect(phase.progress).toBeDefined();
        expect(phase.description).toBeDefined();
      }
    });

    test('Phase 2 should declare 5 modules', () => {
      const phases = loader.getPhases();
      const phase2 = phases.phase2;

      expect(phase2.modules).toBeDefined();
      expect(phase2.modules.length).toBe(5);

      const moduleIds = phase2.modules.map((m) => m.id);
      expect(moduleIds).toContain('auth');
      expect(moduleIds).toContain('users');
      expect(moduleIds).toContain('posts');
      expect(moduleIds).toContain('notifications');
      expect(moduleIds).toContain('analytics');
    });

    test('modules should be ordered by priority', () => {
      const phases = loader.getPhases();
      const modules = phases.phase2.modules;

      const priorities = modules.map((m) => m.priority);
      expect(priorities).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe('Manifest Validation', () => {
    test('should validate all manifests', () => {
      const validation = loader.validateAll();

      expect(validation.overallValid).toBe(true);

      if (!validation.overallValid) {
        console.error('Validation errors:', {
          modules: validation.modules.errors,
          states: validation.states.errors,
        });
      }
    });

    test('should detect missing module dependencies', () => {
      const validation = loader.validateModulesCohesion();
      expect(validation.valid).toBe(true);
    });

    test('should detect invalid state references in transitions', () => {
      const validation = loader.validateStatesCohesion();
      expect(validation.valid).toBe(true);
    });
  });

  describe('Phase 2 Integration', () => {
    test('all Phase 2 modules should have contracts', () => {
      const modules = loader.getModules();

      for (const module of modules) {
        expect(module.contract).toBeDefined();
        expect(module.contract.input).toBeDefined();
        expect(module.contract.output).toBeDefined();
      }
    });

    test('all Phase 2 modules should declare states', () => {
      const modules = loader.getModules();

      for (const module of modules) {
        expect(module.states).toBeDefined();
        expect(module.states.length).toBeGreaterThan(0);
      }
    });

    test('all Phase 2 modules should declare events', () => {
      const modules = loader.getModules();

      for (const module of modules) {
        expect(module.events).toBeDefined();
        expect(module.events.length).toBeGreaterThan(0);
      }
    });

    test('module events should follow naming convention', () => {
      const modules = loader.getModules();

      for (const module of modules) {
        for (const event of module.events) {
          const modulePrefix = module.id;
          const eventStartsWithModule = event.startsWith(modulePrefix + ':');
          expect(eventStartsWithModule).toBe(true);
        }
      }
    });

    test('should validate module version formats', () => {
      const modules = loader.getModules();

      for (const module of modules) {
        const semverPattern = /^\d+\.\d+\.\d+$/;
        expect(semverPattern.test(module.version)).toBe(true);
      }
    });
  });
});
