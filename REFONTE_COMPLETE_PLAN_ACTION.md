# 🚀 REFONTE COMPLÈTE — PLAN D'ACTION DÉTAILLÉ
**Date**: 2 mai 2026  
**Statut**: 📋 À implémenter  
**Responsable IA**: Claude Code  

---

## 📊 DIAGNOSTIC ACTUEL

### ✅ Ce qui existe (excellent!)

| Élément | État | Détail |
|---------|------|--------|
| **Vision & contraintes** | ✅ Complète | 00_vision_projet.md, 01_contraintes_generales.md |
| **Architecture documentée** | ✅ Complète | 02_architecture_modules.md (6 modules MVP + 28 modules totaux) |
| **Système IA structuré** | ⚠️ Partiel | _ai/ existe, manquent prompts complets |
| **Structure backend** | ✅ Skeleton | Dossiers modules créés, routes vides |
| **Structure frontend** | ✅ Skeleton | public/src/modules/ créés, pages vides |
| **Package.json backend** | ✅ Complet | Dépendances Express, PostgreSQL, JWT, etc. |
| **Pages HTML statiques** | ✅ Présentes | 50+ pages en racine (index.html, gouvernement.html, etc.) |
| **MVP Checklist** | ✅ Détaillé | Plan complet, but checklist = future, pas implémenté |

### ❌ Ce qui manque (gaps à combler)

| Gap | Impact | Priorité |
|-----|--------|----------|
| **Fichiers implémentation backend** | Blocker : pas de server.js, routes vides | 🔴 CRITIQUE |
| **Fichiers implémentation frontend** | Blocker : pas d'app.js, pages vides | 🔴 CRITIQUE |
| **Configuration & secrets (.env)** | Blocker : pas de config | 🔴 CRITIQUE |
| **Migration pages HTML statiques** | Important : doublons, pas intégrés | 🟡 HAUTE |
| **Système IA complet** | Important : prompts manquent | 🟡 HAUTE |
| **Points d'entrée (entry.js, main.js)** | Important : comment lancer? | 🟡 HAUTE |
| **Docker & deployment** | Nice-to-have : futur | 🟢 BASSE |
| **Tests** | Nice-to-have : futur | 🟢 BASSE |

### 📈 État de complétude

```
Documentation         : 85% (vision, contraintes, modules, flow)
Architecture         : 80% (structure dossiers, schema DB)
Implémentation       : 5%  (quelques fichiers config seulement)
Système IA           : 50% (vision ok, prompts à finir)
Tests                : 0%  (optionnel MVP)
Déploiement          : 0%  (optionnel MVP)
────────────────────────────────────────────
TOTAL               : ~40% (bien documenté, à implémenter)
```

---

## 🎯 OBJECTIF

Créer une **base 100% fonctionnelle et prête au développement**:
1. ✅ Architecture unifiée (backend + frontend + IA)
2. ✅ Tous les fichiers de base créés
3. ✅ Points d'entrée clairs (server.js, app.js)
4. ✅ Configuration centralisée (.env)
5. ✅ Pages HTML statiques intégrées
6. ✅ Système IA complet et utilisable
7. ✅ Premiers modules (auth, users, profiles) fonctionnels

**Résultat**: `npm run dev` ou `npm start` = système opérationnel

---

## 🏗️ SECTION 1: DIAGNOSTIC DÉTAILLÉ DU CONTENU STATIQUE

### 1.1 Pages HTML statiques existantes (inventaire)

**Racine du projet:**
```
INDEX:
  index.html (accueil FR)

CONTENU CIVIQUE:
  gouvernement.html, droits.html, constitution.html, judiciaire.html
  parlement.html, provincial.html, municipal.html, elections.html
  politique-confidentialite.html, conditions-utilisation.html
  charte.html, accessibilite.html, glossaire.html

SERVICES PUBLICS:
  services.html, assurance-emploi.html, impots.html, retraite.html
  sante.html, education.html, logement.html, environnement.html
  securite.html

INFOS GÉOGRAPHIQUES:
  villes.html, carte.html

RESSOURCES:
  ressources.html, actualites.html, calendrier.html, quiz.html
  petitions.html, groupes.html, elus.html

PROFILS:
  profil.html, ville.html

BROUILLONS/WIP:
  _brouillons/laval-nouveau-profil.html
  _brouillons/services-nouveau-format.html
```

**Anglais (en/ dossier):**
```
Versions EN de tous les fichiers (index, government, rights, map, etc.)
```

### 1.2 Analyse des doublons & patterns

**Observation clé**: 
- Pages FR et EN sont identiques (doublées)
- Pages de contenu partagent structure commune (header, footer, sections)
- Beaucoup de contenu statique qui devrait être en base de données (CMS)

**Recommandation**:
→ Créer une structure `/pages/` centralisée avec bilingue intégré
→ Migrer progressivement vers CMS (module 6)

---

## 🎨 SECTION 2: NOUVELLE STRUCTURE DE PROJET

### 2.1 Arborescence UNIFIÉE et PROGRESSIVE

