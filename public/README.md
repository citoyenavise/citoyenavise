# Frontend — Citoyen Avisé

Frontend MVP HTML/CSS/JavaScript vanilla pour la plateforme civique Citoyen Avisé.

## 🚀 Quick Start

### Sans serveur (fichiers statiques)
```bash
cd public

# Ouvrir index.html dans le navigateur
open index.html

# OU servir avec un serveur local simple
python -m http.server 3000
# Puis accéder à http://localhost:3000
```

### Avec serveur de développement (Node)
```bash
# À partir de la racine du projet
npm install -g http-server
http-server public -p 3000
```

## 📂 Structure

```
public/
├── index.html              # Point d'entrée principal
├── pages/
│   ├── index.html         # Accueil (carte interactive)
│   ├── login.html         # Connexion
│   ├── register.html      # Inscription
│   ├── profile.html       # Profil utilisateur
│   └── feed.html          # Fil d'actualité + création posts
├── js/
│   ├── app.js             # Router principal
│   ├── utils/
│   │   ├── api.js         # Client API
│   │   ├── store.js       # Gestion d'état
│   │   └── helpers.js     # Utilitaires
│   └── components/
│       └── header.js      # Header/Navigation
├── css/
│   ├── style.css          # Styles principaux
│   └── components.css     # Composants réutilisables
└── README.md              # Ce fichier
```

## 🔗 Routes

| Path | Description |
|------|-------------|
| `/` | Accueil avec carte interactive |
| `/login` | Page de connexion |
| `/register` | Page d'inscription |
| `/profile` | Mon profil (si connecté) |
| `/profiles/:id` | Profil d'un citoyen |
| `/feed` | Fil d'actualité + création posts |
| `/ideas` | Alias pour /feed |
| `/posts/create` | Créer un post (alias pour /feed) |

## 🔐 Authentification

L'authentification est gérée via JWT:

1. **Inscription** → Token reçu + sauvegardé dans localStorage (`ca_token`)
2. **Stockage** → Token + User + Profile dans localStorage
3. **Utilisation** → Token attaché à chaque requête API (`Authorization: Bearer <token>`)
4. **Logout** → Suppression token + state

## 🌐 Configuration API

Par défaut, le frontend pointe vers:
```
http://localhost:5000/api/v1
```

Pour changer, éditer `public/js/utils/api.js`:
```javascript
const api = new APIClient('https://api.votresomaine.com/api/v1');
```

## 🎨 Composants

### Boutons
```html
<button class="btn btn-primary">Primaire</button>
<button class="btn btn-secondary">Secondaire</button>
<button class="btn btn-danger">Danger</button>
<button class="btn btn-outline">Contour</button>
```

### Cartes
```html
<div class="card">
  <h3>Titre</h3>
  <p>Contenu</p>
</div>
```

### Formulaires
```html
<div class="form-group">
  <label for="email" class="form-label">Email</label>
  <input type="email" id="email" class="form-control" required>
  <div class="form-error" id="email-error"></div>
</div>
```

### Toasts (notifications)
```javascript
showToast('Message de succès', 'success');   // vert
showToast('Message d\'erreur', 'error');     // rouge
showToast('Attention', 'warning');            // jaune
showToast('Info', 'info');                    // bleu
```

## 📊 API Client

```javascript
// Auth
await api.auth.register(email, password, username);
await api.auth.login(email, password);
await api.auth.getMe();
await api.auth.logout();

// Profiles
await api.profiles.list(limit, page, search, region);
await api.profiles.get(id);
await api.profiles.follow(id);
await api.profiles.unfollow(id);

// Posts
await api.posts.list(limit, page, category, type);
await api.posts.create({ title, content, type, category });
await api.posts.like(id);
await api.posts.unlike(id);

// Map
await api.map.getNodes(bounds, region);
```

## 💾 State Management

