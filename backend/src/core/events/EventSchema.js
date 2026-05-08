// Schémas d'événements standardisés

const EventSchema = {
  // Schéma de base pour tous les événements
  BASE: {
    type: 'object',
    required: ['eventType', 'timestamp', 'source'],
    properties: {
      eventId: {
        type: 'string',
        description: 'Identifiant unique de l\'événement',
      },
      eventType: {
        type: 'string',
        description: 'Type d\'événement',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        description: 'Timestamp ISO 8601',
      },
      source: {
        type: 'string',
        description: 'Module ou composant source',
      },
      version: {
        type: 'string',
        description: 'Version du schéma d\'événement',
      },
      metadata: {
        type: 'object',
        description: 'Métadonnées supplémentaires',
      },
    },
  },

  // Événement d'orchestration
  ORCHESTRATOR_INITIALIZED: {
    allOf: [
      { $ref: '#/BASE' },
      {
        properties: {
          data: {
            type: 'object',
            properties: {
              initialState: { type: 'string' },
              version: { type: 'string' },
            },
          },
        },
      },
    ],
  },

  // Événement de transition
  STATE_TRANSITION: {
    allOf: [
      { $ref: '#/BASE' },
      {
        properties: {
          data: {
            type: 'object',
            required: ['previousState', 'currentState', 'event'],
            properties: {
              previousState: { type: 'string' },
              currentState: { type: 'string' },
              event: { type: 'string' },
              context: { type: 'object' },
            },
          },
        },
      },
    ],
  },

  // Événement de module enregistré
  MODULE_REGISTERED: {
    allOf: [
      { $ref: '#/BASE' },
      {
        properties: {
          data: {
            type: 'object',
            required: ['moduleId', 'version'],
            properties: {
              moduleId: { type: 'string' },
              version: { type: 'string' },
              metadata: { type: 'object' },
            },
          },
        },
      },
    ],
  },

  // Événement de contexte mis à jour
  CONTEXT_UPDATED: {
    allOf: [
      { $ref: '#/BASE' },
      {
        properties: {
          data: {
            type: 'object',
            required: ['path', 'value'],
            properties: {
              path: { type: 'string' },
              value: {},
              oldValue: {},
            },
          },
        },
      },
    ],
  },

  // Événement de garde échouée
  STATE_GUARD_FAILED: {
    allOf: [
      { $ref: '#/BASE' },
      {
        properties: {
          data: {
            type: 'object',
            required: ['fromState', 'event', 'reason'],
            properties: {
              fromState: { type: 'string' },
              event: { type: 'string' },
              reason: { type: 'string' },
              guard: { type: 'string' },
            },
          },
        },
      },
    ],
  },

  // Événement d'invariant violé
  INVARIANT_VIOLATED: {
    allOf: [
      { $ref: '#/BASE' },
      {
        properties: {
          data: {
            type: 'object',
            required: ['invariantId', 'message'],
            properties: {
              invariantId: { type: 'string' },
              message: { type: 'string' },
              violations: { type: 'array' },
            },
          },
        },
      },
    ],
  },

  // Événement d'erreur
  ERROR: {
    allOf: [
      { $ref: '#/BASE' },
      {
        properties: {
          data: {
            type: 'object',
            required: ['error', 'message'],
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
              stack: { type: 'string' },
              context: { type: 'object' },
            },
          },
        },
      },
    ],
  },
};

module.exports = EventSchema;
