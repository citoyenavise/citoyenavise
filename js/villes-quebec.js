// js/villes-quebec.js — Hôtels de Ville du Québec par région et MRC

const QC_REGIONS = [
  { id: '01', nom: 'Bas-Saint-Laurent',              abrv: 'BSL',  centre: [48.10, -68.50], zoom: 8 },
  { id: '02', nom: 'Saguenay–Lac-Saint-Jean',        abrv: 'SLSJ', centre: [48.60, -71.50], zoom: 8 },
  { id: '03', nom: 'Capitale-Nationale',             abrv: 'CN',   centre: [46.90, -71.00], zoom: 9 },
  { id: '04', nom: 'Mauricie',                       abrv: 'MAU',  centre: [46.80, -72.80], zoom: 8 },
  { id: '05', nom: 'Estrie',                         abrv: 'EST',  centre: [45.45, -71.90], zoom: 9 },
  { id: '06', nom: 'Montréal',                       abrv: 'MTL',  centre: [45.52, -73.58], zoom: 12 },
  { id: '07', nom: 'Outaouais',                      abrv: 'OUT',  centre: [45.80, -75.80], zoom: 8 },
  { id: '08', nom: 'Abitibi-Témiscamingue',          abrv: 'AT',   centre: [48.20, -78.50], zoom: 7 },
  { id: '09', nom: 'Côte-Nord',                      abrv: 'CON',  centre: [50.00, -67.50], zoom: 7 },
  { id: '10', nom: 'Nord-du-Québec',                 abrv: 'NQ',   centre: [53.00, -74.00], zoom: 6 },
  { id: '11', nom: 'Gaspésie–Îles-de-la-Madeleine', abrv: 'GIM',  centre: [48.60, -65.50], zoom: 7 },
  { id: '12', nom: 'Chaudière-Appalaches',           abrv: 'CA',   centre: [46.20, -70.80], zoom: 8 },
  { id: '13', nom: 'Laval',                          abrv: 'LAV',  centre: [45.57, -73.69], zoom: 12 },
  { id: '14', nom: 'Lanaudière',                     abrv: 'LAN',  centre: [46.00, -73.50], zoom: 8 },
  { id: '15', nom: 'Laurentides',                    abrv: 'LAU',  centre: [46.20, -74.20], zoom: 8 },
  { id: '16', nom: 'Montérégie',                     abrv: 'MR',   centre: [45.45, -73.10], zoom: 9 },
  { id: '17', nom: 'Centre-du-Québec',               abrv: 'CQ',   centre: [46.10, -72.20], zoom: 9 },
];

