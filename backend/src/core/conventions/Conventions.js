// Conventions du Système - Phase 1

class Conventions {
  constructor() {
    // Conventions de nommage
    this.NAMING = {
      MODULE_ID_PATTERN: /^[a-z_]+$/,
      EVENT_PATTERN: /^[a-z_]+\.[a-z_]+$/,
      STATE_PATTERN: /^[A-Z_]+$/,
      INVARIANT_ID_PATTERN: /^[a-z_]+$/,
    };

    // Conventions d'événements
    this.EVENTS = {
      REQUIRED_FIELDS: ['eventId', 'eventType', 'timestamp', 'source'],
      TIMESTAMP_FORMAT: 'ISO8601',
      VERSION_FORMAT: 'SEMVER',
    };

    // Conventions de modules
    this.MODULES = {
      REQUIRED_EXPORTS: ['id', 'version', 'manifest'],
      REQUIRED_METHODS: ['initialize', 'shutdown', 'getStatus'],
      VERSION_FORMAT: 'SEMVER',
    };

    // Conventions de versioning
    this.VERSIONING = {
      FORMAT: 'SEMVER', // MAJOR.MINOR.PATCH
      CURRENT: '1.0.0',
      COMPATIBILITY: {
        BREAKING: 'major',
        FEATURE: 'minor',
        BUGFIX: 'patch',
      },
    };

    // Conventions de logging
    this.LOGGING = {
      LEVELS: ['debug', 'info', 'warning', 'error'],
      FORMAT: 'JSON', // JSON ou TEXT
      RETENTION_DAYS: 30,
    };

    // Conventions de contexte
    this.CONTEXT = {
      MAX_SIZE_MB: 10,
      REQUIRED_FIELDS: ['session', 'state', 'modules', 'flags', 'metadata'],
    };

    // Conventions de sécurité
    this.SECURITY = {
      MAX_TRANSITION_TIME_MS: 5000,
      MAX_INVARIANT_CHECKS: 100,
      AUDIT_ENABLED: true,
    };

    // Conventions de structure
    this.STRUCTURE = {
      CORE_MODULES: ['orchestrator', 'state-machine', 'events', 'context', 'logging'],
      MODULES_DIR: 'modules',
      TESTS_DIR: 'tests',
      CONFIG_DIR: 'config',
      LOGS_DIR: 'logs',
    };
  }

  // Vérifier qu'un nom suit la convention
  validateName(name, pattern) {
    const patternObj = this.NAMING[pattern];
    if (!patternObj) {
      throw new Error(`Patron ${pattern} non trouvé`);
    }
    return patternObj.test(name);
  }

  // Vérifier qu'une version suit la convention
  validateVersion(version) {
    const semverPattern = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
    return semverPattern.test(version);
  }

  // Obtenir les conventions actuelles
  getCurrent() {
    return {
      version: this.VERSIONING.CURRENT,
      modules: this.MODULES,
      events: this.EVENTS,
      logging: this.LOGGING,
      structure: this.STRUCTURE,
    };
  }
}

// Exporter une instance singleton
module.exports = new Conventions();
