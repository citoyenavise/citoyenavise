/**
 * Logger Utility
 * PHASE 9.3 — Centralized logging for kernel operations
 */

const config = require('../kernelConfig');

const LOG_LEVELS = {
  ERROR: 0,
  WARNING: 1,
  INFO: 2,
  DEBUG: 3
};

class KernelLogger {
  constructor(options = {}) {
    this.level = this._parseLevel(options.level || config.logging.level);
    this.enableTimestamps = options.enableTimestamps !== false;
    this.enableStackTraces = options.enableStackTraces !== false;
    this.logBuffer = [];
    this.maxBufferSize = options.maxBufferSize || config.logging.maxLogSize;
  }

  /**
   * Log error level
   */
  error(module, message, context = null) {
    this._log('ERROR', module, message, context);
  }

  /**
   * Log warning level
   */
  warn(module, message, context = null) {
    if (this.level >= LOG_LEVELS.WARNING) {
      this._log('WARNING', module, message, context);
    }
  }

  /**
   * Log info level
   */
  info(module, message, context = null) {
    if (this.level >= LOG_LEVELS.INFO) {
      this._log('INFO', module, message, context);
    }
  }

  /**
   * Log debug level
   */
  debug(module, message, context = null) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      this._log('DEBUG', module, message, context);
    }
  }

  /**
   * Internal: Format and output log
   */
  _log(level, module, message, context) {
    const timestamp = this.enableTimestamps ? new Date().toISOString() : '';
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    const logEntry = `[${timestamp}] [${level}] [${module}] ${message}${contextStr}`;

    // Output to console
    console.log(logEntry);

    // Store in buffer
    this.logBuffer.push({
      timestamp: Date.now(),
      level,
      module,
      message,
      context
    });

    // Maintain buffer size
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Parse log level string
   */
  _parseLevel(levelStr) {
    return LOG_LEVELS[levelStr.toUpperCase()] || LOG_LEVELS.INFO;
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit = 100) {
    return this.logBuffer.slice(-limit);
  }

  /**
   * Clear buffer
   */
  clearBuffer() {
    this.logBuffer = [];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level) {
    return this.logBuffer.filter(l => l.level === level);
  }
}

// Global singleton instance
let globalLogger = null;

function getLogger(options = {}) {
  if (!globalLogger) {
    globalLogger = new KernelLogger(options);
  }
  return globalLogger;
}

module.exports = {
  getLogger,
  KernelLogger,
  LOG_LEVELS
};
