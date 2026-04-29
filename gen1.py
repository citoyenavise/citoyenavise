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
          <a href="https://x.com/citoyenavise" title="X" aria-label="X">𝕏</a>
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

def mk(fname, title, desc, fil, h1, lead, body, extra=""):
    html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} — Citoyen Avisé</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="https://citoyenavise.org/{fname}">
  <link rel="stylesheet" href="css/style.css">
{extra}</head>
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
    print(f"  OK {fname}")

# ── PHASE 2 ──────────────────────────────────────────────────

mk('parlement.html','Le Parlement du Canada',
'Comprendre le Parlement canadien : Chambre des communes, Sénat, processus législatif et partis politiques.',
'Gouvernement › Parlement','🏛️ Le Parlement du Canada',
"L'organe législatif suprême du Canada, composé de trois éléments : la Couronne, le Sénat et la Chambre des communes.",
"""<section class="section"><div class="conteneur">
<div class="grille-3" style="margin-bottom:40px;">
  <div class="carte fade-in" style="border-top:4px solid #B8860B;text-align:center;">
    <div style="font-size:2rem;margin-bottom:10px;">👑</div><h3>La Couronne</h3>
    <p>Le Gouverneur général représente le roi du Canada. Il donne la sanction royale, convoque, proroge ou dissout le Parlement sur avis du Premier ministre.</p>
    <p style="margin-top:10px;font-size:.84rem;"><strong style="color:var(--rouge);">Mary Simon</strong> — GG depuis juillet 2021</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #8B0000;text-align:center;">
    <div style="font-size:2rem;margin-bottom:10px;">🔴</div><h3>Le Sénat</h3>
    <p>105 sénateurs nommés jusqu'à 75 ans. Examine, révise et amende les projets de loi. Mène des études thématiques indépendantes.</p>
    <p style="margin-top:10px;font-size:.84rem;"><strong style="color:#8B0000;">105 sénateurs</strong> — 4 divisions régionales</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;">
    <div style="font-size:2rem;margin-bottom:10px;">🟢</div><h3>Chambre des communes</h3>
    <p>343 députés élus directement par scrutin uninominal. C'est ici que naissent et tombent les gouvernements canadiens.</p>
    <p style="margin-top:10px;font-size:.84rem;"><strong style="color:#1565C0;">343 circonscriptions</strong> — redistribution 2023</p>
  </div>
</div>

<h2 style="margin-bottom:20px;">⚙️ Comment une loi est adoptée</h2>
<div class="encadre" style="margin-bottom:36px;">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;text-align:center;">
    <div style="padding:12px 6px;background:var(--rouge-clair);border-radius:10px;"><div style="font-weight:900;color:var(--rouge);font-size:.68rem;text-transform:uppercase;">1</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">1ère lecture</div><div style="font-size:.72rem;color:var(--gris);margin-top:3px;">Dépôt sans débat</div></div>
    <div style="padding:12px 6px;background:#e3f0ff;border-radius:10px;"><div style="font-weight:900;color:#1565C0;font-size:.68rem;text-transform:uppercase;">2</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">2e lecture</div><div style="font-size:.72rem;color:var(--gris);margin-top:3px;">Débat de principe</div></div>
    <div style="padding:12px 6px;background:#e8f5e9;border-radius:10px;"><div style="font-weight:900;color:#2E7D32;font-size:.68rem;text-transform:uppercase;">3</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">Comité</div><div style="font-size:.72rem;color:var(--gris);margin-top:3px;">Article par article</div></div>
    <div style="padding:12px 6px;background:#fff8e1;border-radius:10px;"><div style="font-weight:900;color:#E65100;font-size:.68rem;text-transform:uppercase;">4</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">Rapport</div><div style="font-size:.72rem;color:var(--gris);margin-top:3px;">Amendements</div></div>
    <div style="padding:12px 6px;background:#f3e5f5;border-radius:10px;"><div style="font-weight:900;color:#6A1B9A;font-size:.68rem;text-transform:uppercase;">5</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">3e lecture</div><div style="font-size:.72rem;color:var(--gris);margin-top:3px;">Vote final</div></div>
    <div style="padding:12px 6px;background:#fdeaea;border-radius:10px;"><div style="font-weight:900;color:var(--rouge);font-size:.68rem;text-transform:uppercase;">6</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">Sénat</div><div style="font-size:.72rem;color:var(--gris);margin-top:3px;">Même cycle</div></div>
    <div style="padding:12px 6px;background:var(--noir-doux);border-radius:10px;"><div style="font-weight:900;color:#ffd700;font-size:.68rem;text-transform:uppercase;">7</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;color:#fff;">Sanction royale</div><div style="font-size:.72rem;color:#aaa;margin-top:3px;">Loi en vigueur</div></div>
  </div>
</div>

<h2 style="margin-bottom:18px;">🗳️ Partis à la Chambre — 44e législature (2025)</h2>
<div class="grille-2" style="margin-bottom:32px;">
  <div class="carte fade-in"><h3 style="color:#D01010;">🔴 Parti libéral</h3><p><strong>Chef :</strong> Mark Carney · Gouvernement minoritaire · Élu 28 avril 2025</p><a href="https://liberal.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">liberal.ca →</a></div>
  <div class="carte fade-in"><h3 style="color:#1565C0;">🔵 Parti conservateur</h3><p><strong>Chef :</strong> Pierre Poilievre · Opposition officielle</p><a href="https://www.conservative.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">conservative.ca →</a></div>
  <div class="carte fade-in"><h3 style="color:#F26522;">🟠 NPD</h3><p><strong>Chef :</strong> Jagmeet Singh · 3e parti</p><a href="https://www.ndp.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">ndp.ca →</a></div>
  <div class="carte fade-in"><h3 style="color:#00ACC1;">🔷 Bloc québécois</h3><p><strong>Chef :</strong> Yves-François Blanchet · Parti souverainiste fédéral</p><a href="https://www.blocquebecois.org" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">blocquebecois.org →</a></div>
</div>

<div class="grille-2">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">📋 Vocabulaire clé</h3>
    <ul class="services-liste">
      <li><strong>Législature</strong> — Période entre deux élections (max 5 ans)</li>
      <li><strong>Prorogation</strong> — Fin de session, projets de loi abandonnés</li>
      <li><strong>Question de confiance</strong> — Défaite = possible élection</li>
      <li><strong>Whip</strong> — Responsable de la discipline de vote du caucus</li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Sources officielles</h3>
    <ul class="services-liste">
      <li><a href="https://www.parl.gc.ca" class="services-lien" target="_blank" rel="noopener">parl.gc.ca — Parlement du Canada</a></li>
      <li><a href="https://www.ourcommons.ca" class="services-lien" target="_blank" rel="noopener">ourcommons.ca — Chambre des communes</a></li>
      <li><a href="https://sencanada.ca" class="services-lien" target="_blank" rel="noopener">sencanada.ca — Le Sénat</a></li>
      <li><a href="https://pm.gc.ca" class="services-lien" target="_blank" rel="noopener">pm.gc.ca — Cabinet du Premier ministre</a></li>
    </ul>
  </div>
</div>
</div></section>""")

