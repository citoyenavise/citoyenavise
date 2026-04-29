#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, r'C:\Users\Dave\citoyenavise')
from gen1 import mk
os.chdir(r'C:\Users\Dave\citoyenavise')

# ── PHASE 4 ──────────────────────────────────────────────────

mk('elus.html','Répertoire de vos élus canadiens',
'Trouvez vos représentants élus fédéraux, provinciaux et municipaux : députés, sénateurs, maires et conseillers.',
'Participer › Élus','🏛️ Trouver vos élus',
"Votre voix compte — mais encore faut-il savoir à qui vous adresser. Ce répertoire vous aide à identifier et contacter vos représentants élus.",
"""<section class="section"><div class="conteneur">
<div class="grille-3" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🇨🇦</div>
    <h3>Niveau fédéral</h3>
    <p>343 députés à la Chambre des communes et 105 sénateurs. Représentent vos intérêts à Ottawa.</p>
    <a href="https://www.ourcommons.ca/members/fr" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Trouver votre député →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🏙️</div>
    <h3>Niveau provincial</h3>
    <p>Chaque province a ses propres représentants élus à l'assemblée législative ou à l'Assemblée nationale (QC).</p>
    <a href="https://www.assnat.qc.ca/fr/deputes/index.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Députés QC →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🏘️</div>
    <h3>Niveau municipal</h3>
    <p>Maires, conseillers d'arrondissement, conseillers de ville — vos élus les plus proches de votre quotidien.</p>
    <a href="https://www.ville.montreal.qc.ca/portal/page?_pageid=5798,42657625&_dad=portal&_schema=PORTAL" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Élus Montréal →</a>
  </div>
</div>

<h2 style="margin-bottom:18px;">🔍 Trouver votre représentant fédéral</h2>
<div class="encadre fade-in" style="margin-bottom:28px;">
  <p style="margin-bottom:14px;">Entrez votre code postal sur le site d'Élections Canada ou de la Chambre des communes pour trouver votre circonscription et votre député.</p>
  <div class="grille-2">
    <ul class="services-liste">
      <li><a href="https://www.ourcommons.ca/members/fr" class="services-lien" target="_blank" rel="noopener">Chambre des communes — Annuaire des députés</a></li>
      <li><a href="https://sencanada.ca/fr/senateurs" class="services-lien" target="_blank" rel="noopener">Sénat du Canada — Annuaire des sénateurs</a></li>
      <li><a href="https://www.elections.ca/scripts/vis/FindED?lang=f&act=fd" class="services-lien" target="_blank" rel="noopener">Élections Canada — Trouver votre circonscription</a></li>
    </ul>
    <ul class="services-liste">
      <li>Le site du Parlement offre les coordonnées de bureau, les adresses courriel et les numéros de téléphone de tous les élus fédéraux</li>
      <li>Chaque député a une adresse de bureau dans sa circonscription pour les rencontres en personne</li>
    </ul>
  </div>
</div>

<h2 style="margin-bottom:18px;">🏙️ Répertoire provincial par province</h2>
<div class="grille-2" style="margin-bottom:28px;">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">Assemblées législatives</h3>
    <ul class="services-liste">
      <li><a href="https://www.assnat.qc.ca" class="services-lien" target="_blank" rel="noopener">Assemblée nationale du Québec</a></li>
      <li><a href="https://www.ola.org" class="services-lien" target="_blank" rel="noopener">Assemblée législative de l'Ontario</a></li>
      <li><a href="https://www.leg.bc.ca" class="services-lien" target="_blank" rel="noopener">Legislative Assembly of BC</a></li>
      <li><a href="https://www.assembly.ab.ca" class="services-lien" target="_blank" rel="noopener">Legislative Assembly of Alberta</a></li>
      <li><a href="https://www.legassembly.sk.ca" class="services-lien" target="_blank" rel="noopener">Legislative Assembly of Saskatchewan</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">Comment contacter efficacement un élu</h3>
    <ul class="services-liste">
      <li><strong>Courriel</strong> — Précis, avec sujet clair et vos coordonnées</li>
      <li><strong>Lettre</strong> — Plus formelle, souvent plus remarquée</li>
      <li><strong>Bureau de circonscription</strong> — Pour les problèmes personnels (immigration, AE)</li>
      <li><strong>Assemblée publique</strong> — Pour exprimer une position citoyenne</li>
      <li>Identifiez-vous toujours comme électeur de la circonscription</li>
    </ul>
  </div>
</div>
</div></section>""")

