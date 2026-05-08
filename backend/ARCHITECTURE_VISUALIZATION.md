# 🏗️ ARCHITECTURE VISUALIZATION - Cartographie Complète

## État Actuel vs. État Théorique

### ⚠️ ARCHITECTURE RÉELLE (Runtime)

```
┌─────────────────────────────────────────────────────────────┐
│                        Express App (app.js)                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Middlewares de Sécurité + Logging                  │   │
│  │ (Helmet, CORS, CSP, Auth, Rate-Limit)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ moduleLoader.loadRoutes() - Chargement ad-hoc       │   │
│  │ (15 modules CORE chargés en parallèle)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 15 Modules Express Routers                          │   │
│  │ (auth, users, posts, ideas, likes, comments, etc.)  │   │
│  │                                                      │   │
│  │ Chaque module:                                      │   │
│  │ ├─ routes.js (Express Router)                       │   │
│  │ ├─ controller.js                                    │   │
│  │ ├─ service.js (logique métier)                      │   │
│  │ └─ schema.js (validation basique)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Services Globaux (non-orchestrés)                  │   │
│  │ ├─ database (PostgreSQL)                            │   │
│  │ ├─ cache (Redis)                                    │   │
│  │ ├─ logger (Winston)                                 │   │
│  │ └─ eventBus (EventEmitter simple)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Frontend SPA Fallback (index.html)                  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Caractéristiques** :
- ✅ Fonctionnel
- ✅ Scalable à court terme
- ❌ Aucune orchestration
- ❌ Aucune gouvernance
- ❌ Aucune traçabilité d'état
- ❌ Dépendances non-validées

---

### 🎯 ARCHITECTURE THÉORIQUE (Phase 1 + Phase 2 - NON INTÉGRÉE)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SystemBootstrap (bootstrap.js)              │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ VersionManager.initialize()                           │    │
│  └───────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ ManifestLoader.validateAll()                          │    │
│  │ ├─ manifest.modules.json (5 modules déclarés)         │    │
│  │ ├─ manifest.states.json (13+ états)                   │    │
│  │ ├─ manifest.phases.json (5 phases)                    │    │
│  │ ├─ manifest.guards.json                               │    │
│  │ └─ manifest.side-effects.json                         │    │
│  └───────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ Orchestrator.initialize(context)                      │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────┐             │    │
│  │  │ StateMachine.initialize()            │             │    │
│  │  │ ├─ registerState(stateId, config)    │             │    │
│  │  │ ├─ registerTransition(...)           │             │    │
│  │  │ └─ currentState = IDLE               │             │    │
│  │  └──────────────────────────────────────┘             │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────┐             │    │
│  │  │ registerModule() x 5 modules          │             │    │
│  │  │ (dans l'ordre des dépendances)       │             │    │
│  │  │                                       │             │    │
│  │  │ auth                                 │             │    │
│  │  │  ├─ users                            │             │    │
│  │  │  ├─ posts                            │             │    │
│  │  │  ├─ notifications                    │             │    │
│  │  │  └─ analytics                        │             │    │
│  │  └──────────────────────────────────────┘             │    │
│  │                                                       │    │
│  │  ┌──────────────────────────────────────┐             │    │
│  │  │ addInvariant() x 3 contraintes       │             │    │
│  │  │ ├─ min_modules_registered            │             │    │
│  │  │ ├─ valid_current_state               │             │    │
│  │  │ └─ context_not_frozen                │             │    │
│  │  └──────────────────────────────────────┘             │    │
│  └───────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ validateInvariants() → Tous les invariants OK         │    │
│  └───────────────────────────────────────────────────────┘    │
│                          ↓                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ ✅ Système Initialisé et Gouverné                     │    │
│  └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘

                          ⬇️ Runtime ⬇️

┌─────────────────────────────────────────────────────────────────┐
│                      Express App (app.js)                       │
│                                                                 │
│  Middlewares → Routes (Express Router per module) → Services   │
│                          ↓                                      │
│                   Event émis → EventValidator                  │
│                                                                │
│                   orchestrator.transition(event)                │
│                   ├─ validateInvariants()                      │
│                   ├─ stateMachine.handleEvent()                │
│                   │   ├─ canTransition()?                      │
│                   │   ├─ applyGuards()                         │
│                   │   ├─ executeSideEffects()                  │
│                   │   └─ emit('orchestrator:transition')       │
│                   └─ updateContext()                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Caractéristiques** :
- ✅ Totalement gouverné
- ✅ Orchestration centralisée
- ✅ Dépendances vérifiées
- ✅ Invariants garantis
- ✅ État machine traçable
- ✅ Événements validés

---

## 📊 COMPARAISON : RÉALITÉ vs. THÉORIE

```
┌────────────────────┬─────────────────┬──────────────────┐
│ Composant          │ Réalité Runtime │ Théorie Phase1-2  │
├────────────────────┼─────────────────┼──────────────────┤
│ Démarrage          │ app.js          │ bootstrap.js      │
│ Module Loading     │ moduleLoader    │ ManifestLoader    │
│ Module Registration│ express.use()   │ Orchestrator      │
│ État Machine       │ Implicite       │ StateMachine      │
│ Transitions        │ Ad-hoc          │ Orchestrée        │
│ Invariants         │ Aucun           │ 3 validés         │
│ Événements         │ EventEmitter    │ EventValidator    │
│ Versioning         │ Aucun           │ VersionManager    │
│ Logging            │ Winston         │ Logger             │
│ Dépendances        │ Aucune vérif.   │ Déclarées         │
│ Contrats API       │ Basique         │ JSON Schema       │
│ Monitoring         │ Minimal         │ Orchestrator emit │
└────────────────────┴─────────────────┴──────────────────┘
```

---

## 🔗 DÉPENDANCES INTER-MODULES - CARTOGRAPHIE

### Graphe de Dépendances (15 modules CORE)

```
                    ┌─────────┐
                    │  auth   │
                    └────┬────┘
                         │
                ┌────────┼────────┐
                │        │        │
          ┌─────▼──┐  ┌──▼──┐  ┌─▼──────┐
          │ users  │  │admin│  │profile │
          └────┬───┘  └──────┘  └────────┘
               │
        ┌──────┼──────┬────────┬──────────┐
        │      │      │        │          │
     ┌──▼──┐ ┌─▼──┐ ┌─▼────┐ ┌─▼──────┐ ┌▼────────┐
     │posts│ │idea│ │initia│ │reports │ │education│
     └──┬──┘ └──┬─┘ └──────┘ └────────┘ └─────────┘
        │      │
   ┌────┼──────┼────┐
   │    │      │    │
