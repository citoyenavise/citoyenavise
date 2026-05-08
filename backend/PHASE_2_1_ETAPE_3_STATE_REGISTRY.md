# 📊 PHASE 2.1 — ÉTAPE 3 : STATE REGISTRY

**Statut** : ✅ COMPLÈTÉE  
**Date** : 2026-05-07  
**Version** : 2.1.0  
**Mode** : IMPLÉMENTATION CONTRÔLÉE

---

## 🎯 Résumé Exécutif

L'ÉTAPE 3 intègre la **StateMachine** construite en Phase 1 dans le runtime Citoyenavise, créant un bootstrap **entièrement déterministe, observable et gouverné par des états**.

### Améliorations Clés
- ✅ **6 États du Bootstrap** : INIT → CONFIG → SERVICES → MODULES → EVENTS → READY
- ✅ **5 Transitions Orchestrées** : Chaque transition validée par invariants
- ✅ **Logging Structuré** : Chaque transition loggée et émise via EventBus
- ✅ **État Observable** : History complète de chaque transition
- ✅ **Garanties Déterministes** : Même ordre, même état à chaque boot

---

## 🔄 Graphe d'États du Bootstrap

```
    ┌──────┐
    │ INIT │
    └──┬───┘
       │ event: bootstrap:config_loaded
       │ guards: [config_valid, logger_active]
       │ side-effects: [log_config_complete]
       ▼
    ┌────────┐
    │ CONFIG │
    └──┬─────┘
       │ event: bootstrap:services_ready
       │ guards: [database_connected, eventbus_active, services_registered]
       │ side-effects: [log_services_ready, emit_services_ready_event]
       ▼
    ┌──────────┐
    │ SERVICES │
    └──┬───────┘
       │ event: bootstrap:modules_registered
       │ guards: [modules_discovered, no_cycles, order_resolved]
       │ side-effects: [register_modules_orchestrator, generate_module_registry, log_modules_ready]
       ▼
    ┌─────────┐
    │ MODULES │
    └──┬──────┘
       │ event: bootstrap:events_ready
       │ guards: [eventbus_operational, subscriptions_registered]
       │ side-effects: [register_event_handlers, log_events_ready]
       ▼
    ┌────────┐
    │ EVENTS │
    └──┬─────┘
       │ event: bootstrap:ready
       │ guards: [all_invariants_passed, health_checks_passed, routes_mounted, no_critical_errors]
       │ side-effects: [validate_final_invariants, emit_system_ready, log_system_ready, start_server]
       ▼
    ┌────────┐
    │ READY  │ (Final State)
    └────────┘
```

---

## 📋 États Détaillés

### 1️⃣ INIT — Initialisation
```json
{
  "id": "INIT",
  "displayName": "Initialisation",
  "description": "Système en cours d'initialisation",
  "hierarchy_level": 0,
  "invariants": ["no modules initialized yet"],
  "allowedTransitions": ["CONFIG"],
  "timeout": null,
  "metadata": {
    "isInitial": true,
    "isFinal": false,
    "stage": 0
  }
}
```

**Responsabilités**:
- Système vient de démarrer (node app.js)
- StateMachine initialisée
- En attente de chargement de la config

**Invariants**:
- ✅ Aucun module n'est encore initialisé

---

### 2️⃣ CONFIG — Configuration Chargée
```json
{
  "id": "CONFIG",
  "displayName": "Configuration Chargée",
  "description": "Configuration et logger initialisés",
  "hierarchy_level": 1,
  "invariants": ["config valid", "logger active"],
  "allowedTransitions": ["SERVICES"],
  "timeout": 5000,
  "metadata": {
    "isInitial": false,
    "isFinal": false,
    "stage": 1,
    "stages_completed": ["config_load", "logger_init"]
  }
}
```

**Responsabilités**:
- Config.js chargée et validée (NODE_ENV, PORT, etc.)
- Logger Winston initialisé
- Logs structurés actifs

**Invariants**:
- ✅ config.NODE_ENV existe
- ✅ logger.info() fonctionne

**Transition depuis INIT**:
```javascript
event: 'bootstrap:config_loaded'
guards: ['config_valid', 'logger_active']
side-effects: ['log_config_complete']
```

---

