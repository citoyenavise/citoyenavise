#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys
sys.path.insert(0, r'C:\Users\Dave\citoyenavise')
from gen1 import mk
os.chdir(r'C:\Users\Dave\citoyenavise')

# ── PHASE 3 ──────────────────────────────────────────────────

mk('impots.html','Guide fiscal canadien — Déclaration de revenus',
'Tout savoir sur la déclaration de revenus au Canada : dates, tranches d\'imposition, crédits et services gratuits.',
'Services › Impôts','💰 Guide fiscal canadien',
"La déclaration de revenus finance les services publics que vous utilisez chaque jour. Comprendre le système vous permet de ne rien manquer.",
"""<section class="section"><div class="conteneur">
<div class="grille-3" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">📅</div>
    <h3>Dates limites 2026</h3>
    <p><strong>30 avril</strong> — Particuliers<br><strong>15 juin</strong> — Travailleurs autonomes<br><strong>30 avril</strong> — Solde dû (même pour les autonomes)</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🆓</div>
    <h3>Déclaration gratuite</h3>
    <p><strong>Impôt en direct</strong> — Service Canada<br><strong>CVITP</strong> — Comptoirs bénévoles pour revenus &lt; 35 000 $<br><strong>UFile, TurboTax</strong> — Gratuit revenus simples</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">💳</div>
    <h3>Remboursement moyen</h3>
    <p>Le remboursement fédéral moyen en 2024 était de <strong>1 832 $</strong>. Déposé en 2 semaines si déclaration en ligne.</p>
  </div>
</div>

<h2 style="margin-bottom:18px;">📊 Tranches d'imposition fédérales 2025</h2>
<div class="encadre fade-in" style="margin-bottom:32px;">
  <div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:.88rem;">
      <thead><tr style="background:var(--rouge);color:#fff;">
        <th style="padding:10px 14px;text-align:left;border-radius:6px 0 0 0;">Revenu imposable</th>
        <th style="padding:10px 14px;text-align:right;border-radius:0 6px 0 0;">Taux fédéral</th>
      </tr></thead>
      <tbody>
        <tr style="background:var(--rouge-clair);"><td style="padding:9px 14px;">Jusqu'à 57 375 $</td><td style="padding:9px 14px;text-align:right;font-weight:700;color:var(--rouge);">15 %</td></tr>
        <tr style="background:#fff;"><td style="padding:9px 14px;">57 375 $ à 114 750 $</td><td style="padding:9px 14px;text-align:right;font-weight:700;">20,5 %</td></tr>
        <tr style="background:var(--gris-pale);"><td style="padding:9px 14px;">114 750 $ à 158 519 $</td><td style="padding:9px 14px;text-align:right;font-weight:700;">26 %</td></tr>
        <tr style="background:#fff;"><td style="padding:9px 14px;">158 519 $ à 220 000 $</td><td style="padding:9px 14px;text-align:right;font-weight:700;">29 %</td></tr>
        <tr style="background:var(--gris-pale);border-radius:0 0 6px 6px;"><td style="padding:9px 14px;">Plus de 220 000 $</td><td style="padding:9px 14px;text-align:right;font-weight:700;color:var(--rouge);">33 %</td></tr>
      </tbody>
    </table>
  </div>
  <p style="font-size:.78rem;color:var(--gris);margin-top:8px;">Ces taux s'appliquent au revenu imposable après déduction de l'exemption personnelle de base (16 129 $ en 2025). Les provinces ont leurs propres paliers supplémentaires.</p>
</div>

<h2 style="margin-bottom:18px;">✅ Principaux crédits et déductions</h2>
<div class="grille-2" style="margin-bottom:32px;">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;color:var(--rouge);">Crédits non remboursables</h3>
    <ul class="services-liste">
      <li><strong>Montant personnel de base</strong> — 16 129 $ (2025)</li>
      <li><strong>Crédit pour conjoint</strong> — si revenu conjoint &lt; 16 129 $</li>
      <li><strong>Crédit pour frais médicaux</strong> — dépenses &gt; 3% du revenu net</li>
      <li><strong>Crédit pour dons de bienfaisance</strong> — 15% jusqu'à 200 $, 29% au-delà</li>
      <li><strong>Crédit pour achat d'une première propriété</strong> — 10 000 $ (1 500 $ de réduction)</li>
      <li><strong>Crédit pour frais de scolarité</strong> — transférable à un parent</li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;color:#1565C0;">Crédits remboursables et prestations</h3>
    <ul class="services-liste">
      <li><strong>Crédit pour TPS/TVH</strong> — trimestriel, selon revenu</li>
      <li><strong>Allocation canadienne pour enfants (ACE)</strong> — non imposable</li>
      <li><strong>Prestation fiscale pour le revenu de travail (PFRT)</strong></li>
      <li><strong>Remboursement pour frais de chauffage</strong> — dans provinces sous taxe carbone</li>
      <li><strong>Allocation canadienne pour les travailleurs</strong></li>
    </ul>
  </div>
</div>

<div class="grille-2">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">📋 Documents à rassembler</h3>
    <ul class="services-liste">
      <li>Feuillets T4 (employeurs) et T4A</li>
      <li>Relevés de REER (reçus de cotisation)</li>
      <li>Reçus médicaux, frais de garde</li>
      <li>Relevé de loyer provincial (si applicable)</li>
      <li>Relevé 1 (Québec) si vous résidez au QC</li>
      <li>Avis de cotisation de l'année précédente</li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Sources officielles</h3>
    <ul class="services-liste">
      <li><a href="https://www.canada.ca/fr/agence-revenu.html" class="services-lien" target="_blank" rel="noopener">Agence du revenu du Canada (ARC)</a></li>
      <li><a href="https://www.canada.ca/fr/agence-revenu/services/impot/particuliers/sujets/produire-declaration-revenus.html" class="services-lien" target="_blank" rel="noopener">Produire votre déclaration</a></li>
      <li><a href="https://www.revenuquebec.ca" class="services-lien" target="_blank" rel="noopener">Revenu Québec</a></li>
      <li><a href="https://www.canada.ca/fr/agence-revenu/services/services-electroniques/services-electroniques-particuliers/impot-direct.html" class="services-lien" target="_blank" rel="noopener">Impôt en direct (ARC)</a></li>
    </ul>
  </div>
</div>
</div></section>""")

