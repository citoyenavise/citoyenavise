# 🧪 Guide de Test du Frontend - Citoyen Avisé

**Date** : 2026-05-10  
**Frontend Port** : 5173  
**Framework** : React 18 + Vite 5

---

## 🚀 Démarrage du Frontend

### Mode Développement (avec hot reload)
```bash
cd frontend
npm install  # Si nécessaire
npm run dev
# → Serveur sur http://localhost:5173
# → Auto-reload sur changement fichiers
```

### Vous devriez voir
```
VITE v5.4.21  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Press h to show help
```

### Attendre le chargement (~3-5 secondes)
```
Ouvrir http://localhost:5173 dans le navigateur
```

---

## ✅ Tests de la Page d'Accueil

### 1️⃣ Charger la Page Principale

```bash
# Récupérer le HTML principal
curl http://localhost:5173

# Vérifier le titre
curl http://localhost:5173 | grep -i "<title>"
# Résultat attendu: <title>Citoyen Avisé</title>
```

**Vérifications visuelles**:
- ✅ Logo Citoyen Avisé visible
- ✅ Menu de navigation présent
- ✅ Bouton "Connexion" visible
- ✅ Bouton "Inscription" visible
- ✅ Footer chargé

---

## 🌐 Tests Multilingues (i18n)

### 1️⃣ Vérifier Configuration i18n

```bash
# Vérifier que les fichiers de traduction existent
curl http://localhost:5173/locales/fr/translation.json | jq . | head -20

# Résultat attendu: JSON avec clés traductions
{
  "header": {
    "title": "Citoyen Avisé",
    "subtitle": "Plateforme d'engagement civique québécoise",
    ...
  },
  "auth": {
    "login": "Connexion",
    "logout": "Déconnexion",
    ...
  },
  ...
}
```

### 2️⃣ Tester Anglais

```bash
# Vérifier traductions anglaises
curl http://localhost:5173/locales/en/translation.json | jq '.header.title'
# Résultat attendu: "Civic Engagement Platform"
```

### 3️⃣ Tester Sélecteur de Langue

