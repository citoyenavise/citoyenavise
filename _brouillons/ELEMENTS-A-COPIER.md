# Éléments à copier pour compléter une correction

Quand vous créez une page, certains éléments sont identiques sur toutes les pages. Voici où les trouver.

## 🔗 Navigation complète

Copiez la section `<nav>` entière depuis **`a-propos.html`** (lignes 20-47)
- Inclut tous les liens du menu
- Menu mobile responsive
- Dropdown "Ressources"

## 📄 Pied de page

Copiez la section `<footer>` depuis n'importe quelle page (cherchez `class="pied-de-page"`)
- Contient les liens légaux
- Année de copyright (mettez à jour si nécessaire)

## 🛠️ Éléments CSS recommandés

### **Pour un titre avec sous-titre :**
```html
<section class="section">
  <div class="conteneur">
    <h2>Mon titre</h2>
    <div class="separateur separateur-g"></div>
    <p class="lead">Mon sous-titre ou description</p>
  </div>
</section>
```

### **Pour une grille 2 colonnes :**
```html
<div class="grille-2" style="gap:40px;">
  <div class="carte fade-in">
    <span class="carte-icone">📌</span>
    <h3>Titre</h3>
    <p>Contenu</p>
  </div>
  <div class="carte fade-in">
    <!-- ... -->
  </div>
</div>
```

### **Pour des tags colorés :**
```html
<span class="tag-rouge">Important</span>
<span class="tag-bleu">Info</span>
```

## 📋 Checklist avant de finaliser

- [ ] Titre et description meta (SEO)
- [ ] Lien canonical correct
- [ ] H1 unique et clair
- [ ] Navigation complète
- [ ] Liens internes valides
- [ ] Emojis/icônes cohérents
- [ ] Texte relu
- [ ] Responsive (testez sur mobile)
- [ ] Pied de page inclus

## 💡 Exemple complet

Consultez **`a-propos.html`** pour voir une page complète et bien structurée !