mk('assurance-emploi.html','Guide de l\'assurance-emploi (AE)',
'Tout comprendre sur l\'assurance-emploi au Canada : admissibilité, calcul des prestations, types de prestations et démarches.',
'Services › Assurance-emploi','💼 L\'assurance-emploi (AE)',
"L'assurance-emploi offre un soutien de revenu temporaire aux Canadiens qui perdent leur emploi ou doivent s'arrêter de travailler pour certaines raisons.",
"""<section class="section"><div class="conteneur">
<div class="grille-3" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">⏱️</div>
    <h3>Délai de carence</h3>
    <p>1 semaine de carence non payée avant le début des prestations régulières. Les prestations de maladie et parentales n'ont pas de carence depuis 2023.</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">💰</div>
    <h3>Taux de remplacement</h3>
    <p><strong>55 %</strong> de la rémunération hebdomadaire moyenne assurable, jusqu'à concurrence du maximum assurable (<strong>63 200 $</strong> en 2025).</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">📅</div>
    <h3>Durée maximale</h3>
    <p>14 à <strong>45 semaines</strong> de prestations régulières selon le taux de chômage régional et les heures d'emploi assurable accumulées.</p>
  </div>
</div>

<h2 style="margin-bottom:18px;">✅ Conditions d'admissibilité aux prestations régulières</h2>
<div class="encadre fade-in" style="margin-bottom:32px;">
  <div class="grille-2">
    <ul class="services-liste">
      <li>Avoir perdu son emploi sans en être responsable (mise à pied)</li>
      <li>Avoir accumulé entre <strong>420 et 700 heures</strong> d'emploi assurable dans les 52 dernières semaines (selon la région)</li>
      <li>Être sans emploi et sans rémunération pendant 7 jours consécutifs</li>
    </ul>
    <ul class="services-liste">
      <li>Être capable de travailler et disponible</li>
      <li>Chercher activement un emploi</li>
      <li>Résider au Canada</li>
      <li>Avoir versé des cotisations d'AE</li>
    </ul>
  </div>
</div>

<h2 style="margin-bottom:18px;">📋 Types de prestations</h2>
<div class="grille-2" style="margin-bottom:32px;">
  <div class="carte fade-in"><h3 style="color:var(--rouge);">Régulières</h3><p>Pour les personnes mises à pied. Durée : 14 à 45 semaines selon la région et les heures accumulées.</p></div>
  <div class="carte fade-in"><h3 style="color:#1565C0;">Maladie</h3><p>Jusqu'à <strong>26 semaines</strong> pour une maladie, blessure ou mise en quarantaine. Certificat médical requis.</p></div>
  <div class="carte fade-in"><h3 style="color:#2E7D32;">Maternité</h3><p>Jusqu'à <strong>15 semaines</strong> pour la mère biologique. Commence 8 semaines avant la date prévue d'accouchement.</p></div>
  <div class="carte fade-in"><h3 style="color:#6A1B9A;">Parentales</h3><p>Standard : <strong>35 semaines</strong> à 55% · Prolongées : <strong>61 semaines</strong> à 33%. Partagées entre les deux parents.</p></div>
  <div class="carte fade-in"><h3 style="color:#E65100;">Proches aidants</h3><p>Jusqu'à <strong>35 semaines</strong> pour prendre soin d'un proche gravement malade ou blessé.</p></div>
  <div class="carte fade-in"><h3 style="color:#8B0000;">Pêche</h3><p>Prestations spéciales pour les pêcheurs indépendants dont la saison est réglementée.</p></div>
</div>

<div class="grille-2">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">📋 Faire une demande</h3>
    <ul class="services-liste">
      <li>Demandez en ligne dès la fin de votre emploi</li>
      <li>Fournissez le relevé d'emploi (RE) de votre employeur</li>
      <li>Délai de traitement habituel : 28 jours</li>
      <li>Produisez des déclarations bi-hebdomadaires pour toucher vos prestations</li>
      <li>Signalez tout revenu gagné pendant la période de prestations</li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Sources officielles</h3>
    <ul class="services-liste">
      <li><a href="https://www.canada.ca/fr/services/prestations/ae.html" class="services-lien" target="_blank" rel="noopener">Assurance-emploi — Canada.ca</a></li>
      <li><a href="https://www.canada.ca/fr/emploi-developpement-social/services/mon-dossier.html" class="services-lien" target="_blank" rel="noopener">Mon dossier Service Canada</a></li>
      <li><a href="https://www.canada.ca/fr/emploi-developpement-social/programmes/ae/ae-liste/taux-chomage.html" class="services-lien" target="_blank" rel="noopener">Taux de chômage par région AE</a></li>
    </ul>
  </div>
</div>
</div></section>""")

