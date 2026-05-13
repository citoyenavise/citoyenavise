# 🔐 GitHub Secrets Configuration Checklist

## Pour Citoyenavise.org v1.0.0

### 1️⃣ Docker Hub Credentials
**Où récupérer :**
- URL: https://hub.docker.com/settings/security
- Clique sur "New access token"

**À fournir :**
- [ ] `DOCKER_USERNAME` → `infocitoyenavise` (ou ton username Docker Hub)
- [ ] `DOCKER_PASSWORD` → Token généré depuis Docker Hub (NOT ton password)

**Format attendu :**
```
DOCKER_USERNAME=infocitoyenavise
DOCKER_PASSWORD=dckr_pat_xxxxxxxxxxxx  (access token, PAS le mot de passe)
```

---

### 2️⃣ Heroku/Render Credentials
**Choix : Lequel utilises-tu ?**

#### Option A - Heroku
**Où récupérer :**
- URL: https://dashboard.heroku.com/account/applications/authorizations
- Clique sur "Create authorization"
- Ou récupère ton token existant: `heroku auth:token`

**À fournir :**
```
HEROKU_API_KEY=xxxxxxxxxxxx (ton API key Heroku)
HEROKU_APP_NAME=citoyenavise-staging (nom de ton app)
HEROKU_EMAIL=infocitoyenavise@gmail.com (email lié à ton compte)
```

#### Option B - Render
**Où récupérer :**
- URL: https://dashboard.render.com/account/api-tokens
- Génère un nouveau token

**À fournir :**
```
RENDER_API_KEY=rnd_xxxxxxxxxxxx (ton API key Render)
RENDER_SERVICE_ID=srv_xxxxxxxxxxxx (ID du service)
```

---

### 3️⃣ Slack Webhook (Optionnel)
**Où récupérer :**
- URL: https://api.slack.com/messaging/webhooks
- Crée une Slack App si tu n'en as pas
- Ajoute "Incoming Webhooks"
- Copie le Webhook URL

**À fournir :**
```
SLACK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 📋 Résumé des Secrets Nécessaires

| Secret | Requis | Source |
|--------|--------|--------|
| DOCKER_USERNAME | ✅ | Docker Hub |
| DOCKER_PASSWORD | ✅ | Docker Hub Access Token |
| HEROKU_API_KEY ou RENDER_API_KEY | ✅ | Heroku/Render |
| HEROKU_APP_NAME ou RENDER_SERVICE_ID | ✅ | Heroku/Render |
| HEROKU_EMAIL | ✅ (si Heroku) | Ton email |
| SLACK_WEBHOOK | ⏳ | Slack (optionnel) |

---

## ✅ Instructions Finales

1. **Récupère les credentials** en suivant les liens ci-dessus
2. **Note-les** quelque part (temporairement sécurisé)
3. **Reviens ici** avec l'info pour que j'ajoute les secrets à GitHub
4. Je configurerai tout automatiquement via `gh CLI`

---

**Besoin d'aide pour un secret spécifique ?** Demande !