```
citoyenavise/
│
├── 📁 backend/                          # API + Logic métier
│   ├── package.json                     # Dépendances backend
│   ├── server.js                        # Entry point
│   ├── .env.example                     # Template config
│   ├── .env                             # Config locale (gitignored)
│   │
│   ├── src/
│   │   ├── app.js                       # Express app
│   │   ├── config.js                    # Configuration centralisée
│   │   ├── server.js                    # Server init
│   │   │
│   │   ├── core/
│   │   │   ├── middleware/
│   │   │   │   ├── auth.js              # JWT validation
│   │   │   │   ├── errorHandler.js      # Global error handling
│   │   │   │   ├── validation.js        # Input validation
│   │   │   │   └── logging.js           # Request logging
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── database.js          # DB connection pool
│   │   │   │   ├── mail.js              # Email service (future)
│   │   │   │   ├── cache.js             # Cache service (future)
│   │   │   │   └── storage.js           # File storage (future)
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── logger.js            # Winston logger
│   │   │   │   ├── jwt.js               # JWT helpers
│   │   │   │   ├── crypto.js            # Encryption
│   │   │   │   ├── validators.js        # Validation helpers
│   │   │   │   └── errors.js            # Custom error classes
│   │   │   │
│   │   │   ├── constants/
│   │   │   │   ├── roles.js             # User roles
│   │   │   │   ├── categories.js        # Content categories
│   │   │   │   ├── statuses.js          # Post statuses
│   │   │   │   └── errors.js            # HTTP error codes
│   │   │   │
│   │   │   └── types/
│   │   │       └── index.d.ts           # TypeScript types (optionnel)
│   │   │
│   │   ├── modules/                     # FEATURE modules
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── routes.js            # GET /register, POST /login, etc.
│   │   │   │   ├── controller.js        # Handle requests
│   │   │   │   ├── service.js           # Business logic
│   │   │   │   ├── schema.js            # Zod validation
│   │   │   │   └── index.js             # Module export
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── routes.js
│   │   │   │   ├── controller.js
│   │   │   │   ├── service.js
│   │   │   │   ├── schema.js
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── profiles/
│   │   │   ├── posts/
│   │   │   ├── ideas/
│   │   │   ├── map/
│   │   │   ├── likes/
│   │   │   ├── notifications/
│   │   │   ├── search/
│   │   │   ├── content/
│   │   │   ├── admin/
│   │   │   ├── moderation/
│   │   │   └── [22 autres modules]
│   │   │
│   │   └── database/
│   │       ├── init.js                  # Init DB
│   │       ├── schema.sql               # Schema complet
│   │       ├── seed.js                  # Data initial (optionnel)
│   │       └── migrations/
│   │           ├── 001_initial.sql
│   │           ├── 002_posts.sql
│   │           └── [migrations futures]
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   └── README.md                        # Backend setup docs
│
│
├── 📁 frontend/                         # Client-side app
│   ├── package.json                     # Dépendances frontend (futur React/Vue)
│   ├── .env.example
│   ├── .env
│   │
│   ├── public/
│   │   ├── index.html                   # Entry HTML
│   │   ├── favicon.ico
│   │   └── robots.txt
│   │
│   ├── src/
│   │   ├── app.js                       # App entry point
│   │   ├── router.js                    # Routing logic
│   │   │
│   │   ├── core/
│   │   │   ├── api/
│   │   │   │   ├── client.js            # HTTP client wrapper
│   │   │   │   ├── auth.js              # Auth endpoints
│   │   │   │   ├── users.js
│   │   │   │   ├── profiles.js
│   │   │   │   ├── posts.js
│   │   │   │   ├── map.js
│   │   │   │   └── [autres endpoints]
│   │   │   │
│   │   │   ├── store/
│   │   │   │   ├── index.js             # State management
│   │   │   │   ├── user.js              # User state
│   │   │   │   ├── posts.js             # Posts state
│   │   │   │   └── map.js               # Map state
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── helpers.js           # General helpers
│   │   │       ├── formatters.js        # Date, number formatting
│   │   │       ├── validators.js        # Client-side validation
│   │   │       └── constants.js         # Constants
│   │   │
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── header.js
│   │   │   │   ├── footer.js
│   │   │   │   ├── navigation.js
│   │   │   │   ├── button.js
│   │   │   │   ├── card.js
│   │   │   │   ├── modal.js
│   │   │   │   ├── form.js
│   │   │   │   ├── toast.js
│   │   │   │   ├── spinner.js
│   │   │   │   └── [autres composants]
│   │   │   │
│   │   │   ├── layouts/
│   │   │   │   ├── app-layout.js        # Layout principal
│   │   │   │   ├── auth-layout.js       # Layout login/register
│   │   │   │   └── blank-layout.js      # Minimal layout
│   │   │   │
│   │   │   ├── css/
│   │   │   │   ├── reset.css            # CSS reset
│   │   │   │   ├── variables.css        # Tokens (couleurs, spacing)
│   │   │   │   ├── base.css             # Base styles
│   │   │   │   ├── components.css       # Component styles
│   │   │   │   └── utilities.css        # Utility classes
│   │   │   │
│   │   │   └── js/
│   │   │       └── [composant helpers]
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── login.html
│   │   │   │   │   └── register.html
│   │   │   │   ├── js/
│   │   │   │   │   ├── auth-module.js
│   │   │   │   │   └── forms.js
│   │   │   │   ├── css/
│   │   │   │   │   └── auth.css
│   │   │   │   └── index.js
│   │   │   │
│   │   │   ├── home/
│   │   │   ├── profiles/
│   │   │   ├── posts/
│   │   │   ├── map/
│   │   │   ├── content/
│   │   │   ├── admin/
│   │   │   └── [autres modules]
│   │   │
│   │   ├── pages/
│   │   │   ├── 404.html
│   │   │   ├── 500.html
│   │   │   └── [pages réutilisables]
│   │   │
│   │   └── assets/
│   │       ├── images/
│   │       ├── icons/
│   │       └── fonts/
│   │
│   ├── tests/
│   └── README.md
│
│
├── 📁 public/                           # LEGACY - À MIGRER
│   ├── pages/ (old)
│   ├── js/ (old)
│   └── css/ (old)
│
│
├── 📁 _ai/                              # IA & DOCUMENTATION
│   ├── 00_vision_projet.md              # Vision + objectifs ✅
│   ├── 01_contraintes_generales.md      # Contraintes tech ✅
│   ├── 02_architecture_modules.md       # Architecture ✅
│   ├── 10_guide_prompting.md            # Comment utiliser l'IA
│   │
│   ├── 20_prompts_systeme/              # Prompts réutilisables
│   │   ├── nouveau-module.md            # Template: créer module
│   │   ├── nouveau-endpoint.md          # Template: créer route API
│   │   ├── nouveau-composant.md         # Template: créer composant
│   │   ├── migration-db.md              # Template: migration DB
│   │   ├── test-api.md                  # Template: tester API
│   │   └── debug-issue.md               # Template: debug problème
│   │
│   ├── 30_prompts_modules/              # Prompts par module
│   │   ├── auth.md
│   │   ├── users.md
│   │   ├── profiles.md
│   │   ├── posts.md
│   │   ├── ideas.md
│   │   ├── map.md
│   │   ├── likes.md
│   │   ├── notifications.md
│   │   ├── search.md
│   │   ├── admin.md
│   │   ├── moderation.md
│   │   ├── content.md
│   │   └── [autres]
│   │
│   ├── 40_journal_sessions/             # Historique décisions
│   │   ├── 2026-05-02_phase1_setup.md
│   │   ├── 2026-05-02_architecture_finale.md
│   │   └── [sessions futures]
│   │
│   ├── MEMORY.md                        # Index mémoire IA
│   └── decisions.md                     # Décisions architecturales
│
│
├── 📁 database/                         # LEGACY - À ARCHIVER
│   └── schema.sql (old)
│
│
├── 📁 docs/                             # DOCUMENTATION
│   ├── ARCHITECTURE.md                  # Guide complet
│   ├── API.md                          # Documentation API
│   ├── FRONTEND.md                     # Guide frontend
│   ├── DEPLOYMENT.md                   # Déploiement
│   ├── CONTRIBUTING.md                 # Contribution guide
│   └── TROUBLESHOOTING.md              # Dépannage
│
│
├── 📁 .github/                          # CI/CD
│   ├── workflows/
│   │   ├── test.yml
│   │   ├── lint.yml
│   │   └── deploy.yml
│   └── ISSUE_TEMPLATE.md
│
│
├── docker-compose.yml                   # Local dev Docker
├── Dockerfile                           # Production Docker
├── .env.example                         # Template secrets
├── .env.local                           # Local config (gitignored)
├── .gitignore                           # Git ignores
├── CLAUDE.md                            # Instructions IA (ce fichier)
├── package.json                         # Root package (optional)
├── README.md                            # Project overview
├── ROADMAP.md                           # Futures features
└── LICENSE                              # MIT License
```

