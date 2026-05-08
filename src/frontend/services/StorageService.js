/**
 * StorageService.js
 * Service de stockage client (localStorage avec fallback)
 */

class StorageService {
  constructor() {
    this.memoryStore = new Map();
  }

  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      localStorage?.setItem(key, serialized);
    } catch {
      this.memoryStore.set(key, value);
    }
  }

  get(key) {
    try {
      const item = localStorage?.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return this.memoryStore.get(key) || null;
    }
  }

  remove(key) {
    try {
      localStorage?.removeItem(key);
    } catch {
      this.memoryStore.delete(key);
    }
  }

  clear() {
    try {
      localStorage?.clear();
    } catch {
      this.memoryStore.clear();
    }
  }
}

module.exports = StorageService;
