// Garde de Transition - Vérifie les conditions avant une transition

class Guard {
  constructor(id, checkFunction = null, config = {}) {
    this.id = id;
    this.checkFunction = checkFunction || (() => true);
    this.description = config.description || '';
    this.metadata = config.metadata || {};
  }

  // Vérifier si la condition est remplie
  check(context = {}) {
    try {
      return this.checkFunction(context);
    } catch (error) {
      console.error(`Erreur lors de la vérification de la garde ${this.id}:`, error);
      return false;
    }
  }

  // Obtenir les informations de la garde
  getInfo() {
    return {
      id: this.id,
      description: this.description,
      metadata: this.metadata,
    };
  }
}

module.exports = Guard;
