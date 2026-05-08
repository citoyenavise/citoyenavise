// Invariant - Conditions qui doivent toujours être vraies

class Invariant {
  constructor(id, checkFunction = null, config = {}) {
    this.id = id;
    this.checkFunction = checkFunction || (() => true);
    this.message = config.message || 'Invariant non défini';
    this.severity = config.severity || 'critical'; // critical, warning
    this.metadata = config.metadata || {};
    this.lastCheck = null;
  }

  // Vérifier si l'invariant est respecté
  check(context = {}) {
    try {
      const result = this.checkFunction(context);
      this.lastCheck = {
        result,
        timestamp: new Date(),
        context,
      };
      return result;
    } catch (error) {
      console.error(`Erreur lors de la vérification de l'invariant ${this.id}:`, error);
      this.lastCheck = {
        result: false,
        error,
        timestamp: new Date(),
      };
      return false;
    }
  }

  // Alias pour check() - compatibilité
  verify(context = {}) {
    return this.check(context);
  }

  // Obtenir les informations de l'invariant
  getInfo() {
    return {
      id: this.id,
      message: this.message,
      severity: this.severity,
      metadata: this.metadata,
      lastCheck: this.lastCheck,
    };
  }

  // Obtenir le dernier résultat de vérification
  getLastCheckResult() {
    return this.lastCheck;
  }
}

module.exports = Invariant;
