// Side-Effect de Transition - Actions exécutées lors d'une transition

class SideEffect {
  constructor(id, executeFunction = null, config = {}) {
    this.id = id;
    this.executeFunction = executeFunction || (async () => {});
    this.description = config.description || '';
    this.metadata = config.metadata || {};
    this.async = config.async !== false;
  }

  // Exécuter l'action
  async execute(context = {}) {
    try {
      return await this.executeFunction(context);
    } catch (error) {
      console.error(`Erreur lors de l\'exécution du side-effect ${this.id}:`, error);
      throw error;
    }
  }

  // Obtenir les informations du side-effect
  getInfo() {
    return {
      id: this.id,
      description: this.description,
      async: this.async,
      metadata: this.metadata,
    };
  }
}

module.exports = SideEffect;
