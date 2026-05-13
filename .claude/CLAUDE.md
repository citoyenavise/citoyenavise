# citoyenavise.org - Guide de Développement

**Dernière mise à jour** : 2026-05-13  
**Status** : v1.0.0 en production, 82 commits non poussés (en attente de PR)  
**Branche active** : `main`

---

## 🏗️ Architecture Réelle (Actuelle)

### Stack Tech
- **Backend** : Express.js 4.18+, Node.js 18+, Sequelize 6.32 (ORM)
- **Frontend** : React 18 + Vite, React Router v6, Zustand (state management)
- **Base de données** : PostgreSQL 15 (avec PostGIS optionnel)
- **Cache** : Redis 7 (optionnel, docker-compose inclus)
- **Email** : Brevo SMTP (Magic Link authentication)
- **i18n** : i18next (FR/EN) avec language detector
- **Carte** : Leaflet + react-leaflet
- **Sécurité** : Helmet, CORS, Rate Limiting, JWT + Magic Link
- **Documentation** : Swagger/OpenAPI (auto-generated)

### Infrastructure
- **Docker** : Multi-stage build, docker-compose avec PostgreSQL + Redis + pgAdmin
- **CI/CD** : GitHub Actions (test.yml, ci.yml, deploy.yml)
- **Testing** : Jest (backend), Vitest (frontend), Playwright (e2e)

---

## 📋 Structure Réelle du Projet

```
citoyenavise/
├── 📁 backend/
│   ├── package.json
│   ├── .env.example       (DATABASE_URL, JWT_SECRET, SMTP, etc.)
│   ├── .eslintrc.json     (ESLint airbnb-base)
│   ├── .prettierrc.json
│   ├── src/
│   │   ├── server.js                    (~175 lignes, Helmet + Rate Limiting + i18n + Swagger)
│   │   ├── config/env.js                (Configuration management)
│   │   ├── db/sequelize.js              (Connexion + testConnection)
│   │   ├── models/                      (30+ modèles Sequelize)
│   │   │   ├── User.js
│   │   │   ├── Elu.js, Circonscription.js, Petition.js, EluCommitment.js
│   │   │   ├── Badge.js, Mission.js, CivicTutorial.js
│   │   │   ├── Actualite.js, Promise.js, Comment.js, Signature.js
│   │   │   ├── Translation.js, *Translation.js (i18n support)
│   │   │   ├── UserProgression.js, ActivityMetrics.js, etc.
│   │   │   └── index.js (associations)
│   │   ├── routes/                      (14 fichiers)
│   │   │   ├── index.js (mounting)
│   │   │   ├── auth.js, admin.js
│   │   │   ├── elus.js, circonscriptions.js
│   │   │   ├── petitions.js, promises.js
│   │   │   ├── actualites.js, comments.js
│   │   │   ├── elu-commitments.js, gamification.js
│   │   │   ├── civic-tutorials.js, transparency.js
│   │   │   └── health.js
│   │   ├── services/                    (8 fichiers)
│   │   │   ├── AuthService.js, EmailService.js
│   │   │   ├── auth.js, email.js
│   │   │   ├── geolocation.js, transparencyScore.js
│   │   │   ├── i18n.js, health/ (service folder)
│   │   │   └── ... (business logic)
│   │   ├── middlewares/                 (6 fichiers)
│   │   │   ├── auth.js, adminAuth.js, admin.js
│   │   │   ├── logger.js, rateLimiter.js, i18n.js
│   │   │   └── validateRequest.js
│   │   ├── utils/
│   │   │   └── serialize.js (response formatting)
│   │   └── swagger/
│   │       └── setup.js (Swagger documentation)
│   ├── __tests__/                       (Jest tests)
│   │   ├── *.test.js (unitaires)
│   │   ├── e2e.test.js (Playwright)
│   │   ├── ci.test.js
│   │   └── lint.test.js
│   └── seeders/
│       └── seed.js (data seed)
│
├── 📁 frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── .eslintrc.json, .prettierrc.json
│   ├── public/
│   │   ├── index.html
│   │   ├── blueprint.html, stack-visualization.html
│   │   └── i18n/ (locales)
│   └── src/
│       ├── App.jsx (lazy-loaded routes)
│       ├── index.jsx
│       ├── contexts/
│       │   └── AuthContext.js
│       ├── pages/                       (12 fichiers)
│       │   ├── Login.jsx, VerifyPage.jsx
│       │   ├── PetitionsListPage.jsx, PetitionDetail.jsx
│       │   ├── CreatePetitionPage.jsx
│       │   ├── ElusPage.jsx, EluDetail.jsx
│       │   ├── ActualitesPage.jsx, MapPage.jsx
│       │   ├── TransparencyRanking.jsx
│       │   └── AdminDashboard.jsx
│       ├── components/                  (UI components)
│       │   ├── Header.jsx, LanguageSwitcher.jsx, LanguageSelector.jsx
│       │   ├── ProtectedRoute.jsx, ProtectedAdminRoute.jsx
│       │   ├── Toast.jsx, ErrorPage.jsx
│       │   ├── Map.jsx, EluMarker.jsx
│       │   ├── ui/ (design system)
│       │   └── *.css (styled)
│       ├── hooks/                       (custom React hooks)
│       ├── stores/                      (Zustand state)
│       ├── api/                         (API client)
│       ├── i18n/                        (i18next setup)
│       └── styles/
│
├── 📁 .github/workflows/                (CI/CD)
│   ├── test.yml
│   ├── ci.yml (Snyk, SonarQube, linting)
│   └── deploy.yml
│
├── 📁 scripts/
│   ├── security-check.js
│   ├── migrate.js
│   ├── seed-gamification.js
│   ├── promote-admin.js
│   └── check-tables.js
│
├── Dockerfile                           (Multi-stage, Node 18-alpine)
├── docker-compose.yml                   (PostgreSQL 15 + Redis 7 + app + pgAdmin)
├── package.json                         (monorepo root)
├── .claude/
│   └── CLAUDE.md                        (Ce fichier)
├── BLUEPRINT.md                         (Project specifications)
└── GITHUB_SECRETS_CHECKLIST.md          (Secrets setup guide)
```