mk('constitution.html','La Constitution du Canada',
'Guide de la Constitution canadienne : Lois de 1867 et 1982, partage des compétences et formule d\'amendement.',
'Gouvernement › Constitution','📜 La Constitution du Canada',
"La loi suprême du Canada. Toute loi incompatible avec elle est inopérante dans la mesure de son incompatibilité.",
"""<section class="section"><div class="conteneur">
<div class="grille-2" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid #8B0000;">
    <h3>📅 Loi constitutionnelle de 1867</h3>
    <p>Anciennement l'AANB. Crée la Confédération (Ontario, Québec, N.-B., N.-É.). Définit les institutions fédérales et le partage des compétences.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Art. 91 — 29 chefs de compétence fédérale</li>
      <li>Art. 92 — 16 chefs de compétence provinciale</li>
      <li>Art. 93 — Éducation : compétence provinciale</li>
      <li>Art. 96 — Nomination fédérale des juges des cours supérieures</li>
      <li>Art. 133 — Bilinguisme au Parlement et au Québec</li>
    </ul></div></details>
    <a href="https://laws-lois.justice.gc.ca/fra/const/page-1.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Lire la Loi de 1867 →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;">
    <h3>📅 Loi constitutionnelle de 1982</h3>
    <p>Rapatriement le 17 avril 1982. Introduit la Charte des droits et libertés et une formule d'amendement canadienne.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Partie I — Charte canadienne des droits et libertés (art. 1-34)</li>
      <li>Partie II — Droits des peuples autochtones (art. 35)</li>
      <li>Partie III — Péréquation et inégalités régionales (art. 36)</li>
      <li>Partie V — Procédure de modification (art. 38-49)</li>
      <li>Le Québec n'a jamais formellement signé la Constitution de 1982</li>
    </ul></div></details>
    <a href="https://laws-lois.justice.gc.ca/fra/const/page-15.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Lire la Loi de 1982 →</a>
  </div>
</div>

<h2 style="margin-bottom:20px;">⚖️ Partage des compétences</h2>
<div class="grille-2" style="margin-bottom:36px;">
  <div class="encadre fade-in" style="border-left:4px solid var(--rouge);">
    <h3 style="color:var(--rouge);margin-bottom:12px;">🇨🇦 Fédéral (Art. 91)</h3>
    <ul class="services-liste">
      <li>Défense nationale</li><li>Commerce interprovincial et international</li>
      <li>Monnaie et banques</li><li>Droit pénal</li>
      <li>Assurance-emploi</li><li>Postes et communications</li>
      <li>Immigration (partagée)</li><li>Peuples autochtones</li>
    </ul>
  </div>
  <div class="encadre fade-in" style="border-left:4px solid #1565C0;">
    <h3 style="color:#1565C0;margin-bottom:12px;">🏙️ Provincial (Art. 92)</h3>
    <ul class="services-liste">
      <li>Santé et hôpitaux</li><li>Éducation</li>
      <li>Ressources naturelles</li><li>Droit civil et propriété</li>
      <li>Gouvernements locaux</li><li>Travail et relations de travail</li>
      <li>Administration de la justice civile</li>
    </ul>
  </div>
</div>

<h2 style="margin-bottom:20px;">🔧 Formule d'amendement</h2>
<div class="encadre fade-in" style="margin-bottom:32px;">
  <div class="grille-3">
    <div style="text-align:center;padding:16px;background:var(--rouge-clair);border-radius:10px;">
      <div style="font-size:1.5rem;font-weight:900;color:var(--rouge);">7/50</div>
      <div style="font-size:.84rem;font-weight:700;margin-top:6px;">Règle générale</div>
      <div style="font-size:.76rem;color:var(--gris-texte);margin-top:4px;">7 provinces + 50% population + Parlement</div>
    </div>
    <div style="text-align:center;padding:16px;background:#fdeaea;border-radius:10px;">
      <div style="font-size:1.5rem;font-weight:900;color:var(--rouge);">Unanimité</div>
      <div style="font-size:.84rem;font-weight:700;margin-top:6px;">Matières fondamentales</div>
      <div style="font-size:.76rem;color:var(--gris-texte);margin-top:4px;">Monarchie, Cour suprême, formule d'amendement</div>
    </div>
    <div style="text-align:center;padding:16px;background:#e3f0ff;border-radius:10px;">
      <div style="font-size:1.5rem;font-weight:900;color:#1565C0;">Bilatéral</div>
      <div style="font-size:.84rem;font-weight:700;margin-top:6px;">Province concernée</div>
      <div style="font-size:.76rem;color:var(--gris-texte);margin-top:4px;">Parlement + province uniquement</div>
    </div>
  </div>
</div>
<div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Sources</h3>
  <ul class="services-liste">
    <li><a href="https://laws-lois.justice.gc.ca/fra/const/" class="services-lien" target="_blank" rel="noopener">Justice Canada — Texte intégral de la Constitution</a></li>
    <li><a href="https://www.canada.ca/fr/patrimoine-canadien/services/comment-canada-gouverne/constitution.html" class="services-lien" target="_blank" rel="noopener">Canada.ca — La Constitution expliquée</a></li>
  </ul>
</div>
</div></section>""")

