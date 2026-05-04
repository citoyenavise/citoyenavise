# Démarrer Citoyen Avisé en développement

Guide complet pour lancer le projet localement (Backend + Frontend).

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 12+
- Git
- Navigateur moderne (Chrome, Firefox, Safari, Edge)

## 🔧 Configuration initiale (Une fois)

### 1. Base de données

```bash
# Créer base
createdb citoyenavise_dev

# Activer extensions
psql citoyenavise_dev -c "CREATE EXTENSION postgis;"
psql citoyenavise_dev -c "CREATE EXTENSION \"uuid-ossp\";"

# Vérifier
psql citoyenavise_dev -c "SELECT version();"
```

### 2. Backend

```bash
cd backend

# Copier .env
cp .env.example .env

# Éditer .env avec vos paramètres
# DATABASE_URL=postgresql://postgres:votre_mdp@localhost:5432/citoyenavise_dev
# JWT_SECRET=gener_une_clé_aléatoire_min_32_chars

# Installer
npm install

# Initialiser DB
node src/database/init.js

# Résultat attendu: ✅ Database initialized successfully
```

### 3. Frontend

Aucune installation nécessaire! Les fichiers sont statiques en `public/`.

## 🚀 Lancer en développement

### Option A : Local (Sans Docker)

**Terminal 1 : Backend**

```bash
cd backend

# Setup initial (une fois)
npm install
npm run setup        # Exécute les migrations automatiquement

# Lancer le serveur
npm run dev

# Résultat attendu:
# 🚀 Server started on port 5000
# ✅ Redis connected (cache activé)
# environment: development
```

**Terminal 2 : Frontend**

```bash
cd public

# Avec Python 3
python -m http.server 3000

# Avec Node (si http-server installé)
http-server . -p 3000

# Puis ouvrir: http://localhost:3000
```

---

### Option B : Docker Compose (Recommandé)

**Setup complet** (Backend + PostgreSQL + Redis + Frontend + pgAdmin)

```bash
# 1. Configuration
cp .env.docker .env
# Éditer .env si nécessaire

# 2. Démarrer tous les services
docker-compose up -d

# 3. Attendre que tout soit prêt (30-40 secondes)
docker-compose logs -f backend

# Résultat attendu:
# ✅ Redis connected
# ✅ Database connected
# 🚀 Server started on port 5000

# 4. Accéder
# Frontend:   http://localhost:3000
# Backend:    http://localhost:5000
# pgAdmin:    http://localhost:5050 (admin@citoyenavise.local / admin)
# Redis-CLI:  http://localhost:8081
```

**Commandes utiles:**
```bash
# Voir les logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Arrêter services
docker-compose down

# Redémarrer
docker-compose restart backend

# Nettoyer (avec volumes)
docker-compose down -v
```

**Accès à la DB depuis pgAdmin:**
- Hostname: `postgres` (ou IP conteneur)
- Port: `5432`
- Username: `postgres`
- Password: voir `DB_PASSWORD` dans `.env`
- Database: `citoyenavise`

**Option B : Ouvrir fichier directement**
```bash
# Juste double-cliquer sur public/index.html
# Fonctionne aussi (mais pas de routing)
```

## ✅ Vérifier que tout fonctionne

### 1. Health Check Backend
```bash
curl http://localhost:5000/health

# Réponse attendue:
# {"status":"ok","timestamp":"2026-05-02T...","db":"connected"}
```

### 2. Accéder Frontend
```
http://localhost:3000
```

Devrait afficher:
- Header avec logo "🍁 Citoyen Avisé"
- Bouton "Connexion"
- Carte interactive
- Liste des citoyens

### 3. Tester Auth Flow

**Inscription:**
1. Cliquer "Connexion" → Lien "Créer un compte"
2. Remplir: username, email, password (min 8 chars + majuscule)
3. Cliquer "S'inscrire"
4. Redirection vers page d'accueil
5. Header montre votre nom + menu

**Profil:**
1. Cliquer votre nom dans header
2. Cliquer "Mon profil"
3. Cliquer "✏️ Éditer profil"
4. Remplir bio, localisation, intérêts
5. Cliquer "Sauvegarder"

**Posts:**
1. Cliquer "Fil d'actualité" ou "Créer un post" du menu
2. Remplir titre, contenu
3. Choisir type (Idée, Question, etc.)
4. Choisir catégorie
5. Cliquer "Publier"
6. Post apparaît dans le feed

**Carte:**
1. Cliquer "Accueil"
2. Voir carte interactive
3. Voir liste citoyens à droite
4. Cliquer profil → popup sur carte
5. Cliquer "Voir profil" → détails citoyen

## 🔍 DevTools Essentiels

### Console (F12)
```javascript
// Vérifier état
console.log(store.getState());
console.log(localStorage);

// Tester API
api.auth.getMe().then(r => console.log(r));

// Vérifier token
localStorage.getItem('ca_token');
```

### Network Tab
- Vérifier requêtes API (Status 200, 201, etc.)
- Voir payloads (headers, body)
- Vérifier Authorization header

### Application Tab
- Vérifier localStorage (ca_token, ca_user, ca_profile)
- Vérifier Cookies (future)

## 🐛 Dépannage

### Backend ne démarre pas

```bash
# Vérifier Node
node --version    # v18+

# Vérifier dépendances
npm list          # Pas d'erreurs

# Vérifier DATABASE_URL dans .env
echo $DATABASE_URL

# Tester connexion DB
psql citoyenavise_dev -c "SELECT NOW();"
```

### Frontend ne charge pas

