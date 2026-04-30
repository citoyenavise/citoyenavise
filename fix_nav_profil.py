"""
Ajoute le lien Mon profil dans le dropdown Ressources (nav-dropdown-menu)
sur toutes les pages FR. Ignore les pages EN (gérées dynamiquement par JS).
"""
import re, glob, os

BASE = r"C:\Users\Dave\citoyenavise"
html_files = sorted(glob.glob(os.path.join(BASE, "*.html")))

PROFIL_LINK = '<a href="profil.html">\U0001f464 Mon profil</a>'

SKIP = {"profil.html"}  # inutile de s'ajouter soi-même

changed = []
for path in html_files:
    name = os.path.basename(path)
    if name in SKIP:
        continue
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()

    # Ne pas ajouter si déjà présent
    if 'href="profil.html"' in original:
        continue

    # Ajouter le lien juste avant la fermeture du nav-dropdown-menu
    # Le pattern est : ...Calendrier</a></div>
    new = original.replace(
        '<a href="calendrier.html">\U0001f4c5 Calendrier</a></div>',
        '<a href="calendrier.html">\U0001f4c5 Calendrier</a>' + PROFIL_LINK + '</div>',
        1
    )

    if new != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)
        changed.append(name)

print(f"Modified: {len(changed)}")
for n in changed:
    print("  " + n)
