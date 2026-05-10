# Page Pétitions - Frontend (PetitionsPage.jsx)

## 📋 Vue d'ensemble

Composant React complet pour afficher et filtrer les pétitions publiées avec pagination, recherche et filtres.

**Fichiers créés :**
- `frontend/src/pages/PetitionsPage.jsx` (composant)
- `frontend/src/styles/PetitionsPage.css` (styles)

---

## 🎯 Features

### ✅ Fonctionnalités

1. **Listing des pétitions**
   - Fetch GET `/api/v1/petitions?status=published`
   - Affichage en grille responsive (3 colonnes → 1 colonne)
   - Cartes avec : titre, description, créateur, élu, signatures

2. **Filtres**
   - Statut (Publiées, Fermées, Gagnées)
   - Recherche texte (titre + description)
   - Tri (Récentes, Populaires)
   - Bouton réinitialiser filtres

3. **Pagination**
   - Précédent / Suivant
   - Numéros de page avec ellipsis
   - Info : "Page X sur Y (total)"
   - Jump to page

4. **États**
   - Loading (spinner)
   - Error (message + bouton réessayer)
   - Empty (aucun résultat)
   - Success (grille de cartes)

5. **Navigation**
   - Links vers `/petitions/:id` (detail page)
   - Smooth scroll to top au changement de page

---

## 🔧 Structure du Composant

### State Management

```javascript
// Pétitions
const [petitions, setPetitions] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Filtres
const [filters, setFilters] = useState({
  status: 'published',
  elu_id: '',
  search: '',
  sort: 'created_at',
});

// Pagination
const [pagination, setPagination] = useState({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});
```

### useEffect Hook

```javascript
useEffect(() => {
  const fetchPetitions = async () => {
    // Construire query params
    const params = new URLSearchParams();
    params.append('page', pagination.page);
    params.append('limit', pagination.limit);
    params.append('status', filters.status);
    params.append('search', filters.search);
    params.append('sort', filters.sort);

    // Fetch API
    const response = await fetch(`/api/v1/petitions?${params}`);
    const data = await response.json();

    // Update state
    setPetitions(data.data);
    setPagination({...});
  };

  fetchPetitions();
}, [filters, pagination.page, pagination.limit]);
```

---

## 📱 UI Components

### Header
```jsx
<div className="petitions-header">
  <h1>Pétitions</h1>
  <p>Découvrez et signez les pétitions citoyennes</p>
</div>
```

### Filtres Section
```jsx
<div className="petitions-filters">
  {/* Search Input */}
  <input type="text" placeholder="Titre ou description..." />

  {/* Status Filter */}
  <select name="status">
    <option>Tous les statuts</option>
    <option>Publiées</option>
    <option>Fermées</option>
    <option>Gagnées</option>
  </select>

  {/* Sort Filter */}
  <select name="sort">
    <option>Récentes</option>
    <option>Populaires</option>
  </select>

  {/* Clear Button */}
  <button>Réinitialiser filtres</button>
</div>
```

### Petition Card
```jsx
<div className="petition-card">
  {/* Status Badge */}
  <div className="status-badge">Publiée</div>

  {/* Title */}
  <h2>Améliorer les transports publics</h2>

  {/* Description */}
  <p>Nous demandons une meilleure couverture...</p>

  {/* Creator & Target Elu */}
  <div className="creator-info">Par Jean Dupont</div>
  <div className="elu-info">Vers Marie Dubois</div>

  {/* Signature Count */}
  <div className="signatures-stat">
    ✍️ 150 signatures
  </div>
</div>
```

### Pagination Controls
```jsx
<div className="petitions-pagination">
  <button>← Précédent</button>
  <div>Page 2 sur 5 (42 pétitions)</div>
  <div className="page-numbers">
    <button>1</button>
    <button className="active">2</button>
    <button>3</button>
  </div>
  <button>Suivant →</button>
</div>
```

---

## 🎨 Styling

### CSS Classes

| Classe | Description |
|--------|-------------|
| `.petitions-page` | Container principal (background gradient) |
| `.petitions-filters` | Section filtres |
| `.filter-group` | Groupe de filtres |
| `.search-input` | Input recherche |
| `.filter-select` | Select dropdowns |
| `.petitions-grid` | Grille CSS (3 cols → 1 col responsive) |
| `.petition-card` | Carte pétition |
| `.status-badge` | Badge statut (4 couleurs) |
| `.card-body` | Contenu de la carte |
| `.card-footer` | Signature count |
| `.petitions-pagination` | Contrôles pagination |
| `.page-btn` | Bouton numéro page |
| `.petitions-loading` | Spinner loading |
| `.petitions-error` | Message erreur |
| `.petitions-empty` | État vide |

### Colors

```css
/* Primary */
--primary: #0066cc;
--primary-dark: #0052a3;

/* Status Colors */
--status-published: #e3f2fd (blue)
--status-closed: #f3e5f5 (purple)
--status-won: #e8f5e9 (green)
--status-draft: #fff3e0 (orange)

/* Text */
--text-primary: #1a3a52;
--text-secondary: #666;
--text-tertiary: #999;

/* Backgrounds */
--bg-light: #f9f9f9;
--bg-lighter: #f5f7fa;
```

### Responsive Breakpoints

