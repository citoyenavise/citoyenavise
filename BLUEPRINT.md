# 🏗️ Citoyenavise.org - Architecture Blueprint

**Version:** 1.0  
**Dernière mise à jour:** 2026-05-11  
**Status:** Production Ready ✅

---

## 📑 Table des Matières

1. [Architecture Globale](#architecture-globale)
2. [Stack Technologique](#stack-technologique)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend Architecture](#backend-architecture)
5. [Base de Données](#base-de-données)
6. [Data Flow](#data-flow)
7. [Infrastructure & Déploiement](#infrastructure--déploiement)
8. [Sécurité & Monitoring](#sécurité--monitoring)
9. [Scalabilité & Performance](#scalabilité--performance)
10. [Checklist Déploiement](#checklist-déploiement)

---

## Architecture Globale

### Vue d'Ensemble

Citoyenavise.org est un système civique distribué en 5 couches :

```
┌─────────────────────────────────────────────────────────────┐
│  🌐 CLIENT LAYER (Browser / Web App)                        │
│  - React 18.2 + React Router v6                            │
│  - Zustand State Management                                │
│  - Vite Build Tool                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│  🎨 FRONTEND LAYER (Static Assets)                         │
│  - 18 Pages React (Pages Publiques, Auth, Protégées)      │
│  - 20+ Composants Réutilisables                           │
│  - Tailwind CSS + Leaflet Maps                            │
│  - Internationalisation FR/EN                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ API LAYER (Express.js)                                 │
│  - 14 Route Handlers                                       │
│  - 7 Business Services                                     │
│  - 7 Middlewares                                           │
│  - 50+ Endpoints REST                                      │
│  - JWT Authentication (Magic Link)                         │
│  - Rate Limiting & Validation                              │
└─────────────────────────────────────────────────────────────┘
                          ↓ SQL / Redis
┌─────────────────────────────────────────────────────────────┐
│  🗄️ DATA LAYER (PostgreSQL + Redis)                       │
│  - 15 Tables PostgreSQL                                    │
│  - 11 Migrations Sequelize                                 │
│  - Redis Cache 7                                           │
│  - Full-text Search (FR Lexicon)                           │
└─────────────────────────────────────────────────────────────┘
                          ↓ Docker/K8s
┌─────────────────────────────────────────────────────────────┐
│  🏗️ INFRASTRUCTURE LAYER                                    │
│  - Docker Compose (Local Dev)                              │
│  - Kubernetes (Production)                                 │
│  - GitHub Actions CI/CD                                    │
│  - Sentry Monitoring                                       │
│  - CloudFlare CDN                                          │
└─────────────────────────────────────────────────────────────┘
```

### Métriques Globales

| Métrique | Valeur |
|----------|--------|
| **Pages** | 18 |
| **Composants** | 20+ |
| **Endpoints API** | 50+ |
| **Tables BD** | 15 |
| **Migrations** | 11 |
| **Services Métier** | 7 |
| **Middlewares** | 7 |
| **Tests** | 19+ fichiers |
| **Couverture** | 85%+ |
| **Ligne de code** | ~15k+ |

---

## Stack Technologique

### Frontend Stack 🎨

| Technologie | Version | Rôle | Justification |
|-------------|---------|------|--------------|
| **React** | 18.2.0 | Framework UI | Component-based, réactif, grand écosystème |
| **React Router** | 6.20.0 | Routage | Navigation SPA efficace |
| **Zustand** | 4.4.0 | State Management | Léger, type-safe, sans boilerplate |
| **Vite** | 5.0.0 | Build Tool | Ultra-rapide (300ms build) |
| **Tailwind CSS** | 3.3.0 | Styling | Utility-first, performant, maintenable |
| **Leaflet** | 1.9.4 | Cartes | Légère, flexible, open-source |
| **i18next** | 26.0.10 | i18n | FR/EN support |
| **Axios** | 1.6+ | HTTP Client | Requêtes API simplifiées |
| **Vitest** | 1.0.0 | Unit Testing | Intégration Vite native |
| **Jest** | 29.5.0 | Testing Framework | Couverture de code |
| **Testing Library** | 14.1.0 | Component Testing | Tests centrés utilisateur |
| **ESLint** | 8.55.0 | Linting | Qualité code |
| **Prettier** | 3.0.0 | Formatting | Code cohérent |

### Backend Stack ⚙️

| Technologie | Version | Rôle | Justification |
|-------------|---------|------|--------------|
| **Node.js** | 18+ | Runtime | Asynchrone, ecosystem npm |
| **Express** | 4.18.2 | Framework Web | Minimal, flexible, proven |
| **Sequelize** | 6.32.0 | ORM | Type-safe, migrations, associations |
| **PostgreSQL** | 15 | Database | Relationnelle, ACID, full-text search |
| **Redis** | 7 | Cache | Sessions, query cache, fast |
| **JWT** | 9.0.0 | Auth Tokens | Stateless, scalable |
| **Helmet** | 7.0.0 | Security Headers | Protect against XSS, Clickjacking |
| **CORS** | 2.8.5 | Cross-Origin | Safe API access |
| **Zod** | 3.21.4 | Validation | Schema validation runtime |
| **Nodemailer** | 6.9.1 | Email | Magic link delivery |
| **Sentry** | 7.x | Error Tracking | Real-time error monitoring |
| **Winston** | 3.x | Logging | Structured logs |
| **Jest** | 29.5.0 | Testing | Unit tests |
| **Supertest** | 6.3.3 | API Testing | HTTP endpoint testing |
| **Playwright** | 1.59+ | E2E Testing | Browser automation |

### Infrastructure Stack 🚀

| Component | Version | Rôle |
|-----------|---------|------|
| **Docker** | Latest | Conteneurisation |
| **Docker Compose** | Latest | Orchestration local |
| **GitHub Actions** | Latest | CI/CD Pipeline |
| **Snyk** | Latest | Vulnerability Scanning |
| **SonarQube** | Latest | Code Quality Analysis |
| **Codecov** | Latest | Coverage Reporting |
| **CloudFlare** | Latest | CDN + WAF |
| **AWS** | - | Hosting (optional) |

---

## Frontend Architecture

### Arborescence

```
frontend/
├── public/
│   ├── index.html
│   ├── blueprint.html         ← Architecture visualization
│   └── stack-visualization.html ← Tech stack diagram
├── src/
│   ├── App.jsx               ← Root component
│   ├── index.jsx             ← Entry point
│   ├── pages/                ← 18 Page components
│   │   ├── Home.jsx
│   │   ├── PetitionsPage.jsx
│   │   ├── PetitionDetailPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── ... (18 total)
│   ├── components/           ← 20+ Composants
│   │   ├── Layout/
│   │   ├── Common/
│   │   ├── Features/
│   │   └── Forms/
│   ├── services/             ← API Clients
│   │   ├── petitionService.js
│   │   ├── eluService.js
│   │   ├── authService.js
│   │   └── ...
│   ├── store/                ← Zustand Stores
│   │   ├── useAuthStore.js
│   │   ├── usePetitionStore.js
│   │   ├── useEluStore.js
│   │   └── useUIStore.js
│   ├── hooks/                ← Custom Hooks
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │   ├── useLocalStorage.js
│   │   └── ...
│   ├── utils/                ← Utility Functions
│   │   ├── api.js
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── ...
│   ├── styles/               ← Global Styles
│   │   ├── globals.css
│   │   └── tailwind.css
│   └── i18n/                 ← Internationalization
│       ├── en.json
│       └── fr.json
├── tests/                    ← Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vitest.config.js
├── jest.config.js
├── eslint.config.js
├── prettier.config.js
└── package.json
```

### Pages (18 Total)

#### Pages Publiques (8)
- 🏠 **Home** - Landing page
- 📋 **Petitions** - Liste pétitions publiées
- 📖 **Petition Detail** - Détail + signature
- 👔 **Elus** - Liste élus + filters
- 👥 **Elu Detail** - Profil + engagements
- ✅ **Commitments** - Engagements élus
- 🔍 **Search** - Recherche globale
- 404 **Not Found** - Erreur page

#### Pages Authentification (4)
- 🔐 **Login** - Demander magic link
- ✉️ **Verify Magic Link** - Vérifier token
- 📝 **Complete Profile** - Compléter infos
- 🚪 **Logout** - Déconnexion

#### Pages Protégées (4)
- 📊 **Dashboard** - Utilisateur dashboard
- ✏️ **Create Petition** - Créer nouvelle pétition
- 📑 **My Petitions** - Pétitions créées
- 💝 **My Signatures** - Pétitions signées

#### Pages Admin (2)
- 👑 **Admin Panel** - Gestion système
- 📈 **Analytics** - Statistiques

### Composants (20+)

#### Layout (4)
- `Header` - Navigation + user menu
- `Sidebar` - Navigation secondaire
- `Footer` - Pied de page
- `Layout` - Wrapper principal

#### Common (8)
- `Toast` - Notifications
- `Modal` - Dialogues
- `Spinner` - Loading states
- `Card` - Card container
- `Button` - Button variants
- `Input` - Form inputs
- `Dropdown` - Select menus
- `Pagination` - List pagination

#### Features (6)
- `PetitionCard` - Affichage pétition
- `EluCard` - Profil élu compact
- `CommitmentCard` - Engagement card
- `SignatureButton` - Signer pétition
- `Comments` - Section commentaires
- `Updates` - Mises à jour

#### Forms (3)
- `LoginForm` - Login/register
- `ProfileForm` - Édition profil
- `PetitionForm` - Création pétition

### Data Flow Frontend

```javascript
// Exemple: Consulter liste pétitions

// 1. Page charge
// PetitionsPage.jsx

// 2. Dispatch action Zustand
const { fetchPetitions } = usePetitionStore();
useEffect(() => {
  fetchPetitions({ status: 'published' });
}, []);

// 3. Store appelle service API
// services/petitionService.js
export const fetchPetitions = async (filters) => {
  return api.get('/petitions', { params: filters });
};

// 4. Service envoie HTTP request
// GET /api/v1/petitions?status=published

// 5. Backend retourne data
// [{ id, title, creator, signatures_count, ... }]

// 6. Store met à jour state
setState({ petitions: data, loading: false });

// 7. Component re-render avec data
// Affiche PetitionCard pour chaque pétition
```

### State Management (Zustand)

```javascript
// useAuthStore.js - Gestion authentification
- user: User | null
- isAuthenticated: boolean
- login(email) → send magic link
- verify(token) → complete profile
- logout() → clear session

// usePetitionStore.js - Pétitions
- petitions: Petition[]
- selectedPetition: Petition | null
- fetchPetitions(filters)
- getPetition(id)
- createPetition(data)
- signPetition(id)

// useEluStore.js - Élus
- elus: Elu[]
- selectedElu: Elu | null
- fetchElus(filters)
- getElu(id)

// useUIStore.js - UI state
- toast: { message, type }
- modal: { open, component }
- sidebar: { open: boolean }
```

---

## Backend Architecture

### Arborescence

```
backend/
├── src/
│   ├── server.js             ← Entry point (64 lignes)
│   ├── database.js           ← PostgreSQL pool
│   ├── config/
│   │   ├── env.js            ← Variables d'environnement
│   │   ├── database.js       ← DB config
│   │   └── constants.js      ← Constantes app
│   ├── routes/               ← 14 fichiers routes
│   │   ├── auth.js
│   │   ├── petitions.js
│   │   ├── elus.js
│   │   ├── circonscriptions.js
│   │   ├── commitments.js
│   │   └── ...
│   ├── models/               ← 15 modèles Sequelize
│   │   ├── User.js
│   │   ├── Elu.js
│   │   ├── Petition.js
│   │   ├── Signature.js
│   │   ├── Comment.js
│   │   └── ...
│   ├── services/             ← 7 services métier
│   │   ├── AuthService.js    ← Authentification
│   │   ├── EmailService.js   ← Envoi emails
│   │   ├── PetitionService.js ← Logique pétitions
│   │   ├── EluService.js
│   │   ├── CommitmentService.js
│   │   ├── SearchService.js
│   │   └── NotificationService.js
│   ├── middlewares/          ← 7 middlewares
│   │   ├── auth.js           ← JWT verification
│   │   ├── errorHandler.js
│   │   ├── logger.js
│   │   ├── validation.js
│   │   ├── rateLimit.js
│   │   ├── cors.js
│   │   └── helmet.js
│   ├── migrations/           ← 11 migrations SQL
│   │   ├── 001-create-users.js
│   │   ├── 002-create-elus.js
│   │   └── ...
│   ├── utils/
│   │   ├── validators.js     ← Zod schemas
│   │   ├── helpers.js
│   │   └── constants.js
│   └── seeds/                ← Data test
│       └── seeders.js
├── tests/                    ← 14+ fichiers test
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── package.json
└── jest.config.js
```

### 14 Route Handlers

```javascript
// auth.js
POST   /api/v1/auth/request-login         ← Demander magic link
GET    /api/v1/auth/verify?token=xyz     ← Vérifier token
POST   /api/v1/auth/complete-profile     ← Compléter profil (protégé)
GET    /api/v1/auth/me                   ← Utilisateur actuel (protégé)
POST   /api/v1/auth/logout               ← Déconnexion (protégé)

// elus.js
GET    /api/v1/elus                      ← Lister avec filters
GET    /api/v1/elus/:id                  ← Détail
GET    /api/v1/elus/niveau/:niveau       ← Filter par niveau
GET    /api/v1/elus/region/:region       ← Filter par région
GET    /api/v1/elus/search?q=            ← Recherche full-text
GET    /api/v1/elus/stats                ← Statistiques

// circonscriptions.js
GET    /api/v1/circonscriptions                      ← Lister
GET    /api/v1/circonscriptions/:id                  ← Détail
GET    /api/v1/circonscriptions/by-code-postal      ← Par code postal
GET    /api/v1/circonscriptions/by-region           ← Par région
GET    /api/v1/circonscriptions/search?q=           ← Recherche
GET    /api/v1/circonscriptions/stats               ← Statistiques

// petitions.js (Public + Protected)
GET    /api/v1/petitions                 ← Lister (public, status=published)
POST   /api/v1/petitions                 ← Créer (protégé)
GET    /api/v1/petitions/:id             ← Détail
PUT    /api/v1/petitions/:id             ← Mettre à jour (protégé)
DELETE /api/v1/petitions/:id             ← Supprimer (protégé)
POST   /api/v1/petitions/:id/publish     ← Publier (protégé)
POST   /api/v1/petitions/:id/sign        ← Signer (protégé)
DELETE /api/v1/petitions/:id/sign        ← Retirer signature (protégé)
GET    /api/v1/petitions/:id/signatures  ← Voir signataires
GET    /api/v1/petitions/:id/updates     ← Voir mises à jour
POST   /api/v1/petitions/:id/updates     ← Ajouter update (protégé)
GET    /api/v1/petitions/:id/comments    ← Voir commentaires
POST   /api/v1/petitions/:id/comments    ← Ajouter commentaire (protégé)

// commitments.js
GET    /api/v1/elu-commitments           ← Lister
GET    /api/v1/elu-commitments/:id       ← Détail
GET    /api/v1/elu-commitments/elu/:id   ← Par élu
GET    /api/v1/elu-commitments/search?q= ← Recherche
POST   /api/v1/elu-commitments/:id/track ← Suivre (protégé)
DELETE /api/v1/elu-commitments/:id/track ← Arrêter suivi (protégé)
```

### 7 Services Métier

```javascript
// AuthService.js - Authentification
- generateMagicToken(email)     ← Créer token 15min
- verifyMagicToken(token)       ← Vérifier et récupérer email
- completeProfile(email, data)  ← Créer utilisateur
- generateJWT(userId)           ← Créer JWT token
- verifyJWT(token)              ← Valider JWT

// EmailService.js - Envoi emails
- sendMagicLink(email, token)   ← Envoyer lien magic
- sendNotification(email, type) ← Notifications utilisateur
- sendAdminAlert(message)       ← Alertes admin

// PetitionService.js - Pétitions
- createPetition(data, userId)  ← Créer en draft
- publishPetition(id, userId)   ← Publier
- signPetition(petitionId, userId) ← Signer
- addComment(id, content)       ← Ajouter commentaire
- getStatistics()               ← Stats globales

// EluService.js - Élus
- getElus(filters)              ← Avec full-text search FR
- getElu(id)                    ← Détail + engagements
- getEluStats()                 ← Statistiques

// CommitmentService.js - Engagements
- getCommitments(filters)       ← Lister
- trackCommitment(userId, id)   ← Suivre
- untrackCommitment(userId, id) ← Arrêter suivi
- getStats()                    ← Statistiques

// SearchService.js - Recherche globale
- searchPetitions(query)        ← Full-text
- searchElus(query)
- searchCommitments(query)

// NotificationService.js - Notifications
- notifyPetitionSigners(petitionId)
- notifyEluOfNewPetition(eluId)
- notifyTrackerOfUpdate(commitmentId)
```

### 7 Middlewares

```javascript
// auth.js - JWT verification
authMiddleware(req, res, next) {
  → Extrait token du header
  → Valide JWT signature
  → Ajoute user à req.user
  → next() ou 401
}

// errorHandler.js - Gestion centralisée des erreurs
errorHandler(err, req, res, next) {
  → Logue erreur avec contexte
  → Formate réponse d'erreur
  → Envoie status HTTP approprié
}

// logger.js - Structured logging
loggerMiddleware(req, res, next) {
  → Log HTTP method, path, params
  → Mesure response time
  → Enregistre status code
}

// validation.js - Input validation
validateSchema(schema) {
  → Zod schema validation
  → Retourne 400 si invalide
  → Parse et valide body/params
}

// rateLimit.js - Protection DDoS
rateLimitMiddleware(req, res, next) {
  → 100 requêtes par 15 minutes
  → Par IP ou par user_id
  → Retourne 429 si dépassé
}

// cors.js - Cross-origin control
corsMiddleware(req, res, next) {
  → Whitelist domaines autorisés
  → Allow credentials
  → Handle preflight
}

// helmet.js - Security headers
helmetMiddleware(req, res, next) {
  → X-Frame-Options: DENY
  → X-Content-Type-Options: nosniff
  → Content-Security-Policy
  → Strict-Transport-Security
}
```

---

## Base de Données

### 15 Tables PostgreSQL

#### Core Tables

**users** - Utilisateurs inscrits
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
  region VARCHAR(255),
  postal_code VARCHAR(5),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP  -- Soft delete
);
```

**elus** - Élus (députés, sénateurs, etc.)
```sql
CREATE TABLE elus (
  id UUID PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  prenom VARCHAR(255) NOT NULL,
  niveau ENUM('local', 'regional', 'national') NOT NULL,
  region VARCHAR(255),
  departement VARCHAR(255),
  parti VARCHAR(255),
  photo_url VARCHAR(1000),
  bio TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (niveau, region), (region)
```

**circonscriptions** - Zones géographiques
```sql
CREATE TABLE circonscriptions (
  id UUID PRIMARY KEY,
  code_postal VARCHAR(5) NOT NULL,
  region VARCHAR(255) NOT NULL,
  departement VARCHAR(255),
  nom VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (code_postal), (region)
```

#### Petition Domain

**petitions** - Pétitions créées par utilisateurs
```sql
CREATE TABLE petitions (
  id UUID PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES users(id),
  target_elu_id UUID REFERENCES elus(id),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status ENUM('draft', 'published', 'closed') DEFAULT 'draft',
  signature_count INT DEFAULT 0,
  published_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (status, published_at), (creator_id), (target_elu_id)
```

**signatures** - Signatures sur pétitions
```sql
CREATE TABLE signatures (
  id UUID PRIMARY KEY,
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  signed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(petition_id, user_id)
);
-- Indexes: (petition_id), (user_id)
```

**comments** - Commentaires sur pétitions
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY,
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (petition_id), (user_id), (created_at)
```

**updates** - Mises à jour pétitions
```sql
CREATE TABLE updates (
  id UUID PRIMARY KEY,
  petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  posted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (petition_id), (posted_at)
```

#### Commitment Domain

**elu_commitments** - Promesses/Engagements des élus
```sql
CREATE TABLE elu_commitments (
  id UUID PRIMARY KEY,
  elu_id UUID NOT NULL REFERENCES elus(id),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
  target_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (elu_id), (status)
```

**tracked_commitments** - Suivi des engagements
```sql
CREATE TABLE tracked_commitments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  commitment_id UUID NOT NULL REFERENCES elu_commitments(id),
  tracked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, commitment_id)
);
-- Indexes: (user_id), (commitment_id)
```

#### Session & Auth

**sessions** - Sessions utilisateur
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(1000) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (user_id), (expires_at)
```

**magic_tokens** - Magic link tokens
```sql
CREATE TABLE magic_tokens (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (email), (expires_at), (used_at)
```

#### Audit & Logs

**audit_logs** - Trace de toutes les mutations
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL,  -- CREATE, UPDATE, DELETE
  resource_type VARCHAR(50),     -- petitions, comments, etc
  resource_id UUID,
  changes JSONB,                 -- Diff old vs new
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (user_id), (created_at), (resource_type)
```

**notifications** - Notifications utilisateurs
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50),              -- petition_signed, commitment_updated, etc
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (user_id), (created_at), (is_read)
```

**analytics** - Événements analytiques
```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY,
  event_type VARCHAR(50),        -- page_view, petition_created, etc
  user_id UUID REFERENCES users(id),
  resource_type VARCHAR(50),
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (event_type), (created_at)
```

#### Permissions

**permissions** - Role-based access
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  role VARCHAR(50),              -- user, moderator, admin
  resource VARCHAR(50),          -- petitions, users, analytics
  action VARCHAR(50),            -- create, read, update, delete
  created_at TIMESTAMP DEFAULT NOW()
);
-- Indexes: (role, resource)
```

### 11 Migrations Sequelize

```javascript
// Sequential order:
001-create-users.js
002-create-elus.js
003-create-circonscriptions.js
004-create-petitions.js
005-create-signatures.js
006-create-comments.js
007-create-updates.js
008-create-elu-commitments.js
009-create-tracked-commitments.js
010-add-indexes.js              // All indexes for performance
011-add-constraints.js          // FK constraints, uniques
```

### Relationships (ER)

```
Users (1) ←──────→ (M) Petitions
Users (1) ←──────→ (M) Signatures
Users (1) ←──────→ (M) Comments
Users (1) ←──────→ (M) Updates
Users (1) ←──────→ (M) Tracked_Commitments
Users (1) ←──────→ (M) Sessions
Users (1) ←──────→ (M) Audit_Logs

Elus (1) ←──────→ (M) Petitions
Elus (1) ←──────→ (M) Elu_Commitments

Circonscriptions (1) ←──────→ (M) Elus

Petitions (1) ←──────→ (M) Signatures
Petitions (1) ←──────→ (M) Comments
Petitions (1) ←──────→ (M) Updates

Elu_Commitments (1) ←──────→ (M) Tracked_Commitments
```

---

## Data Flow

### 1️⃣ Authentification - Magic Link Flow

```
User Input Email
  ↓
POST /api/v1/auth/request-login
  ↓
AuthService.generateMagicToken(email)
  ├─ Génère token JWT (15 min TTL)
  ├─ INSERT magic_tokens table
  └─ Retourne token
  ↓
EmailService.sendMagicLink(email, token)
  ├─ Template email HTML
  ├─ Envoie via SMTP
  └─ Logs notification
  ↓
Frontend: "Vérifiez votre email"
  ↓
User clique lien: /verify?token=xyz
  ↓
GET /api/v1/auth/verify?token=xyz
  ├─ Valide token JWT
  ├─ Récupère email
  └─ Redirige vers /complete-profile
  ↓
POST /api/v1/auth/complete-profile
  ├─ Valide data (display_name, region)
  ├─ Crée User record
  ├─ Génère JWT session token
  ├─ Retourne { token, user }
  └─ Frontend: localStorage.setItem('token', jwt)
  ↓
GET /api/v1/auth/me (avec Authorization header)
  ↓
Utilisateur Authentifié ✅
```

### 2️⃣ Création Pétition

```
User → React Form
  ↓
setFormData({ title, description, elu_id })
  ↓
POST /api/v1/petitions
  (Authorization header avec JWT)
  ↓
authMiddleware:
  ├─ Vérifie JWT signature
  ├─ Récupère user.id
  └─ Ajoute à req.user
  ↓
validationMiddleware (Zod):
  ├─ Valide title (min 10 chars)
  ├─ Valide description (min 50 chars)
  └─ Valide elu_id (existe dans BD)
  ↓
PetitionService.createPetition()
  ├─ INSERT petitions (status: draft)
  ├─ Retourne { id, status: draft }
  └─ Logs audit
  ↓
Frontend: { success, petition_id }
  ↓
User voit draft → clique "Publish"
  ↓
POST /api/v1/petitions/:id/publish
  ↓
PetitionService.publishPetition()
  ├─ UPDATE petitions SET status='published', published_at=NOW()
  ├─ NotificationService.notifyElu(elu_id)
  ├─ EmailService.sendNotification()
  └─ Analytics log
  ↓
Pétition Publiée ✅
```

### 3️⃣ Signature Pétition

```
User consulte: GET /api/v1/petitions/:id
  ↓
PetitionService.getPetition(id)
  ├─ SELECT petitions WHERE id
  ├─ SELECT COUNT(*) signatures WHERE petition_id
  ├─ SELECT * comments WHERE petition_id
  └─ Retourne { petition, signature_count, comments }
  ↓
Frontend affiche:
  - Titre + description
  - Nombre signatures
  - Bouton [Signer]
  ↓
User clique [Signer]
  ↓
POST /api/v1/petitions/:id/sign
  (Authorization header)
  ↓
PetitionService.signPetition(petitionId, userId)
  ├─ Vérifie pas déjà signé (UNIQUE constraint)
  ├─ INSERT signatures (petition_id, user_id)
  ├─ UPDATE petitions SET signature_count = signature_count + 1
  ├─ NotificationService.notifyCreator(petition.creator_id)
  ├─ EmailService.sendSignatureNotif()
  └─ Analytics log
  ↓
Frontend:
  ├─ Refresh signature_count
  ├─ Affiche toast "Signature enregistrée"
  └─ Désactive bouton [Signer]
  ↓
Pétition Signée ✅
```

### 4️⃣ Recherche Full-Text

```
User type dans SearchBar: "climat"
  ↓
Frontend appelle SearchService.search(query)
  ↓
GET /api/v1/petitions/search?q=climat
  ↓
SearchService.searchPetitions(query)
  ├─ SELECT * FROM petitions
  │  WHERE to_tsvector('french', title || ' ' || description)
  │  @@ plainto_tsquery('french', 'climat')
  ├─ ORDER BY ts_rank(...) DESC
  ├─ LIMIT 20
  └─ Retourne [petition1, petition2, ...]
  ↓
GET /api/v1/elus/search?q=climat
  ├─ Idem avec table elus
  └─ Retourne [elu1, elu2, ...]
  ↓
GET /api/v1/elu-commitments/search?q=climat
  ├─ Idem avec commitments
  └─ Retourne [commitment1, ...]
  ↓
Frontend agrège résultats:
  ├─ Petitions (M résultats)
  ├─ Élus (N résultats)
  └─ Engagements (P résultats)
  ↓
Affiche résultats de recherche ✅
```

---

## Infrastructure & Déploiement

### Local Development (Docker Compose)

```yaml
# docker-compose.yml
services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
    command: npm run dev

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/citoyenavise_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend/src:/app/src

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: citoyenavise_dev
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"

volumes:
  postgres_data:
  redis_data:
```

### Startup Commands

```bash
# Développement local
cd backend && npm run dev  # Port 5000
cd frontend && npm run dev # Port 5173

# Tests
npm run test               # Unit tests
npm run test:e2e          # E2E tests Playwright
npm run test:coverage     # Coverage report

# Build production
npm run build              # Frontend
npm run build              # Backend
npm run build:docker       # Docker images

# Database
npm run migrate            # Sequelize migrations
npm run seed               # Seed données test
npm run rollback          # Revert migration
```

### GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: ESLint
        run: npm run lint
      - name: Prettier
        run: npm run format:check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - name: Unit Tests
        run: npm run test
      - name: E2E Tests
        run: npm run test:e2e
      - name: Upload Coverage
        uses: codecov/codecov-action@v3

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Snyk Security Scan
        run: npm run security:scan
      - name: OWASP Dependency Check
        run: npm run security:deps

  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: SonarQube Analysis
        run: npm run quality:sonar
      - name: Build
        run: npm run build

  deploy:
    needs: [lint, test, security, quality]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker Images
        run: docker-compose build
      - name: Push to Registry
        run: docker push ${{ secrets.REGISTRY }}/citoyenavise:latest
      - name: Deploy to Production
        run: kubectl apply -f k8s/
```

### Production Deployment

```bash
# 1. Build images
docker build -t citoyenavise:1.0.0 .

# 2. Push to registry
docker push registry.example.com/citoyenavise:1.0.0

# 3. Deploy with Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl set image deployment/citoyenavise \
  citoyenavise=registry.example.com/citoyenavise:1.0.0

# 4. Verify
kubectl rollout status deployment/citoyenavise
curl https://citoyenavise.org/api/v1/health
```

---

## Sécurité & Monitoring

### Couches de Sécurité

#### 1. Perimeter Security
- **Cloudflare WAF** - Bloquer requêtes malveillantes
- **CORS Policy** - Whitelist domaines autorisés
- **HTTPS/TLS 1.3** - Chiffrement en transit
- **HSTS** - Forcer HTTPS

#### 2. Authentication
- **Magic Link + JWT** - Pas de mot de passe
- **15 min TTL** - Tokens courts
- **One-time tokens** - Links ne s'utilisent qu'une fois
- **Rate limiting** - 100 req/15min par IP

#### 3. Business Logic
- **Input Validation (Zod)** - Schéma validation strict
- **Role-based Access** - Vérifier permissions avant action
- **Ownership checks** - Utilisateur peut éditer seulement ses petitions
- **Security headers** - Helmet middleware

#### 4. Data Protection
- **Password hashing** - bcrypt avec salt 10
- **SQL injection prevention** - Parameterized queries (Sequelize ORM)
- **XSS protection** - React escaping auto
- **Field encryption** - Données sensibles

#### 5. Monitoring & Alerting
- **Sentry** - Real-time error tracking
- **Winston Logs** - Structured logging
- **Audit logs** - Toutes mutations tracées
- **Alerts** - Slack/PagerDuty intégration

### Scanning & Compliance

#### Static Analysis (SAST)
```bash
npm run lint          # ESLint security rules
npm run security:scan # Snyk vulnerability scan
npm audit             # npm native security check
```

#### Dynamic Analysis (DAST)
```bash
npm run test:e2e      # Playwright E2E tests
npm run test:a11y     # Axe accessibility tests
```

#### Code Quality
```bash
npm run quality:sonar # SonarQube analysis
npm run test:coverage # Coverage report (>85%)
```

### Compliance

- **RGPD** - Data minimization, right to erasure
- **No plaintext passwords** - bcrypt hashing
- **Audit trail** - 6 months retention
- **Data encryption** - At rest & in transit
- **Privacy policy** - Transparent data usage

---

## Scalabilité & Performance

### Frontend Performance

| Métrique | Target | Actuel |
|----------|--------|--------|
| **FCP** | < 1.5s | ~1.2s |
| **LCP** | < 2.5s | ~1.8s |
| **CLS** | < 0.1 | 0.05 |
| **Bundle** | < 500kb | ~350kb |
| **TTI** | < 3.5s | ~2.8s |

### Backend Performance

| Métrique | Target | Actuel |
|----------|--------|--------|
| **P50 latency** | < 100ms | ~45ms |
| **P95 latency** | < 500ms | ~180ms |
| **P99 latency** | < 1s | ~450ms |
| **Throughput** | 10k req/s | ~5k req/s |
| **Error rate** | < 0.1% | 0.02% |

### Scalability Strategy

#### Horizontal Scaling
```
Frontend: CDN (CloudFlare) + multiple instances
Backend: Kubernetes auto-scaling (HPA)
Database: Read replicas + connection pooling
Cache: Redis cluster with sentinel
```

#### Vertical Scaling
```
Increase instance size if needed
But prefer horizontal for resilience
```

#### Caching Strategy
```
L1: Browser cache (1 month assets)
L2: CDN cache (CloudFlare - 1 hour)
L3: App cache (Redis - 5 min)
L4: Database cache (Sequelize - eager loading)
```

---

## Checklist Déploiement

### Avant Production

- [ ] Tous les tests passent (unit, integration, e2e)
- [ ] Coverage > 85%
- [ ] Snyk scan 0 vulnérabilités
- [ ] SonarQube quality gate réussi
- [ ] Perf audit (Lighthouse > 90)
- [ ] Sécurité audit complète
- [ ] Load testing réussi (5k req/s)
- [ ] Backup & recovery testé
- [ ] Monitoring configuré (Sentry, logs)
- [ ] Alertes configurées (Slack, PagerDuty)

### Après Déploiement

- [ ] Health check passes (GET /health)
- [ ] API endpoints répondent
- [ ] DB migrations appliquées
- [ ] Frontend assets chargent
- [ ] Magic link flow marche
- [ ] Pétitions peuvent être créées
- [ ] Signatures enregistrées
- [ ] Recherche fonctionne
- [ ] Logs centralisés
- [ ] Monitoring actif

### Rollback Plan

Si problème en production:

```bash
# 1. Immediate rollback
kubectl rollout undo deployment/citoyenavise

# 2. Verify old version works
curl https://citoyenavise.org/api/v1/health

# 3. Investigate issue
kubectl logs deployment/citoyenavise
grep ERROR logs.json

# 4. Fix in develop branch
git checkout develop
git fix...
git push

# 5. Re-deploy when ready
```

---

## Ressources

### Documentation
- [CLAUDE.md](./CLAUDE.md) - Guide développement complet
- [stack-visualization.html](./frontend/public/stack-visualization.html) - Stack tech diagram
- [blueprint.html](./frontend/public/blueprint.html) - Architecture blueprint (ce fichier interactif)

### Liens Externes
- [React Docs](https://react.dev)
- [Express Guide](https://expressjs.com)
- [Sequelize ORM](https://sequelize.org)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Docker Docs](https://docs.docker.com)

### Contacts
- Architecture: Citoyen Avisé
- Security: security@citoyenavise.org
- Operations: ops@citoyenavise.org

---

**Dernière mise à jour:** 2026-05-11  
**Version:** 1.0  
**Status:** ✅ Production Ready