### 3️⃣ SERVICES — Services Initialisés
```json
{
  "id": "SERVICES",
  "displayName": "Services Initialisés",
  "description": "Core services (database, eventBus, cache) opérationnels",
  "hierarchy_level": 2,
  "invariants": [
    "database connected",
    "eventBus active",
    "services registered"
  ],
  "allowedTransitions": ["MODULES"],
  "timeout": 10000,
  "metadata": {
    "isInitial": false,
    "isFinal": false,
    "stage": 2,
    "stages_completed": [
      "config_load",
      "logger_init",
      "core_services_init",
      "database_init",
      "eventbus_init",
      "shared_services_registration"
    ]
  }
}
```

**Responsabilités**:
- PostgreSQL pool connecté et testé
- EventBus fonctionnel (emit/subscribe validé)
- Redis cache optionnel
- Services partagés enregistrés (4+)

**Invariants**:
- ✅ database.query() exécutable
- ✅ eventBus.emit() fonctionne
- ✅ sharedServices.size ≥ 4 (logger, database, eventBus, cache)

**Transition depuis CONFIG**:
```javascript
event: 'bootstrap:services_ready'
guards: [
  'database_connected',
  'eventbus_active',
  'services_registered'
]
side-effects: [
  'log_services_ready',
  'emit_services_ready_event'
]
```

---

### 4️⃣ MODULES — Modules Enregistrés
```json
{
  "id": "MODULES",
  "displayName": "Modules Enregistrés",
  "description": "Tous les modules découverts, résolus et enregistrés",
  "hierarchy_level": 3,
  "invariants": [
    "modules registered",
    "no dependency cycles",
    "initialization order resolved"
  ],
  "allowedTransitions": ["EVENTS"],
  "timeout": 5000,
  "metadata": {
    "isInitial": false,
    "isFinal": false,
    "stage": 3,
    "stages_completed": [
      "config_load",
      "logger_init",
      "core_services_init",
      "database_init",
      "eventbus_init",
      "shared_services_registration",
      "module_discovery",
      "orchestrator_initialized"
    ]
  }
}
```

**Responsabilités**:
- 15 modules CORE découverts via ModuleResolver
- Dépendances résolues hiérarchiquement
- Cycles de dépendances détectés et bloqués
- Ordre d'initialisation déterministe établi
- Module Manifest Registry généré
- Modules enregistrés dans l'Orchestrator

**Invariants**:
- ✅ modules.size === 15
- ✅ cycleDetected === false
- ✅ resolvedOrder.length === 15
- ✅ Ordre déterministe (même à chaque boot)

**Transition depuis SERVICES**:
```javascript
event: 'bootstrap:modules_registered'
guards: [
  'modules_discovered',
  'no_cycles',
  'order_resolved'
]
side-effects: [
  'register_modules_orchestrator',
  'generate_module_registry',
  'log_modules_ready'
]
```

---

### 5️⃣ EVENTS — Événements Prêts
```json
{
  "id": "EVENTS",
  "displayName": "Événements Prêts",
  "description": "Event subscriptions et handlers enregistrés",
  "hierarchy_level": 4,
  "invariants": [
    "eventBus fully operational",
    "event subscriptions registered",
    "handlers isolated"
  ],
  "allowedTransitions": ["READY"],
  "timeout": 5000,
  "metadata": {
    "isInitial": false,
    "isFinal": false,
    "stage": 4,
    "stages_completed": [
      "config_load",
      "logger_init",
      "core_services_init",
      "database_init",
      "eventbus_init",
      "shared_services_registration",
      "module_discovery",
      "orchestrator_initialized",
      "event_subscriptions"
    ]
  }
}
```

**Responsabilités**:
- Event handlers des modules enregistrés
- EventBus prêt pour dispatch d'événements
- Handlers isolés (pas de chaîning synchrone)
- Timeouts configurés pour les handlers

**Invariants**:
- ✅ eventBus !== null
- ✅ Tous les handlers enregistrés et non-orphelins

**Transition depuis MODULES**:
```javascript
event: 'bootstrap:events_ready'
guards: [
  'eventbus_operational',
  'subscriptions_registered'
]
side-effects: [
  'register_event_handlers',
  'log_events_ready'
]
```

---