mk('petitions.html','Pétitions officielles au Canada',
'Guide des pétitions officielles : pétitions à la Chambre, e-pétitions fédérales, comment signer et comment en créer une.',
'Participer › Pétitions','📋 Pétitions officielles au Canada',
"Une pétition est l'une des plus anciennes formes de participation démocratique. Au Canada, le droit de pétition remonte à la Magna Carta de 1215.",
"""<section class="section"><div class="conteneur">
<div class="grille-2" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);">
    <h3>📄 Pétitions sur papier à la Chambre</h3>
    <p>Une pétition traditionnelle doit être signée à la main par au moins <strong>25 citoyens canadiens ou résidents permanents</strong>. Elle est ensuite présentée par un député à la Chambre.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Doit porter sur une question de compétence fédérale</li>
      <li>Doit être rédigée en français ou en anglais</li>
      <li>Les signataires doivent indiquer leur nom, adresse et signature</li>
      <li>Présentée par un député (de n'importe quel parti)</li>
      <li>Le gouvernement doit répondre dans les 45 jours</li>
    </ul></div></details>
    <a href="https://www.ourcommons.ca/petitions/fr/petitions/Guidance" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Guide pétitions papier →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;">
    <h3>💻 e-Pétitions électroniques</h3>
    <p>Depuis 2015, les citoyens peuvent signer et lancer des pétitions directement en ligne sur le site de la Chambre des communes. Minimum <strong>500 signatures</strong> en 120 jours.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Un député parrain doit approuver la pétition avant sa mise en ligne</li>
      <li>Ouvertes pendant 120 jours maximum</li>
      <li>Réponse gouvernementale obligatoire dans les 45 jours après présentation</li>
      <li>Toutes les e-pétitions actives sont publiques et consultables</li>
      <li>Plus de 1 000 e-pétitions ont été lancées depuis 2015</li>
    </ul></div></details>
    <a href="https://www.ourcommons.ca/petitions/fr" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">e-Pétitions actives →</a>
  </div>
</div>

<h2 style="margin-bottom:18px;">📝 Comment lancer une pétition</h2>
<div class="encadre fade-in" style="margin-bottom:28px;">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;text-align:center;">
    <div style="padding:14px;background:var(--rouge-clair);border-radius:10px;"><div style="font-weight:900;color:var(--rouge);font-size:.8rem;">Étape 1</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">Rédiger</div><div style="font-size:.74rem;color:var(--gris);margin-top:3px;">Formulation claire en français ou anglais</div></div>
    <div style="padding:14px;background:#e3f0ff;border-radius:10px;"><div style="font-weight:900;color:#1565C0;font-size:.8rem;">Étape 2</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">Trouver un parrain</div><div style="font-size:.74rem;color:var(--gris);margin-top:3px;">Un député doit appuyer votre demande</div></div>
    <div style="padding:14px;background:#e8f5e9;border-radius:10px;"><div style="font-weight:900;color:#2E7D32;font-size:.8rem;">Étape 3</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">Soumettre</div><div style="font-size:.74rem;color:var(--gris);margin-top:3px;">Envoi en ligne ou par courrier</div></div>
    <div style="padding:14px;background:#fff8e1;border-radius:10px;"><div style="font-weight:900;color:#E65100;font-size:.8rem;">Étape 4</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">Collecter</div><div style="font-size:.74rem;color:var(--gris);margin-top:3px;">500 signatures en 120 jours</div></div>
    <div style="padding:14px;background:#f3e5f5;border-radius:10px;"><div style="font-weight:900;color:#6A1B9A;font-size:.8rem;">Étape 5</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;">Présenter</div><div style="font-size:.74rem;color:var(--gris);margin-top:3px;">Le député présente à la Chambre</div></div>
    <div style="padding:14px;background:var(--noir-doux);border-radius:10px;"><div style="font-weight:900;color:#ffd700;font-size:.8rem;">Étape 6</div><div style="font-size:.86rem;font-weight:700;margin-top:4px;color:#fff;">Réponse</div><div style="font-size:.74rem;color:#aaa;margin-top:3px;">Gouvernement répond en 45 jours</div></div>
  </div>
</div>

<div class="grille-2">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🏙️ Pétitions provinciales</h3>
    <ul class="services-liste">
      <li><a href="https://www.assnat.qc.ca/fr/exprimez-votre-opinion/petition/index.html" class="services-lien" target="_blank" rel="noopener">Pétitions à l'Assemblée nationale du Québec</a></li>
      <li><a href="https://www.ola.org/fr/affaires-parlementaires/petitions" class="services-lien" target="_blank" rel="noopener">Pétitions à l'Assemblée législative de l'Ontario</a></li>
      <li>Chaque province a ses propres règles de présentation et seuils</li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Ressources officielles</h3>
    <ul class="services-liste">
      <li><a href="https://www.ourcommons.ca/petitions/fr" class="services-lien" target="_blank" rel="noopener">e-Pétitions — Chambre des communes</a></li>
      <li><a href="https://www.ourcommons.ca/petitions/fr/petitions/Guidance" class="services-lien" target="_blank" rel="noopener">Guide complet des pétitions</a></li>
    </ul>
  </div>
</div>
</div></section>""")

