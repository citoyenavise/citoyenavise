// Énumération des types d'événements système

const EventTypes = {
  // Événements d'orchestration
  ORCHESTRATOR: {
    INITIALIZED: 'orchestrator.initialized',
    SHUTDOWN: 'orchestrator.shutdown',
    TRANSITION: 'orchestrator.transition',
    ERROR: 'orchestrator.error',
  },

  // Événements de module
  MODULE: {
    REGISTERED: 'module.registered',
    LOADED: 'module.loaded',
    UNLOADED: 'module.unloaded',
    ERROR: 'module.error',
    TRANSITION: 'module.transition',
  },

  // Événements de contexte
  CONTEXT: {
    UPDATED: 'context.updated',
    VALIDATED: 'context.validated',
    INVALID: 'context.invalid',
    RESET: 'context.reset',
    FROZEN: 'context.frozen',
    UNFROZEN: 'context.unfrozen',
  },

  // Événements de machine à états
  STATE: {
    ENTERED: 'state.entered',
    EXITED: 'state.exited',
    TRANSITION: 'state.transition',
    GUARD_FAILED: 'state.guard_failed',
    TIMEOUT: 'state.timeout',
  },

  // Événements de validation
  INVARIANT: {
    VIOLATED: 'invariant.violated',
    VALIDATED: 'invariant.validated',
  },

  // Événements de middleware
  MIDDLEWARE: {
    EXECUTED: 'middleware.executed',
    ERROR: 'middleware.error',
  },

  // Événements de versioning
  VERSION: {
    CHECKED: 'version.checked',
    INCOMPATIBLE: 'version.incompatible',
    UPDATED: 'version.updated',
  },

  // Événements de logging
  LOG: {
    DEBUG: 'log.debug',
    INFO: 'log.info',
    WARNING: 'log.warning',
    ERROR: 'log.error',
  },

  // Événements métier (modules)
  BUSINESS: {
    ENTITY_CREATED: 'business.entity_created',
    ENTITY_UPDATED: 'business.entity_updated',
    ENTITY_DELETED: 'business.entity_deleted',
    ACTION_PERFORMED: 'business.action_performed',
  },

  // Événements Module Auth
  AUTH: {
    ATTEMPT: 'auth:attempt',
    SUCCESS: 'auth:success',
    FAILURE: 'auth:failure',
    LOGOUT: 'auth:logout',
    TOKEN_EXPIRED: 'auth:token_expired',
  },

  // Événements Module Users
  USERS: {
    CREATED: 'user:created',
    UPDATED: 'user:updated',
    DELETED: 'user:deleted',
    LOADED: 'user:loaded',
    ERROR: 'user:error',
  },

  // Événements Module Posts
  POSTS: {
    CREATED: 'post:created',
    UPDATED: 'post:updated',
    DELETED: 'post:deleted',
    LIKED: 'post:liked',
    COMMENTED: 'post:commented',
  },

  // Événements Module Notifications
  NOTIFICATIONS: {
    CREATED: 'notification:created',
    SENT: 'notification:sent',
    DELIVERED: 'notification:delivered',
    READ: 'notification:read',
    FAILED: 'notification:failed',
  },

  // Événements Module Analytics
  ANALYTICS: {
    EVENT_TRACKED: 'analytics:event_tracked',
    AGGREGATED: 'analytics:aggregated',
    REPORT_GENERATED: 'analytics:report_generated',
    ERROR: 'analytics:error',
  },
};

module.exports = EventTypes;
