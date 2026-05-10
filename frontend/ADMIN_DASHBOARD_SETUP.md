# 👑 Admin Dashboard Setup Guide

## Installation

Le dashboard administrateur est un composant React protégé pour gérer les promesses électorales.

### Fichiers Créés

```
✅ src/pages/AdminDashboard.jsx
   └─ Composant principal du dashboard
   
✅ src/styles/AdminDashboard.css
   └─ Stylisation complète
   
✅ src/components/ProtectedAdminRoute.jsx
   └─ Route protégée (admin only)
```

---

## Configuration du Routeur

### Dans `src/App.jsx` (ou votre fichier d'routing principal)

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route path="/" element={<Home />} />
        <Route path="/petitions" element={<PetitionsList />} />
        
        {/* Routes protégées */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } 
        />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## Authentification Requise

Le dashboard utilise `useAuthStore()` pour vérifier l'authentification et le rôle admin.

### Vérifier que votre Zustand store a :

```javascript
// src/stores/auth.js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,           // { id, email, role: 'admin' }
  token: null,          // JWT token
  
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null }),
}));
```

---

## Fonctionnalités

### 1️⃣ Stats Globales
- Total de citoyens
- Total de pétitions
- Total de promesses
- Total de signatures
- Promesses par statut (engagée, en cours, complétée, abandonnée)

### 2️⃣ Créer une Promesse
```
POST /api/v1/elus/:eluId/promises
{
  "titre": "Investir dans l'éducation",
  "description": "100M$ pour les écoles",
  "deadline": "2027-12-31",
  "status": "engagee"
}
```

### 3️⃣ Éditer une Promesse
```
PUT /api/v1/promises/:id
{
  "titre": "Investir 150M$ dans l'éducation",
  "description": "Augmentation du budget",
  "deadline": "2028-12-31",
  "status": "en_cours"
}
```

### 4️⃣ Changer le Statut
```
PUT /api/v1/promises/:id/status
{
  "status": "completee"
}
```

### 5️⃣ Supprimer une Promesse
```
DELETE /api/v1/promises/:id
```

---

## Navigation

### Ajouter un lien dans le header/menu pour accéder au dashboard :

```jsx
// Dans votre composant Header ou NavBar
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

export function Header() {
  const user = useAuthStore(s => s.user);
  
  return (
    <header>
      <nav>
        <Link to="/">Accueil</Link>
        {user?.role === 'admin' && (
          <Link to="/admin/dashboard">👑 Admin Dashboard</Link>
        )}
      </nav>
    </header>
  );
}
```

---

## Fonctionnement Détaillé

### Flow Créer Promesse

1. **Remplir le formulaire** :
   - Sélectionner un élu
   - Entrer le titre
   - Entrer la description (optionnel)
   - Choisir une échéance (optionnel)
   - Choisir le statut initial

2. **Soumettre** :
   - Click "➕ Créer"
   - POST vers `/api/v1/elus/{eluId}/promises`

3. **Succès** :
   - Alerte "Promesse créée avec succès"
   - Liste rechargée
   - Formulaire réinitialisé

4. **Erreur** :
   - Message d'erreur affiché
   - Données conservées pour retry

### Flow Éditer Promesse

1. **Cliquer sur ✏️** (bouton Edit) :
   - Modal s'ouvre
   - Formulaire pré-rempli

2. **Modifier les champs** :
   - Titre, description, échéance, statut

3. **Cliquer "✅ Enregistrer"** :
   - PUT vers `/api/v1/promises/{id}`

4. **Succès** :
   - Alerte "Promesse mise à jour avec succès"
   - Modal ferme
   - Liste rechargée

### Flow Changer le Statut

1. **Dropdown de statut dans la table** :
   - Sélectionner nouveau statut

2. **Changement automatique** :
   - PUT vers `/api/v1/promises/{id}/status`
   - Aucun refresh requis (mis à jour en direct)

### Flow Supprimer une Promesse

1. **Cliquer sur 🗑️** (bouton Delete) :
   - Confirmation popup

