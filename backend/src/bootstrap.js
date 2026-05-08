// Bootstrap du Système - Initialisation Orchestrateur + Manifests

const {
  Orchestrator,
  StateMachine,
  EventValidator,
  Logger,
  Invariant,
  Conventions,
  VersionManager,
  OrchestratorContext,
} = require('./core');

const ManifestLoader = require('./config/manifests');

class SystemBootstrap {
  constructor(config = {}) {
    this.config = config;
    this.logger = new Logger('SystemBootstrap');
    this.orchestrator = null;
    this.manifestLoader = null;
    this.versionManager = null;
    this.isInitialized = false;
  }

  // Initialiser le système complet
  async initialize() {
    this.logger.info('Amorçage du système Blueprint Phase 1');

    try {
      // 1. Initialiser le gestionnaire de versions
      this.logger.info('Initialisation du gestionnaire de versions');
      this.versionManager = new VersionManager({
        systemVersion: '1.0.0',
      });
      this.versionManager.initialize();

      // 2. Charger les manifests
      this.logger.info('Chargement des manifests');
      this.manifestLoader = new ManifestLoader();

      // Valider la cohérence des manifests
      const manifestValidation = this.manifestLoader.validateAll();
      if (!manifestValidation.overallValid) {
        throw new Error('Manifests non cohérents');
      }
      this.logger.info('Manifests validés');

      // 3. Initialiser l'orchestrateur
      this.logger.info('Initialisation de l\'orchestrateur');
      this.orchestrator = new Orchestrator({
        stateMachineConfig: {
          initialState: 'IDLE',
        },
      });

      // Initialiser le contexte
      const context = new OrchestratorContext({
        sessionId: this.config.sessionId || null,
        userId: this.config.userId || null,
        systemVersion: '1.0.0',
      });

      // Initialiser l'orchestrateur
      await this.orchestrator.initialize(context.getAll());
      this.logger.info('Orchestrateur initialisé');

      // 4. Enregistrer les modules
      this.logger.info('Enregistrement des modules');
      const modules = this.manifestLoader.getModules();
      for (const module of modules) {
        // Enregistrer la version du module
        this.versionManager.registerModuleVersion(module.id, module.version);

        // Enregistrer le module dans l'orchestrateur
        this.orchestrator.registerModule(module.id, {
          id: module.id,
          version: module.version,
          displayName: module.displayName,
          manifest: module,
        });

        this.logger.debug(`Module enregistré: ${module.id}@${module.version}`);
      }

      // 5. Ajouter les invariants système
      this.logger.info('Configuration des invariants');
      this.addSystemInvariants();

      // 6. Valider l'état global
      this.logger.info('Validation de l\'état global');
      const invariantValidation = this.orchestrator.validateInvariants();
      if (!invariantValidation.valid) {
        this.logger.warning('Invariants violés au démarrage', invariantValidation.violations);
      }

      this.isInitialized = true;
      this.logger.info('✅ Système complètement initialisé');

      return {
        success: true,
        systemVersion: '1.0.0',
        modulesCount: modules.length,
        statesCount: Object.keys(this.manifestLoader.getStates()).length,
        invariantsCount: this.orchestrator.invariants.length,
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'amorçage du système', error);
      throw error;
    }
  }

  // Ajouter les invariants système
  addSystemInvariants() {
    // Invariant: Au moins un module enregistré
    this.orchestrator.addInvariant(
      new Invariant(
        'min_modules_registered',
        (ctx) => this.orchestrator.modules.size > 0,
        {
          message: 'Au moins un module doit être enregistré',
          severity: 'critical',
        }
      )
    );

    // Invariant: État valide
    this.orchestrator.addInvariant(
      new Invariant(
        'valid_current_state',
        (ctx) => this.orchestrator.stateMachine?.currentState !== null,
        {
          message: 'La machine à états doit avoir un état courant',
          severity: 'critical',
        }
      )
    );

    // Invariant: Contexte non gelé
    this.orchestrator.addInvariant(
      new Invariant(
        'context_not_frozen',
        (ctx) => !ctx?.frozen,
        {
          message: 'Le contexte ne doit pas être gelé au démarrage',
          severity: 'warning',
        }
      )
    );
  }

  // Obtenir l'orchestrateur
  getOrchestrator() {
    if (!this.isInitialized) {
      throw new Error('Système non initialisé - appelez initialize() d\'abord');
    }
    return this.orchestrator;
  }

  // Obtenir le loader de manifests
  getManifestLoader() {
    if (!this.isInitialized) {
      throw new Error('Système non initialisé - appelez initialize() d\'abord');
    }
    return this.manifestLoader;
  }

  // Obtenir le gestionnaire de versions
  getVersionManager() {
    if (!this.isInitialized) {
      throw new Error('Système non initialisé - appelez initialize() d\'abord');
    }
    return this.versionManager;
  }

  // Afficher le statut du système
  printStatus() {
    if (!this.isInitialized) {
      console.log('❌ Système non initialisé');
      return;
    }

    console.log('\n═══════════════════════════════════════');
    console.log('📊 STATUT DU SYSTÈME');
    console.log('═══════════════════════════════════════');

    console.log(`\n✅ État: Initialisé`);
    console.log(`\n📦 Modules (${this.orchestrator.modules.size}):`);
    for (const [id, module] of this.orchestrator.modules) {
      console.log(`   - ${id}@${module.version}`);
    }

    console.log(`\n🔄 État Courant: ${this.orchestrator.getCurrentState()}`);

    const states = this.manifestLoader.getStates();
    console.log(`\n📍 États Disponibles (${Object.keys(states).length}):`);
    Object.keys(states).slice(0, 5).forEach((state) => {
      console.log(`   - ${state}`);
    });
    if (Object.keys(states).length > 5) {
      console.log(`   ... et ${Object.keys(states).length - 5} autres`);
    }

    console.log(`\n⚡ Invariants (${this.orchestrator.invariants.length}):`);
    this.orchestrator.invariants.slice(0, 3).forEach((inv) => {
      console.log(`   - ${inv.id}`);
    });

    console.log('\n═══════════════════════════════════════\n');
  }

  // Arrêter le système
  async shutdown() {
    this.logger.info('Arrêt du système');

    if (this.orchestrator) {
      await this.orchestrator.shutdown();
    }

    this.isInitialized = false;
    this.logger.info('Système arrêté');
  }
}

// Exporter la classe
module.exports = SystemBootstrap;

// Fonction helper pour initialiser rapidement
async function initializeSystem(config = {}) {
  const bootstrap = new SystemBootstrap(config);
  await bootstrap.initialize();
  return bootstrap;
}

module.exports.initializeSystem = initializeSystem;