mk('charte.html','La Charte canadienne des droits et libertés',
'Guide complet de la Charte : libertés fondamentales, droits juridiques, égalité, droits linguistiques et recours.',
'Droits › Charte','⚖️ La Charte canadienne des droits et libertés',
"Partie I de la Loi constitutionnelle de 1982. Elle garantit des droits que le gouvernement ne peut restreindre qu'à des conditions précises.",
"""<section class="section"><div class="conteneur">
<div class="encadre fade-in" style="background:linear-gradient(135deg,var(--rouge-clair),#fff);border-left:5px solid var(--rouge);margin-bottom:36px;">
  <h3 style="color:var(--rouge);margin-bottom:8px;">📌 Article 1 — La clause limitative</h3>
  <p>Les droits peuvent être restreints par une règle de droit dans des <em>limites raisonnables</em> dont la justification peut se démontrer dans une société libre et démocratique. Le test <em>Oakes</em> (1986) fixe le cadre : objectif urgent + proportionnalité des moyens.</p>
</div>

<div class="grille-2" style="margin-bottom:32px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);">
    <h3 style="color:var(--rouge);">Art. 2 — Libertés fondamentales</h3>
    <ul class="services-liste" style="margin-top:8px;">
      <li><strong>a)</strong> Liberté de conscience et de religion</li>
      <li><strong>b)</strong> Liberté d'expression, de pensée et d'opinion</li>
      <li><strong>c)</strong> Liberté de réunion pacifique</li>
      <li><strong>d)</strong> Liberté d'association</li>
    </ul>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;">
    <h3 style="color:#1565C0;">Art. 3–5 — Droits démocratiques</h3>
    <ul class="services-liste" style="margin-top:8px;">
      <li><strong>3</strong> — Droit de vote et d'éligibilité de tout citoyen</li>
      <li><strong>4</strong> — Mandats parlementaires : max 5 ans</li>
      <li><strong>5</strong> — Séance annuelle obligatoire du Parlement</li>
    </ul>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #6A1B9A;">
    <h3 style="color:#6A1B9A;">Art. 7–14 — Garanties juridiques</h3>
    <ul class="services-liste" style="margin-top:8px;">
      <li><strong>7</strong> — Droit à la vie, à la liberté et à la sécurité</li>
      <li><strong>8</strong> — Protection contre les fouilles et saisies abusives</li>
      <li><strong>9</strong> — Protection contre la détention arbitraire</li>
      <li><strong>10</strong> — Droits en cas d'arrestation (habeas corpus, avocat)</li>
      <li><strong>11</strong> — Présomption d'innocence, procès juste et équitable</li>
      <li><strong>12</strong> — Protection contre les peines cruelles et inusités</li>
      <li><strong>13</strong> — Non-incrimination par son propre témoignage</li>
      <li><strong>14</strong> — Droit à un interprète lors de procédures judiciaires</li>
    </ul>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #E65100;">
    <h3 style="color:#E65100;">Art. 15 — Droit à l'égalité</h3>
    <p>Égalité de tous devant la loi, sans discrimination fondée sur la race, l'origine nationale, la couleur, la religion, le sexe, l'âge ou les déficiences physiques ou mentales.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Art. 15(2) autorise les programmes de promotion sociale (action positive)</li>
      <li>Les tribunaux ont élargi les motifs : orientation sexuelle, identité de genre</li>
      <li>Arrêt Eldridge (1997) — droit aux services de santé en LSQ pour les sourds</li>
    </ul></div></details>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;">
    <h3 style="color:#1565C0;">Art. 16–23 — Droits linguistiques</h3>
    <ul class="services-liste" style="margin-top:8px;">
      <li><strong>16</strong> — Égalité du français et de l'anglais comme langues officielles</li>
      <li><strong>17–18</strong> — Parlement et lois dans les deux langues</li>
      <li><strong>19</strong> — Deux langues devant les tribunaux fédéraux</li>
      <li><strong>20</strong> — Services fédéraux dans la langue de son choix</li>
      <li><strong>23</strong> — Instruction dans la langue de la minorité</li>
    </ul>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #8B0000;">
    <h3 style="color:#8B0000;">Art. 33 — Clause dérogatoire</h3>
    <p>Un parlement peut déclarer qu'une loi s'applique nonobstant les articles 2 ou 7–15. Valide 5 ans, renouvelable. Ne couvre pas les droits démocratiques ni les droits linguistiques.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Utilisée par le Québec au début (application générale)</li>
      <li>Utilisée par Ford (Ontario) pour imposer un accord salarial aux enseignants (2022)</li>
      <li>La Saskatchewan a menacé de l'utiliser pour les écoles confessionnelles (2023)</li>
    </ul></div></details>
  </div>
</div>
<div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Consulter la Charte</h3>
  <ul class="services-liste">
    <li><a href="https://laws-lois.justice.gc.ca/fra/const/page-15.html" class="services-lien" target="_blank" rel="noopener">Justice Canada — Texte intégral de la Charte</a></li>
    <li><a href="https://www.canada.ca/fr/patrimoine-canadien/services/comment-canada-gouverne/charte-droits.html" class="services-lien" target="_blank" rel="noopener">Canada.ca — La Charte expliquée</a></li>
  </ul>
</div>
</div></section>""")