2. **Confirmer** :
   - DELETE vers `/api/v1/promises/{id}`

3. **Succès** :
   - Alerte "Promesse supprimée avec succès"
   - Liste rechargée

---

## Styling

Le dashboard utilise un design moderne avec :

✅ **Gradient backgrounds** pour sections
✅ **Cards avec ombre** pour stats
✅ **Responsive grid** pour tous les appareils
✅ **Hover effects** sur boutons
✅ **Status badges colorés** (engagée=orange, en_cours=bleu, etc.)
✅ **Modal moderne** pour édition
✅ **Form validation** côté client

### Couleurs

```css
Primaire (Indigo) : #6366f1
Texte foncé : #1e293b
Texte clair : #64748b
Succès (vert) : #10b981
Erreur (rouge) : #ef4444
Avertissement (orange) : #f59e0b
Info (bleu) : #3b82f6
```

---

## Protection & Sécurité

### Protection Admin

```javascript
// Dans AdminDashboard.jsx
useEffect(() => {
  if (!user || user.role !== 'admin') {
    navigate('/');
  }
}, [user, navigate]);
```

Le composant :
1. Vérifie que user existe
2. Vérifie que user.role === 'admin'
3. Redirige vers "/" si pas admin

### Tokens d'Authentification

Tous les appels API incluent le header :
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

---

## Responsive Design

Le dashboard fonctionne sur :

📱 **Mobile** (< 768px)
- Grid stats : 2 colonnes
- Table : scrollable horizontalement
- Form : simple colonne
- Modal : 95% de largeur

💻 **Desktop** (> 768px)
- Grid stats : 4 colonnes
- Table : full width
- Form : 2 colonnes (deadline + status)
- Modal : max 500px

---

## Intégration API Backend

### Endpoints Utilisés

#### Stats
```
GET /api/v1/admin/stats
Header: Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "users": { "total": 256, "admins": 3 },
    "platform": { "totalMissions": 12, ... }
  }
}
```

#### Lister Élus
```
GET /api/v1/elus?limit=100
```

#### Lister Promesses
```
GET /api/v1/promises?limit=100
```

#### Créer Promesse
```
POST /api/v1/elus/{eluId}/promises
Header: Authorization: Bearer {token}
Body: { titre, description, deadline, status }
```

#### Éditer Promesse
```
PUT /api/v1/promises/{id}
Header: Authorization: Bearer {token}
Body: { titre, description, deadline, status }
```

#### Changer Statut
```
PUT /api/v1/promises/{id}/status
Header: Authorization: Bearer {token}
Body: { status }
```

#### Supprimer Promesse
```
DELETE /api/v1/promises/{id}
Header: Authorization: Bearer {token}
```

---

## Troubleshooting

### "Vous n'avez pas les droits d'accès"

→ Vérifier que l'utilisateur connecté a `role: 'admin'` en base de données

```bash
# Backend - promouvoir un admin
npm run promote:admin -- user@example.com
```

### Erreur "Token expiré"

→ Déconnexion/reconnexion requise (token JWT expiré)

### Formulaire ne se soumet pas

→ Vérifier :
- Le champ Élu est sélectionné
- Le champ Titre n'est pas vide
- La date est au format YYYY-MM-DD

### Modal n'apparaît pas à l'édition

→ Vérifier que `showModal && isEditMode` sont tous deux true

---

## Améliorations Futures

- [ ] Pagination pour la liste de promesses
- [ ] Filtres (par statut, par élu, par date)
- [ ] Tri (par titre, par élu, par date)
- [ ] Import/Export CSV
- [ ] Bulk actions (éditer plusieurs d'un coup)
- [ ] Historique des modifications
- [ ] Notifications en temps réel
- [ ] Graphiques de statut

---

## Support

- **Composant** : `src/pages/AdminDashboard.jsx`
- **Styles** : `src/styles/AdminDashboard.css`
- **Protection** : `src/components/ProtectedAdminRoute.jsx`
- **API** : `/api/v1/promises`, `/api/v1/admin/stats`

---

**Dashboard Administrateur — Ready for Production! 👑**