```javascript
// Récupérer état
const state = store.getState();
const user = store.getUser();
const profile = store.getProfile();

// Mettre à jour
store.setUser(user, profile);
store.updateProfile(data);

// Écouter changements
const unsubscribe = store.subscribe(state => {
  console.log('État changé', state);
});

// Logout
store.clear();
```

## 🎯 Pages principales

### Accueil (`/`)
- Carte interactive Leaflet
- Liste des citoyens en ligne
- Filtres par région
- Recherche
- Nœuds GeoJSON du backend

### Authentification (`/login`, `/register`)
- Formulaires simples
- Validation client (email, password strength)
- Gestion erreurs
- Redirection après succès

### Profil (`/profile` ou `/profiles/:id`)
- Affichage infos utilisateur
- Édition profil (si proprio)
- Liste posts du citoyen
- Bouton Suivre (si autre)
- Stats (followers, posts)

### Fil (`/feed`)
- Création posts (si connecté)
- Sélection type: Idée, Question, Discussion, Proposition
- Choix catégorie
- Liste posts paginée
- Filtres par type
- Like/Unlike
- Pagination

## 🔒 Sécurité

- JWT dans localStorage (risque XSS minimal en vanilla JS)
- Pas de credentials en dur
- Validation côté client (serveur valide aussi)
- CORS géré par backend

Pour production:
- Utiliser HTTPS
- Considérer httpOnly cookies au lieu de localStorage
- CSP headers sur le serveur

## 📱 Responsive

Breakpoints:
- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

Les pages s'adaptent:
- Header mobile avec hamburger
- Carte + sidebar empilés en mobile
- Formulaires full-width

## 🧪 Tester localement

1. **Backend running** (`npm run dev` dans `/backend`)
2. **Frontend** :
   ```bash
   cd public
   python -m http.server 3000
   ```
3. **Accéder** : http://localhost:3000

4. **Test complet** :
   - Aller à `/register` et créer un compte
   - Vérifier token sauvegardé dans localStorage (DevTools > Application)
   - Aller à `/` et voir la carte
   - Créer un post dans `/feed`
   - Éditer profil

## 🐛 Dépannage

### "API not responding"
```javascript
// Vérifier URL API
console.log(api.baseURL);

// Backend doit être running sur http://localhost:5000
```

### "CORS error"
```
// Backend doit avoir CORS activé
// Vérifier CORS_ORIGIN dans .env du backend
CORS_ORIGIN=http://localhost:3000
```

### "Token pas sauvegardé"
```javascript
// Vérifier localStorage
console.log(localStorage.getItem('ca_token'));

// Vérifier que register/login retourne { token, user, profile }
```

### "Carte vide"
```
// Vérifier /map/nodes API
curl "http://localhost:5000/api/v1/map/nodes?bounds=-74,45,-73,46"

// Doivent y avoir des GeoJSON features
```

## 📚 Technologies

- **HTML5** : Structure
- **CSS3** : Styling (Variables CSS, Flexbox, Grid)
- **JavaScript ES6+** : Logique
- **Leaflet.js** : Carte interactive
- **LocalStorage** : Persistance

## 🚀 Déploiement

### Vercel / Netlify
```bash
# Juste pointer le dossier `public/` comme root
```

### Traditional Server
```bash
# Copier le contenu de `public/` sur le serveur
scp -r public/* user@server.com:/var/www/citoyenavise/
```

### Docker
```dockerfile
FROM nginx:alpine
COPY public/ /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📝 Notes

- Pas de framework (Vue, React) pour rester léger
- Single Page Application (SPA) simple
- Pas de bundler (Webpack) requis
- Fonctionne sur n'importe quel serveur HTTP
- ~15KB JS total (minified)

## 📞 Support

Pour les erreurs:
1. Vérifier console du navigateur (DevTools)
2. Vérifier networkTab pour requêtes API
3. Vérifier localStorage pour état
4. Relancer backend si besoin

---

**Bon développement! 🍁**