const QC_MRC = [
  // ── 01 Bas-Saint-Laurent ──────────────────────────────────────
  { id: 'bsl-kamouraska',  nom: 'Kamouraska',        region: '01', centre: [47.50, -69.90], zoom: 10 },
  { id: 'bsl-rdl',         nom: 'Rivière-du-Loup',   region: '01', centre: [47.83, -69.53], zoom: 11 },
  { id: 'bsl-temiscouata', nom: 'Témiscouata',        region: '01', centre: [47.67, -68.88], zoom: 10 },
  { id: 'bsl-basques',     nom: 'Les Basques',        region: '01', centre: [48.11, -69.18], zoom: 11 },
  { id: 'bsl-rimouski',    nom: 'Rimouski-Neigette',  region: '01', centre: [48.45, -68.53], zoom: 11 },
  { id: 'bsl-mitis',       nom: 'La Mitis',           region: '01', centre: [48.58, -68.17], zoom: 11 },
  { id: 'bsl-matapedia',   nom: 'La Matapédia',       region: '01', centre: [48.46, -67.43], zoom: 10 },
  { id: 'bsl-matanie',     nom: 'La Matanie',         region: '01', centre: [48.85, -67.53], zoom: 11 },

  // ── 02 Saguenay–Lac-Saint-Jean ───────────────────────────────
  { id: 'slsj-lsje',      nom: 'Lac-Saint-Jean-Est',      region: '02', centre: [48.55, -71.65], zoom: 10 },
  { id: 'slsj-maria',     nom: 'Maria-Chapdelaine',        region: '02', centre: [48.88, -72.23], zoom: 10 },
  { id: 'slsj-domaine',   nom: 'Domaine-du-Roy',           region: '02', centre: [48.60, -72.44], zoom: 10 },
  { id: 'slsj-fjord',     nom: 'Le Fjord-du-Saguenay',     region: '02', centre: [48.30, -70.80], zoom: 9  },
  { id: 'slsj-saguenay',  nom: 'Saguenay (agglomération)', region: '02', centre: [48.42, -71.07], zoom: 11 },

  // ── 03 Capitale-Nationale ────────────────────────────────────
  { id: 'cn-charlevoix',   nom: 'Charlevoix',             region: '03', centre: [47.55, -70.52], zoom: 10 },
  { id: 'cn-charlevoix-e', nom: 'Charlevoix-Est',         region: '03', centre: [47.70, -70.15], zoom: 10 },
  { id: 'cn-portneuf',     nom: 'Portneuf',               region: '03', centre: [46.72, -71.88], zoom: 10 },
  { id: 'cn-quebec',       nom: 'Québec (ville)',          region: '03', centre: [46.81, -71.21], zoom: 12 },
  { id: 'cn-jc',           nom: 'La Jacques-Cartier',      region: '03', centre: [47.00, -71.50], zoom: 10 },
  { id: 'cn-beaupre',      nom: 'La Côte-de-Beaupré',     region: '03', centre: [47.05, -70.98], zoom: 11 },

  // ── 04 Mauricie ──────────────────────────────────────────────
  { id: 'mau-maskinonge',    nom: 'Maskinongé',           region: '04', centre: [46.26, -72.95], zoom: 10 },
  { id: 'mau-chenaux',       nom: 'Les Chenaux',          region: '04', centre: [46.50, -72.40], zoom: 10 },
  { id: 'mau-mekinac',       nom: 'Mékinac',              region: '04', centre: [47.00, -72.60], zoom: 10 },
  { id: 'mau-shawinigan',    nom: 'Shawinigan',           region: '04', centre: [46.56, -72.75], zoom: 11 },
  { id: 'mau-troisrivieres', nom: 'Trois-Rivières',       region: '04', centre: [46.34, -72.54], zoom: 12 },
  { id: 'mau-latuque',       nom: 'La Tuque',             region: '04', centre: [47.43, -72.78], zoom: 11 },

  // ── 05 Estrie ────────────────────────────────────────────────
  { id: 'est-granit',       nom: 'Le Granit',              region: '05', centre: [45.58, -70.88], zoom: 10 },
  { id: 'est-sources',      nom: 'Les Sources',            region: '05', centre: [45.77, -71.93], zoom: 11 },
  { id: 'est-hsf',          nom: 'Le Haut-Saint-François', region: '05', centre: [45.48, -71.65], zoom: 10 },
  { id: 'est-vsf',          nom: 'Le Val-Saint-François',  region: '05', centre: [45.57, -72.00], zoom: 11 },
  { id: 'est-sherbrooke',   nom: 'Sherbrooke',             region: '05', centre: [45.40, -71.89], zoom: 12 },
  { id: 'est-coaticook',    nom: 'Coaticook',              region: '05', centre: [45.13, -71.80], zoom: 11 },
  { id: 'est-memphremagog', nom: 'Memphrémagog',           region: '05', centre: [45.27, -72.15], zoom: 11 },

  // ── 06 Montréal ──────────────────────────────────────────────
  { id: 'mtl-ville', nom: 'Montréal (agglomération)', region: '06', centre: [45.51, -73.58], zoom: 12 },

  // ── 07 Outaouais ─────────────────────────────────────────────
  { id: 'out-papineau',  nom: 'Papineau',                      region: '07', centre: [45.80, -75.00], zoom: 10 },
  { id: 'out-gatineau',  nom: 'Gatineau',                      region: '07', centre: [45.47, -75.70], zoom: 12 },
  { id: 'out-collines',  nom: "Les Collines-de-l'Outaouais",   region: '07', centre: [45.70, -75.80], zoom: 10 },
  { id: 'out-vallee',    nom: 'La Vallée-de-la-Gatineau',      region: '07', centre: [46.38, -75.97], zoom: 9  },
  { id: 'out-pontiac',   nom: 'Pontiac',                       region: '07', centre: [45.70, -76.60], zoom: 9  },

  // ── 08 Abitibi-Témiscamingue ─────────────────────────────────
  { id: 'at-abitibi',       nom: 'Abitibi',             region: '08', centre: [48.56, -78.11], zoom: 10 },
  { id: 'at-abitibi-o',     nom: 'Abitibi-Ouest',       region: '08', centre: [48.80, -79.20], zoom: 10 },
  { id: 'at-rouyn',         nom: 'Rouyn-Noranda',        region: '08', centre: [48.23, -79.02], zoom: 11 },
  { id: 'at-valleeor',      nom: "Vallée-de-l'Or",      region: '08', centre: [48.10, -77.80], zoom: 10 },
  { id: 'at-temiscamingue', nom: 'Témiscamingue',        region: '08', centre: [47.33, -79.44], zoom: 10 },

  // ── 09 Côte-Nord ─────────────────────────────────────────────
  { id: 'con-hcn',          nom: 'La Haute-Côte-Nord',  region: '09', centre: [48.80, -69.20], zoom: 9  },
  { id: 'con-manicouagan',  nom: 'Manicouagan',          region: '09', centre: [49.22, -68.15], zoom: 10 },
  { id: 'con-septrivieres', nom: 'Sept-Rivières',        region: '09', centre: [50.22, -66.38], zoom: 10 },
  { id: 'con-minganie',     nom: 'Minganie',             region: '09', centre: [50.28, -63.60], zoom: 9  },

  // ── 10 Nord-du-Québec ────────────────────────────────────────
  { id: 'nq-jamesie', nom: 'Jamésie', region: '10', centre: [49.92, -74.37], zoom: 8 },

  // ── 11 Gaspésie–Îles-de-la-Madeleine ─────────────────────────
  { id: 'gim-haute-gaspesie', nom: 'La Haute-Gaspésie',         region: '11', centre: [49.13, -66.50], zoom: 10 },
  { id: 'gim-cote-gaspesie',  nom: 'La Côte-de-Gaspé',         region: '11', centre: [48.83, -64.48], zoom: 10 },
  { id: 'gim-bonaventure',    nom: 'Bonaventure',               region: '11', centre: [48.17, -65.88], zoom: 10 },
  { id: 'gim-rocher-perce',   nom: 'Rocher-Percé',              region: '11', centre: [48.35, -64.67], zoom: 11 },
  { id: 'gim-avignon',        nom: 'Avignon',                   region: '11', centre: [48.10, -66.13], zoom: 11 },
  { id: 'gim-iles',           nom: 'Les Îles-de-la-Madeleine',  region: '11', centre: [47.38, -61.87], zoom: 11 },

  // ── 12 Chaudière-Appalaches ──────────────────────────────────
  { id: 'ca-lislet',          nom: "L'Islet",            region: '12', centre: [47.10, -70.33], zoom: 10 },
  { id: 'ca-montmagny',       nom: 'Montmagny',           region: '12', centre: [47.00, -70.55], zoom: 11 },
  { id: 'ca-bellechasse',     nom: 'Bellechasse',         region: '12', centre: [46.80, -70.80], zoom: 10 },
  { id: 'ca-levis',           nom: 'Lévis',               region: '12', centre: [46.80, -71.18], zoom: 12 },
  { id: 'ca-nouvelle-beauce', nom: 'La Nouvelle-Beauce',  region: '12', centre: [46.45, -71.03], zoom: 11 },
  { id: 'ca-robert-cliche',   nom: 'Robert-Cliche',       region: '12', centre: [46.13, -71.00], zoom: 11 },
  { id: 'ca-etchemins',       nom: 'Les Etchemins',       region: '12', centre: [46.40, -70.50], zoom: 10 },
  { id: 'ca-beauce-sartigan', nom: 'Beauce-Sartigan',     region: '12', centre: [45.17, -70.67], zoom: 10 },
  { id: 'ca-appalaches',      nom: 'Les Appalaches',      region: '12', centre: [46.10, -71.30], zoom: 10 },

  // ── 13 Laval ─────────────────────────────────────────────────
  { id: 'lav-laval', nom: 'Laval', region: '13', centre: [45.57, -73.69], zoom: 12 },

  // ── 14 Lanaudière ────────────────────────────────────────────
  { id: 'lan-autray',     nom: "D'Autray",      region: '14', centre: [46.08, -73.18], zoom: 10 },
  { id: 'lan-joliette',   nom: 'Joliette',      region: '14', centre: [46.02, -73.43], zoom: 11 },
  { id: 'lan-assomption', nom: "L'Assomption",  region: '14', centre: [45.83, -73.42], zoom: 11 },
  { id: 'lan-moulins',    nom: 'Les Moulins',   region: '14', centre: [45.70, -73.61], zoom: 11 },
  { id: 'lan-matawinie',  nom: 'Matawinie',     region: '14', centre: [46.40, -73.50], zoom: 9  },
  { id: 'lan-montcalm',   nom: 'Montcalm',      region: '14', centre: [45.93, -73.78], zoom: 10 },
  { id: 'lan-achigan',    nom: "L'Achigan",     region: '14', centre: [45.87, -73.64], zoom: 10 },

  // ── 15 Laurentides ───────────────────────────────────────────
  { id: 'lau-deuxmontagnes', nom: 'Deux-Montagnes',        region: '15', centre: [45.55, -74.00], zoom: 11 },
  { id: 'lau-rdnord',        nom: 'La Rivière-du-Nord',    region: '15', centre: [45.78, -74.00], zoom: 11 },
  { id: 'lau-blainville',    nom: 'Thérèse-De Blainville', region: '15', centre: [45.65, -73.85], zoom: 11 },
  { id: 'lau-laurentides',   nom: 'Les Laurentides',       region: '15', centre: [46.05, -74.28], zoom: 10 },
  { id: 'lau-paysen',        nom: "Les Pays-d'en-Haut",    region: '15', centre: [45.95, -74.20], zoom: 10 },
  { id: 'lau-antoine',       nom: 'Antoine-Labelle',       region: '15', centre: [46.55, -75.50], zoom: 9  },
  { id: 'lau-argenteuil',    nom: 'Argenteuil',            region: '15', centre: [45.65, -74.33], zoom: 10 },
  { id: 'lau-mirabel',       nom: 'Mirabel',               region: '15', centre: [45.65, -74.08], zoom: 11 },

  // ── 16 Montérégie ────────────────────────────────────────────
  { id: 'mr-napierville',  nom: 'Les Jardins-de-Napierville', region: '16', centre: [45.18, -73.55], zoom: 11 },
  { id: 'mr-hsl',          nom: 'Le Haut-Saint-Laurent',      region: '16', centre: [45.15, -74.10], zoom: 10 },
  { id: 'mr-beauharnois',  nom: 'Beauharnois-Salaberry',      region: '16', centre: [45.25, -74.13], zoom: 11 },
  { id: 'mr-roussillon',   nom: 'Roussillon',                 region: '16', centre: [45.40, -73.55], zoom: 11 },
  { id: 'mr-longueuil',    nom: 'Longueuil (agglomération)',   region: '16', centre: [45.53, -73.51], zoom: 12 },
  { id: 'mr-marguerite',   nom: "Marguerite-D'Youville",      region: '16', centre: [45.61, -73.38], zoom: 11 },
  { id: 'mr-rouville',     nom: 'Rouville',                   region: '16', centre: [45.42, -73.00], zoom: 11 },
  { id: 'mr-richelieu',    nom: 'La Vallée-du-Richelieu',     region: '16', centre: [45.55, -73.20], zoom: 11 },
  { id: 'mr-brome',        nom: 'Brome-Missisquoi',           region: '16', centre: [45.22, -72.75], zoom: 10 },
  { id: 'mr-yamaska',      nom: 'La Haute-Yamaska',           region: '16', centre: [45.40, -72.73], zoom: 11 },
  { id: 'mr-acton',        nom: 'Acton',                      region: '16', centre: [45.65, -72.57], zoom: 11 },
  { id: 'mr-pdesaurel',    nom: 'Pierre-De Saurel',           region: '16', centre: [46.03, -73.12], zoom: 11 },
  { id: 'mr-maskoutains',  nom: 'Les Maskoutains',            region: '16', centre: [45.62, -72.95], zoom: 11 },
  { id: 'mr-bas-richelieu',nom: 'Le Bas-Richelieu',           region: '16', centre: [46.00, -72.88], zoom: 11 },
  { id: 'mr-vaudreuil',    nom: 'Vaudreuil-Soulanges',        region: '16', centre: [45.40, -74.03], zoom: 11 },
  { id: 'mr-haut-richelieu',nom: 'Le Haut-Richelieu',         region: '16', centre: [45.32, -73.27], zoom: 11 },

  // ── 17 Centre-du-Québec ──────────────────────────────────────
  { id: 'cq-arthabaska', nom: 'Arthabaska',       region: '17', centre: [46.07, -71.95], zoom: 10 },
  { id: 'cq-nicolet',    nom: 'Nicolet-Yamaska',  region: '17', centre: [46.23, -72.62], zoom: 11 },
  { id: 'cq-drummond',   nom: 'Drummond',         region: '17', centre: [45.88, -72.48], zoom: 11 },
  { id: 'cq-erable',     nom: "L'Érable",         region: '17', centre: [46.22, -71.77], zoom: 11 },
  { id: 'cq-becancour',  nom: 'Bécancour',        region: '17', centre: [46.33, -72.42], zoom: 11 },
];