mk('retraite.html','La retraite au Canada',
'Guide complet de la retraite : Régime de pensions du Canada (RPC), Sécurité de la vieillesse (SV), REER, CELI et pension québécoise.',
'Services › Retraite','🏖️ La retraite au Canada',
"Le système de retraite canadien repose sur trois piliers : les régimes publics, les régimes d'employeur et l'épargne personnelle.",
"""<section class="section"><div class="conteneur">
<div class="grille-3" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🏛️</div>
    <h3>Pilier 1 — Régimes publics</h3>
    <p>RPC/RRQ et Sécurité de la vieillesse. Financés par les cotisations des travailleurs et par l'impôt général.</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🏢</div>
    <h3>Pilier 2 — Régimes d'employeur</h3>
    <p>Régimes de retraite à prestations déterminées (fonctionnaires) ou à cotisations déterminées (secteur privé).</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">💰</div>
    <h3>Pilier 3 — Épargne personnelle</h3>
    <p>REER et CELI — les deux régimes enregistrés à avantages fiscaux pour l'épargne individuelle.</p>
  </div>
</div>

<h2 style="margin-bottom:18px;">🏛️ Le Régime de pensions du Canada (RPC) / RRQ au Québec</h2>
<div class="encadre fade-in" style="margin-bottom:28px;">
  <div class="grille-2">
    <ul class="services-liste">
      <li>Cotisation 2025 : <strong>5,95 %</strong> du salaire entre 3 500 $ et 73 200 $</li>
      <li>L'employeur verse une cotisation égale à la vôtre</li>
      <li>Retraite normale : <strong>65 ans</strong></li>
      <li>Retraite anticipée : dès 60 ans (réduction de 0,6 % par mois avant 65 ans)</li>
      <li>Retraite différée : jusqu'à 70 ans (+0,7 % par mois après 65 ans)</li>
    </ul>
    <ul class="services-liste">
      <li>Prestation maximale à 65 ans (2025) : <strong>1 364 $/mois</strong></li>
      <li>Prestation moyenne réelle : ~760 $/mois</li>
      <li>RPC Bonification (depuis 2019) : cotisations et prestations augmentées progressivement</li>
      <li>RRQ (Québec) : règles similaires, administré par Retraite Québec</li>
    </ul>
  </div>
</div>

<h2 style="margin-bottom:16px;">🛡️ Sécurité de la vieillesse (SV) et Supplément de revenu garanti (SRG)</h2>
<div class="grille-2" style="margin-bottom:28px;">
  <div class="encadre fade-in"><h3 style="margin-bottom:8px;color:var(--rouge);">Sécurité de la vieillesse</h3>
    <ul class="services-liste">
      <li>Accessible dès <strong>65 ans</strong> (ou 70 ans pour une prestation majorée)</li>
      <li>Prestation maximale 2025 : <strong>707 $/mois</strong> (65-74 ans)</li>
      <li>Majoration de 10 % dès 75 ans → <strong>778 $/mois</strong></li>
      <li>Récupération fiscale si revenu &gt; 90 997 $ (2025)</li>
      <li>Inscription automatique pour la plupart des Canadiens</li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:8px;color:#1565C0;">Supplément de revenu garanti (SRG)</h3>
    <ul class="services-liste">
      <li>Pour les aînés à faible revenu — non imposable</li>
      <li>Maximum : <strong>1 065 $/mois</strong> pour personne seule (2025)</li>
      <li>Réduit progressivement selon le revenu annuel</li>
      <li>Demande annuelle obligatoire (liée à votre déclaration de revenus)</li>
    </ul>
  </div>
</div>

<h2 style="margin-bottom:16px;">💰 REER et CELI — L'épargne intelligente</h2>
<div class="grille-2" style="margin-bottom:28px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);">
    <h3>REER — Régime enregistré d'épargne-retraite</h3>
    <ul class="services-liste" style="margin-top:8px;">
      <li>Cotisation déductible d'impôt : réduit votre revenu imposable</li>
      <li>Plafond 2025 : <strong>18 % du revenu gagné</strong>, max 32 490 $</li>
      <li>Droits inutilisés reportables indéfiniment</li>
      <li>Doit être converti en FERR ou en rente à 71 ans</li>
      <li>RAP (Régime d'accession à la propriété) : retrait jusqu'à 35 000 $ pour premier achat</li>
    </ul>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;">
    <h3>CELI — Compte d'épargne libre d'impôt</h3>
    <ul class="services-liste" style="margin-top:8px;">
      <li>Rendements et retraits complètement non imposables</li>
      <li>Cotisation annuelle 2025 : <strong>7 000 $</strong></li>
      <li>Droits cumulatifs depuis 2009 : jusqu'à <strong>95 000 $</strong></li>
      <li>Retraits n'affectent pas les prestations gouvernementales</li>
      <li>Accessible dès 18 ans · Aucune limite d'âge pour cotiser</li>
    </ul>
  </div>
</div>

<div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Planifier votre retraite</h3>
  <ul class="services-liste">
    <li><a href="https://www.canada.ca/fr/emploi-developpement-social/programmes/regime-pensions.html" class="services-lien" target="_blank" rel="noopener">Régime de pensions du Canada</a></li>
    <li><a href="https://www.canada.ca/fr/emploi-developpement-social/programmes/securite-vieillesse.html" class="services-lien" target="_blank" rel="noopener">Sécurité de la vieillesse</a></li>
    <li><a href="https://www.retraitequebec.gouv.qc.ca" class="services-lien" target="_blank" rel="noopener">Retraite Québec (RRQ)</a></li>
    <li><a href="https://www.canada.ca/fr/agence-revenu/services/formulaires-publications/publications/t4040.html" class="services-lien" target="_blank" rel="noopener">Guide REER, FERR et RPDB (T4040)</a></li>
  </ul>
</div>
</div></section>""")

