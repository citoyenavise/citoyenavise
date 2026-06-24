# SYNTHÈSE OFFICIELLE — citoyenavise.org

> **Version 3 — Architecture territoriale intégrée**
> Document de référence unique pour tous les opérateurs et développeurs intervenant sur le projet.
> Cette synthèse fait autorité. Elle remplace `.claude/CLAUDE.md` désynchronisé.
> **Toute décision, toute mise à jour, toute correction doit être consignée dans la section *Journal des mises à jour* (§22).**

---

## 0. EN-TÊTE

| Champ | Valeur |
|-------|--------|
| Nom du projet | citoyenavise.org |
| Nature | Plateforme civique canadienne — participation citoyenne |
| Propriétaire | M. Fortin |
| Contact | infocitoyenavise@gmail.com |
| Dépôt | https://github.com/citoyenavise/citoyenavise |
| Répertoire local | `C:\Users\Dave\citoyenavise` |
| Branche active | `main` |
| Version du document | V3 — Architecture territoriale intégrée |
| Dernière révision | 2026-06-23 |
| Phase actuelle | Restructuration post-over-engineering vers MVP |
| Avancement global | **~99 %** (CI/CD hardened, prod stable, seed Québec ville LIVE, BD migrée vers Neon Free (Frankfurt) 2026-05-14. Reste Phase F technique + Phases G-K vision) |
| URL publique production | **https://citoyenavise.org** |
| URL API publique production | **https://api.citoyenavise.org** |

---

## 1. MISSION, VISION, POSITIONNEMENT

### 1.1 Mission fondatrice
Rendre les institutions publiques canadiennes *visibles, compréhensibles et accessibles* à chaque citoyen, partout au Canada.

### 1.2 Objectifs transformationnels
- Réduire la distance entre le citoyen et l'institution.
- Transformer la *curiosité* en *participation*.
- Rendre l'engagement civique *intuitif et désirable*.

### 1.3 Vision long terme
Construire l'*infrastructure civique numérique vivante du Canada* : un système nerveux civique qui relie les institutions, les élus, les territoires, les données publiques et les citoyens.

*Le site ne fermera pas.* citoyenavise.org est une infrastructure civique à long terme, pas un projet à durée déterminée. Les phases G à K sont inévitables. Le pilote Québec ville détermine le rythme, pas la direction.

### 1.4 Positionnement produit
citoyenavise.org est, simultanément :
1. Une *plateforme civique* de participation.
2. Une *carte civique interactive* du territoire.
3. Un *hub d'information civique* (rôle de Wikipédia civique).
4. Un *guide pratique d'action citoyenne*.
5. Un *réseau social civique*.
6. Une *plateforme éducative progressive*.
7. Un *système d'intelligence collective citoyenne*.

---

## 2. VALEURS FONDAMENTALES

| Valeur | Implication produit |
|--------|---------------------|
| Neutralité politique stricte | Aucune ligne partisane, aucun favoritisme. |
| Transparence institutionnelle | Données vérifiables, sources citées, traçabilité. |
| Accessibilité radicale | Langage simple, mobile-first, design anti-intimidation. |
| Participation active | Toute consultation appelle une action concrète. |
| Empowerment citoyen | L'utilisateur monte en compétence à chaque interaction. |

---

## 3. AVANCEMENT GLOBAL

