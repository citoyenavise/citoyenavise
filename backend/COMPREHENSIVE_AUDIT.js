#!/usr/bin/env node

/**
 * COMPREHENSIVE_AUDIT.js
 * Audit approfondi de tous les composants Blueprint Phase 1 + Phase 2
 * Identifie et rapporte TOUTES les incohérences
 */

const fs = require('fs');
const path = require('path');

class ComprehensiveAudit {
  constructor() {
    this.basePath = __dirname;
    this.issues = {
      critical: [],
      major: [],
      minor: [],
      warnings: []
    };
    this.stats = {};
    this.fileContents = {};
  }

  // =======================
  // PHASE 1 - CORE FILES
  // =======================

  auditCoreOrchestrator() {
    console.log('\n🔍 Audit Core Orchestrator...\n');

    const files = [
      'src/core/orchestrator/Orchestrator.js',
      'src/core/orchestrator/OrchestratorContext.js',
      'src/core/orchestrator/OrchestratorEvents.js',
      'src/core/orchestrator/index.js'
    ];

    for (const file of files) {
      const fullPath = path.join(this.basePath, file);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        this.fileContents[file] = content;

        // Vérifier la présence de classe
        if (file.includes('Orchestrator.js') && !file.includes('Events')) {
          if (!content.includes('class Orchestrator')) {
            this.issues.critical.push(`❌ ${file}: Classe Orchestrator manquante`);
          }
          if (!content.includes('initialize') || !content.includes('async initialize')) {
            this.issues.critical.push(`❌ ${file}: Méthode initialize manquante`);
          }
          if (!content.includes('registerModule') || !content.includes('registerModule(')) {
            this.issues.critical.push(`❌ ${file}: Méthode registerModule manquante`);
          }
          if (!content.includes('async transition') || !content.includes('transition(')) {
            this.issues.critical.push(`❌ ${file}: Méthode transition manquante`);
          }
          if (!content.includes('validateInvariants')) {
            this.issues.critical.push(`❌ ${file}: Méthode validateInvariants manquante`);
          }
        }

        if (file.includes('OrchestratorContext')) {
          if (!content.includes('class OrchestratorContext')) {
            this.issues.critical.push(`❌ ${file}: Classe OrchestratorContext manquante`);
          }
          if (!content.includes('set(') && !content.includes('set ')) {
            this.issues.critical.push(`❌ ${file}: Méthode set manquante`);
          }
          if (!content.includes('get(') && !content.includes('get ')) {
            this.issues.critical.push(`❌ ${file}: Méthode get manquante`);
          }
          if (!content.includes('updateSession')) {
            this.issues.critical.push(`❌ ${file}: Méthode updateSession manquante`);
          }
        }

        console.log(`✅ ${file} - Vérifié`);
      } catch (error) {
        this.issues.critical.push(`❌ ${file}: Fichier non trouvé ou illisible`);
      }
    }
  }

  auditStateMachine() {
    console.log('\n🔍 Audit State Machine...\n');

    const files = [
      'src/core/state-machine/StateMachine.js',
      'src/core/state-machine/State.js',
      'src/core/state-machine/Transition.js',
      'src/core/state-machine/Guard.js',
      'src/core/state-machine/SideEffect.js'
    ];

    for (const file of files) {
      const fullPath = path.join(this.basePath, file);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        this.fileContents[file] = content;

        if (file.includes('StateMachine.js')) {
          if (!content.includes('class StateMachine')) {
            this.issues.critical.push(`❌ ${file}: Classe StateMachine manquante`);
          }
          if (!content.includes('registerState')) {
            this.issues.critical.push(`❌ ${file}: Méthode registerState manquante`);
          }
          if (!content.includes('registerTransition')) {
            this.issues.critical.push(`❌ ${file}: Méthode registerTransition manquante`);
          }
          if (!content.includes('handleEvent')) {
            this.issues.critical.push(`❌ ${file}: Méthode handleEvent manquante`);
          }
        }

        console.log(`✅ ${file} - Vérifié`);
      } catch (error) {
        this.issues.critical.push(`❌ ${file}: Fichier non trouvé`);
      }
    }
  }

  auditEvents() {
    console.log('\n🔍 Audit Events System...\n');

    const files = [
      'src/core/events/EventTypes.js',
      'src/core/events/EventValidator.js',
      'src/core/events/EventSchema.js'
    ];

    for (const file of files) {
      const fullPath = path.join(this.basePath, file);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        this.fileContents[file] = content;

        if (file.includes('EventTypes.js')) {
          // Vérifier les 24 événements attendus
          const expectedEvents = [
            'auth:attempt', 'auth:success', 'auth:failure', 'auth:logout', 'auth:token_expired',
            'user:created', 'user:updated', 'user:deleted', 'user:loaded', 'user:error',
            'post:created', 'post:updated', 'post:deleted', 'post:liked', 'post:commented',
            'notification:created', 'notification:sent', 'notification:delivered', 'notification:read', 'notification:failed',
            'analytics:event_tracked', 'analytics:aggregated', 'analytics:report_generated', 'analytics:error'
          ];

          let missingEvents = [];
          for (const event of expectedEvents) {
            if (!content.includes(event)) {
              missingEvents.push(event);
            }
          }

          if (missingEvents.length > 0) {
            this.issues.critical.push(`❌ ${file}: ${missingEvents.length} événements manquants: ${missingEvents.join(', ')}`);
          }
        }

        console.log(`✅ ${file} - Vérifié`);
      } catch (error) {
        this.issues.critical.push(`❌ ${file}: Fichier non trouvé`);
      }
    }
  }

  auditLogging() {
    console.log('\n🔍 Audit Logging...\n');

    const file = 'src/core/logging/Logger.js';
    const fullPath = path.join(this.basePath, file);

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      this.fileContents[file] = content;

      if (!content.includes('class Logger')) {
        this.issues.critical.push(`❌ ${file}: Classe Logger manquante`);
      }
      if (!content.includes('debug(')) {
        this.issues.critical.push(`❌ ${file}: Méthode debug manquante`);
      }
      if (!content.includes('info(')) {
        this.issues.critical.push(`❌ ${file}: Méthode info manquante`);
      }
      if (!content.includes('warning(')) {
        this.issues.critical.push(`❌ ${file}: Méthode warning manquante`);
      }
      if (!content.includes('error(')) {
        this.issues.critical.push(`❌ ${file}: Méthode error manquante`);
      }

      console.log(`✅ ${file} - Vérifié`);
    } catch (error) {
      this.issues.critical.push(`❌ ${file}: Fichier non trouvé`);
    }
  }

  auditInvariants() {
    console.log('\n🔍 Audit Invariants...\n');

    const file = 'src/core/invariants/Invariant.js';
    const fullPath = path.join(this.basePath, file);

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      this.fileContents[file] = content;

      if (!content.includes('class Invariant')) {
        this.issues.critical.push(`❌ ${file}: Classe Invariant manquante`);
      }
      if (!content.includes('verify(')) {
        this.issues.critical.push(`❌ ${file}: Méthode verify manquante`);
      }

      console.log(`✅ ${file} - Vérifié`);
    } catch (error) {
      this.issues.critical.push(`❌ ${file}: Fichier non trouvé`);
    }
  }

  auditConventions() {
    console.log('\n🔍 Audit Conventions...\n');

    const file = 'src/core/conventions/Conventions.js';
    const fullPath = path.join(this.basePath, file);

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      this.fileContents[file] = content;

      // Accepte soit une classe soit un objet singleton
      if (!content.includes('class Conventions') && !content.includes('const Conventions') && !content.includes('module.exports')) {
        this.issues.critical.push(`❌ ${file}: Conventions n'est pas défini`);
      }

      // Vérifier que les propriétés et méthodes existent
      if (!content.includes('NAMING') || !content.includes('EVENTS') || !content.includes('MODULES')) {
        this.issues.critical.push(`❌ ${file}: Propriétés de conventions manquantes`);
      }

      if (!content.includes('validateName') && !content.includes('validateVersion')) {
        this.issues.critical.push(`❌ ${file}: Méthodes de validation manquantes`);
      }

      console.log(`✅ ${file} - Vérifié`);
    } catch (error) {
      this.issues.critical.push(`❌ ${file}: Fichier non trouvé`);
    }
  }

  auditVersioning() {
    console.log('\n🔍 Audit Versioning...\n');

    const file = 'src/core/versioning/VersionManager.js';
    const fullPath = path.join(this.basePath, file);

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      this.fileContents[file] = content;

      if (!content.includes('class VersionManager')) {
        this.issues.critical.push(`❌ ${file}: Classe VersionManager manquante`);
      }
      if (!content.includes('registerModuleVersion')) {
        this.issues.critical.push(`❌ ${file}: Méthode registerModuleVersion manquante`);
      }

      console.log(`✅ ${file} - Vérifié`);
    } catch (error) {
      this.issues.critical.push(`❌ ${file}: Fichier non trouvé`);
    }
  }

  auditCoreIndex() {
    console.log('\n🔍 Audit Core Index...\n');

    const file = 'src/core/index.js';
    const fullPath = path.join(this.basePath, file);

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      this.fileContents[file] = content;

      const requiredExports = [
        'Orchestrator', 'StateMachine', 'EventTypes', 'Logger',
        'Invariant', 'Conventions', 'VersionManager', 'OrchestratorContext'
      ];

      let missing = [];
      for (const exp of requiredExports) {
        if (!content.includes(exp)) {
          missing.push(exp);
        }
      }

      if (missing.length > 0) {
        this.issues.critical.push(`❌ ${file}: Exports manquants: ${missing.join(', ')}`);
      }

      if (!content.includes('module.exports')) {
        this.issues.critical.push(`❌ ${file}: module.exports manquant`);
      }

      console.log(`✅ ${file} - Vérifié`);
    } catch (error) {
      this.issues.critical.push(`❌ ${file}: Fichier non trouvé`);
    }
  }

  auditBootstrap() {
    console.log('\n🔍 Audit Bootstrap...\n');

    const file = 'src/bootstrap.js';
    const fullPath = path.join(this.basePath, file);

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      this.fileContents[file] = content;

      if (!content.includes('class SystemBootstrap')) {
        this.issues.critical.push(`❌ ${file}: Classe SystemBootstrap manquante`);
      }
      if (!content.includes('initialize()')) {
        this.issues.critical.push(`❌ ${file}: Méthode initialize manquante`);
      }
      if (!content.includes('ManifestLoader')) {
        this.issues.critical.push(`❌ ${file}: ManifestLoader non chargé`);
      }

      console.log(`✅ ${file} - Vérifié`);
    } catch (error) {
      this.issues.critical.push(`❌ ${file}: Fichier non trouvé`);
    }
  }

  // =======================
  // PHASE 2 - MANIFESTS
  // =======================

  auditManifests() {
    console.log('\n🔍 Audit Manifests JSON...\n');

    const manifestFiles = [
      'src/config/manifests/manifest.modules.json',
      'src/config/manifests/manifest.states.json',
      'src/config/manifests/manifest.phases.json',
      'src/config/manifests/manifest.guards.json',
      'src/config/manifests/manifest.side-effects.json'
    ];

    const manifests = {};

    for (const file of manifestFiles) {
      const fullPath = path.join(this.basePath, file);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        this.fileContents[file] = content;

        try {
          const parsed = JSON.parse(content);
          manifests[file] = parsed;
          console.log(`✅ ${file} - JSON valide`);
        } catch (jsonError) {
          this.issues.critical.push(`❌ ${file}: JSON invalide - ${jsonError.message}`);
        }
      } catch (error) {
        this.issues.critical.push(`❌ ${file}: Fichier non trouvé ou illisible`);
      }
    }

    return manifests;
  }

  auditManifestModules(manifests) {
    console.log('\n🔍 Validation Manifest Modules...\n');

    const modulesManifest = manifests['src/config/manifests/manifest.modules.json'];
    if (!modulesManifest || !modulesManifest.modules) {
      this.issues.critical.push('❌ manifest.modules.json: Clé "modules" manquante');
      return;
    }

    const expectedModules = ['auth', 'users', 'posts', 'notifications', 'analytics'];
    const foundModules = modulesManifest.modules.map(m => m.id);

    for (const expected of expectedModules) {
      if (!foundModules.includes(expected)) {
        this.issues.critical.push(`❌ Module "${expected}" non trouvé dans manifest.modules.json`);
      }
    }

    // Vérifier chaque module
    for (const module of modulesManifest.modules || []) {
      if (!module.id) {
        this.issues.critical.push(`❌ Module sans ID trouvé`);
      }
      if (!module.version) {
        this.issues.critical.push(`❌ Module ${module.id}: version manquante`);
      }
      if (!module.contract) {
        this.issues.critical.push(`❌ Module ${module.id}: contract manquant`);
      }
      if (!module.states || module.states.length === 0) {
        this.issues.critical.push(`❌ Module ${module.id}: states manquants ou vides`);
      }
      if (!module.events || module.events.length === 0) {
        this.issues.critical.push(`❌ Module ${module.id}: events manquants ou vides`);
      }
    }

    console.log(`✅ manifest.modules.json - Validation complète`);
  }

  auditManifestStates(manifests) {
    console.log('\n🔍 Validation Manifest States...\n');

    const statesManifest = manifests['src/config/manifests/manifest.states.json'];
    const modulesManifest = manifests['src/config/manifests/manifest.modules.json'];

    if (!statesManifest || !statesManifest.states) {
      this.issues.critical.push('❌ manifest.states.json: Clé "states" manquante');
      return;
    }

    // Collecter tous les états déclarés dans modules
    const declaredStates = new Set();
    for (const module of modulesManifest.modules || []) {
      (module.states || []).forEach(state => declaredStates.add(state));
    }

    // Vérifier que tous les états déclarés sont définis
    for (const state of declaredStates) {
      if (!statesManifest.states[state]) {
        this.issues.critical.push(`❌ État "${state}" déclaré dans modules mais non défini dans states manifest`);
      }
    }

    // Vérifier les transitions
    if (!statesManifest.transitions || statesManifest.transitions.length === 0) {
      this.issues.critical.push('❌ manifest.states.json: transitions manquantes ou vides');
      return;
    }

    for (const transition of statesManifest.transitions) {
      if (!transition.fromState) {
        this.issues.critical.push(`❌ Transition sans fromState`);
      }
      if (!transition.toState) {
        this.issues.critical.push(`❌ Transition sans toState`);
      }
      if (!transition.event) {
        this.issues.critical.push(`❌ Transition sans event`);
      }

      if (transition.fromState && !statesManifest.states[transition.fromState]) {
        this.issues.major.push(`⚠️  Transition: fromState "${transition.fromState}" n'existe pas`);
      }
      if (transition.toState && !statesManifest.states[transition.toState]) {
        this.issues.major.push(`⚠️  Transition: toState "${transition.toState}" n'existe pas`);
      }
    }

    console.log(`✅ manifest.states.json - ${Object.keys(statesManifest.states).length} états, ${statesManifest.transitions.length} transitions`);
  }

  auditManifestGuards(manifests) {
    console.log('\n🔍 Validation Manifest Guards...\n');

    const guardsManifest = manifests['src/config/manifests/manifest.guards.json'];
    const statesManifest = manifests['src/config/manifests/manifest.states.json'];

    if (!guardsManifest || !guardsManifest.guards) {
      this.issues.critical.push('❌ manifest.guards.json: Clé "guards" manquante');
      return;
    }

    // Collecter les gardes déclarés
    const declaredGuards = new Set();
    for (const transition of statesManifest.transitions || []) {
      (transition.guards || []).forEach(guard => declaredGuards.add(guard));
    }

    // Vérifier que tous sont définis
    const definedGuardIds = guardsManifest.guards.map(g => g.id);
    for (const guard of declaredGuards) {
      if (!definedGuardIds.includes(guard)) {
        this.issues.critical.push(`❌ Garde "${guard}" déclaré mais non défini dans manifest.guards.json`);
      }
    }

    console.log(`✅ manifest.guards.json - ${guardsManifest.guards.length} gardes définis`);
  }

  auditManifestSideEffects(manifests) {
    console.log('\n🔍 Validation Manifest Side-Effects...\n');

    const sideEffectsManifest = manifests['src/config/manifests/manifest.side-effects.json'];
    const statesManifest = manifests['src/config/manifests/manifest.states.json'];

    if (!sideEffectsManifest || !sideEffectsManifest.sideEffects) {
      this.issues.critical.push('❌ manifest.side-effects.json: Clé "sideEffects" manquante');
      return;
    }

    // Collecter les side-effects déclarés
    const declaredSideEffects = new Set();
    for (const transition of statesManifest.transitions || []) {
      (transition.sideEffects || []).forEach(se => declaredSideEffects.add(se));
    }

    // Vérifier que tous sont définis
    const definedSideEffectIds = sideEffectsManifest.sideEffects.map(se => se.id);
    for (const sideEffect of declaredSideEffects) {
      if (!definedSideEffectIds.includes(sideEffect)) {
        this.issues.critical.push(`❌ Side-effect "${sideEffect}" déclaré mais non défini dans manifest.side-effects.json`);
      }
    }

    console.log(`✅ manifest.side-effects.json - ${sideEffectsManifest.sideEffects.length} side-effects définis`);
  }

  auditManifestLoader() {
    console.log('\n🔍 Validation Manifest Loader...\n');

    const file = 'src/config/manifests/index.js';
    const fullPath = path.join(this.basePath, file);

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      this.fileContents[file] = content;

      if (!content.includes('class ManifestLoader')) {
        this.issues.critical.push(`❌ ${file}: Classe ManifestLoader manquante`);
      }

      const requiredMethods = [
        'loadAll',
        'getModules',
        'getStates',
        'getTransitions',
        'getGuards',
        'getSideEffects',
        'validate'
      ];

      for (const method of requiredMethods) {
        if (!content.includes(method)) {
          this.issues.critical.push(`❌ ${file}: Méthode ${method} manquante`);
        }
      }

      console.log(`✅ ${file} - Vérifié`);
    } catch (error) {
      this.issues.critical.push(`❌ ${file}: Fichier non trouvé`);
    }
  }

  printReport() {
    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          RAPPORT D\'AUDIT COMPLET                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Résumé
    console.log('📊 RÉSUMÉ DES PROBLÈMES');
    console.log('═════════════════════════════════════════════════════════════');
    console.log(`  🔴 CRITIQUES:  ${this.issues.critical.length}`);
    console.log(`  🟠 MAJEURS:    ${this.issues.major.length}`);
    console.log(`  🟡 MINEURS:    ${this.issues.minor.length}`);
    console.log(`  🔵 AVERTISSEMENTS: ${this.issues.warnings.length}`);

    // Détails
    if (this.issues.critical.length > 0) {
      console.log('\n🔴 ERREURS CRITIQUES');
      console.log('═════════════════════════════════════════════════════════════');
      this.issues.critical.forEach(issue => console.log(`  ${issue}`));
    }

    if (this.issues.major.length > 0) {
      console.log('\n🟠 PROBLÈMES MAJEURS');
      console.log('═════════════════════════════════════════════════════════════');
      this.issues.major.forEach(issue => console.log(`  ${issue}`));
    }

    if (this.issues.minor.length > 0) {
      console.log('\n🟡 PROBLÈMES MINEURS');
      console.log('═════════════════════════════════════════════════════════════');
      this.issues.minor.forEach(issue => console.log(`  ${issue}`));
    }

    if (this.issues.warnings.length > 0) {
      console.log('\n🔵 AVERTISSEMENTS');
      console.log('═════════════════════════════════════════════════════════════');
      this.issues.warnings.forEach(issue => console.log(`  ${issue}`));
    }

    // Conclusion
    const totalIssues = this.issues.critical.length + this.issues.major.length;
    const status = totalIssues === 0 ? '✅ AUDIT RÉUSSI' : '❌ PROBLÈMES DÉTECTÉS';

    console.log(`\n${status}`);
    console.log('═════════════════════════════════════════════════════════════\n');

    return totalIssues === 0;
  }

  async run() {
    try {
      console.log('\n🔍 DÉMARRAGE DE L\'AUDIT COMPLET\n');

      // Phase 1 audits
      this.auditCoreOrchestrator();
      this.auditStateMachine();
      this.auditEvents();
      this.auditLogging();
      this.auditInvariants();
      this.auditConventions();
      this.auditVersioning();
      this.auditCoreIndex();
      this.auditBootstrap();

      // Phase 2 audits
      const manifests = this.auditManifests();
      this.auditManifestModules(manifests);
      this.auditManifestStates(manifests);
      this.auditManifestGuards(manifests);
      this.auditManifestSideEffects(manifests);
      this.auditManifestLoader();

      return this.printReport();
    } catch (error) {
      console.error('Erreur lors de l\'audit:', error);
      return false;
    }
  }
}

// Exécuter
const audit = new ComprehensiveAudit();
audit.run().then(isClean => {
  process.exit(isClean ? 0 : 1);
});

module.exports = ComprehensiveAudit;
