// Validateur d'Événements

const EventSchema = require('./EventSchema');

class EventValidator {
  constructor() {
    this.schemas = EventSchema;
  }

  // Valider un événement contre son schéma
  validate(event, schemaName = 'BASE') {
    const schema = this.schemas[schemaName];

    if (!schema) {
      return {
        valid: false,
        errors: [`Schéma ${schemaName} non trouvé`],
      };
    }

    const errors = [];

    // Vérifier les champs requis
    if (schema.required) {
      for (const required of schema.required) {
        if (!(required in event)) {
          errors.push(`Champ requis manquant: ${required}`);
        }
      }
    }

    // Vérifier les types
    if (schema.properties) {
      for (const [key, rule] of Object.entries(schema.properties)) {
        if (key in event && rule.type) {
          const actualType = typeof event[key];
          if (actualType !== rule.type) {
            errors.push(
              `Type incorrect pour ${key}: attendu ${rule.type}, reçu ${actualType}`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      schemaName,
    };
  }

  // Créer un événement conforme au schéma
  createEvent(eventType, data = {}, source = 'system') {
    return {
      eventId: this.generateEventId(),
      eventType,
      timestamp: new Date().toISOString(),
      source,
      version: '1.0.0',
      data,
      metadata: {},
    };
  }

  // Générer un ID d'événement unique
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Valider et créer un événement
  createAndValidate(eventType, data = {}, source = 'system', schemaName = 'BASE') {
    const event = this.createEvent(eventType, data, source);
    const validation = this.validate(event, schemaName);

    return {
      event,
      validation,
      success: validation.valid,
    };
  }

  // Enrichir un événement
  enrich(event, additionalMetadata = {}) {
    return {
      ...event,
      metadata: {
        ...event.metadata,
        ...additionalMetadata,
        enrichedAt: new Date().toISOString(),
      },
    };
  }

  // Filtrer des événements
  filter(events, criteria = {}) {
    return events.filter((event) => {
      if (criteria.eventType && event.eventType !== criteria.eventType) {
        return false;
      }

      if (criteria.source && event.source !== criteria.source) {
        return false;
      }

      if (criteria.after && new Date(event.timestamp) < new Date(criteria.after)) {
        return false;
      }

      if (criteria.before && new Date(event.timestamp) > new Date(criteria.before)) {
        return false;
      }

      return true;
    });
  }
}

module.exports = EventValidator;
