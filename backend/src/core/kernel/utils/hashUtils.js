/**
 * Hash Utilities
 * PHASE 9.3 — Shared hashing functions for deterministic computation
 */

const crypto = require('crypto');
const config = require('../kernelConfig');

/**
 * Compute deterministic SHA-256 hash
 * @param {any} obj - Object to hash
 * @returns {string} - SHA-256 hex digest
 */
function computeHash(obj) {
  const canonical = canonicalize(obj);
  return crypto
    .createHash('sha256')
    .update(canonical)
    .digest('hex');
}

/**
 * Canonicalize object for deterministic hashing
 * @param {any} obj - Object to canonicalize
 * @returns {string} - Canonical JSON representation
 */
function canonicalize(obj) {
  if (obj === null || obj === undefined) {
    return '';
  }

  if (typeof obj === 'string') {
    return JSON.stringify(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return JSON.stringify(obj.map(canonicalize));
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const pairs = keys.map(k => {
      return `"${k}":${canonicalize(obj[k])}`;
    });
    return `{${pairs.join(',')}}`;
  }

  return JSON.stringify(obj);
}

/**
 * Compute hash of array of objects (for idempotency set)
 * @param {Set<string>} set - Set of event IDs
 * @returns {string} - SHA-256 hex digest
 */
function hashIdempotencySet(set) {
  const sorted = Array.from(set).sort();
  const canonical = JSON.stringify(sorted);
  return crypto
    .createHash('sha256')
    .update(canonical)
    .digest('hex');
}

/**
 * Hash shard map deterministically
 * @param {Map} shardMap - Shard assignments
 * @returns {string} - SHA-256 hex digest
 */
function hashShardMap(shardMap) {
  const entries = Array.from(shardMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  const canonical = JSON.stringify(entries);
  return crypto
    .createHash('sha256')
    .update(canonical)
    .digest('hex');
}

/**
 * Chain hashes together (for proof log)
 * @param {string} previousHash - Hash of previous entry
 * @param {string} currentHash - Hash of current entry
 * @returns {string} - Combined hash
 */
function chainHashes(previousHash, currentHash) {
  const combined = previousHash + currentHash;
  return crypto
    .createHash('sha256')
    .update(combined)
    .digest('hex');
}

/**
 * Verify hash matches computed value
 * @param {any} obj - Object to verify
 * @param {string} expectedHash - Expected hash value
 * @returns {boolean} - True if matches
 */
function verifyHash(obj, expectedHash) {
  const computedHash = computeHash(obj);
  return computedHash === expectedHash;
}

module.exports = {
  computeHash,
  canonicalize,
  hashIdempotencySet,
  hashShardMap,
  chainHashes,
  verifyHash
};