### 6️⃣ READY — Système Prêt
```json
{
  "id": "READY",
  "displayName": "Système Prêt",
  "description": "Système complètement initialisé, tous les invariants validés",
  "hierarchy_level": 5,
  "invariants": [
    "all critical invariants passed",
    "health checks passed",
    "routes mounted",
    "system operational"
  ],
  "allowedTransitions": [],
  "timeout": null,
  "metadata": {
    "isInitial": false,
    "isFinal": true,
    "stage": 5,
    "stages_completed": [
      "config_load",
      "logger_init",
      "core_services_init",
      "database_init",
      "eventbus_init",
      "shared_services_registration",
      "module_discovery",
      "orchestrator_initialized",
      "event_subscriptions",
      "route_mounting",
      "background_workers",
      "health_checks"
    ]
  }
}
```

**Responsabilités**:
- Toutes les 11 étapes du bootstrap terminées
- Tous les 5 invariants critiques validés
- Routes Express montées
- Serveur prêt à accepter des requêtes
- Background workers lancés (optionnel)

**Invariants Finaux**:
- ✅ eventbus_active : EventBus !== null
- ✅ database_connected : DB connectée
- ✅ modules_registered : 15 modules enregistrés
- ✅ orchestrator_initialized : Orchestrator prêt
- ✅ shared_services_available : 4+ services

**Transition depuis EVENTS (Finale)**:
```javascript
event: 'bootstrap:ready'
guards: [
  'all_invariants_passed',
  'health_checks_passed',
  'routes_mounted',
  'no_critical_errors'
]
side-effects: [
  'validate_final_invariants',
  'emit_system_ready',
  'log_system_ready',
  'start_server'
]
```

---

## 🔗 Transitions Détaillées

### Transition 1 : INIT → CONFIG
```
Event: bootstrap:config_loaded
Guards:
  ├─ config_valid : config.NODE_ENV existe
  └─ logger_active : logger.info() fonctionne

Side-Effects:
  └─ log_config_complete : Logger que config est chargée

Timeout: 5s
Metadata:
  - stage: 1
  - critical: true
```

### Transition 2 : CONFIG → SERVICES
```
Event: bootstrap:services_ready
Guards:
  ├─ database_connected : DB.query() exécutable
  ├─ eventbus_active : eventBus.emit() fonctionne
  └─ services_registered : 4+ services enregistrés

Side-Effects:
  ├─ log_services_ready : Logger que services sont prêts
  └─ emit_services_ready_event : Émettre bootstrap:services_ready

Timeout: 10s
Metadata:
  - stage: 2
  - critical: true
```

### Transition 3 : SERVICES → MODULES
```
Event: bootstrap:modules_registered
Guards:
  ├─ modules_discovered : 15 modules découverts
  ├─ no_cycles : cycleDetected === false
  └─ order_resolved : initOrder.length === 15

Side-Effects:
  ├─ register_modules_orchestrator : Enregistrer dans orchestrator
  ├─ generate_module_registry : Générer registry
  └─ log_modules_ready : Logger que modules sont prêts

Timeout: 5s
Metadata:
  - stage: 3
  - critical: true
```

### Transition 4 : MODULES → EVENTS
```
Event: bootstrap:events_ready
Guards:
  ├─ eventbus_operational : EventBus complètement prêt
  └─ subscriptions_registered : Event handlers enregistrés

Side-Effects:
  ├─ register_event_handlers : Enregistrer les handlers
  └─ log_events_ready : Logger que événements sont prêts

Timeout: 5s
Metadata:
  - stage: 4
  - critical: true
```

### Transition 5 : EVENTS → READY
```
Event: bootstrap:ready
Guards:
  ├─ all_invariants_passed : 5/5 invariants OK
  ├─ health_checks_passed : Health checks OK
  ├─ routes_mounted : Routes Express montées
  └─ no_critical_errors : Aucune erreur critique

Side-Effects:
  ├─ validate_final_invariants : Validation finale
  ├─ emit_system_ready : Émettre bootstrap:system_ready
  ├─ log_system_ready : Logger que système est prêt
  └─ start_server : Démarrer le serveur Express

Timeout: N/A (final state)
Metadata:
  - stage: 5
  - critical: true
  - final: true
```

---

## 📊 Propriétés Observables