mk('autochtones.html','Peuples autochtones et réconciliation',
'Droits des Premières Nations, Métis et Inuit au Canada : traités, CVR, 94 appels à l\'action, DNUDPA et ressources.',
'Droits › Peuples autochtones','🪶 Peuples autochtones et réconciliation',
"Le Canada reconnaît trois peuples autochtones distincts : les Premières Nations, les Métis et les Inuit. Chacun possède des droits constitutionnels propres.",
"""<section class="section"><div class="conteneur">
<div class="grille-3" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid #8B4513;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🏞️</div><h3>Premières Nations</h3>
    <p>Plus de 630 communautés. Diversité linguistique et culturelle immense. Titulaires de droits issus de traités et droits ancestraux.</p>
    <p style="margin-top:10px;font-size:.84rem;"><strong>~900 000 personnes</strong> · Recensement 2021</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🌿</div><h3>Métis</h3>
    <p>Peuple distinct né de l'union entre colons européens et femmes autochtones. Identité et traditions propres, centrées dans l'Ouest canadien.</p>
    <p style="margin-top:10px;font-size:.84rem;"><strong>~590 000 personnes</strong> · Recensement 2021</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">❄️</div><h3>Inuit</h3>
    <p>Peuple de l'Arctique canadien réparti en quatre régions : Nunatsiavut, Nunavik, Nunavut et Inuvialuit. Langue : l'inuktitut.</p>
    <p style="margin-top:10px;font-size:.84rem;"><strong>~70 000 personnes</strong> · Recensement 2021</p>
  </div>
</div>

<div class="grille-2" style="margin-bottom:32px;">
  <div class="carte fade-in">
    <h3>⚖️ Article 35 — Droits constitutionnels</h3>
    <p>La Loi constitutionnelle de 1982 reconnaît et confirme les droits existants — ancestraux et issus de traités — des peuples autochtones du Canada.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Arrêt Sparrow (1990) — Droits ancestraux non restreints sans justification impérieuse</li>
      <li>Arrêt Delgamuukw (1997) — Reconnaissance du titre ancestral sur la terre</li>
      <li>Arrêt Tsilhqot'in (2014) — Premier titre ancestral reconnu sur un territoire précis</li>
      <li>Arrêt Haïda (2004) — Obligation de consulter avant toute mesure affectant les droits</li>
    </ul></div></details>
  </div>
  <div class="carte fade-in">
    <h3>🌐 DNUDPA — Loi canadienne de 2021</h3>
    <p>La Loi sur la Déclaration des Nations Unies sur les droits des peuples autochtones exige l'harmonisation des lois fédérales avec la Déclaration.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>46 articles reconnaissant droits collectifs et individuels</li>
      <li>Consentement libre, préalable et éclairé (CLPE)</li>
      <li>Droit à l'autodétermination et à l'autonomie gouvernementale</li>
      <li>Plan d'action du gouvernement canadien publié en 2023</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/affaires-autochtones-nord/nouvelles/2023/06/plan-daction-du-canada-pour-la-mise-en-oeuvre-de-la-dnudpa.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Plan d'action DNUDPA →</a>
  </div>
</div>

<div class="encadre fade-in" style="border-left:5px solid #8B4513;margin-bottom:32px;">
  <h3 style="margin-bottom:10px;">🕊️ Commission de vérité et réconciliation (CVR)</h3>
  <p>La CVR (2008–2015) a documenté les séquelles des pensionnats autochtones — plus de 150 000 enfants forcés de quitter leurs familles. Son rapport formule <strong>94 appels à l'action</strong>.</p>
  <div class="grille-3" style="margin-top:14px;">
    <div style="background:var(--rouge-clair);padding:12px;border-radius:10px;text-align:center;"><strong style="color:var(--rouge);font-size:1.3rem;">13</strong><br><span style="font-size:.78rem;">Complétés</span></div>
    <div style="background:#fff8e1;padding:12px;border-radius:10px;text-align:center;"><strong style="color:#E65100;font-size:1.3rem;">24</strong><br><span style="font-size:.78rem;">En cours</span></div>
    <div style="background:#fdeaea;padding:12px;border-radius:10px;text-align:center;"><strong style="color:var(--rouge);font-size:1.3rem;">57</strong><br><span style="font-size:.78rem;">Non complétés</span></div>
  </div>
  <p style="font-size:.8rem;color:var(--gris);margin-top:8px;">Source : Institut Yellowhead, suivi 2024</p>
</div>

<div class="grille-2">
  <div class="encadre fade-in">
    <h3 style="margin-bottom:10px;">💔 Enquête FFADA (2019)</h3>
    <p>L'Enquête nationale sur les femmes et filles autochtones disparues et assassinées formule <strong>231 appels à la justice</strong> et conclut à un génocide de race et de genre.</p>
    <a href="https://www.mmiwg-ffada.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">mmiwg-ffada.ca →</a>
  </div>
  <div class="encadre fade-in">
    <h3 style="margin-bottom:10px;">🏛️ Organisations nationales autochtones</h3>
    <ul class="services-liste">
      <li><a href="https://www.afn.ca" class="services-lien" target="_blank" rel="noopener">Assemblée des Premières Nations</a></li>
      <li><a href="https://www.itk.ca" class="services-lien" target="_blank" rel="noopener">Inuit Tapiriit Kanatami (ITK)</a></li>
      <li><a href="https://www.rcaanc-cirnac.gc.ca" class="services-lien" target="_blank" rel="noopener">CIRNAC — Relations Couronne-Autochtones</a></li>
      <li><a href="https://www.cvrc-nctr.ca" class="services-lien" target="_blank" rel="noopener">Centre national pour la vérité et réconciliation</a></li>
    </ul>
  </div>
</div>
</div></section>""")

