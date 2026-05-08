/**
 * EventValidationEngine
 * PHASE 5.3 — Event Schema Registry & Validation
 *
 * Validates all events against schemas before emission.
 * Enforces:
 * - Schema existence
 * - Required fields
 * - Field types
 * - Version compatibility
 * - Severity levels
 *
 * RULE: No event without schema. No event without validation.
 */

const fs = require('fs');
const path = require('path');

class EventValidationEngine {
  constructor(options = {}) {
    this.schemaRegistryPath = options.schemaRegistryPath ||
      path.join(__dirname, '../../../../ROOT_EVENTS/EventSchemaRegistry.json');
    this.versionMatrixPath = options.versionMatrixPath ||
      path.join(__dirname, '../../../../ROOT_EVENTS/EventVersionMatrix.json');

    this.schemas = {};
    this.versionMatrix = {};
    this.metrics = {
      eventsValidated: 0,
      validationPassed: 0,
      validationFailed: 0,
      schemaViolations: [],
      sanitizationCount: 0
    };

    this._loadSchemas();
  }

  /**
   * Validate event before emission
   * Throws on validation failure
   */
  validate(event) {
    if (!event) throw new Error('event required');

    this.metrics.eventsValidated += 1;

    try {
      // Check schema exists
      const schema = this.schemas.schemas[event.type];
      if (!schema) {
        this.metrics.validationFailed += 1;
        throw new Error(`No schema found for event type: ${event.type}`);
      }

      // Check version exists in schema
      const version = event.metadata?.version || '1.0.0';
      const versionSchema = schema.versions[version];
      if (!versionSchema) {
        this.metrics.validationFailed += 1;
        throw new Error(
          `Version ${version} not found for event type ${event.type}`
        );
      }

      // Validate required fields
      for (const field of versionSchema.required_fields) {
        if (!(field in event.payload)) {
          this.metrics.validationFailed += 1;
          throw new Error(
            `Required field missing: ${field} in ${event.type} v${version}`
          );
        }
      }

      // Validate field types
      this._validateFieldTypes(event, versionSchema);

      // Validate severity
      const allowedSeverities = this.schemas.global_rules.severity_levels;
      if (!allowedSeverities.includes(event.severity)) {
        this.metrics.validationFailed += 1;
        throw new Error(
          `Invalid severity: ${event.severity}. Allowed: ${allowedSeverities.join(', ')}`
        );
      }

      // Check required global fields
      if (!event.timestamp) {
        this.metrics.validationFailed += 1;
        throw new Error('Global required field missing: timestamp');
      }
      if (!event.traceId) {
        this.metrics.validationFailed += 1;
        throw new Error('Global required field missing: traceId');
      }

      // Check payload size
      const payloadSize = JSON.stringify(event.payload).length / 1024;
      if (payloadSize > this.schemas.global_rules.max_payload_size_kb) {
        this.metrics.validationFailed += 1;
        throw new Error(
          `Payload too large: ${payloadSize}KB > ${this.schemas.global_rules.max_payload_size_kb}KB`
        );
      }

      this.metrics.validationPassed += 1;
      return { valid: true, eventType: event.type, version };
    } catch (error) {
      const violation = {
        eventId: event.id,
        eventType: event.type,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      this.metrics.schemaViolations.push(violation);
      throw error;
    }
  }

  /**
   * Validate schema structure
   */
  validateSchema(eventType, version) {
    if (!eventType) throw new Error('eventType required');

    const schema = this.schemas.schemas[eventType];
    if (!schema) {
      return { valid: false, reason: `No schema found for ${eventType}` };
    }

    const versionSchema = schema.versions[version || schema.versions[Object.keys(schema.versions)[0]]];
    if (!versionSchema) {
      return { valid: false, reason: `Version ${version} not found` };
    }

    return {
      valid: true,
      eventType,
      version: version || Object.keys(schema.versions)[0],
      requiredFields: versionSchema.required_fields,
      optionalFields: versionSchema.optional_fields
    };
  }

  /**
   * Sanitize event (normalize, add defaults)
   */
  sanitize(event) {
    if (!event) throw new Error('event required');

    const sanitized = { ...event };

    // Ensure timestamp
    if (!sanitized.timestamp) {
      sanitized.timestamp = new Date().toISOString();
    }

    // Ensure traceId
    if (!sanitized.traceId) {
      const { v4: uuid } = require('uuid');
      sanitized.traceId = uuid();
    }

    // Ensure version in metadata
    if (!sanitized.metadata) {
      sanitized.metadata = {};
    }
    if (!sanitized.metadata.version) {
      sanitized.metadata.version = '1.0.0';
    }

    // Ensure origin
    if (!sanitized.metadata.origin) {
      sanitized.metadata.origin = 'event-system';
    }

    this.metrics.sanitizationCount += 1;
    return sanitized;
  }

  /**
   * Batch validate events
   */
  validateBatch(events) {
    const results = [];
    for (const event of events) {
      try {
        const result = this.validate(event);
        results.push({ eventId: event.id, ...result });
      } catch (error) {
        results.push({
          eventId: event.id,
          valid: false,
          error: error.message
        });
      }
    }
    return results;
  }

  /**
   * Get validation metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      violationCount: this.metrics.schemaViolations.length,
      validationRate: this.metrics.eventsValidated > 0
        ? Math.round((this.metrics.validationPassed / this.metrics.eventsValidated) * 100)
        : 0
    };
  }

  /**
   * Get schema registry
   */
  getSchemaRegistry() {
    return this.schemas;
  }

  /**
   * Get schema for event type
   */
  getSchema(eventType) {
    return this.schemas.schemas[eventType];
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      eventsValidated: 0,
      validationPassed: 0,
      validationFailed: 0,
      schemaViolations: [],
      sanitizationCount: 0
    };
    return { reset: true };
  }

