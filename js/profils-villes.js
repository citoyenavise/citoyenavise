// js/profils-villes.js — Profils détaillés des villes du Québec
// Structure : id → données complètes ou partielles

const QC_PROFILS = {

  // ════════════════════════════════════════════════════════════
  // Données partielles — villes majeures (stats clés seulement)
  // ════════════════════════════════════════════════════════════
  'montreal': {
    maire: 'Valérie Plante',
    population: 2037000,
    superficie_km2: 365.1,
    densite_population: 5577,
  },
  'quebec': {
    maire: 'Bruno Marchand',
    population: 551182,
    superficie_km2: 454.3,
    densite_population: 1213,
  },
  'laval': {
    maire: 'Stéphane Boyer',
    population: 438366,
    superficie_km2: 247.1,
    densite_population: 1774,
    profil_demographique: {
      croissance_population: '+8,2 % entre 2016 et 2021',
      age_median: 41.5,
      langues_principales: [
        'Français (69 %)',
        'Arabe (6 %)',
        'Italien (3 %)',
        'Anglais (3 %)',
        'Créole haïtien (2 %)',
      ]
    },
    gouvernance: {
      type_municipalite: 'Ville — seule municipalité de la région 13, constituant à elle seule une agglomération',
      conseil_municipal: {
        nombre_conseillers: 21,
        districts: [
          'Auteuil', 'Chomedey', 'Duvernay', 'Fabreville',
          'Îles-Laval', "L'Abord-à-Plouffe", 'Laval-des-Rapides',
          'Laval-les-Îles', 'Laval-Ouest', 'Laval-sur-le-Lac',
          'Laurentides', 'Les Mille-Îles', 'Marc-Aurèle-Fortin',
          'Pont-Viau', 'Renaud', 'Saint-Martin', 'Saint-Vincent-de-Paul',
          'Sainte-Dorothée', 'Sainte-Rose', 'Souvenir-Labelle', 'Vimont',
        ]
      },
      fonctionnaires_principaux: {
        directeur_general: 'Marc Lauzon',
        greffier: 'Non divulgué',
        directeur_finances: 'Non divulgué',
        directeur_urbanisme: 'Non divulgué',
        chef_police: 'Service de police de Laval (SPL)',
        chef_incendie: 'Service de sécurité incendie de Laval (SSIL)',
        autres_postes_cles: [
          'Directeur des travaux publics et de l\'ingénierie',
          'Directeur des parcs, sports et loisirs',
          'Directeur des bibliothèques et affaires culturelles',
          'Directeur des communications',
        ]
      }
    },
    infrastructures: {
      hopitaux: [
        'Hôpital de la Cité-de-la-Santé (CISSS de Laval — hôpital régional principal)',
        'Centre de réadaptation Interval',
        'CLSC Sainte-Rose',
        'CLSC du Marigot',
        'CLSC Norman-Béthune',
        'CLSC des Mille-Îles',
      ],
      ecoles_principales: [
        'Collège Montmorency (cégep)',
        'Université de Montréal — Campus Laval',
        'École secondaire Curé-Antoine-Labelle',
        'École secondaire Sainte-Rose',
        'Polyvalente Montmorency',
        'École secondaire Leblanc',
      ],
      transports: [
        'STL — Société de transport de Laval (~60 lignes d\'autobus)',
        'Métro de Montréal — Ligne orange : stations Cartier, De la Concorde, Montmorency',
        'Autoroute 13 (Chomedey — corridor sud vers Montréal)',
        'Autoroute 15 (des Laurentides — axe principal nord-sud)',
        'Autoroute 19 (boulevard Papineau prolongé)',
        'Autoroute 25 (Pie-IX — pont tunnel vers Montréal-Est)',
        'Autoroute 440 (transversale est-ouest)',
        'Autoroute 640 (ceinture nord de Laval)',
      ],
      services_publics: [
        'Réseau de 7 bibliothèques municipales (Bibliothèque Laval)',
        'Centre de la nature de Laval (50 ha de parcs et jardins)',
        'Cosmodôme — centre des sciences de l\'espace',
        'Collecte des matières résiduelles, sélective et compostage',
        'Réseau d\'aqueduc et d\'égouts géré par la Ville',
        'Service 311 — demandes citoyennes en ligne',
      ]
    },
    economique: {
      industries_principales: [
        'Commerce de détail et grand commerce (Carrefour Laval, Centropolis, Place Laval)',
        'Biotechnologie et pharmaceutique (La Cité de la Biotech)',
        'Construction et développement immobilier',
        'Logistique, entreposage et transport',
        'Services professionnels, TI et finance',
      ],
      grands_employeurs: [
        'CISSS de Laval (santé publique)',
        'Ville de Laval (administration municipale)',
        'Pfizer Canada',
        'GlaxoSmithKline Canada',
        'Bio K+ International',
        'Bell Canada',
        'Société de transport de Laval (STL)',
        'Provigo / Loblaws',
        'Carrefour Laval',
      ],
      taux_emploi: 61.4,
    },
    histoire: {
      fondation: '1965 — fusion légale de 14 municipalités. Île Jésus colonisée dès 1636.',
      evenements_importants: [
        '1636 — Concession de l\'Île Jésus aux Jésuites par la Compagnie des Cent-Associés',
        '1699 — L\'Île Jésus est cédée au Séminaire de Québec',
        '1845 — Création officielle du comté de Laval',
        '1965 — Sanction de la Loi de la Cité de Laval (fusion des 14 municipalités)',
        '2007 — Prolongation de la ligne orange du métro (3 nouvelles stations)',
        '2012 — Commission Charbonneau révèle des stratagèmes de corruption',
        '2013 — Démission du maire Gilles Vaillancourt, visé par des allégations criminelles',
        '2017 — Condamnation de Vaillancourt à 6 ans de prison pour gangstérisme',
        '2021 — Élection de Stéphane Boyer (Mouvement lavallois)',
      ],
      origine_nom: 'Hommage à Mgr François de Montmorency-Laval (1623–1708), premier évêque catholique de Nouvelle-France et fondateur du Séminaire de Québec',
    },
    geographie: {
      coordonnees: { latitude: 45.5666, longitude: -73.6879 },
      regions_naturelles: [
        'Île Jésus — l\'intégralité du territoire de Laval est constituée de cette île',
        'Basses-terres du Saint-Laurent',
        'Plaine argileuse post-glaciaire',
      ],
      cours_eau: [
        'Rivière des Mille Îles — limite nord, frontière avec les Laurentides et Lanaudière',
        'Rivière des Prairies — limite sud, frontière avec l\'île de Montréal',
        'Rivière Jésus (cours interne, partiellement canalisé)',
      ]
    },
    culture_et_societe: {
      festivals: [
        'Feux Loto-Québec au Centre de la nature (feux d\'artifice estivaux)',
        'Festival des films de Laval',
        'Festivités de la Saint-Jean-Baptiste',
        'Marché de Noël de Laval',
      ],
      lieux_culturels: [
        'Cosmodôme — centre des sciences spatiales et musée interactif',
        'Centre de la nature de Laval — parc urbain de 50 ha avec serre tropicale',
        'Salle André-Mathieu — salle de spectacles (1 200 places)',
        'Maison des arts de Laval — galeries et programmation culturelle',
        'Bibliothèque Laval — réseau de 7 succursales',
        'Centropolis — complexe commercial, cinéma, restaurants et divertissement',
      ],
      patrimoine: [
        'Église Sainte-Rose-de-Lima (XIXe siècle, secteur patrimonial Sainte-Rose)',
        'Moulin Fleming (XIXe siècle)',
        'Maison Filion — maison ancestrale de la période coloniale',
        'Ancien village de Sainte-Rose — secteur de conservation patrimoniale',
      ]
    },
    finances_municipales: {
      budget_annuel: 1540000000,
      sources_revenus: [
        'Taxes foncières résidentielles (~65 % des revenus)',
        'Taxes foncières non résidentielles (commerciales et industrielles)',
        'Transferts gouvernementaux provinciaux et fédéraux',
        'Tarification des services (eau, collecte, permis de construction)',
        'Droits de mutation immobilière (taxe de bienvenue)',
        'Revenus de placements et intérêts',
      ],
      endettement: '~1,8 G$ en dette à long terme (estimation 2023)',
    },
    urbanisme: {
      zones_residentielles: [
        'Chomedey — secteur dense, multiethnique, forte proportion de logements collectifs',
        'Sainte-Rose — noyau villageois historique, résidentiel mixte',
        'Duvernay — développement récent, familles, maisons unifamiliales',
        'Laval-sur-le-Lac — secteur haut de gamme, lac artificiel privé',
        'Pont-Viau — secteur ouvrier historique, revitalisation en cours',
      ],
      zones_industrielles: [
        'Parc industriel Laval (ouest — logistique et manufacturier léger)',
        'La Cité de la Biotech — pôle pharmaceutique et recherche',
        'Zone industrielle Fabreville (nord-ouest)',
        'Corridor logistique autoroute 13 (sud)',
      ],
      projets_developpement: [
        'Plan stratégique Laval 2035 — densification et transit-oriented development',
        'Réaménagement du pôle Montmorency (TOD autour de la station de métro)',
        'Mise en valeur des berges de la Rivière des Prairies (accès public)',
        'Extension du réseau cyclable — objectif 400 km d\'ici 2030',
        'Programme de logement abordable — construction de nouvelles unités sociales',
        'Réfection du réseau d\'aqueduc vieillissant (investissement pluriannuel)',
      ]
    },

    // ── Promotion de la ville ──────────────────────────────────
    promo: {
      tagline: "L'île aux mille possibilités",
      description: "Deuxième ville en importance au Québec, Laval occupe entièrement l'Île Jésus, encerclée par la rivière des Mille Îles au nord et la rivière des Prairies au sud. Fondée en 1965 par la fusion de 14 municipalités, elle conjugue dynamisme urbain, héritage patrimonial et accès à la nature. Carrefour biotechnologique, pôle commercial majeur et ville en pleine transformation, Laval trace sa voie vers un développement durable et inclusif.",
      photo_url: null,
      photo_legende: 'Église Sainte-Rose-de-Lima — Secteur patrimonial Sainte-Rose, XIXe siècle',
      photo_emoji: '⛪',
      faits_saillants: [
        '2e ville du Québec par la population',
        'Île Jésus — territoire 100 % insulaire',
        '3 stations de métro (ligne orange)',
        'La Cité de la Biotech — pôle pharmaceutique',
        'Cosmodôme — musée des sciences spatiales',
        '247 km² de superficie',
      ],
    },

    // ── Maire en fonction ─────────────────────────────────────
    maire_profil: {
      nom: 'Stéphane Boyer',
      titre: 'Maire de Laval',
      parti: 'Mouvement lavallois',
      depuis: 'Novembre 2021',
      photo_url: null,
      bio: "Stéphane Boyer est élu maire de Laval le 7 novembre 2021 à la tête du Mouvement lavallois avec 52 % des voix. Ancien conseiller municipal dans le district Sainte-Rose, il s'est imposé comme une figure de renouveau démocratique à la suite des scandales de corruption qui ont marqué l'administration précédente. Son mandat se distingue par un engagement fort pour la transparence, le développement durable, la mobilité active et l'amélioration des services de proximité pour l'ensemble des Lavallois.",
      contact_email: 'maire@laval.ca',
      contact_web: 'https://www.laval.ca',
      priorites: [
        'Transparence et saine gouvernance',
        'Mobilité durable — réseau cyclable 400 km',
        'Logement abordable et densification',
        'Revitalisation des berges et espaces verts',
        'Développement économique local',
      ],
    },

    // ── Calendrier municipal ──────────────────────────────────
    calendrier_municipal: [
      { date: '2026-05-05', heure: '19h00', type: 'conseil',      lieu: 'Hôtel de Ville — Salle du conseil', titre: 'Séance ordinaire du conseil municipal' },
      { date: '2026-05-19', heure: '19h00', type: 'conseil',      lieu: 'Hôtel de Ville — Salle du conseil', titre: 'Séance ordinaire du conseil municipal' },
      { date: '2026-06-02', heure: '19h00', type: 'conseil',      lieu: 'Hôtel de Ville — Salle du conseil', titre: 'Séance ordinaire du conseil municipal' },
      { date: '2026-06-09', heure: '18h30', type: 'consultation', lieu: 'Centre de la nature de Laval',       titre: 'Consultation publique — Plan Laval 2035' },
      { date: '2026-06-16', heure: '19h00', type: 'special',      lieu: 'Hôtel de Ville — Salle du conseil', titre: 'Séance spéciale — Budget supplémentaire' },
      { date: '2026-06-21', heure: '14h00', type: 'evenement',    lieu: 'Centre de la nature de Laval',       titre: 'Festivités de la Saint-Jean-Baptiste' },
      { date: '2026-07-07', heure: '19h00', type: 'conseil',      lieu: 'Hôtel de Ville — Salle du conseil', titre: 'Séance ordinaire du conseil municipal' },
      { date: '2026-07-21', heure: '19h00', type: 'conseil',      lieu: 'Hôtel de Ville — Salle du conseil', titre: 'Séance ordinaire du conseil municipal' },
      { date: '2026-08-04', heure: '18h30', type: 'consultation', lieu: 'Bibliothèque Laval — succursale Chomedey', titre: 'Consultation — Réaménagement des berges' },
      { date: '2026-08-18', heure: '19h00', type: 'conseil',      lieu: 'Hôtel de Ville — Salle du conseil', titre: 'Séance ordinaire du conseil municipal' },
    ],

  }, // fin laval

  'longueuil': {
    maire: 'Catherine Fournier',
    population: 261119,
    superficie_km2: 115.6,
    densite_population: 2259,
  },
  'gatineau': {
    maire: 'France Bélisle',
    population: 291041,
    superficie_km2: 342.5,
    densite_population: 850,
  },
  'sherbrooke': {
    maire: 'Évelyne Beaudin',
    population: 172950,
    superficie_km2: 366.1,
    densite_population: 473,
  },
  'trois-rivieres': {
    maire: 'Jean Lamarche',
    population: 143000,
    superficie_km2: 289.2,
    densite_population: 495,
  },
  'saguenay': {
    maire: 'Julie Dufour',
    population: 145949,
    superficie_km2: 1126.9,
    densite_population: 130,
  },
  'levis': {
    maire: 'Nicolas Paradis',
    population: 148855,
    superficie_km2: 447.9,
    densite_population: 332,
  },
  'terrebonne': {
    maire: 'Marc-André Plante',
    population: 125600,
    superficie_km2: 153.0,
    densite_population: 821,
  },
  'saint-jean-richelieu': {
    maire: 'Michel Fecteau',
    population: 100840,
    superficie_km2: 225.8,
    densite_population: 447,
  },
  'saint-jerome': {
    maire: 'Marc Bourcier',
    population: 82000,
    superficie_km2: 199.5,
    densite_population: 411,
  },
  'repentigny': {
    maire: 'Nicolas Dufour',
    population: 84700,
    superficie_km2: 75.1,
    densite_population: 1128,
  },
  'brossard': {
    maire: 'Doreen Assaad',
    population: 85721,
    superficie_km2: 42.6,
    densite_population: 2012,
  },
  'drummondville': {
    maire: 'Alain Carrier',
    population: 83000,
    superficie_km2: 280.2,
    densite_population: 296,
  },
  'saint-hyacinthe': {
    maire: 'André Beauregard',
    population: 59000,
    superficie_km2: 201.0,
    densite_population: 294,
  },
  'granby': {
    maire: 'Julie Bourdon',
    population: 72000,
    superficie_km2: 157.6,
    densite_population: 457,
  },
  'rouyn-noranda': {
    maire: 'Diane Dallaire',
    population: 42334,
    superficie_km2: 6257.7,
    densite_population: 7,
  },
  'val-dor': {
    maire: 'Denis Lamothe',
    population: 33000,
    superficie_km2: 3591.2,
    densite_population: 9,
  },
  'rimouski': {
    maire: 'Guy Caron',
    population: 48664,
    superficie_km2: 531.4,
    densite_population: 92,
  },
  'victoriaville': {
    maire: 'André Bellavance',
    population: 51000,
    superficie_km2: 218.2,
    densite_population: 234,
  },
  'shawinigan': {
    maire: 'Michel Angers',
    population: 51000,
    superficie_km2: 1639.2,
    densite_population: 31,
  },
  'riviere-du-loup': {
    maire: 'Mario Bastille',
    population: 21000,
    superficie_km2: 162.9,
    densite_population: 129,
  },
};