mk('logement.html','Droits au logement au Canada',
'Vos droits en tant que locataire ou propriétaire : Loi nationale sur le logement, aide financière, droits provinciaux et recours.',
'Services › Logement','🏠 Droits au logement au Canada',
"Le Canada a reconnu le droit au logement en 2019. Voici ce que cela signifie concrètement pour les locataires et les propriétaires.",
"""<section class="section"><div class="conteneur">
<div class="encadre fade-in" style="margin-bottom:32px;background:linear-gradient(135deg,var(--rouge-clair),#fff);border-left:5px solid var(--rouge);">
  <h3 style="color:var(--rouge);">⚖️ La Loi nationale sur la stratégie du logement (2019)</h3>
  <p>Le Canada est le premier pays du G7 à avoir inscrit le droit à un logement convenable dans une loi nationale. Cette loi reconnaît que le logement est un droit fondamental — mais les mécanismes de mise en œuvre demeurent limités à ce jour.</p>
</div>

<h2 style="margin-bottom:18px;">🛡️ Droits fondamentaux des locataires</h2>
<div class="grille-2" style="margin-bottom:32px;">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;color:var(--rouge);">Protections générales (toutes provinces)</h3>
    <ul class="services-liste">
      <li>Droit à un logement en bon état (habitabilité)</li>
      <li>Droit à la vie privée — avis d'entrée requis (24-48h)</li>
      <li>Protection contre l'expulsion sans motif valable</li>
      <li>Droit à un reçu pour tout paiement de loyer</li>
      <li>Droit à connaître le loyer précédent (dans plusieurs provinces)</li>
      <li>Protection contre les représailles suite à une plainte légitime</li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;color:#1565C0;">Contrôle des loyers — par province</h3>
    <ul class="services-liste">
      <li><strong>Québec</strong> — Tribunal administratif du logement (TAL), plafond annuel</li>
      <li><strong>Ontario</strong> — Contrôle des loyers sauf unités construites après 2018</li>
      <li><strong>C.-B.</strong> — Plafond basé sur l'inflation (IPC)</li>
      <li><strong>Alberta</strong> — Aucun contrôle des loyers</li>
      <li><strong>Manitoba</strong> — Contrôle des loyers provincial actif</li>
    </ul>
  </div>
</div>

<h2 style="margin-bottom:18px;">💰 Aide financière au logement</h2>
<div class="grille-3" style="margin-bottom:32px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);">
    <h3>Allocation canadienne pour le logement (ACL)</h3>
    <p>Aide financière directe aux locataires à faible revenu. Versée par ESDC. Montants variables selon le revenu et le loyer payé.</p>
    <a href="https://www.canada.ca/fr/societe-hypotheques-logement-social/sujets/allocation-canadienne-pour-logement.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">En savoir plus →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;">
    <h3>Régime d'accession à la propriété (RAP)</h3>
    <p>Retrait jusqu'à <strong>35 000 $</strong> de votre REER sans impôt pour l'achat d'une première propriété. Remboursable sur 15 ans.</p>
    <a href="https://www.canada.ca/fr/agence-revenu/services/formulaires-publications/publications/t4040/regime-accession-propriete.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">RAP →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;">
    <h3>Compte d'épargne libre d'impôt pour l'achat d'une première propriété (CELIAPP)</h3>
    <p>Lancé en 2023. Cotisation annuelle : 8 000 $, max à vie 40 000 $. Déductible et retraits pour achat non imposables.</p>
    <a href="https://www.canada.ca/fr/agence-revenu/programmes/a-propos-agence-revenu-canada-arc/impot-fonctionnement/celiapp.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">CELIAPP →</a>
  </div>
</div>

<div class="grille-2">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">📋 En cas de litige</h3>
    <ul class="services-liste">
      <li><strong>Québec</strong> — Tribunal administratif du logement (TAL) : tal.gouv.qc.ca</li>
      <li><strong>Ontario</strong> — Tribunal du logement : LTB (Landlord and Tenant Board)</li>
      <li><strong>C.-B.</strong> — Residential Tenancy Branch</li>
      <li>Délai de préavis pour expulsion : 30 à 90 jours selon la province et le motif</li>
      <li>Ne quittez jamais un logement sans avoir reçu une ordonnance officielle</li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Sources officielles</h3>
    <ul class="services-liste">
      <li><a href="https://www.cmhc-schl.gc.ca/fr" class="services-lien" target="_blank" rel="noopener">SCHL — Société canadienne d'hypothèques et de logement</a></li>
      <li><a href="https://www.tal.gouv.qc.ca" class="services-lien" target="_blank" rel="noopener">Tribunal administratif du logement (QC)</a></li>
      <li><a href="https://tribunalsontario.ca/ltb" class="services-lien" target="_blank" rel="noopener">Tribunal du logement (Ontario)</a></li>
      <li><a href="https://www.droitlogement.org" class="services-lien" target="_blank" rel="noopener">Droit au logement (FRAPRU, QC)</a></li>
    </ul>
  </div>
</div>
</div></section>""")

