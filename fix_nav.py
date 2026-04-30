"""
Remet le nav-dropdown Ressources dans la navigation principale.
Le script fix_footers.py l'avait supprimé par erreur des deux endroits.
"""
import re, glob, os

BASE = r"C:\Users\Dave\citoyenavise"
html_files = sorted(glob.glob(os.path.join(BASE, "*.html")))

# Le bloc nav-dropdown a insérer avant <li><a href="a-propos.html">
DROPDOWN = (
    '<li class="nav-dropdown"><a href="#" class="nav-dropdown-toggle">Ressources</a>'
    '<div class="nav-dropdown-menu"><a href="carte.html">\U0001f5fa️ Carte citoyenne</a>\n'
    '    <a href="actualites.html">\U0001f4f0 Actualités</a>'
    '<a href="glossaire.html">\U0001f4d6 Glossaire</a>'
    '<a href="calendrier.html">\U0001f4c5 Calendrier</a></div></li>'
    '<li><a href="a-propos.html">À propos</a></li>'
)

# Dans la nav principale, a-propos.html est suivi par nav-lang ou nav-cta
# Dans le footer Organisation, il est suivi par a-propos.html#equipe — pas de class="nav-
PATTERN = (
    r'<li><a href="a-propos\.html">À propos</a></li>'
    r'(\s*\n\s*<li><a href="[^"]*" class="nav-)'
)

def replacement(m):
    return DROPDOWN + m.group(1)

changed = []
for path in html_files:
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()
    content = re.sub(PATTERN, replacement, original)
    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        changed.append(os.path.basename(path))

print(f"Modified: {len(changed)}")
for n in changed:
    print(" " + n)
