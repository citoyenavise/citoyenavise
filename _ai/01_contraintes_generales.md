---
name: Contraintes techniques et métier
description: Règles d'architecture, conventions, décisions non-négociables
type: project
---

# Contraintes Générales — Citoyen Avisé

## 🗄️ Base de Données
- **Technologie** : PostgreSQL (version 12+)
- **GIS** : PostGIS pour la carte (localisations)
- **UUIDs** : Identifiants UUID, pas d'incréments
- **Audit** : `created_at`, `updated_at` sur chaque table
- **Soft delete** : Champ `deleted_at` pour les données sensibles (posts, users)
- **Migrations** : Versionner avec numéros (001_initial.sql, 002_add_posts.sql)

## 🔐 Authentification & Sécurité
- **JWT** : Tokens JWT pour les sessions (scalable)
- **Hashage** : bcrypt pour les mots de passe (min 12 rounds)
- **CORS** : Restreint au domaine principal
- **Rate limit** : 60 requêtes/min par IP (inscription/login)
- **HTTPS** : Obligatoire en production
- **Tokens** : Expiration 24h (access), 7j (refresh)
- **Validation** : Toute entrée validée (schemas Zod/Joi)

## 🎨 Frontend
- **Langage** : HTML5 + CSS3 + JavaScript ES6+
- **Framework** : Composants HTML réutilisables (avant Vue/React)
- **Accessibilité** : WCAG 2.1 AA minimum
- **Mobile** : Mobile-first, responsive (breakpoints 480px, 768px, 1024px)
- **Langues** : FR par défaut, EN en sous-dossier `/en/`
- **CSS** : Utility-first (BEM ou personnalisé), pas de Tailwind initialement
- **JS** : Vanilla ES6, pas de frameworks lourds (future migration possible)

## 🔌 Backend API
- **Style** : REST API (JSON)
- **Versioning** : `/api/v1/` dès le départ (v2 possible)
- **Paginación** : Default limit=20, max=100
- **Filtres** : Query params (category, region, sort, etc.)
- **Réponses** : Format cohérent { data: ..., meta: {}, error: null }
- **Codes HTTP** : 200, 201, 400, 401, 403, 404, 409, 422, 500
- **Logging** : Winston ou Pino (logs structurés JSON)

## 📁 Structure & Conventions
- **Dossiers** : kebab-case (`user-profiles/`, `map-nodes/`)
- **Fichiers HTML** : kebab-case (`voting-guide.html`)
- **Fichiers JS** : camelCase (`authService.js`, `mapModule.js`)
- **Classes CSS** : kebab-case (`.btn-primary`, `.card-user`)
- **IDs HTML** : kebab-case (`#search-input`, `#modal-confirm`)
- **Routes API** : kebab-case (`/api/posts/`, `/api/map-nodes/`)
- **Variables JS** : camelCase (`currentUser`, `isLoggedIn`)
- **Constantes** : UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_ITEMS`)

## 🧪 Tests
- **Unitaires** : Services, utils, helpers (Jest/Mocha)
- **Intégration** : Routes API (Supertest)
- **E2E** : Parcours utilisateur (Cypress/Playwright) — optionnel MVP
- **Couverture** : Min 70% pour logique métier
- **CI/CD** : Tests avant merge, linting obligatoire

## 📚 Documentation
- **README** : Setup, architecture, API docs, déploiement
- **Code** : Commentaires sur le WHY (pas le WHAT)
- **API** : JSDoc ou OpenAPI/Swagger (futur)
- **_ai/** : Prompts, journal de sessions, décisions
- **CLAUDE.md** : Maintenu à jour avec l'architecture actuelle

## 🌐 Bilinguisme
- **FR** : Langue par défaut
- **EN** : Traductions intégrales, pas de contenu manquant
- **DB** : Champs _fr et _en pour contenu (ou table séparée)
- **Navigation** : Lien `/en/` visible, slug en FR dans URL

## ⚙️ Performance
- **Images** : Compression, lazy-load, WebP
- **Bundle JS** : < 100KB (total, compressé)
- **Bundle CSS** : < 50KB (compressé)
- **API** : Réponses < 2s (p95)
- **DB** : Indexes sur colonnes filtrées, requêtes < 500ms
- **Caching** : HTTP cache headers, Redis (futur si nécessaire)

## 🔄 Déploiement
- **Environnements** : dev, staging, production
- **Secrets** : .env files, variables d'environnement
- **DB Migrations** : Versionnées, vérifiées avant production
- **Rollback** : Plan de rollback pour chaque déploiement
- **Monitoring** : Logs, erreurs (Sentry), métriques (New Relic optionnel)

## 🚫 Prohibitions
- ❌ Pas de dépendances inutiles (keep it lean)
- ❌ Pas de commentaires obsolètes ou "TODO" sans contexte
- ❌ Pas de console.log en production
- ❌ Pas de credentials en git (utiliser .env)
- ❌ Pas de modifications en base de données manuelles (migrations obligatoires)
- ❌ Pas d'algorithmes recommandation (sauf civiques transparents)
- ❌ Pas de data selling ou tracking abusif

## ✅ Best Practices
- ✅ DRY (Don't Repeat Yourself) mais pas d'over-engineering
- ✅ SOLID principles (Single responsibility, etc.)
- ✅ Transactions DB pour opérations multi-step
- ✅ Logs avec contexte (user_id, action, timestamp)
- ✅ Erreurs utiles (messages clairs, codes d'erreur)
- ✅ Versionning sémantique (semver)
- ✅ Code review avant merge

## 📝 Exemple .env (TEMPLATE)
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/citoyenavise_dev
DB_POOL_SIZE=10

# JWT
JWT_SECRET=super_secret_key_min_32_chars_CHANGE_IN_PROD
JWT_EXPIRY_ACCESS=24h
JWT_EXPIRY_REFRESH=7d

# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Email (futur)
SMTP_HOST=smtp.gmail.com
SMTP_USER=noreply@citoyenavise.org
SMTP_PASS=...

# Sentry (optionnel)
SENTRY_DSN=https://...@sentry.io/...

# PostGIS (activé par défaut si PostgreSQL)
POSTGIS_ENABLED=true
```