### 2.2 Conventions de nommage

| Élément | Convention | Exemple |
|---------|-----------|---------|
| **Dossiers** | kebab-case | `user-profiles/`, `map-nodes/` |
| **Fichiers JS** | camelCase | `authService.js`, `userController.js` |
| **Fichiers HTML** | kebab-case | `login-page.html`, `user-profile.html` |
| **Classes CSS** | kebab-case | `.btn-primary`, `.card-user` |
| **IDs HTML** | kebab-case | `#search-input`, `#modal-confirm` |
| **Routes API** | kebab-case | `/api/v1/posts/`, `/api/v1/map-nodes/` |
| **Variables JS** | camelCase | `currentUser`, `isLoggedIn` |
| **Constantes** | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_ITEMS` |

---

## 📦 SECTION 3: MODULES MVP STRUCTURÉS

### 3.1 Dépendances entre modules

```
┌─────────────────────────────────────────────────┐
│ Core Infrastructure                             │
│ - Config (DB, JWT, logging)                     │
│ - Middleware (auth, errors, validation)         │
│ - Utils (logger, jwt, crypto)                   │
└──────────────────┬──────────────────────────────┘
                   │
       ┌───────────┼────────────────┐
       ▼           ▼                ▼
   ┌────────┐  ┌────────┐      ┌────────┐
   │  Auth  │  │ Users  │      │ Content│
   │ Module │  │ Module │      │ Module │
   └───┬────┘  └───┬────┘      └────────┘
       │           │
       └─────┬─────┘
             ▼
       ┌──────────────┐
       │   Profiles   │ ← (depends on Auth+Users)
       └──────┬───────┘
              │
    ┌─────────┼──────────┬──────────┐
    ▼         ▼          ▼          ▼
 ┌─────┐  ┌───────┐  ┌────────┐  ┌─────┐
 │Posts│  │ Ideas │  │  Map   │  │Like │
 └─────┘  └───────┘  └────────┘  └─────┘
    │         │          │         │
    └─────────┴──────────┴─────────┘
             ▼
       ┌──────────────┐
       │Notifications │ (optional)
       │ Moderation   │ (optional)
       │  Analytics   │ (optional)
       └──────────────┘
```

### 3.2 Vue d'ensemble des 6 modules MVP

| # | Module | Responsabilité | État |
|---|--------|-----------------|------|
| 1 | **Auth** | Inscription, login, JWT tokens | 🔴 À créer |
| 2 | **Users** | Gestion utilisateurs, profils basiques | 🔴 À créer |
| 3 | **Profiles** | Profils citoyens détaillés, bio, localisation | 🔴 À créer |
| 4 | **Posts** | Posts/idées, modération, compteurs | 🔴 À créer |
| 5 | **Map** | Visualisation GeoJSON, PostGIS queries | 🔴 À créer |
| 6 | **Content** | Pages civiques statiques → CMS | 🔴 À créer |

### 3.3 Modules optionnels MVP+ (futures)

| # | Module | Statut |
|---|--------|--------|
| 7 | **Notifications** | 🟡 Phase 2 |
| 8 | **Search** | 🟡 Phase 2 |
| 9 | **Admin** | 🟡 Phase 2 |
| 10-28 | Autres modules | 🟢 Phase 3+ |

---

## 🗄️ SECTION 4: BASE DE DONNÉES

### 4.1 Schéma MVP (8 tables)

```sql
-- Table 1: Users (authentification)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'citizen' NOT NULL, -- citizen, moderator, admin
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP NULL -- soft delete
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Table 2: Profiles (infos publiques)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url VARCHAR(500),
  location VARCHAR(200),
  interests JSONB DEFAULT '[]'::jsonb, -- ['élections', 'environnement']
  followers_count INT DEFAULT 0,
  posts_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- Table 3: Follows (relations)
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Table 4: Posts (contenu utilisateur)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- idea, question, discussion, proposal
  category VARCHAR(100) NOT NULL, -- élections, environnement, etc.
  status VARCHAR(50) DEFAULT 'published', -- published, flagged, archived
  likes_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP NULL -- soft delete
);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_deleted_at ON posts(deleted_at);

-- Table 5: Likes (reactions)
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, post_id)
);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);

-- Table 6: Map Nodes (géolocalisation)
CREATE TABLE map_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  node_type VARCHAR(50) DEFAULT 'citizen', -- citizen, organization, event
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  province VARCHAR(50) NOT NULL, -- QC, ON, etc.
  municipality VARCHAR(100),
  geom GEOMETRY(Point, 4326), -- PostGIS point
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_map_nodes_profile_id ON map_nodes(profile_id);
CREATE INDEX idx_map_nodes_province ON map_nodes(province);
CREATE SPATIAL INDEX idx_map_nodes_geom ON map_nodes USING GIST(geom);