mk('immigration.html','Immigration et citoyenneté canadienne',
'Guide de l\'immigration au Canada : Entrée express, PNP, réfugiés, résidence permanente et citoyenneté.',
'Services › Immigration','✈️ Immigration et citoyenneté canadienne',
"Le Canada accueille plus de 400 000 nouveaux résidents permanents par an. Comprendre le système vous aide à choisir le bon chemin.",
"""<section class="section"><div class="conteneur">
<div class="grille-3" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);">
    <h3>📊 Entrée express</h3>
    <p>Système de gestion des candidatures pour travailleurs qualifiés. Score de classement global (SCG) sur 1 200 points.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Fédéral des travailleurs qualifiés (FTQF)</li>
      <li>Fédéral des métiers spécialisés (FMS)</li>
      <li>Catégorie de l'expérience canadienne (CEC)</li>
      <li>Tirage aux invitations toutes les 2 semaines environ</li>
      <li>Score minimum typique (2025) : ~480–520 points</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/entree-express.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Entrée express →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;">
    <h3>🏙️ Programmes provinciaux (PNP)</h3>
    <p>Chaque province possède son propre programme de candidats pour attirer des travailleurs selon ses besoins économiques.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Ontario Immigrant Nominee Program (OINP)</li>
      <li>Programme des candidats du Québec (PCQ)</li>
      <li>BC Provincial Nominee Program</li>
      <li>Alberta Advantage Immigration Program</li>
      <li>Voies PNP alignées avec Entrée express : +600 points SCG</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/programmes-candidats-provinciaux.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">PNP →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;">
    <h3>👨‍👩‍👧 Réunification familiale</h3>
    <p>Les résidents permanents et citoyens canadiens peuvent parrainer des membres de leur famille proche.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Époux, conjoints de fait, partenaires conjugaux</li>
      <li>Enfants à charge (moins de 22 ans)</li>
      <li>Parents et grands-parents (Super Visa possible)</li>
      <li>Engagement du répondant : 3 ans (époux), 10 ans (parents)</li>
      <li>Revenus minimums requis selon la taille du foyer</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/parrainer-membres-famille.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Parrainage familial →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #E65100;">
    <h3>🛡️ Réfugiés et protection</h3>
    <p>Le Canada a des obligations internationales envers les personnes qui fuient la persécution.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Demandeurs d'asile depuis le Canada</li>
      <li>Réfugiés pris en charge par le gouvernement (RPG)</li>
      <li>Réfugiés parrainés par le secteur privé (RPSP)</li>
      <li>CISR — Commission de l'immigration et du statut de réfugié</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/refugies.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Réfugiés →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #6A1B9A;">
    <h3>🎓 Étudiants et travailleurs temporaires</h3>
    <p>Permis d'études, permis de travail ouvert post-diplôme (PGWP), programme vacances-travail.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>PGWP — durée égale au programme d'études (max 3 ans)</li>
      <li>Permis ouvert pour conjoint d'étudiant international</li>
      <li>Programme vacances-travail : ententes bilatérales (18-35 ans)</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/etudier-canada.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Étudiants →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #B8860B;">
    <h3>🍁 La citoyenneté canadienne</h3>
    <p>Après 1 095 jours de présence physique sur 5 ans en tant que RP, vous pouvez demander la citoyenneté.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Niveau de langue B1 en français ou anglais (18-54 ans)</li>
      <li>Examen de citoyenneté : 20 questions, 75% pour réussir</li>
      <li>Serment de citoyenneté lors d'une cérémonie officielle</li>
      <li>Déclarations d'impôts canadiens (si requis)</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/citoyennete-canadienne.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Citoyenneté →</a>
  </div>
</div>

<div class="grille-2">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">📋 Droits du résident permanent</h3>
    <ul class="services-liste">
      <li>Vivre, travailler et étudier partout au Canada</li>
      <li>Accès aux programmes sociaux (santé, AE)</li>
      <li>Protection par la Charte canadienne des droits</li>
      <li>Renouveler la carte RP (valide 5 ans)</li>
      <li>Ne peut pas voter aux élections fédérales</li>
      <li>Peut perdre le statut : absence &gt; 730 jours sur 5 ans</li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 IRCC — Ressources officielles</h3>
    <ul class="services-liste">
      <li><a href="https://www.canada.ca/fr/immigration-refugies-citoyennete.html" class="services-lien" target="_blank" rel="noopener">IRCC — Immigration Canada</a></li>
      <li><a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/demande/compte.html" class="services-lien" target="_blank" rel="noopener">Compte IRCC en ligne</a></li>
      <li><a href="https://www.cisr.gc.ca" class="services-lien" target="_blank" rel="noopener">CISR — Commission de l'immigration</a></li>
    </ul>
  </div>
</div>
</div></section>""")

