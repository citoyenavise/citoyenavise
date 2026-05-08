/**
 * APIValidator.js
 * Phase 5 — Validation des contrats API et schémas
 */

const APIContractRegistry = require('./APIContractRegistry.json');

class APIValidator {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.contracts = APIContractRegistry.endpoints || [];
    this.schemaCache = new Map();
    this.validationMetrics = {
      validationsRun: 0,
      validationsPass: 0,
      validationsFail: 0,
    };
  }

  async initialize() {
    console.log('[APIValidator] Initialisation du validateur API');

    // Valider que tous les contrats sont bien formés
    const errors = this.validateContracts();
    if (errors.length > 0) {
      console.error('[APIValidator] Erreurs de contrat:', errors);
      throw new Error(`API Contract validation failed: ${errors.join(', ')}`);
    }

    console.log('[APIValidator] Tous les contrats validés');
    await this.eventBus.emit('api:validator:ready', {
      contractCount: this.contracts.length,
      timestamp: new Date().toISOString(),
    });
  }

  validateContracts() {
    const errors = [];

    for (const contract of this.contracts) {
      // Vérifier les champs obligatoires
      if (!contract.id) errors.push(`Contract without ID`);
      if (!contract.module) errors.push(`Contract ${contract.id}: missing module`);
      if (!contract.method) errors.push(`Contract ${contract.id}: missing method`);
      if (!contract.path) errors.push(`Contract ${contract.id}: missing path`);
      if (!contract.request) errors.push(`Contract ${contract.id}: missing request schema`);
      if (!contract.response) errors.push(`Contract ${contract.id}: missing response schema`);
      if (!contract.permissions) errors.push(`Contract ${contract.id}: missing permissions`);
      if (!contract.eventsEmitted) errors.push(`Contract ${contract.id}: missing eventsEmitted`);

      // Vérifier que les permissions sont valides
      const validPermissions = ['public', 'authenticated', 'authenticated:owner', 'authenticated:admin', 'authenticated:owner_or_admin'];
      for (const perm of contract.permissions || []) {
        if (!validPermissions.includes(perm) && !perm.startsWith('authenticated:')) {
          errors.push(`Contract ${contract.id}: invalid permission ${perm}`);
        }
      }
    }

    return errors;
  }

  validateRequestPayload(endpointId, payload) {
    const contract = this.contracts.find(c => c.id === endpointId);
    if (!contract) {
      return { valid: false, errors: [`Endpoint not found: ${endpointId}`] };
    }

    this.validationMetrics.validationsRun++;

    const errors = [];
    const requestSchema = contract.request;

    if (!requestSchema) {
      this.validationMetrics.validationsPass++;
      return { valid: true, errors: [] };
    }

    // Vérifier les champs requis
    const required = requestSchema.required || [];
    for (const field of required) {
      if (!(field in payload)) {
        errors.push(`Required field missing: ${field}`);
      }
    }

    // Valider les types
    const properties = requestSchema.properties || {};
    for (const [field, schema] of Object.entries(properties)) {
      if (!(field in payload)) continue;

      const value = payload[field];
      const type = schema.type;

      if (type === 'array' && !Array.isArray(value)) {
        errors.push(`Field ${field} must be array`);
      } else if (type === 'object' && typeof value !== 'object') {
        errors.push(`Field ${field} must be object`);
      } else if (type === 'string' && typeof value !== 'string') {
        errors.push(`Field ${field} must be string`);
      } else if (type === 'integer' && !Number.isInteger(value)) {
        errors.push(`Field ${field} must be integer`);
      } else if (type === 'number' && typeof value !== 'number') {
        errors.push(`Field ${field} must be number`);
      }

      // Valider les constraints
      if (typeof value === 'string') {
        if (schema.minLength && value.length < schema.minLength) {
          errors.push(`${field} too short (min: ${schema.minLength})`);
        }
        if (schema.maxLength && value.length > schema.maxLength) {
          errors.push(`${field} too long (max: ${schema.maxLength})`);
        }
        if (schema.format === 'email' && !this.isValidEmail(value)) {
          errors.push(`${field} invalid email format`);
        }
      }

      if (typeof value === 'number') {
        if (schema.minimum && value < schema.minimum) {
          errors.push(`${field} below minimum (min: ${schema.minimum})`);
        }
        if (schema.maximum && value > schema.maximum) {
          errors.push(`${field} above maximum (max: ${schema.maximum})`);
        }
      }
    }

    if (errors.length > 0) {
      this.validationMetrics.validationsFail++;
      return { valid: false, errors };
    }

    this.validationMetrics.validationsPass++;
    return { valid: true, errors: [] };
  }

  validateResponsePayload(endpointId, payload) {
    const contract = this.contracts.find(c => c.id === endpointId);
    if (!contract) {
      return { valid: false, errors: [`Endpoint not found: ${endpointId}`] };
    }

    this.validationMetrics.validationsRun++;

    // Pour les réponses, on fait une validation plus souple
    // On vérifie juste que la structure de base existe
    const responseSchema = contract.response;
    if (!responseSchema) {
      this.validationMetrics.validationsPass++;
      return { valid: true, errors: [] };
    }

    const errors = [];
    const properties = responseSchema.properties || {};

    // Juste vérifier les types de haut niveau
    for (const [field, schema] of Object.entries(properties)) {
      if (!(field in payload)) continue;

      const value = payload[field];
      const type = schema.type;

      if (type && typeof value !== type && !(type === 'array' && Array.isArray(value))) {
        // Note: soft validation for responses
        console.warn(`[APIValidator] Response type mismatch for ${field}`);
      }
    }

    if (errors.length > 0) {
      this.validationMetrics.validationsFail++;
      return { valid: false, errors };
    }

    this.validationMetrics.validationsPass++;
    return { valid: true, errors: [] };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  getEndpointContract(endpointId) {
    return this.contracts.find(c => c.id === endpointId);
  }

  getEndpointsByModule(moduleName) {
    return this.contracts.filter(c => c.module === moduleName);
  }

  getEndpointsByPermission(permission) {
    return this.contracts.filter(c => c.permissions.includes(permission));
  }

  getMetrics() {
    return {
      ...this.validationMetrics,
      validationSuccessRate: this.validationMetrics.validationsRun > 0
        ? ((this.validationMetrics.validationsPass / this.validationMetrics.validationsRun) * 100).toFixed(2)
        : 'N/A',
    };
  }
}

module.exports = APIValidator;
