# Blueprint Phase 1 - Exemples d'Utilisation

---

## 1. Initialisation Simple du Système

### Approche Bootstrap (Recommandée)

```javascript
// Initialiser le système complet
const SystemBootstrap = require('./src/bootstrap');

const system = await SystemBootstrap.initializeSystem({
  userId: 'user123',
  sessionId: 'session-abc-123'
});

// Accéder à l'orchestrateur
const orchestrator = system.getOrchestrator();

// Afficher le statut
system.printStatus();
```

### Approche Manuelle

```javascript
const { Orchestrator } = require('./src/core');
const ManifestLoader = require('./src/config/manifests');

// Créer l'orchestrateur
const orchestrator = new Orchestrator({
  stateMachineConfig: { initialState: 'IDLE' }
});

// Initialiser
await orchestrator.initialize({ userId: 'user123' });

// Charger les modules
const loader = new ManifestLoader();
const modules = loader.getModules();

for (const module of modules) {
  orchestrator.registerModule(module.id, module);
}
```

---

## 2. Travailler avec les Modules

### Récupérer les Modules Déclarés

```javascript
const loader = new ManifestLoader();

// Obtenir tous les modules
const allModules = loader.getModules();

// Obtenir les informations d'un module
const authModule = allModules.find(m => m.id === 'auth');

console.log(authModule);
// {
//   id: 'auth',
//   displayName: 'Module d\'Authentification',
//   version: '1.0.0',
//   contract: { input: [...], output: [...] },
//   states: ['IDLE', 'AUTHENTICATING', 'AUTHENTICATED', ...],
//   events: ['auth:attempt', 'auth:success', ...],
//   dependencies: []
// }
```

### Accéder au Contrat d'un Module

```javascript
const authModule = loader.getModules().find(m => m.id === 'auth');

// Entrées attendues
console.log('Entrées:', authModule.contract.input);
// [{ name: 'credentials', type: 'object', required: true }]

// Sorties fournies
console.log('Sorties:', authModule.contract.output);
// [{ name: 'token', type: 'string' }, { name: 'user', type: 'object' }]
```

### Vérifier les Dépendances

```javascript
const postsModule = loader.getModules().find(m => m.id === 'posts');

console.log('Dépendances de posts:', postsModule.dependencies);
// ['users', 'auth']

// Vérifier que les dépendances existent
const moduleIds = loader.getModules().map(m => m.id);
const missingDeps = postsModule.dependencies.filter(dep => !moduleIds.includes(dep));

console.log('Dépendances manquantes:', missingDeps.length === 0 ? 'AUCUNE' : missingDeps);
```

---

## 3. Travailler avec les États

### Récupérer les États

```javascript
const loader = new ManifestLoader();

// Obtenir tous les états
const states = loader.getStates();

console.log('États disponibles:', Object.keys(states).length);
// États disponibles: 14

// Obtenir un état spécifique
const idleState = states['IDLE'];
console.log(idleState);
// {
//   id: 'IDLE',
//   type: 'normal',
//   displayName: 'Inactif',
//   description: 'État initial',
//   allowedTransitions: ['AUTHENTICATING', 'LOADING', 'CREATING', ...],
//   timeout: null
// }
```

### Obtenir les Transitions

```javascript
const loader = new ManifestLoader();

// Obtenir toutes les transitions
const transitions = loader.getTransitions();

// Filtrer les transitions depuis IDLE
const idleTransitions = transitions.filter(t => t.fromState === 'IDLE');

console.log('Transitions depuis IDLE:');
idleTransitions.forEach(t => {
  console.log(`  ${t.fromState} -[${t.event}]-> ${t.toState}`);
});
// IDLE -[auth:attempt]-> AUTHENTICATING
// IDLE -[user:load]-> LOADING
// ...
```

### Valider une Transition

```javascript
const loader = new ManifestLoader();
const transitions = loader.getTransitions();

function canTransition(fromState, event) {
  const transition = transitions.find(
    t => t.fromState === fromState && t.event === event
  );
  return !!transition;
}

console.log(canTransition('IDLE', 'auth:attempt'));  // true
console.log(canTransition('IDLE', 'invalid:event'));  // false
```

---

## 4. Événements et Validation

