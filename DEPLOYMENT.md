# 🚀 Deployment Guide — Citoyen Avisé

Guide complet pour déployer Citoyen Avisé sur les environnements staging et production.

---

## 📋 Prérequis

Avant le déploiement, s'assurer que les outils suivants sont installés :

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker** 20+ ([Install](https://docs.docker.com/install/))
- **Docker Compose** 1.29+ ([Install](https://docs.docker.com/compose/install/))
- **Git** ([Install](https://git-scm.com/))
- **Bash** (Linux/macOS) ou **WSL** (Windows)

---

## 🎯 Déploiement Rapide sur Staging

### **Méthode 1 : Script de Déploiement (Recommandé)**

```bash
# Rendre le script exécutable (une seule fois)
chmod +x scripts/deploy-staging.sh

# Exécuter le déploiement
./scripts/deploy-staging.sh
```

Le script effectue automatiquement :

1. ✅ **Vérifications pré-déploiement** (Node, npm, Docker, Git)
2. ✅ **Linting** (ESLint)
3. ✅ **Tests** (Jest + Playwright)
4. ✅ **Sécurité** (npm audit)
5. ✅ **Build Docker**
6. ✅ **Déploiement avec Docker Compose**
7. ✅ **Health checks**

**Output attendu :**
```
✨ Deployment to staging completed successfully!

Services running:
  NAME                          STATUS
  citoyenavise_postgres_staging Up (healthy)
  citoyenavise_redis_staging    Up (healthy)
  citoyenavise_app_staging      Up (healthy)

Available endpoints:
  📱 Frontend: http://localhost:3001
  🔌 Backend API: http://localhost:5000
  📊 API Docs: http://localhost:5000/api-docs
  🔍 Health: http://localhost:5000/health
```

---

### **Méthode 2 : Manuel avec Docker Compose**

```bash
# 1. Build l'image Docker
docker build -t citoyenavise:staging .

# 2. Démarrer les services
docker-compose -f docker-compose.staging.yml up -d

# 3. Vérifier le statut
docker-compose -f docker-compose.staging.yml ps

# 4. Voir les logs
docker-compose -f docker-compose.staging.yml logs -f
```

---

## 🔧 Configuration

### **Variables d'Environnement (.env)**

Copier `.env.example` en `.env` et configurer :

```bash
cp backend/.env.example backend/.env
```

**Variables clés :**

```env
# Environnement
NODE_ENV=staging

# Base de données
DATABASE_URL=postgresql://staging_user:staging_password@postgres:5432/citoyenavise_staging

# Authentification
JWT_SECRET=your-secret-key-here  # Générer: openssl rand -hex 32

# Email (Magic Link)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Frontend
FRONTEND_URL=http://localhost:3001
```

### **Docker Compose Staging**

Le fichier `docker-compose.staging.yml` configure :

| Service | Port | Config |
|---------|------|--------|
| PostgreSQL | 5432 | `citoyenavise_staging` DB |
| Redis | 6379 | Cache in-memory |
| Backend API | 5000 | Node.js Express |
| pgAdmin | 5050 | DB Management (debug) |
| Redis Commander | 8081 | Cache Management (debug) |

---

## 🧪 Vérification après Déploiement

### **1. Health Checks**

```bash
# Backend
curl http://localhost:5000/health
# Response: {"status":"ok","service":"citoyenavise-backend",...}

# Frontend
curl http://localhost:3001
# Response: HTML page
```

### **2. Logs**

```bash
# Tous les logs
docker-compose -f docker-compose.staging.yml logs

# Backend seulement
docker-compose -f docker-compose.staging.yml logs app

# Temps réel
docker-compose -f docker-compose.staging.yml logs -f
```

### **3. Database**

```bash
# Connexion PostgreSQL
docker exec -it citoyenavise_postgres_staging psql -U staging_user -d citoyenavise_staging

# Commandes utiles
\dt              # Voir les tables
\d users         # Voir structure de la table
SELECT COUNT(*) FROM users;
```

### **4. Redis**

```bash
# Connexion Redis
docker exec -it citoyenavise_redis_staging redis-cli

# Commandes utiles
PING            # Test connexion
DBSIZE          # Taille du cache
KEYS *          # Voir toutes les clés
```

---

## 🛑 Arrêter/Redémarrer Services

### **Arrêter tous les services**

```bash
docker-compose -f docker-compose.staging.yml down
```

### **Redémarrer les services**

```bash
docker-compose -f docker-compose.staging.yml restart
```

### **Redémarrer un service spécifique**

```bash
docker-compose -f docker-compose.staging.yml restart app
```

### **Supprimer les volumes (données)**

```bash
docker-compose -f docker-compose.staging.yml down -v
```

---

## 🐛 Troubleshooting

### **Backend ne démarre pas**

```bash
# Voir les logs
docker-compose -f docker-compose.staging.yml logs app

# Vérifier la configuration
docker exec citoyenavise_app_staging cat .env

# Vérifier la connexion DB
docker exec citoyenavise_app_staging npm run test:health
```

### **PostgreSQL ne démarre pas**

```bash
# Voir les logs
docker logs citoyenavise_postgres_staging

# Vérifier les volumes
docker volume ls | grep postgres

# Réinitialiser (attention: supprime les données)
docker-compose -f docker-compose.staging.yml down -v
docker-compose -f docker-compose.staging.yml up -d postgres
```

### **Redis ne répond pas**

```bash
# Test de connexion
docker exec citoyenavise_redis_staging redis-cli ping

# Voir la mémoire
docker exec citoyenavise_redis_staging redis-cli info memory

# Forcer le restart
docker-compose -f docker-compose.staging.yml restart redis
```

### **Ports déjà occupés**

```bash
# Trouver le processus qui occupe le port
lsof -i :5000        # Backend
lsof -i :5432        # PostgreSQL
lsof -i :6379        # Redis

# Tuer le processus
kill -9 <PID>

# Ou utiliser différents ports dans docker-compose.staging.yml
```

---

## 📊 Monitoring & Logs

### **Accéder à pgAdmin (Debug)**

```bash
# Démarrer avec le profil debug
docker-compose -f docker-compose.staging.yml --profile debug up -d

# Accès: http://localhost:5050
# Email: admin@example.com
# Password: admin
```

### **Accéder à Redis Commander (Debug)**

```bash
# Accès: http://localhost:8081
# Voir toutes les clés du cache
```

### **Logs structurés**

```bash
# JSON logs for parsing
docker-compose -f docker-compose.staging.yml logs --no-color app | jq .

# Logs avec timestamps
docker-compose -f docker-compose.staging.yml logs --timestamps app

# Dernières 100 lignes
docker-compose -f docker-compose.staging.yml logs --tail 100 app
```

---

## 🔒 Sécurité en Staging

⚠️ **À FAIRE AVANT LA PRODUCTION :**

- ✅ Changer `JWT_SECRET` (ne pas utiliser la valeur par défaut)
- ✅ Changer `SMTP_PASSWORD` (utiliser un app-specific password)
- ✅ Configurer `SENTRY_DSN` (error tracking)
- ✅ Vérifier les permissions des volumes
- ✅ Mettre à jour les versions de Docker images
- ✅ Configurer les backups de base de données
- ✅ Mettre en place un reverse proxy (Nginx/HAProxy)
- ✅ Configurer SSL/TLS

---

## 📈 Ressources Utiles

### **Commandes Docker Compose Fréquentes**

```bash
# Status des services
docker-compose -f docker-compose.staging.yml ps

# Exec une commande dans un conteneur
docker-compose -f docker-compose.staging.yml exec app npm test

# Build sans cache
docker-compose -f docker-compose.staging.yml build --no-cache

# Pull images à jour
docker-compose -f docker-compose.staging.yml pull

# Network
docker network inspect citoyenavise-network-staging
```

### **Cleanup & Maintenance**

```bash
# Supprimer les conteneurs arrêtés
docker container prune

# Supprimer les images non utilisées
docker image prune

# Supprimer les volumes non utilisés
docker volume prune

# Disk usage
docker system df

# Full cleanup (attention!)
docker system prune -a --volumes
```

---

## 🚀 Prochaines Étapes

- [ ] Tester le déploiement staging
- [ ] Vérifier tous les endpoints API
- [ ] Tester le workflow utilisateur complet
- [ ] Configurer les backups
- [ ] Mettre en place le monitoring
- [ ] Configurer SSL/TLS
- [ ] Déployer en production

---

## 📞 Support

- 📧 Email: infocitoyenavise@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/citoyenavise/citoyenavise/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/citoyenavise/citoyenavise/discussions)

---

**Déploiement réussi ? 🎉 Partager votre expérience !**
