# 🚀 Guide de déploiement Render - Monorepo

**État** : Phase de déploiement en production
**Date** : 2026-05-05
**Plateforme** : Render.com
**Architecture** : Monorepo (backend Node.js + frontend React)

---

## 📋 Checklist pré-déploiement

- [ ] Compte Render créé et authentifié
- [ ] Compte GitHub connecté à Render
- [ ] Repository public ou accès Render accordé
- [ ] Branche `main` testée localement
- [ ] Commit de déploiement sur `main` (pas de `develop`)
- [ ] Variables d'environnement validées

---

## ÉTAPE 1️⃣ — Créer la base de données PostgreSQL

### Via interface Render

1. **Aller sur** : https://dashboard.render.com
2. **Cliquer** : `New` → `PostgreSQL`
3. **Remplir** :
   - **Name** : `citoyenavise-db`
   - **Database** : `citoyenavise`
   - **Region** : `Frankfurt (EU)`
   - **PostgreSQL Version** : Latest (14+)

4. **Créer** → Attendre ~2 minutes

### À récupérer

```
Internal Database URL: postgres://user:pass@host:5432/citoyenavise
External Database URL: (utiliser pour clients externes)
```

**Sauvegarder cette URL** → elle sera ajoutée automatiquement dans le Web Service

---

## ÉTAPE 2️⃣ — Créer le Web Service (Backend + Frontend)

### Via interface Render

1. **Aller sur** : https://dashboard.render.com
2. **Cliquer** : `New` → `Web Service`

### Configuration GitHub

3. **Section "Source"** :
   - Connecter repo GitHub
   - Sélectionner : `citoyenavise` (ou votre repo)
   - Branch : `main`

### Configuration du service

4. **Section "Details"** :
   - **Name** : `citoyenavise-web`
   - **Environment** : `Node`
   - **Region** : `Frankfurt (EU)`
   - **Plan** : `Standard` (minimum requis)

5. **Section "Build & Deploy"** :
   - **Build Command** : 
     ```
     cd backend && npm install && npm run build
     ```
   - **Start Command** : 
     ```
     cd backend && npm run start:prod
     ```

6. **Section "Health Check"** :
   - Path : `/health`
   - Interval : `10s`
   - Timeout : `5s`

7. **Auto-Deploy** : `ON` (ou `OFF` si vous préférez déployer manuellement)

---

## ÉTAPE 3️⃣ — Configurer les variables d'environnement

### Dans Render Dashboard

1. **Web Service** → `citoyenavise-web` → onglet `Environment`

2. **Ajouter les variables suivantes** (copier depuis `.env.production.example`) :

```
NODE_ENV                    production
PORT                        5000
API_URL                     https://citoyenavise.org/api
DATABASE_URL               postgres://... (fourni automatiquement)
JWT_SECRET                 [GÉNÉRER CI-DESSOUS]
JWT_REFRESH_SECRET         [GÉNÉRER CI-DESSOUS]
JWT_EXPIRES_IN             15m
JWT_REFRESH_EXPIRES_IN     7d
CORS_ORIGIN                https://citoyenavise.org
LOG_LEVEL                  info
```

### ⚠️ Générer les secrets JWT

En local, exécuter (2 fois) :
```bash
openssl rand -base64 32
```

Copier les deux valeurs aléatoires :
- 1ère → `JWT_SECRET`
- 2ème → `JWT_REFRESH_SECRET`

**NE JAMAIS** mettre en git / partager publiquement

### Variables optionnelles

```
SENTRY_DSN               (error tracking — ignorer pour MVP)
REDIS_URL               (cache — ignorer pour MVP)
SMTP_*                  (email — ignorer pour MVP)
```

---

## ÉTAPE 4️⃣ — Connecter la base de données

### Configuration automatique

La database PostgreSQL créée à l'étape 1 doit être **connectée automatiquement** si vous avez utilisé le même nom.

**Vérifier** dans Render Dashboard :
1. Web Service → `citoyenavise-web`
2. Onglet `Environment`
3. La variable `DATABASE_URL` doit être pré-remplie ✅

Si **manquante** → la copier manuellement depuis PostgreSQL service

### Appliquer les migrations

Après le premier déploiement réussi, les migrations seront appliquées automatiquement (via `migrationRunner.js` au démarrage).

---

## ÉTAPE 5️⃣ — Ajouter le domaine citoyenavise.org

### Dans Render Dashboard

1. Web Service → `citoyenavise-web`
2. Onglet `Settings`
3. Section `Custom Domains`
4. **Cliquer** : `Add Custom Domain`
5. **Entrer** : `citoyenavise.org`
6. Render génère un **CNAME**

### Chez votre registrar (ex : Namecheap, GoDaddy)

1. **Aller dans** : DNS Settings
2. **Ajouter un enregistrement CNAME** :
   - Host : `@` (ou laisser vide)
   - Value : `<cname-fourni-par-render>`
   - TTL : 3600

