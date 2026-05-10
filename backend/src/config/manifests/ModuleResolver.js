/**
 * PHASE 2.1 — ModuleResolver
 *
 * Résout l'ordre d'initialisation des modules en fonction des dépendances.
 * - Charge manifest.modules.core.json
 * - Détecte et bloque les cycles de dépendances
 * - Résout l'ordre topologique déterministe
 * - Génère une registry complète avec services et événements
 * - Valide que chaque dépendance est satisfaisable
 */

const fs = require('fs');
const path = require('path');
const logger = require('../../core/utils/logger');

class ModuleResolver {
  constructor() {
    this.manifest = null;
    this.modules = new Map();
    this.resolvedOrder = [];
    this.dependencyGraph = new Map();
    this.cycleDetected = false;
    this.errors = [];
    this.warnings = [];
    this.load();
  }

  /**
   * Charger le manifest des modules CORE
   */
  load() {
    try {
      const manifestPath = path.join(__dirname, 'manifest.modules.core.json');
      const content = fs.readFileSync(manifestPath, 'utf-8');
      this.manifest = JSON.parse(content);

      // Construire la map des modules
      for (const module of this.manifest.modules) {
        this.modules.set(module.id, module);
      }

      logger.debug(`ModuleResolver: ${this.modules.size} modules chargés`, {
        meta: { version: this.manifest.version },
      });
    } catch (error) {
      this.errors.push(`Erreur chargement manifest: ${error.message}`);
      logger.error('ModuleResolver load error', {
        meta: { error: error.message },
      });
      throw error;
    }
  }

  /**
   * Résoudre l'ordre d'initialisation des modules
   * Retourne l'ordre topologique des modules
   */
  resolveInitializationOrder() {
    this.resolvedOrder = [];
    this.dependencyGraph.clear();

    // Construire le graphe de dépendances
    for (const [moduleId, module] of this.modules) {
      this.dependencyGraph.set(moduleId, module.dependencies || []);
    }

    // Vérifier les dépendances manquantes
    for (const [moduleId, dependencies] of this.dependencyGraph) {
      for (const dep of dependencies) {
        if (!this.modules.has(dep)) {
          this.errors.push(
            `Module "${moduleId}" dépend de "${dep}" qui n'existe pas`
          );
        }
      }
    }

    if (this.errors.length > 0) {
      throw new Error('Dépendances manquantes détectées');
    }

    // Détecter les cycles
    this._detectCycles();

    if (this.cycleDetected) {
      throw new Error('Cycles de dépendances détectés');
    }

    // Résoudre l'ordre topologique (tri topologique)
    this._topologicalSort();

    return this.resolvedOrder;
  }

  /**
   * Détecter les cycles de dépendances (DFS)
   */
  _detectCycles() {
    const visited = new Set();
    const recursionStack = new Set();

    for (const moduleId of this.modules.keys()) {
      if (!visited.has(moduleId)) {
        this._dfs(moduleId, visited, recursionStack);
      }
    }
  }

  /**
   * DFS pour détection de cycles
   */
  _dfs(nodeId, visited, recursionStack) {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const dependencies = this.dependencyGraph.get(nodeId) || [];

    for (const depId of dependencies) {
      if (!visited.has(depId)) {
        this._dfs(depId, visited, recursionStack);
      } else if (recursionStack.has(depId)) {
        this.cycleDetected = true;
        this.errors.push(`Cycle détecté: ${nodeId} → ${depId}`);
      }
    }

    recursionStack.delete(nodeId);
  }

  /**
   * Tri topologique (ordre d'initialisation déterministe)
   */
  _topologicalSort() {
    const inDegree = new Map();
    const adjList = new Map();

    // Initialiser
    for (const moduleId of this.modules.keys()) {
      inDegree.set(moduleId, 0);
      adjList.set(moduleId, []);
    }

    // Construire le graphe inverse
    for (const [moduleId, dependencies] of this.dependencyGraph) {
      for (const dep of dependencies) {
        const deps = adjList.get(dep) || [];
        deps.push(moduleId);
        adjList.set(dep, deps);
        inDegree.set(moduleId, (inDegree.get(moduleId) || 0) + 1);
      }
    }

    // Queue de Kahn
    const queue = [];
    for (const [moduleId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(moduleId);
      }
    }

    // Trier la queue initiale pour déterminisme
    queue.sort();

    this.resolvedOrder = [];

    while (queue.length > 0) {
      // Prendre le premier élément (pour déterminisme)
      const moduleId = queue.shift();
      this.resolvedOrder.push(moduleId);

      // Traiter les dépendants
      const dependents = adjList.get(moduleId) || [];
      const newQueue = [];

      for (const dependent of dependents) {
        inDegree.set(dependent, (inDegree.get(dependent) || 0) - 1);

        if (inDegree.get(dependent) === 0) {
          newQueue.push(dependent);
        }
      }

      // Ajouter les nouveaux éléments à zéro en-degré, triés
      newQueue.sort();
      queue.push(...newQueue);
    }

    // Vérifier que tous les modules sont inclus
    if (this.resolvedOrder.length !== this.modules.size) {
      throw new Error(
        `Tri topologique échoué: ${this.resolvedOrder.length}/${this.modules.size} modules`
      );
    }
  }