mk('provincial.html','Les gouvernements provinciaux et territoriaux',
'Guide des 10 provinces et 3 territoires : pouvoirs, premiers ministres, assemblées législatives et relations fédérales.',
'Gouvernement › Provinces','🏙️ Les gouvernements provinciaux et territoriaux',
"Le Canada est une fédération de 10 provinces et 3 territoires. Chacun possède son propre gouvernement et ses champs de compétence exclusifs.",
"""<section class="section"><div class="conteneur">
<div class="encadre fade-in" style="margin-bottom:32px;">
  <h3 style="margin-bottom:12px;">⚖️ Compétences provinciales exclusives (Art. 92)</h3>
  <div style="display:flex;flex-wrap:wrap;gap:8px;">
    <span style="background:var(--rouge-clair);color:var(--rouge);padding:5px 12px;border-radius:20px;font-size:.82rem;font-weight:700;">🏥 Santé</span>
    <span style="background:#e3f0ff;color:#1565C0;padding:5px 12px;border-radius:20px;font-size:.82rem;font-weight:700;">📚 Éducation</span>
    <span style="background:#e8f5e9;color:#2E7D32;padding:5px 12px;border-radius:20px;font-size:.82rem;font-weight:700;">🌲 Ressources naturelles</span>
    <span style="background:#f3e5f5;color:#6A1B9A;padding:5px 12px;border-radius:20px;font-size:.82rem;font-weight:700;">⚖️ Droit civil</span>
    <span style="background:#fff8e1;color:#E65100;padding:5px 12px;border-radius:20px;font-size:.82rem;font-weight:700;">🏘️ Gouvernements locaux</span>
    <span style="background:var(--rouge-clair);color:var(--rouge);padding:5px 12px;border-radius:20px;font-size:.82rem;font-weight:700;">👷 Travail</span>
    <span style="background:#e3f0ff;color:#1565C0;padding:5px 12px;border-radius:20px;font-size:.82rem;font-weight:700;">🏢 Propriété</span>
  </div>
</div>

<h2 style="margin-bottom:18px;">🍁 Les 10 provinces (2025–2026)</h2>
<div class="grille-2" style="margin-bottom:32px;">
  <div class="carte fade-in"><h3>🏙️ Ontario</h3><p><strong>PM :</strong> Doug Ford (PC) · <strong>Capitale :</strong> Toronto · <strong>Pop. :</strong> ~15,6 M<br><strong>Assemblée :</strong> Législature de l'Ontario</p><a href="https://www.ontario.ca/fr" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">ontario.ca →</a></div>
  <div class="carte fade-in"><h3>🔵 Québec</h3><p><strong>PM :</strong> François Legault (CAQ) · <strong>Capitale :</strong> Québec · <strong>Pop. :</strong> ~9,0 M<br><strong>Assemblée :</strong> Assemblée nationale du Québec</p><a href="https://www.quebec.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">quebec.ca →</a></div>
  <div class="carte fade-in"><h3>🌊 Colombie-Britannique</h3><p><strong>PM :</strong> David Eby (NPD) · <strong>Capitale :</strong> Victoria · <strong>Pop. :</strong> ~5,6 M</p><a href="https://www2.gov.bc.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">gov.bc.ca →</a></div>
  <div class="carte fade-in"><h3>🌾 Alberta</h3><p><strong>PM :</strong> Danielle Smith (UCP) · <strong>Capitale :</strong> Edmonton · <strong>Pop. :</strong> ~4,8 M</p><a href="https://www.alberta.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">alberta.ca →</a></div>
  <div class="carte fade-in"><h3>🌾 Saskatchewan</h3><p><strong>PM :</strong> Scott Moe (SK Party) · <strong>Capitale :</strong> Regina · <strong>Pop. :</strong> ~1,2 M</p><a href="https://www.saskatchewan.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">saskatchewan.ca →</a></div>
  <div class="carte fade-in"><h3>🌾 Manitoba</h3><p><strong>PM :</strong> Wab Kinew (NPD) · <strong>Capitale :</strong> Winnipeg · <strong>Pop. :</strong> ~1,4 M</p><a href="https://www.gov.mb.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">gov.mb.ca →</a></div>
  <div class="carte fade-in"><h3>🌊 Nouveau-Brunswick</h3><p><strong>PM :</strong> Susan Holt (Libéral) · <strong>Capitale :</strong> Fredericton · Province officiellement bilingue</p><a href="https://www2.gnb.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">gnb.ca →</a></div>
  <div class="carte fade-in"><h3>🌊 Nouvelle-Écosse</h3><p><strong>PM :</strong> Tim Houston (PC) · <strong>Capitale :</strong> Halifax · <strong>Pop. :</strong> ~1,1 M</p><a href="https://www.novascotia.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">novascotia.ca →</a></div>
  <div class="carte fade-in"><h3>🌊 Île-du-Prince-Édouard</h3><p><strong>PM :</strong> Rob Lantz (PC) · <strong>Capitale :</strong> Charlottetown · Plus petite province du Canada</p><a href="https://www.princeedwardisland.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">pei.ca →</a></div>
  <div class="carte fade-in"><h3>🌊 Terre-Neuve-et-Labrador</h3><p><strong>PM :</strong> Andrew Furey (Libéral) · <strong>Capitale :</strong> St. John's · Entrée dans la Confédération en 1949</p><a href="https://www.gov.nl.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">gov.nl.ca →</a></div>
</div>

<h2 style="margin-bottom:14px;">🗺️ Les 3 territoires</h2>
<div class="grille-3" style="margin-bottom:32px;">
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;"><h3>❄️ Nunavut</h3><p>Créé en 1999. Territoire à majorité inuite. Capitale : Iqaluit. Gouvernement consensuel sans partis politiques.</p><a href="https://www.gov.nu.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">gov.nu.ca →</a></div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;text-align:center;"><h3>🌲 T.N.-O.</h3><p>Gouvernement consensuel. Capitale : Yellowknife. Aucun parti politique — modèle unique au Canada.</p><a href="https://www.gov.nt.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">gov.nt.ca →</a></div>
  <div class="carte fade-in" style="border-top:4px solid #B8860B;text-align:center;"><h3>⛰️ Yukon</h3><p>PM : Ranj Pillai (Libéral). Capitale : Whitehorse. Fort potentiel minier et touristique.</p><a href="https://yukon.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">yukon.ca →</a></div>
</div>

<div class="encadre fade-in"><h3 style="margin-bottom:8px;">💰 La péréquation fédérale</h3>
  <p>Art. 36 de la Loi constitutionnelle de 1982. Transfère des fonds aux provinces moins nanties pour leur permettre d'offrir des services publics comparables. En 2024-2025, les transferts fédéraux totaux ont dépassé 100 milliards de dollars.</p>
</div>
</div></section>""")

