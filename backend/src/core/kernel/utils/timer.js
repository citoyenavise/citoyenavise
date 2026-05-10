/**
 * Timer Utility
 * PHASE 9.3 — Timing and deadline management
 */

class Timer {
  constructor(timeoutMs) {
    this.timeoutMs = timeoutMs;
    this.startTime = Date.now();
    this.endTime = this.startTime + timeoutMs;
  }

  /**
   * Check if timer has expired
   */
  isExpired() {
    return Date.now() >= this.endTime;
  }

  /**
   * Get remaining milliseconds
   */
  getRemainingMs() {
    const remaining = this.endTime - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Get elapsed milliseconds
   */
  getElapsedMs() {
    return Date.now() - this.startTime;
  }

  /**
   * Assert timer hasn't expired
   */
  assertNotExpired(message = 'Timer expired') {
    if (this.isExpired()) {
      throw new Error(message);
    }
  }

  /**
   * Wait until timer expires
   */
  async waitForExpiration() {
    const remaining = this.getRemainingMs();
    if (remaining > 0) {
      return new Promise(resolve => setTimeout(resolve, remaining));
    }
  }

  /**
   * Get deadline as absolute timestamp
   */
  getDeadline() {
    return this.endTime;
  }

  /**
   * Get human-readable remaining time
   */
  getRemainingReadable() {
    const remaining = this.getRemainingMs();
    if (remaining <= 0) return '0ms (expired)';
    if (remaining < 1000) return `${remaining}ms`;
    return `${(remaining / 1000).toFixed(1)}s`;
  }
}

/**
 * Create a timer that resets
 */
class ResettableTimer {
  constructor(timeoutMs) {
    this.timeoutMs = timeoutMs;
    this.reset();
  }

  reset() {
    this.timer = new Timer(this.timeoutMs);
  }

  isExpired() {
    return this.timer.isExpired();
  }

  getRemainingMs() {
    return this.timer.getRemainingMs();
  }

  getElapsedMs() {
    return this.timer.getElapsedMs();
  }

  assertNotExpired(message) {
    return this.timer.assertNotExpired(message);
  }
}

/**
 * Measure operation duration
 */
class Stopwatch {
  constructor() {
    this.startTime = Date.now();
    this.splits = [];
  }

  split(label = null) {
    const elapsed = Date.now() - this.startTime;
    this.splits.push({ label, elapsed });
    return elapsed;
  }

  stop() {
    return this.split('STOP');
  }

  getSplits() {
    return this.splits;
  }

  getElapsed() {
    return Date.now() - this.startTime;
  }
}

module.exports = {
  Timer,
  ResettableTimer,
  Stopwatch
};
