"""
Harmonise le footer sur toutes les pages HTML françaises (hors /en/).
Corrections:
  1. Lien Conditions d'utilisation → conditions-utilisation.html
  2. Lien Accessibilité → accessibilite.html
  3. Copyright 2025 → 2026 + texte OSBL corrigé
  4. Supprime le nav-dropdown parasite dans le footer Organisation
"""
import os
import re
import glob

BASE = r"C:\Users\Dave\citoyenavise"

# Pages à traiter : toutes les .html à la racine (pas dans /en/)
html_files = [
    f for f in glob.glob(os.path.join(BASE, "*.html"))
    if not f.endswith("fix_footers.py")
]

fixes = {
    # 1. Lien Conditions d'utilisation (plusieurs variantes possibles)
    r'<li><a href="a-propos\.html">Conditions d\'utilisation</a></li>':
        '<li><a href="conditions-utilisation.html">Conditions d\'utilisation</a></li>',

    # 2. Lien Accessibilité cassé
    r'<li><a href="#">Accessibilité</a></li>':
        '<li><a href="accessibilite.html">Accessibilité</a></li>',

    # 3. Copyright 2025 OSBL
    r'© 2025 Citoyen Avisé · OSBL canadien indépendant · citoyenavise\.org':
        '© 2026 Citoyen Avisé · Organisme civique indépendant en voie de constitution · citoyenavise.org',

    # 3b. Autres variantes du copyright 2025
    r'© 2025 Citoyen Avisé · citoyenavise\.org':
        '© 2026 Citoyen Avisé · Organisme civique indépendant en voie de constitution · citoyenavise.org',

    # 4. Supprime nav-dropdown dans footer Organisation
    r'<li class="nav-dropdown"><a href="#" class="nav-dropdown-toggle">Ressources</a><div class="nav-dropdown-menu"><a href="carte\.html">🗺️ Carte citoyenne</a>\s*<a href="actualites\.html">📰 Actualités</a><a href="glossaire\.html">📖 Glossaire</a><a href="calendrier\.html">📅 Calendrier</a></div></li><li><a href="a-propos\.html">À propos</a></li>':
        '<li><a href="a-propos.html">À propos</a></li>',
}

changed = []
for path in sorted(html_files):
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()
    content = original
    for pattern, replacement in fixes.items():
        content = re.sub(pattern, replacement, content)
    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        changed.append(os.path.basename(path))

print(f"Modifié : {len(changed)} fichier(s)")
for name in changed:
    print(f"  ✓ {name}")
if not changed:
    print("  Aucune modification nécessaire.")