mk('education.html','Le système d\'éducation canadien',
'Guide du système éducatif canadien : de la maternelle à l\'université, prêts étudiants, REEE et reconnaissance des diplômes étrangers.',
'Services › Éducation','🎓 Le système d\'éducation canadien',
"L'éducation est une compétence provinciale exclusive. Chaque province a ses propres structures, mais le système est généralement comparable d'une province à l'autre.",
"""<section class="section"><div class="conteneur">
<h2 style="margin-bottom:20px;">📚 Structure du système scolaire</h2>
<div style="display:flex;flex-direction:column;gap:5px;max-width:680px;margin:0 auto 36px;">
  <div style="background:var(--rouge);color:#fff;padding:14px 20px;border-radius:10px;text-align:center;"><strong>Maternelle / Jardin d'enfants</strong> — 4 à 6 ans (varie selon la province)</div>
  <div style="background:#1565C0;color:#fff;padding:14px 20px;border-radius:10px;text-align:center;"><strong>Primaire</strong> — Années 1 à 6 ou 7 (selon la province)</div>
  <div style="background:#2E7D32;color:#fff;padding:14px 20px;border-radius:10px;text-align:center;"><strong>Secondaire</strong> — Années 7 à 12 (ou 8 à 11 au QC) · Diplôme d'études secondaires (DES)</div>
  <div style="background:#E65100;color:#fff;padding:14px 20px;border-radius:10px;text-align:center;"><strong>Postsecondaire</strong> — Cégep (QC) · Collège communautaire · Université</div>
  <div style="background:#6A1B9A;color:#fff;padding:14px 20px;border-radius:10px;text-align:center;"><strong>Études supérieures</strong> — Maîtrise et Doctorat</div>
</div>

<h2 style="margin-bottom:18px;">💰 Aide financière aux études postsecondaires</h2>
<div class="grille-2" style="margin-bottom:32px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);">
    <h3>Programme canadien de prêts et bourses aux étudiants (PCPE)</h3>
    <p>Prêts et bourses non remboursables du gouvernement fédéral pour les étudiants à temps plein et partiel.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Bourse maximale : 4 200 $/an pour étudiants à temps plein à faible revenu</li>
      <li>Prêt maximal : 14 300 $/an (varie selon besoins et province)</li>
      <li>Remboursement commence 6 mois après la fin des études</li>
      <li>Programme d'aide au remboursement (PAR) si revenus insuffisants</li>
      <li>Remise de prêts possible après 15 ans d'aide au remboursement</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/emploi-developpement-social/services/education/bourses-prets.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">PCPE →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;">
    <h3>REEE — Régime enregistré d'épargne-études</h3>
    <p>Épargne pour les études d'un enfant avec subventions gouvernementales.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Subvention canadienne pour l'épargne-études (SCEE) : 20% des 2 500 $ cotisés = 500 $/an</li>
      <li>Bon d'études canadien (BEC) : jusqu'à 2 000 $ pour ménages à faible revenu (sans cotisation)</li>
      <li>Droits de cotisation à vie : 50 000 $ par bénéficiaire</li>
      <li>Les revenus ne sont imposés qu'à la sortie (revenu de l'étudiant, donc peu ou pas d'impôt)</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/emploi-developpement-social/services/education/epargne-reee.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">REEE →</a>
  </div>
</div>

<div class="grille-2" style="margin-bottom:28px;">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🌐 Reconnaissance des diplômes étrangers</h3>
    <ul class="services-liste">
      <li>Les professions réglementées (médecin, avocat, ingénieur) exigent une évaluation par l'ordre professionnel provincial</li>
      <li>Les professions non réglementées : présentation directe aux employeurs</li>
      <li>Services d'évaluation des titres de compétences étrangers (IQAS, WES, etc.)</li>
      <li><a href="https://www.canada.ca/fr/immigration-refugies-citoyennete/services/nouveaux-immigrants/nouvelles-vies-canada/pourquoi-canada/educations-etrangeres.html" class="services-lien" target="_blank" rel="noopener">Guide fédéral de reconnaissance →</a></li>
    </ul>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Ressources par province</h3>
    <ul class="services-liste">
      <li><a href="https://www.education.gouv.qc.ca" class="services-lien" target="_blank" rel="noopener">Ministère de l'Éducation du Québec</a></li>
      <li><a href="https://www.ontario.ca/fr/page/education-ontario" class="services-lien" target="_blank" rel="noopener">Éducation Ontario</a></li>
      <li><a href="https://www2.gov.bc.ca/gov/content/education-training" class="services-lien" target="_blank" rel="noopener">Education & Training BC</a></li>
      <li><a href="https://www.canada.ca/fr/emploi-developpement-social/programmes/collectivites-apprentissage.html" class="services-lien" target="_blank" rel="noopener">Alphabétisation et apprentissage</a></li>
    </ul>
  </div>
</div>
</div></section>""")