mk('groupes.html','Organisations civiques canadiennes',
'Répertoire des organisations civiques, droits humains, environnement, peuples autochtones et médias indépendants au Canada.',
'Participer › Groupes','🤝 Organisations civiques canadiennes',
"S'engager dans la société civile est une forme puissante de participation démocratique. Voici les organisations clés par thématique.",
"""<section class="section"><div class="conteneur">
<div class="grille-2" style="margin-bottom:32px;">
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:var(--rouge);">⚖️ Droits et libertés civiles</h3>
    <ul class="services-liste">
      <li><a href="https://www.ccla.org" class="services-lien" target="_blank" rel="noopener">Association canadienne des libertés civiles (ACLC)</a></li>
      <li><a href="https://liguedesdroits.ca" class="services-lien" target="_blank" rel="noopener">Ligue des droits et libertés (Québec)</a></li>
      <li><a href="https://www.amnesty.ca" class="services-lien" target="_blank" rel="noopener">Amnistie internationale Canada</a></li>
      <li><a href="https://droitshumains.ca" class="services-lien" target="_blank" rel="noopener">Commission canadienne des droits de la personne</a></li>
      <li><a href="https://www.chrc-ccdp.gc.ca" class="services-lien" target="_blank" rel="noopener">CCDP — Plaintes en droits de la personne</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:#2E7D32;">🌿 Environnement et climat</h3>
    <ul class="services-liste">
      <li><a href="https://www.ecojustice.ca" class="services-lien" target="_blank" rel="noopener">Ecojustice — Droit de l'environnement</a></li>
      <li><a href="https://climatfast.ca" class="services-lien" target="_blank" rel="noopener">Climate Fast — Action climatique</a></li>
      <li><a href="https://www.davidsuzuki.org/fr" class="services-lien" target="_blank" rel="noopener">Fondation David Suzuki</a></li>
      <li><a href="https://environmentaldefence.ca" class="services-lien" target="_blank" rel="noopener">Environmental Defence Canada</a></li>
      <li><a href="https://greenpeace.ca/fr" class="services-lien" target="_blank" rel="noopener">Greenpeace Canada</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:#8B4513;">🪶 Peuples autochtones</h3>
    <ul class="services-liste">
      <li><a href="https://www.afn.ca" class="services-lien" target="_blank" rel="noopener">Assemblée des Premières Nations (APN)</a></li>
      <li><a href="https://www.itk.ca" class="services-lien" target="_blank" rel="noopener">Inuit Tapiriit Kanatami (ITK)</a></li>
      <li><a href="https://www.cvrc-nctr.ca" class="services-lien" target="_blank" rel="noopener">Centre national pour la vérité et réconciliation</a></li>
      <li><a href="https://www.nwac.ca" class="services-lien" target="_blank" rel="noopener">Association des femmes autochtones du Canada</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:#1565C0;">🏘️ Logement et pauvreté</h3>
    <ul class="services-liste">
      <li><a href="https://www.frapru.qc.ca" class="services-lien" target="_blank" rel="noopener">FRAPRU — Logement social (QC)</a></li>
      <li><a href="https://housingrightsca.ca" class="services-lien" target="_blank" rel="noopener">Housing Rights Canada</a></li>
      <li><a href="https://www.cpabc.bc.ca" class="services-lien" target="_blank" rel="noopener">Campaign to End Homelessness</a></li>
      <li><a href="https://www.pauvrete.qc.ca" class="services-lien" target="_blank" rel="noopener">Collectif pour un Québec sans pauvreté</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:#6A1B9A;">🏳️‍🌈 Égalité et diversité</h3>
    <ul class="services-liste">
      <li><a href="https://egale.ca" class="services-lien" target="_blank" rel="noopener">Egale Canada — Droits LGBTQ+</a></li>
      <li><a href="https://www.nawl.ca" class="services-lien" target="_blank" rel="noopener">Association nationale femmes et droit</a></li>
      <li><a href="https://ccrweb.ca" class="services-lien" target="_blank" rel="noopener">Conseil canadien pour les réfugiés</a></li>
      <li><a href="https://www.kairocanada.org" class="services-lien" target="_blank" rel="noopener">KAIROS — Justice mondiale</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:#E65100;">📰 Médias indépendants</h3>
    <ul class="services-liste">
      <li><a href="https://thenarwhal.ca/fr" class="services-lien" target="_blank" rel="noopener">The Narwhal — Environnement</a></li>
      <li><a href="https://www.thetyloon.com" class="services-lien" target="_blank" rel="noopener">Le Devoir (QC)</a></li>
      <li><a href="https://ricochet.media" class="services-lien" target="_blank" rel="noopener">Ricochet Media — À but non lucratif</a></li>
      <li><a href="https://canadaland.com" class="services-lien" target="_blank" rel="noopener">Canadaland — Journalisme indépendant</a></li>
    </ul>
  </div>
</div>
</div></section>""")