┌──▼─┐ │  ┌───▼──┐ │
│like│ │  │search│ │
└──┬─┘ │  └───┬──┘ │
   │   │      │    │
   └───┼──────┼────┘
       │      │
   ┌───▼──────▼──┐
   │  comments   │
   └─────┬──────┘
         │
    ┌────▼──────────┐
    │ popular_syste │
    └───────────────┘

    map (depends on users, ideas)
```

**Légende** :
- Flèches = "dépend de"
- Aucune validaiton de cycles
- Aucun ordre d'initialisation garanti

### Manifest vs. Réalité

**manifest.modules.json déclare** :
```json
{
  "auth": { "dependencies": [] },
  "users": { "dependencies": ["auth"] },
  "posts": { "dependencies": ["users", "auth"] },
  "notifications": { "dependencies": ["users"] },
  "analytics": { "dependencies": [] }
}
```

**Réalité** : 15 modules, pas 5. Les dépendances réelles ne sont pas déclarées.

---

## 🔴 VIOLATIONS VISUELLES

### V1 : Double Système Sans Pont

```
┌──────────────────────┐              ┌──────────────────────┐
│  Phase 1 : Bootstrap │              │  Réalité : App.js    │
│  (Théorique)         │              │  (Opérationnel)      │
├──────────────────────┤              ├──────────────────────┤
│ Orchestrator ✅      │          ❌   │ moduleLoader         │
│ StateMachine ✅      │   (0%)        │ Express Router       │
│ EventValidator ✅    │  Intégration  │ EventBus simple      │
│ Invariants ✅        │              │ Services ad-hoc      │
│ VersionManager ✅    │              │                      │
└──────────────────────┘              └──────────────────────┘

        ↓                ↓
    Manifests (Phase 2)
    ├─ manifest.modules.json (5 modules)
    ├─ manifest.states.json (13+ états)
    ├─ manifest.phases.json
    ├─ manifest.guards.json
    └─ manifest.side-effects.json
    
    ↓
    ❌ Jamais utilisés par app.js