-- Table 7: Content Pages (CMS statique → dynamique)
CREATE TABLE content_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL, -- 'gouvernement', 'droits', etc.
  title_fr VARCHAR(500) NOT NULL,
  title_en VARCHAR(500) NOT NULL,
  content_fr TEXT NOT NULL,
  content_en TEXT NOT NULL,
  meta_description_fr VARCHAR(255),
  meta_description_en VARCHAR(255),
  is_published BOOLEAN DEFAULT false,
  order_index INT DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_content_pages_slug ON content_pages(slug);
CREATE INDEX idx_content_pages_published ON content_pages(is_published);

-- Table 8: Flags/Reports (modération)
CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flagged_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL, -- spam, abuse, misinformation
  resolved_at TIMESTAMP NULL,
  resolved_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_flags_post_id ON flags(post_id);
CREATE INDEX idx_flags_resolved_at ON flags(resolved_at);

-- Vue SQL: Top posts (aide analytics)
CREATE VIEW top_posts_7days AS
SELECT id, title, likes_count, views_count, created_at
FROM posts
WHERE created_at >= now() - interval '7 days'
  AND status = 'published'
  AND deleted_at IS NULL
ORDER BY likes_count DESC
LIMIT 50;

-- Vue SQL: Active users
CREATE VIEW active_users_30days AS
SELECT u.id, u.username, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
  AND p.created_at >= now() - interval '30 days'
  AND p.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.username
ORDER BY post_count DESC;
```

### 4.2 Migrations future

```
migrations/
├── 001_initial.sql        # ← À créer (tables ci-dessus)
├── 002_add_flags.sql      # ← Dans 001 pour MVP
├── 003_add_content.sql    # ← Dans 001 pour MVP
├── 004_add_analytics.sql  # ← Phase 2
├── 005_add_webhooks.sql   # ← Phase 3
└── [futures]
```

---

## 🔌 SECTION 5: BACKEND - ARCHITECTURE & IMPLÉMENTATION

### 5.1 Routes API principales (MVP)

```
AUTH:
  POST   /api/v1/auth/register         → Créer compte
  POST   /api/v1/auth/login            → Connexion
  POST   /api/v1/auth/refresh          → Renouveler token
  POST   /api/v1/auth/logout           → Déconnexion
  GET    /api/v1/auth/me               → Info utilisateur actuel

USERS:
  GET    /api/v1/users/:id             → Info utilisateur
  PUT    /api/v1/users/:id             → Modifier profil (owner)
  DELETE /api/v1/users/:id             → Supprimer compte (owner)

PROFILES:
  GET    /api/v1/profiles              → Lister tous (pagé, filtrable)
  POST   /api/v1/profiles              → Créer profil (auth)
  GET    /api/v1/profiles/:id          → Détail profil
  PUT    /api/v1/profiles/:id          → Éditer (owner)
  POST   /api/v1/profiles/:id/follow   → Suivre
  DELETE /api/v1/profiles/:id/follow   → Ne plus suivre
  GET    /api/v1/profiles/:id/followers → Followers list

POSTS:
  GET    /api/v1/posts                 → Feed (pagé, filtrable)
  POST   /api/v1/posts                 → Créer post (auth)
  GET    /api/v1/posts/:id             → Détail post
  PUT    /api/v1/posts/:id             → Éditer (owner)
  DELETE /api/v1/posts/:id             → Soft delete (owner)
  POST   /api/v1/posts/:id/like        → Like (auth)
  DELETE /api/v1/posts/:id/like        → Unlike (auth)
  POST   /api/v1/posts/:id/flag        → Signaler (auth)

MAP:
  GET    /api/v1/map/nodes             → GeoJSON (bbox required)
  GET    /api/v1/map/nodes?region=QC   → Par région
  POST   /api/v1/map/nodes             → Créer nœud (admin)
  PUT    /api/v1/map/nodes/:id         → Éditer nœud (admin)
  DELETE /api/v1/map/nodes/:id         → Supprimer nœud (admin)

CONTENT:
  GET    /api/v1/content/pages         → Lister pages
  GET    /api/v1/content/pages/:slug   → Page par slug
  PUT    /api/v1/content/pages/:slug   → Éditer (admin)

HEALTH:
  GET    /health                       → Health check
  GET    /api/v1/health                → API health
```

### 5.2 Organisation des modules backend

Chaque module suit ce pattern:

```javascript
// modules/auth/index.js — Export principal
module.exports = {
  routes: require('./routes'),
  controller: require('./controller'),
  service: require('./service'),
  schema: require('./schema'),
};

// modules/auth/routes.js — Express Router
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const auth = require('../../core/middleware/auth');
const validate = require('../../core/middleware/validation');

router.post('/register', validate(schema.register), controller.register);
router.post('/login', validate(schema.login), controller.login);
router.get('/me', auth, controller.getMe);

module.exports = router;

// modules/auth/controller.js — Request handlers
class AuthController {
  async register(req, res) {
    try {
      const { email, password, username } = req.body;
      const user = await AuthService.register(email, password, username);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;
    const token = await AuthService.login(email, password);
    res.json({ token });
  }
}

module.exports = new AuthController();

// modules/auth/service.js — Business logic
class AuthService {
  static async register(email, password, username) {
    // Vérifier email unique
    // Hash password avec bcrypt
    // Créer user en DB
    // Retourner user (sans password!)
  }

  static async login(email, password) {
    // Vérifier email existe
    // Comparer password
    // Générer JWT token
    // Retourner token
  }
}

// modules/auth/schema.js — Zod validation
const { z } = require('zod');

const register = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(50),
});

const login = z.object({
  email: z.string().email(),
  password: z.string(),
});

module.exports = { register, login };
```

### 5.3 Fichiers core à créer

```javascript
// src/config.js — Configuration centralisée
module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  
  database: {
    url: process.env.DATABASE_URL,
    poolSize: process.env.DB_POOL_SIZE || 10,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiryAccess: process.env.JWT_EXPIRY_ACCESS || '24h',
    expiryRefresh: process.env.JWT_EXPIRY_REFRESH || '7d',
  },
  
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};

// src/app.js — Express setup
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const app = express();

app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
});
app.use('/api/v1/auth/', limiter);

// Routes
app.use('/api/v1/auth', require('./modules/auth/routes'));
app.use('/api/v1/users', require('./modules/users/routes'));
// ... etc

// Error handler
app.use(require('./core/middleware/errorHandler'));

module.exports = app;