  /**
   * Obtenir l'ordre d'initialisation
   */
  getInitializationOrder() {
    if (this.resolvedOrder.length === 0) {
      this.resolveInitializationOrder();
    }
    return this.resolvedOrder;
  }

  /**
   * Obtenir un module
   */
  getModule(moduleId) {
    return this.modules.get(moduleId);
  }

  /**
   * Obtenir tous les modules
   */
  getAllModules() {
    return Array.from(this.modules.values());
  }

  /**
   * Valider que toutes les dépendances d'un module sont initialisées
   */
  validateDependencies(moduleId, initializedModules) {
    const module = this.modules.get(moduleId);
    if (!module) {
      return { valid: false, reason: `Module ${moduleId} non trouvé` };
    }

    const dependencies = module.dependencies || [];

    for (const dep of dependencies) {
      if (!initializedModules.has(dep)) {
        return {
          valid: false,
          reason: `Dépendance ${dep} non initialisée pour ${moduleId}`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Générer une registry complète documentée
   */
  generateRegistry() {
    const registry = {
      version: this.manifest.version,
      generated_at: new Date().toISOString(),
      total_modules: this.modules.size,
      initialization_order: this.getInitializationOrder(),
      modules_by_hierarchy: this._groupByHierarchy(),
      modules_by_level: this._groupByLevel(),
      dependency_graph: this._generateDependencyGraph(),
      services_registry: this._generateServicesRegistry(),
      events_registry: this._generateEventsRegistry(),
      validation: {
        cycles_detected: this.cycleDetected,
        all_dependencies_resolvable: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
      },
    };

    return registry;
  }

  /**
   * Grouper les modules par hiérarchie
   */
  _groupByHierarchy() {
    const grouped = {};

    for (const module of this.modules.values()) {
      const level = module.hierarchy_level || 0;
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push({
        id: module.id,
        displayName: module.displayName,
        dependencies: module.dependencies || [],
      });
    }

    return grouped;
  }

  /**
   * Grouper les modules par niveau (level_X_Y)
   */
  _groupByLevel() {
    const grouped = {};

    for (const [name, level] of Object.entries(this.manifest.hierarchy || {})) {
      grouped[name] = {
        description: level.description,
        count: level.count,
        modules: level.modules
          .map((id) => this.modules.get(id))
          .filter(Boolean)
          .map((m) => ({
            id: m.id,
            displayName: m.displayName,
            dependencies: m.dependencies || [],
          })),
      };
    }

    return grouped;
  }

  /**
   * Générer le graphe de dépendances
   */
  _generateDependencyGraph() {
    const graph = {};

    for (const [moduleId, module] of this.modules) {
      graph[moduleId] = {
        dependencies: module.dependencies || [],
        dependents: this._findDependents(moduleId),
      };
    }

    return graph;
  }

  /**
   * Trouver tous les modules qui dépendent d'un module donné
   */
  _findDependents(moduleId) {
    const dependents = [];

    for (const [id, module] of this.modules) {
      if ((module.dependencies || []).includes(moduleId)) {
        dependents.push(id);
      }
    }

    return dependents;
  }

  /**
   * Générer la registry des services
   */
  _generateServicesRegistry() {
    const registry = {
      required_services: new Set(),
      exposed_services: {},
    };

    for (const module of this.modules.values()) {
      const requiredServices = module.requiredServices || [];
      const exposedServices = module.exposedServices || [];

      for (const svc of requiredServices) {
        registry.required_services.add(svc);
      }

      registry.exposed_services[module.id] = exposedServices;
    }

    return {
      core_services: Array.from(registry.required_services),
      module_services: registry.exposed_services,
    };
  }

  /**
   * Générer la registry des événements
   */
  _generateEventsRegistry() {
    const registry = {
      emitted_events: {},
      listened_events: {},
    };

    for (const module of this.modules.values()) {
      const emitted = module.eventsEmitted || [];
      const listened = module.eventsListened || [];

      registry.emitted_events[module.id] = emitted;
      registry.listened_events[module.id] = listened;
    }

    return registry;
  }

  /**
   * Valider la résolution complète
   */
  validate() {
    try {
      this.resolveInitializationOrder();

      if (this.errors.length > 0) {
        return {
          valid: false,
          errors: this.errors,
          warnings: this.warnings,
        };
      }

      return {
        valid: true,
        modules_count: this.modules.size,
        initialization_order: this.resolvedOrder,
        errors: [],
        warnings: this.warnings,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message, ...this.errors],
        warnings: this.warnings,
      };
    }
  }
}

module.exports = ModuleResolver;