### State History
```javascript
stateMachine.history = [
  {
    state: "INIT",
    timestamp: "2026-05-07T12:34:56.000Z",
    event: "INIT"
  },
  {
    fromState: "INIT",
    toState: "CONFIG",
    event: "bootstrap:config_loaded",
    timestamp: "2026-05-07T12:34:56.050Z",
    context: {}
  },
  {
    fromState: "CONFIG",
    toState: "SERVICES",
    event: "bootstrap:services_ready",
    timestamp: "2026-05-07T12:34:56.500Z",
    context: {}
  },
  // ... (3 transitions supplémentaires jusqu'à READY)
]
```

### État Courant
```javascript
stateMachine.currentState = "READY"  // À la fin
```

### Événements Émis
```
bootstrap:config_loaded
bootstrap:services_ready
bootstrap:modules_registered
bootstrap:events_ready
bootstrap:ready
bootstrap:system_ready (après transition finale)
```

---

## ✅ Garanties ÉTAPE 3

### Déterminisme
- ✅ Même ordre d'états à chaque boot
- ✅ Même durée de transition (variance < 100ms)
- ✅ Même invariants validés
- ✅ Reproductible en prod et en dev

### Observabilité
- ✅ Chaque transition loggée
- ✅ History complète disponible
- ✅ Événements EventBus émis
- ✅ Timing détaillé (timestamps)

### Résilience
- ✅ Blocage en cas de violation d'invariant
- ✅ Timeout configuré par état
- ✅ Guards appliqués avant transition
- ✅ Side-effects documentés

### Traçabilité
- ✅ State machine history
- ✅ Transition timeline
- ✅ Context passé entre états
- ✅ Événements en cascade

---

## 📝 Logs Attendus

```
═══════════════════════════════════════════════════════════════
ÉTAPE 1/11 — Config load
═══════════════════════════════════════════════════════════════

✓ Configuration validée
✓ Bootstrap state transition: INIT → CONFIG
  event: bootstrap:config_loaded

═══════════════════════════════════════════════════════════════
ÉTAPE 2/11 — Logger init
═══════════════════════════════════════════════════════════════

✓ Logger Winston initialisé

[... stages 3-5 ...]

✓ Bootstrap state transition: CONFIG → SERVICES
  event: bootstrap:services_ready

[... stage 6 ...]

═══════════════════════════════════════════════════════════════
ÉTAPE 7/11 — Module discovery et initialization
═══════════════════════════════════════════════════════════════

✓ Module Manifest Registry généré
✓ Bootstrap state transition: SERVICES → MODULES
  event: bootstrap:modules_registered

═══════════════════════════════════════════════════════════════
ÉTAPE 8/11 — Event subscriptions
═══════════════════════════════════════════════════════════════

✓ Event subscriptions préparées
✓ Bootstrap state transition: MODULES → EVENTS
  event: bootstrap:events_ready

[... stages 9-10 ...]

═══════════════════════════════════════════════════════════════
ÉTAPE 11/11 — Health checks → READY
═══════════════════════════════════════════════════════════════

✓ Tous les health checks PASSED
✓ Bootstrap state transition: EVENTS → READY
  event: bootstrap:ready

═══════════════════════════════════════════════════════════════
✅ BOOTSTRAP SYSTÈME COMPLÉTÉ (avec StateMachine)
═══════════════════════════════════════════════════════════════

⏱️  Durée: 1200ms
📦 Modules: 15 enregistrés
🔧 Services: 4+ actifs
✓ Invariants: 0 violations
📊 État: READY
```

---

## 🎯 Intégration avec Autres Composants

### Avec ModuleResolver (ÉTAPE 2)
```
StateMachine State: MODULES
  ├─ Transition: SERVICES → MODULES
  └─ Side-effect: register_modules_orchestrator
     └─ Modules en ordre topologique (via ModuleResolver)
```

### Avec EventBus
```
Chaque transition → Événement EventBus
  bootstrap:config_loaded
  bootstrap:services_ready
  bootstrap:modules_registered
  bootstrap:events_ready
  bootstrap:ready
  bootstrap:system_ready (après READY)
```

### Avec Orchestrator
```
StateMachine State: MODULES
  └─ Orchestrator.registerModule() × 15
     └─ Chaque module enregistré dans l'ordre résolu
```

---

## ✅ ÉTAPE 3 COMPLÈTEMENT VALIDÉE

**Status: 🟢 READY FOR ÉTAPE 4**

---

**Étape 3 Complétée par : Architecte Système Principal**  
**Mode : IMPLÉMENTATION CONTRÔLÉE**  
**Status : ✅ PRÊTE POUR ÉTAPE 4**