mk('environnement.html','Politiques environnementales du Canada',
'Comprendre les politiques climatiques canadiennes : tarification du carbone, engagements de Paris, droits environnementaux et LCPE.',
'Services › Environnement','🌿 Politiques environnementales du Canada',
"Le Canada s'est engagé à réduire ses émissions de GES de 40 à 45 % sous les niveaux de 2005 d'ici 2030 et à atteindre la carboneutralité en 2050.",
"""<section class="section"><div class="conteneur">
<div class="grille-3" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🌡️</div>
    <h3>Cible 2030</h3>
    <p>Réduction de <strong>40–45 %</strong> des émissions de GES par rapport aux niveaux de 2005. Engagement pris dans le cadre de l'Accord de Paris.</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">🏭</div>
    <h3>Carboneutralité 2050</h3>
    <p>Loi canadienne sur la responsabilité en matière de carboneutralité (2021) rend cet objectif juridiquement contraignant.</p>
  </div>
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);text-align:center;">
    <div style="font-size:2rem;margin-bottom:8px;">💧</div>
    <h3>30×30</h3>
    <p>Engagement à protéger <strong>30 %</strong> des terres et des océans du Canada d'ici 2030 pour préserver la biodiversité.</p>
  </div>
</div>

<h2 style="margin-bottom:18px;">💰 La tarification du carbone</h2>
<div class="encadre fade-in" style="margin-bottom:32px;">
  <p style="margin-bottom:14px;">Le Canada applique une tarification fédérale sur les combustibles fossiles dans les provinces qui n'ont pas leur propre système équivalent. La redevance est remboursée en grande partie aux ménages via la <strong>Remise canadienne sur le carbone</strong>.</p>
  <div class="grille-2">
    <ul class="services-liste">
      <li>Taux 2025 : <strong>95 $/tonne</strong> d'équivalent CO₂</li>
      <li>S'applique aux combustibles : essence, gaz naturel, mazout, propane</li>
      <li>Remise trimestrielle directement dans votre compte bancaire</li>
    </ul>
    <ul class="services-liste">
      <li>80 % des ménages reçoivent plus qu'ils ne paient en taxe</li>
      <li>Supplément rural : bonification de 20 % de la remise</li>
      <li>Provinces avec leur propre système : Québec (SPEDE), C.-B.</li>
    </ul>
  </div>
</div>

<h2 style="margin-bottom:18px;">⚖️ Cadre légal environnemental</h2>
<div class="grille-2" style="margin-bottom:28px;">
  <div class="carte fade-in"><h3>Loi canadienne sur la protection de l'environnement (LCPE)</h3>
    <p>Encadre la gestion des substances toxiques, les émissions atmosphériques et les déchets dangereux. Révisée en 2023 pour renforcer le droit à un environnement sain.</p>
    <a href="https://www.canada.ca/fr/environnement-changement-climatique/services/gestion-pollution/loi-canadienne-protection-environnement.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">LCPE →</a>
  </div>
  <div class="carte fade-in"><h3>Loi sur l'évaluation d'impact (2019)</h3>
    <p>Remplace l'ancienne Loi sur la protection de la navigation. Intègre l'analyse des impacts environnementaux, sociaux et sur les droits autochtones pour les grands projets.</p>
    <a href="https://www.canada.ca/fr/agence-evaluation-impact.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Agence d'évaluation d'impact →</a>
  </div>
</div>

<div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Ressources officielles</h3>
  <ul class="services-liste">
    <li><a href="https://www.canada.ca/fr/environnement-changement-climatique.html" class="services-lien" target="_blank" rel="noopener">Environnement et Changement climatique Canada</a></li>
    <li><a href="https://www.canada.ca/fr/environnement-changement-climatique/services/changements-climatiques/plan-reduction-emissions.html" class="services-lien" target="_blank" rel="noopener">Plan de réduction des émissions 2030</a></li>
    <li><a href="https://www.canada.ca/fr/agence-revenu/services/prestations/remise-carbone-particuliers.html" class="services-lien" target="_blank" rel="noopener">Remise canadienne sur le carbone</a></li>
  </ul>
</div>
</div></section>""")

