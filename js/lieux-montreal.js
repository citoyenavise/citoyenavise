/**
 * Lieux établis — Montréal, Phase 1 : Mile End et proximité
 * Catégories : gouvernement | sante | communaute | education | culture | public | religion | identite
 */

const LIEUX_CAT = {
  gouvernement: { label: '🏛️ Gouvernement', couleur: '#1976D2', rayon: 8 },
  sante:        { label: '🏥 Santé',         couleur: '#E53935', rayon: 9 },
  communaute:   { label: '🤝 Communauté',    couleur: '#43A047', rayon: 9 },
  education:    { label: '📚 Éducation',     couleur: '#FB8C00', rayon: 8 },
  culture:      { label: '🎭 Culture',       couleur: '#8E24AA', rayon: 8 },
  public:       { label: '🌳 Espaces',       couleur: '#6D9E3F', rayon: 7 },
  religion:     { label: '⛪ Lieux de culte', couleur: '#8D6E63', rayon: 7 },
  identite:     { label: '🍽️ Emblèmes',     couleur: '#F4511E', rayon: 8 },
};

const LIEUX_MTL = [

  // ── 🏛️ FÉDÉRAL ──────────────────────────────────────────────
  {
    id: 'guy-favreau',
    nom: 'Complexe Guy-Favreau',
    cat: 'gouvernement', sousCat: 'Fédéral',
    adresse: '200 boul. René-Lévesque O',
    lat: 45.5017, lng: -73.5668,
  },
  {
    id: 'arc-montreal',
    nom: 'Centre fiscal de Montréal (ARC)',
    cat: 'gouvernement', sousCat: 'Fédéral',
    adresse: '305 boul. René-Lévesque O',
    lat: 45.5019, lng: -73.5654,
  },
  {
    id: 'ircc-montreal',
    nom: 'Immigration, Réfugiés et Citoyenneté (IRCC)',
    cat: 'gouvernement', sousCat: 'Fédéral',
    adresse: '1010 rue Sainte-Catherine O',
    lat: 45.4998, lng: -73.5724,
  },
  {
    id: 'service-canada-mtl',
    nom: 'Service Canada — Montréal centre',
    cat: 'gouvernement', sousCat: 'Fédéral',
    adresse: '1800 av. McGill College',
    lat: 45.5045, lng: -73.5715,
  },
  {
    id: 'postes-canada-mile-end',
    nom: 'Postes Canada — succursale Mile End',
    cat: 'gouvernement', sousCat: 'Fédéral',
    adresse: '5765 av. du Parc',
    lat: 45.5203, lng: -73.6005,
  },
  {
    id: 'grc-division-c',
    nom: 'GRC — Division C (Montréal)',
    cat: 'gouvernement', sousCat: 'Fédéral',
    adresse: '4225 ch. Dorchester O',
    lat: 45.4789, lng: -73.5851,
  },

  // ── 🏛️ PROVINCIAL ───────────────────────────────────────────
  {
    id: 'palais-justice-mtl',
    nom: 'Palais de justice de Montréal',
    cat: 'gouvernement', sousCat: 'Provincial',
    adresse: '1 rue Notre-Dame E',
    lat: 45.5080, lng: -73.5545,
  },
  {
    id: 'services-quebec-mtl',
    nom: 'Services Québec — Montréal',
    cat: 'gouvernement', sousCat: 'Provincial',
    adresse: '800 boul. De Maisonneuve E',
    lat: 45.5162, lng: -73.5649,
  },
  {
    id: 'sq-montreal',
    nom: 'Sûreté du Québec — Montréal',
    cat: 'gouvernement', sousCat: 'Provincial',
    adresse: '4000 boul. Rosemont',
    lat: 45.5447, lng: -73.5838,
  },
  {
    id: 'ciusss-centre-sud',
    nom: 'CIUSSS Centre-Sud — direction',
    cat: 'gouvernement', sousCat: 'Provincial',
    adresse: '1560 rue Sherbrooke E',
    lat: 45.5179, lng: -73.5553,
  },

  // ── 🏛️ MUNICIPAL ────────────────────────────────────────────
  {
    id: 'arrond-plateau',
    nom: 'Arrondissement Plateau-Mont-Royal',
    cat: 'gouvernement', sousCat: 'Municipal',
    adresse: '801 chemin Cherrier',
    lat: 45.5221, lng: -73.5788,
  },
  {
    id: 'cour-municipale-mtl',
    nom: 'Cour municipale de Montréal',
    cat: 'gouvernement', sousCat: 'Municipal',
    adresse: '775 rue Gosford',
    lat: 45.5081, lng: -73.5548,
  },
  {
    id: 'spvm-pdq38',
    nom: 'SPVM — Poste de quartier 38',
    cat: 'gouvernement', sousCat: 'Municipal',
    adresse: '4399 rue De Lorimier',
    lat: 45.5348, lng: -73.5659,
  },
  {
    id: 'caserne-7',
    nom: 'Caserne de pompiers #7',
    cat: 'gouvernement', sousCat: 'Municipal',
    adresse: '3733 av. Durocher',
    lat: 45.5192, lng: -73.6007,
  },
  {
    id: 'ecoquartier-plateau',
    nom: 'Écoquartier Plateau-Mont-Royal',
    cat: 'communaute', sousCat: 'Municipal',
    adresse: '4120 av. de l\'Esplanade',
    lat: 45.5228, lng: -73.5974,
  },

  // ── 🏥 SANTÉ ─────────────────────────────────────────────────
  {
    id: 'clsc-plateau',
    nom: 'CLSC du Plateau-Mont-Royal',
    cat: 'sante', sousCat: 'Santé',
    adresse: '4689 av. Papineau',
    lat: 45.5396, lng: -73.5745,
  },
  {
    id: 'clsc-saint-louis',
    nom: 'CLSC Saint-Louis-du-Parc',
    cat: 'sante', sousCat: 'Santé',
    adresse: '155 boul. Édouard-Montpetit',
    lat: 45.5035, lng: -73.6085,
  },
  {
    id: 'clinique-mile-end',
    nom: 'Clinique médicale du Mile End',
    cat: 'sante', sousCat: 'Santé',
    adresse: '1626 boul. Saint-Laurent',
    lat: 45.5249, lng: -73.5980,
  },
  {
    id: 'jgh',
    nom: 'Hôpital Général Juif (JGH)',
    cat: 'sante', sousCat: 'Santé',
    adresse: '3755 ch. Côte-Sainte-Catherine',
    lat: 45.4914, lng: -73.6270,
  },
  {
    id: 'cusm-glen',
    nom: 'CUSM — Hôpital Royal Victoria (Glen)',
    cat: 'sante', sousCat: 'Santé',
    adresse: '1001 boul. Décarie',
    lat: 45.4733, lng: -73.6027,
  },

  // ── 📚 ÉDUCATION ─────────────────────────────────────────────
  {
    id: 'bib-mordecai-richler',
    nom: 'Bibliothèque Mordecai-Richler',
    cat: 'education', sousCat: 'Bibliothèque',
    adresse: '370 av. Laurier O',
    lat: 45.5181, lng: -73.6017,
  },
  {
    id: 'ecole-lambert-closse',
    nom: 'École Lambert-Closse',
    cat: 'education', sousCat: 'École',
    adresse: '4433 av. de l\'Esplanade',
    lat: 45.5207, lng: -73.5974,
  },
  {
    id: 'ecole-paul-bruchesi',
    nom: 'École Paul-Bruchési',
    cat: 'education', sousCat: 'École',
    adresse: '4925 av. de l\'Esplanade',
    lat: 45.5227, lng: -73.5974,
  },
  {
    id: 'ecole-face',
    nom: 'École FACE',
    cat: 'education', sousCat: 'École',
    adresse: '3449 rue Saint-Hubert',
    lat: 45.5219, lng: -73.5747,
  },
  {
    id: 'college-francais',
    nom: 'Collège Français',
    cat: 'education', sousCat: 'Collège',
    adresse: '5155 av. de Gaspé',
    lat: 45.5197, lng: -73.5873,
  },

  // ── 🤝 COMMUNAUTAIRES ────────────────────────────────────────
  {
    id: 'mecm',
    nom: 'Mile End Community Mission',
    cat: 'communaute', sousCat: 'Organisme',
    adresse: '55 av. Duluth E',
    lat: 45.5186, lng: -73.5826,
  },
  {
    id: 'popir-logement',
    nom: 'POPIR Comité Logement',
    cat: 'communaute', sousCat: 'Organisme',
    adresse: '1200 rue Atateken',
    lat: 45.5098, lng: -73.5668,
  },
  {
    id: 'ymca-du-parc',
    nom: 'YMCA du Parc',
    cat: 'communaute', sousCat: 'Organisme',
    adresse: '5765 av. du Parc',
    lat: 45.5198, lng: -73.6011,
  },
  {
    id: 'carrefour-femmes',
    nom: 'Carrefour des femmes du Grand Montréal',
    cat: 'communaute', sousCat: 'Organisme',
    adresse: '3750 boul. Saint-Laurent',
    lat: 45.5140, lng: -73.5836,
  },
  {
    id: 'l-itineraire',
    nom: 'L\'Itinéraire',
    cat: 'communaute', sousCat: 'Organisme',
    adresse: '1976 boul. Saint-Laurent',
    lat: 45.5183, lng: -73.5800,
  },
  {
    id: 'dans-la-rue',
    nom: 'Dans la rue',
    cat: 'communaute', sousCat: 'Organisme',
    adresse: '1664 rue Ontario E',
    lat: 45.5197, lng: -73.5557,
  },
  {
    id: 'action-alimentation',
    nom: 'Ressources Action Alimentation',
    cat: 'communaute', sousCat: 'Organisme',
    adresse: '3535 rue Berri',
    lat: 45.5202, lng: -73.5836,
  },

  // ── 🎭 CULTURE ───────────────────────────────────────────────
  {
    id: 'casa-del-popolo',
    nom: 'Casa del Popolo',
    cat: 'culture', sousCat: 'Culture',
    adresse: '4873 boul. Saint-Laurent',
    lat: 45.5196, lng: -73.5946,
  },
  {
    id: 'sala-rossa',
    nom: 'Sala Rossa',
    cat: 'culture', sousCat: 'Culture',
    adresse: '4848 boul. Saint-Laurent',
    lat: 45.5193, lng: -73.5948,
  },
  {
    id: 'theatre-rialto',
    nom: 'Théâtre Rialto',
    cat: 'culture', sousCat: 'Culture',
    adresse: '5723 av. du Parc',
    lat: 45.5186, lng: -73.6012,
  },
  {
    id: 'ubisoft-montreal',
    nom: 'Ubisoft Montréal',
    cat: 'culture', sousCat: 'Culture',
    adresse: '5505 boul. Saint-Laurent',
    lat: 45.5221, lng: -73.5956,
  },
  {
    id: 'drawn-quarterly',
    nom: 'Librairie Drawn & Quarterly',
    cat: 'culture', sousCat: 'Culture',
    adresse: '211 av. Bernard O',
    lat: 45.5254, lng: -73.6019,
  },
  {
    id: 'memoire-mile-end',
    nom: 'Mémoire du Mile End',
    cat: 'culture', sousCat: 'Culture',
    adresse: '5765 av. du Parc (YMCA)',
    lat: 45.5204, lng: -73.6009,
  },

  // ── 🌳 ESPACES PUBLICS ───────────────────────────────────────
  {
    id: 'parc-lahaie',
    nom: 'Parc Lahaie',
    cat: 'public', sousCat: 'Parc',
    adresse: 'Av. du Parc / Bernard',
    lat: 45.5252, lng: -73.6032,
  },
  {
    id: 'champ-possibles',
    nom: 'Champ des Possibles',
    cat: 'public', sousCat: 'Parc',
    adresse: 'Rue Saint-Viateur E / voie ferrée',
    lat: 45.5269, lng: -73.5882,
  },
  {
    id: 'parc-jeanne-mance',
    nom: 'Parc Jeanne-Mance',
    cat: 'public', sousCat: 'Parc',
    adresse: 'Av. du Parc / Rachel',
    lat: 45.5143, lng: -73.5954,
  },
  {
    id: 'parc-saint-michel',
    nom: 'Parc Saint-Michel',
    cat: 'public', sousCat: 'Parc',
    adresse: '3335 av. Christophe-Colomb',
    lat: 45.5432, lng: -73.5790,
  },

  // ── ⛪ RELIGIEUX ─────────────────────────────────────────────
  {
    id: 'eglise-saint-enfant-jesus',
    nom: 'Église Saint-Enfant-Jésus du Mile End',
    cat: 'religion', sousCat: 'Lieu de culte',
    adresse: '5039 rue Saint-Dominique',
    lat: 45.5238, lng: -73.5958,
  },
  {
    id: 'synagogues-hassidiques',
    nom: 'Synagogues hassidiques — Mile End',
    cat: 'religion', sousCat: 'Lieu de culte',
    adresse: 'Secteur Hutchison / Van Horne',
    lat: 45.5311, lng: -73.6074,
  },

  // ── 🍽️ EMBLÈMES ──────────────────────────────────────────────
  {
    id: 'st-viateur-bagel',
    nom: 'St-Viateur Bagel',
    cat: 'identite', sousCat: 'Emblème',
    adresse: '263 rue Saint-Viateur O',
    lat: 45.5249, lng: -73.5967,
  },
  {
    id: 'fairmount-bagel',
    nom: 'Fairmount Bagel',
    cat: 'identite', sousCat: 'Emblème',
    adresse: '74 av. Fairmount O',
    lat: 45.5241, lng: -73.5962,
  },
  {
    id: 'wilenskys',
    nom: "Wilensky's Light Lunch",
    cat: 'identite', sousCat: 'Emblème',
    adresse: '34 av. Fairmount O',
    lat: 45.5238, lng: -73.5965,
  },
];
