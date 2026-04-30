# citoyenavise.org - Guide de gestion

## 📋 Structure du projet

```
citoyenavise/
├── _brouillons/                    # Ébauches et travaux en cours
│   ├── _corrections-en-attente/   # Corrections en révision
│   └── MODELE-CORRECTION.html     # Template à utiliser
├── _todo/                          # Liste des tâches (taches.md)
├── [pages HTML en production]
└── css/, js/                       # Ressources statiques
```

## 🔄 Flux de travail

### **1. Créer une nouvelle modification**
- Travaillez toujours sur la **branche `develop`**
- Créez ou modifiez vos fichiers normalement
- Les fichiers ébauches vont dans `_brouillons/`

### **2. Tester localement**
```bash
# Ouvrez simplement le fichier HTML dans votre navigateur
# Vérifiez que tout s'affiche correctement
```

### **3. Valider et publier**
- Une fois testée et validée, déplacez la modification prête
- Commitez vos changements : `git add . && git commit -m "description"`
- Mergez dans `main` : `git checkout main && git merge develop`
- **Le site se met à jour automatiquement** ✨

## 🌳 Branches Git

| Branche | Rôle | Déploiement |
|---------|------|------------|
| `develop` | Travail en cours, tests | Non (interne uniquement) |
| `main` | Version en production | ✅ Publié sur citoyenavise.org |

## 📝 Commandes utiles

```bash
# Voir la branche actuelle
git branch

# Basculer entre branches
git checkout develop    # Aller sur develop
git checkout main       # Aller sur main

# Sauvegarder vos modifications
git add .
git commit -m "Description claire de la modification"

# Envoyer vos changements
git push

# Fusionner develop dans main (quand prêt)
git checkout main
git merge develop
git push
```

## ✅ Checklist avant de publier

- [ ] Les modifications sont testées localement
- [ ] Le fichier est bien structuré (HTML valide)
- [ ] Les liens internes fonctionnent
- [ ] L'accessibilité est respectée
- [ ] Le contenu est relu

Une fois validé → mergez dans `main` et le site se met à jour !

## 🆘 Questions ?

Demandez simplement à Claude. Il gère tout le travail Git et d'organisation pour vous.
