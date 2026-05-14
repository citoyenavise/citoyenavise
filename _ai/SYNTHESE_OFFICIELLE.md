# SYNTHÈSE OFFICIELLE — citoyenavise.org

> **Version 2 — intégrée et enrichie**
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
| Version du document | V2 — intégrée |
| Dernière révision | 2026-05-13 |
| Phase actuelle | Restructuration post-over-engineering vers MVP |
| Avancement global | **~98 %** (CI/CD hardened, prod stable, seed Québec ville LIVE en prod via endpoint admin. Reste Phase F technique + Phases G-K vision) |
| URL publique production | **https://citoyenavise.org** |
| URL API publique production | **https://api.citoyenavise.org** |

---

## 1. MISSION, VISION, POSITIONNEMENT

### 1.1 Mission fondatrice
Rendre les institutions publiques canadiennes **visibles, compréhensibles et accessibles** à chaque citoyen, partout au Canada.

### 1.2 Objectifs transformationnels
- Réduire la distance entre le citoyen et l'institution.
- Transformer la **curiosité** en **participation**.
- Rendre l'engagement civique **intuitif et désirable**.

### 1.3 Vision long terme
Construire l'**infrastructure civique numérique vivante du Canada** : un système nerveux civique qui relie les institutions, les élus, les territoires, les données publiques et les citoyens.

