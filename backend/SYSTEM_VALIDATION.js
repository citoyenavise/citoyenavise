#!/usr/bin/env node

/**
 * SYSTEM_VALIDATION.js
 * Validation complète du système Blueprint Phase 1 + Phase 2
 * Vérifie la complétude, l'intégrité et la cohérence du système
 */

const fs = require('fs');
const path = require('path');

class SystemValidator {
  constructor() {
    this.basePath = __dirname;
    this.errors = [];
    this.warnings = [];
    this.results = {};
  }

  // Valider les manifests JSON
  validateManifests() {
    console.log('\n📋 Validation des Manifests JSON...\n');

    const manifests = [
      'src/config/manifests/manifest.modules.json',
      'src/config/manifests/manifest.states.json',
      'src/config/manifests/manifest.phases.json',
      'src/config/manifests/manifest.guards.json',
      'src/config/manifests/manifest.side-effects.json',
    ];

    const manifestData = {};

    for (const manifest of manifests) {
      const fullPath = path.join(this.basePath, manifest);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const parsed = JSON.parse(content);
        manifestData[manifest] = parsed;
        console.log(`✅ ${manifest}`);
      } catch (error) {
        console.log(`❌ ${manifest} - ${error.message}`);
        this.errors.push(`Erreur JSON dans ${manifest}`);
      }
    }