| Volet | Avancement | État |
|-------|-----------|------|
| 1. Fondations backend (Express, Sequelize, sécurité) | 95 % | ✅ Stable |
| 2. Fondations frontend (React, Vite, i18n, routing) | 90 % | ✅ Stable |
| 3. Modèles de données (Sequelize) | 85 % | ✅ Circonscription refactorisée |
| 4. Authentification (Magic Link + JWT) | 85 % | ✅ Fonctionnel |
| 5. Routes API publiques | 90 % | ✅ Documentées via Swagger |
| 6. Internationalisation (FR/EN) | 95 % | ✅ Complet (accueil) |
| 7. Carte interactive (Leaflet) | 75 % | ✅ Testée |
| 8. Tests (Jest, Vitest, Playwright) | 30 % | 🔴 Nettoyage en cours |
| 9. CI/CD (GitHub Actions) | 75 % | ✅ Opérationnel |
| 10. Sécurité (Helmet, CORS, rate-limit, JWT) | 90 % | ✅ Conforme |
| 11. Conteneurisation (Docker, compose) | 80 % | ✅ Aligné |
| 12. Déploiement Render | 90 % | ✅ Live production |
| 13. Pages HTML statiques (public/) | 45 % | ⚠️ Partiellement auditées |
| 14. Documentation interne | 80 % | ✅ Synthèse V3 |
| 15. UX / Cycle utilisateur (Arriver → Influencer → Revenir) | 40 % | 🟡 HomePage en place |
| 16. Citizen Awakening System | 0 % | 🔴 Phase G |
| 17. Établissements (carte, fiches, relations) | 25 % | 🔴 À structurer |
| 18. Infrastructure de données publiques (NPKI / PDE / KGE) | 10 % | 🔴 Conceptuel |
| 19. Gamification | 50 % | 🟡 Hors MVP — gelée |
| 20. Laboratoire de participation citoyenne | 0 % | 🔴 Post-MVP |
| 21. IA civique (« L'Utopie ») | 0 % | 🔴 Vision future |
| 22. Architecture territoriale (TERRITOIRE_TEMPLATE) | 15 % | 🟡 Template créé — intégration BD à faire |

*MVP fonctionnel déployé* : *85 % → 98 %*.
*Plateforme cible (vision complète)* : *~30 %*.

---

## 4. STACK TECHNIQUE OFFICIELLE

### 4.1 Frontend
| Composant | Version | Rôle |
|-----------|---------|------|
| React | 18.2 | UI |
| React DOM | 18.2 | Rendu DOM |
| Vite | 5.0 | Bundler + dev server |
| React Router | 6.20 | Routage SPA |
| Zustand | 4.4 | State management |
| TailwindCSS | 3.3 | Styling utilitaire |
| i18next + react-i18next + detector + http-backend | 26.0 / 17.0 / 8.2 / 4.0 | i18n FR/EN |
| Leaflet + react-leaflet + markercluster | 1.9 / 4.2 / 1.5 | Cartographie |
| Sentry React + tracing | 10.52 / 7.12 | Suivi d'erreurs (désactivé) |
| Vitest + Testing Library | 1.0 / 14.1 | Tests |
| Playwright (via backend) | 1.59 | E2E |
| axe-core + @axe-core/react + jest-axe | 4.11 / 4.11 / 10 | Accessibilité |
| PostCSS + Autoprefixer | 8.4 / 10.4 | CSS pipeline |
| ESLint + Prettier | 8.55 / 3.0 | Qualité |

### 4.2 Backend
| Composant | Version | Rôle |
|-----------|---------|------|
| Node.js | ≥ 18 | Runtime |
| Express | 4.18 | Serveur HTTP |
| Sequelize | 6.32 | ORM |
| pg | 8.8 | Driver PostgreSQL |
| Helmet | 7.0 | Headers sécurité |
| CORS | 2.8 | Politique d'origine |
| express-rate-limit | 8.5 | Anti-abus |
| jsonwebtoken | 9.0 | JWT |
| nodemailer | 6.9 | SMTP (Magic Link) |
| zod | 3.21 | Validation |
| swagger-jsdoc + swagger-ui-express | 6.2 / 5.0 | Documentation API |
| uuid | 14.0 | Identifiants |
| dotenv | 16.0 | Variables d'env |
| Jest + Supertest | 29.5 / 6.3 | Tests |
| ESLint airbnb-base | 8.40 | Qualité |
| Nodemon | 2.0 | Reload dev |
| Husky | 8.0 | Hooks Git |

### 4.3 Infrastructure
| Composant | Rôle |
|-----------|------|
| PostgreSQL 15 | Base de données |
| PostGIS | Données géospatiales |
| Redis 7 | Cache (optionnel) |
| Docker + Compose | Conteneurisation |
| Docker Hub | Registre images |
| Render | Hébergement cible |
| GitHub Actions | CI/CD |
| pgAdmin / Redis Commander | Debug (profil docker-compose) |

### 4.4 Services tiers / API externes
| Service | Usage | Statut |
|---------|-------|--------|
| Brevo SMTP (ou Gmail SMTP) | Magic Link | À configurer |
| Slack Webhook | Notifications CI | Optionnel |
| Sentry | Monitoring erreurs | Désactivé |
| SonarQube / Snyk | Sécurité CI | Référencé, non vérifié |
| Docker Hub API | Push images | Secret à configurer |
| Render API | Déploiement | Secret à configurer |
| GitHub API (gh) | Secrets | gh non installé en local |

---

## 5. ARCHITECTURE — MODULES ET CONNEXIONS

### 5.1 Vue d'ensemble (couches applicatives)

```
[ Utilisateur (navigateur) ]
            │
            ▼
[ Frontend React (Vite) :5173 ]
   ├─ React Router (préfixe /:lang)
   ├─ AuthContext (Magic Link / JWT)
   ├─ Zustand (état global)
   ├─ i18next (FR/EN)
   └─ Leaflet (carte)
            │ HTTP / JSON
            ▼
[ Backend Express :5000 ]
   ├─ Helmet, CORS, Rate Limiter
   ├─ Middleware i18n
   ├─ Auth (JWT bearer)
   ├─ Swagger /api-docs
   ├─ Routes (14 fichiers)
   ├─ Services (auth, email, geolocation, transparence)
   └─ Sequelize ORM
            │
            ▼
[ PostgreSQL 15 + PostGIS ]
            │
            ▼
[ Redis 7 (cache, optionnel) ]

[ Brevo SMTP ] ◄── EmailService (Magic Link)
[ Sentry ]    ◄── (désactivé)
[ CI: GitHub Actions ] → Docker Hub → Render
```

### 5.2 Infrastructure de données publiques (vision cible)
Couches conceptuelles à bâtir au-dessus de la stack existante.

| Couche | Sigle | Rôle |
|--------|-------|------|
| National Public Knowledge Infrastructure | *NPKI* | Cadre global de la connaissance civique nationale. |
| Data Acquisition Layer | *DAL* | Collecte (scraping, imports, contributions). |
| Public Data Engine | *PDE* | Pipeline : RAW → VALIDATED → NORMALIZED → ENRICHED → LINKED → PUBLISHED. |
| Knowledge Graph Engine | *KGE* | Graphe des entités (élus, institutions, lieux, relations). |
| Geo Intelligence Layer | *GIL* | Logique géospatiale (PostGIS). |
| Public Publishing Layer | *PPL* | Exposition publique (API, fiches, cartes). |
| Integrity & Version Control | *IVC* | Historique, audit, intégrité. |
| Automation & Refresh Engine | *ARE* | Mise à jour continue, vérification, alertes. |

*Relation avec l'architecture territoriale* : le TERRITOIRE est l'entité organisatrice de toutes ces couches. DAL classe vers un territoire. PDE enrichit et lie au territoire. KGE maintient le graphe de relations territoriales. GIL gère les polygones territoriaux.

### 5.3 Modules backend (état actuel)
- `server.js` : point d'entrée Express.
- `config/env.js` : variables d'environnement.
- `db/sequelize.js` : connexion + `testConnection()`.
- `models/` : 32 modèles Sequelize.
- `routes/` : 14 routeurs (auth, elus, circonscriptions, petitions, elu-commitments, actualites, comments, promises, civic-tutorials, transparency, gamification, admin, health, index).
- `services/` : AuthService, EmailService, geolocation, transparencyScore, i18n, health.
- `middlewares/` : auth, adminAuth, admin, logger, rateLimiter, i18n, validateRequest.
- `swagger/` : documentation.
- `utils/` : helpers.

### 5.4 Modules frontend (état actuel)
- `App.jsx` + AuthProvider + Suspense.
- `contexts/AuthContext.js`.
- `pages/` : 11 pages.
- `components/` : Header, Map, EluMarker, LanguageSelector/Switcher, Toast, ErrorPage, ProtectedRoute, ProtectedAdminRoute, ui/.
- `hooks/`, `stores/`, `api/`, `i18n/`, `styles/`.

### 5.5 Connexions externes (flux clés)
- *Magic Link* : `POST /auth/request-login` → SMTP → `GET /auth/verify` → JWT.
- *Carte* : `GET /elus` + filtres → markers Leaflet (clustering).
- *Pétitions* : CRUD + signatures + commentaires.
- *Admin* : routes protégées par `adminAuth.js`.

---

## 6. EXPÉRIENCE UTILISATEUR STRATÉGIQUE

### 6.1 Cycle utilisateur principal
Arriver → Comprendre → Explorer → Participer → Influencer → Revenir

### 6.2 Master Action Matrix

| # | Action | Statut |
|---|--------|--------|
| 1 | Explorer la carte | 🟠 Partiel |
| 2 | Lire une fiche institutionnelle | 🔴 À structurer |
| 3 | Suivre un élu | 🟠 Backend prêt, UX à finir |
| 4 | Signer une pétition | ✅ Implémenté |
| 5 | Commenter | ✅ Implémenté |
| 6 | Ajouter une photo | 🔴 Non implémenté |
| 7 | Corriger une donnée | 🔴 Non implémenté |
| 8 | Signaler un problème | 🔴 Non implémenté |
| 9 | Participer à une consultation | 🔴 Non implémenté |
| 10 | Vérifier son inscription électorale | 🔴 Non implémenté |
| 11 | Sauvegarder des lieux | 🔴 Non implémenté |
| 12 | Compléter des missions | 🟡 Modèles présents, hors MVP |

### 6.3 Principes UX
- *Mobile-first*.
- *Langage simple* (anti-jargon).
- *Anti-intimidation*.
- *Dévoilement progressif* de l'information.
- *Chaque écran appelle une action* ou une compréhension.

---

## 7. CITIZEN AWAKENING SYSTEM (stratégie de lancement)

### 7.1 Phases d'éveil
1. *Isolement* — l'utilisateur arrive dans un territoire silencieux.
2. *Échos* — premiers signaux d'autres citoyens.
3. *Constellations* — regroupements d'activité visibles.
4. *Visages* — identification d'autres participants.
5. *Monde éveillé* — densité civique pleine.

### 7.2 Mécaniques associées
- *Awareness Score* : indicateur de densité civique d'un territoire.
- *Brouillard civique* : voile visuel qui se dissipe à mesure que la zone s'éveille.
- *Statut Pionniers* : reconnaissance des « premières lumières » d'une zone.

### 7.3 Statut
Module *post-MVP*. À cadrer en Phase G.

---

## 8. LABORATOIRE DE PARTICIPATION CITOYENNE

### 8.1 Architecture pédagogique
Apprendre → Simuler → Agir → Confirmer

### 8.2 Fonctions prévues
- Simulateur de courriel à un élu.
- Tutoriels de plaintes (consommation, santé, services publics).
- Guide d'accès à l'information (demandes AI/ATIP).
- Confirmation d'actions réelles (autodéclaration + preuve facultative).
- Récompenses comportementales (badges, XP).

### 8.3 Statut
Phase I.

---

## 9. ÉTABLISSEMENTS — RÔLE STRATÉGIQUE

Chaque établissement doit exister *simultanément* sous sept formes :

1. Un *point sur la carte* (GIL).
2. Une *entité de données* (PDE / KGE).
3. Une *page publique* (PPL).
4. Un *nœud relationnel* (graphe : élus, circonscriptions, citoyens).
5. Un *espace d'interaction citoyenne* (commentaires, photos, signalements).
6. Un *objet de suivi* (abonnement, alertes).
7. Un *historique vivant* (IVC : versions, contributions, événements).

*Décision actée* : les établissements sont autonomes pour l'instant. Ils seront reliés à leur territoire parent lors de la Phase H.

---

## 10. GAMIFICATION (post-MVP)

Gelée pendant le MVP.

| Élément | Description |
|---------|-------------|
| XP citoyen | Points cumulés par action vérifiée. |
| Badges | Reconnaissances thématiques. |
| Niveaux | Progression globale. |
| Rôles débloqués | Accès à des fonctions avancées. |
| Score d'influence | Mesure de l'impact civique. |
| Collections thématiques | Sets cohérents. |
| Missions | Quotidiennes / hebdomadaires / saisonnières. |

*Modèles déjà présents en BD* : Badge, Mission, UserBadge, UserMissionProgress, UserProgression, DomainProgression, ActivityMetrics, CivicAction, UserAction. Gelés côté frontend MVP.

---

## 11. IA CIVIQUE — « L'UTOPIE » (vision future)

### 11.1 Rôles envisagés
- *Guide civique* : oriente l'utilisateur vers l'action pertinente.
- *Philosophe citoyen* : pose les bonnes questions, ne tranche pas.
- *Assistant d'action* : aide à rédiger, simuler, vérifier.

### 11.2 Statut
*Hors MVP. Vision long terme.* Phase K.

---

## 12. INVENTAIRE OPEN SOURCE

### 12.1 Production (backend)
cors, dotenv, express, express-rate-limit, helmet, jsonwebtoken, nodemailer, pg, sequelize, swagger-jsdoc, swagger-ui-express, uuid, zod.

### 12.2 Production (frontend)
@axe-core/react, @sentry/react, @sentry/tracing, axe-core, i18next, i18next-browser-languagedetector, i18next-http-backend, jest-axe, leaflet, leaflet.markercluster, react, react-dom, react-i18next, react-leaflet, react-router-dom, zustand.

### 12.3 Développement
@playwright/test, @testing-library/jest-dom, @testing-library/react, @testing-library/user-event, @vitejs/plugin-react, @vitest/coverage-v8, @vitest/ui, autoprefixer, axios, eslint, eslint-config-airbnb-base, eslint-plugin-import, eslint-plugin-react, eslint-plugin-react-hooks, husky, jest, jsdom, nodemon, postcss, prettier, supertest, tailwindcss, vite, vitest.

### 12.4 Images Docker
node:18-alpine, postgres:15-alpine, redis:7-alpine, dpage/pgadmin4:latest, rediscommander/redis-commander:latest.

---

## 13. INVENTAIRE DES API INTERNES

### 13.1 Authentification
```
POST   /api/v1/auth/request-login
GET    /api/v1/auth/verify
POST   /api/v1/auth/complete-profile     (protégé)
GET    /api/v1/auth/me                   (protégé)
POST   /api/v1/auth/logout               (protégé)
```

### 13.2 Élus
```
GET    /api/v1/elus
GET    /api/v1/elus/:id
GET    /api/v1/elus/niveau/:niveau
GET    /api/v1/elus/region/:region
GET    /api/v1/elus/search?q=
GET    /api/v1/elus/stats
```

### 13.3 Circonscriptions
```
GET    /api/v1/circonscriptions
GET    /api/v1/circonscriptions/:id
GET    /api/v1/circonscriptions/by-code-postal
GET    /api/v1/circonscriptions/by-region
GET    /api/v1/circonscriptions/search?q=
GET    /api/v1/circonscriptions/stats
```

### 13.4 Pétitions
Public :
```
GET    /api/v1/petitions
GET    /api/v1/petitions/:id
GET    /api/v1/petitions/:id/signatures
GET    /api/v1/petitions/:id/updates
GET    /api/v1/petitions/:id/comments
GET    /api/v1/petitions/top/signed
GET    /api/v1/petitions/search?q=
```

Protégé :
```
POST   /api/v1/petitions
PUT    /api/v1/petitions/:id
POST   /api/v1/petitions/:id/publish
POST   /api/v1/petitions/:id/sign
DELETE /api/v1/petitions/:id/sign
POST   /api/v1/petitions/:id/updates
DELETE /api/v1/petitions/:id/updates/:id
POST   /api/v1/petitions/:id/comments
DELETE /api/v1/petitions/:id/comments/:id
```

### 13.5 Engagements d'élus
Public :
```
GET    /api/v1/elu-commitments
GET    /api/v1/elu-commitments/:id
GET    /api/v1/elu-commitments/elu/:eluId
GET    /api/v1/elu-commitments/status/:s
GET    /api/v1/elu-commitments/search?q=
GET    /api/v1/elu-commitments/stats
```

Protégé :
```
POST   /api/v1/elu-commitments/:id/track
DELETE /api/v1/elu-commitments/:id/track
```

### 13.6 Autres
```
GET    /api/v1/actualites
GET    /api/v1/promises
GET    /api/v1/comments
GET    /api/v1/civic-tutorials
GET    /api/v1/transparency/ranking
GET    /api/v1/gamification
GET    /api/v1/admin/*                   (protégé)
GET    /health                            (Render health probe — hors préfixe API)
GET    /api-docs                         (Swagger UI)
```

---

## 14. PROBLÈMES IDENTIFIÉS

| # | Sévérité | Problème | Localisation | Action |
|---|---------|----------|--------------|--------|
| 1 | 🔴 Critique | 82 commits non poussés vers origin/main | git | Revue + push |
| 2 | 🔴 Critique | gh CLI non installé / non authentifié | machine locale | Installer + `gh auth login` |
| 3 | 🔴 Critique | Aucun secret GitHub configuré (Docker Hub, Render, SMTP) | GitHub repo | `gh secret set` |
| 4 | 🔴 Critique | Render non configuré (pas de service, pas d'API key) | infra | Créer service + récupérer API_KEY + SERVICE_ID |
| 5 | 🟠 Élevée | Incohérence de port : .env.example = 3000 ; Dockerfile/compose = 5000 | backend | Fixer un port unique (recommandé : 5000) |
| 6 | 🟠 Élevée | Tests massivement supprimés sans remplacement | backend/__tests__/, backend/tests/ | Statuer : restaurer ou recréer minimum |
| 7 | 🟠 Élevée | CLAUDE.md désynchronisé | .claude/CLAUDE.md | Remplacer par renvoi vers cette synthèse |
| 8 | 🟠 Élevée | Dossier backend/migrations/ introuvable | backend | Créer migrations OU documenter `sync()` |
| 9 | 🟡 Moyenne | Sentry désactivé sans plan | frontend | Décider : retirer ou réactiver |
| 10 | 🟡 Moyenne | 32 modèles Sequelize, dont modules hors MVP | backend/src/models/ | Geler gamification, tutoriels, transparence |
| 11 | 🟡 Moyenne | Fichiers untracked importants | racine | `git add` + commit |
| 12 | 🟡 Moyenne | node_modules/ apparaît en untracked | racine | Vérifier `.gitignore` |
| 13 | 🟢 Faible | Pages HTML statiques non auditées | frontend/public/ | Audit ou suppression |
| 14 | 🟢 Faible | Mot de passe staging codé en dur dans docker-compose.yml | infra | Externaliser |
| 15 | 🟢 Faible | JWT_SECRET staging visible dans docker-compose.yml | infra | Externaliser |
| 16 | 🟠 Élevée | Vision (NPKI/PDE/KGE) non outillée | architecture | Cadrer en Phase H/J |
| 17 | 🟡 Moyenne | Master Action Matrix : 7/12 actions manquantes | UX | Cadrer en Phase G |
| 18 | ✅ Résolu | Circonscription.js refactorisé du legacy pg pool vers Sequelize | backend/src/models/Circonscription.js | ✅ Commit 2d8a70e |
| 19 | 🟡 Moyenne | SYNC_ALTER=true doit être retiré de Render env après utilisation | dashboard Render | Retirer manuellement après chaque réalignement |
| 20 | 🟡 Partiellement résolu | Workflow Tests & Quality : hang post-tests résolu 2026-05-14 via `forceExit: true` dans jest.config.js (commit e704e45). 5 familles de bugs détectées (#24-28). Tests qui passent : i18n, i18n.integrity, health, Promise, lint (49 tests verts). | backend/jest.config.js | Hang fixé. Bugs sous-jacents à traiter Phase F. |
| 21 | ✅ Résolu | Seed Québec ville LIVE en prod via endpoint admin POST /api/v1/admin/seed-petitions | backend/src/routes/admin-seed.js | ✅ Commit `147e3d0` |
| 22 | 🟡 Moyenne — bloqué Hobby | Inbound IP BD Render = 0.0.0.0/0 (non-modifiable plan Hobby). | dashboard Render | À débloquer lors du passage plan Pro. Phase F. |
| 23 | ✅ Résolu | BD migrée de Render Free vers Neon Free. Migration exécutée 2026-05-14. Backend sur Neon. | dashboard Neon + Render | ✅ |
| 24 | 🟠 Élevée | Vestiges CJS dans projet ESM : 8 fichiers tests/ utilisent require(). | backend/tests/**/*.test.js | Supprimer ou migrer vers ESM. Phase F. |
| 25 | 🟠 Élevée | Tests référençant modules supprimés (Gamification, pde, Admin). | backend/__tests__/ | describe.skip(...) ou suppression. Phase F. |
| 26 | 🟡 Moyenne | Validations Elu désynchronisées dans transparency.test.js. | backend/__tests__/transparency.test.js | Aligner valeurs `niveau`. Phase F. |
| 27 | 🟠 Élevée | Désynchronisation table signatures (petition_signatures vs signatures). | backend/src/db/pool.js | Harmoniser. Phase F. |
| 28 | 🟡 Moyenne | sequelize.drop() après sequelize.close() dans transparency.test.js. | backend/__tests__/transparency.test.js | Inverser ordre. Phase F. |
| 29 | 🟢 Faible | deploy.yml rejette HTTP 202 de Render (file d'attente). | .github/workflows/deploy.yml | Élargir test à `201 OR 202`. Phase F. |
| 30 | 🟢 Faible | Express trust proxy non configuré → warning ERR_ERL_UNEXPECTED_X_FORWARDED_FOR. | backend/src/server.js | app.set('trust proxy', 1). Phase F. |

---

## 15. PHASES, ÉTAPES ET SOUS-ÉTAPES

### PHASE A — STABILISATION (priorité absolue)

*A.1 — Audit Git*
- A.1.1 Lister les 82 commits non poussés.
- A.1.2 Décider : push, squash, ou rebase.
- A.1.3 Pousser vers origin/main.
- A.1.4 Définir politique de branches.

*A.2 — Outils opérateur*
- A.2.1 Installer gh CLI.
- A.2.2 `gh auth login`.
- A.2.3 Vérifier accès Docker Hub, Render.

*A.3 — Cohérence de configuration*
- A.3.1 Port unique (5000).
- A.3.2 Aligner .env.example, Dockerfile, docker-compose.yml, vite.config.js.
- A.3.3 Marquer CLAUDE.md obsolète.

*A.4 — Périmètre MVP*
- A.4.1 Liste MVP : auth Magic Link, élus, circonscriptions, pétitions, carte, i18n, fiches d'établissements minimales.
- A.4.2 Geler : gamification, civic-tutorials, transparency, promises avancées, actualites avancées, Sentry, Citizen Awakening, Laboratoire, IA.
- A.4.3 Consigner la décision (§22 et §23).

### PHASE B — SECRETS ET INFRASTRUCTURE
- B.1 Secrets locaux (JWT_SECRET, SMTP Brevo).
- B.2 Secrets GitHub (Docker Hub, Render, SMTP, JWT).
- B.3 Service Render (Web Service, PostgreSQL, variables env).

### PHASE C — BASE DE DONNÉES
- C.1 Migrations versionnées vs sync({ alter: false }).
- C.2 Créer backend/migrations/.
- C.3 Vérifier seed initial.

### PHASE D — TESTS MINIMAUX
- D.1 Backend : auth, elus, petitions, health.
- D.2 Frontend : Login, VerifyPage, PetitionsListPage, Header.
- D.3 E2E : parcours Magic Link.

### PHASE E — DÉPLOIEMENT INITIAL
- E.1 Build Docker → Docker Hub.
- E.2 Workflow deploy.yml.
- E.3 Render tire l'image.
- E.4 Vérification /health, /api-docs, accueil.
- E.5 DNS citoyenavise.org → Render.

### PHASE F — POST-MVP TECHNIQUE
- F.1 Réactivation Sentry.
- F.2 Optimisations performance, cache Redis.
- F.3 Audit pages HTML statiques.
- F.4 SEO + accessibilité.
- F.5 Correction bugs #24 à #30.
- F.6 app.set('trust proxy', 1) (#30).

### PHASE G — EXPÉRIENCE CITOYENNE
- G.1 Stabiliser onboarding (Arriver → Comprendre).
- G.2 Déployer Citizen Awakening System.
- G.3 Implémenter premiers parcours d'action (Master Action Matrix).

### PHASE H — BASE CIVIQUE NATIONALE
- H.1 Structurer toutes les catégories d'établissements.
- H.2 Relier les établissements à leur territoire parent.
- H.3 Mettre en place DAL + PDE + GIL.
- H.4 IVC (historique, versions).
- H.5 Déploiement progressif des territoires (cf. §25.4 — Phases territoriales).

### PHASE I — PARTICIPATION GUIDÉE
- I.1 Déployer Laboratoire de participation.
- I.2 Tutoriels civiques interactifs.
- I.3 Vérification d'inscription électorale.
- I.4 Consultations.

### PHASE J — INTELLIGENCE COLLECTIVE
- J.1 Système d'idées.
- J.2 Agrégation des signaux citoyens.
- J.3 Influence mesurable.
- J.4 KGE opérationnel.

### PHASE K — IA CIVIQUE
- K.1 Déploiement progressif de L'Utopie.
- K.2 Garde-fous (neutralité, sources, transparence).

---

## 16. ORDRE DE PRIORITÉ (FEUILLE DE ROUTE OPÉRATIONNELLE)

### 🔥 PRIORITÉ IMMÉDIATE

| ⏰ | Tâche | Échéance | Détail |
|----|-------|----------|--------|
| ✅ | BD Render Free expire — RÉSOLU par migration vers Neon Free | ~~5 juin 2026~~ | cf. §14 #23 |
| 🟡 | Supprimer BD Render Free après 7 jours de stabilité Neon | ~2026-05-21 | cf. §14 #23 |

### Roadmap historique

| Rang | Tâche | Phase | Bloquant pour |
|------|-------|-------|---------------|
| 1 | Installer gh CLI + auth | A.2 | tout le reste |
| 2 | Décider du sort des 82 commits + pousser | A.1 | collaboration multi-dev |
| 3 | Valider précisément le périmètre MVP | A.4 | toutes les phases suivantes |
| 4 | Aligner le port (5000) partout | A.3 | déploiement |
| 5 | Remplacer CLAUDE.md par renvoi vers cette synthèse | A.3 | onboarding |
| 6 | Récupérer credentials Docker Hub | B.2 | CI/CD |
| 7 | Créer service Render + API key + Service ID | B.3 | déploiement |
| 8 | Configurer secrets GitHub via gh secret set | B.2 | workflows CI/CD |
| 9 | Configurer SMTP Brevo | B.1 | magic link prod |
| 10 | Statuer migrations vs sync | C.1 | reproductibilité BD |
| 11 | Restaurer suite de tests minimale | D | qualité |
| 12 | Premier déploiement Render | E | livraison MVP |
| 13 | Vérification post-déploiement | E.4 | validation |
| 14 | DNS citoyenavise.org → Render | E.5 | mise en ligne publique |
| 15 | Phase F (Sentry, perf, SEO, bugs #24-30) | F | qualité prod |
| 16 | Phase G (UX + Citizen Awakening) | G | engagement |
| 17 | Phase H (Base civique nationale + territoires) | H | données |
| 18 | Phase I (Laboratoire) | I | autonomie civique |
| 19 | Phase J (Intelligence collective) | J | impact mesurable |
| 20 | Phase K (IA L'Utopie) | K | vision long terme |

---

## 17. PROCÉDURE DE TRAVAIL ENTRE OPÉRATEURS

1. *Avant toute action* : lire cette synthèse à jour + `_todo/taches.md`.
2. *Une tâche = une branche* : `feature/<sujet>` à partir de `main`.
3. *Commit conventionnel* : feat:, fix:, refactor:, chore:, docs:, test:.
4. *Push uniquement sur demande explicite* du propriétaire.
5. *Toute modification structurelle* consignée en §22.
6. *Toute décision architecturale* consignée en §20.
7. *Aucun secret en clair* dans les échanges.
8. *Format de réponse opérateur* : action / emplacement / commande / attendu / statut.
9. *Hors-MVP gelé* : aucun travail sur gamification, tutoriels, IA, transparence avancée tant que le MVP n'est pas déployé.

---

## 18. ÉTAT DU DÉPÔT (instantané)

| Élément | Valeur |
|---------|--------|
| Branche | main |
| Commits non poussés | 82 |
| Fichiers modifiés non commités | 11 |
| Fichiers supprimés non commités | 11 (tests) |
| Dernier commit | 8708115 release: v1.0.0 complete foundation rebuild |
| Remote | https://github.com/citoyenavise/citoyenavise.git |

---

## 19. SECRETS À CONFIGURER (NOMS UNIQUEMENT)

| Nom du secret | Plateforme | État |
|---------------|------------|------|
| DOCKER_USERNAME | GitHub | à configurer |
| DOCKER_PASSWORD | GitHub | à configurer |
| RENDER_API_KEY | GitHub | à configurer |
| RENDER_SERVICE_ID | GitHub | à configurer |
| SMTP_HOST | GitHub | à configurer |
| SMTP_USER | GitHub | à configurer |
| SMTP_PASSWORD | GitHub | à configurer |
| SMTP_FROM | GitHub | à configurer |
| JWT_SECRET (prod) | GitHub + Render | à générer |
| DATABASE_URL (prod) | Render | à générer |
| SLACK_WEBHOOK | GitHub | optionnel |

---

## 20. DÉCISIONS ARCHITECTURALES

| Date | Décision | Justification |
|------|----------|---------------|
| 2026-05-13 | Hébergement Render | Choix du propriétaire |
| 2026-05-13 | ORM Sequelize maintenu | Code existant déjà bâti dessus |
| 2026-05-13 | Cette synthèse remplace CLAUDE.md | CLAUDE.md désynchronisé |
| 2026-05-13 | Modules avancés gelés en post-MVP | Restructuration post-over-engineering |
| 2026-05-13 | Adoption des couches NPKI / DAL / PDE / KGE / GIL / PPL / IVC / ARE | Vision cible long terme |
| 2026-05-13 | Conservation du nom de code « L'Utopie » pour l'IA civique | Continuité de la vision |
| 2026-06-23 | *Le TERRITOIRE est l'unité fondamentale du système* | Tout objet doit être relié à un territoire parent. Ni l'élu, ni la municipalité, ni le projet — le territoire. |
| 2026-06-23 | *TERRITOIRE_TEMPLATE unique* dont tous les territoires héritent | Un seul modèle pour 1200 territoires. Claude n'a jamais à inventer. |
| 2026-06-23 | *Les représentants ne possèdent pas les données* | Ils sont reliés aux territoires. Les budgets et projets demeurent dans le territoire. |
| 2026-06-23 | *Les établissements sont autonomes pour l'instant* | Reliés à leur territoire parent en Phase H. |
| 2026-06-23 | *Modération réactive (Option B)* | Tout est publié, retiré sur signalement. Charge opérateur minimale. |
| 2026-06-23 | *Contributions citoyennes* | Compte requis. Validation automatique. Conflit → INBOX. Pas de retrait. Responsabilité = celui qui publie. |
| 2026-06-23 | *Site ouvert permanent* | Pas de fermeture prévue. Infrastructure civique à long terme. |
| 2026-06-23 | *Métriques MVP* | 1 signature suffit pour être « signataire actif ». Fenêtre 30 jours glissants. Tableau de bord interne uniquement. |
| 2026-06-23 | *Règle de pivot* | Si seuil 30 signataires à 3 mois non atteint → prolongation de 2 mois. Jamais de fermeture. |
| 2026-06-23 | *Hiérarchie territoriale à 6 niveaux* | Niveau 1 (Canada/Province) → 2 (Régions) → 3 (MRC) → 4 (Municipalités) → 5 (Arrondissements/Quartiers, VIDE si inexistant) → 6 (Districts + Circonscriptions). |
| 2026-06-23 | *Niveau 5 vide si inexistant* | Les territoires sans arrondissements officiels (ex : Laval) ont le niveau 5 vide. On passe directement au niveau 6. |
| 2026-06-23 | *Méthode d'ingestion 3 passes* | PASS 1 structure → PASS 2 ingestion par catégorie → PASS 3 synthèse. Jamais mélangées. Protocole complet dans REGLES_INGESTION.md. |
| 2026-06-23 | *Déploiement territorial par phases* | Phase 1 : 19 fiches (Canada + QC + 17 régions). Phase 2 : 10 grandes villes (Québec ville en priorité). Phase 3 : MRC + municipalités. Phase 4 : niveaux 5. Phase 5 : niveaux 6. |
| 2026-06-23 | *Peer review citoyen reporté à Phase J* | Trop complexe sous 500 utilisateurs. Validation automatique maintenue pour le MVP et le pilote. |

---

## 21. POINTS DE CONTACT TECHNIQUE

| Service | URL |
|---------|-----|
| Dépôt | https://github.com/citoyenavise/citoyenavise |
| Docker Hub | https://hub.docker.com/settings/security |
| Render | https://dashboard.render.com/account/api-tokens |
| Brevo | https://app.brevo.com |
| Slack Webhooks | https://api.slack.com/messaging/webhooks |
| Sentry | https://sentry.io |
| Neon | https://console.neon.tech |

---

## 22. JOURNAL DES MISES À JOUR DE CE DOCUMENT

| Date | Auteur | Modification |
|------|--------|--------------|
| 2026-05-13 | Opérateur | Création de la synthèse officielle (V1) |
| 2026-05-13 | Opérateur | V2 — Intégration du MASTER INVENTORY |
| 2026-05-13 | Opérateur | V2.1 — Phase A finalisée + Phase B exécutée |
| 2026-05-13 | Opérateur | Phase B.2 — 7 secrets GitHub configurés |
| 2026-05-13 | Opérateur | Phase B.3-B.4 — Backend Render reconfiguré |
| 2026-05-13 | Opérateur | Backend MVP Live |
| 2026-05-13 | Opérateur | Brevo SMTP configuré et testé |
| 2026-05-13 | Opérateur | Finalisation MVP |
| 2026-05-13 | Opérateur | 🎉 MVP CITOYENAVISE.ORG DÉPLOYÉ EN PRODUCTION |
| 2026-05-14 | Opérateur | Session de finalisation MVP — 11 bugs corrigés |
| 2026-05-14 | Opérateur | 🌐 DOMAINE citoyenavise.org LIVE |
| 2026-05-14 | Opérateur | Décisions stratégiques Q6 + O5 actées — pilote Québec ville |
| 2026-05-14 | Opérateur | Chantier 1 — Bug #18 résolu (Circonscription.js) |
| 2026-05-14 | Opérateur | Chantier 2 — Page d'accueil créée (HomePage.jsx) |
| 2026-05-14 | Opérateur | Chantier 3 — Seed Québec ville |
| 2026-05-14 | Opérateur | Chantier A — CI Deploy hardening |
| 2026-05-14 | Opérateur | Chantier B — CI Tests setup:db |
| 2026-05-14 | Opérateur | Chantier C — Doc /health corrigée |
| 2026-05-14 | Opérateur | Chantier D — Seeder idempotent |
| 2026-05-14 | Opérateur | Doc stratégique trackée |
| 2026-05-14 | Opérateur | Merge sur main + push |
| 2026-05-14 | Opérateur | 🚨 Incident sécurité — DATABASE_URL écrasée (récupérée) |
| 2026-05-14 | Opérateur | 🚨 Incident sécurité — fuite DATABASE_URL (rotation effectuée) |
| 2026-05-14 | Opérateur | Service IDs Render notés |
| 2026-05-14 | Opérateur | Cleanup repo |
| 2026-05-14 | Opérateur | 🎯 Bug #21 RÉSOLU — Seed Québec ville LIVE en prod |
| 2026-05-14 | Opérateur | N1 — Cleanup pétition résiduelle générique |
| 2026-05-14 | Opérateur | Roadmap §16 — priorité immédiate marquée |
| 2026-05-14 | Opérateur | N2 — Swagger doc endpoints admin |
| 2026-05-14 | Opérateur | #22 INVESTIGUÉ — bloqué par plan Hobby |
| 2026-05-14 | Opérateur | Décision #23 — Migration BD vers Neon Free actée |
| 2026-05-14 | Opérateur | Règle 6.3 CLAUDE.md — Syntaxe blocs de code |
| 2026-05-14 | Opérateur | 🚨 INCIDENT 2h downtime — DATABASE_URL Internal vs External |
| 2026-05-14 | Opérateur | Règle 6.4 CLAUDE.md — DATABASE_URL = Internal URL uniquement |
| 2026-05-14 | Opérateur | 🚀 MIGRATION BD RENDER → NEON RÉUSSIE |
| 2026-05-14 | Opérateur | Service IDs Neon notés |
| 2026-05-14 | Opérateur | Avancement global 98% → 99% |
| 2026-05-14 | Opérateur | Session post-migration Neon — Phase 1 Consolidation |
| 2026-05-14 | Opérateur | Vérification stabilité Neon T+5h |
| 2026-05-14 | Opérateur | Plan de surveillance 7j créé |
| 2026-05-14 | Opérateur | 🐛 Bug #20 PARTIELLEMENT RÉSOLU — hang Jest + 5 familles de bugs détectées |
| 2026-05-14 | Opérateur | Bugs #29 et #30 consignés |
| 2026-06-23 | Opérateur | *V3 — Architecture territoriale intégrée* : §25 créé (Architecture territoriale complète), §20 enrichi (10 nouvelles décisions architecturales), §3 mis à jour (volet 22 ajouté), §15 Phase H enrichie, §1.3 vision long terme mise à jour (site ouvert permanent), §23 Q2/Q3/Q5 actées. |
| 2026-06-23 | Opérateur | *Hiérarchie territoriale à 6 niveaux actée* : Niveau 1 (Canada/Province) → Niveau 2 (Régions) → Niveau 3 (MRC) → Niveau 4 (Municipalités) → Niveau 5 (Arrondissements/Quartiers — VIDE si inexistant) → Niveau 6 (Districts + Circonscriptions provinciales + fédérales). Exemple Laval-des-Rapides documenté. |
| 2026-06-23 | Opérateur | *Méthode d'ingestion 3 passes actée* : PASS 1 (structure vide) → PASS 2 (ingestion par catégorie, une à la fois) → PASS 3 (synthèse + liens). Règles absolues, checklist obligatoire, violations = arrêt immédiat. |
| 2026-06-23 | Opérateur | *Kit Claude Code complet créé* : 5 fichiers produits — TERRITOIRE_TEMPLATE.md (218L), SOURCES_OFFICIELLES.md (351L), REGLES_INGESTION.md (400L), COMMANDE_CLAUDE_CODE_PHASE1_2.md (507L), SYNTHESE_V3.md (1039L+). Kit prêt à envoyer à Claude Code. |
| 2026-06-23 | Opérateur | *SOURCES_OFFICIELLES.md* : répertoire complet de toutes les URLs nécessaires — organisé par niveau territorial (1 à 6) + par catégorie (population, éducation, santé, finances, projets, enjeux, géospatial). Ordre d'ingestion en 10 étapes documenté. |
| 2026-06-23 | Opérateur | *COMMANDE_CLAUDE_CODE_PHASE1_2.md* : commande maître complète pour Phase 1 (19 territoires) et Phase 2 (10 grandes villes). Codes TERRITOIRE_0001 à 0029 assignés. Québec ville (TERRITOIRE_0021) identifiée priorité absolue Phase 2 (pilote). Règles spéciales par ville documentées (Montréal/arrondissements, Laval/niveau 5 vide). |
| 2026-06-23 | Opérateur | *Kit Claude Code déployé dans le dépôt (5/5)* : les 5 fichiers regroupés dans `docs/` (SYNTHESE_V3, TERRITOIRE_TEMPLATE, SOURCES_OFFICIELLES, REGLES_INGESTION, COMMANDE_CLAUDE_CODE_PHASE1_2). Synthèse déplacée de `_ai/SYNTHESE_OFFICIELLE.md` → `docs/SYNTHESE_V3.md` (git mv). Commande slash `/territoire` créée (`.claude/commands/territoire.md`) : recharge les 4 fichiers du kit avant toute ingestion. |
| 2026-06-23 | Opérateur | *Arborescence d'ingestion créée* (§25.9) : `territoires/niveau_1→6`, `representants/`, `institutions/`, `enjeux/`, `projets/`, `decisions/`, `statistiques/`, `archives/`, `data/geo/`, `INBOX/`. `INBOX_GLOBAL.md` initialisée (vide). Dossiers vides en attente — ingestion NON démarrée (point de validation M. Fortin requis). |
| 2026-06-23 | Opérateur | *Limite technique consignée* : l'outil d'accès web (WebFetch) lit le HTML mais ne télécharge pas les fichiers binaires/GeoJSON/CSV volumineux. L'ÉTAPE 1.0 (couches géospatiales) nécessitera un script externe (`curl` + `ogr2ogr`/`shp2pgsql` vers PostGIS), pas l'agent. |
| 2026-06-23 | Opérateur | *SOURCES_POTENTIELLES.md créé (V1)* : répertoire élargi — 5 familles (données ouvertes & API, registres de transparence, vérification & data-journalisme, plateformes civiques benchmark, géospatial par niveau). Portée Québec d'abord. Trouvailles clés : Polimètre (suivi promesses, ULaval), SEAO format OCDS, Élections Québec financement politique, Décrypteurs/Détecteur de rumeurs, EveryPolitician/Open States (modèles de schéma). Sources à promouvoir vers SOURCES_OFFICIELLES.md sur décision M. Fortin. |
| 2026-06-23 | Opérateur | *Pipeline d'ingestion établi (PIPELINE_INGESTION.md)* : canal de téléchargement réel validé — curl + API CKAN Données Québec (`scripts/ingest/dq.mjs`), WFS GeoJSON, WebFetch (HTML), Jina Reader via curl. Réseau sortant confirmé (14 Mo testés). |
| 2026-06-23 | Opérateur | *Chaîne géospatiale installée (directive M. Fortin, options 2+3)* : geopandas 1.1.3 + GDAL 3.11.4 (pyogrio) + shapely + pyproj. Conversion SHP→GeoJSON opérationnelle (`scripts/ingest/shp2geojson.py`). CLI ogr2ogr/PostGIS différés (vision GIL). |
| 2026-06-23 | Opérateur | *DOCTRINE_INGESTION.md créée (directive M. Fortin)* : « max données publiques / min tokens » en 4 couches (sources officielles d'abord → extraction ciblée ENTITÉ+INFORMATION → outils Firecrawl/Jina/Tavily/Exa → base de connaissance PostgreSQL/Qdrant). Méthode 6 étapes alignée sur les 3 passes. Firecrawl/Tavily/Exa + Qdrant/N8N à provisionner. |
| 2026-06-23 | Opérateur | *Canada (TERRITOIRE_0001) ingéré* — PASS 1+2+3, 100 % sources officielles (StatCan recensement 2021 via Jina Reader, pm.gc.ca, noscommunes, Budget 2025). Pop. 36 991 981, PM Carney, chef opp. Poilievre, prés. Chambre Scarpaleggia, budget 2025-26, chômage 10,3 %/propriété 66,5 %/bac+ 32,9 %. Reste : centroïde géo (couche légère). |
| 2026-06-23 | Opérateur | *Frontend territoire LIVE* — page `/territoire` (carte + liste) + `/territoire/canada` ; module découplé du système éditorial. Carte choroplèthe des **17 régions admin QC** (source MERN/SDA, geopandas) : frontières + couleurs + sélection au clic. Accueil épuré (slogan retiré), « Élus » + « Territoire » au menu. Déployé et vérifié sur citoyenavise.org. |
| 2026-06-23 | Opérateur | *Auto-deploy Dokploy réparé* — maillon manquant = webhook GitHub absent (toggle ON mais jamais notifié). Webhooks créés → chaque push main redéploie (rolling ~30-90 s). Dokploy `2.24.217.42:3000`, backend migré Render→VPS. Audit complet : `_ai/40_journal_sessions/2026-06-23_session_territoire-frontend.md`. |

---

## 23. QUESTIONS OUVERTES (à trancher avec le propriétaire)

### 23.1 Périmètre et gouvernance
- *Q1* — Liste exacte des fonctionnalités incluses dans le MVP final ?
- ✅ *Q2* — Politique de modération : *Option B — réactive*. Tout publié, retiré sur signalement. (acté 2026-06-23)
- ✅ *Q3* — Gouvernance des contributions : compte requis, validation automatique, conflit → INBOX, pas de retrait, responsabilité = celui qui publie. (acté 2026-06-23)
- *Q4* — Profils utilisateurs : *autonomes pour l'instant*. À reconsidérer Phase G.
- *Q5* — Score d'influence et de réputation citoyen (critères, transparence, recours) : *Phase J*. Pas urgent MVP.

### 23.2 Stratégie de lancement
- ✅ *Q6* — Pilote : *Québec ville*. Trajectoire : Québec ville (3m) → Province QC (m4-12) → Pan-Canada (an 2+).
- *Q7* — Stratégie d'acquisition initiale → cataloguage manuel ~25 élus Québec ville.
- *Q8* — Politique de validation des données citoyennes → cf. Q3 acté.
- *Q9* — Recrutement premiers utilisateurs → 20 Pionniers via réseau local.

### 23.3 Tensions stratégiques
- *T1* — MVP minimal vs ambition système complet.
- *T2* — Neutralité politique vs moteur d'influence démocratique.
- *T3* — Simplicité UX vs densité informationnelle.

### 23.4 Dimensions opérationnelles
- *O1* — Modèle économique / financement. ⚠️ Priorité à moyen terme : site permanent = financement permanent requis.
- *O2* — Cadre légal (Loi 25 Québec, LPRPDE).
- *O3* — Modération et sécurité communautaire.
- *O4* — Politique éditoriale.
- ✅ *O5* — Métriques MVP : signataires actifs / 30j. Seuils 30/150/500 à 3/6/12 mois. 1 signature suffit. Interne uniquement. Règle de pivot : prolongation 2 mois si seuil non atteint. Jamais de fermeture. (acté 2026-06-23)
- ✅ *O6* — Plan géographique : pilote Québec ville → expansion progressive.
- *O7* — Seed initial des données → cataloguage manuel ~25 élus Québec ville + 3-5 pétitions seed locales.
- ✅ *O8* — Recrutement premiers utilisateurs : 20 Pionniers via réseau local.

---

## 24. RAPPORT D'INTÉGRATION V2

### 24.1 Éléments intégrés depuis le MASTER INVENTORY
Mission fondatrice, vision long terme, positionnement à 7 facettes, valeurs fondamentales, cycle utilisateur, Master Action Matrix, Citizen Awakening System, Laboratoire de participation, rôle stratégique des établissements, couches NPKI/DAL/PDE/KGE/GIL/PPL/IVC/ARE, gamification consolidée, IA « L'Utopie », phases G à K, questions ouvertes.

### 24.2 Doublons fusionnés
- Mission principale → §1.1 unique.
- « Infrastructure civique numérique » → harmonisé en §1.3.
- « Hub d'information civique » et « Wikipédia civique » → fusionné en §1.4.
- Gamification dispersée → consolidée en §10.

### 24.3 Tensions consignées (cf. §23.3)
T1 (MVP vs ambition), T2 (neutralité vs influence), T3 (simplicité vs densité).

---

## 25. ARCHITECTURE TERRITORIALE

Section ajoutée V3 — 2026-06-23
Décision fondatrice : le territoire est l'unité fondamentale du système.
Pas l'élu. Pas la municipalité. Pas le projet. Le territoire.


### 25.1 Principe fondateur

*Règle d'or — absolue et permanente :*

Quand Claude reçoit une information, il doit d'abord répondre : à quel territoire appartient cette information ?


- Si un territoire est trouvé → classer dans le territoire concerné.
- Si aucun territoire n'est trouvé → *INBOX* (traitement manuel par opérateur).

Tout objet du système doit être relié à un territoire parent. À partir de là, même avec 10 000 territoires, 50 000 élus et des millions de documents, la structure reste stable.

### 25.2 Hiérarchie des entités

```
Territoire
    ↓
Représentants (reliés au territoire, ne le possèdent pas)
    ↓
Institutions (autonomes, reliées au territoire)
    ↓
Décisions (appartiennent au territoire)
    ↓
Projets (appartiennent au territoire)
    ↓
Citoyens (interagissent avec le territoire)
    ↓
Historique (conservé dans le territoire)
```

### 25.3 Hiérarchie territoriale officielle à 6 niveaux

*Décision actée 2026-06-23 — M. Fortin*

Le système CitoyenAvisé organise l'information par territoire, pas par ministère.
Le citoyen ne vit pas dans un ministère. Il vit dans un territoire.
C'est la rupture fondamentale avec tous les systèmes gouvernementaux actuels.

```
NIVEAU 1 — Canada / Québec (Province)

NIVEAU 2 — 17 Régions administratives
  ├── Bas-Saint-Laurent
  ├── Saguenay–Lac-Saint-Jean
  ├── Capitale-Nationale
  ├── Mauricie
  ├── Estrie
  ├── Montréal
  ├── Outaouais
  ├── Abitibi-Témiscamingue
  ├── Côte-Nord
  ├── Nord-du-Québec
  ├── Gaspésie–Îles-de-la-Madeleine
  ├── Chaudière-Appalaches
  ├── Laval
  ├── Lanaudière
  ├── Laurentides
  ├── Montérégie
  └── Centre-du-Québec

NIVEAU 3 — MRC / Territoires équivalents
  ├── 87 MRC
  ├── 10 Territoires équivalents aux MRC
  └── 8 Communautés autochtones hors MRC

NIVEAU 4 — Municipalités
  └── 1100+ Municipalités locales

NIVEAU 5 — Arrondissements / Quartiers / Secteurs
  ├── Arrondissements officiels (ex : 19 arrondissements Montréal)
  ├── Quartiers officiels
  ├── Secteurs reconnus
  └── VIDE si le territoire n'a pas de subdivisions officielles
      (ex : Laval = ville unifiée → niveau 5 vide)

NIVEAU 6 — Couches électorales et administratives fines
  ├── Districts municipaux
  ├── Circonscriptions provinciales (~125 au Québec)
  └── Circonscriptions fédérales (~338 au Canada)
```

*Pourquoi le niveau 6 est le plus puissant :*

Les frontières électorales ne suivent jamais les frontières administratives.
Un même quartier peut appartenir à trois circonscriptions différentes.
Le modèle gère ça naturellement parce que ces couches sont parallèles, pas imbriquées.

*Exemple concret — Laval-des-Rapides :*

Un citoyen arrive sur la fiche Laval-des-Rapides.
Il voit immédiatement sur une seule page :

```
NIVEAU 4  → Territoire municipal : Laval-des-Rapides
NIVEAU 5  → Vide (Laval n'a pas d'arrondissements)
NIVEAU 6  → District municipal     : [X]
            Circonscription prov.  : Laval-des-Rapides
            Circonscription féd.   : Laval—Les Îles

REPRÉSENTANTS →
  Conseiller municipal
  Député provincial
  Député fédéral

INSTITUTIONS →
  Écoles, CLSC, hôpitaux

FINANCES →
  Budget, taxes

PROJETS ET ENJEUX LOCAUX
```

Aucun autre système au Canada ne fait ça aujourd'hui.

### 25.4 Phases de déploiement territorial

| Phase territoriale | Contenu | Volume | Statut |
|-------------------|---------|--------|--------|
| *1* | Canada + Québec Province + 17 régions administratives | 19 fiches | ✅ EN COURS — commande maître prête |
| *2* | 10 grandes villes (Québec ville EN PREMIER — pilote) | 10 fiches | 🟡 Après validation Phase 1 |
| *3* | Toutes les MRC + municipalités | ~1200 fiches | 🔴 Après validation Phase 2 |
| *4* | Arrondissements, quartiers, secteurs reconnus | variable | 🔴 Niveau 5 vide si inexistant |
| *5* | Districts municipaux + 125 circ. provinciales + ~78 circ. fédérales QC | ~463 fiches | 🔴 Dernière phase |

*Principe* : CitoyenAvisé grandit de façon contrôlée sans générer des milliers de fiches vides.
*Validation requise de M. Fortin* entre chaque phase avant de passer à la suivante.
*Québec ville traité en priorité absolue* en Phase 2 — c'est le pilote.

### 25.5 Modèle TERRITOIRE_TEMPLATE

Un seul template. Tous les territoires héritent du même modèle. Claude n'a jamais à inventer.

*Fichier de référence* : TERRITOIRE_TEMPLATE.md (créé 2026-06-23)

*Structure du template :*

```
IDENTITÉ
├── Code territoire (TERRITOIRE_XXXX)
├── Nom officiel
├── Niveau (0 à 5)
├── Territoire parent
└── Statut

GÉOGRAPHIE
├── Coordonnées centroïde
├── Polygone GeoJSON
└── Superficie

POPULATION
└── Statistiques recensement

REPRÉSENTATION
├── Élu fédéral → lien REPRESENTANT_XXXX
├── Élu provincial → lien REPRESENTANT_XXXX
├── Élu municipal → lien REPRESENTANT_XXXX
└── Élu scolaire → lien REPRESENTANT_XXXX

CIRCONSCRIPTIONS ÉLECTORALES
├── Fédéral
├── Provincial
├── Municipal — District
└── Scolaire

INSTITUTIONS → liens INSTITUTION_XXXX
FINANCES → liens DOCUMENT
DÉCISIONS → liens DECISION_XXXX
PROJETS → liens PROJET_XXXX
CONSULTATIONS → liens CONSULTATION_XXXX
ENJEUX → comparaison multi-niveaux
STATISTIQUES → indicateurs + comparaison provinciale
PARTICIPATION → métriques CitoyenAvisé
HISTORIQUE ET ARCHIVES
INBOX → informations non classées en attente
MÉTADONNÉES DE LA FICHE
```

### 25.6 Modèle REPRESENTANT

Un représentant ne possède jamais les données. Il est relié aux territoires.

```
REPRESENTANT_XXXX
├── Identité (nom, photo, biographie)
├── Territoires représentés → liens TERRITOIRE_XXXX
├── Mandats (dates, niveau)
├── Votes
├── Promesses
└── Historique
```

Les budgets et projets demeurent dans le territoire.

### 25.7 Modèle PROJET

Un projet n'existe jamais seul. Toujours relié à un territoire.

```
PROJET_XXXX
├── Titre
├── Territoire → lien TERRITOIRE_XXXX  ← obligatoire
├── Coût
├── État (annoncé / en cours / complété / annulé)
└── Responsables → liens REPRESENTANT_XXXX
```

### 25.8 Modèle ENJEU

Un même enjeu existe à plusieurs niveaux simultanément.

```
ENJEU : Logement
├── Niveau Canada → données nationales
├── Niveau Québec → données provinciales
├── Niveau Laval → données municipales
└── Niveau Laval-des-Rapides → données locales
```

CitoyenAvisé peut ainsi faire des comparaisons entre niveaux sur un même enjeu.

### 25.9 Structure de dossiers recommandée

```
01_TERRITOIRES/
├── Canada/
├── Provinces/
├── MRC/
├── Municipalités/
├── Arrondissements/
└── Districts_électoraux/

02_REPRESENTANTS/
├── Fédéral/
├── Provincial/
├── Municipal/
└── Scolaire/

03_INSTITUTIONS/
├── Écoles/
├── Hôpitaux/
├── CLSC/
├── Organismes/
└── Ministères/

04_ENJEUX/
├── Logement/
├── Transport/
├── Santé/
├── Fiscalité/
├── Éducation/
└── Sécurité/

05_PROJETS/
06_DECISIONS/
07_STATISTIQUES/
08_ARCHIVES/
INBOX/
```

### 25.10 Méthode d'ingestion — 3 passes obligatoires

*Décision actée 2026-06-23*

Toute fiche territoire se remplit en 3 passes strictement séparées. Jamais mélangées.

```
PASS 1 → STRUCTURE      Squelette vide. Structure uniquement. Zéro contenu.
PASS 2 → INGESTION      Données brutes classées. Une catégorie = une commande.
PASS 3 → SYNTHÈSE       Liens, cohérence, validation. Aucune nouvelle donnée.
```

*Règles absolues PASS 2 :*
- Toute donnée doit avoir une source (URL + année).
- Donnée absente = champ vide. Jamais inventé.
- Donnée incertaine ou en conflit → INBOX.
- Checklist obligatoire après chaque catégorie.

*Ordre d'ingestion des catégories :*
Géographie → Identité → Population → Représentants → Circonscriptions → Institutions (x4) → Finances → Projets → Décisions → Consultations → Statistiques → Enjeux → Synthèse.

*Violations qui déclenchent un arrêt immédiat :*
Donnée inventée / source non autorisée / deux catégories mélangées / synthèse pendant PASS 2 / territoire parent absent / PASS 2 sans PASS 1 validée / PASS 3 sans PASS 2 complète.

Protocole complet → REGLES_INGESTION.md

---

### 25.11 Kit Claude Code — fichiers de référence

*Décision actée 2026-06-23 — Kit complet créé*

Cinq fichiers constituent le kit de travail que Claude Code lit au début de chaque session.

| Fichier | Rôle | Lignes |
|---------|------|--------|
| SYNTHESE_V3.md | Mémoire complète du projet | 1039+ |
| TERRITOIRE_TEMPLATE.md | Le moule unique dont tous héritent | 218 |
| SOURCES_OFFICIELLES.md | Toutes les URLs officielles par niveau et catégorie | 351 |
| REGLES_INGESTION.md | Protocole absolu des 3 passes | 400 |
| COMMANDE_CLAUDE_CODE_PHASE1_2.md | Instructions territoire par territoire Phase 1 & 2 | 507 |

*Instruction d'ouverture de session Claude Code :*
Lis ces 4 fichiers dans cet ordre avant toute action :
1. /citoyenavise/docs/SYNTHESE_V3.md
2. /citoyenavise/docs/TERRITOIRE_TEMPLATE.md
3. /citoyenavise/docs/SOURCES_OFFICIELLES.md
4. /citoyenavise/docs/REGLES_INGESTION.md
Confirme la lecture des 4 avant de continuer.

*Sources officielles couvertes :*
Niveau 1 (Canada/Québec) → Niveau 2 (17 régions) → Niveau 3 (MRC) → Niveau 4 (municipalités) → Niveau 5 (arrondissements) → Niveau 6 (districts + circonscriptions) + Population (StatCan) + Éducation (MEES) + Santé (MSSS) + Finances (MAMH) + Projets (SEAO/BAPE) + Enjeux (sources thématiques) + Géospatial (GeoJSON complet).

---

### 25.12 Réconciliation avec NPKI / DAL / PDE / KGE

L'architecture territoriale et les couches NPKI/DAL/PDE/KGE sont complémentaires, pas exclusives.

| Couche | Rôle dans le contexte territorial |
|--------|----------------------------------|
| NPKI | Fixe les règles de classification territoriale |
| DAL | Classe toute donnée entrante vers un territoire parent |
| PDE | Enrichit et lie chaque entité à son territoire |
| KGE | Maintient le graphe des relations territoire ↔ entités |
| GIL | Gère les polygones géographiques de chaque territoire |
| PPL | Expose les fiches territoire publiquement |
| IVC | Conserve l'historique de chaque territoire |
| ARE | Déclenche les mises à jour quand un territoire change |

---

*Fin de la synthèse officielle — V3.*
*Toute mise à jour, correction, décision ou réponse à une question ouverte doit être consignée dans les sections 20, 22 et 23 ci-dessus.*