mk('municipal.html','Le gouvernement municipal au Canada',
'Comprendre les gouvernements locaux : maires, conseils, taxes foncières, compétences et participation citoyenne.',
'Gouvernement › Municipal','🏘️ Le gouvernement municipal',
"Les municipalités gèrent l'essentiel du quotidien : voirie, eau, parcs, zonage. Elles sont les gouvernements les plus proches des citoyens.",
"""<section class="section"><div class="conteneur">
<div class="encadre fade-in" style="margin-bottom:32px;background:var(--rouge-clair);border-left:5px solid var(--rouge);">
  <h3 style="color:var(--rouge);">⚠️ Les municipalités : créatures des provinces</h3>
  <p>Les municipalités ne sont pas mentionnées dans la Constitution. Elles sont créées par des lois provinciales et n'exercent que les pouvoirs que les provinces leur délèguent. Elles n'ont aucune existence constitutionnelle propre.</p>
</div>

<div class="grille-2" style="margin-bottom:32px;">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;color:var(--rouge);">⚙️ Compétences directes</h3>
    <ul class="services-liste">
      <li>Voirie locale, trottoirs, éclairage public</li>
      <li>Collecte des ordures et recyclage</li>
      <li>Eau potable et eaux usées</li>
      <li>Parcs, espaces verts, installations récréatives</li>
      <li>Zonage et permis de construction</li>
      <li>Bibliothèques municipales</li>
      <li>Services de police locaux (ou contrat GRC)</li>
      <li>Services d'incendie</li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;color:#1565C0;">💰 La taxe foncière</h3>
    <p>Principale source de revenus. Calculée : <strong>valeur d'évaluation × taux de taxation</strong>.</p>
    <ul class="services-liste" style="margin-top:10px;">
      <li>Valeur évaluée ≠ valeur marchande (souvent inférieure)</li>
      <li>Rôle révisé tous les 3–4 ans selon la province</li>
      <li>Possible de contester auprès du tribunal administratif</li>
      <li>Des crédits provinciaux remboursent une partie aux ménages à faible revenu</li>
    </ul>
  </div>
</div>

<h2 style="margin-bottom:16px;">🗳️ Participer à la démocratie locale</h2>
<div class="grille-3" style="margin-bottom:32px;">
  <div class="carte fade-in"><h3>🗳️ Voter</h3><p>Élections municipales tous les 4 ans. Dans plusieurs provinces, les résidents permanents peuvent voter aux élections locales.</p></div>
  <div class="carte fade-in"><h3>🎤 Assemblées publiques</h3><p>Les séances du conseil sont publiques. Les citoyens peuvent s'inscrire pour prendre la parole dans la période de questions.</p></div>
  <div class="carte fade-in"><h3>📋 Comités consultatifs</h3><p>Urbanisme, environnement, culture — de nombreux comités sont ouverts à la participation citoyenne bénévole.</p></div>
</div>

<div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Ressources municipales</h3>
  <ul class="services-liste">
    <li><a href="https://www.fcm.ca/fr" class="services-lien" target="_blank" rel="noopener">Fédération canadienne des municipalités (FCM)</a></li>
    <li><a href="https://www.ville.montreal.qc.ca" class="services-lien" target="_blank" rel="noopener">Ville de Montréal</a></li>
    <li><a href="https://www.toronto.ca" class="services-lien" target="_blank" rel="noopener">City of Toronto</a></li>
    <li><a href="https://www.vancouver.ca" class="services-lien" target="_blank" rel="noopener">City of Vancouver</a></li>
    <li><a href="https://www.ottawa.ca" class="services-lien" target="_blank" rel="noopener">Ville d'Ottawa</a></li>
  </ul>
</div>
</div></section>""")