mk('ressources.html','Bibliothèque de ressources civiques',
'Documents officiels, formulaires gouvernementaux clés, publications parlementaires et outils de référence pour les citoyens canadiens.',
'Ressources','📚 Bibliothèque de ressources civiques',
"L'accès à l'information publique est un droit. Cette bibliothèque centralise les documents essentiels pour tout citoyen canadien.",
"""<section class="section"><div class="conteneur">
<div class="grille-2" style="margin-bottom:32px;">
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:var(--rouge);">📜 Documents constitutionnels</h3>
    <ul class="services-liste">
      <li><a href="https://laws-lois.justice.gc.ca/fra/const/" class="services-lien" target="_blank" rel="noopener">Constitution du Canada — texte intégral</a></li>
      <li><a href="https://laws-lois.justice.gc.ca/fra/const/page-15.html" class="services-lien" target="_blank" rel="noopener">Charte canadienne des droits et libertés</a></li>
      <li><a href="https://laws-lois.justice.gc.ca/fra/lois/C-46/" class="services-lien" target="_blank" rel="noopener">Code criminel du Canada</a></li>
      <li><a href="https://laws-lois.justice.gc.ca/fra/lois/C-12.3/" class="services-lien" target="_blank" rel="noopener">Loi canadienne sur les droits de la personne</a></li>
      <li><a href="https://laws-lois.justice.gc.ca/fra/lois/O-3.01/" class="services-lien" target="_blank" rel="noopener">Loi sur les langues officielles</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:#1565C0;">📋 Formulaires gouvernementaux clés</h3>
    <ul class="services-liste">
      <li><a href="https://www.canada.ca/fr/agence-revenu/services/formulaires-publications/formulaires/t1.html" class="services-lien" target="_blank" rel="noopener">T1 — Déclaration de revenus personnelle</a></li>
      <li><a href="https://www.canada.ca/fr/emploi-developpement-social/services/ae/ae-liste/ae-demande.html" class="services-lien" target="_blank" rel="noopener">Demande d'assurance-emploi</a></li>
      <li><a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/citoyennete-canadienne/demande.html" class="services-lien" target="_blank" rel="noopener">Demande de citoyenneté canadienne</a></li>
      <li><a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/immigrer-canada/carte-rp/renouveler.html" class="services-lien" target="_blank" rel="noopener">Renouvellement carte de résidence permanente</a></li>
      <li><a href="https://www.passport.gc.ca/web/repas-renew.aspx" class="services-lien" target="_blank" rel="noopener">Renouvellement de passeport canadien</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:#2E7D32;">🏛️ Publications parlementaires</h3>
    <ul class="services-liste">
      <li><a href="https://www.ourcommons.ca/documentviewer/fr/44-1/chambre/seance-1/debats" class="services-lien" target="_blank" rel="noopener">Débats de la Chambre (Hansard)</a></li>
      <li><a href="https://www.parl.gc.ca/LegisInfo/fr/chambre/44-1/projets-de-loi" class="services-lien" target="_blank" rel="noopener">Projets de loi en cours</a></li>
      <li><a href="https://www.budget.canada.ca/2026/home-accueil-fr.html" class="services-lien" target="_blank" rel="noopener">Budget fédéral 2026</a></li>
      <li><a href="https://www.canada.ca/fr/secretariat-conseil-tresor/sujets/depenses-gouvernementales/comptes-annuels-canada.html" class="services-lien" target="_blank" rel="noopener">Comptes publics du Canada</a></li>
      <li><a href="https://www.vérificateur-général.gc.ca" class="services-lien" target="_blank" rel="noopener">Rapports du Vérificateur général</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:#6A1B9A;">📊 Données et statistiques</h3>
    <ul class="services-liste">
      <li><a href="https://www.statcan.gc.ca" class="services-lien" target="_blank" rel="noopener">Statistique Canada</a></li>
      <li><a href="https://ouvert.canada.ca" class="services-lien" target="_blank" rel="noopener">Portail du gouvernement ouvert</a></li>
      <li><a href="https://www.elections.ca" class="services-lien" target="_blank" rel="noopener">Élections Canada — Résultats officiels</a></li>
      <li><a href="https://www.canlii.org" class="services-lien" target="_blank" rel="noopener">CanLII — Jurisprudence et législation</a></li>
      <li><a href="https://bdp.parl.ca" class="services-lien" target="_blank" rel="noopener">Bibliothèque du Parlement — Recherche</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:#E65100;">🔓 Accès à l'information</h3>
    <p style="font-size:.88rem;margin-bottom:10px;">La Loi sur l'accès à l'information vous permet de demander des documents gouvernementaux fédéraux. Délai de réponse : 30 jours. Frais : 5 $ (souvent dispensés).</p>
    <ul class="services-liste">
      <li><a href="https://atip-aiprp.apps.gc.ca" class="services-lien" target="_blank" rel="noopener">Portail de demande d'accès à l'information</a></li>
      <li><a href="https://www.oic-ci.gc.ca" class="services-lien" target="_blank" rel="noopener">Commissariat à l'information du Canada</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:12px;color:#B8860B;">🌐 Portails gouvernementaux</h3>
    <ul class="services-liste">
      <li><a href="https://www.canada.ca" class="services-lien" target="_blank" rel="noopener">Canada.ca — Portail central du gouvernement</a></li>
      <li><a href="https://www.justice.gc.ca" class="services-lien" target="_blank" rel="noopener">Ministère de la Justice Canada</a></li>
      <li><a href="https://laws-lois.justice.gc.ca" class="services-lien" target="_blank" rel="noopener">Lois du site de la Justice — Toutes les lois fédérales</a></li>
      <li><a href="https://www.infrastructure.gc.ca" class="services-lien" target="_blank" rel="noopener">Infrastructure Canada</a></li>
    </ul>
  </div>
</div>
</div></section>""")

