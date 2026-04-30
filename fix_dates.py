"""
Ajoute la date de dernière vérification en bas du contenu principal
sur toutes les pages qui ont un <main>...</main>.
"""
import re, glob, os

BASE = r"C:\Users\Dave\citoyenavise"
html_files = sorted(glob.glob(os.path.join(BASE, "*.html")))

DATE_HTML = (
    '\n  <div class="conteneur" style="padding:0 0 24px; text-align:center;">\n'
    '    <p style="color:var(--gris); font-size:.8rem; font-style:italic;">'
    'Dernière vérification : avril 2026</p>\n'
    '  </div>\n'
    '</main>'
)

SKIP = {"index.html", "profil.html"}

changed = []
for path in html_files:
    name = os.path.basename(path)
    if name in SKIP:
        continue
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()
    # Ajouter seulement si <main> existe et si la date n'est pas déjà là
    if "</main>" not in original or "Dernière vérification" in original:
        continue
    content = original.replace("</main>", DATE_HTML, 1)
    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        changed.append(name)

print(f"Modified: {len(changed)}")
for n in changed:
    print(" " + n)