mk('securite.html','Sécurité publique et protection de la vie privée',
'Sécurité nationale, GRC, SCRS, droits à la vie privée et organismes de surveillance au Canada.',
'Droits › Sécurité et vie privée','🛡️ Sécurité publique et vie privée au Canada',
"La sécurité et la vie privée forment deux droits fondamentaux que l'État doit équilibrer. Comprendre les institutions qui vous protègent.",
"""<section class="section"><div class="conteneur">
<div class="grille-2" style="margin-bottom:32px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);">
    <h3>🚔 Gendarmerie royale du Canada (GRC)</h3>
    <p>Police fédérale nationale. Lutte contre le crime organisé, le terrorisme, le cybercrime. Assure aussi la police provinciale dans 8 provinces et les 3 territoires.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Fondée en 1873 comme Police à cheval du Nord-Ouest</li>
      <li>Supervision civile : Commission civile d'examen et de traitement des plaintes (CCETP)</li>
      <li>Ontario et Québec ont leurs propres polices provinciales (OPP, SQ)</li>
    </ul></div></details>
    <a href="https://www.rcmp-grc.gc.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">rcmp-grc.gc.ca →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;">
    <h3>🔍 Service canadien du renseignement de sécurité (SCRS)</h3>
    <p>Service de renseignement civil. Enquête sur les menaces à la sécurité nationale : terrorisme, espionnage, ingérence étrangère, extrémisme violent.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Crée en 1984 à la suite de scandales de la GRC</li>
      <li>N'a pas de pouvoirs d'arrestation — transmet à la GRC</li>
      <li>Supervisé par le Comité de surveillance des activités de renseignement (CSARS)</li>
      <li>Soumis à l'examen de l'Office de surveillance des activités en matière de sécurité nationale (OSSNR)</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/service-renseignement-securite.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">SCRS →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;">
    <h3>💻 Centre de la sécurité des télécommunications (CST)</h3>
    <p>Service de renseignement sur les signaux et de cybersécurité. Protège les réseaux du gouvernement et des infrastructures critiques contre les cybermenaces.</p>
    <a href="https://www.cse-cst.gc.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">cse-cst.gc.ca →</a>
  </div>
  <div class="carte fade-in" style="border-top:4px solid #6A1B9A;">
    <h3>🔒 Commissariat à la protection de la vie privée (CPVP)</h3>
    <p>Organisme indépendant qui surveille le respect de la Loi sur la protection des renseignements personnels (secteur public) et de la LPRPDE (secteur privé).</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Vous pouvez déposer une plainte si une organisation a mal géré vos données</li>
      <li>Droit d'accès à vos propres informations détenues par une organisation fédérale</li>
      <li>Loi 25 au Québec : droits similaires renforcés pour les entreprises québécoises</li>
    </ul></div></details>
    <a href="https://www.priv.gc.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">priv.gc.ca →</a>
  </div>
</div>

<div class="encadre fade-in"><h3 style="margin-bottom:10px;">⚖️ Vos droits face à la surveillance</h3>
  <ul class="services-liste">
    <li>La Charte (art. 8) protège contre les fouilles et saisies abusives — y compris numériques</li>
    <li>Les organismes de sécurité doivent obtenir un mandat judiciaire pour intercepter vos communications</li>
    <li>Vous pouvez demander accès à vos dossiers SCRS via la Loi sur la protection des renseignements personnels</li>
    <li>La Loi sur la communication d'information ayant trait à la sécurité du Canada (LCISC) permet le partage de données entre 17 ministères</li>
  </ul>
</div>
</div></section>""")