### Créer un Événement

```javascript
const { EventValidator } = require('./src/core');

const validator = new EventValidator();

// Créer un événement
const event = validator.createEvent(
  'auth.attempt',
  { username: 'john@example.com', password: '***' },
  'auth_module'
);

console.log(event);
// {
//   eventId: 'evt_1234567890_abc123def',
//   eventType: 'auth.attempt',
//   timestamp: '2026-05-07T18:30:00.000Z',
//   source: 'auth_module',
//   version: '1.0.0',
//   data: { username: '...', password: '***' },
//   metadata: {}
// }
```

### Valider un Événement

```javascript
const { EventValidator } = require('./src/core');

const validator = new EventValidator();

const event = validator.createEvent('test.event', {}, 'test');
const validation = validator.validate(event, 'BASE');

console.log(validation);
// {
//   valid: true,
//   errors: [],
//   schemaName: 'BASE'
// }
```

### Enrichir un Événement

```javascript
const enriched = validator.enrich(event, {
  userId: 'user123',
  sessionId: 'session-abc-123',
  ipAddress: '192.168.1.1'
});

console.log(enriched.metadata);
// {
//   userId: 'user123',
//   sessionId: 'session-abc-123',
//   ipAddress: '192.168.1.1',
//   enrichedAt: '2026-05-07T18:30:01.000Z'
// }
```

---

## 5. Logging

### Utiliser le Logger

```javascript
const { Logger } = require('./src/core');

// Créer un logger
const logger = new Logger('MyModule', {
  level: 'info',
  logDir: './logs'
});

// Différents niveaux
logger.debug('Message de débogage', { data: 'debug' });
logger.info('Message d\'information', { data: 'info' });
logger.warning('Message d\'avertissement', { data: 'warning' });
logger.error('Message d\'erreur', new Error('Quelque chose a échoué'));

// Créer un sous-logger
const childLogger = logger.child('Auth');
childLogger.info('Authentification en cours');
```

### Changer le Niveau de Log

```javascript
const logger = new Logger('MyModule');

logger.setLevel('debug');  // Voir tous les logs
logger.setLevel('info');   // Seulement info et sup
logger.setLevel('error');  // Seulement les erreurs
```

---

## 6. Invariants

### Définir un Invariant

```javascript
const { Invariant } = require('./src/core');

// Invariant: L'utilisateur doit être authentifié
const userAuthenticatedInvariant = new Invariant(
  'user_authenticated',
  (context) => context.user !== null && context.user !== undefined,
  {
    message: 'L\'utilisateur doit être authentifié',
    severity: 'critical'
  }
);

// Vérifier l'invariant
const isValid = userAuthenticatedInvariant.check({ user: 'john' });
console.log(isValid); // true

const isInvalid = userAuthenticatedInvariant.check({ user: null });
console.log(isInvalid); // false
```

### Ajouter des Invariants à l'Orchestrateur

```javascript
const orchestrator = new Orchestrator();
await orchestrator.initialize();

// Ajouter des invariants
orchestrator.addInvariant(userAuthenticatedInvariant);

// Valider tous les invariants
const validation = orchestrator.validateInvariants();
console.log(validation);
// {
//   valid: true/false,
//   violations: [
//     { invariantId: 'user_authenticated', message: '...' },
//     ...
//   ]
// }
```

---

## 7. Versioning

### Gérer les Versions

```javascript
const { VersionManager } = require('./src/core');

const versionMgr = new VersionManager({ systemVersion: '1.0.0' });
versionMgr.initialize();

// Enregistrer les versions des modules
versionMgr.registerModuleVersion('auth', '1.0.0');
versionMgr.registerModuleVersion('users', '1.1.0');

// Vérifier la compatibilité
const compatibility = versionMgr.checkCompatibility(
  'auth',
  '1.0.0',  // version requise
  '1.0.0'   // version installée
);

console.log(compatibility);
// { compatible: true, installed: '1.0.0', required: '1.0.0' }

// Comparer les versions
console.log(versionMgr.compareVersions('1.0.0', '1.1.0'));  // -1
console.log(versionMgr.compareVersions('1.1.0', '1.0.0'));  // 1
console.log(versionMgr.compareVersions('1.0.0', '1.0.0'));  // 0
```