// server.js — Server entry point
const app = require('./src/app');
const config = require('./src/config');
const database = require('./src/core/services/database');

async function start() {
  try {
    await database.init();
    console.log('✅ Database connected');
    
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
```

---

## 🎨 SECTION 6: FRONTEND - ARCHITECTURE & IMPLÉMENTATION

### 6.1 Pages principales (MVP)

```
frontend/src/modules/

auth/
├── pages/
│   ├── login.html      ← Formulaire login
│   └── register.html   ← Formulaire inscription
├── js/
│   ├── auth-module.js  ← Logic auth
│   └── forms.js        ← Form validation
└── css/
    └── auth.css        ← Styles

home/
├── pages/
│   └── index.html      ← Accueil + carte
├── js/
│   └── home-module.js
└── css/
    └── home.css

profiles/
├── pages/
│   ├── list.html       ← Liste profils
│   └── detail.html     ← Profil détail
├── js/
│   ├── profiles-module.js
│   └── profile-form.js
└── css/
    └── profiles.css

posts/
├── pages/
│   ├── feed.html       ← Fil de posts
│   └── detail.html     ← Post détail
├── js/
│   ├── posts-module.js
│   └── post-form.js
└── css/
    └── posts.css

map/
├── pages/
│   └── index.html      ← Carte interactive
├── js/
│   └── map-module.js   ← Leaflet logic
└── css/
    └── map.css

[autres modules...]
```

### 6.2 Composants réutilisables (shared/)

```
shared/components/
├── header.js           ← Navigation + auth
├── footer.js           ← Pied de page
├── button.js           ← Boutons
├── card.js             ← Cartes génériques
├── modal.js            ← Modales
├── form.js             ← Formulaires
├── toast.js            ← Notifications
├── spinner.js          ← Loaders
├── avatar.js           ← Avatars
├── badge.js            ← Badges
├── pagination.js       ← Pagination
└── [autres]

shared/layouts/
├── app-layout.js       ← Layout principal (header + footer)
├── auth-layout.js      ← Layout login (minimal)
└── blank-layout.js     ← Pas de layout

shared/css/
├── reset.css           ← CSS reset
├── variables.css       ← Design tokens
├── base.css            ← Base styles
├── components.css      ← Styles composants
└── utilities.css       ← Classes utilitaires
```

### 6.3 Core services (app logic)

```javascript
// src/core/api/client.js — HTTP wrapper
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('ca_token');
  }

  async request(method, path, data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (this.token) {
      options.headers.Authorization = `Bearer ${this.token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${path}`, options);
    return response.json();
  }

  // Convenience methods
  get(path) { return this.request('GET', path); }
  post(path, data) { return this.request('POST', path, data); }
  put(path, data) { return this.request('PUT', path, data); }
  delete(path) { return this.request('DELETE', path); }
}

const api = new APIClient('http://localhost:5000/api/v1');
module.exports = api;

// src/core/store/index.js — State management
class Store {
  constructor() {
    this.state = {
      user: null,
      profile: null,
      posts: [],
      isAuthenticated: false,
    };
    this.listeners = [];
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
    localStorage.setItem('ca_state', JSON.stringify(this.state));
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(l => l(this.state));
  }