mk('budget.html','Le budget fédéral canadien',
'Comprendre le budget fédéral 2026 : dépenses, revenus, transferts aux provinces et principaux programmes.',
'Ressources › Budget','💰 Le budget fédéral canadien 2026',
"Le budget fédéral est le plan financier annuel du gouvernement du Canada. Il fixe les priorités de dépenses et la fiscalité pour l'année à venir.",
"""<section class="section"><div class="conteneur">
<div class="grille-3" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">📥</div>
    <h3>Revenus fédéraux</h3>
    <p>~<strong>475 G$</strong> en 2026-2027. Sources : impôt sur le revenu des particuliers (55%), TPS (14%), impôt des sociétés (15%), cotisations d'AE et autres.</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">📤</div>
    <h3>Dépenses fédérales</h3>
    <p>~<strong>519 G$</strong> en 2026-2027. Transferts aux provinces (40%), service de la dette (12%), défense (7%), et programmes directs.</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #E65100;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">📊</div>
    <h3>Déficit projeté</h3>
    <p>~<strong>44 G$</strong> en 2026-2027. La dette fédérale représente environ 42 % du PIB, en baisse par rapport au pic de la pandémie.</p>
  </div>
</div>

<h2 style="margin-bottom:18px;">📋 Où va chaque dollar fédéral ?</h2>
<div class="encadre fade-in" style="margin-bottom:32px;">
  <div style="display:flex;flex-direction:column;gap:8px;">
    <div style="display:flex;align-items:center;gap:12px;"><div style="width:140px;font-size:.84rem;font-weight:700;color:var(--gris-texte);">Transferts sociaux</div><div style="flex:1;background:var(--gris-clair);border-radius:6px;overflow:hidden;height:20px;"><div style="width:40%;height:100%;background:var(--rouge);border-radius:6px;"></div></div><div style="width:40px;font-size:.82rem;font-weight:700;color:var(--rouge);text-align:right;">40%</div></div>
    <div style="display:flex;align-items:center;gap:12px;"><div style="width:140px;font-size:.84rem;font-weight:700;color:var(--gris-texte);">Programmes directs</div><div style="flex:1;background:var(--gris-clair);border-radius:6px;overflow:hidden;height:20px;"><div style="width:28%;height:100%;background:#1565C0;border-radius:6px;"></div></div><div style="width:40px;font-size:.82rem;font-weight:700;color:#1565C0;text-align:right;">28%</div></div>
    <div style="display:flex;align-items:center;gap:12px;"><div style="width:140px;font-size:.84rem;font-weight:700;color:var(--gris-texte);">Service de la dette</div><div style="flex:1;background:var(--gris-clair);border-radius:6px;overflow:hidden;height:20px;"><div style="width:12%;height:100%;background:#E65100;border-radius:6px;"></div></div><div style="width:40px;font-size:.82rem;font-weight:700;color:#E65100;text-align:right;">12%</div></div>
    <div style="display:flex;align-items:center;gap:12px;"><div style="width:140px;font-size:.84rem;font-weight:700;color:var(--gris-texte);">Défense nationale</div><div style="flex:1;background:var(--gris-clair);border-radius:6px;overflow:hidden;height:20px;"><div style="width:7%;height:100%;background:#2E7D32;border-radius:6px;"></div></div><div style="width:40px;font-size:.82rem;font-weight:700;color:#2E7D32;text-align:right;">7%</div></div>
    <div style="display:flex;align-items:center;gap:12px;"><div style="width:140px;font-size:.84rem;font-weight:700;color:var(--gris-texte);">Infrastructure</div><div style="flex:1;background:var(--gris-clair);border-radius:6px;overflow:hidden;height:20px;"><div style="width:6%;height:100%;background:#6A1B9A;border-radius:6px;"></div></div><div style="width:40px;font-size:.82rem;font-weight:700;color:#6A1B9A;text-align:right;">6%</div></div>
    <div style="display:flex;align-items:center;gap:12px;"><div style="width:140px;font-size:.84rem;font-weight:700;color:var(--gris-texte);">Autres</div><div style="flex:1;background:var(--gris-clair);border-radius:6px;overflow:hidden;height:20px;"><div style="width:7%;height:100%;background:#B8860B;border-radius:6px;"></div></div><div style="width:40px;font-size:.82rem;font-weight:700;color:#B8860B;text-align:right;">7%</div></div>
  </div>
</div>

<h2 style="margin-bottom:18px;">🏥 Transferts aux provinces — 2026-2027</h2>
<div class="grille-3" style="margin-bottom:28px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);text-align:center;"><h3>Transfert en santé (TCS)</h3><p style="font-size:1.4rem;font-weight:900;color:var(--rouge);">57,5 G$</p><p style="font-size:.82rem;">+5% par an jusqu'en 2027. Financement de base des systèmes de santé provinciaux.</p></div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;"><h3>Transfert social canadien (TSC)</h3><p style="font-size:1.4rem;font-weight:900;color:#1565C0;">15,9 G$</p><p style="font-size:.82rem;">Éducation postsecondaire, aide sociale et services à l'enfance.</p></div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;text-align:center;"><h3>Péréquation</h3><p style="font-size:1.4rem;font-weight:900;color:#2E7D32;">25,3 G$</p><p style="font-size:.82rem;">7 provinces admissibles (QC, MB, NS, NB, PEI, NL, SK en 2026).</p></div>
</div>

<div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Consulter le budget</h3>
  <ul class="services-liste">
    <li><a href="https://www.budget.canada.ca" class="services-lien" target="_blank" rel="noopener">Budget Canada — Site officiel</a></li>
    <li><a href="https://www.canada.ca/fr/secretariat-conseil-tresor/sujets/depenses-gouvernementales.html" class="services-lien" target="_blank" rel="noopener">Secrétariat du Conseil du Trésor — Dépenses</a></li>
    <li><a href="https://www.pbo-dpb.ca" class="services-lien" target="_blank" rel="noopener">Directeur parlementaire du budget (DPB) — Analyses indépendantes</a></li>
  </ul>
</div>
</div></section>""")