---

## 🚀 Setup Local (Réel)

### Prérequis
- Node.js 18+
- PostgreSQL 15+
- Redis 7+ (optionnel pour cache)
- Docker + docker-compose (pour staging/production local)

### Installation Dev

```bash
# 1. Cloner et installer
git clone https://github.com/citoyenavise/citoyenavise.git
cd citoyenavise
npm run install:all

# 2. Configurer backend
cd backend
cp .env.example .env
# Éditer .env : DATABASE_URL, JWT_SECRET, BREVO_SMTP_*, etc.

# 3. Démarrer PostgreSQL (local OU docker)
# Option A: Local
createdb citoyenavise_dev
psql citoyenavise_dev -c "CREATE EXTENSION postgis;"

# Option B: Docker
docker-compose up -d postgres redis

# 4. Démarrer dev (à la racine)
npm run dev
# Backend: http://localhost:5000 (Express)
# Frontend: http://localhost:5173 (Vite)
# Swagger: http://localhost:5000/api-docs
```

### Commandes Principales

```bash
# Development
npm run dev              # Backend + Frontend (concurrent)
npm --prefix backend run dev    # Backend seul (nodemon)
npm --prefix frontend run dev   # Frontend seul (Vite)

# Build & Production
npm run build           # Frontend build (Vite)
npm --prefix backend start      # Production server

# Testing
npm test               # Backend Jest tests
npm --prefix frontend test      # Frontend Vitest tests
npm --prefix backend run test:e2e  # Playwright e2e

# Code Quality
npm run lint           # ESLint backend + frontend
npm run lint:fix       # Auto-fix linting issues
npm run format         # Prettier formatting
npm run security:check # npm audit (backend + frontend)

# Database
npm --prefix backend run seed     # Seed initial data
npm --prefix backend run migrate  # Run migrations (Sequelize)

# Docker
docker-compose up               # Start services (postgres, redis, pgAdmin, app)
docker-compose --profile debug up  # Include pgAdmin + Redis Commander
```

---

## 📝 API Endpoints (Implémentés)

### Authentication (Magic Link)
```
POST   /api/v1/auth/request-login          Demander magic link
GET    /api/v1/auth/verify?token=xyz       Vérifier token
POST   /api/v1/auth/complete-profile       Compléter profil (Protected)
GET    /api/v1/auth/me                     Utilisateur actuel (Protected)
POST   /api/v1/auth/logout                 Déconnexion (Protected)
```