  /**
   * Private: Load schemas from registry file
   */
  _loadSchemas() {
    try {
      if (fs.existsSync(this.schemaRegistryPath)) {
        const raw = fs.readFileSync(this.schemaRegistryPath, 'utf8');
        this.schemas = JSON.parse(raw);
      } else {
        console.warn(`Schema registry not found at ${this.schemaRegistryPath}`);
        this.schemas = { schemas: {}, global_rules: {} };
      }

      if (fs.existsSync(this.versionMatrixPath)) {
        const raw = fs.readFileSync(this.versionMatrixPath, 'utf8');
        this.versionMatrix = JSON.parse(raw);
      }
    } catch (error) {
      console.error('Failed to load event schemas:', error.message);
      this.schemas = { schemas: {}, global_rules: {} };
    }
  }

  /**
   * Private: Validate field types
   */
  _validateFieldTypes(event, versionSchema) {
    const fieldTypes = versionSchema.field_types || {};

    for (const [field, value] of Object.entries(event.payload)) {
      const typeSpec = fieldTypes[field];
      if (!typeSpec) continue;

      // Parse type spec (e.g., "enum:LOW|MEDIUM|HIGH" or "string:uuid")
      const [baseType, constraint] = typeSpec.split(':');

      // Check base type
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (!this._typeMatches(actualType, baseType)) {
        throw new Error(
          `Field ${field} has wrong type: expected ${baseType}, got ${actualType}`
        );
      }

      // Check constraint
      if (constraint) {
        if (baseType === 'enum' && !constraint.split('|').includes(value)) {
          throw new Error(
            `Field ${field} has invalid enum value: ${value}`
          );
        }
        if (constraint === 'uuid' && !this._isValidUUID(value)) {
          throw new Error(`Field ${field} is not a valid UUID`);
        }
        if (constraint === 'iso8601' && !this._isValidISO8601(value)) {
          throw new Error(`Field ${field} is not valid ISO8601`);
        }
        if (constraint.startsWith('0-') && (value < 0 || value > parseInt(constraint.split('-')[1]))) {
          throw new Error(
            `Field ${field} out of range: ${constraint}`
          );
        }
      }
    }
  }

  /**
   * Private: Check if type matches
   */
  _typeMatches(actual, expected) {
    const typeMap = {
      'string': ['string'],
      'number': ['number'],
      'boolean': ['boolean'],
      'object': ['object'],
      'array': ['array'],
      'enum': ['string']
    };

    return typeMap[expected]?.includes(actual) || expected === 'any';
  }

  /**
   * Private: Validate UUID
   */
  _isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  /**
   * Private: Validate ISO8601
   */
  _isValidISO8601(str) {
    try {
      const date = new Date(str);
      return date.toISOString() === str;
    } catch {
      return false;
    }
  }
}

module.exports = EventValidationEngine;
