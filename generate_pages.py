#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
os.chdir(r'C:\Users\Dave\citoyenavise')

NAV = """<nav class="nav">
  <div class="nav-inner">
    <a href="index.html" class="nav-logo">🍁 Citoyen <span>Avisé</span></a>
    <ul class="nav-liens">
      <li><a href="index.html">Accueil</a></li>
      <li><a href="elections.html">Élections</a></li>
      <li><a href="gouvernement.html">Gouvernement</a></li>
      <li><a href="droits.html">Droits</a></li>
      <li><a href="services.html">Services</a></li>
      <li><a href="participer.html">Participer</a></li>
      <li class="nav-dropdown">
        <a href="#" class="nav-dropdown-toggle">Ressources</a>
        <div class="nav-dropdown-menu">
          <a href="carte.html">🗺️ Carte citoyenne</a>
          <a href="actualites.html">📰 Actualités</a>
          <a href="glossaire.html">📖 Glossaire</a>
          <a href="calendrier.html">📅 Calendrier</a>
        </div>
      </li>
      <li><a href="a-propos.html">À propos</a></li>
      <li><a href="index.html#infolettre" class="nav-cta">S'inscrire</a></li>
    </ul>
    <button class="hamburger" aria-label="Menu"><span></span><span></span><span></span></button>
  </div>
  <div class="menu-mobile">
    <a href="index.html">🏠 Accueil</a>
    <a href="elections.html">🗳️ Élections</a>
    <a href="gouvernement.html">🏛️ Gouvernement</a>
    <a href="droits.html">⚖️ Droits</a>
    <a href="services.html">🛎️ Services</a>
    <a href="participer.html">🤝 Participer</a>
    <a href="carte.html">🗺️ Carte citoyenne</a>
    <a href="actualites.html">📰 Actualités</a>
    <a href="glossaire.html">📖 Glossaire</a>
    <a href="calendrier.html">📅 Calendrier</a>
    <a href="a-propos.html">ℹ️ À propos</a>
    <a href="index.html#infolettre" class="nav-cta-mobile">S'inscrire</a>
  </div>
</nav>"""

FOOTER = """<footer class="pied-page">
  <div class="conteneur">
    <div class="pied-grille">
      <div><a href="index.html" class="pied-logo">🍁 Citoyen Avisé</a><p>L'information civique canadienne, accessible à tous.</p></div>
      <div><p class="pied-titre">Sections</p><ul class="pied-liens"><li><a href="elections.html">Élections</a></li><li><a href="gouvernement.html">Gouvernement</a></li><li><a href="droits.html">Droits</a></li><li><a href="services.html">Services</a></li><li><a href="participer.html">Participer</a></li><li><a href="actualites.html">Actualités</a></li><li><a href="glossaire.html">Glossaire</a></li><li><a href="calendrier.html">Calendrier</a></li></ul></div>
      <div><p class="pied-titre">Organisation</p><ul class="pied-liens"><li><a href="a-propos.html">À propos</a></li><li><a href="a-propos.html#contact">Contact</a></li></ul></div>
      <div>
        <p class="pied-titre">Contact</p>
        <ul class="pied-liens"><li><a href="mailto:infocitoyenavise@gmail.com">infocitoyenavise@gmail.com</a></li></ul>
        <div class="pied-social" style="margin-top:16px;">
          <a href="https://www.facebook.com/citoyenavise" title="Facebook" aria-label="Facebook">f</a>
          <a href="https://www.instagram.com/citoyenavise" title="Instagram" aria-label="Instagram">📷</a>
          <a href="https://x.com/citoyenavise" title="X / Twitter" aria-label="X Twitter">𝕏</a>
          <a href="https://www.youtube.com/@citoyenavise" title="YouTube" aria-label="YouTube">▶</a>
          <a href="https://www.linkedin.com/company/citoyenavise" title="LinkedIn" aria-label="LinkedIn">in</a>
          <a href="https://www.threads.net/@citoyenavise" title="Threads" aria-label="Threads">T</a>
          <a href="https://bsky.app/profile/citoyenavise.bsky.social" title="Bluesky" aria-label="Bluesky">🦋</a>
        </div>
      </div>
    </div>
    <div class="pied-bas"><p>© 2025 Citoyen Avisé · citoyenavise.org</p><div class="pied-valeurs"><span>Indépendant</span><span>Non partisan</span><span>Gratuit</span></div></div>
  </div>
</footer>
<button class="retour-haut" aria-label="Retour en haut">↑</button>
<script src="js/main.js"></script>"""

def page(fname, title, desc, fil, h1, lead, body, extra_head=""):
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Citoyen Avisé</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="https://citoyenavise.org/{fname}">
  <link rel="stylesheet" href="css/style.css">
{extra_head}</head>
<body>
{NAV}
<header class="entete-page">
  <div class="conteneur">
    <p class="fil-ariane"><a href="index.html">Accueil</a> › {fil}</p>
    <h1>{h1}</h1>
    <p class="lead">{lead}</p>
  </div>
</header>
<main>
{body}
</main>
{FOOTER}
</body>
</html>"""
    with open(fname, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"✓ {fname}")

print("Génération des 22 pages en cours...")
print("="*50)
