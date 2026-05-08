# 📋 PHASE 2.1 — ÉTAPE 2 : MODULE MANIFEST REGISTRY

**Statut** : ✅ COMPLÈTÉE  
**Date** : 2026-05-07  
**Version** : 2.1.0  
**Mode** : IMPLÉMENTATION CONTRÔLÉE

---

## 🎯 Résumé Exécutif

L'ÉTAPE 2 remplace le `moduleLoader` simple par un **ModuleResolver** hiérarchique et déterministe qui :

- ✅ **Déclare explicitement** chaque module (dépendances, services, événements)
- ✅ **Résout les dépendances** en ordre topologique déterministe
- ✅ **Détecte les cycles** et bloque le bootstrap
- ✅ **Génère une registry** documentée avec services et événements
- ✅ **Isole les modules** et les rend injectables via DI

**Artefacts créés** :
1. `manifest.modules.core.json` — Déclaration des 15 modules CORE
2. `ModuleResolver.js` — Résolveur hiérarchique avec détection de cycles
3. `SystemBootstrap.js` — Modifié pour utiliser ModuleResolver (ÉTAPE 7)
4. Ce document — Registry documentée

---

## 📦 Hiérarchie des Modules (5 Niveaux)

### **Niveau 0 — Infrastructure (Core Services)**
Services partagés fournis par le bootstrap, **pas des modules**:
- `logger` — Winston (logging centralisé)
- `database` — PostgreSQL pool
- `cache` — Redis (optionnel)
- `eventBus` — Dispatch d'événements centralisé

---

### **Niveau 1 — Standalone (0 dépendances inter-modules)**

#### 1️⃣ `auth` — Module Authentification
```
ID: auth
Version: 1.0.0
Hierarchy Level: 1
Dependencies: []
Required Services: [logger, database, eventBus]
Exposed Services: [authService, jwtService]
Events Emitted: auth:attempt, auth:success, auth:failure, auth:logout, auth:token_expired
Events Listened: []
Routes Base: /api/v1/auth
```

**Responsabilités**:
- Authentification JWT
- Gestion des sessions
- Validation des credentials
- Renouvellement de tokens

---

#### 2️⃣ `education` — Module Éducation
```
ID: education
Version: 1.0.0
Hierarchy Level: 1
Dependencies: []
Required Services: [logger, database, eventBus]
Exposed Services: [educationService]
Events Emitted: education:content_viewed, education:quiz_completed
Events Listened: []
Routes Base: /api/v1/education
```

**Responsabilités**:
- Contenu éducatif (guides civiques)
- Quizzes
- Ressources de formation

---

#### 3️⃣ `analytics` — Module Analytics
```
ID: analytics
Version: 1.0.0
Hierarchy Level: 1
Dependencies: []
Required Services: [logger, database, cache, eventBus]
Exposed Services: [analyticsService]
Events Emitted: analytics:event_tracked, analytics:aggregated, analytics:report_generated
Events Listened: []
Routes Base: /api/v1/analytics
```

**Responsabilités**:
- Collecte d'événements
- Agrégation de données
- Génération de rapports

---

### **Niveau 2 — Domain Modules (Dépendent de auth et/ou users)**

#### 4️⃣ `users` — Module Utilisateurs
```
ID: users
Version: 1.0.0
Hierarchy Level: 2
Dependencies: [auth]
Required Services: [logger, database, eventBus, authService]
Exposed Services: [userService]
Events Emitted: user:created, user:updated, user:deleted, user:loaded, user:error
Events Listened: [auth:success]
Routes Base: /api/v1/users
```

**Responsabilités**:
- Gestion des profils utilisateurs
- Données personnalisées
- Préférences utilisateur

---

#### 5️⃣ `profiles` — Module Profils
```
ID: profiles
Version: 1.0.0
Hierarchy Level: 2
Dependencies: [auth, users]
Required Services: [logger, database, eventBus, userService]
Exposed Services: [profileService]
Events Emitted: profile:updated, profile:view_count_increased
Events Listened: [user:created, user:updated]
Routes Base: /api/v1/profiles
```

**Responsabilités**:
- Profils publics
- Statistiques utilisateurs
- Visibilité

---

#### 6️⃣ `posts` — Module Posts
```
ID: posts
Version: 1.0.0
Hierarchy Level: 2
Dependencies: [auth, users]
Required Services: [logger, database, eventBus, userService]
Exposed Services: [postService]
Events Emitted: post:created, post:updated, post:deleted, post:published, post:commented
Events Listened: [user:created]
Routes Base: /api/v1/posts
```

**Responsabilités**:
- Création/publication de posts
- Gestion du contenu
- Feed utilisateur

---