```

### V2 : Événements Non-Orchestrés

```
Module A              Module B              Module C
├─ emit('post:     ├─ on('post:created') ├─ no listener
│   created')       │   -> do something
│                   │   -> emit('likes:   
│                   │      added')       
└─ No validation    │                    └─ orphan handler
   No schema        └─ No schema          No validation
   No registry         No validation      
```

### V3 : Dépendances Non-Validées

```
┌─────────────┐
│ Module auth │
└────┬────────┘
     │
     │ (dépend)
     │
     ▼
┌─────────────┐    ❌ Pas de vérification
│ Module A    │       que auth existe
└─────────────┘       Pas de vérification
                      d'ordre d'init
```

### V4 : État Machine Inactif

```
Manifest.states.json               StateMachine Réelle
│                                  │
├─ IDLE ✅                          ├─ currentState = null
├─ AUTHENTICATING ✅                ├─ No state registered
├─ AUTHENTICATED ✅                 ├─ No transitions loaded
├─ LOADING ✅                       ├─ No guards
├─ LOADED ✅                        └─ No side-effects
├─ CREATING ✅
├─ CREATED ✅
├─ ERROR ✅
└─ ... (13+ states)                 

       ❌ 0% Utilisé
```

---

## 📈 DÉPENDANCES NPM - VUE D'ENSEMBLE

```
package.json (23 dépendances)
│
├─ ✅ UTILISÉES
│  ├─ express (routing)
│  ├─ cors (CORS)
│  ├─ helmet (security)
│  ├─ pg (PostgreSQL)
│  ├─ jsonwebtoken (JWT)
│  ├─ bcrypt (passwords)
│  ├─ winston (logging)
│  ├─ redis (cache)
│  ├─ express-rate-limit (rate limiting)
│  ├─ swagger-ui-express (API docs)
│  ├─ compression (gzip)
│  ├─ uuid (IDs)
│  ├─ @sentry/node (monitoring)
│  └─ swagger-jsdoc (API docs)
│
├─ ⚠️ DÉCLARÉES (non-utilisées)
│  ├─ ws (WebSocket)
│  ├─ xss (XSS protection)
│  └─ multer (uploads)
│
└─ ❌ INSTALLÉES MAIS NON-UTILISÉES
   └─ zod (validation) ← Présent mais jamais appliqué
```

**Impact** : Zod pourrait valider les schémas de manifests, mais n'est pas utilisé.

---

## 🎯 FLUX D'INITIALISATION ACTUELS

### Réalité (app.js)
```javascript
1. app = express()
2. Use middlewares (Helmet, CORS, etc.)
3. moduleLoader.loadRoutes(app)
   ├─ for each CORE module
   │  └─ require('module/routes.js')
   │     └─ module.init() si existe
   └─ log stats (loaded, missing, incomplete)
4. app.listen(PORT)
```

⏱️ Temps d'exécution : ~100ms  
🔍 Visibilité : CORE/STANDBY/incomplete listed  
❌ Validation : Aucune

### Théorique (bootstrap.js)
```javascript
1. bootstrap = new SystemBootstrap(config)
2. bootstrap.initialize()
   ├─ versionManager.initialize()
   ├─ manifestLoader.validateAll()
   │  ├─ validateModulesCohesion()
   │  ├─ validateStatesCohesion()
   │  └─ validatePhasesCohesion()
   ├─ orchestrator.initialize(context)
   │  ├─ stateMachine.initialize()
   │  └─ registerModule() × 5
   ├─ addSystemInvariants() × 3
   └─ validateInvariants()
3. orchestrator.getOrchestrator()
4. app.listen(PORT)
```

⏱️ Temps d'exécution : ~200ms (validation overhead)  
🔍 Visibilité : Complète (tous les systèmes)  
✅ Validation : Complète (cohérence, cycles, etc.)

---

## 📊 SYSTÈME DE GOUVERNANCE - ÉTAT ACTUEL

```
┌────────────────────────────────────────────────────────┐
│              GOUVERNANCE SYSTÈME (Phase 2.1+)           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🔴 Module Registry                                    │
│  │ ├─ Déclaré : manifest.modules.json                 │
│  │ └─ Appliqué : moduleLoader.js                      │
│  │    ├─ 15 CORE modules                              │
│  │    └─ 18 STANDBY (commentés)                       │
│  │                                                    │
│  🔴 Dependency Registry                                │
│  │ ├─ Déclaré : manifest.modules.json                 │
│  │ │   └─ users → [auth]                              │
│  │ │   └─ posts → [users, auth]                       │
│  │ └─ Réel : Aucun                                    │
│  │    └─ Chaque module : require() ad-hoc             │
│  │                                                    │
│  🔴 Event Registry                                     │
│  │ ├─ Déclaré : manifest.*.json (100+ events)         │
│  │ └─ Appliqué : EventEmitter libre                   │
│  │    └─ Aucune validation                            │
│  │                                                    │
│  🔴 State Registry                                     │
│  │ ├─ Déclaré : manifest.states.json (13+ states)     │
│  │ └─ Appliqué : Aucun                                │
│  │    └─ États implicites dans modules                │
│  │                                                    │
│  🟢 Service Registry                                   │
│  │ ├─ Déclaré : core/services/*                       │
│  │ └─ Appliqué : require() direct                     │
│  │    ├─ database ✅                                  │
│  │    ├─ cache ✅                                     │
│  │    ├─ logger ✅                                    │
│  │    └─ eventBus ✅                                  │
│  │                                                    │
│  🔴 Contract Registry                                 │
│  │ ├─ Déclaré : manifest.modules (JSON Schema)        │
│  │ └─ Appliqué : Aucun                                │
│  │    └─ Zod installé mais non-utilisé                │
│  │                                                    │
│  🔴 Lifecycle Registry                                │
│  │ ├─ Déclaré : manifest.phases.json                  │
│  │ └─ Appliqué : Aucun                                │
│  │    └─ Modules lancés en parallèle                  │
│  │                                                    │
│  🔴 Invariant Registry                                │
│  │ ├─ Déclaré : bootstrap.js (3 invariants)           │
│  │ └─ Appliqué : Aucun                                │
│  │    └─ Aucune validation                            │
│  │                                                    │
└────────────────────────────────────────────────────────┘

Légende :
🟢 = Implémenté ET appliqué
🟡 = Partiellement implémenté
🔴 = Implémenté mais NON appliqué / Déclaré mais NON implémenté
```

---

## 🎯 IMPACT RÉEL DES VIOLATIONS

### Scénario 1 : Dépendance Circulaire
```
Si modules A → B → C → A (cycle):

Réalité actuelle:
├─ app.js charge en parallèle
├─ Module A: require('module-b')
│  └─ Module B: require('module-c')
│     └─ Module C: require('module-a')
│        └─ ❌ A pas encore chargé!
│           → undefined / démarrage instable

Avec bootstrap.js:
├─ ManifestLoader valide dépendances
├─ Détecte cycle A→B→C→A
├─ Throw error : "Cycle detected"
└─ ✅ Empêche démarrage instable
```

### Scénario 2 : Événement Non-Validé
```
Réalité actuelle:
Module A: eventBus.emit('post:created', { title: 'test' })
│
Module B: eventBus.on('post:created', (data) => {
│  console.log(data.content) // ❌ undefined
│  // Manifest dit: content REQUIRED
│  // Mais pas validé!
│})

Avec bootstrap.js:
Module A: orchestrator.emit('post:created', { title: 'test' })
│
EventValidator:
├─ Cherche manifest.events['post:created']
├─ Charge schema (content REQUIRED)
├─ Valide payload
├─ ❌ Erreur: "content is required"
└─ ✅ Erreur détectée au source
```

### Scénario 3 : État Machine Invalide
```
Réalité actuelle:
Module posts:
  ├─ state = 'CREATING'
  ├─ (request fails)
  └─ state = 'CREATED' ❌ Invalid transition!
             (should be ERROR first)

Avec bootstrap.js:
Module posts:
  ├─ orchestrator.transition('post:create')
  │  └─ StateMachine.canTransition('post:create')?
  │     └─ Cherche transition CREATING→?
  │        └─ manifest.states dit: CREATING→[CREATED, ERROR]
  │           ✅ Valide
  ├─ request fails
  └─ orchestrator.transition('post:error')
     ├─ StateMachine.canTransition('post:error')?
     │  └─ Cherche transition CREATING→ERROR
     │     └─ ✅ Valide
     └─ state = 'ERROR'
```

---

## 🚀 RECOMMANDATION D'ARCHITECTURE CIBLE

```
┌──────────────────────────────────────────────────────────────┐
│           CITOYENAVISE - Architecture Industrielle            │
│                      (Phase 2.1+)                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SystemBootstrap.initialize()                       │   │
│  │  (Validation + Gouvernance au startup)              │   │
│  │                                                     │   │
│  │  ├─ Charge manifests                               │   │
│  │  ├─ Valide dépendances                             │   │
│  │  ├─ Détecte cycles                                 │   │
│  │  ├─ Initialise StateMachine                        │   │
│  │  └─ Valide invariants                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                        ↓                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express App avec Modules Orchestrés                │   │
│  │                                                     │   │
│  │  ├─ Middlewares                                    │   │
│  │  ├─ Routes                                         │   │
│  │  ├─ Controllers                                    │   │
│  │  └─ Services (avec orchestration d'événements)     │   │
│  │                                                     │   │
│  │  Chaque requête:                                   │   │
│  │  ├─ Validée contre contrat (JSON Schema)           │   │
│  │  ├─ Transition d'état si applicable                │   │
│  │  ├─ Événement émis + validé                        │   │
│  │  ├─ Invariants vérifiés                            │   │
│  │  └─ Réponse structurée                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                        ↓                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Observable + Monitorable                           │   │
│  │  ├─ Tous les événements loggés                      │   │
│  │  ├─ Toutes les transitions tracées                  │   │
│  │  ├─ Violations d'invariants alertées                │   │
│  │  ├─ Métriques exportées                             │   │
│  │  └─ Debugging facilitée                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Avantages:                                                 │
│  ✅ Système cohérent et maintenable                         │
│  ✅ Scaling horizontal possible                             │
│  ✅ Mobile-first et IA-compatible                           │
│  ✅ Gouvernance complète                                    │
│  ✅ Observable = debuggable                                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

**Fin de la visualisation architecturale**  
**Prêt pour Phase 2.1 : Stabilisation (après approbation)**
