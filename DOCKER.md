# Docker Setup Guide — Citoyen Avisé

Ce guide explique comment utiliser Docker et docker-compose pour exécuter Citoyen Avisé en mode staging local.

---

## 📦 Prérequis

- **Docker** (version 20+) — [Install Docker](https://docs.docker.com/install/)
- **Docker Compose** (version 1.29+) — [Install Docker Compose](https://docs.docker.com/compose/install/)
- **Git** — Pour cloner le repository

Vérifiez l'installation :

```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start — Local Staging

### 1. Cloner le Repository

```bash
git clone https://github.com/citoyenavise/citoyenavise.git
cd citoyenavise
```

### 2. Lancer les Services

```bash
# Build and start all services
docker-compose up -d

# Or with build:
docker-compose up --build -d
```

**Services démarrés :**
- ✅ PostgreSQL sur http://localhost:5432
- ✅ Redis sur http://localhost:6379
- ✅ Node.js Backend API sur http://localhost:5000

### 3. Vérifier le Statut

```bash
docker-compose ps

# Output:
# NAME                    STATUS
# citoyenavise_postgres   Up (healthy)
# citoyenavise_redis      Up (healthy)
# citoyenavise_app        Up
```

### 4. Arrêter les Services

```bash
docker-compose down

# Remove volumes too:
docker-compose down -v
```

---

## 🔧 Configuration

### .env.staging

Fichier de configuration pour le mode staging :

```env
NODE_ENV=staging
DATABASE_URL=postgresql://staging_user:staging_password@postgres:5432/citoyenavise_staging
JWT_SECRET=staging_secret_key_change_in_production_12345678901234567890
REDIS_HOST=redis
REDIS_PORT=6379
```

**Modifier les variables :**
1. Éditer `.env.staging`
2. Relancer : `docker-compose up -d`

### Services Configuration

**PostgreSQL (.env.staging):**
- User: `staging_user`
- Password: `staging_password`
- Database: `citoyenavise_staging`
- Port: `5432`

**Redis:**
- Host: `redis` (dans docker-compose)
- Port: `6379`
- Password: (aucun)

**Node.js Backend:**
- Port: `5000`
- Env: `staging`
- Logs: `docker logs citoyenavise_app`

---

## 📊 Services Détails

### PostgreSQL 15 Alpine

```yaml
image: postgres:15-alpine
container_name: citoyenavise_postgres
ports: 5432:5432
volumes: postgres_data:/var/lib/postgresql/data
```

**Caractéristiques :**
- Base de données relationnelle
- Init script : `scripts/init-db.sql`
- Health check inclus
- Volume persistent : `postgres_data`

**Connexion :**
```bash
docker exec -it citoyenavise_postgres psql -U staging_user -d citoyenavise_staging
```

### Redis 7 Alpine

```yaml
image: redis:7-alpine
container_name: citoyenavise_redis
ports: 6379:6379
volumes: redis_data:/data
```

**Caractéristiques :**
- Cache in-memory
- Persistence : AOF (append-only file)
- Health check inclus
- Volume persistent : `redis_data`

**Connexion :**
```bash
docker exec -it citoyenavise_redis redis-cli
```

### Node.js Backend API

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Caractéristiques :**
- Node.js 18 Alpine (léger, ~150MB)
- Multi-stage build (optimisé)
- Non-root user (sécurité)
- Health check HTTP
- Volume source code (dev)

**Logs :**
```bash
docker logs -f citoyenavise_app
```

---

## 🛠️ Commandes Utiles

### Build & Compose

```bash
# Build sans lancer
docker-compose build

# Build et démarrer
docker-compose up --build

# Démarrer en arrière-plan
docker-compose up -d

# Arrêter tous les services
docker-compose down

# Arrêter + supprimer volumes
docker-compose down -v

# Voir les logs
docker-compose logs

# Logs d'un service
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis

# Logs en temps réel
docker-compose logs -f app
```

### Exécution de Commandes

```bash
# Shell dans le conteneur app
docker exec -it citoyenavise_app sh

# Exécuter npm dans l'app
docker exec citoyenavise_app npm run lint
docker exec citoyenavise_app npm run test

# CLI PostgreSQL
docker exec -it citoyenavise_postgres psql -U staging_user -d citoyenavise_staging

# CLI Redis
docker exec -it citoyenavise_redis redis-cli
```

### Database

```bash
# Restore database depuis fichier
docker exec -i citoyenavise_postgres psql -U staging_user -d citoyenavise_staging < backup.sql

# Dump database
docker exec citoyenavise_postgres pg_dump -U staging_user citoyenavise_staging > backup.sql

# Réinitialiser la DB
docker-compose down -v
docker-compose up -d
```

---

## 🐛 Debug & Troubleshooting

### Services ne démarrent pas

```bash
# Vérifiez les logs
docker-compose logs

# Vérifiez les ports disponibles
netstat -an | grep 5000
netstat -an | grep 5432
netstat -an | grep 6379

# Tuez les processus qui occupent les ports
lsof -ti:5000 | xargs kill -9
```

### Base de données ne se connecte pas

```bash
# Vérifiez que PostgreSQL est prêt
docker-compose ps

# Connectez-vous directement
docker exec -it citoyenavise_postgres psql -U staging_user -d citoyenavise_staging

# Vérifiez le fichier init
docker logs citoyenavise_postgres | grep -i init
```

### Redis ne répond pas

```bash
# Vérifiez la connexion
docker exec citoyenavise_redis redis-cli ping
# Output: PONG

# Vérifiez les données
docker exec citoyenavise_redis redis-cli dbsize
```

### Application ne démarre pas

```bash
# Vérifiez les logs
docker logs -f citoyenavise_app

# Vérifiez la syntaxe du docker-compose
docker-compose config

# Rebuild
docker-compose up --build
```

---

## 🔐 Sécurité Production

**⚠️ IMPORTANT: Ne pas utiliser en production !**

Le docker-compose est conçu pour le développement local. Pour la production :

### Changements Requis

1. **Secrets :**
   - ✅ Générer nouveaux JWT_SECRET, DB_PASSWORD
   - ✅ Stocker dans des vaults (AWS Secrets Manager, HashiCorp Vault)
   - ✅ Jamais en clair dans .env

2. **Database :**
   - ✅ Utiliser service managé (RDS, CloudSQL, Managed PostgreSQL)
   - ✅ Backups automatiques
   - ✅ Réplication et haute disponibilité
   - ✅ SSL/TLS encryption

3. **Cache :**
   - ✅ Utiliser ElastiCache (AWS) ou équivalent
   - ✅ Configuration cluster pour haute disponibilité
   - ✅ Encryption at rest

4. **Container Registry :**
   - ✅ Utiliser Docker Hub, ECR, GCR, ou équivalent
   - ✅ Image scanning pour vulnérabilités
   - ✅ Image signing

5. **Orchestration :**
   - ✅ Kubernetes, Docker Swarm, ou service géré
   - ✅ Load balancing
   - ✅ Auto-scaling
   - ✅ Health checks et recovery

---

## 📋 Profils Debug (Optionnel)

Inclus dans docker-compose mais désactivés par défaut :

```bash
# Lancer avec profils debug (pgAdmin + Redis Commander)
docker-compose --profile debug up -d

# pgAdmin: http://localhost:5050
# - Email: admin@example.com
# - Password: admin

# Redis Commander: http://localhost:8081
```

---

## 🚀 Production Deployment

### Dockerfile Optimization

Le Dockerfile inclus est optimisé pour production :

✅ **Multi-stage build** : Réduit la taille finale
✅ **Alpine Linux** : ~150MB au lieu de ~900MB
✅ **Non-root user** : Sécurité (nodejs:nodejs)
✅ **dumb-init** : Gestion correcte des signaux
✅ **Health checks** : Orchestration automatique
✅ **npm ci** : Installation déterministe

### Exemple Deployment

```bash
# Build l'image
docker build -t citoyenavise-backend:1.0.0 .

# Tag pour registry
docker tag citoyenavise-backend:1.0.0 myregistry.azurecr.io/citoyenavise-backend:1.0.0

# Push to registry
docker push myregistry.azurecr.io/citoyenavise-backend:1.0.0

# Deploy on Kubernetes/Docker Swarm
kubectl apply -f k8s-deployment.yaml
```

---

## 📚 Resources

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Node.js Best Practices in Containers](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

## 📞 Support

- 📧 Email: infocitoyenavise@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/citoyenavise/citoyenavise/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/citoyenavise/citoyenavise/discussions)

---

**Happy Dockering! 🐳**