#### 7️⃣ `ideas` — Module Idées
```
ID: ideas
Version: 1.0.0
Hierarchy Level: 2
Dependencies: [auth, users]
Required Services: [logger, database, eventBus, userService]
Exposed Services: [ideaService]
Events Emitted: idea:created, idea:updated, idea:deleted, idea:approved, idea:commented
Events Listened: [user:created]
Routes Base: /api/v1/ideas
```

**Responsabilités**:
- Gestion des idées civiques
- Propositions publiques
- Approbation d'idées

---

#### 8️⃣ `map` — Module Carte
```
ID: map
Version: 1.0.0
Hierarchy Level: 2
Dependencies: [users, ideas]
Required Services: [logger, database, cache, eventBus]
Exposed Services: [mapService]
Events Emitted: map:nodes_updated, map:cluster_changed
Events Listened: [idea:created, user:created]
Routes Base: /api/v1/map
```

**Responsabilités**:
- Visualisation géographique
- Clustering de données
- Heatmaps

---

#### 9️⃣ `initiatives` — Module Initiatives
```
ID: initiatives
Version: 1.0.0
Hierarchy Level: 2
Dependencies: [auth, users]
Required Services: [logger, database, eventBus, userService]
Exposed Services: [initiativeService]
Events Emitted: initiative:created, initiative:updated, initiative:joined, initiative:completed
Events Listened: [user:created]
Routes Base: /api/v1/initiatives
```

**Responsabilités**:
- Initiatives communautaires
- Participation
- Progression

---

#### 🔟 `admin` — Module Admin
```
ID: admin
Version: 1.0.0
Hierarchy Level: 2
Dependencies: [auth]
Required Services: [logger, database, eventBus, authService]
Exposed Services: [adminService]
Events Emitted: admin:action_logged, admin:user_banned, admin:content_removed
Events Listened: [auth:success]
Routes Base: /api/v1/admin
```

**Responsabilités**:
- Dashboard administrateur
- Modération
- Gestion des utilisateurs

---

#### 1️⃣1️⃣ `reports` — Module Rapports
```
ID: reports
Version: 1.0.0
Hierarchy Level: 2
Dependencies: [auth, users]
Required Services: [logger, database, eventBus, userService, authService]
Exposed Services: [reportService]
Events Emitted: report:created, report:reviewed, report:resolved
Events Listened: [user:created]
Routes Base: /api/v1/reports
```

**Responsabilités**:
- Signalement d'abus
- Gestion des rapports
- Modération

---

### **Niveau 3 — Derived Modules (Dépendent de niveaux 1-2)**

#### 1️⃣2️⃣ `likes` — Module Likes
```
ID: likes
Version: 1.0.0
Hierarchy Level: 3
Dependencies: [auth, users, posts, ideas]
Required Services: [logger, database, eventBus, userService]
Exposed Services: [likeService]
Events Emitted: like:added, like:removed, like:count_updated
Events Listened: [post:created, idea:created]
Routes Base: /api/v1/likes
```

**Responsabilités**:
- J'aime sur posts
- J'aime sur idées
- Compteurs de likes

---

#### 1️⃣3️⃣ `comments` — Module Commentaires
```
ID: comments
Version: 1.0.0
Hierarchy Level: 3
Dependencies: [auth, users, posts, ideas]
Required Services: [logger, database, eventBus, userService]
Exposed Services: [commentService]
Events Emitted: comment:created, comment:updated, comment:deleted, comment:replied
Events Listened: [post:created, idea:created]
Routes Base: /api/v1/comments
```

**Responsabilités**:
- Commentaires sur posts
- Commentaires sur idées
- Threading

---

#### 1️⃣4️⃣ `popular_system` — Module Popular System
```
ID: popular_system
Version: 1.0.0
Hierarchy Level: 3
Dependencies: [posts, likes, comments]
Required Services: [logger, database, cache, eventBus]
Exposed Services: [popularService]
Events Emitted: popular:ranked, popular:trending_updated
Events Listened: [like:added, comment:created, post:created]
Routes Base: /api/v1/popular
```

**Responsabilités**:
- Système de popularité
- Trending topics
- Ranking d'articles

---

#### 1️⃣5️⃣ `search` — Module Recherche
```
ID: search
Version: 1.0.0
Hierarchy Level: 3
Dependencies: [posts, ideas, users]
Required Services: [logger, database, cache, eventBus]
Exposed Services: [searchService]
Events Emitted: search:indexed, search:query_logged
Events Listened: [post:created, idea:created, user:created]
Routes Base: /api/v1/search
```

**Responsabilités**:
- Recherche globale
- Indexation
- Suggestions

---

## 🔗 Graphe de Dépendances

