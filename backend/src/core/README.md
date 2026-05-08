# Core Blueprint - Phase 1

Documentation de la structure fondamentale du système.

## Structure

```
core/
├── orchestrator/          # Orchestrateur central
│   ├── Orchestrator.js           # Classe principale
│   ├── OrchestratorEvents.js      # Événements standardisés
│   ├── OrchestratorContext.js     # Contexte global
│   └── index.js
├── state-machine/         # Machine à états
│   ├── StateMachine.js           # Moteur FSM
│   ├── State.js                  # Définition d'état
│   ├── Transition.js             # Définition de transition
│   ├── Guard.js                  # Gardes (conditions)
│   ├── SideEffect.js             # Actions exécutées
│   └── index.js
├── events/                # Système d'événements
│   ├── EventTypes.js             # Énumération des types
│   ├── EventSchema.js            # Schémas de validation
│   ├── EventValidator.js         # Validateur
│   └── index.js
├── logging/               # Logging centralisé
│   ├── Logger.js                 # Classe Logger
│   └── index.js
├── invariants/            # Invariants système
│   ├── Invariant.js              # Classe Invariant
│   └── index.js
├── conventions/           # Conventions du système
│   ├── Conventions.js            # Règles et standards
│   └── index.js
├── versioning/            # Gestion des versions
│   ├── VersionManager.js         # Gestionnaire de versions
│   └── index.js
└── index.js               # Exports centralisés
```

## Composants Clés

### 1. Orchestrator
Point d'entrée unique pour orchestrer tout le système.

**Responsabilités:**
- Gestion des modules
- Gestion des invariants
- Coordination des transitions
- Gestion du middleware

```javascript
const { Orchestrator } = require('./core');
const orchestrator = new Orchestrator();
await orchestrator.initialize();
```

### 2. State Machine
Moteur d'états pour gérer les transitions d'état.

**Concepts:**
- États (States)
- Transitions entre états
- Gardes (Guards) - conditions
- Side-effects - actions exécutées

```javascript
const { StateMachine, Guard, SideEffect } = require('./core');
const fsm = new StateMachine({ initialState: 'IDLE' });
fsm.registerTransition('IDLE', 'PROCESSING', 'start');
```

### 3. Events System
Système d'événements typé et validé.

**Caractéristiques:**
- Énumération des types d'événements
- Schémas de validation
- Validateur d'événements

```javascript
const { EventValidator } = require('./core');
const validator = new EventValidator();
const event = validator.createEvent('auth.attempt', { userId: '123' });
```

### 4. Logger
Logger centralisé pour toute l'application.

**Niveaux:**
- debug
- info
- warning
- error

```javascript
const { Logger } = require('./core');
const logger = new Logger('MyModule');
logger.info('Message', { data: 'value' });
```

### 5. Invariants
Conditions qui doivent toujours être vraies.

```javascript
const { Invariant } = require('./core');
const inv = new Invariant(
  'user_authenticated',
  (ctx) => ctx.user !== null,
  { message: 'Utilisateur doit être authentifié' }
);
```

### 6. Conventions
Règles et standards du système.

```javascript
const { Conventions } = require('./core');
if (Conventions.validateName('auth_module', 'MODULE_ID_PATTERN')) {
  // Valid name
}
```

### 7. VersionManager
Gestion des versions du système et des modules.

```javascript
const { VersionManager } = require('./core');
const versionMgr = new VersionManager();
versionMgr.registerModuleVersion('auth', '1.0.0');
```

## Workflows

### Initialisation du Système

```javascript
const orchestrator = new Orchestrator({
  stateMachineConfig: { initialState: 'IDLE' }
});

await orchestrator.initialize({
  userId: 'user123',
  permissions: ['read', 'write']
});
```

### Enregistrement d'un Module

```javascript
orchestrator.registerModule('auth', {
  id: 'auth',
  version: '1.0.0',
  initialize: async () => {},
  shutdown: async () => {},
});
```

### Validation d'Invariants

```javascript
const validation = orchestrator.validateInvariants();
if (!validation.valid) {
  console.error('Invariants violés:', validation.violations);
}
```

### Transition d'État

```javascript
const result = await orchestrator.transition('process_start', {
  data: 'some_data'
});

console.log(result.previousState); // 'IDLE'
console.log(result.currentState);  // 'PROCESSING'
```

## Manifests (Phase 2)

Les manifests définissent:
- **module.manifest.json** - Modules fondamentaux et leurs contrats
- **states.manifest.json** - États et transitions du système
- **phases.manifest.json** - Phases d'implémentation

## Tests

Les tests Blueprint sont dans `tests/blueprint.test.js` et couvrent:
- Initialisation du système
- Gestion des modules
- Transitions d'état
- Événements
- Logging
- Invariants
- Versioning
- Intégration complète

```bash
npm test -- blueprint.test.js
```

## Conventions Importantes

### Nommage
- Modules: `snake_case` (ex: `auth_module`)
- Événements: `module.event` (ex: `auth.attempt`)
- États: `UPPER_CASE` (ex: `IDLE`, `PROCESSING`)
- Invariants: `snake_case` (ex: `user_authenticated`)

### Versioning
Format SEMVER: `MAJOR.MINOR.PATCH` (ex: `1.0.0`)

### Événements
Structure standardisée:
```javascript
{
  eventId: string,
  eventType: string,
  timestamp: ISO8601,
  source: string,
  version: string,
  data: object,
  metadata: object
}
```

## Architecture Globale

```
┌─────────────────────────────────────┐
│       Orchestrator (Central)        │
│                                     │
│  ├─ State Machine (FSM)             │
│  ├─ Invariants (Constraints)        │
│  ├─ Events (Pub/Sub)                │
│  ├─ Context (Global State)          │
│  ├─ Modules (Registry)              │
│  └─ Logging (Centralized)           │
└─────────────────────────────────────┘
         │
         ├─ Version Manager
         ├─ Conventions
         └─ Middleware Stack
```

## Prochaines Étapes - Phase 2

1. **Module Manifests** - Déclarer les 5 modules fondamentaux
2. **State Manifests** - Définir les états et transitions
3. **Phase Manifests** - Planifier les phases d'implémentation
4. **Validation Croisée** - Vérifier la cohérence globale

Voir: `config/manifests/README.md`

## Ressources

- Tests: `tests/blueprint.test.js`
- Manifests: `config/manifests/`
- Configuration: `config/`
