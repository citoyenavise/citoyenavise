// Événements standardisés de l'orchestrateur

const OrchestratorEvents = {
  // Cycle de vie de l'orchestrateur
  'orchestrator:initialized': 'Orchestrateur initialisé',
  'orchestrator:shutdown': 'Orchestrateur arrêté',
  'orchestrator:error': 'Erreur au niveau orchestrateur',
  'orchestrator:transition': 'Transition d\'état effectuée',

  // Événements de modules
  'module:registered': 'Module enregistré',
  'module:loaded': 'Module chargé',
  'module:error': 'Erreur dans un module',
  'module:transition': 'Transition de module',

  // Événements de contexte
  'context:updated': 'Contexte mis à jour',
  'context:validated': 'Contexte validé',
  'context:invalid': 'Contexte invalide',

  // Événements de machine à états
  'state:entered': 'État entré',
  'state:exited': 'État quitté',
  'state:transition': 'Transition d\'état',
  'state:guard-failed': 'Garde d\'état échouée',

  // Événements de validation
  'invariant:violated': 'Invariant violé',
  'invariant:validated': 'Invariant validé',

  // Événements de middleware
  'middleware:executed': 'Middleware exécuté',
  'middleware:error': 'Erreur de middleware',

  // Événements de versioning
  'version:checked': 'Version vérifiée',
  'version:incompatible': 'Version incompatible',

  // Événements de logging
  'log:debug': 'Log de débogage',
  'log:info': 'Log d\'information',
  'log:warning': 'Log d\'avertissement',
  'log:error': 'Log d\'erreur',
};

module.exports = OrchestratorEvents;
