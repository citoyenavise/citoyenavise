// Manifests Index - Phase 1 et 2

const fs = require('fs');
const path = require('path');

class ManifestLoader {
  constructor() {
    this.manifests = {};
    this.loadAll();
  }

  // Charger tous les manifests
  loadAll() {
    const manifestDir = __dirname;
    const files = [
      'manifest.modules.json',
      'manifest.states.json',
      'manifest.phases.json',
      'manifest.guards.json',
      'manifest.side-effects.json'
    ];

    for (const file of files) {
      try {
        const filePath = path.join(manifestDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const name = file.replace('manifest.', '').replace('.json', '');
        this.manifests[name] = JSON.parse(content);
      } catch (error) {
        console.error(`Erreur lors du chargement de ${file}:`, error);
      }
    }
  }

  // Obtenir un manifest
  get(name) {
    return this.manifests[name];
  }

  // Obtenir tous les manifests
  getAll() {
    return { ...this.manifests };
  }

  // Valider un manifest
  validate(name) {
    const manifest = this.manifests[name];
    if (!manifest) {
      return { valid: false, error: `Manifest ${name} non trouvé` };
    }

    // Vérifications basiques
    if (!manifest.$schema && !manifest.title && !manifest.version) {
      return { valid: false, error: 'Manifest invalide - champs obligatoires manquants' };
    }

    return { valid: true, manifest };
  }

  // Obtenir les modules déclarés
  getModules() {
    const modulesManifest = this.manifests.modules;
    if (!modulesManifest || !modulesManifest.modules) {
      return [];
    }
    return modulesManifest.modules;
  }

  // Obtenir les états déclarés
  getStates() {
    const statesManifest = this.manifests.states;
    if (!statesManifest || !statesManifest.states) {
      return {};
    }
    return statesManifest.states;
  }

  // Obtenir les phases déclarées
  getPhases() {
    const phasesManifest = this.manifests.phases;
    if (!phasesManifest || !phasesManifest.phases) {
      return {};
    }
    return phasesManifest.phases;
  }

  // Obtenir les transitions
  getTransitions() {
    const statesManifest = this.manifests.states;
    if (!statesManifest || !statesManifest.transitions) {
      return [];
    }
    return statesManifest.transitions;
  }

  // Obtenir les gardes
  getGuards() {
    const guardsManifest = this.manifests.guards;
    if (!guardsManifest || !guardsManifest.guards) {
      return [];
    }
    return guardsManifest.guards;
  }

  // Obtenir les side-effects
  getSideEffects() {
    const sideEffectsManifest = this.manifests['side-effects'];
    if (!sideEffectsManifest || !sideEffectsManifest.sideEffects) {
      return [];
    }
    return sideEffectsManifest.sideEffects;
  }

  // Vérifier la cohérence des modules
  validateModulesCohesion() {
    const modules = this.getModules();
    const errors = [];

    for (const module of modules) {
      if (!module.id) {
        errors.push(`Module sans ID`);
      }

      if (!module.version) {
        errors.push(`Module ${module.id} sans version`);
      }

      if (module.dependencies) {
        for (const dep of module.dependencies) {
          const depModule = modules.find((m) => m.id === dep);
          if (!depModule) {
            errors.push(`Module ${module.id} dépend de ${dep} qui n'existe pas`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Vérifier la cohérence des états
  validateStatesCohesion() {
    const states = this.getStates();
    const transitions = this.getTransitions();
    const errors = [];

    for (const transition of transitions) {
      if (!states[transition.fromState]) {
        errors.push(
          `Transition de l'état ${transition.fromState} qui n'existe pas`
        );
      }

      if (!states[transition.toState]) {
        errors.push(`Transition vers l'état ${transition.toState} qui n'existe pas`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Rapport de validité complet
  validateAll() {
    const results = {
      modules: this.validateModulesCohesion(),
      states: this.validateStatesCohesion(),
      overallValid: true,
    };

    if (!results.modules.valid || !results.states.valid) {
      results.overallValid = false;
    }

    return results;
  }
}

module.exports = ManifestLoader;