### 1.4 Positionnement produit
citoyenavise.org est, simultanément :
1. Une **plateforme civique** de participation.
2. Une **carte civique interactive** du territoire.
3. Un **hub d'information civique** (rôle de Wikipédia civique).
4. Un **guide pratique d'action citoyenne**.
5. Un **réseau social civique**.
6. Une **plateforme éducative progressive**.
7. Un **système d'intelligence collective citoyenne**.

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
| 14. Documentation interne | 75 % | ✅ Synthèse V2.1 |
| 15. UX / Cycle utilisateur (Arriver → Influencer → Revenir) | 40 % | 🟡 HomePage en place |
| 16. Citizen Awakening System | 0 % | 🔴 Phase G |
| 17. Établissements (carte, fiches, relations) | 25 % | 🔴 À structurer |
| 18. Infrastructure de données publiques (NPKI / PDE / KGE) | 10 % | 🔴 Conceptuel |
| 19. Gamification | 50 % | 🟡 Hors MVP — gelée |
| 20. Laboratoire de participation citoyenne | 0 % | 🔴 Post-MVP |
| 21. IA civique (« L'Utopie ») | 0 % | 🔴 Vision future |

**MVP fonctionnel déployé** : **85 % → 98 %**.
**Plateforme cible (vision complète)** : **~30 %**.

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
| GitHub API (`gh`) | Secrets | `gh` non installé en local |

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
Couches conceptuelles à bâtir au-dessus de la stack existante. Elles structurent la transformation des données brutes en savoir civique vivant.

| Couche | Sigle | Rôle |
|--------|-------|------|
| National Public Knowledge Infrastructure | **NPKI** | Cadre global de la connaissance civique nationale. |
| Data Acquisition Layer | **DAL** | Collecte (scraping, imports, contributions). |
| Public Data Engine | **PDE** | Pipeline : `RAW → VALIDATED → NORMALIZED → ENRICHED → LINKED → PUBLISHED`. |
| Knowledge Graph Engine | **KGE** | Graphe des entités (élus, institutions, lieux, relations). |
| Geo Intelligence Layer | **GIL** | Logique géospatiale (PostGIS). |
| Public Publishing Layer | **PPL** | Exposition publique (API, fiches, cartes). |
| Integrity & Version Control | **IVC** | Historique, audit, intégrité. |
| Automation & Refresh Engine | **ARE** | Mise à jour continue, vérification, alertes. |

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
- `App.jsx` + `AuthProvider` + Suspense.
- `contexts/AuthContext.js`.
- `pages/` : 11 pages.
- `components/` : Header, Map, EluMarker, LanguageSelector/Switcher, Toast, ErrorPage, ProtectedRoute, ProtectedAdminRoute, `ui/`.
- `hooks/`, `stores/`, `api/`, `i18n/`, `styles/`.

### 5.5 Connexions externes (flux clés)
- **Magic Link** : `POST /auth/request-login` → SMTP → `GET /auth/verify` → JWT.
- **Carte** : `GET /elus` + filtres → markers Leaflet (clustering).
- **Pétitions** : CRUD + signatures + commentaires.
- **Admin** : routes protégées par `adminAuth.js`.

---

## 6. EXPÉRIENCE UTILISATEUR STRATÉGIQUE

### 6.1 Cycle utilisateur principal
```
Arriver → Comprendre → Explorer → Participer → Influencer → Revenir
```
Chaque étape doit avoir un livrable produit identifiable. Aucune étape ne doit être un cul-de-sac.

### 6.2 Master Action Matrix
Liste officielle des actions citoyennes que la plateforme doit rendre possibles :

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
- **Mobile-first**.
- **Langage simple** (anti-jargon).
- **Anti-intimidation** : aucune action ne doit faire peur, exiger une compétence préalable, ou supposer un vocabulaire institutionnel.
- **Dévoilement progressif** de l'information (lutter contre la surcharge cognitive).
- **Chaque écran appelle une action** ou une compréhension.

---

## 7. CITIZEN AWAKENING SYSTEM (stratégie de lancement)

Stratégie officielle de **cold start** : la plateforme se peuple et s'éveille progressivement avec l'arrivée des premiers citoyens.

### 7.1 Phases d'éveil
1. **Isolement** — l'utilisateur arrive dans un territoire silencieux.
2. **Échos** — premiers signaux d'autres citoyens.
3. **Constellations** — regroupements d'activité visibles.
4. **Visages** — identification d'autres participants.
5. **Monde éveillé** — densité civique pleine.

### 7.2 Mécaniques associées
- **Awareness Score** : indicateur de densité civique d'un territoire.
- **Brouillard civique** : voile visuel qui se dissipe à mesure que la zone s'éveille.
- **Statut Pionniers** : reconnaissance des « premières lumières » d'une zone.

### 7.3 Statut
Module **post-MVP**. À cadrer en Phase G.

---

## 8. LABORATOIRE DE PARTICIPATION CITOYENNE

Module post-MVP permettant à l'utilisateur de **passer de l'apprentissage à l'action réelle**.

### 8.1 Architecture pédagogique
```
Apprendre → Simuler → Agir → Confirmer
```

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

Chaque établissement (institution, école, hôpital, mairie, etc.) doit exister **simultanément** sous sept formes :

1. Un **point sur la carte** (GIL).
2. Une **entité de données** (PDE / KGE).
3. Une **page publique** (PPL).
4. Un **nœud relationnel** (graphe : élus, circonscriptions, citoyens).
5. Un **espace d'interaction citoyenne** (commentaires, photos, signalements).
6. Un **objet de suivi** (abonnement, alertes).
7. Un **historique vivant** (IVC : versions, contributions, événements).

**Implication produit** : aucune entité « morte » ; chaque création doit déclencher la disponibilité de ces sept dimensions.

---

## 10. GAMIFICATION (post-MVP)

Conservée comme levier d'engagement, mais **gelée pendant le MVP**.

| Élément | Description |
|---------|-------------|
| XP citoyen | Points cumulés par action vérifiée. |
| Badges | Reconnaissances thématiques. |
| Niveaux | Progression globale. |
| Rôles débloqués | Accès à des fonctions avancées (modération, validation). |
| Score d'influence | Mesure de l'impact civique (à encadrer — cf. §23). |
| Collections thématiques | Sets cohérents (ex. « tous les élus de ma région »). |
| Missions | Quotidiennes / hebdomadaires / saisonnières. |

**Modèles déjà présents en BD** : `Badge`, `Mission`, `UserBadge`, `UserMissionProgress`, `UserProgression`, `DomainProgression`, `ActivityMetrics`, `CivicAction`, `UserAction`. À geler (ne pas exposer côté frontend MVP).

---

## 11. IA CIVIQUE — « L'UTOPIE » (vision future)

Nom de code conservé : **L'Utopie**.

### 11.1 Rôles envisagés
- **Guide civique** : oriente l'utilisateur vers l'action pertinente.
- **Philosophe citoyen** : pose les bonnes questions, ne tranche pas.
- **Assistant d'action** : aide à rédiger, simuler, vérifier.

### 11.2 Statut
**Hors MVP. Vision long terme.** À cadrer en Phase K.

---

## 12. INVENTAIRE OPEN SOURCE

### 12.1 Production (backend)
`cors`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `jsonwebtoken`, `nodemailer`, `pg`, `sequelize`, `swagger-jsdoc`, `swagger-ui-express`, `uuid`, `zod`.

### 12.2 Production (frontend)
`@axe-core/react`, `@sentry/react`, `@sentry/tracing`, `axe-core`, `i18next`, `i18next-browser-languagedetector`, `i18next-http-backend`, `jest-axe`, `leaflet`, `leaflet.markercluster`, `react`, `react-dom`, `react-i18next`, `react-leaflet`, `react-router-dom`, `zustand`.

### 12.3 Développement
`@playwright/test`, `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `@vitejs/plugin-react`, `@vitest/coverage-v8`, `@vitest/ui`, `autoprefixer`, `axios`, `eslint`, `eslint-config-airbnb-base`, `eslint-plugin-import`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `husky`, `jest`, `jsdom`, `nodemon`, `postcss`, `prettier`, `supertest`, `tailwindcss`, `vite`, `vitest`.

### 12.4 Images Docker
`node:18-alpine`, `postgres:15-alpine`, `redis:7-alpine`, `dpage/pgadmin4:latest`, `rediscommander/redis-commander:latest`.

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
```
Public :
GET    /api/v1/petitions
GET    /api/v1/petitions/:id
GET    /api/v1/petitions/:id/signatures
GET    /api/v1/petitions/:id/updates
GET    /api/v1/petitions/:id/comments
GET    /api/v1/petitions/top/signed
GET    /api/v1/petitions/search?q=

Protégé :
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
```
Public :
GET    /api/v1/elu-commitments
GET    /api/v1/elu-commitments/:id
GET    /api/v1/elu-commitments/elu/:eluId
GET    /api/v1/elu-commitments/status/:s
GET    /api/v1/elu-commitments/search?q=
GET    /api/v1/elu-commitments/stats

Protégé :
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
| 1 | 🔴 Critique | 82 commits non poussés vers `origin/main` | git | Revue + push |
| 2 | 🔴 Critique | `gh` CLI non installé / non authentifié | machine locale | Installer + `gh auth login` |
| 3 | 🔴 Critique | Aucun secret GitHub configuré (Docker Hub, Render, SMTP) | GitHub repo | `gh secret set` |
| 4 | 🔴 Critique | Render non configuré (pas de service, pas d'API key) | infra | Créer service + récupérer API_KEY + SERVICE_ID |
| 5 | 🟠 Élevée | Incohérence de port : `.env.example` = 3000 ; Dockerfile/compose = 5000 | backend | Fixer un port unique (recommandé : 5000) |
| 6 | 🟠 Élevée | Tests massivement supprimés sans remplacement | `backend/__tests__/`, `backend/tests/` | Statuer : restaurer ou recréer minimum |
| 7 | 🟠 Élevée | `CLAUDE.md` désynchronisé | `.claude/CLAUDE.md` | Remplacer par renvoi vers cette synthèse |
| 8 | 🟠 Élevée | Dossier `backend/migrations/` introuvable | backend | Créer migrations OU documenter `sync()` |
| 9 | 🟡 Moyenne | Sentry désactivé sans plan | frontend | Décider : retirer ou réactiver |
| 10 | 🟡 Moyenne | 32 modèles Sequelize, dont modules hors MVP | `backend/src/models/` | Geler gamification, tutoriels, transparence |
| 11 | 🟡 Moyenne | Fichiers untracked importants | racine | `git add` + commit |
| 12 | 🟡 Moyenne | `node_modules/` apparaît en untracked | racine | Vérifier `.gitignore` |
| 13 | 🟢 Faible | Pages HTML statiques non auditées | `frontend/public/` | Audit ou suppression |
| 14 | 🟢 Faible | Mot de passe staging codé en dur dans `docker-compose.yml` | infra | Externaliser |
| 15 | 🟢 Faible | `JWT_SECRET` staging visible dans `docker-compose.yml` | infra | Externaliser |
| 16 | 🟠 Élevée | Vision (NPKI/PDE/KGE) non outillée | architecture | Cadrer en Phase H/J |
| 17 | 🟡 Moyenne | Master Action Matrix : 7/12 actions manquantes | UX | Cadrer en Phase G |
| 18 | ✅ Résolu | `Circonscription.js` refactorisé du legacy `pg` pool vers Sequelize | `backend/src/models/Circonscription.js` | ✅ Commit 2d8a70e |
| 19 | 🟡 Moyenne | `SYNC_ALTER=true` doit être retiré de Render env après utilisation | dashboard Render | Retirer manuellement après chaque réalignement |
| 20 | 🟠 Élevée | Workflow `Tests & Quality` : test hang après `lint.test.js` (timeout 5min, SIGTERM exit 143). Tests `Promise.test.js` + `lint.test.js` passent, mais un test suivant bloque indéfiniment. | `backend/__tests__/*.test.js` | Identifier le test fautif (probable async non résolu ou connexion BD non fermée). À traiter en Phase F. |
| 21 | ✅ Résolu | Seed Québec ville LIVE en prod via endpoint admin `POST /api/v1/admin/seed-petitions` (token-protégé, idempotent). 3 pétitions Québec créées (ids 6,7,8) + user système (id 12) + élu manquant Caroline Matte (id 6). Count total prod : 4 pétitions. | `backend/src/routes/admin-seed.js` | ✅ Commit `147e3d0` + trigger HTTP 200 le 2026-05-14 |
| 22 | 🟡 Moyenne | Inbound IP BD Render = `0.0.0.0/0` (ouvert mondial). Permet le seed depuis local mais surface d'attaque large. | dashboard Render → BD | Serrer post-MVP à la plage Render interne + IP opérateur. |
| 23 | 🟡 Moyenne | BD Render Free **expire le 5 juin 2026** ; toutes données seront supprimées sans upgrade. | dashboard Render → BD | Décision avant fin mai : upgrade Starter (~7 USD/mois) ou export + nouvelle instance. |

---

## 15. PHASES, ÉTAPES ET SOUS-ÉTAPES

### PHASE A — STABILISATION (priorité absolue)

**A.1 — Audit Git**
- A.1.1 Lister les 82 commits non poussés.
- A.1.2 Décider : push, squash, ou rebase.
- A.1.3 Pousser vers `origin/main`.
- A.1.4 Définir politique de branches (`feature/*`, `develop`, `main`).

**A.2 — Outils opérateur**
- A.2.1 Installer `gh` CLI.
- A.2.2 `gh auth login`.
- A.2.3 Vérifier accès Docker Hub, Render.

**A.3 — Cohérence de configuration**
- A.3.1 Port unique (5000).
- A.3.2 Aligner `.env.example`, `Dockerfile`, `docker-compose.yml`, `vite.config.js`.
- A.3.3 Marquer `CLAUDE.md` obsolète au profit de cette synthèse.

**A.4 — Périmètre MVP (à valider)**
- A.4.1 Liste MVP proposée : auth Magic Link, élus, circonscriptions, pétitions, carte, i18n, fiches d'établissements minimales.
- A.4.2 Geler : gamification, civic-tutorials, transparency, promises avancées, actualites avancées, Sentry, Citizen Awakening, Laboratoire, IA.
- A.4.3 Consigner la décision (§22 et §23).

### PHASE B — SECRETS ET INFRASTRUCTURE

**B.1 — Secrets locaux**
- B.1.1 Générer `JWT_SECRET` (`openssl rand -hex 32`).
- B.1.2 Configurer SMTP Brevo.
- B.1.3 Compléter `.env` + vérifier `.gitignore`.

**B.2 — Secrets GitHub**
- B.2.1 `DOCKER_USERNAME`, `DOCKER_PASSWORD`.
- B.2.2 `RENDER_API_KEY`, `RENDER_SERVICE_ID`.
- B.2.3 `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.
- B.2.4 `JWT_SECRET` prod.
- B.2.5 `DATABASE_URL` prod.
- B.2.6 `SLACK_WEBHOOK` (optionnel).

**B.3 — Service Render**
- B.3.1 Créer Web Service lié au repo.
- B.3.2 PostgreSQL Render ou externe.
- B.3.3 Variables d'environnement Render.
- B.3.4 Vérifier `/api/v1/health`.

### PHASE C — BASE DE DONNÉES

- C.1 Décider : migrations versionnées vs `sync({ alter: false })`.
- C.2 Si migrations : créer `backend/migrations/` et écrire fichiers.
- C.3 Vérifier seed initial.
- C.4 Test sur base vide.

### PHASE D — TESTS MINIMAUX

- D.1 Backend : `auth`, `elus`, `petitions`, `health`.
- D.2 Frontend : `Login`, `VerifyPage`, `PetitionsListPage`, `Header`.
- D.3 E2E : parcours Magic Link via Playwright.
- D.4 Pipeline `test.yml` vert.

### PHASE E — DÉPLOIEMENT INITIAL

- E.1 Build Docker → Docker Hub.
- E.2 Workflow `deploy.yml`.
- E.3 Render tire l'image.
- E.4 Vérification `/health`, `/api-docs`, page d'accueil.
- E.5 DNS `citoyenavise.org` → Render.
- E.6 HTTPS automatique.

### PHASE F — POST-MVP TECHNIQUE
- F.1 Réactivation Sentry.
- F.2 Optimisations performance, cache Redis.
- F.3 Audit pages HTML statiques.
- F.4 SEO + accessibilité (axe-core).

### PHASE G — EXPÉRIENCE CITOYENNE
- G.1 Stabiliser onboarding émotionnel (Arriver → Comprendre).
- G.2 Déployer **Citizen Awakening System** (Awareness Score, Brouillard, Pionniers).
- G.3 Implémenter les premiers parcours d'action (Master Action Matrix : photos, corrections, signalements, sauvegardes).

### PHASE H — BASE CIVIQUE NATIONALE
- H.1 Structurer toutes les catégories d'établissements.
- H.2 Priorisation : institutions majeures → services publics → organismes → lieux civiques secondaires.
- H.3 Mettre en place DAL + PDE (RAW → PUBLISHED) + GIL.
- H.4 IVC (historique, versions).

### PHASE I — PARTICIPATION GUIDÉE
- I.1 Déployer **Laboratoire de participation** (Apprendre → Simuler → Agir → Confirmer).
- I.2 Tutoriels civiques interactifs.
- I.3 Vérification d'inscription électorale.
- I.4 Consultations.

### PHASE J — INTELLIGENCE COLLECTIVE
- J.1 Système d'idées.
- J.2 Agrégation des signaux citoyens.
- J.3 Influence mesurable (à encadrer — cf. §23 question ouverte sur la neutralité).
- J.4 KGE (graphe de connaissance) opérationnel.

### PHASE K — IA CIVIQUE
- K.1 Déploiement progressif de **L'Utopie**.
- K.2 Garde-fous (neutralité, sources, transparence).

---

## 16. ORDRE DE PRIORITÉ (FEUILLE DE ROUTE OPÉRATIONNELLE)

### 🔥 PRIORITÉ IMMÉDIATE — À TRAITER AVANT FIN MAI 2026

| ⏰ | Tâche | Échéance | Détail |
|----|-------|----------|--------|
| 🔥 | **#23 BD Render Free expire** — décision upgrade Starter (~7 USD/mois) OU migration Neon free OU export+re-création | **5 juin 2026** (perte totale des données prod sans action) | cf. §14 #23 |

### Roadmap historique

| Rang | Tâche | Phase | Bloquant pour |
|------|-------|-------|---------------|
| 1 | Installer `gh` CLI + auth | A.2 | tout le reste |
| 2 | Décider du sort des 82 commits + pousser | A.1 | collaboration multi-dev |
| 3 | **Valider précisément le périmètre MVP** | A.4 | toutes les phases suivantes |
| 4 | Aligner le port (5000) partout | A.3 | déploiement |
| 5 | Remplacer `CLAUDE.md` par renvoi vers cette synthèse | A.3 | onboarding |
| 6 | Récupérer credentials Docker Hub | B.2 | CI/CD |
| 7 | Créer service Render + API key + Service ID | B.3 | déploiement |
| 8 | Configurer secrets GitHub via `gh secret set` | B.2 | workflows CI/CD |
| 9 | Configurer SMTP Brevo | B.1 | magic link prod |
| 10 | Statuer migrations vs `sync` | C.1 | reproductibilité BD |
| 11 | Restaurer suite de tests minimale | D | qualité |
| 12 | Premier déploiement Render | E | livraison MVP |
| 13 | Vérification post-déploiement | E.4 | validation |
| 14 | DNS citoyenavise.org → Render | E.5 | mise en ligne publique |
| 15 | Phase F (Sentry, perf, SEO) | F | qualité prod |
| 16 | Phase G (UX + Citizen Awakening) | G | engagement |
| 17 | Phase H (Base civique nationale, NPKI) | H | données |
| 18 | Phase I (Laboratoire) | I | autonomie civique |
| 19 | Phase J (Intelligence collective) | J | impact mesurable |
| 20 | Phase K (IA L'Utopie) | K | vision long terme |

---

## 17. PROCÉDURE DE TRAVAIL ENTRE OPÉRATEURS

1. **Avant toute action** : lire cette synthèse à jour + `_todo/taches.md`.
2. **Une tâche = une branche** : `feature/<sujet>` à partir de `main`.
3. **Commit conventionnel** : `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`.
4. **Push uniquement sur demande explicite** du propriétaire.
5. **Toute modification structurelle** (port, route, modèle, secret, dépendance, phase) est consignée en §22.
6. **Toute décision architecturale** est consignée en §20.
7. **Aucun secret en clair** dans les échanges. Référence par nom uniquement.
8. **Format de réponse opérateur** : action / emplacement / commande / attendu / statut.
9. **Hors-MVP gelé** : aucun travail sur gamification, tutoriels, IA, transparence avancée tant que le MVP n'est pas déployé.

---

## 18. ÉTAT DU DÉPÔT (instantané)

| Élément | Valeur |
|---------|--------|
| Branche | `main` |
| Commits non poussés | 82 |
| Fichiers modifiés non commités | 11 |
| Fichiers supprimés non commités | 11 (tests) |
| Fichiers non suivis | `BLUEPRINT.md`, `GITHUB_SECRETS_CHECKLIST.md`, `_ai/snapshot_complet.txt`, `backend/.eslintignore`, `backend/__tests__/lint.test.js`, `frontend/public/blueprint.html`, `frontend/public/stack-visualization.html`, `node_modules/`, `package-lock.json` |
| Dernier commit | `8708115 release: v1.0.0 complete foundation rebuild` |
| Remote | `https://github.com/citoyenavise/citoyenavise.git` |

---

## 19. SECRETS À CONFIGURER (NOMS UNIQUEMENT)

| Nom du secret | Plateforme | État |
|---------------|------------|------|
| `DOCKER_USERNAME` | GitHub | à configurer |
| `DOCKER_PASSWORD` | GitHub | à configurer |
| `RENDER_API_KEY` | GitHub | à configurer |
| `RENDER_SERVICE_ID` | GitHub | à configurer |
| `SMTP_HOST` | GitHub | à configurer |
| `SMTP_USER` | GitHub | à configurer |
| `SMTP_PASSWORD` | GitHub | à configurer |
| `SMTP_FROM` | GitHub | à configurer |
| `JWT_SECRET` (prod) | GitHub + Render | à générer |
| `DATABASE_URL` (prod) | Render | à générer |
| `SLACK_WEBHOOK` | GitHub | optionnel |

---

## 20. DÉCISIONS ARCHITECTURALES

| Date | Décision | Justification |
|------|----------|---------------|
| 2026-05-13 | Hébergement Render | Choix du propriétaire |
| 2026-05-13 | ORM Sequelize maintenu | Code existant déjà bâti dessus |
| 2026-05-13 | Cette synthèse remplace `CLAUDE.md` | `CLAUDE.md` désynchronisé |
| 2026-05-13 | Modules avancés (gamification, tutoriels, IA, transparence) gelés en post-MVP | Restructuration post-over-engineering |
| 2026-05-13 | Adoption des couches conceptuelles NPKI / DAL / PDE / KGE / GIL / PPL / IVC / ARE | Vision cible long terme |
| 2026-05-13 | Conservation du nom de code « L'Utopie » pour l'IA civique | Continuité de la vision |

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

---

## 22. JOURNAL DES MISES À JOUR DE CE DOCUMENT

| Date | Auteur | Modification |
|------|--------|--------------|
| 2026-05-13 | Opérateur | Création de la synthèse officielle (V1) |
| 2026-05-13 | Opérateur | **V2 — Intégration du MASTER INVENTORY** : ajout vision / mission / positionnement, valeurs fondamentales, cycle utilisateur, Master Action Matrix, Citizen Awakening System, Laboratoire de participation, rôle stratégique des établissements, infrastructure de données publiques (NPKI/DAL/PDE/KGE/GIL/PPL/IVC/ARE), gamification post-MVP, IA « L'Utopie », phases G à K, questions ouvertes (§23). |
| 2026-05-13 | Opérateur | **V2.1 — Phase A finalisée + Phase B exécutée** : B1 (PetitionsListPage syntax) corrigé `d24df3a`, B2 (NODE_ENV=test guard) `65b1402`, B3 (i18n vitest stub) `2d21d25`, deploy.yml refactoré Render `bdb3726`, SonarQube retiré `3f24b1d`, ports alignés `1091ad9`, synthèse intégrée `d652dbc`, merge feature/port-coherence `82cae00`, Slack URL sanitization `1502faa`. |
| 2026-05-13 | Opérateur | **Phase B.2 — 7 secrets GitHub configurés** : DOCKER_USERNAME, DOCKER_PASSWORD, RENDER_API_KEY, RENDER_SERVICE_ID_BACKEND, RENDER_SERVICE_ID_FRONTEND, SLACK_WEBHOOK, SNYK_TOKEN. SLACK_WEBHOOK rotation suite à détection GitHub Push Protection. RENDER_API_KEY rotation suite à fuite ponctuelle dans conversation. |
| 2026-05-13 | Opérateur | **Phase B.3-B.4 — Backend Render reconfiguré** : service `citoyenavise-backend-1` repointé du repo `citoyenavise/citoyenavise-backend` vers monorepo `citoyenavise/citoyenavise` avec rootDir=`backend`, runtime=Node, build=`npm install`, start=`npm start`. Variables runtime configurées (DATABASE_URL, JWT_SECRET, FRONTEND_URL, CORS_ORIGIN, SMTP_HOST/PORT/USER/PASSWORD/FROM, NODE_ENV, PORT). |
| 2026-05-13 | Opérateur | **Backend MVP Live** — service `citoyenavise-backend-1` opérationnel sur https://citoyenavise-backend-1.onrender.com. 4/5 routes critiques en 200 : `/health`, `/api/v1/elus`, `/api/v1/petitions`, `/api-docs`. Commit déployé : `2919e4a` (sync inconditionnel) puis `1148bb3` (SYNC_ALTER ponctuel). |
| 2026-05-13 | Opérateur | **Brevo SMTP configuré et testé** — emails transactionnels opérationnels via `smtp-relay.brevo.com:587`. Compte créé, SMTP key `citoyenavise-prod` active, test email validé. |
| 2026-05-13 | Opérateur | **Finalisation MVP** : SYNC_ALTER retiré de Render env (mode safe). Frontend Render testé OK (status 200). Repo `citoyenavise/citoyenavise-backend` archivé (read-only, source obsolète). |
| 2026-05-13 | Opérateur | **🎉 MVP CITOYENAVISE.ORG DÉPLOYÉ EN PRODUCTION** — Backend + Frontend + DB + SMTP + CI/CD + Secrets opérationnels. Avancement global : 62 % → **85 %**. |
| 2026-05-14 | Opérateur | **Session de finalisation MVP** : 11 bugs corrigés (audit response unwrapping, ports, syntaxe, default exports, auth persistance, Brevo SMTP port 2525, default petition status published, Map init Leaflet, etc.). Signature de pétition validée end-to-end. **MVP UI 100 % fonctionnel**. Avancement : 85 % → **92 %**. |
| 2026-05-14 | Opérateur | **🌐 DOMAINE citoyenavise.org LIVE** — DNS Namecheap (A `@`→216.24.57.1, CNAME `www`/`api` → Render), HTTPS Let's Encrypt auto, env vars Render mises à jour (`CORS_ORIGIN`, `FRONTEND_URL`, `VITE_API_URL` → `*.citoyenavise.org`). Émails DKIM + DMARC Brevo configurés. **Site en production sur son domaine officiel**. Avancement : 92 % → **95 %**. |
| 2026-05-14 | Opérateur | **Décisions stratégiques Q6 + O5 actées** : Pilote = **Québec ville**. North Star Metric = **« signataires actifs / 30j »**. Trajectoire : Québec (3m) → Province QC (m4-12) → Pan-Canada (an 2+). Document détaillé : `_ai/DECISIONS_STRATEGIQUES_Q6_O5.md`. **Phase G débloquée**. |
| 2026-05-14 | Opérateur | **Chantier 1 — Bug #18 résolu** : `Circonscription.js` refactorisé de legacy pg pool vers Sequelize. Ajout méthodes statiques (list, findById, findByCodePostal, etc.). Routes `/api/v1/circonscriptions` restaurées. Commit : `2d8a70e`. |
| 2026-05-14 | Opérateur | **Chantier 2 — Page d'accueil créée** : HomePage.jsx implémentée avec sections Hero, Actions (3 cards), Pétitions récentes, Valeurs (Transparence/Participation/Empowerment), Info Pilote. Route index ajoutée à `/fr/` et `/en/`. Traductions FR+EN complètes. Build Vite OK. Commit : `4b5f135`. |
| 2026-05-14 | Opérateur | **Chantier 3 — Seed Québec ville** : 3 pétitions thématiques ancrées Québec ville (pistes cyclables, transport RTC, espaces verts Sainte-Foy). Remplace seed générique. Prête pour Phase G pilote. Commit : `2a558a1`. |
| 2026-05-14 | Opérateur | **Chantier A — CI Deploy hardening** : `deploy.yml` corrigé — alignement secret `RENDER_SERVICE_ID_BACKEND` (avec suffixe) + trim défensif `tr -d '[:space:]'` (protège contre trailing whitespace dans le secret) + bump `slackapi/slack-github-action` v1.27.0 → v2.0.0. Commit `18a3dd0` + ré-itération `69705e6`. Workflow Deploy passe ✓ en 2m25s. |
| 2026-05-14 | Opérateur | **Chantier B — CI Tests setup:db** : ajout du script `setup:db` manquant (`backend/scripts/setup-test-db.js` + entrée dans `package.json`) + injection `JWT_SECRET` dans l'env de l'étape Setup database de `test.yml` + ajout trigger `workflow_dispatch` pour déclenchements manuels. Commits `4f28787` + `b110df7`. Setup DB passe ; un test hang plus loin (cf. §14 #20). |
| 2026-05-14 | Opérateur | **Chantier C — Doc /health** : §13.6 corrigée — endpoint réel = `/health` (hors préfixe API), non `/api/v1/health` comme documenté précédemment. Commit `c2a5238`. |
| 2026-05-14 | Opérateur | **Chantier D — Seeder idempotent** : `seed.js` migré de `Petition.create()` (non idempotent, crash sur 2e exécution) vers `Petition.findOrCreate({ where: { titre } })` + statut `published` forcé sur les 3 pétitions Québec (au lieu de seulement la première). Commit `f296934`. |
| 2026-05-14 | Opérateur | **Doc stratégique trackée** : `_ai/DECISIONS_STRATEGIQUES_Q6_O5.md` ajouté au repo (était untracked depuis sa création). Commit `3c1de97`. |
| 2026-05-14 | Opérateur | **Merge sur main + push** : 6 commits poussés vers `origin/main` (`18a3dd0` → `9b2af02` → `69705e6` → `b110df7`). Render auto-deploy validé. |
| 2026-05-14 | Opérateur | **🚨 Incident sécurité — DATABASE_URL écrasée** : valeur effacée par erreur dans Render Environment et sauvegardée à `postgresql://`. Backend resté vivant grâce à l'ancienne valeur en mémoire (l'env est lue au démarrage, pas à chaque requête). Render n'a pas redéployé immédiatement (rollback ou délai). **Récupération** : Internal Database URL re-récupérée depuis la page BD Render et re-collée dans Environment. Service repris ✓. |
| 2026-05-14 | Opérateur | **🚨 Incident sécurité — fuite DATABASE_URL en clair** : la connection string complète (avec mot de passe en clair) a été collée dans la conversation lors d'une tentative de seed local. **Rotation effectuée** : nouveau credential par `New default credential` dans Render BD + ancien supprimé. Ancien mot de passe désormais révoqué. |
| 2026-05-14 | Opérateur | **Service IDs Render notés** : backend `srv-d7tq5p6gvqtc73brefcg` (Frankfurt, Node) | BD `dpg-d7tvmg1kh4rs738bk0h0-a` (PostgreSQL 15 Free, expire 2026-06-05) | database `citoyenavise_db_xrim` | username `citoyenavise_db`. |
| 2026-05-14 | Opérateur | **Cleanup repo** : 10+ fichiers untracked à noms corrompus (issus du pager `less` accidentellement déclenché en milieu de session) supprimés via `git clean -f -e _ai/DECISIONS_STRATEGIQUES_Q6_O5.md`. Working tree clean. |
| 2026-05-14 | Opérateur | **🎯 Bug #21 RÉSOLU — Seed Québec ville LIVE en prod** : création endpoint `POST /api/v1/admin/seed-petitions` (`backend/src/routes/admin-seed.js`, monté `/api/v1/admin` dans `routes/index.js`). Protégé par token statique `ADMIN_SEED_TOKEN` configuré dans Render Environment. Idempotent (`findOrCreate` sur titre/email). Trigger via `curl -X POST -H "Authorization: Bearer $TOKEN"` → HTTP 200, response JSON détaillée. **3 pétitions Québec en prod** (ids 6, 7, 8 — pistes cyclables, RTC, espaces verts Sainte-Foy), toutes `published`. User système (id 12) + élu Caroline Matte (id 6) créés. **Phase G débloquée**. Commit `147e3d0`. Avancement global : 97 % → **98 %**. |
| 2026-05-14 | Opérateur | **🧹 N1 — Cleanup pétition résiduelle générique** : ajout endpoint `DELETE /api/v1/admin/petitions/:id` (token-protected, idempotent — 404 si déjà supprimé) dans `admin-seed.js`. Trigger via curl DELETE → suppression de la pétition id=1 « Améliorer l'accès aux soins dentaires pour tous » (vestige de l'ancien seed générique). **BD prod parfaitement alignée pour le pilote Québec** : 3 pétitions uniquement (ids 6, 7, 8). Commit `e936187`. |
| 2026-05-14 | Opérateur | **📌 Roadmap §16 — priorité immédiate marquée** : ajout d'une sous-section « 🔥 PRIORITÉ IMMÉDIATE » en tête de §16 pour signaler #23 (BD Render Free expire 5 juin 2026). Visibilité accrue pour ne pas oublier la décision business upgrade/migration avant fin mai. |
| 2026-05-14 | Opérateur | **📖 N2 — Swagger doc endpoints admin** : `openapi.js` étendu avec tag `Admin`, 2 paths documentés (`POST /admin/seed-petitions` avec schéma de réponse complet + `DELETE /admin/petitions/{id}` avec params + codes 200/400/401/404/503) et nouveau securityScheme `adminSeedAuth` (bearer statique, distinct du JWT utilisateur). Visible sur `https://api.citoyenavise.org/api-docs/` section Admin. Commit `20ac213`. |

---

## 23. QUESTIONS OUVERTES (à trancher avec le propriétaire)

Ces questions doivent être tranchées par M. Fortin. Chaque réponse modifiera ce document.

### 23.1 Périmètre et gouvernance
- **Q1** — Liste exacte des fonctionnalités incluses dans le MVP final ?
- **Q2** — Politique de modération communautaire ?
- **Q3** — Gouvernance des contributions citoyennes (validation, conflit, retrait) ?
- **Q4** — Niveau de visibilité publique des profils utilisateurs (pseudonyme, photo, historique) ?
- **Q5** — Modèle de réputation et score d'influence : critères, transparence, recours ?

### 23.2 Stratégie de lancement
- ✅ **Q6** — Priorisation géographique : **Québec ville** comme pilote (acté 2026-05-14). Trajectoire : Québec ville (3m) → Province QC (m4-12) → Pan-Canada (an 2+).
- **Q7** — Stratégie d'acquisition initiale des données institutionnelles → cataloguage manuel des ~25 élus de Québec ville (acquisitions limitée à la zone pilote).
- **Q8** — Politique de validation des données citoyennes (modération, peer review, autorité de référence) ?
- **Q9** — Stratégie de recrutement des premiers utilisateurs → 20 Pionniers via réseau local (universités, médias QC).

### 23.3 Tensions stratégiques à arbitrer
- **T1** — **MVP minimal vs ambition système complet** → résolution actuelle : modules avancés en post-MVP. À reconfirmer.
- **T2** — **Neutralité politique vs moteur d'influence démocratique** → risque de partialité si la plateforme agrège et amplifie des priorités collectives. Mécanismes de gouvernance à définir.
- **T3** — **Simplicité UX vs densité informationnelle** → stratégie de dévoilement progressif à concevoir explicitement.

### 23.4 Dimensions opérationnelles à préciser
- **O1** — Modèle économique / financement (subventions, dons, partenariats publics, freemium ?).
- **O2** — Cadre légal : responsabilité éditoriale, diffamation, protection des données personnelles (**Loi 25 Québec** applicable au pilote, LPRPDE fédéral plus tard).
- **O3** — Modération et sécurité communautaire (équipe, outillage, recours).
- **O4** — Politique éditoriale (qui décide quoi est publié, comment, sous quels critères).
- ✅ **O5** — Métriques de succès du MVP : **North Star = signataires actifs / 30j** ; seuils 30 / 150 / 500 à 3/6/12 mois (acté 2026-05-14, cf. `_ai/DECISIONS_STRATEGIQUES_Q6_O5.md`).
- ✅ **O6** — Plan de lancement géographique : pilote Québec ville → expansion progressive (acté avec Q6).
- **O7** — Stratégie de seed initial des données → cataloguage manuel ~25 élus Québec ville + 3-5 pétitions seed locales.
- ✅ **O8** — Stratégie de recrutement des premiers utilisateurs : 20 Pionniers via réseau local (universités Laval/ULaval, médias Le Soleil, Radio-Canada Québec).

---

## 24. RAPPORT D'INTÉGRATION V2

### 24.1 Éléments intégrés depuis le MASTER INVENTORY
Mission fondatrice, vision long terme, positionnement à 7 facettes, valeurs fondamentales, cycle utilisateur, Master Action Matrix, Citizen Awakening System, Laboratoire de participation, rôle stratégique des établissements, couches NPKI/DAL/PDE/KGE/GIL/PPL/IVC/ARE, gamification consolidée, IA « L'Utopie », phases G à K, questions ouvertes.

### 24.2 Doublons fusionnés
- Mission principale (plusieurs formulations) → §1.1 unique.
- « Infrastructure civique numérique » et « système nerveux civique numérique » → harmonisé en §1.3.
- « Hub d'information civique » et « Wikipédia civique » → fusionné en §1.4.
- Gamification dispersée → consolidée en §10.

### 24.3 Éléments volontairement non insérés
- Détails narratifs exploratoires non stabilisés.
- Terminologies alternatives abandonnées (au profit des noms retenus dans cette synthèse).
- Concepts redondants reformulés mais non répétés.

### 24.4 Tensions consignées (cf. §23.3)
T1 (MVP vs ambition), T2 (neutralité vs influence), T3 (simplicité vs densité).

---

**Fin de la synthèse officielle — V2.**
**Toute mise à jour, correction, décision ou réponse à une question ouverte doit être consignée dans les sections 20, 22 et 23 ci-dessus.**