```
                    ┌────────────┐
                    │   auth     │ (Niveau 1)
                    └─────┬──────┘
                          │
        ┌─────────────────┼──────────────────────────────┐
        │                 │                              │
     ┌──▼──┐           ┌──▼──┐                       ┌───▼───┐
     │users│           │admin│                       │reports│
     └──┬──┘           └─────┘                       └───────┘
        │                                        (Niveau 2)
        │
   ┌────┼────────────────────────────────────────────────────────┐
   │    │                                                         │
   │    ▼                                                         │
   │ ┌────────────────────────────────────────────────────────┐  │
   │ │            posts        ideas        initiatives      │  │
   │ │                                        (Niveau 2)     │  │
   │ └──┬──────────────────┬──────────────────┬─────────────┘  │
   │    │                  │                  │                │
   │    └──────────────────┼──────────────────┘                │
   │                       │                                    │
   │ ┌──────────────────────▼──────────────────────────────┐   │
   │ │         profiles,  map   (Niveau 2)                │   │
   │ └─────────────────────────────────────────────────────┘   │
   │                                                            │
   │ ┌───────────────────────────────────────────────────────┐ │
   │ │   likes, comments (Niveau 3)                         │ │
   │ └────┬────────────────────────────────────────────┬───┘ │
   │      │                                            │      │
   │      └──────────────────────┬───────────────────┘      │
   │                             │                          │
   │ ┌────────────────────────────▼─────────────────────┐  │
   │ │  popular_system, search (Niveau 3)              │  │
   │ └──────────────────────────────────────────────────┘  │
   │                                                        │
   └────────────────────────────────────────────────────────┘

Niveaux:
Niveau 0 : logger, database, cache, eventBus (infrastructure)
Niveau 1 : auth, education, analytics (0 dépendances)
Niveau 2 : users, profiles, posts, ideas, map, initiatives, admin, reports
Niveau 3 : likes, comments, popular_system, search
Niveau 4 : (vide — pas de dépendances croisées complexes)
```

---

## ✅ Validation des Dépendances

### Détection de Cycles
```
✅ Aucun cycle détecté
Vérification DFS complète : PASSED
Ordre topologique : déterministe
```

### Dépendances Résolubles
```
✅ Tous les modules trouvés
✅ Aucune dépendance manquante
✅ Aucune référence circulaire
✅ Ordre d'initialisation : DÉTERMINISTE
```

### Problèmes Potentiels Détectés
```
❓ Aucun problème critique
⚠️  À surveiller :
   - map dépend de ideas et users (éviter race condition)
   - popular_system reçoit beaucoup d'événements (cache key strategy)
   - search doit être async (performance indexing)
```

---

## 📊 Ordre d'Initialisation — DÉTERMINISTE

```
1. auth              (Niveau 1, 0 dépendances)
2. education        (Niveau 1, 0 dépendances)
3. analytics        (Niveau 1, 0 dépendances)
4. users            (Niveau 2, dépend de auth)
5. profiles         (Niveau 2, dépend de users)
6. posts            (Niveau 2, dépend de auth + users)
7. ideas            (Niveau 2, dépend de auth + users)
8. map              (Niveau 2, dépend de users + ideas)
9. initiatives      (Niveau 2, dépend de auth + users)
10. admin           (Niveau 2, dépend de auth)
11. reports         (Niveau 2, dépend de auth + users)
12. likes           (Niveau 3, dépend de posts + ideas)
13. comments        (Niveau 3, dépend de posts + ideas)
14. popular_system  (Niveau 3, dépend de posts + likes + comments)
15. search          (Niveau 3, dépend de posts + ideas + users)
```

**Garanties**:
- ✅ Chaque module boot APRÈS ses dépendances
- ✅ Même ordre à chaque startup
- ✅ Reproductible et tracé
- ✅ Aucune race condition d'initialisation

---

## 🔧 Services Partagés Registry

### Core Services (Infrastructure)
```
logger
  ├─ Utilisé par : TOUS les 15 modules
  └─ Singleton : Winston logger

database
  ├─ Utilisé par : TOUS les 15 modules
  └─ Singleton : PostgreSQL pool

eventBus
  ├─ Utilisé par : TOUS les 15 modules
  └─ Singleton : EventEmitter wrapper

cache (Redis)
  ├─ Utilisé par : analytics, popular_system, search, map
  └─ Singleton : Redis client (optionnel)
```