mk('sante.html','Le système de santé canadien',
'Comprendre la santé publique au Canada : Loi canadienne sur la santé, RAMQ, soins dentaires, pharmacare et aide médicale à mourir.',
'Services › Santé','🏥 Le système de santé canadien',
"La santé est une compétence provinciale, mais la Loi canadienne sur la santé fixe les conditions que les provinces doivent respecter pour recevoir le financement fédéral.",
"""<section class="section"><div class="conteneur">
<h2 style="margin-bottom:20px;">⚖️ Les 5 principes de la Loi canadienne sur la santé (1984)</h2>
<div class="grille-3" style="margin-bottom:36px;">
  <div class="carte fade-in" style="border-top:4px solid var(--rouge);text-align:center;"><div style="font-size:1.8rem;margin-bottom:8px;">🌐</div><h3>Universalité</h3><p>Tous les résidents de la province ont droit à la couverture d'assurance-santé.</p></div>
  <div class="carte fade-in" style="border-top:4px solid #1565C0;text-align:center;"><div style="font-size:1.8rem;margin-bottom:8px;">🤝</div><h3>Accessibilité</h3><p>Les services doivent être accessibles sans obstacles financiers ou autres.</p></div>
  <div class="carte fade-in" style="border-top:4px solid #2E7D32;text-align:center;"><div style="font-size:1.8rem;margin-bottom:8px;">💊</div><h3>Intégralité</h3><p>Tous les services médicalement nécessaires doivent être couverts.</p></div>
  <div class="carte fade-in" style="border-top:4px solid #E65100;text-align:center;"><div style="font-size:1.8rem;margin-bottom:8px;">🏛️</div><h3>Transférabilité</h3><p>La couverture suit le résident d'une province à l'autre pendant une période raisonnable.</p></div>
  <div class="carte fade-in" style="border-top:4px solid #6A1B9A;text-align:center;"><div style="font-size:1.8rem;margin-bottom:8px;">🏥</div><h3>Gestion publique</h3><p>L'assurance-maladie doit être administrée par un organisme public sans but lucratif.</p></div>
</div>

<div class="grille-2" style="margin-bottom:32px;">
  <div class="carte fade-in"><h3>🔵 La RAMQ — Québec</h3>
    <p>La Régie de l'assurance maladie du Québec administre l'assurance maladie et le régime d'assurance médicaments.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Régime d'assurance médicaments : cotisation selon revenu (max ~770 $/an)</li>
      <li>Couverture automatique pour les Québécois sans assurance collective</li>
      <li>Carte soleil requise pour tous les soins au Québec</li>
      <li>Transfert de carte entre provinces : délai de 3 mois couvert par la province d'origine</li>
    </ul></div></details>
    <a href="https://www.ramq.gouv.qc.ca" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">ramq.gouv.qc.ca →</a>
  </div>
  <div class="carte fade-in"><h3>🦷 Régime canadien de soins dentaires (RCSD)</h3>
    <p>Lancé en 2023, le RCSD offre une couverture dentaire aux Canadiens dont le revenu familial est inférieur à 90 000 $/an et qui n'ont pas d'assurance dentaire privée.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Phase 1 (2023) : aînés 70 ans et plus</li>
      <li>Phase 2 (2024) : aînés 65+, personnes handicapées, enfants moins de 18 ans</li>
      <li>Phase 3 (2025) : tous les Canadiens admissibles</li>
      <li>Couverture : détartrage, obturations, extractions, prothèses</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/agence-revenu/programmes/a-propos-agence-revenu-canada-arc/regime-canadien-soins-dentaires.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">RCSD →</a>
  </div>
</div>

<div class="grille-2" style="margin-bottom:28px;">
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">💊 Pharmacare national</h3>
    <p>La Loi sur l'assurance médicaments (2024) pose les bases d'un régime national d'assurance médicaments. Phase initiale : contraceptifs et médicaments contre le diabète couverts universellement.</p>
    <a href="https://www.canada.ca/fr/sante-canada/services/systeme-soins-sante/pharmacare-assurance-medicaments.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">Pharmacare →</a>
  </div>
  <div class="encadre fade-in"><h3 style="margin-bottom:10px;">⚕️ Aide médicale à mourir (AMM)</h3>
    <p>Légale au Canada depuis 2016 (C-14), élargie en 2021 (C-7). Accessible aux personnes dont la souffrance est intolérable due à une condition médicale grave et irrémédiable.</p>
    <details class="services-toggle"><summary>···</summary><div class="services-toggle-contenu"><ul class="services-details">
      <li>Voie 1 (mort naturelle raisonnablement prévisible) — critères plus souples</li>
      <li>Voie 2 (mort non prévisible) — délai de réflexion de 90 jours</li>
      <li>Extension aux troubles mentaux seuls : en discussion, reportée à 2027</li>
    </ul></div></details>
    <a href="https://www.canada.ca/fr/sante-canada/services/aide-medicale-mourir.html" class="services-lien" target="_blank" rel="noopener" style="font-size:.84rem;">AMM →</a>
  </div>
</div>

<div class="encadre fade-in"><h3 style="margin-bottom:10px;">🔗 Trouver votre régime provincial</h3>
  <ul class="services-liste">
    <li><a href="https://www.ramq.gouv.qc.ca" class="services-lien" target="_blank" rel="noopener">RAMQ — Québec</a></li>
    <li><a href="https://www.ontario.ca/fr/page/assurance-sante-ontario" class="services-lien" target="_blank" rel="noopener">Assurance-santé Ontario (OHIP)</a></li>
    <li><a href="https://www2.gov.bc.ca/gov/content/health/health-drug-coverage/msp" class="services-lien" target="_blank" rel="noopener">BC Medical Services Plan</a></li>
    <li><a href="https://www.canada.ca/fr/sante-canada.html" class="services-lien" target="_blank" rel="noopener">Santé Canada</a></li>
  </ul>
</div>
</div></section>""")

print("Phase 3 : 8/8 OK")