const QC_VILLES = [
  // ══════════════════════════════════════════
  // 01 — Bas-Saint-Laurent
  // ══════════════════════════════════════════
  { id: 'la-pocatiere',           nom: 'La Pocatière',           mrc: 'bsl-kamouraska',  region: '01', lat: 47.3623, lng: -69.9729 },
  { id: 'riviere-du-loup',        nom: 'Rivière-du-Loup',        mrc: 'bsl-rdl',         region: '01', lat: 47.8287, lng: -69.5347 },
  { id: 'temiscouata-sur-le-lac', nom: 'Témiscouata-sur-le-Lac', mrc: 'bsl-temiscouata', region: '01', lat: 47.6900, lng: -68.8882 },
  { id: 'trois-pistoles',         nom: 'Trois-Pistoles',         mrc: 'bsl-basques',     region: '01', lat: 48.1213, lng: -69.1741 },
  { id: 'rimouski',               nom: 'Rimouski',               mrc: 'bsl-rimouski',    region: '01', lat: 48.4479, lng: -68.5273 },
  { id: 'mont-joli',              nom: 'Mont-Joli',              mrc: 'bsl-mitis',       region: '01', lat: 48.5830, lng: -68.1835 },
  { id: 'amqui',                  nom: 'Amqui',                  mrc: 'bsl-matapedia',   region: '01', lat: 48.4645, lng: -67.4310 },
  { id: 'matane',                 nom: 'Matane',                 mrc: 'bsl-matanie',     region: '01', lat: 48.8511, lng: -67.5336 },

  // ══════════════════════════════════════════
  // 02 — Saguenay–Lac-Saint-Jean
  // ══════════════════════════════════════════
  { id: 'alma',               nom: 'Alma',               mrc: 'slsj-lsje',     region: '02', lat: 48.5499, lng: -71.6490 },
  { id: 'dolbeau-mistassini', nom: 'Dolbeau-Mistassini', mrc: 'slsj-maria',    region: '02', lat: 48.8779, lng: -72.2328 },
  { id: 'saint-felicien',     nom: 'Saint-Félicien',     mrc: 'slsj-domaine',  region: '02', lat: 48.6499, lng: -72.4675 },
  { id: 'roberval',           nom: 'Roberval',           mrc: 'slsj-domaine',  region: '02', lat: 48.5210, lng: -72.2296 },
  { id: 'saguenay',           nom: 'Saguenay',           mrc: 'slsj-saguenay', region: '02', lat: 48.4009, lng: -71.0546 },

  // ══════════════════════════════════════════
  // 03 — Capitale-Nationale
  // ══════════════════════════════════════════
  { id: 'baie-saint-paul',     nom: 'Baie-Saint-Paul',             mrc: 'cn-charlevoix',   region: '03', lat: 47.4437, lng: -70.5310 },
  { id: 'la-malbaie',          nom: 'La Malbaie',                  mrc: 'cn-charlevoix-e', region: '03', lat: 47.6516, lng: -70.1613 },
  { id: 'portneuf',            nom: 'Portneuf',                    mrc: 'cn-portneuf',     region: '03', lat: 46.6901, lng: -71.8825 },
  { id: 'saint-augustin-desm', nom: 'Saint-Augustin-de-Desmaures', mrc: 'cn-portneuf',     region: '03', lat: 46.7379, lng: -71.4542 },
  { id: 'ancienne-lorette',    nom: "L'Ancienne-Lorette",          mrc: 'cn-quebec',       region: '03', lat: 46.7936, lng: -71.3644 },
  { id: 'quebec',              nom: 'Québec',                      mrc: 'cn-quebec',       region: '03', lat: 46.8133, lng: -71.2076 },

  // ══════════════════════════════════════════
  // 04 — Mauricie
  // ══════════════════════════════════════════
  { id: 'louiseville',    nom: 'Louiseville',    mrc: 'mau-maskinonge',    region: '04', lat: 46.2530, lng: -72.9412 },
  { id: 'trois-rivieres', nom: 'Trois-Rivières', mrc: 'mau-troisrivieres', region: '04', lat: 46.3435, lng: -72.5421 },
  { id: 'shawinigan',     nom: 'Shawinigan',     mrc: 'mau-shawinigan',    region: '04', lat: 46.5706, lng: -72.7463 },
  { id: 'la-tuque',       nom: 'La Tuque',       mrc: 'mau-latuque',       region: '04', lat: 47.4336, lng: -72.7896 },

  // ══════════════════════════════════════════
  // 05 — Estrie
  // ══════════════════════════════════════════
  { id: 'lac-megantic',    nom: 'Lac-Mégantic',     mrc: 'est-granit',       region: '05', lat: 45.5803, lng: -70.8838 },
  { id: 'val-des-sources', nom: 'Val-des-Sources',  mrc: 'est-sources',      region: '05', lat: 45.7651, lng: -71.9306 },
  { id: 'east-angus',      nom: 'East Angus',        mrc: 'est-hsf',          region: '05', lat: 45.4845, lng: -71.6656 },
  { id: 'cookshire-eaton', nom: 'Cookshire-Eaton',  mrc: 'est-hsf',          region: '05', lat: 45.4160, lng: -71.6301 },
  { id: 'windsor',         nom: 'Windsor',           mrc: 'est-vsf',          region: '05', lat: 45.5673, lng: -71.9993 },
  { id: 'sherbrooke',      nom: 'Sherbrooke',        mrc: 'est-sherbrooke',   region: '05', lat: 45.4040, lng: -71.8943 },
  { id: 'coaticook',       nom: 'Coaticook',         mrc: 'est-coaticook',    region: '05', lat: 45.1327, lng: -71.8028 },
  { id: 'magog',           nom: 'Magog',             mrc: 'est-memphremagog', region: '05', lat: 45.2643, lng: -72.1494 },

  // ══════════════════════════════════════════
  // 06 — Montréal
  // ══════════════════════════════════════════
  { id: 'montreal',       nom: 'Montréal',       mrc: 'mtl-ville', region: '06', lat: 45.5088, lng: -73.5538 },
  { id: 'cote-saint-luc', nom: 'Côte-Saint-Luc', mrc: 'mtl-ville', region: '06', lat: 45.4708, lng: -73.6669 },
  { id: 'mont-royal',     nom: 'Mont-Royal',     mrc: 'mtl-ville', region: '06', lat: 45.5145, lng: -73.6419 },
  { id: 'westmount',      nom: 'Westmount',      mrc: 'mtl-ville', region: '06', lat: 45.4830, lng: -73.6028 },
  { id: 'hampstead',      nom: 'Hampstead',      mrc: 'mtl-ville', region: '06', lat: 45.4808, lng: -73.6248 },
  { id: 'montreal-est',   nom: 'Montréal-Est',   mrc: 'mtl-ville', region: '06', lat: 45.6222, lng: -73.4972 },
  { id: 'montreal-ouest', nom: 'Montréal-Ouest', mrc: 'mtl-ville', region: '06', lat: 45.4527, lng: -73.6438 },

  // ══════════════════════════════════════════
  // 07 — Outaouais
  // ══════════════════════════════════════════
  { id: 'gatineau', nom: 'Gatineau', mrc: 'out-gatineau', region: '07', lat: 45.4774, lng: -75.6998 },
  { id: 'maniwaki', nom: 'Maniwaki', mrc: 'out-vallee',   region: '07', lat: 46.3858, lng: -75.9724 },

  // ══════════════════════════════════════════
  // 08 — Abitibi-Témiscamingue
  // ══════════════════════════════════════════
  { id: 'amos',          nom: 'Amos',          mrc: 'at-abitibi',       region: '08', lat: 48.5681, lng: -78.1165 },
  { id: 'la-sarre',      nom: 'La Sarre',      mrc: 'at-abitibi-o',     region: '08', lat: 48.8010, lng: -79.1967 },
  { id: 'rouyn-noranda', nom: 'Rouyn-Noranda', mrc: 'at-rouyn',         region: '08', lat: 48.2360, lng: -79.0163 },
  { id: 'val-dor',       nom: "Val-d'Or",      mrc: 'at-valleeor',      region: '08', lat: 48.0964, lng: -77.7943 },
  { id: 'ville-marie',   nom: 'Ville-Marie',   mrc: 'at-temiscamingue', region: '08', lat: 47.3320, lng: -79.4375 },
  { id: 'temiscaming',   nom: 'Témiscaming',   mrc: 'at-temiscamingue', region: '08', lat: 46.7212, lng: -79.1027 },

  // ══════════════════════════════════════════
  // 09 — Côte-Nord
  // ══════════════════════════════════════════
  { id: 'baie-comeau', nom: 'Baie-Comeau', mrc: 'con-manicouagan',  region: '09', lat: 49.2183, lng: -68.1533 },
  { id: 'sept-iles',   nom: 'Sept-Îles',   mrc: 'con-septrivieres', region: '09', lat: 50.2231, lng: -66.3760 },
  { id: 'port-cartier',nom: 'Port-Cartier', mrc: 'con-septrivieres', region: '09', lat: 50.0218, lng: -66.8744 },

  // ══════════════════════════════════════════
  // 10 — Nord-du-Québec
  // ══════════════════════════════════════════
  { id: 'chibougamau', nom: 'Chibougamau', mrc: 'nq-jamesie', region: '10', lat: 49.9167, lng: -74.3667 },
  { id: 'chapais',     nom: 'Chapais',     mrc: 'nq-jamesie', region: '10', lat: 49.7833, lng: -74.8500 },

  // ══════════════════════════════════════════
  // 11 — Gaspésie–Îles-de-la-Madeleine
  // ══════════════════════════════════════════
  { id: 'sainte-anne-des-monts', nom: 'Sainte-Anne-des-Monts',  mrc: 'gim-haute-gaspesie', region: '11', lat: 49.1285, lng: -66.4942 },
  { id: 'gaspe',                 nom: 'Gaspé',                   mrc: 'gim-cote-gaspesie',  region: '11', lat: 48.8317, lng: -64.4845 },
  { id: 'new-richmond',          nom: 'New Richmond',            mrc: 'gim-bonaventure',    region: '11', lat: 48.1646, lng: -65.8677 },
  { id: 'chandler',              nom: 'Chandler',                mrc: 'gim-rocher-perce',   region: '11', lat: 48.3487, lng: -64.6806 },
  { id: 'carleton-sur-mer',      nom: 'Carleton-sur-Mer',        mrc: 'gim-avignon',        region: '11', lat: 48.1040, lng: -66.1308 },
  { id: 'les-iles-de-la-mad',    nom: 'Les Îles-de-la-Madeleine',mrc: 'gim-iles',           region: '11', lat: 47.3808, lng: -61.8635 },

  // ══════════════════════════════════════════
  // 12 — Chaudière-Appalaches
  // ══════════════════════════════════════════
  { id: 'montmagny',           nom: 'Montmagny',              mrc: 'ca-montmagny',       region: '12', lat: 46.9802, lng: -70.5516 },
  { id: 'levis',               nom: 'Lévis',                  mrc: 'ca-levis',           region: '12', lat: 46.8066, lng: -71.1773 },
  { id: 'sainte-marie',        nom: 'Sainte-Marie',           mrc: 'ca-nouvelle-beauce', region: '12', lat: 46.4479, lng: -71.0292 },
  { id: 'saint-joseph-beauce', nom: 'Saint-Joseph-de-Beauce', mrc: 'ca-robert-cliche',   region: '12', lat: 46.2961, lng: -70.8692 },
  { id: 'lac-etchemin',        nom: 'Lac-Etchemin',           mrc: 'ca-etchemins',       region: '12', lat: 46.4049, lng: -70.5006 },
  { id: 'saint-georges',       nom: 'Saint-Georges',          mrc: 'ca-beauce-sartigan', region: '12', lat: 45.1167, lng: -70.6706 },
  { id: 'thetford-mines',      nom: 'Thetford Mines',         mrc: 'ca-appalaches',      region: '12', lat: 46.1017, lng: -71.2978 },

  // ══════════════════════════════════════════
  // 13 — Laval
  // ══════════════════════════════════════════
  { id: 'laval', nom: 'Laval', mrc: 'lav-laval', region: '13', lat: 45.5666, lng: -73.6879 },

  // ══════════════════════════════════════════
  // 14 — Lanaudière
  // ══════════════════════════════════════════
  { id: 'berthierville',      nom: 'Berthierville',       mrc: 'lan-autray',     region: '14', lat: 46.0826, lng: -73.1820 },
  { id: 'joliette',           nom: 'Joliette',            mrc: 'lan-joliette',   region: '14', lat: 46.0162, lng: -73.4336 },
  { id: 'l-assomption',       nom: "L'Assomption",        mrc: 'lan-assomption', region: '14', lat: 45.8309, lng: -73.4147 },
  { id: 'repentigny',         nom: 'Repentigny',          mrc: 'lan-assomption', region: '14', lat: 45.7371, lng: -73.4484 },
  { id: 'terrebonne',         nom: 'Terrebonne',          mrc: 'lan-moulins',    region: '14', lat: 45.6945, lng: -73.6430 },
  { id: 'mascouche',          nom: 'Mascouche',           mrc: 'lan-moulins',    region: '14', lat: 45.7456, lng: -73.6020 },
  { id: 'rawdon',             nom: 'Rawdon',              mrc: 'lan-matawinie',  region: '14', lat: 46.0559, lng: -73.7133 },
  { id: 'saint-lin-laur',     nom: 'Saint-Lin–Laurentides',mrc: 'lan-achigan',   region: '14', lat: 45.8541, lng: -73.7672 },

  // ══════════════════════════════════════════
  // 15 — Laurentides
  // ══════════════════════════════════════════
  { id: 'lachute',              nom: 'Lachute',                mrc: 'lau-argenteuil',    region: '15', lat: 45.6526, lng: -74.3368 },
  { id: 'mirabel',              nom: 'Mirabel',                mrc: 'lau-mirabel',       region: '15', lat: 45.6500, lng: -74.0833 },
  { id: 'blainville',           nom: 'Blainville',             mrc: 'lau-blainville',    region: '15', lat: 45.6711, lng: -73.8827 },
  { id: 'boisbriand',           nom: 'Boisbriand',             mrc: 'lau-blainville',    region: '15', lat: 45.6155, lng: -73.8384 },
  { id: 'lorraine',             nom: 'Lorraine',               mrc: 'lau-blainville',    region: '15', lat: 45.6872, lng: -73.7862 },
  { id: 'rosemere',             nom: 'Rosemère',               mrc: 'lau-blainville',    region: '15', lat: 45.6390, lng: -73.8001 },
  { id: 'sainte-therese',       nom: 'Sainte-Thérèse',         mrc: 'lau-blainville',    region: '15', lat: 45.6450, lng: -73.8347 },
  { id: 'saint-jerome',         nom: 'Saint-Jérôme',           mrc: 'lau-rdnord',        region: '15', lat: 45.7783, lng: -74.0008 },
  { id: 'sainte-agathe-monts',  nom: 'Sainte-Agathe-des-Monts',mrc: 'lau-laurentides',   region: '15', lat: 46.0500, lng: -74.2833 },
  { id: 'mont-tremblant',       nom: 'Mont-Tremblant',         mrc: 'lau-laurentides',   region: '15', lat: 46.1167, lng: -74.5833 },
  { id: 'mont-laurier',         nom: 'Mont-Laurier',           mrc: 'lau-antoine',       region: '15', lat: 46.5500, lng: -75.5000 },

  // ══════════════════════════════════════════
  // 16 — Montérégie
  // ══════════════════════════════════════════
  { id: 'valleyfield',         nom: 'Salaberry-de-Valleyfield', mrc: 'mr-beauharnois',    region: '16', lat: 45.2545, lng: -74.1281 },
  { id: 'chateauguay',         nom: 'Châteauguay',              mrc: 'mr-roussillon',     region: '16', lat: 45.3667, lng: -73.7500 },
  { id: 'la-prairie',          nom: 'La Prairie',               mrc: 'mr-roussillon',     region: '16', lat: 45.4187, lng: -73.4989 },
  { id: 'sainte-catherine',    nom: 'Sainte-Catherine',         mrc: 'mr-roussillon',     region: '16', lat: 45.4002, lng: -73.5666 },
  { id: 'brossard',            nom: 'Brossard',                 mrc: 'mr-longueuil',      region: '16', lat: 45.4614, lng: -73.4680 },
  { id: 'longueuil',           nom: 'Longueuil',                mrc: 'mr-longueuil',      region: '16', lat: 45.5357, lng: -73.5185 },
  { id: 'saint-lambert',       nom: 'Saint-Lambert',            mrc: 'mr-longueuil',      region: '16', lat: 45.4994, lng: -73.5132 },
  { id: 'boucherville',        nom: 'Boucherville',             mrc: 'mr-marguerite',     region: '16', lat: 45.6024, lng: -73.4341 },
  { id: 'saint-bruno',         nom: 'Saint-Bruno-de-Montarville',mrc: 'mr-marguerite',   region: '16', lat: 45.5308, lng: -73.3545 },
  { id: 'sainte-julie',        nom: 'Sainte-Julie',             mrc: 'mr-marguerite',     region: '16', lat: 45.5873, lng: -73.3349 },
  { id: 'varennes',            nom: 'Varennes',                 mrc: 'mr-marguerite',     region: '16', lat: 45.6833, lng: -73.4333 },
  { id: 'saint-jean-richelieu',nom: 'Saint-Jean-sur-Richelieu', mrc: 'mr-haut-richelieu', region: '16', lat: 45.3167, lng: -73.2667 },
  { id: 'beloeil',             nom: 'Beloeil',                  mrc: 'mr-richelieu',      region: '16', lat: 45.5667, lng: -73.2000 },
  { id: 'otterburn-park',      nom: 'Otterburn Park',           mrc: 'mr-richelieu',      region: '16', lat: 45.5300, lng: -73.1969 },
  { id: 'mcmasterville',       nom: 'McMasterville',            mrc: 'mr-richelieu',      region: '16', lat: 45.5477, lng: -73.2101 },
  { id: 'cowansville',         nom: 'Cowansville',              mrc: 'mr-brome',          region: '16', lat: 45.1981, lng: -72.7491 },
  { id: 'farnham',             nom: 'Farnham',                  mrc: 'mr-brome',          region: '16', lat: 45.2833, lng: -72.9833 },
  { id: 'granby',              nom: 'Granby',                   mrc: 'mr-yamaska',        region: '16', lat: 45.3978, lng: -72.7317 },
  { id: 'sorel-tracy',         nom: 'Sorel-Tracy',              mrc: 'mr-pdesaurel',      region: '16', lat: 46.0365, lng: -73.1139 },
  { id: 'saint-hyacinthe',     nom: 'Saint-Hyacinthe',          mrc: 'mr-maskoutains',    region: '16', lat: 45.6158, lng: -72.9572 },
  { id: 'acton-vale',          nom: 'Acton Vale',               mrc: 'mr-acton',          region: '16', lat: 45.6509, lng: -72.5687 },
  { id: 'vaudreuil-dorion',    nom: 'Vaudreuil-Dorion',         mrc: 'mr-vaudreuil',      region: '16', lat: 45.4000, lng: -74.0333 },

  // ══════════════════════════════════════════
  // 17 — Centre-du-Québec
  // ══════════════════════════════════════════
  { id: 'victoriaville', nom: 'Victoriaville', mrc: 'cq-arthabaska', region: '17', lat: 46.0607, lng: -71.9492 },
  { id: 'warwick',       nom: 'Warwick',       mrc: 'cq-arthabaska', region: '17', lat: 45.9500, lng: -71.9000 },
  { id: 'nicolet',       nom: 'Nicolet',       mrc: 'cq-nicolet',    region: '17', lat: 46.2333, lng: -72.6167 },
  { id: 'drummondville', nom: 'Drummondville', mrc: 'cq-drummond',   region: '17', lat: 45.8810, lng: -72.4850 },
  { id: 'plessisville',  nom: 'Plessisville',  mrc: 'cq-erable',     region: '17', lat: 46.2167, lng: -71.7667 },
  { id: 'becancour',     nom: 'Bécancour',     mrc: 'cq-becancour',  region: '17', lat: 46.3333, lng: -72.4167 },
];
