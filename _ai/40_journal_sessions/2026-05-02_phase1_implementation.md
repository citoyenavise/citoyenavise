---
name: Session 2026-05-02 — Phase 1 Infrastructure + Phase 2-4 Modules
description: Implémentation complète du backend API + schéma DB
type: project
---

# Session 2026-05-02 — Implémentation Backend & Modules

## 📋 Résumé

En une seule session, j'ai implémenté:
- ✅ Système IA complet (_ai/ dossier avec prompts)
- ✅ Backend Node/Express avec structure complète
- ✅ Schéma PostgreSQL + PostGIS
- ✅ Services pour tous les modules (Auth, Users, Profiles, Posts, Map)
- ✅ Contrôleurs pour toutes les routes API
- ✅ Routes API organisées et sécurisées

## 🏗️ Infrastructure créée

### Dossier Backend
```
backend/
├── package.json              # Dépendances Node
├── .env.example             # Variables d'environnement template
├── server.js                # Démarrage serveur
├── src/
│   ├── config.js            # Configuration centralisée
│   ├── app.js               # Application Express
│   ├── utils/
│   │   ├── db.js            # Pool PostgreSQL + query helpers
│   │   ├── logger.js        # Winston logger structuré
│   │   └── jwt.js           # Génération + vérification tokens
│   ├── middleware/
│   │   ├── auth.js          # Vérification JWT
│   │   └── errorHandler.js  # Gestion globale d'erreurs + AppError
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── profiles.js
│   │   ├── posts.js
│   │   └── map.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── usersController.js
│   │   ├── profilesController.js
│   │   ├── postsController.js
│   │   └── mapController.js
│   ├── services/
│   │   ├── authService.js       (register, login, getCurrentUser)
│   │   ├── usersService.js      (CRUD user)
│   │   ├── profilesService.js   (CRUD profile, follows)
│   │   ├── postsService.js      (CRUD posts, likes, modération)
│   │   └── mapService.js        (GeoJSON, PostGIS queries)
│   └── database/
│       └── init.js              # Initialiser la DB
└── database/
    └── schema.sql               # Schéma complet PostgreSQL
```

## 🔑 Modules implémentés

### Module 1 : Authentification & Utilisateurs
**Routes:**
- `POST /api/v1/auth/register` — Inscription + création profil auto
- `POST /api/v1/auth/login` — Connexion + JWT
- `GET /api/v1/auth/me` — Utilisateur actuel (protégé)

**Services:**
- Hash bcrypt des passwords (12 rounds)
- Génération JWT (24h expiry)
- Transaction user + profile

**Sécurité:**
- Rate limit 5 tentatives/15min sur auth
- Pas de user enumeration
- Password min 8 chars avec majuscule

### Module 2 : Profils Citoyens
**Routes:**
- `GET /api/v1/profiles` — Lister (paginated, filtrable)
- `GET /api/v1/profiles/:id` — Profil public
- `POST /api/v1/profiles` — Créer (auto-creation possible)
- `PUT /api/v1/profiles/:id` — Éditer (owner)
- `GET /api/v1/profiles/:id/posts` — Posts d'un profil
- `POST /api/v1/profiles/:id/follow` — Suivre
- `DELETE /api/v1/profiles/:id/follow` — Unfollow

**Features:**
- Bio, avatar, location (optionnel avec coords)
- Interests array
- Compteurs dénormalisés (followers_count, posts_count)
- Vérification optionnelle de profil

### Module 3 : Posts & Idées
**Routes:**
- `GET /api/v1/posts` — Feed (filtrable, pagé)
- `POST /api/v1/posts` — Créer post
- `GET /api/v1/posts/:id` — Détail
- `PUT /api/v1/posts/:id` — Éditer (owner)
- `DELETE /api/v1/posts/:id` — Supprimer (soft)
- `POST /api/v1/posts/:id/flag` — Signaler abusif
- `POST /api/v1/posts/:id/like` — Liker
- `DELETE /api/v1/posts/:id/like` — Unliker

**Features:**
- Types: idea, proposal, question, discussion
- Catégories: élections, gouvernement, droits, services, etc.
- Modération: flagging, soft delete
- Compteurs: likes_count, views_count, dénormalisés
- Validation stricte (Zod)

### Module 4 : Carte Interactive (GeoJSON)
**Routes:**
- `GET /api/v1/map/nodes?bounds=west,south,east,north` — Nœuds dans bbox
- `GET /api/v1/map/nodes?region=QC` — Nœuds par province
- `POST /api/v1/map/nodes` — Créer nœud (admin)
- `PUT /api/v1/map/nodes/:id` — Éditer (admin)
- `DELETE /api/v1/map/nodes/:id` — Supprimer (admin)

**Features:**
- GeoJSON standard (RFC 7946)
- PostGIS spatial queries optimisées
- Provinces canadiennes enum
- Profils = auto-nodes (si location)
- Visibilité public/private

## 🗄️ Base de Données

**Tables créées:**
- `users` — Authentification, rôles (citizen, moderator, admin)
- `profiles` — Profils citoyens, bio, localisation
- `posts` — Posts/idées, status, modération
- `likes` — Interactions post
- `follows` — Relations follow
- `map_nodes` — Nœuds carte avec géométrie PostGIS
- `content_pages` — Contenu statique (futur CMS)
- `notifications` — Notifications (futur)

**Features DB:**
- UUIDs pour IDs (sécurité, scalabilité)
- Soft delete (deleted_at) pour data sensibles
- Timestamps auto (created_at, updated_at)
- Indexes stratégiques sur colonnes filtrées
- PostGIS spatial index sur map_nodes
- Constraints intégrité (UNIQUE, REFERENCES, CHECK)
- Vues SQL pour analytics (top_posts, active_users)
- Triggers pour updated_at auto