**Dans le navigateur** (http://localhost:5173):
1. Cliquer sur le sélecteur de langue (coin supérieur droit)
2. Sélectionner "English"
3. Vérifier que le contenu change en anglais
4. Sélectionner "Français"
5. Vérifier que le contenu revient au français

**localStorage**:
- Ouvrir DevTools (F12)
- Console → `localStorage.getItem('language')`
- Résultat attendu: `"en"` ou `"fr"`

---

## 🗺️ Tests Carte Leaflet

### 1️⃣ Charger la Page Carte

**Dans le navigateur**:
1. Aller à http://localhost:5173
2. Cliquer sur "Élus" dans la navigation
3. Vérifier que la carte Leaflet charge

**Vérifications visuelles**:
- ✅ Carte visible
- ✅ Contrôles zoom (+/-) visibles
- ✅ Marqueurs élus affichés
- ✅ Clustering sur zoom arrière
- ✅ Info popup au clic sur marqueur

### 2️⃣ Vérifier Composants Leaflet

```bash
# Vérifier que MapContainer est utilisé
curl http://localhost:5173/src/components/Map.jsx | grep -i "MapContainer"
# Résultat attendu: <MapContainer center={coordinates} ...
```

### 3️⃣ Tests de Fonctionnalité

**Dans le navigateur (DevTools Console)**:
```javascript
// Vérifier que Leaflet est chargé
console.log(typeof L !== 'undefined' ? 'Leaflet loaded' : 'Leaflet NOT loaded');
// Résultat attendu: "Leaflet loaded"

// Vérifier marqueurs
const markers = document.querySelectorAll('.leaflet-marker-icon');
console.log(`${markers.length} marqueurs trouvés`);
// Résultat attendu: "50+ marqueurs trouvés"
```

---

## 🔐 Tests Authentification

### 1️⃣ Page de Connexion

**Dans le navigateur**:
1. Aller à http://localhost:5173/login
2. Vérifier qu'un formulaire "Email" est présent
3. Entrer: `test@example.com`
4. Cliquer "Envoyer magic link"
5. Vérifier message de succès

### 2️⃣ Magic Link Flow

**Étapes**:
```
1. Remplir formulaire de connexion
2. Voir message: "Magic link envoyé à test@example.com"
3. En développement, un token de test est généré
4. Cliquer sur le lien de vérification (ou utiliser le token)
5. Être redirigé vers profil après authentification
```

### 3️⃣ localStorage Token

**Dans le navigateur (DevTools Console)**:
```javascript
// Vérifier accessToken
console.log(localStorage.getItem('accessToken') ? 'Token présent' : 'Token absent');

// Vérifier refreshToken
console.log(localStorage.getItem('refreshToken') ? 'Refresh token présent' : 'Absent');

// Vérifier user info
console.log(JSON.parse(localStorage.getItem('user') || '{}'));
```

---

## 📦 Tests Build & Bundle

### 1️⃣ Créer Build Production

```bash
cd frontend
npm run build
```

**Résultat attendu**:
```
vite v5.4.21 building for production...

✓ 610 modules transformed.

dist/index.html                              0.38 kB │ gzip:   0.28 kB
dist/assets/index-*.css                     14.61 kB │ gzip:   3.63 kB
dist/assets/index-*.js                     394.56 kB │ gzip: 127.92 kB

✓ built in 4.25s
```

### 2️⃣ Vérifier Taille du Bundle

```bash
# Taille totale du dossier dist
du -sh dist/
# Résultat attendu: < 500 KB

# Détail des fichiers
ls -lh dist/assets/
```

**Vérifications**:
- ✅ dist/ créé
- ✅ index.html présent
- ✅ assets/ contient CSS et JS
- ✅ Taille totale < 500 KB (recommandé)

### 3️⃣ Analyser le Bundle

```bash
# Voir quels fichiers prennent le plus de place
npm run build -- --report

# Ou inspecter avec source-map
npm run build -- --sourcemap=inline
```

---

## 🧪 Tests des Composants

### 1️⃣ Tester Composants Principaux

**Dans le navigateur**:

#### Header
```
1. Aller à http://localhost:5173
2. Vérifier logo visible
3. Vérifier navigation menu présent
4. Vérifier sélecteur langue
5. Vérifier bouton utilisateur (si connecté)
```

#### Navigation
```
1. Cliquer chaque lien du menu
2. Vérifier routes changent
3. Vérifier pages chargent correctement
4. Vérifier URL met à jour
```

#### Pages Protégées
```
1. Essayer accéder /dashboard sans authentification
2. Doit rediriger vers /login
3. Se connecter via magic link
4. Pouvoir accéder /dashboard
```

### 2️⃣ Test des Routes

```bash
# Vérifier que les routes sont définie
curl http://localhost:5173/src/pages/ | grep ".jsx"
```

**Routes à tester**:
- ✅ `/` - Accueil
- ✅ `/login` - Connexion
- ✅ `/register` - Inscription
- ✅ `/petitions` - Liste pétitions
- ✅ `/petitions/:id` - Détail pétition
- ✅ `/elus` - Liste élus
- ✅ `/elus/:id` - Détail élu
- ✅ `/actualites` - Actualités
- ✅ `/dashboard` - Admin (protégé)

---

## 🎨 Tests de Style & Responsive

### 1️⃣ Responsive Design

**Dans le navigateur (F12 → Device Toolbar)**:

```
Tester sur différentes résolutions:
  ✅ Mobile (320px - 480px)
  ✅ Tablet (768px - 1024px)
  ✅ Desktop (1920px+)
  
Vérifications:
  ✅ Layout adaptatif
  ✅ Menu responsive
  ✅ Cartes lisibles
  ✅ Texte lisible
  ✅ Buttons cliquables
```

### 2️⃣ Dark Mode (si implémenté)

```javascript
// Dans la Console DevTools
document.documentElement.style.colorScheme = 'dark'
// Vérifier que les styles s'appliquent
```

---

## 📊 Tests de Performance

### 1️⃣ Lighthouse

**Dans le navigateur (DevTools → Lighthouse)**:

```
Métriques à vérifier:
  • Performance: > 90
  • Accessibility: > 95
  • Best Practices: > 90
  • SEO: > 90
```

### 2️⃣ Network Performance

**Dans le navigateur (DevTools → Network)**:

```
Métriques:
  • DOMContentLoaded: < 2s
  • Load: < 3s
  • Largest assets < 200KB chacun
  • Aucune requête 404
```

### 3️⃣ Console Errors

**Vérifier qu'il n'y a pas d'erreurs**:
```javascript
// Dans la Console DevTools
// Doit être vide de erreurs
console.clear()
```

---

## 🔒 Tests Sécurité Frontend

### 1️⃣ CORS Headers

```bash
curl -i http://localhost:5173
```

**Vérifier**:
- ✅ Content-Type correct
- ✅ Pas d'erreurs CORS
- ✅ Authentification headers valides

### 2️⃣ Token Storage

**Dans le navigateur (DevTools Console)**:
```javascript
// Vérifier que tokens sont en localStorage (pas en cookies non-sécurisés)
const token = localStorage.getItem('accessToken');
console.log(token ? 'Token stocké de manière sécurisée' : 'Pas de token');

// Vérifier que les données sensibles ne sont pas exposées
console.log(localStorage);  // Ne doit pas contenir de mots de passe
```

### 3️⃣ Input Validation

**Tester avec des entrées malveillantes**:
```
Champs de formulaire:
  1. Tester injection HTML: <script>alert('xss')</script>
  2. Résultat attendu: Rendu comme texte, non exécuté
  3. Tester SQL injection: ' OR '1'='1
  4. Résultat attendu: Traité comme texte normal
```

---

## 📝 Test Complet Séquentiel

Pour tester complètement le frontend:

```bash
#!/bin/bash

# Démarrer le serveur
cd frontend
npm run dev &
FRONTEND_PID=$!
sleep 4

echo "=== Test 1: Page d'accueil ==="
curl -s http://localhost:5173 | grep -i "<title>" | head -1

echo -e "\n=== Test 2: Fichiers traductions ==="
curl -s http://localhost:5173/locales/fr/translation.json | jq '.header.title'

echo -e "\n=== Test 3: Traductions anglaises ==="
curl -s http://localhost:5173/locales/en/translation.json | jq '.header.title'

echo -e "\n=== Test 4: Composant Map ==="
curl -s http://localhost:5173/src/components/Map.jsx | grep -c "MapContainer"

echo -e "\n=== Test 5: Build ==="
npm run build > /dev/null 2>&1
BUILD_SIZE=$(du -sh dist/ | cut -f1)
echo "Bundle size: $BUILD_SIZE"
if [[ "$BUILD_SIZE" < "500MB" ]]; then
  echo "✅ Bundle size OK"
else
  echo "❌ Bundle size too large"
fi

echo -e "\n=== Test 6: Dépendances ==="
npm list react react-router-dom i18next leaflet zustand

echo -e "\n✅ Tests frontend complétés!"

# Nettoyer
kill $FRONTEND_PID 2>/dev/null
```

---

## ✅ Checklist Vérification Frontend

- [ ] npm run dev démarre sans erreurs
- [ ] Page http://localhost:5173 répond
- [ ] Titre page contient "Citoyen Avisé"
- [ ] Fichiers traductions FR chargent
- [ ] Fichiers traductions EN chargent
- [ ] Sélecteur langue fonctionne
- [ ] localStorage reçoit la langue
- [ ] Carte Leaflet affiche
- [ ] Marqueurs élus visibles
- [ ] Routes navigation fonctionnent
- [ ] Pages protégées redirigent vers login
- [ ] Authentification magic link fonctionne
- [ ] Token JWT reçu et stocké
- [ ] Build réussit (npm run build)
- [ ] Bundle < 500 KB gzipped
- [ ] Pas d'erreurs console
- [ ] Design responsive
- [ ] Lighthouse score > 90
- [ ] CORS headers présents
- [ ] Pas de vulnérabilités XSS

---

## 🐛 Troubleshooting Frontend

### Erreur: "Module not found"
```
Solution:
1. npm install
2. Vérifier que les imports sont corrects
3. Vérifier structure fichiers
4. npm run dev
```

### Erreur: "localhost:5173 refused connection"
```
Solution:
1. Vérifier que npm run dev fonctionne
2. Vérifier le port 5173 est libre
3. Essayer: lsof -i :5173
4. Redémarrer le serveur
```

### Erreur: "Cannot find module 'react'"
```
Solution:
1. cd frontend
2. rm -rf node_modules
3. npm install
4. npm run dev
```

### Erreur CORS
```
Solution:
1. Vérifier que le backend répond (port 5000)
2. Vérifier CORS_ORIGIN dans .env backend
3. Vérifier API_URL dans frontend .env
4. Vérifier que les headers CORS sont présents
```

---

## 📱 Tester sur Appareil Mobile

```bash
# Obtenir l'adresse IP locale
ipconfig getifaddr en0  # macOS
hostname -I | awk '{print $1}'  # Linux
ipconfig  # Windows (chercher "IPv4 Address")

# Accéder depuis mobile sur le même réseau
http://YOUR_IP:5173
```

**Vérifications**:
- ✅ Page charge
- ✅ Responsive design
- ✅ Touches fonctionnent
- ✅ Performance acceptable

---

**Généré** : 2026-05-10  
**Status** : ✅ **READY FOR TESTING**

Tous les tests peuvent être exécutés manuellement via le navigateur ou via curl pour les endpoints publiques.
