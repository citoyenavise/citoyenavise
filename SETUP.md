# Citoyen Avisé — Setup Complet

Guide d'installation et démarrage du projet complet.

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Installation PostgreSQL](#installation-postgresql)
3. [Setup Backend](#setup-backend)
4. [Vérification](#vérification)
5. [Prochaines étapes](#prochaines-étapes)

## 🖥️ Prérequis

### Système d'exploitation
- Windows 11 ✓ (actuellement)
- macOS (Homebrew)
- Linux (apt, dnf, etc.)

### Logiciels requis
- **Node.js** 18+ : https://nodejs.org/
- **PostgreSQL** 12+ : https://www.postgresql.org/
- **Git** : https://git-scm.com/

### Vérifier installation

```bash
# Node
node --version    # v18.17.0 ou plus

# npm
npm --version     # 9.6.0 ou plus

# PostgreSQL
psql --version    # PostgreSQL 12+

# Git
git --version     # 2.40.0+
```

## 🐘 Installation PostgreSQL

### Windows (pgAdmin)
1. Télécharger PostgreSQL : https://www.postgresql.org/download/windows/
2. Lancer l'installeur
3. Note le port (par défaut **5432**) et le mot de passe superuser
4. Ajouter PostgreSQL bin/ au PATH (l'installeur le propose)

### macOS (Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Vérifier installation
```bash
psql --version
psql postgres -U postgres -c "SELECT version();"
```

## 🚀 Setup Backend

### 1. Créer base de données

```bash
# Se connecter à PostgreSQL (Windows)
psql -U postgres

# Ou (macOS/Linux, si user=postgres déjà créé)
sudo -u postgres psql

# Créer la base
CREATE DATABASE citoyenavise_dev;

# Vérifier
\l  # Liste les bases

# Quitter
\q
```

### 2. Activer PostGIS

```bash
# Se connecter à la nouvelle base
psql -U postgres -d citoyenavise_dev

# Créer extension
CREATE EXTENSION postgis;
CREATE EXTENSION "uuid-ossp";

# Vérifier
SELECT PostGIS_version();

# Quitter
\q
```

### 3. Cloner/Naviguer vers le projet

```bash
# Si vous n'avez pas cloné le repo
git clone <repo-url> citoyenavise
cd citoyenavise

# Ou si le repo existe déjà
cd citoyenavise
git pull
```

### 4. Setup backend

```bash
cd backend

# Créer fichier .env
cp .env.example .env

# IMPORTANT : Éditer .env
# - Définir DATABASE_URL
# - Définir JWT_SECRET
```

#### Exemple .env (Windows)

```env
DATABASE_URL=postgresql://postgres:votre_mdp@localhost:5432/citoyenavise_dev
JWT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz   # 32+ chars
JWT_EXPIRY_ACCESS=24h
NODE_ENV=development
PORT=5000
```

#### Générer JWT_SECRET sécurisé

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object {[byte](Get-Random -Maximum 256)})) | Select-Object -First 44
```

**macOS/Linux:**
```bash
openssl rand -base64 32
```

### 5. Installer dépendances et initialiser DB

```bash
# Dépendances Node
npm install

# Initialiser le schéma DB
node src/database/init.js

# Résultat attendu:
# ✅ Database initialized successfully
```

### 6. Démarrer le serveur

```bash
npm run dev
```

Résultat attendu:
```
🚀 Server started on port 5000
environment: development
apiUrl: http://localhost:5000
frontendUrl: http://localhost:3000
```

## ✅ Vérification

### Test 1 : Health Check

```bash
curl http://localhost:5000/health

# Réponse:
# {"status":"ok","timestamp":"2026-05-02T...","db":"connected"}
```

### Test 2 : Inscription

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "username": "testuser"
  }'

# Réponse: 201 + user, profile, token
```

### Test 3 : Connexion

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'

# Sauvegardez le token retourné pour le prochain test
```

### Test 4 : Utilisateur actuel (avec token)

```bash
# Remplacer <TOKEN> par le token obtenu précédemment
curl http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <TOKEN>"

# Réponse: Utilisateur courant
```

## 🔍 Dépannage

### Erreur : Impossible de se connecter à PostgreSQL

**Cause** : PostgreSQL ne fonctionne pas ou n'est pas accessible

**Solution** :
```bash
# Windows
net start PostgreSQL15    # Démarrer service

# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Erreur : Database does not exist

**Cause** : La base n'a pas été créée

**Solution** :
```bash
psql -U postgres -c "CREATE DATABASE citoyenavise_dev;"
```

### Erreur : EXTENSION postgis does not exist

**Cause** : PostGIS n'est pas installé

**Solution (Windows)** :
- Télécharger StackBuilder (inclus dans PostgreSQL)
- Installer PostGIS

**Solution (macOS)** :
```bash
brew install postgis
# Puis réexécuter :
psql citoyenavise_dev -c "CREATE EXTENSION postgis;"
```

### Erreur : Port 5000 already in use

**Cause** : Un autre service utilise le port

**Solution** : Changer le PORT dans .env
```env
PORT=5001
```

### Erreur : JWT_SECRET not provided

**Cause** : .env non configuré

**Solution** :
```bash
# Générer secret secure
# Puis copier dans .env
JWT_SECRET=<secret_générée>
```

## 📚 Documentation

Après avoir réussi l'installation, consulter:

- `backend/README.md` — Documentation backend complète
- `_ai/10_guide_prompting.md` — Comment utiliser l'IA pour le projet
- `_ai/02_architecture_modules.md` — Architecture détaillée
- `_ai/40_journal_sessions/` — Journal d'implémentation

## 🎯 Prochaines étapes

### Court terme (cette semaine)
1. **Frontend pages** — Pages d'inscription, connexion, profil
2. **Intégration frontend-backend** — Appels API depuis JS
3. **Tests API** — Écrire tests Supertest

### Moyen terme (2-3 semaines)
4. **CMS contenu civique** — Migrer pages statiques
5. **Dashboard admin** — Modération posts
6. **Carte interactive** — Intégration Leaflet

### Long terme (4+ semaines)
7. **Notifications** — Email + in-app
8. **Pétitions** — Intégration Change.org
9. **Déploiement** — Docker + Heroku/Railway

## 💡 Tips

- Gardez un terminal ouvert pour `npm run dev` pendant le développement
- Utilisez une extension REST Client (VS Code) pour tester les routes : **REST Client** ou **Thunder Client**
- Les logs sont dans le terminal — cherchez les `[error]` ou `[warn]`
- PostgreSQL tourne en background — vous pouvez fermer la fenêtre de console

## 🆘 Support

Si vous rencontrez un problème:

1. Vérifiez le terminal de `npm run dev` pour les erreurs
2. Consultez le health check (`curl http://localhost:5000/health`)
3. Vérifiez la connexion DB : `psql citoyenavise_dev`
4. Consultez `_ai/40_journal_sessions/` pour le contexte technique
5. Demandez à Claude pour du débogage!

---

**Bon développement! 🚀**