mk('judiciaire.html','Le système judiciaire canadien',
'Comprendre les tribunaux canadiens : Cour suprême, cours fédérales, cours provinciales, aide juridique et droits de l\'accusé.',
'Droits › Système judiciaire','⚖️ Le système judiciaire canadien',
"Un système indépendant à deux niveaux — fédéral et provincial — avec la Cour suprême au sommet.",
"""<section class="section"><div class="conteneur">
<h2 style="margin-bottom:20px;">🏛️ Hiérarchie des tribunaux</h2>
<div style="max-width:680px;margin:0 auto 36px;display:flex;flex-direction:column;gap:5px;">
  <div style="background:var(--rouge);color:#fff;padding:16px 20px;border-radius:12px;text-align:center;"><strong>Cour suprême du Canada</strong><br><span style="font-size:.8rem;opacity:.9;">Cour d'appel finale · 9 juges · Ottawa</span></div>
  <div style="display:flex;gap:5px;">
    <div style="flex:1;background:#1565C0;color:#fff;padding:12px 14px;border-radius:10px;text-align:center;"><strong style="font-size:.88rem;">Cour d'appel fédérale</strong><br><span style="font-size:.74rem;opacity:.9;">Appels des décisions fédérales</span></div>
    <div style="flex:1;background:#1565C0;color:#fff;padding:12px 14px;border-radius:10px;text-align:center;"><strong style="font-size:.88rem;">Cours d'appel provinciales</strong><br><span style="font-size:.74rem;opacity:.9;">Dernière instance provinciale</span></div>
  </div>
  <div style="display:flex;gap:5px;">
    <div style="flex:1;background:#2E7D32;color:#fff;padding:12px 14px;border-radius:10px;text-align:center;"><strong style="font-size:.88rem;">Cour fédérale</strong><br><span style="font-size:.74rem;opacity:.9;">Immigration, droits, brevets</span></div>
    <div style="flex:1;background:#2E7D32;color:#fff;padding:12px 14px;border-radius:10px;text-align:center;"><strong style="font-size:.88rem;">Cours supérieures provinciales</strong><br><span style="font-size:.74rem;opacity:.9;">Juges nommés par Ottawa (art. 96)</span></div>
  </div>
  <div style="display:flex;gap:5px;">
    <div style="flex:1;background:#E65100;color:#fff;padding:12px 14px;border-radius:10px;text-align:center;"><strong style="font-size:.88rem;">Cour canadienne de l'impôt</strong><br><span style="font-size:.74rem;opacity:.9;">Litiges fiscaux fédéraux</span></div>
    <div style="flex:1;background:#E65100;color:#fff;padding:12px 14px;border-radius:10px;text-align:center;"><strong style="font-size:.88rem;">Cours provinciales</strong><br><span style="font-size:.74rem;opacity:.9;">Infractions, petites créances</span></div>
  </div>
</div>

<div class="grille-2" style="margin-bottom:32px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);">
    <h3>🔴 La Cour suprême</h3>
    <p>Fondée en 1875, cour d'appel finale depuis 1949. Ses décisions font jurisprudence dans tout le pays.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>9 juges nommés sur recommandation du Premier ministre</li>
      <li>Par convention : 3 juges du Québec (droit civil)</li>
      <li>Sélectionne elle-même les causes (autorisation d'appel)</li>
      <li>Peut être saisie par renvoi du gouvernement fédéral</li>
    </ul></div></details>
    <a href="https://www.scc-csc.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">scc-csc.ca →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;">
    <h3>🔵 Droits de l'accusé (Charte)</h3>
    <ul class="services-liste" style="margin-top:8px;">
      <li><strong>Art. 7</strong> — Vie, liberté, sécurité de la personne</li>
      <li><strong>Art. 9</strong> — Pas de détention arbitraire</li>
      <li><strong>Art. 10b)</strong> — Droit à un avocat sans délai</li>
      <li><strong>Art. 11d)</strong> — Présomption d'innocence</li>
      <li><strong>Art. 11e)</strong> — Caution raisonnable</li>
      <li><strong>Art. 11h)</strong> — Protection contre la double incrimination</li>
    </ul>
  </div>
</div>

<div class="grille-2">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🆘 Aide juridique</h3>
    <p>Chaque province administre son programme d'aide juridique pour les personnes sans ressources.</p>
    <ul class="services-liste" style="margin-top:10px;">
      <li><a href="https://www.legalaid.on.ca" class="services-lien" target="_blank" rel="noopener">Aide juridique Ontario</a></li>
      <li><a href="https://www.csj.qc.ca" class="services-lien" target="_blank" rel="noopener">Commission des services juridiques (QC)</a></li>
      <li><a href="https://legalaid.bc.ca" class="services-lien" target="_blank" rel="noopener">Legal Aid BC</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Sources judiciaires</h3>
    <ul class="services-liste">
      <li><a href="https://www.scc-csc.ca" class="services-lien" target="_blank" rel="noopener">Cour suprême du Canada</a></li>
      <li><a href="https://www.fct-cf.gc.ca" class="services-lien" target="_blank" rel="noopener">Cour fédérale</a></li>
      <li><a href="https://www.justice.gc.ca" class="services-lien" target="_blank" rel="noopener">Ministère de la Justice Canada</a></li>
      <li><a href="https://www.canlii.org" class="services-lien" target="_blank" rel="noopener">CanLII — Jurisprudence gratuite</a></li>
    </ul>
  </div>
</div>
</div></section>""")

print("Phase 2 : 8/8 OK")