  logout() {
    this.setState({
      user: null,
      profile: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('ca_token');
  }
}

module.exports = new Store();

// src/router.js — Routing
class Router {
  constructor() {
    this.routes = {};
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  async navigate(path) {
    const handler = this.routes[path];
    if (handler) {
      const content = await handler();
      document.getElementById('app').innerHTML = content;
      window.history.pushState({}, '', path);
    }
  }
}

const router = new Router();
module.exports = router;
```

### 6.4 Entry point frontend

```html
<!-- frontend/public/index.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Citoyen Avisé</title>
  <link rel="stylesheet" href="../src/shared/css/reset.css">
  <link rel="stylesheet" href="../src/shared/css/variables.css">
  <link rel="stylesheet" href="../src/shared/css/base.css">
</head>
<body>
  <div id="app"></div>
  <script src="../src/app.js" type="module"></script>
</body>
</html>

<!-- frontend/src/app.js -->
import router from './router.js';
import store from './core/store/index.js';
import Header from './shared/components/header.js';

async function initApp() {
  // Initialize header
  const header = new Header();
  header.render();

  // Register routes
  router.register('/', () => import('./modules/home/pages/index.html'));
  router.register('/login', () => import('./modules/auth/pages/login.html'));
  // ... etc

  // Navigate to current URL
  router.navigate(window.location.pathname || '/');
}

// Wait for DOM
document.addEventListener('DOMContentLoaded', initApp);
```

---

## 📚 SECTION 7: PLAN D'ACTION DÉTAILLÉ (À IMPLÉMENTER)

### PHASE 1: INFRASTRUCTURE & SETUP (3 jours)

#### 1.1 Configuration backend
- [ ] Créer `backend/src/config.js` (configuration centralisée)
- [ ] Créer `.env` et `.env.example` (secrets + variables)
- [ ] Créer `backend/src/app.js` (Express setup)
- [ ] Créer `backend/server.js` (entry point)
- [ ] Setup logging (Winston)
- [ ] Test: `npm run dev` → serveur démarre

#### 1.2 Configuration base de données
- [ ] Créer `backend/src/database/schema.sql` (8 tables)
- [ ] Créer `backend/src/core/services/database.js` (connection pool)
- [ ] Créer `backend/src/database/init.js` (init DB)
- [ ] Test: `npm run setup:db` → tables créées

#### 1.3 Middleware & core
- [ ] Créer `backend/src/core/middleware/auth.js` (JWT validation)
- [ ] Créer `backend/src/core/middleware/errorHandler.js` (error handling)
- [ ] Créer `backend/src/core/middleware/validation.js` (Zod wrapper)
- [ ] Créer `backend/src/core/utils/jwt.js` (JWT helpers)
- [ ] Créer `backend/src/core/utils/logger.js` (Winston config)
- [ ] Créer `backend/src/core/constants/roles.js` (roles, categories)

#### 1.4 Configuration frontend
- [ ] Créer `frontend/public/index.html` (entry point)
- [ ] Créer `frontend/src/app.js` (app init)
- [ ] Créer `frontend/src/router.js` (routing)
- [ ] Créer `frontend/src/core/api/client.js` (HTTP client)
- [ ] Créer `frontend/src/core/store/index.js` (state management)
- [ ] Test: Page charge, header affiche

#### 1.5 CSS & design tokens
- [ ] Créer `frontend/src/shared/css/variables.css` (colors, spacing)
- [ ] Créer `frontend/src/shared/css/reset.css` (normalization)
- [ ] Créer `frontend/src/shared/css/base.css` (base styles)
- [ ] Créer `frontend/src/shared/css/components.css` (component styles)

**Deliverable fin Phase 1**: Structure complète, backend démarre, frontend charge

---

### PHASE 2: MODULE AUTH (3 jours)

#### 2.1 Backend Auth
- [ ] Créer `backend/src/modules/auth/routes.js` (register, login, getMe)
- [ ] Créer `backend/src/modules/auth/controller.js` (request handlers)
- [ ] Créer `backend/src/modules/auth/service.js` (bcrypt, JWT logic)
- [ ] Créer `backend/src/modules/auth/schema.js` (Zod validation)
- [ ] Créer `backend/src/modules/auth/index.js` (exports)
- [ ] Test avec curl: register, login, getMe

#### 2.2 Frontend Auth
- [ ] Créer `frontend/src/modules/auth/pages/login.html` (formulaire)
- [ ] Créer `frontend/src/modules/auth/pages/register.html` (formulaire)
- [ ] Créer `frontend/src/modules/auth/js/auth-module.js` (logic)
- [ ] Créer `frontend/src/modules/auth/js/forms.js` (validation)
- [ ] Créer `frontend/src/modules/auth/css/auth.css` (styles)
- [ ] Connecter formulaires → API
- [ ] Test: Register → Login → Token stocké

**Deliverable fin Phase 2**: Auth complète (backend + frontend intégré)

---

### PHASE 3: MODULES USERS + PROFILES (4 jours)

#### 3.1 Backend Users & Profiles
- [ ] Créer `backend/src/modules/users/` (CRUD)
- [ ] Créer `backend/src/modules/profiles/` (CRUD + follows)
- [ ] Routes: GET /users/:id, PUT /users/:id, DELETE /users/:id
- [ ] Routes: GET /profiles, POST /profiles, PUT /profiles/:id
- [ ] Routes: POST /profiles/:id/follow, DELETE /profiles/:id/follow
- [ ] Test: CRUD complet

#### 3.2 Frontend Users & Profiles
- [ ] Créer `frontend/src/modules/profiles/pages/list.html` (liste)
- [ ] Créer `frontend/src/modules/profiles/pages/detail.html` (détail + edit)
- [ ] Créer `frontend/src/modules/profiles/js/profiles-module.js`
- [ ] Implémenter follow/unfollow
- [ ] Test: Affichage, édition, follow

**Deliverable fin Phase 3**: Profils complets, suivis fonctionnels

---

### PHASE 4: MODULE POSTS (4 jours)

#### 4.1 Backend Posts
- [ ] Créer `backend/src/modules/posts/` (CRUD + likes + flags)
- [ ] Routes: GET /posts, POST /posts, PUT /posts/:id, DELETE /posts/:id
- [ ] Routes: POST /posts/:id/like, DELETE /posts/:id/like
- [ ] Routes: POST /posts/:id/flag (modération)
- [ ] Filtres: category, type, status, sort
- [ ] Pagination: limit=20, max=100
- [ ] Test: CRUD + likes + filtres

#### 4.2 Frontend Posts
- [ ] Créer `frontend/src/modules/posts/pages/feed.html` (fil)
- [ ] Créer `frontend/src/modules/posts/pages/detail.html` (détail)
- [ ] Créer `frontend/src/modules/posts/js/posts-module.js`
- [ ] Créer formulaire création post
- [ ] Implémenter like/unlike
- [ ] Test: Feed, création, likes

**Deliverable fin Phase 4**: Posts + likes + modération

---

### PHASE 5: MODULE MAP (3 jours)

#### 5.1 Backend Map
- [ ] Créer `backend/src/modules/map/` (GeoJSON + PostGIS)
- [ ] Routes: GET /map/nodes (GeoJSON)
- [ ] Routes: GET /map/nodes?bounds=... (spatial queries)
- [ ] Routes: GET /map/nodes?region=QC (par région)
- [ ] Test: curl GeoJSON response

#### 5.2 Frontend Map
- [ ] Créer `frontend/src/modules/map/pages/index.html`
- [ ] Créer `frontend/src/modules/map/js/map-module.js` (Leaflet)
- [ ] Charger GeoJSON depuis API
- [ ] Afficher markers + clustering
- [ ] Click → popup → lien profil
- [ ] Filtrer par région
- [ ] Test: Carte affiche profils

**Deliverable fin Phase 5**: Carte interactive complète

---

### PHASE 6: CONTENU CIVIQUE (3 jours)

#### 6.1 Backend Content
- [ ] Créer `backend/src/modules/content/` (pages statiques → CMS)
- [ ] Routes: GET /content/pages (lister)
- [ ] Routes: GET /content/pages/:slug (détail)
- [ ] Routes: PUT /content/pages/:slug (edit, admin)
- [ ] Seed: injecter pages existantes en DB
- [ ] Test: GET /content/pages/gouvernement

#### 6.2 Frontend Content
- [ ] Créer générateur pages dynamiques (slug → contenu)
- [ ] Créer `frontend/src/modules/content/pages/page.html`
- [ ] Router: toute URL /page/:slug → charge depuis API
- [ ] Test: /gouvernement, /droits, /services chargent

#### 6.3 Migration pages HTML
- [ ] Extraire contenu HTML statiques (50+ pages)
- [ ] Créer entrées DB: content_pages
- [ ] Vérifier bilingue (FR/EN)
- [ ] Supprimer pages HTML statiques (archiver en _old/)

**Deliverable fin Phase 6**: Pages statiques migrées en CMS

---

### PHASE 7: POLISH & DOCUMENTATION (2 jours)

#### 7.1 Composants réutilisables
- [ ] Créer `frontend/src/shared/components/header.js` (navigation)
- [ ] Créer `frontend/src/shared/components/button.js` (boutons)
- [ ] Créer `frontend/src/shared/components/card.js` (cartes)
- [ ] Créer `frontend/src/shared/components/modal.js` (modales)
- [ ] Créer `frontend/src/shared/components/toast.js` (notifs)
- [ ] Créer `frontend/src/shared/components/spinner.js` (loaders)
- [ ] Créer `frontend/src/shared/layouts/app-layout.js`

#### 7.2 Documentation & IA
- [ ] Compléter `_ai/10_guide_prompting.md` (how-to IA)
- [ ] Créer `_ai/20_prompts_systeme/` (templates réutilisables)
- [ ] Créer `_ai/30_prompts_modules/` (prompts par module)
- [ ] Créer `_ai/40_journal_sessions/2026-05-02_phase1.md` (décisions)
- [ ] Créer `CLAUDE.md` (instructions IA)
- [ ] Créer `docs/ARCHITECTURE.md` (guide complet)
- [ ] Créer `docs/API.md` (API reference)

#### 7.3 Tests & déploiement
- [ ] Créer tests API (Supertest) pour les 5 modules
- [ ] Créer `docker-compose.yml` (PostgreSQL + app)
- [ ] Créer `Dockerfile` (prod)
- [ ] Test: `npm run test` → tous passent
- [ ] Test: `docker-compose up` → tout fonctionne

**Deliverable fin Phase 7**: MVP 100% fonctionnel, deployable

---

### Timeline récapitulative

| Phase | Durée | Modules | Statut |
|-------|-------|---------|--------|
| 1: Infrastructure | 3j | Config, DB, Core | 🔴 TODO |
| 2: Auth | 3j | Auth | 🔴 TODO |
| 3: Users/Profiles | 4j | Users, Profiles | 🔴 TODO |
| 4: Posts | 4j | Posts, Likes | 🔴 TODO |
| 5: Map | 3j | Map + PostGIS | 🔴 TODO |
| 6: Content CMS | 3j | Content + migration | 🔴 TODO |
| 7: Polish | 2j | Composants, docs, tests | 🔴 TODO |
| **TOTAL** | **22j** | **6 modules MVP** | **🔴 À FAIRE** |

---

## 📋 SECTION 8: SYSTÈME IA COMPLET

### 8.1 Structure _ai/ (À compléter)

```
_ai/
├── 00_vision_projet.md                  ✅ EXISTE
├── 01_contraintes_generales.md          ✅ EXISTE
├── 02_architecture_modules.md           ✅ EXISTE
│
├── 10_guide_prompting.md                🔴 À CRÉER
│   ├─ Comment utiliser ce système
│   ├─ Quand appeler IA
│   ├─ Exemples de prompts
│   └─ Bonnes pratiques
│
├── 20_prompts_systeme/                  🔴 À CRÉER
│   ├── nouveau-module.md                # Template: créer module
│   ├── nouveau-endpoint.md              # Template: créer route API
│   ├── nouveau-composant.md             # Template: créer composant frontend
│   ├── migration-db.md                  # Template: migration DB
│   ├── test-api.md                      # Template: tester API
│   ├── debug-issue.md                   # Template: debug problème
│   ├── refactor-code.md                 # Template: refactoriser
│   └── perf-optimization.md             # Template: optimiser perf
│
├── 30_prompts_modules/                  ✅ PARTIEL (3 fichiers)
│   ├── auth.md                          ✅ Exists
│   ├── users.md                         🔴 À CRÉER
│   ├── profiles.md                      🔴 À CRÉER
│   ├── posts.md                         ✅ Exists
│   ├── ideas.md                         🔴 À CRÉER
│   ├── map.md                           ✅ Exists
│   ├── likes.md                         🔴 À CRÉER
│   ├── notifications.md                 🔴 À CRÉER
│   ├── search.md                        🔴 À CRÉER
│   ├── admin.md                         🔴 À CRÉER
│   ├── moderation.md                    🔴 À CRÉER
│   ├── content.md                       🔴 À CRÉER
│   └── [autres modules future]
│
├── 40_journal_sessions/                 ✅ PARTIAL (1 fichier)
│   ├── 2026-05-02_phase1_implementation.md ✅ Exists
│   ├── 2026-05-02_refonte_complete.md      🔴 À CRÉER
│   ├── 2026-05-XX_phase2_modules.md        (future)
│   └── [autres sessions]
│
├── MEMORY.md                            ✅ EXISTE
│
└── decisions.md                         🔴 À CRÉER
    ├─ Décisions architecturales
    ├─ Justifications
    └─ Trade-offs acceptés
```

### 8.2 Contenu clé à créer

**`_ai/10_guide_prompting.md`** (comment utiliser cette architecture):

```markdown
# Guide Prompting — Citoyen Avisé

## 📋 Quand appeler Claude?

1. **Créer nouveau module** → Utiliser `20_prompts_systeme/nouveau-module.md`
2. **Ajouter route API** → Utiliser `20_prompts_systeme/nouveau-endpoint.md`
3. **Créer composant frontend** → Utiliser `20_prompts_systeme/nouveau-composant.md`
4. **Debug problème** → Utiliser `20_prompts_systeme/debug-issue.md`
5. **Migration DB** → Utiliser `20_prompts_systeme/migration-db.md`

## 🔑 Prompts clés

### Créer module (Backend)
\`\`\`
Je veux créer un nouveau module "[NOM]" avec les endpoints suivants:
[ENDPOINTS]

Utilise:
- Backend: NODE.js + Express
- DB: PostgreSQL
- Structure: routes.js, controller.js, service.js, schema.js
- Validation: Zod

Respecte les contraintes de _ai/01_contraintes_generales.md
\`\`\`

### Créer page (Frontend)
\`\`\`
Je veux créer une page "[NOM]" avec les éléments:
[ELEMENTS]

Utilise:
- HTML5
- CSS (variables.css)
- JavaScript vanilla
- Composants de shared/components/

Appelle API: /api/v1/[ENDPOINT]
Respecte le layout: src/shared/layouts/app-layout.js
\`\`\`

## 📚 Dossiers de prompts

Chaque dossier contient des templates prêts à utiliser.
Copier-coller le contenu pertinent dans votre prompt.

### 20_prompts_systeme/
- Réutilisable pour n'importe quel module
- Exemples concrets
- Checklists intégrées

### 30_prompts_modules/
- Spécifique à chaque module MVP
- Détails implémentation
- Dépendances, flux de données

## ✨ Bonnes pratiques

1. **Contextualiser** : Toujours mentionner le module, le flux, l'objectif
2. **Être spécifique** : Donner des endpoints, des champs DB, des exemples
3. **Valider architecture** : Vérifier que la solution respecte contraintes
4. **Documenter décisions** : Ajouter une note dans 40_journal_sessions/
5. **Tester** : Toujours tester localement avant de commiter

## 🎯 Exemple workflow complet

1. Lire `02_architecture_modules.md` (comprendre flux)
2. Lire module-specific prompt (ex. `30_prompts_modules/profiles.md`)
3. Appeler Claude avec le prompt + contexte
4. Claude crée les fichiers
5. Tester localement
6. Commiter + ajouter note dans journal
```

---

## 🎯 SECTION 9: DÉCISIONS & JUSTIFICATIONS

### Architecture Backend
- **Express.js** → Simple, scalable, ecosystem riche
- **PostgreSQL + PostGIS** → SQL stable, support géospatial natif
- **JWT** → Stateless, scalable, standard
- **Module pattern** → Chaque module isolé, testable, scalable

### Architecture Frontend
- **HTML/CSS/JS vanilla** (pour MVP) → Zéro overhead, approche progressive
- **Modules par feature** → Isolé, réutilisable
- **localStorage + fetch** → Simple, stable
- **Composants légers** → Pas de framework heavy, migration future vers React/Vue possible

### Base de données
- **UUIDs** → Sécurité, distribution, pas d'incréments prédictibles
- **Soft delete** → Audit trail, récupération possible
- **Dénormalisation compteurs** (likes_count) → Perf, pas de COUNT(*) coûteux
- **PostGIS spatial indexes** → Requêtes géo ultra-rapides

### Security
- **bcrypt min 12 rounds** → Standard industry
- **JWT 24h + refresh 7d** → Bon balance entre sécurité et UX
- **Rate limiting** → Prévient brute force
- **Zod validation** → Type-safe, consistent

---

## ✅ CHECKLIST FINALE

### Infrastructure (Phase 1)
- [ ] `backend/src/config.js`
- [ ] `backend/src/app.js`
- [ ] `backend/server.js`
- [ ] `.env` (config locale)
- [ ] `backend/src/database/schema.sql`
- [ ] `backend/src/core/middleware/*`
- [ ] `backend/src/core/utils/*`
- [ ] `frontend/public/index.html`
- [ ] `frontend/src/app.js`
- [ ] `frontend/src/router.js`
- [ ] `frontend/src/core/api/client.js`
- [ ] `frontend/src/core/store/index.js`
- [ ] `frontend/src/shared/css/*` (all)
- [ ] ✅ Infrastructure démarre

### Auth Module (Phase 2)
- [ ] `backend/src/modules/auth/routes.js`
- [ ] `backend/src/modules/auth/controller.js`
- [ ] `backend/src/modules/auth/service.js`
- [ ] `backend/src/modules/auth/schema.js`
- [ ] `frontend/src/modules/auth/pages/login.html`
- [ ] `frontend/src/modules/auth/pages/register.html`
- [ ] `frontend/src/modules/auth/js/auth-module.js`
- [ ] ✅ Auth complète (backend + frontend)

### Users & Profiles (Phase 3)
- [ ] Backend Users + Profiles modules
- [ ] Frontend Users + Profiles pages
- [ ] Follow/Unfollow fonctionnel
- [ ] ✅ Profils complets

### Posts (Phase 4)
- [ ] Backend Posts module + likes + flags
- [ ] Frontend Posts pages + form
- [ ] Feed, création, likes, modération
- [ ] ✅ Posts fonctionnels

### Map (Phase 5)
- [ ] Backend Map GeoJSON + PostGIS
- [ ] Frontend Leaflet + markers
- [ ] Filtres région/bounds
- [ ] ✅ Carte interactive

### Content CMS (Phase 6)
- [ ] Backend Content module
- [ ] Seed pages existantes
- [ ] Frontend dynamic pages
- [ ] Migration HTML statique
- [ ] ✅ CMS fonctionnel

### Documentation & IA (Phase 7)
- [ ] `_ai/10_guide_prompting.md`
- [ ] `_ai/20_prompts_systeme/*` (8 templates)
- [ ] `_ai/30_prompts_modules/*` (12+ modules)
- [ ] `_ai/40_journal_sessions/refonte_complete.md`
- [ ] `docs/ARCHITECTURE.md`
- [ ] `docs/API.md`
- [ ] `CLAUDE.md` (instructions IA)
- [ ] ✅ Documentation complète

### Tests & Déploiement (Phase 7)
- [ ] Tests API (Supertest)
- [ ] Docker & docker-compose
- [ ] Vérifier: `npm test` ✅
- [ ] Vérifier: `docker-compose up` ✅
- [ ] ✅ Deployable

---

## 🚀 PROCHAINES ÉTAPES IMMÉDIATES

### Semaine du 2-6 mai

**Jour 1 (aujourd'hui):**
- [ ] Vous lisez ce document
- [ ] Claude crée Phase 1 infrastructure

**Jour 2-3:**
- [ ] Phase 1 terminée (structure + config)
- [ ] Vérification: `npm run dev` fonctionne
- [ ] Vérification: DB initialisée

**Jour 4-5:**
- [ ] Phase 2 Auth (backend + frontend)
- [ ] Vérification: register + login OK

**Jour 6-7:**
- [ ] Phase 3 Users/Profiles
- [ ] Vérification: profils créés, follows OK

**Semaine du 9-13 mai:**
- [ ] Phase 4 Posts
- [ ] Phase 5 Map
- [ ] Phase 6 Content CMS + migration

**Semaine du 16-20 mai:**
- [ ] Phase 7 Polish, tests, docs
- [ ] Vérification: MVP 100% fonctionnel
- [ ] 🎉 Deployable!

---

## 📞 SUPPORT & QUESTIONS

Si blockers:
1. Vérifier `_ai/40_journal_sessions/` (décisions passées)
2. Relire `01_contraintes_generales.md` (régles)
3. Appeler Claude avec contexte + erreur spécifique
4. Chercher dans `30_prompts_modules/` (module spécifique)

---

**Document préparé par**: Claude Code
**Date**: 2 mai 2026
**Statut**: 📋 PLAN COMPLET, À IMPLÉMENTER
**Impact**: Architecture 100% opérationnelle en 22 jours

✨ **Ready to build!** ✨
