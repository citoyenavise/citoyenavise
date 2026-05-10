/**
 * Deep Freeze Utility
 * PHASE 9.3 — Enforce immutability on critical objects
 *
 * Respects OBJECT_IMMUTABILITY invariant (Part II.I)
 */

/**
 * Recursively freeze an object and all nested properties
 * @param {*} obj - Object to freeze
 * @param {Set} visited - Track visited objects (prevent cycles)
 * @returns {*} - The frozen object (or same reference if already frozen)
 */
function deepFreeze(obj, visited = new Set()) {
  // Handle primitives and null
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Prevent infinite recursion on circular references
  if (visited.has(obj)) {
    return obj;
  }

  visited.add(obj);

  // Freeze the object itself
  Object.freeze(obj);

  // Recursively freeze all properties
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = obj[prop];

    // Only freeze objects that aren't already frozen
    if (
      value !== null &&
      typeof value === 'object' &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value, visited);
    }
  });

  return obj;
}

/**
 * Check if an object is deeply frozen
 * @param {*} obj - Object to check
 * @param {Set} visited - Track visited objects
 * @returns {boolean} - True if deeply frozen
 */
function isDeepFrozen(obj, visited = new Set()) {
  if (obj === null || typeof obj !== 'object') {
    return true;
  }

  if (visited.has(obj)) {
    return true; // Assume cycles are frozen
  }

  visited.add(obj);

  if (!Object.isFrozen(obj)) {
    return false;
  }

  // Check all properties
  return Object.getOwnPropertyNames(obj).every(prop => {
    const value = obj[prop];
    return isDeepFrozen(value, visited);
  });
}

/**
 * Create a shallow frozen copy (for mutable updating pattern)
 * Use this when you need to modify an object:
 * 1. Unfreeze a copy
 * 2. Modify the copy
 * 3. Refreeze the copy
 * @param {*} obj - Object to copy
 * @returns {*} - Unfrozen shallow copy
 */
function createUnfrozenCopy(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return [...obj];
  }

  return { ...obj };
}

/**
 * Immutable update pattern: create new frozen object with changes
 * @param {*} original - Original frozen object
 * @param {Object} updates - Changes to apply
 * @returns {*} - New frozen object with updates
 */
function createFrozenUpdate(original, updates) {
  if (original === null || typeof original !== 'object') {
    return original;
  }

  // Create shallow copy
  const updated = Array.isArray(original)
    ? [...original]
    : { ...original };

  // Apply updates
  Object.assign(updated, updates);

  // Refreeze
  return deepFreeze(updated);
}

/**
 * Enforce immutability with a proxy (throws on mutation attempts)
 * @param {*} obj - Object to protect
 * @returns {Proxy} - Proxy that prevents mutations
 */
function createImmutableProxy(obj) {
  return new Proxy(obj, {
    set(target, property, value) {
      throw new TypeError(
        `Cannot assign to read-only property '${property}'. Object is immutable.`
      );
    },
    deleteProperty(target, property) {
      throw new TypeError(
        `Cannot delete property '${property}'. Object is immutable.`
      );
    }
  });
}

module.exports = {
  deepFreeze,
  isDeepFrozen,
  createUnfrozenCopy,
  createFrozenUpdate,
  createImmutableProxy
};
