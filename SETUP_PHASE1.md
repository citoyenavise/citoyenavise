# 🗄️ PHASE 1 — PostgreSQL Opérationnel

**Statut:** Phase 1 - Base de données persistante  
**Date:** 2026-05-05  
**Objectif:** PostgreSQL 100% fonctionnel, 2 options d'installation

---

## 📋 Table des matières
- [Option A: Docker (Recommandé)](#option-a-docker-recommandé)
- [Option B: PostgreSQL Local](#option-b-postgresql-local)
- [Cycle Test Complet](#cycle-test-complet)
- [Troubleshooting](#troubleshooting)

---

## Option A: Docker (Recommandé) ✅

### Prérequis
- Docker Engine 20.10+
- Docker Compose 1.29+
- Git

### Installation (5 minutes)

```bash
# 1. Cloner le repo (si pas fait)
git clone https://github.com/citoyenavise/citoyenavise.git
cd citoyenavise

# 2. Créer .env.docker (variables pour Docker)
cat > .env.docker << 'EOF'
# Docker Compose
NODE_ENV=development
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=citoyenavise_dev
DB_HOST=postgres
DB_PORT=5432
REDIS_PASSWORD=password

# Backend
JWT_SECRET=dev_secret_key_min_32_chars_change_in_prod_abc123def456
JWT_REFRESH_SECRET=dev_refresh_secret_key_min_32_chars_abc123def456_DIFFERENT
API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000,http://localhost:8000

# Logging
LOG_LEVEL=debug

# pgAdmin (optionnel)
PGADMIN_EMAIL=admin@citoyenavise.local
PGADMIN_PASSWORD=admin
EOF

# 3. Démarrer les services
docker-compose up -d

# 4. Attendre que PostgreSQL soit prêt (~15 secondes)
docker-compose ps
# postgres, redis, backend, frontend doivent être "healthy" ou "running"

# 5. Exécuter les migrations
docker-compose exec backend npm run migrate

# 6. Vérifier que tout est up
curl http://localhost:5000/health
# Réponse: {"status":"ok","timestamp":"..."}
```

### Accès services

| Service | URL | Credentials |
|---------|-----|-------------|
| Backend API | http://localhost:5000 | N/A |
| Frontend | http://localhost:3000 | Auto |
| pgAdmin (optionnel) | http://localhost:5050 | admin@citoyenavise.local / admin |
| Redis Commander (optionnel) | http://localhost:8081 | N/A |

### Arrêter services

```bash
# Arrêter sans supprimer les données
docker-compose stop

# Arrêter et nettoyer
docker-compose down

# Arrêter et supprimer les volumes (ATTENTION: perte de données)
docker-compose down -v
```

### Logs

```bash
# Tous les services
docker-compose logs -f

# Seulement backend
docker-compose logs -f backend

# Seulement PostgreSQL
docker-compose logs -f postgres
```

---

## Option B: PostgreSQL Local

### Prérequis

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Mac
brew install postgresql@14
brew services start postgresql@14

# Vérifier version
psql --version  # doit être >= 14
```

**Windows:**
- Télécharger PostgreSQL 14+ depuis https://www.postgresql.org/download/windows/
- Installer avec administrateur
- Ajouter `C:\Program Files\PostgreSQL\14\bin` au PATH

### Configuration locale (5 minutes)

```bash
# 1. Créer base de données
createdb citoyenavise_dev

# 2. Créer utilisateur (optionnel, par défaut: postgres)
# psql -c "CREATE USER citoyenavise WITH PASSWORD 'password';"
# psql -c "ALTER USER citoyenavise CREATEDB;"

# 3. Copier .env pour dev local
cp backend/.env.example backend/.env

# 4. Modifier backend/.env avec config locale
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/citoyenavise_dev

# 5. Installer dépendances backend
cd backend
npm install

# 6. Exécuter migrations
npm run migrate

# 7. Démarrer backend
npm run start:backend
# Voir: "🚀 Server started on port 5000"
```

### Frontend (optionnel)

```bash
# Terminal 2 - Frontend dev server
cd frontend
npm install
npm run dev
# Ouvre http://localhost:5173
```

### Ou frontend production

```bash
# Build
npm run build:frontend

# Servir dist
cd frontend && npm run preview
# Ouvre http://localhost:4173
```

### Arrêter

```bash
# Ctrl+C dans chaque terminal
```

---

## Cycle Test Complet

**Durée:** ~5 minutes  
**Objectif:** Valider persistance BD + API complète

### 1. SIGNUP — Créer un compte

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "username": "testuser"
  }'

# Réponse attendue:
# {
#   "user": { "id": "...", "email": "test@example.com", "username": "testuser" },
#   "accessToken": "eyJ...",
#   "refreshToken": "eyJ..."
# }

# Sauvegarder le token:
export TOKEN="eyJ..."
```

### 2. LOGIN — S'authentifier

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'

# Réponse: nouveau accessToken + refreshToken
export TOKEN="eyJ..."
```

### 3. POST — Créer une idée

```bash
curl -X POST http://localhost:5000/api/v1/ideas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Améliorer les transports publics",
    "content": "Augmenter la fréquence des bus en heures de pointe pour réduire la congestion.",
    "category": "transportation"
  }'

# Réponse attendue:
# {
#   "id": "...",
#   "title": "Améliorer les transports publics",
#   "userId": "...",
#   "createdAt": "2026-05-05T..."
# }

# Sauvegarder l'ID:
export IDEA_ID="..."
```

### 4. LIKE — Soutenir une idée

```bash
curl -X POST http://localhost:5000/api/v1/ideas/$IDEA_ID/like \
  -H "Authorization: Bearer $TOKEN"

# Réponse:
# { "liked": true, "likesCount": 1 }
```

### 5. LIST — Voir les idées populaires

```bash
curl http://localhost:5000/api/v1/ideas?sort=popular&limit=10

# Réponse: array d'idées avec likes_count, popularity_score
```

### 6. Vérifier persistance BD

**Via pgAdmin (Docker):**
```
http://localhost:5050
Email: admin@citoyenavise.local
Password: admin

➜ Serveurs > citoyenavise > Databases > citoyenavise_dev > Schemas > public > Tables
  ✅ users (1 row)
  ✅ ideas (1 row)
  ✅ idea_likes (1 row)
```

**Via psql (Local):**
```bash
psql citoyenavise_dev
citoyenavise_dev=# SELECT COUNT(*) FROM users;
citoyenavise_dev=# SELECT COUNT(*) FROM ideas;
citoyenavise_dev=# SELECT COUNT(*) FROM idea_likes;
```

---

## Status Migrations

### Voir l'état

```bash
# Docker
docker-compose exec backend npm run migrate:status

# Local
cd backend && npm run migrate:status
```

### Résultat attendu

```
📊 Status des migrations:

Version | Status    | Description
--------|-----------|------------------
V001   | ✅ Applied | initial_schema
V002   | ✅ Applied | refresh_tokens
V003   | ✅ Applied | fulltext_search
... (19 autres migrations)
V021   | ✅ Applied | system_settings

Total: 21 migrations (21 appliquées)
```

---

## Troubleshooting

### Docker

**Erreur: "postgres container exits immediately"**
```bash
# Vérifier les logs
docker-compose logs postgres

# Solution: Vérifier droits volume
sudo chown -R 1000:1000 postgres_data/

# Redémarrer
docker-compose down -v
docker-compose up -d postgres
```

**Erreur: "Port 5432 already in use"**
```bash
# Trouver processus
lsof -i :5432

# Arrêter
docker-compose down
# ou tuer le processus
kill -9 <PID>
```

**Erreur: "Backend can't connect to postgres"**
```bash
# Vérifier que postgres est healthy
docker-compose ps

# Vérifier logs backend
docker-compose logs backend | grep -i database

# Redémarrer backend après postgres
docker-compose restart backend
```

### PostgreSQL Local

**Erreur: "createdb: command not found"**
```bash
# Ajouter PostgreSQL au PATH
export PATH="/usr/lib/postgresql/14/bin:$PATH"

# ou pour Mac
export PATH="/usr/local/opt/postgresql@14/bin:$PATH"
```

**Erreur: "FATAL: role 'postgres' does not exist"**
```bash
# Créer le rôle
sudo -u postgres createuser postgres
sudo -u postgres createdb citoyenavise_dev -O postgres
```

**Erreur: "Migration failed: relation 'schema_versions' does not exist"**
```bash
# Réinitialiser (ATTENTION: perte de données)
dropdb citoyenavise_dev
createdb citoyenavise_dev
npm run migrate
```

### API

**Erreur 401 Unauthorized**
```bash
# Token expiré ou invalide
# Refaire LOGIN pour obtenir nouveau token
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "...", "password": "..."}'
```

**Erreur 422 Validation Error**
```bash
# Vérifier JSON
# Exemples:
# - "password" doit avoir >= 8 caractères
# - "email" doit être valide
# - "title" doit avoir >= 5 caractères
```

---

## Checklist Validation PHASE 1

- [ ] PostgreSQL démarre sans erreur
- [ ] Migrations exécutées (21/21)
- [ ] Backend répond sur port 5000
- [ ] Frontend accessible
- [ ] Cycle signup → login → post → like fonctionne
- [ ] Persistance BD validée (données présentes après redémarrage)
- [ ] Logs sans erreurs critiques

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `docker-compose.yml` | Configuration Docker complet |
| `backend/Dockerfile` | Image production backend |
| `backend/src/config.js` | Configuration centralisée |
| `backend/src/core/services/database.js` | Pool PostgreSQL |
| `backend/src/database/migrationRunner.js` | Gestionnaire migrations |
| `backend/database/migrations/` | 21 migrations SQL |
| `backend/.env` | Variables dev local |
| `.env.docker` | Variables dev Docker |

---

## Prochaines étapes (PHASE 2-3)

- **PHASE 2:** Redis fallback opérationnel
- **PHASE 3:** Frontend ↔ Backend intégration 100%
- **PHASE 4+:** Features supplémentaires

---

**Bon déploiement! 🚀**