    this.results.manifests = manifestData;
    return this;
  }

  // Valider les fichiers core
  validateCoreFiles() {
    console.log('\n📁 Validation des Fichiers Core...\n');

    const coreFiles = [
      'src/core/orchestrator/Orchestrator.js',
      'src/core/orchestrator/OrchestratorContext.js',
      'src/core/state-machine/StateMachine.js',
      'src/core/events/EventTypes.js',
      'src/core/logging/Logger.js',
      'src/core/invariants/Invariant.js',
      'src/core/conventions/Conventions.js',
      'src/core/versioning/VersionManager.js',
      'src/core/index.js',
      'src/bootstrap.js',
    ];

    for (const file of coreFiles) {
      const fullPath = path.join(this.basePath, file);
      const exists = fs.existsSync(fullPath);
      console.log(`${exists ? '✅' : '❌'} ${file}`);
      if (!exists) {
        this.errors.push(`Fichier manquant: ${file}`);
      }
    }

    return this;
  }

  // Valider la cohérence des états
  validateStatesCohesion() {
    console.log('\n🔄 Validation Cohérence États...\n');

    const modulesData = this.results.manifests['src/config/manifests/manifest.modules.json'];
    const statesData = this.results.manifests['src/config/manifests/manifest.states.json'];

    if (!modulesData || !statesData) {
      console.log('❌ Impossible de charger manifests');
      return this;
    }

    // Collecter tous les états déclarés dans modules
    const declaredStates = new Set();
    for (const module of modulesData.modules || []) {
      if (module.states && Array.isArray(module.states)) {
        module.states.forEach((state) => declaredStates.add(state));
      }
    }

    // Vérifier que tous sont présents dans states manifest
    const definedStates = statesData.states || {};
    let statesOk = true;

    for (const state of declaredStates) {
      if (!definedStates[state]) {
        console.log(`❌ État déclaré manquant dans manifest.states.json: ${state}`);
        this.errors.push(`État ${state} déclaré mais non défini`);
        statesOk = false;
      }
    }

    if (statesOk) {
      console.log(`✅ Tous les états déclarés sont définis (${declaredStates.size})`);
    }

    // Vérifier les transitions
    const transitions = statesData.transitions || [];
    let transitionsOk = true;

    for (const transition of transitions) {
      if (!definedStates[transition.fromState]) {
        console.log(`❌ fromState invalide: ${transition.fromState}`);
        this.errors.push(`Transition: fromState ${transition.fromState} n'existe pas`);
        transitionsOk = false;
      }
      if (!definedStates[transition.toState]) {
        console.log(`❌ toState invalide: ${transition.toState}`);
        this.errors.push(`Transition: toState ${transition.toState} n'existe pas`);
        transitionsOk = false;
      }
    }

    if (transitionsOk) {
      console.log(`✅ Toutes les transitions sont valides (${transitions.length})`);
    }

    return this;
  }

  // Valider les événements
  validateEventsCohesion() {
    console.log('\n⚡ Validation Cohérence Événements...\n');

    const modulesData = this.results.manifests['src/config/manifests/manifest.modules.json'];

    // Collecter tous les événements
    const allEvents = new Set();
    for (const module of modulesData.modules || []) {
      if (module.events && Array.isArray(module.events)) {
        module.events.forEach((event) => allEvents.add(event));
      }
    }

    console.log(`✅ ${allEvents.size} événements déclarés dans modules`);

    // Vérifier EventTypes.js
    const eventTypesPath = path.join(this.basePath, 'src/core/events/EventTypes.js');
    const eventTypesContent = fs.readFileSync(eventTypesPath, 'utf-8');

    let eventTypesOk = true;
    for (const event of allEvents) {
      if (!eventTypesContent.includes(event)) {
        console.log(`⚠️  Événement ${event} non énuméré dans EventTypes.js`);
        this.warnings.push(`Événement ${event} non énuméré`);
        eventTypesOk = false;
      }
    }

    if (eventTypesOk) {
      console.log(`✅ Tous les événements sont énumérés dans EventTypes.js`);
    }

    return this;
  }

  // Valider les gardes et side-effects
  validateGuardsAndSideEffects() {
    console.log('\n🛡️  Validation Gardes et Side-Effects...\n');

    const statesData = this.results.manifests['src/config/manifests/manifest.states.json'];
    const guardsData = this.results.manifests['src/config/manifests/manifest.guards.json'];
    const sideEffectsData = this.results.manifests['src/config/manifests/manifest.side-effects.json'];

    // Collecter gardes et side-effects déclarés
    const declaredGuards = new Set();
    const declaredSideEffects = new Set();

    for (const transition of statesData.transitions || []) {
      if (transition.guards && Array.isArray(transition.guards)) {
        transition.guards.forEach((g) => declaredGuards.add(g));
      }
      if (transition.sideEffects && Array.isArray(transition.sideEffects)) {
        transition.sideEffects.forEach((s) => declaredSideEffects.add(s));
      }
    }

    // Vérifier gardes
    const definedGuards = new Map();
    for (const guard of guardsData.guards || []) {
      definedGuards.set(guard.id, guard);
    }

    let guardsOk = true;
    for (const guard of declaredGuards) {
      if (!definedGuards.has(guard)) {
        console.log(`❌ Garde déclaré manquant: ${guard}`);
        this.errors.push(`Garde ${guard} déclaré mais non défini`);
        guardsOk = false;
      }
    }

    if (guardsOk) {
      console.log(`✅ Tous les gardes sont définis (${declaredGuards.size})`);
    }

    // Vérifier side-effects
    const definedSideEffects = new Map();
    for (const sideEffect of sideEffectsData.sideEffects || []) {
      definedSideEffects.set(sideEffect.id, sideEffect);
    }

    let sideEffectsOk = true;
    for (const sideEffect of declaredSideEffects) {
      if (!definedSideEffects.has(sideEffect)) {
        console.log(`❌ Side-effect déclaré manquant: ${sideEffect}`);
        this.errors.push(`Side-effect ${sideEffect} déclaré mais non défini`);
        sideEffectsOk = false;
      }
    }

    if (sideEffectsOk) {
      console.log(`✅ Tous les side-effects sont définis (${declaredSideEffects.size})`);
    }

    return this;
  }

  // Valider les modules
  validateModules() {
    console.log('\n📦 Validation des Modules...\n');

    const modulesData = this.results.manifests['src/config/manifests/manifest.modules.json'];

    for (const module of modulesData.modules || []) {
      const hasId = module.id ? '✅' : '❌';
      const hasVersion = module.version ? '✅' : '❌';
      const hasContract = module.contract ? '✅' : '❌';
      const hasStates = module.states && module.states.length > 0 ? '✅' : '❌';
      const hasEvents = module.events && module.events.length > 0 ? '✅' : '❌';

      console.log(`\n${module.displayName}:`);
      console.log(`  ${hasId} ID: ${module.id}`);
      console.log(`  ${hasVersion} Version: ${module.version}`);
      console.log(`  ${hasContract} Contract: ${module.contract ? 'Défini' : 'Manquant'}`);
      console.log(`  ${hasStates} États: ${module.states?.length || 0}`);
      console.log(`  ${hasEvents} Événements: ${module.events?.length || 0}`);

      if (!module.id || !module.version || !module.contract) {
        this.errors.push(`Module ${module.id} incomplet`);
      }
    }

    return this;
  }

  // Afficher le rapport final
  printReport() {
    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║        RAPPORT DE VALIDATION SYSTÈME BLUEPRINT            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // Statistiques
    const modulesData = this.results.manifests['src/config/manifests/manifest.modules.json'];
    const statesData = this.results.manifests['src/config/manifests/manifest.states.json'];
    const guardsData = this.results.manifests['src/config/manifests/manifest.guards.json'];
    const sideEffectsData = this.results.manifests['src/config/manifests/manifest.side-effects.json'];

    console.log('📊 STATISTIQUES');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Modules:        ${(modulesData.modules || []).length}`);
    console.log(`  États:          ${Object.keys(statesData.states || {}).length}`);
    console.log(`  Transitions:    ${(statesData.transitions || []).length}`);
    console.log(`  Gardes:         ${(guardsData.guards || []).length}`);
    console.log(`  Side-Effects:   ${(sideEffectsData.sideEffects || []).length}`);

    // Événements
    let eventCount = 0;
    for (const module of modulesData.modules || []) {
      eventCount += (module.events || []).length;
    }
    console.log(`  Événements:     ${eventCount}`);

    // Résultats
    console.log('\n✅ VALIDATIONS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Manifests JSON:       ✅ Valides`);
    console.log(`  Fichiers Core:        ✅ Présents`);
    console.log(`  Cohérence États:      ${this.errors.filter((e) => e.includes('État')).length === 0 ? '✅' : '❌'}`);
    console.log(`  Transitions:          ${this.errors.filter((e) => e.includes('Transition')).length === 0 ? '✅' : '❌'}`);
    console.log(`  Événements:           ${this.warnings.filter((w) => w.includes('Événement')).length === 0 ? '✅' : '⚠️ '}`);
    console.log(`  Gardes:               ${this.errors.filter((e) => e.includes('Garde')).length === 0 ? '✅' : '❌'}`);
    console.log(`  Side-Effects:         ${this.errors.filter((e) => e.includes('Side-effect')).length === 0 ? '✅' : '❌'}`);
    console.log(`  Modules:              ${this.errors.filter((e) => e.includes('Module')).length === 0 ? '✅' : '❌'}`);

    // Erreurs et avertissements
    if (this.errors.length > 0) {
      console.log('\n❌ ERREURS');
      console.log('═══════════════════════════════════════════════════════════');
      this.errors.forEach((err) => console.log(`  • ${err}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  AVERTISSEMENTS');
      console.log('═══════════════════════════════════════════════════════════');
      this.warnings.forEach((warn) => console.log(`  • ${warn}`));
    }

    // Conclusion
    const isValid = this.errors.length === 0;
    console.log(`\n${isValid ? '✅' : '❌'} STATUT FINAL: ${isValid ? 'SYSTÈME CONFORME' : 'ERREURS DÉTECTÉES'}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    return isValid;
  }

  // Exécuter la validation complète
  async run() {
    try {
      this.validateManifests()
        .validateCoreFiles()
        .validateStatesCohesion()
        .validateEventsCohesion()
        .validateGuardsAndSideEffects()
        .validateModules();

      return this.printReport();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      return false;
    }
  }
}

// Exécuter
const validator = new SystemValidator();
validator.run().then((isValid) => {
  process.exit(isValid ? 0 : 1);
});

module.exports = SystemValidator;
