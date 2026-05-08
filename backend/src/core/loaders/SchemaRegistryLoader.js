/**
 * SchemaRegistryLoader.js - Load and validate SchemaRegistry.json
 * PHASE 1.2: Runtime Loaders
 *
 * Responsibility: Load event schema declarations from constitution
 * - Parse SchemaRegistry.json
 * - Build event type index
 * - Provide schema validation access
 */

const fs = require('fs');
const path = require('path');

class SchemaRegistryLoader {
  constructor() {
    this.registryPath = path.join(__dirname, '../../..', 'ROOT_CONSTITUTION/schemas/SchemaRegistry.json');
    this.schemas = null;
    this.eventIndex = new Map();
    this.sealed = false;
  }

  /**
   * Load and parse SchemaRegistry.json
   */
  async load() {
    if (this.sealed) {
      throw new Error('SchemaRegistryLoader already sealed. Cannot load again.');
    }

    try {
      const content = fs.readFileSync(this.registryPath, 'utf8');
      const registry = JSON.parse(content);

      if (!registry.sealed || !registry.immutable || !registry.read_only) {
        throw new Error('SchemaRegistry.json is not properly sealed');
      }

      this.schemas = registry.event_types || [];
      this._buildIndex();
      this.sealed = true;

      return {
        success: true,
        eventTypeCount: this.schemas.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Failed to load SchemaRegistry: ${error.message}`);
    }
  }

  /**
   * Build searchable index of event types
   */
  _buildIndex() {
    for (const eventType of this.schemas) {
      this.eventIndex.set(eventType.id, {
        id: eventType.id,
        emitted_by: eventType.emitted_by,
        listened_by: eventType.listened_by || [],
        version: eventType.version,
        schema: eventType.schema,
        description: eventType.description
      });
    }
  }

  /**
   * Get event schema by type id
   */
  getEventSchema(eventTypeId) {
    if (!this.sealed) {
      throw new Error('SchemaRegistryLoader not loaded');
    }
    return this.eventIndex.get(eventTypeId);
  }

  /**
   * Get all event schemas
   */
  getAllEventSchemas() {
    if (!this.sealed) {
      throw new Error('SchemaRegistryLoader not loaded');
    }
    return Array.from(this.eventIndex.values());
  }

  /**
   * Get events emitted by module
   */
  getEventsByEmitter(moduleName) {
    if (!this.sealed) {
      throw new Error('SchemaRegistryLoader not loaded');
    }
    return Array.from(this.eventIndex.values())
      .filter(e => e.emitted_by === moduleName);
  }

  /**
   * Get events listened by module
   */
  getEventsByListener(moduleName) {
    if (!this.sealed) {
      throw new Error('SchemaRegistryLoader not loaded');
    }
    return Array.from(this.eventIndex.values())
      .filter(e => e.listened_by.includes(moduleName));
  }

  /**
   * Validate event type exists
   */
  eventTypeExists(eventTypeId) {
    if (!this.sealed) {
      throw new Error('SchemaRegistryLoader not loaded');
    }
    return this.eventIndex.has(eventTypeId);
  }

  /**
   * Get event type count
   */
  getEventTypeCount() {
    if (!this.sealed) {
      throw new Error('SchemaRegistryLoader not loaded');
    }
    return this.eventIndex.size;
  }

  /**
   * Validate event payload against schema
   */
  validateEventPayload(eventTypeId, payload) {
    if (!this.sealed) {
      throw new Error('SchemaRegistryLoader not loaded');
    }

    const schema = this.eventIndex.get(eventTypeId);
    if (!schema) {
      return { valid: false, error: `Event type ${eventTypeId} not found` };
    }

    // Check required fields
    const requiredFields = schema.schema.required || [];
    for (const field of requiredFields) {
      if (!(field in payload)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    return { valid: true };
  }

  /**
   * Get constitution metadata
   */
  getMetadata() {
    if (!this.sealed) {
      throw new Error('SchemaRegistryLoader not loaded');
    }
    return {
      sealed: true,
      immutable: true,
      read_only: true,
      event_type_count: this.eventIndex.size,
      loaded_at: new Date().toISOString()
    };
  }
}

module.exports = SchemaRegistryLoader;