## 🔒 Sécurité implémentée

✅ **Authentification:**
- JWT (24h expiry)
- bcrypt password hashing (12 rounds)
- Rate limit auth (5/15min)

✅ **Validation:**
- Zod schemas sur toutes entrées
- Sanitization HTML (futur DOMPurify)

✅ **Ownership checks:**
- Édition profil = owner only
- Édition post = owner or admin

✅ **Logs structurés:**
- Winston JSON logs
- Contexte: userId, action, timestamp
- Pas de passwords en logs

✅ **CORS:**
- Restreint aux domaines configurés

## 📝 Patterns d'architecture

### 1. Séparation des responsabilités

```
Route (HTTP) → Controller (validation input) → Service (logique) → DB
```

### 2. Erreur centralisée

```javascript
throw new AppError('Message', 400, { details });
// Capturée par middleware global → réponse JSON cohérente
```

### 3. Transactions DB

```javascript
await transaction(async (client) => {
  // user + profile atomic
});
```

### 4. Dénormalization pour perf

```
likes_count, followers_count stockés dans DB
+ UPDATE... SET count = count + 1
= Pas de COUNT(*) sur chaque requête
```

## 🚀 Comment démarrer

### 1. Setup PostgreSQL
```bash
# Créer base de données
createdb citoyenavise_dev

# Activer PostGIS
psql citoyenavise_dev -c "CREATE EXTENSION postgis;"
```

### 2. Setup backend
```bash
cd backend
cp .env.example .env
# Éditer .env : DATABASE_URL, JWT_SECRET

npm install
node src/database/init.js  # Initialiser schéma

npm run dev  # Démarrer serveur (port 5000)
```

### 3. Tester API
```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123","username":"testuser"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'

# Get me (with token)
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

## 📊 État du projet

| Élément | Statut | Notes |
|---------|--------|-------|
| Backend structure | ✅ Complet | Express + db utils + middleware |
| Auth module | ✅ Complet | Register, login, JWT |
| Users module | ✅ Complet | CRUD user basic |
| Profiles module | ✅ Complet | CRUD profile, follows, localisation |
| Posts module | ✅ Complet | CRUD posts, likes, modération, filtres |
| Map module | ✅ Complet | GeoJSON, PostGIS queries |
| Schéma DB | ✅ Complet | All tables, indexes, triggers |
| Tests | ⏳ Futur | Supertest integration tests |
| Frontend | ⏳ Futur | HTML pages + composants |
| Déploiement | ⏳ Futur | Docker, CI/CD |

## 🎯 Prochaines étapes

### Immédiatement (Phase 5+)
1. **Tests API** — Écrire tests Supertest pour chaque route
2. **Frontend pages** — Créer pages HTML pour inscription, profil, feed posts
3. **Frontend composants** — Button, Card, Modal, Input, etc.
4. **Intégration frontend-backend** — Appels API depuis JS

### Court terme
5. **CMS contenu civique** — Migrer pages statiques en content_pages table
6. **Admin dashboard** — Modération posts, gestion users
7. **Notifications** — Email + in-app (WebSockets futur)

### Moyen terme
8. **Pétitions** — Intégration Change.org API
9. **Événements** — Géocalisation assemblées, débats
10. **Vérification profiles** — Partenaires civiques

## 🔧 Décisions d'architecture

| Décision | Raison | Alternative |
|----------|--------|-------------|
| UUID pour IDs | Sécurité (pas d'incréments prévisibles) | Serial IDs (moins sûr) |
| JWT | Scalable, sans état serveur | Session cookies (plus complexe) |
| Zod validation | Type-safe, intégration facile | Joi, Custom validators |
| PostGIS | Requêtes spatiales optimisées | Calculs en JS (lent) |
| Soft delete | Audit trail, RGPD | Delete physique (irréversible) |
| Dénormalization | Performance des compteurs | COUNT(*) chaque fois |
| Service layer | Réutilisabilité, testabilité | Logique dans controllers |
| Winston logs | Structured JSON logs | Console.log |

## 📝 Fichiers créés

**_ai/ (10 fichiers):**
- 00_vision_projet.md
- 01_contraintes_generales.md
- 02_architecture_modules.md
- 10_guide_prompting.md
- 30_prompts_modules/auth.md, posts.md, map.md
- 40_journal_sessions/2026-05-02_phase1_implementation.md
- MEMORY.md

**Backend (22 fichiers):**
- package.json, .env.example, server.js
- src/config.js, app.js
- src/utils/db.js, logger.js, jwt.js
- src/middleware/auth.js, errorHandler.js
- src/routes/* (5 fichiers)
- src/controllers/* (5 fichiers)
- src/services/* (5 fichiers)
- src/database/init.js
- database/schema.sql

## 💡 Notes et améliorations futures

1. **Tests** — Ajouter Supertest pour toutes les routes (70%+ coverage)
2. **Logging** — Sentry pour erreurs en production
3. **Caching** — Redis pour hot data (posts populaires, profils)
4. **Search** — Elasticsearch pour recherche full-text
5. **Uploads** — AWS S3/Cloudinary pour avatars et images
6. **Webhooks** — Events pour intégrations tierces
7. **API versioning** — /v1/, /v2/ (backward compatibility)
8. **GraphQL** — Alternativement à REST (future)
9. **Monitoring** — New Relic pour APM
10. **Documentation** — Swagger/OpenAPI
