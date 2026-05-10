# 🌍 Système de Routing i18n - App.jsx

**Routing avec paramètre de langue intégré à React Router**

---

## 🏗️ Architecture

### Avant (sans i18n)
```
/
├── /login
├── /register
├── /petitions
├── /petitions/:id
├── /elus
├── /elus/:id
└── /feed
```

### Après (avec i18n)
```
/
├── /fr           ← Défaut (FR)
├── /en           ← Anglais
├── /login        ← Global (pas de langue)
├── /register     ← Global (pas de langue)
├── /fr/petitions
├── /fr/petitions/:id
├── /en/petitions
├── /en/petitions/:id
├── /fr/elus
├── /fr/elus/:id
└── /en/elus
```

---

## 🔧 Composant LanguageWrapper

```jsx
const LanguageWrapper = () => {
  const { lang } = useParams()      // Extraire lang de l'URL
  const { i18n } = useTranslation()

  useEffect(() => {
    if (lang === 'fr' || lang === 'en') {
      i18n.changeLanguage(lang)       // Changer la langue
      localStorage.setItem('language', lang)  // Persister
    }
  }, [lang, i18n])

  return <Outlet />  // Rendre les routes imbriquées
}
```

**Rôle** :
1. Lit le paramètre `lang` depuis l'URL
2. Valide que c'est `fr` ou `en`
3. Change la langue i18next
4. Sauvegarde dans localStorage
5. Re-render des composants enfants

---

## 🗺️ Routes imbriquées

```jsx
<Route path="/:lang" element={<LanguageWrapper />}>
  <Route index element={<Home />} />
  <Route path="petitions" element={<PetitionsListPage />} />
  <Route path="petitions/:id" element={<PetitionDetailPage />} />
  {/* ... autres routes ... */}
</Route>
```

**Comportement** :
- `/:lang` → `LanguageWrapper` intercepts la demande
- `/:lang/petitions` → `PetitionsListPage` rendu avec la langue
- `/:lang/petitions/123` → `PetitionDetailPage` avec ID 123

---

## 📍 URLs valides

| URL | Langue | Page |
|-----|--------|------|
| `/fr` | Français | Home |
| `/en` | Anglais | Home |
| `/fr/petitions` | Français | Pétitions |
| `/en/petitions` | Anglais | Pétitions |
| `/fr/petitions/123` | Français | Détail pétition 123 |
| `/fr/elus` | Français | Élus |
| `/en/elus` | Anglais | Élus |
| `/fr/elus/42` | Français | Détail élu 42 |
| `/fr/feed` | Français | Feed (protégé) |
| `/login` | - | Login (global) |
| `/register` | - | Register (global) |

---

## 🔄 Flux utilisateur

### Scénario 1: Accès à la racine
```
Utilisateur visite: /
↓
Route "/" redirige à: /fr (défaut)
↓
LanguageWrapper définit langue: fr
↓
Home.jsx charge avec t('home.title') en français
```

### Scénario 2: Changement de langue
```
Utilisateur clique: [EN]
↓
LanguageSelector: i18n.changeLanguage('en')
↓
LanguageSelector: navigate('/en' + currentPath)
↓
LanguageWrapper détecte lang=en
↓
Tous les composants se re-rendent en anglais
```

### Scénario 3: URL directe
```
Utilisateur accède: /en/petitions/123
↓
LanguageWrapper lit lang='en'
↓
i18n.changeLanguage('en')
↓
PetitionDetailPage charge avec traductions EN
↓
Détail de pétition affichée en anglais
```

---

## 🔌 Intégration avec LanguageSelector

Modifier `src/components/LanguageSelector.jsx` :

```jsx
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams();
  const currentPath = location.pathname;

  const handleLanguageChange = (newLang) => {
    // Remplacer la langue dans le chemin
    const newPath = currentPath.replace(`/${lang}`, `/${newLang}`);
    navigate(newPath || `/${newLang}`);
  };

  return (
    <div className="language-selector">
      <button
        className={i18n.language === 'fr' ? 'active' : ''}
        onClick={() => handleLanguageChange('fr')}
      >
        FR
      </button>
      <button
        className={i18n.language === 'en' ? 'active' : ''}
        onClick={() => handleLanguageChange('en')}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSelector;
```

---

## ✨ Avantages

✅ **Langue dans l'URL** — Partageables : `/fr/petitions/123`  
✅ **Historique du navigateur** — Back/Forward changent la langue  
✅ **Bookmarks** — La langue est préservée  
✅ **SEO** — Meilleur pour les moteurs de recherche  
✅ **Partage de liens** — Les amis ouvrent dans la bonne langue  
✅ **Persistance** — localStorage + localStorage pour continuité  

---

## 🧪 Tests

### Test 1: Navigation de base
```javascript
// Aller à /fr/petitions
// ✅ La langue FR doit être active
// ✅ Textes en français
// ✅ i18n.language === 'fr'
```

### Test 2: Changement de langue
```javascript
// Aller à /fr/petitions
// Cliquer sur [EN]
// ✅ URL devient /en/petitions
// ✅ Textes changent en anglais
// ✅ LanguageSelector affiche EN actif
```

### Test 3: Accès direct
```javascript
// Accéder directement à /en/elus/42
// ✅ Langue EN activée
// ✅ Contenu en anglais
// ✅ localStorage['language'] === 'en'
```

### Test 4: Redirection
```javascript
// Accéder à /
// ✅ Redirige automatique vers /fr
// ✅ Ou la langue du localStorage
```

---

## 🚨 Cas particuliers

### Routes globales (sans langue)
```
/login       ← Ne change pas selon la langue
/register    ← Mais utilise i18next globalement
```

Pourquoi ? L'authentification est globale, la langue change après le login.

### Pages protégées
```
/fr/feed            ← ProtectedRoute + LanguageWrapper
/fr/notifications   ← Combinaison de contrôles
```

L'ordre : `ProtectedRoute` → `LanguageWrapper` → Page

---

## 📝 Checklist

- [x] App.jsx modifié avec LanguageWrapper
- [x] Routes imbriquées avec `/:lang`
- [ ] LanguageSelector mis à jour pour navigate
- [ ] Home.jsx testé en /fr et /en
- [ ] Autres pages migrées vers i18n
- [ ] Navigation testée (back/forward)
- [ ] Bookmarks testés (langue préservée)
- [ ] localStorage testé

---

**Routing i18n prêt ! 🚀**