### Élus (Public)
```
GET    /api/v1/elus                        Lister avec filters
GET    /api/v1/elus/:id                    Détail
GET    /api/v1/elus/niveau/:niveau         Filter par niveau
GET    /api/v1/elus/région/:région         Filter par région
GET    /api/v1/elus/search?q=              Recherche full-text FR
GET    /api/v1/elus/stats                  Statistiques
```

### Circonscriptions (Public)
```
GET    /api/v1/circonscriptions            Lister
GET    /api/v1/circonscriptions/:id        Détail
GET    /api/v1/circonscriptions/by-code-postal
GET    /api/v1/circonscriptions/by-région
GET    /api/v1/circonscriptions/search?q=  Recherche
GET    /api/v1/circonscriptions/stats      Statistiques
```

### Pétitions (Mixed)
```
Public:
GET    /api/v1/petitions                   Lister (status=published)
GET    /api/v1/petitions/:id               Détail
GET    /api/v1/petitions/:id/signatures    Signataires
GET    /api/v1/petitions/:id/updates       Mises à jour
GET    /api/v1/petitions/:id/comments      Commentaires
GET    /api/v1/petitions/top/signed        Top 10
GET    /api/v1/petitions/search?q=         Recherche

Protected:
POST   /api/v1/petitions                   Créer
PUT    /api/v1/petitions/:id               Mettre à jour (draft)
POST   /api/v1/petitions/:id/publish       Publier
POST   /api/v1/petitions/:id/sign          Signer
DELETE /api/v1/petitions/:id/sign          Retirer signature
POST   /api/v1/petitions/:id/updates       Ajouter mise à jour
DELETE /api/v1/petitions/:id/updates/:id   Supprimer mise à jour
POST   /api/v1/petitions/:id/comments      Ajouter commentaire
DELETE /api/v1/petitions/:id/comments/:id  Supprimer commentaire
```

### Engagements Élus
```
Public:
GET    /api/v1/elu-commitments             Lister
GET    /api/v1/elu-commitments/:id         Détail
GET    /api/v1/elu-commitments/elu/:eluId  Par élu
GET    /api/v1/elu-commitments/status/:s   Par statut
GET    /api/v1/elu-commitments/search?q=   Recherche
GET    /api/v1/elu-commitments/stats       Statistiques

Protected:
POST   /api/v1/elu-commitments/:id/track   Suivre
DELETE /api/v1/elu-commitments/:id/track   Arrêter de suivre
```

### Autres Routes
```
GET    /api/v1/actualites                  News articles
GET    /api/v1/promises                    Promesses électorales
GET    /api/v1/civic-tutorials             Tutoriels civiques
GET    /api/v1/transparency/ranking        Classement transparence
GET    /api/v1/gamification                Gamification stats
GET    /api/v1/admin/*                     Admin dashboard (Protected)
GET    /api/v1/health                      Health check
```

---

## 🌍 Internationalisation (i18n)

**Langues supportées** : FR (défaut), EN

**Implémentation** :
- Frontend : i18next + react-i18next + i18next-browser-languagedetector
- Backend : i18next pour logs/emails
- Traductions stockées en fichiers JSON (`frontend/public/i18n/`)
- Detection : URL param > localStorage > navigateur > fallback FR

**Utilisation Frontend** :
```jsx
import { useTranslation } from 'react-i18next';

function Component() {
  const { t, i18n } = useTranslation();
  return <h1>{t('page.title')}</h1>;
}
```

---

## 🗺️ Géolocalisation & Carte

**Libraires** : Leaflet + react-leaflet + leaflet.markercluster

**Composants** :
- `<Map />` : Carte interactive avec clustering
- `<EluMarker />` : Marqueurs élus (icons, popups)
- Intégration dans `MapPage.jsx`

---

## 🔐 Sécurité

### Headers HTTP (Helmet)
- Content-Security-Policy (CSP)
- X-Frame-Options: DENY (anti-clickjacking)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security (HSTS)
- Permissions-Policy (geolocation, microphone, camera disabled)

### CORS
- Whitelist d'origines : localhost:5173, localhost:5000, 127.0.0.1:5173
- Credentials autorisés
- Methods : GET, POST, PUT, DELETE, PATCH, OPTIONS

### Rate Limiting
- Middleware express-rate-limit
- Global : 100 requêtes par IP / 15 minutes
- Configurable par route