---

## 8. Contexte Global

### Travailler avec le Contexte

```javascript
const { OrchestratorContext } = require('./src/core');

// Créer un contexte
const context = new OrchestratorContext({
  userId: 'user123',
  permissions: ['read', 'write']
});

// Obtenir une valeur
const userId = context.get('userId');
console.log(userId); // 'user123'

// Définir une valeur
context.set('user.name', 'John Doe');
console.log(context.get('user.name')); // 'John Doe'

// Fusionner des données
context.merge({
  theme: 'dark',
  language: 'fr'
});
```

### Geler et Dégeler

```javascript
// Geler le contexte (lecture seule)
context.freeze();

try {
  context.set('test', 'value');  // ❌ Erreur: Contexte gelé
} catch (e) {
  console.log(e.message);
}

// Dégeler
context.unfreeze();
context.set('test', 'value');  // ✅ OK
```

### Valider le Contexte

```javascript
const schema = {
  'userId': { required: true, type: 'string' },
  'permissions': { required: true, type: 'object' }
};

const validation = context.validate(schema);
console.log(validation);
// { valid: true, errors: [] }
```

---

## 9. Validation Globale

### Valider les Manifests

```javascript
const loader = new ManifestLoader();

// Valider la cohérence des modules
const modulesValidation = loader.validateModulesCohesion();
console.log(modulesValidation);
// { valid: true, errors: [] }

// Valider la cohérence des états
const statesValidation = loader.validateStatesCohesion();
console.log(statesValidation);
// { valid: true, errors: [] }

// Validation complète
const allValidation = loader.validateAll();
console.log(allValidation);
// {
//   modules: { valid: true, errors: [] },
//   states: { valid: true, errors: [] },
//   overallValid: true
// }
```

---

## 10. Cas d'Usage Complet

### Exemple: Initialiser et Transitionner

```javascript
const { Orchestrator, StateMachine, Guard, SideEffect } = require('./src/core');

// 1. Créer et initialiser la machine à états
const fsm = new StateMachine({ initialState: 'IDLE' });
await fsm.initialize();

// 2. Enregistrer les gardes
const isAuthenticatedGuard = new Guard(
  'isAuthenticated',
  (ctx) => ctx.token !== null
);

// 3. Enregistrer les side-effects
const logTransitionEffect = new SideEffect(
  'logTransition',
  async (ctx) => console.log('Transitioning...'),
  { description: 'Log la transition' }
);

// 4. Enregistrer une transition
fsm.registerTransition('IDLE', 'LOADING', 'load', {
  guards: [isAuthenticatedGuard],
  sideEffects: [logTransitionEffect]
});

// 5. Gérer un événement
const result = await fsm.handleEvent('load', { token: 'jwt-token-123' });

console.log(result);
// {
//   success: true,
//   previousState: 'IDLE',
//   currentState: 'LOADING',
//   event: 'load'
// }
```

---

## Quick Reference - Imports

```javascript
// Core
const {
  Orchestrator,
  OrchestratorContext,
  StateMachine, State, Transition, Guard, SideEffect,
  EventTypes, EventSchema, EventValidator,
  Logger,
  Invariant,
  Conventions,
  VersionManager
} = require('./src/core');

// Manifests
const ManifestLoader = require('./src/config/manifests');

// Bootstrap
const SystemBootstrap = require('./src/bootstrap');
```

---

## Checklist d'Utilisation

- [ ] Initialiser le système avec `SystemBootstrap`
- [ ] Charger les manifests avec `ManifestLoader`
- [ ] Accéder aux modules et leurs contrats
- [ ] Vérifier les états et transitions
- [ ] Créer et valider les événements
- [ ] Ajouter des invariants
- [ ] Gérer les versions
- [ ] Travailler avec le contexte global
- [ ] Utiliser le logging
- [ ] Valider la cohérence globale

---

**Pour plus de détails, consultez:**
- [BLUEPRINT_INDEX.md](BLUEPRINT_INDEX.md) - Index complet
- [src/core/README.md](src/core/README.md) - Documentation core
- [src/config/manifests/README.md](src/config/manifests/README.md) - Documentation manifests
