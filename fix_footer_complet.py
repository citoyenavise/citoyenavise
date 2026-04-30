"""
Remplace le footer entier sur toutes les pages françaises par le footer standard.
"""
import re, glob, os

BASE = r"C:\Users\Dave\citoyenavise"
html_files = sorted(glob.glob(os.path.join(BASE, "*.html")))

FOOTER_STD = """<footer class="pied-page">
  <div class="conteneur">
    <div class="pied-grille">
      <div>
        <a href="index.html" class="pied-logo">\U0001f341 Citoyen Avisé</a>
        <p>L'information civique canadienne, centralisée et accessible à tous les Canadiens, gratuitement.</p>
        <div class="pied-social">
          <a href="https://www.facebook.com/citoyenavise" title="Facebook" aria-label="Facebook">f</a>
          <a href="https://www.instagram.com/citoyenavise" title="Instagram" aria-label="Instagram">\U0001f4f7</a>
          <a href="https://x.com/citoyenavise" title="X / Twitter" aria-label="X Twitter">\U0001d54f</a>
          <a href="https://www.youtube.com/@citoyenavise" title="YouTube" aria-label="YouTube">▶</a>
          <a href="https://www.linkedin.com/company/citoyenavise" title="LinkedIn" aria-label="LinkedIn">in</a>
          <a href="https://www.threads.net/@citoyenavise" title="Threads" aria-label="Threads">T</a>
          <a href="https://bsky.app/profile/citoyenavise.bsky.social" title="Bluesky" aria-label="Bluesky">\U0001f98b</a>
        </div>
      </div>
      <div>
        <p class="pied-titre">Sections</p>
        <ul class="pied-liens">
          <li><a href="elections.html">Élections &amp; Vote</a></li>
          <li><a href="gouvernement.html">Gouvernement</a></li>
          <li><a href="droits.html">Droits &amp; Libertés</a></li>
          <li><a href="services.html">Services publics</a></li>
          <li><a href="participer.html">Participer</a></li>
        </ul>
      </div>
      <div>
        <p class="pied-titre">Organisation</p>
        <ul class="pied-liens">
          <li><a href="a-propos.html">À propos</a></li>
          <li><a href="a-propos.html#equipe">Notre équipe</a></li>
          <li><a href="a-propos.html#charte">Notre charte</a></li>
          <li><a href="a-propos.html#contact">Contactez-nous</a></li>
          <li><a href="https://github.com/citoyenavise/citoyenavise">GitHub</a></li>
        </ul>
      </div>
      <div>
        <p class="pied-titre">Légal</p>
        <ul class="pied-liens">
          <li><a href="politique-confidentialite.html">Politique de confidentialité</a></li>
          <li><a href="conditions-utilisation.html">Conditions d'utilisation</a></li>
          <li><a href="accessibilite.html">Accessibilité</a></li>
        </ul>
        <div class="encadre" style="margin-top:20px; font-size:.82rem;">
          <p>\U0001f4e7 <a href="mailto:infocitoyenavise@gmail.com" style="color:var(--rouge);">infocitoyenavise@gmail.com</a></p>
        </div>
      </div>
    </div>
    <div class="pied-bas">
      <p>© 2026 Citoyen Avisé · Organisme civique indépendant en voie de constitution · citoyenavise.org</p>
      <div class="pied-valeurs">
        <span>Indépendant</span><span>Non partisan</span>
        <span>Gratuit</span><span>Sans publicité</span>
      </div>
    </div>
  </div>
</footer>"""

PATTERN = re.compile(r'<footer class="pied-page">.*?</footer>', re.DOTALL)

# Pages à exclure (celles déjà corrigées manuellement avec footer parfait)
SKIP = {"index.html", "a-propos.html", "conditions-utilisation.html", "accessibilite.html", "politique-confidentialite.html"}

changed = []
for path in html_files:
    name = os.path.basename(path)
    if name in SKIP:
        continue
    with open(path, "r", encoding="utf-8") as f:
        original = f.read()
    content = PATTERN.sub(FOOTER_STD, original)
    if content != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        changed.append(name)

print(f"Modified: {len(changed)}")
for n in changed:
    print(" " + n)