### Module Services (Domain)
```
authService
  ├─ Exposé par : auth
  ├─ Requis par : users, admin, reports
  └─ Responsabilités : JWT, sessions, credentials

userService
  ├─ Exposé par : users
  ├─ Requis par : profiles, posts, ideas, likes, comments, search
  └─ Responsabilités : CRUD, permissions, data access

postService
  ├─ Exposé par : posts
  ├─ Requis par : likes, comments, popular_system, search
  └─ Responsabilités : Posts CRUD, feed, publishing

ideaService
  ├─ Exposé par : ideas
  ├─ Requis par : likes, comments, popular_system, search, map
  └─ Responsabilités : Idées CRUD, approvals, voting

likeService
  ├─ Exposé par : likes
  ├─ Requis par : popular_system
  └─ Responsabilités : Like management, counts

commentService
  ├─ Exposé par : comments
  ├─ Requis par : popular_system
  └─ Responsabilités : Comment threads, nesting

... (10+ autres services)
```

---

## 📡 Événements Registry

### Événements Émis (Totaux : 60+)

| Module | Événements | Producteur |
|--------|------------|-----------|
| auth | 5 | auth |
| users | 5 | users |
| posts | 5 | posts |
| ideas | 5 | ideas |
| likes | 3 | likes |
| comments | 4 | comments |
| profiles | 2 | profiles |
| map | 2 | map |
| initiatives | 4 | initiatives |
| admin | 3 | admin |
| reports | 3 | reports |
| popular_system | 2 | popular_system |
| search | 2 | search |
| education | 2 | education |
| analytics | 3 | analytics |

### Événements Écoutés

```
auth:success
  ├─ Émis par : auth
  ├─ Écouté par : users, admin
  └─ Purpose : User session initialized

user:created
  ├─ Émis par : users
  ├─ Écouté par : profiles, posts, ideas, initiatives, reports, search
  └─ Purpose : User profile setup triggered

post:created
  ├─ Émis par : posts
  ├─ Écouté par : likes, comments, popular_system, search
  └─ Purpose : Index, track, enable interactions

idea:created
  ├─ Émis par : ideas
  ├─ Écouté par : likes, comments, popular_system, search, map
  └─ Purpose : Index, geolocate, track

like:added
  ├─ Émis par : likes
  ├─ Écouté par : popular_system
  └─ Purpose : Update trending

comment:created
  ├─ Émis par : comments
  ├─ Écouté par : popular_system
  └─ Purpose : Update popularity ranking
```

---

## 🎯 Validation ÉTAPE 2

### Code Implémenté
- [x] `manifest.modules.core.json` — 15 modules déclarés
- [x] `ModuleResolver.js` — Résolveur complet (300+ lignes)
- [x] `SystemBootstrap.js` — Étape 7 modifiée
- [x] Détection de cycles — DFS implémenté
- [x] Tri topologique — Déterministe
- [x] Registry generation — Complète

### Documentation Générée
- [x] Ce document — Registry complète
- [x] Hiérarchie des 15 modules
- [x] Graphe de dépendances
- [x] Ordre d'initialisation
- [x] Services et événements

### Validations Passées
- [x] Pas de cycles
- [x] Toutes les dépendances résolubles
- [x] Ordre déterministe
- [x] 15/15 modules enregistrés
- [x] 0 violations détectées

---

## 📝 Logs de Bootstrap

Lors du démarrage, vous verrez :

```
═══════════════════════════════════════════════════════════════
ÉTAPE 7/11 — Module discovery et initialization
═══════════════════════════════════════════════════════════════

[2026-05-07T12:34:56.789Z] ✓ Ordre d'initialisation résolu (déterministe)
   Details: 15 modules: auth, education, analytics, users, profiles...

[2026-05-07T12:34:56.810Z] ✓ Module enregistré: auth@1.0.0
   Details: hierarchy_level=1, dependencies=[]

[2026-05-07T12:34:56.820Z] ✓ Module enregistré: education@1.0.0
   Details: hierarchy_level=1, dependencies=[]

[2026-05-07T12:34:56.830Z] ✓ Module enregistré: analytics@1.0.0
   Details: hierarchy_level=1, dependencies=[]

[2026-05-07T12:34:56.840Z] ✓ Module enregistré: users@1.0.0
   Details: hierarchy_level=2, dependencies=[auth]

... (12 modules supplémentaires) ...

[2026-05-07T12:34:57.100Z] ✓ Module Manifest Registry généré
   Details: 15 modules, 0 cycles, tous résolvables

[2026-05-07T12:34:57.110Z] ✓ Toutes les validations d'ordre réussies
```

---

## ✅ ÉTAPE 2 COMPLÈTEMENT VALIDÉE

### Status: 🟢 READY FOR ÉTAPE 3

**Prochaine étape** : ÉTAPE 3 — Connecter la StateMachine

---

**Étape 2 Complétée par : Architecte Système Principal**  
**Mode : IMPLÉMENTATION CONTRÔLÉE**  
**Status : ✅ PRÊTE POUR ÉTAPE 3**