3. **Attendre** : 1-5 minutes (propagation DNS)
4. **Vérifier** : 
   ```bash
   nslookup citoyenavise.org
   ```

### HTTPS automatique

Render génère un certificat Let's Encrypt **automatiquement** une fois le domaine validé.

Attendre ~5 minutes après la propagation DNS.

---

## ÉTAPE 6️⃣ — Premier déploiement

### Option A : Déploiement automatique

Si Auto-Deploy est activé → le simple `git push origin main` déclenche le déploiement.

### Option B : Déploiement manuel

1. Render Dashboard → Web Service → `citoyenavise-web`
2. **Bouton** : `Deploy` → `Deploy latest commit`
3. Attendre ~3-5 minutes

### Logs de déploiement

1. Cliquer sur le service
2. Onglet `Logs`
3. Vérifier :
   ```
   ✅ Build started
   ✅ npm install completed
   ✅ npm run build completed
   ✅ Application started
   ✅ Health check passed
   ```

---

## ÉTAPE 7️⃣ — Validation technique

### Tester l'endpoint santé

```bash
curl https://citoyenavise.org/health
```

**Résultat attendu** :
```json
{
  "status": "ok",
  "timestamp": "2026-05-05T...",
  "db": "connected"
}
```

### Tester le certificat HTTPS

```bash
curl -I https://citoyenavise.org
```

**Vérifier** :
- HTTP/2 200 ✅
- Certificat Let's Encrypt ✅
- Header HSTS présent ✅

### Tester le flux utilisateur

1. **Signup** : POST `/api/v1/auth/register`
2. **Login** : POST `/api/v1/auth/login`
3. **Créer une idée** : POST `/api/v1/ideas`
4. **Liker une idée** : POST `/api/v1/ideas/{id}/like`
5. **Voir populaires** : GET `/api/v1/ideas/popular`

Voir `GUIDE_TEST_MINIMAL.md` pour les commandes curl exactes.

---

## ÉTAPE 8️⃣ — Monitoring et alertes

### UptimeRobot (optionnel)

1. **Créer un compte** : https://uptimerobot.com
2. **Ajouter un moniteur HTTP** :
   - URL : `https://citoyenavise.org/health`
   - Intervalle : 5 minutes
   - Alertes : Email

3. **Sauvegarder**

### Render Logs (inclus)

Render Dashboard → Web Service → Logs

Vérifier **quotidiennement** :
- Aucune erreur critique 🔴
- Logs Winston au format JSON ✅
- Pas de fuites mémoire 🔴

### Sentry (optionnel)

Si vous activez l'erreur tracking :

1. Créer un compte Sentry.io
2. Créer un projet Node.js
3. Copier le DSN
4. Ajouter à Render Environment → `SENTRY_DSN`
5. Redéployer

---

## ⚠️ Troubleshooting

### "Build Failed"

**Logs à vérifier** :
```
npm install error → dépendance manquante
npm run build error → test ou lint échoue
```

**Solutions** :
1. Vérifier `backend/package.json`
2. Relancer localement : `npm install && npm run build`
3. Commiter les corrections
4. Redéployer

### "Service Failed to Start"

**Logs à vérifier** :
```
DATABASE_URL missing
JWT_SECRET missing ou vide
PORT conflict
```

**Solutions** :
1. Vérifier toutes les variables d'environnement
2. Vérifier que la database est connectée
3. Redéployer

### "Health Check Failing"

**Vérifier** :
1. Endpoint `/health` retourne 200 ?
2. Base de données connectée ?
3. Variables d'environnement valides ?

**Command de test local** :
```bash
cd backend && npm run dev
curl http://localhost:5000/health
```

---

## ✅ Checklist post-déploiement

- [ ] Domaine DNS configuré
- [ ] HTTPS certificat actif
- [ ] Endpoint `/health` répond 200
- [ ] Base de données connectée
- [ ] JWT secrets configurés
- [ ] Premier utilisateur créé
- [ ] Idea créée et likée
- [ ] Popularité visible
- [ ] Monitoring UptimeRobot activé (optionnel)
- [ ] Logs vérifiés (pas d'erreur critique)

---

## 📊 Récapitulatif URLs

| Composant | URL |
|-----------|-----|
| **Site Web** | https://citoyenavise.org |
| **Health Check** | https://citoyenavise.org/health |
| **API Docs** | https://citoyenavise.org/api/docs |
| **Render Dashboard** | https://dashboard.render.com |

---

## 🆘 Support

Si une étape échoue :

1. **Vérifier les logs** Render (très détaillés)
2. **Reproduire localement** (`npm run dev`)
3. **Vérifier les variables d'environnement** (typos courants)
4. **Contacter Render Support** (inclus dans le plan)

---

**Prêt ? Commencez par l'ÉTAPE 1** 🚀
