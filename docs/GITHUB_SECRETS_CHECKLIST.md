# 🔐 GitHub Secrets Configuration - Citoyenavise v1.0.0

**Statut** : Guide pour configurer les secrets GitHub  
**Projet** : https://github.com/citoyenavise/citoyenavise  
**Dernière mise à jour** : 2026-05-13

---

## 📌 Vue d'ensemble des secrets nécessaires

| Secret | Requis | Usage | Source |
|--------|--------|-------|--------|
| `DOCKER_REGISTRY_USERNAME` | ✅ | Docker Hub push | Docker Hub |
| `DOCKER_REGISTRY_PASSWORD` | ✅ | Docker Hub token | Docker Hub |
| `DATABASE_URL_STAGING` | ✅ | DB connection (staging) | Heroku Postgres ou RDS |
| `DATABASE_URL_PRODUCTION` | ✅ | DB connection (prod) | RDS ou Managed DB |
| `JWT_SECRET` | ✅ | Auth JWT (min 32 chars) | Generate: `openssl rand -hex 32` |
| `BREVO_SMTP_USER` | ✅ | Email SMTP user | Brevo account |
| `BREVO_SMTP_PASS` | ✅ | Email SMTP password | Brevo account |
| `SENTRY_DSN` | ⏳ | Error tracking (optional) | Sentry |
| `SLACK_WEBHOOK_URL` | ⏳ | CI/CD notifications (optional) | Slack App |
| `DEPLOY_KEY_PRODUCTION` | ✅ | SSH key for deployment | Generate locally |
| `HEROKU_API_KEY` | ✅ (if using Heroku) | Deployment | Heroku |
| `RENDER_API_TOKEN` | ✅ (if using Render) | Deployment | Render.com |

---

## 🔧 Comment ajouter un secret GitHub (Sans gh CLI)

### Via Interface Web GitHub

1. **Aller sur** : https://github.com/citoyenavise/citoyenavise/settings/secrets/actions
2. **Cliquer sur** "New repository secret"
3. **Remplir** :
   - `Name` : Exactement comme dans le tableau ci-dessus (ex: `DOCKER_REGISTRY_USERNAME`)
   - `Value` : La valeur du secret
4. **Cliquer** "Add secret"

> **Sécurité** : Les secrets sont chiffrés et non visibles après création

---

## 📝 Étapes pour récupérer chaque secret

### 1️⃣ **DOCKER_REGISTRY_USERNAME & DOCKER_REGISTRY_PASSWORD**

**Où récupérer :**
- Aller sur : https://hub.docker.com/settings/security
- Cliquer "New access token"
- Donner un nom : `citoyenavise-github-actions`
- Sélectionner permissions : `Read & Write`

**À ajouter en GitHub Secrets :**
```
Name:  DOCKER_REGISTRY_USERNAME
Value: infocitoyenavise (ou ton username Docker Hub)

Name:  DOCKER_REGISTRY_PASSWORD
Value: dckr_pat_xxxxxxxxxxxxx (le token généré, PAS ton password)
```

**Usage** : CI/CD push images Docker Hub

---

### 2️⃣ **DATABASE_URL_STAGING & DATABASE_URL_PRODUCTION**

Choisir l'option qui correspond à ta stack :

#### Option A : Heroku PostgreSQL
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
```
- Récupérer depuis Heroku Dashboard → App → Settings → Config Vars → DATABASE_URL

#### Option B : AWS RDS
```
DATABASE_URL=postgresql://admin:password@citoyenavise-db.xxxxx.us-east-1.rds.amazonaws.com:5432/citoyenavise_prod
```
- Récupérer depuis RDS Console → DB instances → Endpoint
- Username: créer lors de la création RDS
- Password: le mot de passe RDS

#### Option C : Render.com PostgreSQL
```
DATABASE_URL=postgresql://user:password@dpg-xxxxx.postgres.render.com:5432/citoyenavise_db
```
- Récupérer depuis Render Dashboard → Databases → Connection Info

**À ajouter en GitHub Secrets (2 secrets) :**
```
Name:  DATABASE_URL_STAGING
Value: postgresql://...

Name:  DATABASE_URL_PRODUCTION
Value: postgresql://...
```

---

### 3️⃣ **JWT_SECRET**

**Générer une clé JWT sécurisée :**

```bash
# Sur ta machine locale
openssl rand -hex 32
# Exemple output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# OU si tu n'as pas openssl
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**À ajouter en GitHub Secrets :**
```
Name:  JWT_SECRET
Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6 (32+ chars)
```

**Usage** : Backend JWT token signing (auth)

---

### 4️⃣ **BREVO_SMTP_USER & BREVO_SMTP_PASS**

**Où récupérer :**
1. Aller sur : https://app.brevo.com/account/smtp-tls
2. Copier le "SMTP User" et "SMTP Password"