```css
/* Desktop */
grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));

/* Tablet (768px) */
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));

/* Mobile (480px) */
grid-template-columns: 1fr;
```

### Animations

- `fadeInDown`: Header (0.6s)
- `fadeInUp`: Filtres, grille, pagination (0.6s)
- `spin`: Spinner loading (1s infinite)
- `hover`: Scale on card hover, color change on button

---

## 🔄 User Interactions

### Filtrer par statut
```javascript
handleFilterChange = (e) => {
  setFilters(prev => ({
    ...prev,
    [e.target.name]: e.target.value
  }));
  setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
}
```

### Rechercher
```javascript
handleSearchChange = (e) => {
  setFilters(prev => ({
    ...prev,
    search: e.target.value
  }));
  setPagination(prev => ({ ...prev, page: 1 }));
}
```

### Changer de page
```javascript
handleNextPage = () => {
  if (pagination.page < pagination.totalPages) {
    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
```

### Aller à une page spécifique
```javascript
handleGoToPage = (pageNum) => {
  if (pageNum >= 1 && pageNum <= pagination.totalPages) {
    setPagination(prev => ({ ...prev, page: pageNum }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
```

---

## 📡 API Integration

### Endpoint
```
GET /api/v1/petitions
```

### Query Parameters
```javascript
{
  status: 'published',      // filter
  search: 'éducation',      // search text
  sort: 'created_at',       // sort field
  page: 1,                  // pagination
  limit: 10                 // pagination
}
```

### Response Structure
```javascript
{
  success: true,
  data: [
    {
      id: 123,
      titre: 'Améliorer les transports publics',
      description: 'Nous demandons...',
      status: 'published',
      signaturesCount: 150,
      createdAt: '2026-05-10T12:00:00Z',
      updatedAt: '2026-05-10T12:00:00Z',
      creator: {
        id: 456,
        email: 'user@example.com',
        nomComplet: 'Jean Dupont'
      },
      elu: {
        id: 789,
        nom: 'Marie Dubois',
        titre: 'Députée',
        region: 'Québec'
      }
    }
  ],
  page: 1,
  limit: 10,
  total: 42,
  totalPages: 5
}
```

---

## ⚠️ Error Handling

### Try-Catch
```javascript
try {
  const response = await fetch(`/api/v1/petitions?...`);
  
  if (!response.ok) {
    throw new Error(`Erreur ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  setPetitions(data.data);
} catch (err) {
  setError(err.message);
}
```

### Error UI
```jsx
{error && !loading && (
  <div className="petitions-error">
    <h3>Erreur</h3>
    <p>{error}</p>
    <button onClick={() => window.location.reload()}>Réessayer</button>
  </div>
)}
```

---

## 🔗 Navigation

### Link to Detail Page
```jsx
<Link to={`/petitions/${petition.id}`}>
  <div className="petition-card">
    {/* Card content */}
  </div>
</Link>
```

### Expected Route
```javascript
// Dans App.jsx ou Router
<Route path="/petitions/:id" element={<PetitionDetailPage />} />
```

---

## 📋 Props & Hooks

### Hooks Used
- `useState` : État pétitions, filtres, pagination, loading, error
- `useEffect` : Fetch pétitions au montage et changement de filtres
- `useRef` : (optionnel) Ref pour scroll to top

### Pas de Props
Composant standalone, pas de props d'entrée.
État entièrement géré en local.

---

## 🚀 Usage

### Import dans App.jsx
```javascript
import PetitionsPage from './pages/PetitionsPage';

function App() {
  return (
    <Routes>
      <Route path="/petitions" element={<PetitionsPage />} />
    </Routes>
  );
}
```

### Affichage
```
http://localhost:3000/petitions
http://localhost:3000/petitions?search=éducation
http://localhost:3000/petitions?status=closed&sort=signatures_count
```

---

## ✅ Checklist Implémentation

- [x] Composant React avec hooks
- [x] useEffect pour fetch API
- [x] useState pour filters et pagination
- [x] Grille responsive de cartes
- [x] Cartes avec : titre, description, creator, elu, signatures
- [x] Filtres : status, search, sort
- [x] Pagination : prev/next, page numbers, jump
- [x] Loading state (spinner)
- [x] Error state (message + retry)
- [x] Empty state (no results)
- [x] Links to `/petitions/:id`
- [x] Smooth scroll to top
- [x] CSS complet et responsive
- [x] Animations (fade, hover, spin)
- [x] Accessibility (labels, alt text)
- [x] Mobile-first responsive design
- [x] Performance optimized (proper re-renders)

---

## 📊 Browser Support

- Chrome/Edge : ✅ Full support
- Firefox : ✅ Full support
- Safari : ✅ Full support
- Mobile : ✅ Responsive design
- IE11 : ❌ Not supported (CSS Grid, modern JS)

---

## 🔧 Future Enhancements

1. Ajouter endpoint GET `/api/v1/elus` pour filtrer par élu (dropdown)
2. Trier les pétitions les plus populaires en top
3. Ajouter favorite/bookmark de pétitions
4. Afficher les pétitions "Gagnées" en top
5. Intégrer des statistiques globales en top (total signatures, etc.)
6. Export liste pétitions (CSV, PDF)
7. Share pétition sur réseaux sociaux

