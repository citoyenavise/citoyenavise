// Logger Centralisé - Phase 1

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(context = 'System', config = {}) {
    this.context = context;
    this.level = config.level || 'info';
    this.logDir = config.logDir || path.join(__dirname, '../../logs');
    this.logFile = config.logFile || `${this.logDir}/${new Date().toISOString().split('T')[0]}.log`;
    this.colors = config.colors !== false;
    this.ensureLogDir();
  }

  // S'assurer que le répertoire de logs existe
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Mapper les niveaux de log
  static LEVELS = {
    debug: 0,
    info: 1,
    warning: 2,
    error: 3,
  };

  // Vérifier si le niveau doit être loggé
  shouldLog(level) {
    return Logger.LEVELS[level] >= Logger.LEVELS[this.level];
  }

  // Formatter le message
  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const context = this.context;
    const dataStr = Object.keys(data).length > 0 ? JSON.stringify(data) : '';

    return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message} ${dataStr}`;
  }

  // Écrire dans le fichier de log
  writeToFile(message) {
    try {
      fs.appendFileSync(this.logFile, message + '\n', 'utf-8');
    } catch (error) {
      console.error('Erreur lors de l\'écriture du log:', error);
    }
  }

  // Log de débogage
  debug(message, data = {}) {
    if (!this.shouldLog('debug')) return;

    const formatted = this.formatMessage('debug', message, data);
    console.log(formatted);
    this.writeToFile(formatted);
  }

  // Log d'information
  info(message, data = {}) {
    if (!this.shouldLog('info')) return;

    const formatted = this.formatMessage('info', message, data);
    console.log(formatted);
    this.writeToFile(formatted);
  }

  // Log d'avertissement
  warning(message, data = {}) {
    if (!this.shouldLog('warning')) return;

    const formatted = this.formatMessage('warning', message, data);
    console.warn(formatted);
    this.writeToFile(formatted);
  }

  // Log d'erreur
  error(message, error = null) {
    const formatted = this.formatMessage('error', message, {
      error: error?.message || error,
      stack: error?.stack,
    });

    console.error(formatted);
    this.writeToFile(formatted);
  }

  // Trace (pour débogage profond)
  trace(message, data = {}) {
    if (!this.shouldLog('debug')) return;

    const formatted = this.formatMessage('trace', message, {
      ...data,
      stack: new Error().stack,
    });

    console.log(formatted);
    this.writeToFile(formatted);
  }

  // Changer le niveau de log
  setLevel(level) {
    if (Logger.LEVELS[level] !== undefined) {
      this.level = level;
    }
  }

  // Créer un sous-logger
  child(name) {
    return new Logger(`${this.context}:${name}`, {
      level: this.level,
      logDir: this.logDir,
      colors: this.colors,
    });
  }
}

module.exports = Logger;