**À ajouter en GitHub Secrets (2 secrets) :**
```
Name:  BREVO_SMTP_USER
Value: a9b184001@smtp-brevo.com (ou ton user Brevo)

Name:  BREVO_SMTP_PASS
Value: xsmtpsib-xxxxxxxxxxxxx (le password fourni par Brevo)
```

**Usage** : Envoi emails (Magic Link authentication)

---

### 5️⃣ **HEROKU_API_KEY** (si déploiement sur Heroku)

**Où récupérer :**
1. Aller sur : https://dashboard.heroku.com/account/applications/authorizations
2. Cliquer "Create authorization"
3. Ou utiliser : `heroku auth:token` (si connecté localement)

**À ajouter en GitHub Secrets :**
```
Name:  HEROKU_API_KEY
Value: xxxxxxxxxxxxxxxxxxxx

Name:  HEROKU_APP_NAME
Value: citoyenavise-staging (ou ton app Heroku)

Name:  HEROKU_EMAIL
Value: infocitoyenavise@gmail.com
```

**Usage** : `deploy.yml` → Déploiement Heroku automatique

---

### 6️⃣ **RENDER_API_TOKEN** (si déploiement sur Render)

**Où récupérer :**
1. Aller sur : https://dashboard.render.com/account/api-tokens
2. Cliquer "Create API Key"

**À ajouter en GitHub Secrets :**
```
Name:  RENDER_API_TOKEN
Value: rnd_xxxxxxxxxxxxx

Name:  RENDER_SERVICE_ID
Value: srv_xxxxxxxxxxxxx (ID du service Render)
```

**Usage** : `deploy.yml` → Déploiement Render automatique

---

### 7️⃣ **SENTRY_DSN** (Optionnel - Error Tracking)

**Où récupérer :**
1. Créer compte : https://sentry.io
2. Créer projet → copier DSN

**À ajouter en GitHub Secrets :**
```
Name:  SENTRY_DSN
Value: https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Usage** : Erreurs runtime (frontend + backend)

---

### 8️⃣ **SLACK_WEBHOOK_URL** (Optionnel - Notifications)

**Où récupérer :**
1. Aller sur : https://api.slack.com/messaging/webhooks
2. Créer Slack App → Incoming Webhooks → Add New Webhook
3. Copier l'URL

**À ajouter en GitHub Secrets :**
```
Name:  SLACK_WEBHOOK_URL
Value: <URL_SLACK_WEBHOOK_OBTENUE_SUR_api.slack.com>
```

**Usage** : Notifications CI/CD failures dans Slack

---

## ✅ Checklist de Configuration

### Avant déploiement
- [ ] DOCKER_REGISTRY_USERNAME + PASSWORD
- [ ] DATABASE_URL_STAGING + PRODUCTION
- [ ] JWT_SECRET (32+ chars)
- [ ] BREVO_SMTP_USER + PASS
- [ ] Choisir déploiement : Heroku OU Render
  - [ ] HEROKU_API_KEY + APP_NAME + EMAIL (si Heroku)
  - [ ] RENDER_API_TOKEN + SERVICE_ID (si Render)

### Optionnel
- [ ] SENTRY_DSN (error tracking)
- [ ] SLACK_WEBHOOK_URL (notifications)

---

## 🚀 Comment utiliser les secrets dans les workflows

### Exemple dans `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Login Docker Hub
      - uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_REGISTRY_USERNAME }}
          password: ${{ secrets.DOCKER_REGISTRY_PASSWORD }}
      
      # Deploy to Heroku
      - name: Deploy to Heroku
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
          HEROKU_APP_NAME: ${{ secrets.HEROKU_APP_NAME }}
          DATABASE_URL: ${{ secrets.DATABASE_URL_PRODUCTION }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
```

---

## 🔒 Bonnes pratiques

1. **Ne jamais** mettre les secrets dans le code
2. **Ne jamais** les mettre dans `.env` (fichier source)
3. **Ne jamais** les pusher sur GitHub
4. **Rotation régulière** : Changer les tokens tous les 6 mois
5. **Audit** : Vérifier qui a accès aux secrets dans GitHub Settings
6. **Test local** : Utiliser `.env.example` pour développement

---

## 📞 Débogage

### Secret non trouvé dans workflow
```bash
# Vérifier que le secret existe
# GitHub → Settings → Secrets and variables → Actions

# Secret apparaît comme *** dans logs (c'est normal)
```

### Erreur "secret not found"
- Vérifier l'exacte orthographe du nom du secret
- Vérifier qu'il est dans le bon repository (pas dans une organization seule)

---

## 📄 Fichiers utilisant les secrets

- `.github/workflows/deploy.yml` - Déploiement production
- `.github/workflows/ci.yml` - Tests + build
- `backend/src/server.js` - Utilise `process.env.JWT_SECRET`, `DATABASE_URL`
- `frontend/vite.config.js` - Utilise `process.env.VITE_*` si applicable

---

**Status** : Prêt pour configuration  
**Prochaine étape** : Aller sur https://github.com/citoyenavise/citoyenavise/settings/secrets/actions et ajouter les secrets