QUIZ_JS = """
<style>
.quiz-conteneur { max-width: 720px; margin: 0 auto; }
.quiz-question { background: var(--blanc); border: 1.5px solid var(--gris-clair); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 20px; transition: var(--transition); }
.quiz-question.correcte { border-color: #2E7D32; background: #f1f8e9; }
.quiz-question.incorrecte { border-color: var(--rouge); background: var(--rouge-clair); }
.quiz-q { font-weight: 700; font-size: 1rem; color: var(--noir-doux); margin-bottom: 16px; }
.quiz-options { display: flex; flex-direction: column; gap: 8px; }
.quiz-opt { padding: 10px 16px; border-radius: 8px; border: 1.5px solid var(--gris-clair); background: var(--blanc); cursor: pointer; font-size: .9rem; text-align: left; transition: var(--transition); }
.quiz-opt:hover { border-color: var(--rouge); background: var(--rouge-clair); }
.quiz-opt.bonne { background: #e8f5e9; border-color: #2E7D32; color: #1B5E20; font-weight: 700; }
.quiz-opt.mauvaise { background: var(--rouge-clair); border-color: var(--rouge); color: var(--rouge-fonce); }
.quiz-explication { margin-top: 12px; font-size: .84rem; color: var(--gris-texte); padding: 10px 14px; background: rgba(255,255,255,.7); border-radius: 8px; display: none; }
.quiz-score { text-align: center; padding: 32px; background: var(--blanc); border-radius: var(--radius-lg); border: 2px solid var(--gris-clair); display: none; }
.quiz-score-nb { font-size: 3rem; font-weight: 900; color: var(--rouge); }
#quiz-btn-reset { display: none; }
</style>
<script>
var QUIZ = [
  {q:"Combien de sénateurs compte le Sénat canadien ?",opts:["90","105","120","75"],r:1,x:"Le Sénat est composé de 105 sénateurs nommés par le Gouverneur général, représentant 4 divisions régionales."},
  {q:"Quelle loi constitutionnelle a introduit la Charte canadienne des droits et libertés ?",opts:["Loi de 1867","Loi de 1982","Loi sur les langues officielles","Loi sur la Cour suprême"],r:1,x:"La Charte fait partie de la Loi constitutionnelle de 1982, qui a rapatrié la Constitution du Royaume-Uni."},
  {q:"Quel est le taux de remplacement de l'assurance-emploi régulière ?",opts:["40%","55%","65%","70%"],r:1,x:"L'AE verse 55% de votre rémunération hebdomadaire assurable, jusqu'au maximum annuel assurable."},
  {q:"Combien d'heures de présence physique sont requises pour la citoyenneté canadienne ?",opts:["730 jours","1095 jours","1460 jours","500 jours"],r:1,x:"1 095 jours de présence physique sur les 5 années précédant la demande de citoyenneté."},
  {q:"Quel article de la Constitution définit les compétences exclusives fédérales ?",opts:["Article 36","Article 91","Article 15","Article 33"],r:1,x:"L'article 91 de la Loi constitutionnelle de 1867 énumère les 29 chefs de compétence fédérale exclusive."},
  {q:"Quel principe de la Loi canadienne sur la santé garantit que tous les résidents sont couverts ?",opts:["Accessibilité","Intégralité","Universalité","Transférabilité"],r:2,x:"L'universalité garantit que tous les résidents d'une province ont droit à la couverture d'assurance-santé."},
  {q:"Combien d'appels à l'action la Commission de vérité et réconciliation a-t-elle formulés ?",opts:["46","94","231","150"],r:1,x:"La CVR a formulé 94 appels à l'action dans son rapport final de 2015 sur les séquelles des pensionnats autochtones."},
  {q:"Quelle est la clause dérogatoire dans la Charte canadienne ?",opts:["Article 1","Article 15","Article 24","Article 33"],r:3,x:"L'article 33 permet à un parlement de déclarer qu'une loi s'applique nonobstant certains droits de la Charte. Valable 5 ans, renouvelable."},
  {q:"Quel est le plafond de cotisation au CELI en 2025 ?",opts:["5 000 $","6 500 $","7 000 $","8 000 $"],r:2,x:"Le plafond annuel de cotisation au CELI est de 7 000 $ en 2025. Les droits inutilisés sont cumulatifs."},
  {q:"Quel est le taux d'imposition fédéral sur les revenus au-delà de 220 000 $ en 2025 ?",opts:["29%","26%","33%","39%"],r:2,x:"La tranche la plus élevée du barème fédéral 2025 est de 33% pour les revenus imposables supérieurs à 220 000 $."},
  {q:"Combien de juges siègent à la Cour suprême du Canada ?",opts:["7","9","11","13"],r:1,x:"La Cour suprême compte 9 juges, dont 3 doivent provenir du Québec par convention constitutionnelle."},
  {q:"Quelle organisation nationale représente les peuples inuits du Canada ?",opts:["APN","ITK","MNC","AFAC"],r:1,x:"Inuit Tapiriit Kanatami (ITK) représente les ~70 000 Inuits du Canada dans les 4 régions de l'Inuit Nunangat."}
];

var score = 0;
var total = QUIZ.length;

function buildQuiz() {
  var c = document.getElementById('quiz-zone');
  if (!c) return;
  c.innerHTML = '';
  QUIZ.forEach(function(item, i) {
    var div = document.createElement('div');
    div.className = 'quiz-question';
    div.innerHTML = '<div class="quiz-q">Q' + (i+1) + '. ' + item.q + '</div>' +
      '<div class="quiz-options" id="opts-' + i + '">' +
      item.opts.map(function(o,j) {
        return '<button class="quiz-opt" onclick="repondre(' + i + ',' + j + ')">' + o + '</button>';
      }).join('') +
      '</div>' +
      '<div class="quiz-explication" id="expl-' + i + '">' + item.x + '</div>';
    c.appendChild(div);
  });
}

function repondre(qi, oi) {
  var opts = document.querySelectorAll('#opts-' + qi + ' .quiz-opt');
  opts.forEach(function(btn) { btn.disabled = true; });
  var correct = QUIZ[qi].r;
  opts[correct].classList.add('bonne');
  if (oi !== correct) { opts[oi].classList.add('mauvaise'); } else { score++; }
  var expl = document.getElementById('expl-' + qi);
  expl.style.display = 'block';

  var answered = document.querySelectorAll('.quiz-opt:disabled').length / QUIZ[0].opts.length;
  if (Math.floor(answered) === total) { showScore(); }
}

function showScore() {
  var s = document.getElementById('quiz-score');
  var pct = Math.round(score/total*100);
  var msg = pct >= 80 ? '🏆 Excellent !' : pct >= 60 ? '👍 Bon résultat !' : '📚 Continuez à apprendre !';
  s.innerHTML = '<div class="quiz-score-nb">' + score + ' / ' + total + '</div>' +
    '<div style="font-size:1.1rem;font-weight:700;margin:10px 0;">' + msg + '</div>' +
    '<div style="color:var(--gris-texte);font-size:.9rem;">Vous avez répondu correctement à ' + pct + '% des questions.</div>' +
    '<button class="btn btn-rouge" style="margin-top:20px;" onclick="resetQuiz()">Recommencer →</button>';
  s.style.display = 'block';
}

function resetQuiz() {
  score = 0;
  document.getElementById('quiz-score').style.display = 'none';
  buildQuiz();
}

document.addEventListener('DOMContentLoaded', buildQuiz);
</script>"""

mk('quiz.html','Quiz civique canadien',
'Testez vos connaissances sur la démocratie, la Constitution, les droits et les services du Canada.',
'Ressources › Quiz','🎯 Quiz civique canadien',
"12 questions pour tester vos connaissances sur la démocratie, la Constitution, vos droits et les services publics du Canada.",
"""<section class="section"><div class="conteneur">
<div class="quiz-conteneur">
  <div class="encadre fade-in" style="margin-bottom:28px;text-align:center;">
    <p>📋 <strong>12 questions</strong> · Toutes sources officielles · Pas de jugement — juste l'apprentissage</p>
  </div>
  <div id="quiz-zone"></div>
  <div class="quiz-score" id="quiz-score"></div>
</div>
</div></section>""", extra=QUIZ_JS)

print("Phase 4 : 6/6 OK")
print("="*40)
print("Total : 22/22 pages générées.")
