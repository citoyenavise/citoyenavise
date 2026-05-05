# ⚡ Render Quick Start — 5 étapes

**Temps estimé** : 20 minutes  
**Prérequis** : Compte Render + GitHub connecté

---

## 1️⃣ Créer PostgreSQL (2 min)

```
Render Dashboard → New → PostgreSQL

Name: citoyenavise-db
Database: citoyenavise  
Region: Frankfurt
Plan: Starter
```

✅ Attendre la création → Copier `DATABASE_URL`

---

## 2️⃣ Créer Web Service (3 min)

```
Render Dashboard → New → Web Service

GitHub: connecter repo
Branch: main
Name: citoyenavise-web
Environment: Node
Region: Frankfurt

Build Command:
  cd backend && npm install && npm run build

Start Command:
  cd backend && npm run start:prod

Health Check Path: /health
```

---

## 3️⃣ Ajouter variables d'environnement (3 min)

Web Service → Environment → Add:

```
NODE_ENV              production
PORT                  5000
API_URL               https://citoyenavise.org/api
DATABASE_URL          [COPIER DE POSTGRESQL]
JWT_SECRET            [GÉNÉRER: openssl rand -base64 32]
JWT_REFRESH_SECRET    [GÉNÉRER: openssl rand -base64 32]
CORS_ORIGIN           https://citoyenavise.org
```

✅ Sauvegarder

---

## 4️⃣ Ajouter domaine (5 min)

Web Service → Settings → Custom Domains:

```
Add Domain: citoyenavise.org
Render génère un CNAME
```

**Chez votre registrar (Namecheap, GoDaddy, etc.)** :
```
CNAME @ → [render-cname]
TTL: 3600
```

✅ Attendre propagation DNS (1-5 min)

---

## 5️⃣ Déployer (5 min)

```
git push origin main
```

OU manuellement :

```
Render → citoyenavise-web → Deploy
```

✅ Attendre logs : "Application started"

---

## ✅ Valider

```bash
# Healthcheck
curl https://citoyenavise.org/health

# Créer compte
curl -X POST https://citoyenavise.org/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","username":"testuser"}'

# Lister idées
curl https://citoyenavise.org/api/v1/ideas
```

---

**Fait ! 🎉**

Pour le guide complet → voir `DEPLOYMENT_RENDER.md`
