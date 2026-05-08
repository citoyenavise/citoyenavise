/**
 * EventSchemaValidator.js - Validate event schemas and declarations
 * PHASE 1.3: Validation Layer
 *
 * Responsibility: Validate all event types and schemas
 * - Check all declared events have schemas
 * - Validate event emitter/listener declarations
 * - Verify required fields present
 * - Check event payload compliance
 */

class EventSchemaValidator {
  constructor(constitutionManager) {
    this.constitutionManager = constitutionManager;
  }

  /**
   * Run event schema validation
   */
  async validate() {
    const violations = [];
    const schemaRegistry = this.constitutionManager.getSchemaRegistryLoader();
    const manifest = this.constitutionManager.getModuleManifestLoader();

    try {
      // Check all modules declare valid events
      const moduleEventsResult = this._checkModuleEventDeclarations(manifest, schemaRegistry);
      if (!moduleEventsResult.valid) {
        violations.push(...moduleEventsResult.violations);
      }

      // Check emitter/listener consistency
      const emitterListenerResult = this._checkEmitterListenerConsistency(manifest, schemaRegistry);
      if (!emitterListenerResult.valid) {
        violations.push(...emitterListenerResult.violations);
      }

      // Check schema completeness
      const schemaResult = this._checkSchemaCompleteness(schemaRegistry);
      if (!schemaResult.valid) {
        violations.push(...schemaResult.violations);
      }

      // Check event payload requirements
      const payloadResult = this._checkPayloadRequirements(schemaRegistry);
      if (!payloadResult.valid) {
        violations.push(...payloadResult.violations);
      }

      return {
        valid: violations.length === 0,
        validatorName: 'EventSchemaValidator',
        eventTypesChecked: schemaRegistry.getEventTypeCount(),
        violations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        valid: false,
        validatorName: 'EventSchemaValidator',
        violations: [{
          schema: 'UNEXPECTED',
          severity: 'CRITICAL',
          message: `Unexpected error in event schema validation: ${error.message}`
        }],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check module event declarations are valid
   */
  _checkModuleEventDeclarations(manifest, schemaRegistry) {
    const violations = [];
    const modules = manifest.getAllModules();

    for (const module of modules) {
      // Check emitted events
      for (const eventId of module.events_emitted || []) {
        if (!schemaRegistry.eventTypeExists(eventId)) {
          violations.push({
            event: eventId,
            severity: 'CRITICAL',
            message: `Module ${module.name} emits event ${eventId} but no schema defined`,
            module: module.name,
            eventType: eventId,
            type: 'emitted'
          });
        }
      }

      // Check listened events
      for (const eventId of module.events_listened || []) {
        if (!schemaRegistry.eventTypeExists(eventId)) {
          violations.push({
            event: eventId,
            severity: 'CRITICAL',
            message: `Module ${module.name} listens to event ${eventId} but no schema defined`,
            module: module.name,
            eventType: eventId,
            type: 'listened'
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check emitter/listener consistency
   */
  _checkEmitterListenerConsistency(manifest, schemaRegistry) {
    const violations = [];
    const allSchemas = schemaRegistry.getAllEventSchemas();

    for (const schema of allSchemas) {
      // Check emitter exists
      if (schema.emitted_by && !manifest.moduleExists(schema.emitted_by)) {
        violations.push({
          event: schema.id,
          severity: 'CRITICAL',
          message: `Event ${schema.id} declares emitter ${schema.emitted_by} which doesn't exist`,
          eventType: schema.id,
          emitter: schema.emitted_by,
          issue: 'emitter_not_found'
        });
      }

      // Check all listeners exist
      for (const listener of schema.listened_by || []) {
        if (!manifest.moduleExists(listener)) {
          violations.push({
            event: schema.id,
            severity: 'HIGH',
            message: `Event ${schema.id} declares listener ${listener} which doesn't exist`,
            eventType: schema.id,
            listener,
            issue: 'listener_not_found'
          });
        }
      }

      // Check that emitter actually declares this event
      if (schema.emitted_by) {
        const emitterModule = manifest.getModule(schema.emitted_by);
        if (emitterModule && !emitterModule.events_emitted?.includes(schema.id)) {
          violations.push({
            event: schema.id,
            severity: 'MEDIUM',
            message: `Event ${schema.id} has schema for emitter ${schema.emitted_by} but module doesn't declare it`,
            eventType: schema.id,
            emitter: schema.emitted_by,
            issue: 'emitter_declaration_mismatch'
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check schema completeness
   */
  _checkSchemaCompleteness(schemaRegistry) {
    const violations = [];
    const allSchemas = schemaRegistry.getAllEventSchemas();

    for (const schema of allSchemas) {
      // Check required fields
      if (!schema.id) {
        violations.push({
          event: 'UNKNOWN',
          severity: 'CRITICAL',
          message: 'Event schema missing id field',
          issue: 'missing_id'
        });
      }

      if (!schema.schema) {
        violations.push({
          event: schema.id || 'UNKNOWN',
          severity: 'CRITICAL',
          message: `Event ${schema.id} schema missing schema definition`,
          issue: 'missing_schema_definition'
        });
      }

      if (!schema.version) {
        violations.push({
          event: schema.id,
          severity: 'MEDIUM',
          message: `Event ${schema.id} schema missing version`,
          issue: 'missing_version'
        });
      }

      // Check schema format
      if (schema.schema) {
        if (!schema.schema.type && !schema.schema.properties) {
          violations.push({
            event: schema.id,
            severity: 'MEDIUM',
            message: `Event ${schema.id} schema format is invalid`,
            issue: 'invalid_schema_format'
          });
        }

        // Check required array is present
        if (!schema.schema.required || !Array.isArray(schema.schema.required)) {
          violations.push({
            event: schema.id,
            severity: 'LOW',
            message: `Event ${schema.id} schema missing required fields array`,
            issue: 'missing_required_array'
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  /**
   * Check event payload requirements
   */
  _checkPayloadRequirements(schemaRegistry) {
    const violations = [];
    const allSchemas = schemaRegistry.getAllEventSchemas();

    for (const schema of allSchemas) {
      if (!schema.schema) continue;

      const requiredFields = schema.schema.required || [];

      // Every event should have timestamp
      if (!requiredFields.includes('timestamp')) {
        violations.push({
          event: schema.id,
          severity: 'MEDIUM',
          message: `Event ${schema.id} doesn't require timestamp field`,
          eventType: schema.id,
          missingRequired: 'timestamp'
        });
      }

      // Check that required fields are defined in properties
      for (const required of requiredFields) {
        if (!schema.schema.properties || !schema.schema.properties[required]) {
          violations.push({
            event: schema.id,
            severity: 'HIGH',
            message: `Event ${schema.id} requires field ${required} but not defined in properties`,
            eventType: schema.id,
            requiredField: required,
            issue: 'required_field_not_defined'
          });
        }
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }
}

module.exports = EventSchemaValidator;