### Authentication
- **Magic Link** : Email transactionnel (Brevo SMTP)
- **JWT** : Access token (24h) + Refresh token (7 days)
- **Magic Link Flow** :
  1. Utilisateur clique "Se connecter"
  2. Entre email
  3. Reçoit lien magic (token + email en URL)
  4. Clique lien → Vérifie token
  5. Complète profil (optionnel)
  6. JWT émis

### Data Validation
- Backend : Zod schemas
- Frontend : Controlled inputs + error messages

---

## 🧪 Testing

### Backend (Jest)
```bash
npm --prefix backend test              # All tests
npm --prefix backend run test:lint     # Lint tests
npm --prefix backend run test:coverage # Coverage report
npm --prefix backend run test:e2e      # Playwright e2e
```

**Fichiers test** : `backend/__tests__/*.test.js`

### Frontend (Vitest)
```bash
npm --prefix frontend test             # All tests
npm --prefix frontend run test:coverage # Coverage
npm --prefix frontend run test:i18n    # i18n integrity
```

**Fichiers test** : `frontend/__tests__/*.test.js`

---

## 📊 Base de Données

### Modèles Sequelize (30+)
- **Core** : User, Elu, Circonscription, Petition, EluCommitment
- **Content** : Actualite, Promise, CivicTutorial, Comment
- **Gamification** : Badge, Mission, UserBadge, DomainProgression
- **Admin** : ActivityMetrics, UserProgression, CivicAction
- **Support** : Signature, EmailVerification, Translation

### Associations
- Défini dans `models/index.js`
- Respecte conventions Sequelize
- Support multi-langue via *Translation models

### Synchronisation
- Dev : `await sequelize.sync({ alter: false })` au démarrage
- Prod : Migrations SQL manuelles (via scripts/migrate.js)

---

## 🚢 Déploiement

### Docker Local
```bash
docker-compose up               # Full stack (postgres, redis, app)
docker-compose --profile debug up  # + pgAdmin, Redis Commander
```

### Environment Variables (Production)
```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
JWT_SECRET=... (32+ chars)
BREVO_SMTP_HOST, USER, PASS
FRONTEND_URL=...
CORS_ORIGIN=...
```

---

## 📌 Git Workflow

### Branches
- `main` : Production (automatic deployment)
- `develop` : Integration (pull requests)
- `feature/*` : Feature branches

### Commit Messages
```
feat: add feature X
fix: resolve bug Y
refactor: improve Z
docs: update docs
chore: maintenance
test: add tests
```

---

## 🔄 État d'Implémentation (v1.0.0)

- ✅ Architecture & Setup (Express, React, PostgreSQL)
- ✅ Database Schema (Sequelize 30+ models)
- ✅ Authentication (Magic Link JWT)
- ✅ API Routes (14 fichiers, 50+ endpoints)
- ✅ Frontend Components (Pages, layout, responsive)
- ✅ i18n (FR/EN multilingual)
- ✅ Carte interactive (Leaflet + markers)
- ✅ Gamification (Badges, missions, progression)
- ✅ Tests (Jest, Vitest, Playwright setup)
- ✅ CI/CD (GitHub Actions workflows)
- ✅ Docker & docker-compose
- ✅ Security (Helmet, CORS, Rate Limiting)
- ⏳ Production deployment (pipeline ready, awaiting infrastructure)
- ⏳ Advanced features (Full-text search optimization, caching strategies)

---

## 📞 Troubleshooting

### Backend ne démarre pas
```bash
# Vérifier Node + PostgreSQL
node --version  # 18+
psql -l         # Test DB connection

# Vérifier .env
cat backend/.env | grep DATABASE_URL

# Réinstaller deps
cd backend && npm install && npm run dev
```

### Frontend CORS errors
```
→ Vérifier CORS_ORIGIN dans backend/.env
→ S'assure que frontend tourne sur localhost:5173
→ Redémarrer backend avec PORT=5000
```

### Docker issues
```bash
docker-compose logs postgres  # Debug postgres
docker-compose logs app       # Debug app
docker system prune           # Clean up
```

---

## 📞 Contact

- **Projet** : https://github.com/citoyenavise/citoyenavise
- **Email** : infocitoyenavise@gmail.com
- **État** : v1.0.0 (82 commits non poussés, prêt pour production)