```bash
# Vérifier serveur HTTP
curl http://localhost:3000

# Vérifier console browser (F12)
# Chercher erreurs rouges

# Vérifier chemin fichiers
# public/js/utils/api.js existe ?
```

### Erreur "API not responding"

```javascript
// Frontend console
console.log(api.baseURL);  // http://localhost:5000/api/v1

// Backend doit être running
// Backend console: "🚀 Server started on port 5000"

// Tester directement
curl http://localhost:5000/api/v1/auth/me
// Doit retourner 401 (no token) ou 200 (avec token)
```

### Erreur "CORS"

```
Backend .env:
CORS_ORIGIN=http://localhost:3000

Frontend:
- Ouvrir sur http://localhost:3000 (pas file://)
- Pas sur 127.0.0.1
- Pas sur ip locale
```

### Token expiré

```javascript
// Frontend console
localStorage.removeItem('ca_token');
location.reload();

// Puis se reconnecter
```

## 📊 Monitoring

### Backend logs

Terminal doit afficher :
```
🚀 Server started on port 5000
[debug] GET /api/v1/auth/me
[info] User logged in { userId: '...', email: '...' }
```

### Frontend errors

Console devrait être vide (pas d'erreurs rouges).

## 🎯 Tester les 3 modules MVP

### Module 1 : IDEAS (Idées Civiques)

**Page:** http://localhost:3000/pages/ideas.html

1. S'authentifier
2. Cliquer "Proposer une idée"
3. Remplir:
   - Titre: "Une idée brillante"
   - Description: "Description détaillée de l'idée..."
   - Catégorie: Élections
4. Cliquer "Publier mon idée"

**Vérifications:**
- ✅ L'idée apparaît dans la liste
- ✅ Compteur de likes = 0
- ✅ Catégorie affichée correctement

### Module 2 : LIKES (Système de Votes)

**Sur la page ideas.html:**

1. Cliquer le bouton 🤍 sur une idée
2. Le cœur devient ❤️ et le compteur augmente
3. Cliquer à nouveau pour retirer le like
4. Le cœur redevient 🤍 et le compteur diminue

**Vérifications:**
- ✅ Les likes sont persistants
- ✅ Un utilisateur ne peut pas liker deux fois
- ✅ Le compteur est exact

### Module 3 : POPULAR_SYSTEM (Contenu Populaire)

**Page:** http://localhost:3000/pages/homepage.html

1. Créer plusieurs idées avec des likes
2. Ouvrir la page homepage
3. Vérifier:
   - 📊 Statistiques globales
   - 💡 Idées populaires (7j)
   - 🔥 Posts tendance (24h)
   - ⭐ Utilisateurs influents

**Vérifications:**
- ✅ Idées les plus likées en premier
- ✅ Posts récents avec beaucoup de likes en tendance
- ✅ Utilisateurs avec plus de followers en premier

## 🔄 Workflow typique

```
1. Lancer backend    (Terminal 1)
2. Lancer frontend   (Terminal 2)
3. Ouvrir http://localhost:3000
4. S'inscrire / Se connecter
5. Tester IDEAS: /pages/ideas.html
6. Tester LIKES: Liker une idée
7. Tester POPULAR: /pages/homepage.html
8. Vérifier API calls (Network tab)
9. Consulter logs backend
```

## 🌐 Fichiers importants à connaître

### Backend
```
backend/.env                    # Configuration (JWT, DB)
backend/src/config.js          # Lectures .env
backend/src/app.js             # Initialisation Express
backend/src/routes/            # Définition routes API
backend/src/services/          # Logique métier
backend/database/schema.sql    # Schéma DB
```

### Frontend
```
public/index.html              # Point d'entrée
public/pages/*.html            # Pages SPA
public/js/utils/api.js         # Client API
public/js/utils/store.js       # Gestion état
public/js/app.js               # Router
public/css/components.css      # Composants
```

## 💾 Sauvegardes & Réinitialisation

### Réinitialiser la DB (perdre toutes les données)

```bash
# Supprimer base
dropdb citoyenavise_dev

# Recréer
createdb citoyenavise_dev

# Réappliquer extensions
psql citoyenavise_dev -c "CREATE EXTENSION postgis;"

# Réinitialiser schéma
cd backend && node src/database/init.js
```

### Supprimer données locales (frontend)

```javascript
// Frontend console
localStorage.clear();
location.reload();
```

## 🎯 Checklist Avant Commit

- [ ] Backend logs propre (pas d'erreurs)
- [ ] Frontend console propre (pas d'erreurs)
- [ ] Toutes les requêtes API 200/201/204
- [ ] localStorage contient ca_token
- [ ] Pages chargent correctement
- [ ] Formulaires validés
- [ ] Pas de console.log() en dur

## 📞 Support Rapide

| Problème | Commande | Résultat |
|----------|----------|----------|
| Backend crash | Relancer terminal 1 | Log devrait réapparaître |
| Frontend blanc | F12 Console → erreurs | Voir messages d'erreur |
| DB error | `psql citoyenavise_dev` | Accès DB confirmé |
| Token invalide | localStorage.clear() | Nouvelle session |
| Port utilisé | Changer port dans .env | PORT=5001 |

## 🎉 Succès!

Quand vous voyez:
- Terminal 1 : `🚀 Server started on port 5000`
- Terminal 2 : Serveur HTTP running
- Browser : http://localhost:3000 affiche la page
- Header : "🍁 Citoyen Avisé" + "Connexion"

**C'est prêt! 🚀**

---

**Bon développement!**
