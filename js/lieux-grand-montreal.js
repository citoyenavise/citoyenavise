/**
 * Grand Montréal — Lieux civiques par arrondissement
 * Réutilise LIEUX_CAT défini dans lieux-montreal.js
 * Catégories : gouvernement | sante | communaute | education | culture | public | religion | identite
 */

const ARRONDISSEMENTS_GMO = [
  // ── ÎLE DE MONTRÉAL ──────────────────────────────────────────────────
  { id: 'ville-marie',    nom: 'Ville-Marie',                       groupe: 'ile',      centre: [45.508, -73.556], zoom: 14 },
  { id: 'plateau',        nom: 'Le Plateau-Mont-Royal',             groupe: 'ile',      centre: [45.521, -73.580], zoom: 14 },
  { id: 'rosemont',       nom: 'Rosemont–La Petite-Patrie',         groupe: 'ile',      centre: [45.543, -73.581], zoom: 13 },
  { id: 'mhm',            nom: 'Mercier–Hochelaga-Maisonneuve',     groupe: 'ile',      centre: [45.552, -73.534], zoom: 13 },
  { id: 'vspe',           nom: 'Villeray–Saint-Michel–Parc-Ext.',   groupe: 'ile',      centre: [45.540, -73.623], zoom: 13 },
  { id: 'ahuntsic',       nom: 'Ahuntsic-Cartierville',             groupe: 'ile',      centre: [45.558, -73.664], zoom: 13 },
  { id: 'cdn-ndg',        nom: 'Côte-des-Neiges–N.-D.-de-Grâce',   groupe: 'ile',      centre: [45.486, -73.634], zoom: 13 },
  { id: 'outremont',      nom: 'Outremont',                         groupe: 'ile',      centre: [45.516, -73.607], zoom: 14 },
  { id: 'saint-laurent',  nom: 'Saint-Laurent',                     groupe: 'ile',      centre: [45.500, -73.705], zoom: 13 },
  { id: 'lasalle',        nom: 'LaSalle',                           groupe: 'ile',      centre: [45.430, -73.637], zoom: 13 },
  { id: 'verdun',         nom: 'Verdun',                            groupe: 'ile',      centre: [45.459, -73.573], zoom: 13 },
  { id: 'sud-ouest',      nom: 'Le Sud-Ouest',                      groupe: 'ile',      centre: [45.472, -73.579], zoom: 13 },
  { id: 'lachine',        nom: 'Lachine',                           groupe: 'ile',      centre: [45.431, -73.691], zoom: 13 },
  { id: 'montreal-nord',  nom: 'Montréal-Nord',                     groupe: 'ile',      centre: [45.601, -73.617], zoom: 13 },
  { id: 'anjou',          nom: 'Anjou',                             groupe: 'ile',      centre: [45.597, -73.558], zoom: 13 },
  { id: 'pierrefonds',    nom: 'Pierrefonds-Roxboro',               groupe: 'ile',      centre: [45.494, -73.833], zoom: 13 },
  { id: 'rdp-pat',        nom: 'Rivière-des-Prairies–Pte-aux-T.',  groupe: 'ile',      centre: [45.650, -73.518], zoom: 13 },
  { id: 'saint-leonard',  nom: 'Saint-Léonard',                     groupe: 'ile',      centre: [45.585, -73.578], zoom: 13 },
  { id: 'ile-bizard',     nom: 'L\'Île-Bizard–Sainte-Geneviève',   groupe: 'ile',      centre: [45.484, -73.863], zoom: 13 },
  // ── COURONNES ────────────────────────────────────────────────────────
  { id: 'laval',          nom: 'Laval',                             groupe: 'couronne', centre: [45.566, -73.692], zoom: 12 },
  { id: 'longueuil',      nom: 'Longueuil',                         groupe: 'couronne', centre: [45.532, -73.508], zoom: 12 },
  { id: 'brossard',       nom: 'Brossard',                          groupe: 'couronne', centre: [45.461, -73.462], zoom: 13 },
];

const LIEUX_GMO = [

  // ════════════════════════════════════════════════════════════════
  // VILLE-MARIE — Centre-Ville + Vieux-Montréal
  // ════════════════════════════════════════════════════════════════
  { id: 'hdv-montreal',    arrond: 'ville-marie', nom: 'Hôtel de Ville de Montréal',          cat: 'gouvernement', sousCat: 'Municipal',    adresse: '275 rue Notre-Dame E',              lat: 45.5087, lng: -73.5539 },
  { id: 'chum',            arrond: 'ville-marie', nom: 'CHUM — Centre hospitalier UdeM',      cat: 'sante',        sousCat: 'Hôpital',      adresse: '1000 rue Saint-Denis',              lat: 45.5123, lng: -73.5562 },
  { id: 'banq-grande-bib', arrond: 'ville-marie', nom: 'Grande Bibliothèque (BAnQ)',          cat: 'education',    sousCat: 'Bibliothèque', adresse: '475 boul. De Maisonneuve E',        lat: 45.5148, lng: -73.5609 },
  { id: 'palais-congres',  arrond: 'ville-marie', nom: 'Palais des congrès de Montréal',      cat: 'gouvernement', sousCat: 'Provincial',   adresse: '201 av. Viger O',                   lat: 45.5040, lng: -73.5617 },
  { id: 'place-des-arts',  arrond: 'ville-marie', nom: 'Place des Arts',                      cat: 'culture',      sousCat: 'Culture',      adresse: '175 rue Sainte-Catherine O',        lat: 45.5082, lng: -73.5691 },
  { id: 'vieux-port',      arrond: 'ville-marie', nom: 'Vieux-Port de Montréal',              cat: 'public',       sousCat: 'Espace public', adresse: '333 rue de la Commune O',          lat: 45.5048, lng: -73.5550 },
  { id: 'uqam',            arrond: 'ville-marie', nom: 'UQAM — Université du Québec à MTL',  cat: 'education',    sousCat: 'Université',   adresse: '405 rue Sainte-Catherine E',        lat: 45.5094, lng: -73.5695 },
  { id: 'spvm-pdq20-vm',   arrond: 'ville-marie', nom: 'SPVM — PDQ 20 (Centre-ville)',        cat: 'gouvernement', sousCat: 'Municipal',    adresse: '400 boul. Saint-Laurent',           lat: 45.5116, lng: -73.5590 },

  // ════════════════════════════════════════════════════════════════
  // LE PLATEAU-MONT-ROYAL
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-plateau',  arrond: 'plateau', nom: 'Mairie — Plateau-Mont-Royal',             cat: 'gouvernement', sousCat: 'Municipal',    adresse: '801 chemin Cherrier',               lat: 45.5221, lng: -73.5788 },
  { id: 'clsc-plateau2',   arrond: 'plateau', nom: 'CLSC du Plateau-Mont-Royal',              cat: 'sante',        sousCat: 'Santé',        adresse: '4689 av. Papineau',                 lat: 45.5396, lng: -73.5745 },
  { id: 'parc-lafontaine', arrond: 'plateau', nom: 'Parc Lafontaine',                         cat: 'public',       sousCat: 'Parc',         adresse: 'Sherbrooke E / Papineau',           lat: 45.5233, lng: -73.5683 },
  { id: 'marche-jean-t',   arrond: 'plateau', nom: 'Marché Jean-Talon',                       cat: 'identite',     sousCat: 'Emblème',      adresse: '7075 av. Casgrain',                 lat: 45.5377, lng: -73.6152 },
  { id: 'bib-plateau',     arrond: 'plateau', nom: 'Bibliothèque du Plateau-Mont-Royal',      cat: 'education',    sousCat: 'Bibliothèque', adresse: '1059 rue Gilford',                  lat: 45.5264, lng: -73.5671 },

  // ════════════════════════════════════════════════════════════════
  // ROSEMONT–LA PETITE-PATRIE
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-rosemont', arrond: 'rosemont', nom: 'Mairie — Rosemont–La Petite-Patrie',    cat: 'gouvernement', sousCat: 'Municipal',    adresse: '4240 boul. Rosemont',               lat: 45.5440, lng: -73.5845 },
  { id: 'clsc-rosemont',   arrond: 'rosemont', nom: 'CLSC de Rosemont',                      cat: 'sante',        sousCat: 'Santé',        adresse: '2513 av. Laurier E',                lat: 45.5368, lng: -73.5726 },
  { id: 'bib-rosemont',    arrond: 'rosemont', nom: 'Bibliothèque de Rosemont',              cat: 'education',    sousCat: 'Bibliothèque', adresse: '2500 av. Laurier E',                lat: 45.5362, lng: -73.5720 },
  { id: 'parc-maisonneuve',arrond: 'rosemont', nom: 'Parc Maisonneuve',                      cat: 'public',       sousCat: 'Parc',         adresse: '4601 rue Sherbrooke E',             lat: 45.5573, lng: -73.5443 },
  { id: 'spvm-pdq26-r',    arrond: 'rosemont', nom: 'SPVM — PDQ 26 (Rosemont-Est)',          cat: 'gouvernement', sousCat: 'Municipal',    adresse: '3900 boul. Rosemont',               lat: 45.5442, lng: -73.5838 },

  // ════════════════════════════════════════════════════════════════
  // MERCIER–HOCHELAGA-MAISONNEUVE (MHM)
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-mhm',      arrond: 'mhm', nom: 'Mairie — Mercier–HM',                       cat: 'gouvernement', sousCat: 'Municipal',    adresse: '4120 rue Ontario E',                lat: 45.5390, lng: -73.5461 },
  { id: 'stade-olympique', arrond: 'mhm', nom: 'Stade Olympique',                            cat: 'culture',      sousCat: 'Culture',      adresse: '4141 av. Pierre-De Coubertin',      lat: 45.5562, lng: -73.5515 },
  { id: 'espace-vie',      arrond: 'mhm', nom: 'Espace pour la vie (Biodôme / Planétarium)', cat: 'education',    sousCat: 'Institution',  adresse: '4777 av. Pierre-De Coubertin',      lat: 45.5596, lng: -73.5513 },
  { id: 'clsc-hm',         arrond: 'mhm', nom: 'CLSC Hochelaga-Maisonneuve',                 cat: 'sante',        sousCat: 'Santé',        adresse: '1620 rue Ontario E',                lat: 45.5274, lng: -73.5421 },
  { id: 'marche-maisonne', arrond: 'mhm', nom: 'Marché Maisonneuve',                         cat: 'identite',     sousCat: 'Emblème',      adresse: '4445 rue Ontario E',                lat: 45.5388, lng: -73.5435 },
  { id: 'bib-mhm',         arrond: 'mhm', nom: 'Bibliothèque Maisonneuve',                   cat: 'education',    sousCat: 'Bibliothèque', adresse: '4120 rue Ontario E',                lat: 45.5393, lng: -73.5462 },

  // ════════════════════════════════════════════════════════════════
  // VILLERAY–SAINT-MICHEL–PARC-EXTENSION (VSPE)
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-vspe',     arrond: 'vspe', nom: 'Mairie — Villeray–Saint-Michel–Parc-Ext.', cat: 'gouvernement', sousCat: 'Municipal',    adresse: '405 rue de Villeray',               lat: 45.5376, lng: -73.6248 },
  { id: 'clsc-villeray',   arrond: 'vspe', nom: 'CLSC de Villeray',                          cat: 'sante',        sousCat: 'Santé',        adresse: '1425 rue Jarry E',                  lat: 45.5450, lng: -73.6175 },
  { id: 'parc-jarry',      arrond: 'vspe', nom: 'Parc Jarry',                                cat: 'public',       sousCat: 'Parc',         adresse: '285 rue Faillon O',                 lat: 45.5344, lng: -73.6315 },
  { id: 'bib-parc-ext',    arrond: 'vspe', nom: 'Bibliothèque Parc-Extension',              cat: 'education',    sousCat: 'Bibliothèque', adresse: '7600 boul. Saint-Laurent',          lat: 45.5338, lng: -73.6203 },
  { id: 'comm-parc-ext',   arrond: 'vspe', nom: 'Centre communautaire Parc-Extension',      cat: 'communaute',   sousCat: 'Organisme',    adresse: '4020 rue Jean-Talon O',             lat: 45.5267, lng: -73.6387 },

  // ════════════════════════════════════════════════════════════════
  // AHUNTSIC-CARTIERVILLE
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-ahuntsic', arrond: 'ahuntsic', nom: 'Mairie — Ahuntsic-Cartierville',       cat: 'gouvernement', sousCat: 'Municipal',    adresse: '10265 boul. de l\'Acadie',          lat: 45.5551, lng: -73.6618 },
  { id: 'clsc-ahuntsic',   arrond: 'ahuntsic', nom: 'CLSC Ahuntsic',                        cat: 'sante',        sousCat: 'Santé',        adresse: '1165 boul. Henri-Bourassa E',       lat: 45.5681, lng: -73.6448 },
  { id: 'bib-ahuntsic',    arrond: 'ahuntsic', nom: 'Bibliothèque Ahuntsic',                cat: 'education',    sousCat: 'Bibliothèque', adresse: '10300 rue Lajeunesse',              lat: 45.5672, lng: -73.6519 },
  { id: 'hopital-sacre-c', arrond: 'ahuntsic', nom: 'Hôpital du Sacré-Cœur de Montréal',   cat: 'sante',        sousCat: 'Hôpital',      adresse: '5400 boul. Gouin O',                lat: 45.5512, lng: -73.7047 },
  { id: 'parc-ahuntsic',   arrond: 'ahuntsic', nom: 'Parc Ahuntsic',                        cat: 'public',       sousCat: 'Parc',         adresse: '10 900 av. du Bois-de-Boulogne',    lat: 45.5714, lng: -73.6691 },
  { id: 'spvm-pdq10',      arrond: 'ahuntsic', nom: 'SPVM — PDQ 10 (Ahuntsic)',             cat: 'gouvernement', sousCat: 'Municipal',    adresse: '1645 rue de Salaberry',             lat: 45.5335, lng: -73.6664 },

  // ════════════════════════════════════════════════════════════════
  // CÔTE-DES-NEIGES–NOTRE-DAME-DE-GRÂCE (CDN-NDG)
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-cdn-ndg',  arrond: 'cdn-ndg', nom: 'Mairie — CDN–Notre-Dame-de-Grâce',     cat: 'gouvernement', sousCat: 'Municipal',    adresse: '6900 boul. Décarie',                lat: 45.4939, lng: -73.6376 },
  { id: 'udem',            arrond: 'cdn-ndg', nom: 'Université de Montréal (UdeM)',         cat: 'education',    sousCat: 'Université',   adresse: '2900 boul. Édouard-Montpetit',      lat: 45.5048, lng: -73.6163 },
  { id: 'clsc-cdn',        arrond: 'cdn-ndg', nom: 'CLSC de Côte-des-Neiges',              cat: 'sante',        sousCat: 'Santé',        adresse: '6600 ch. de la Côte-des-Neiges',    lat: 45.4957, lng: -73.6336 },
  { id: 'bib-cdn',         arrond: 'cdn-ndg', nom: 'Bibliothèque de la Côte-des-Neiges',  cat: 'education',    sousCat: 'Bibliothèque', adresse: '4900 ch. de la Côte-des-Neiges',    lat: 45.4896, lng: -73.6350 },
  { id: 'jgh2',            arrond: 'cdn-ndg', nom: 'Hôpital Général Juif (JGH)',           cat: 'sante',        sousCat: 'Hôpital',      adresse: '3755 ch. Côte-Sainte-Catherine',    lat: 45.4914, lng: -73.6270 },
  { id: 'clsc-ndg',        arrond: 'cdn-ndg', nom: 'CLSC Notre-Dame-de-Grâce',             cat: 'sante',        sousCat: 'Santé',        adresse: '2525 boul. Cavendish',              lat: 45.4776, lng: -73.6262 },
  { id: 'spvm-pdq23',      arrond: 'cdn-ndg', nom: 'SPVM — PDQ 23 (CDN)',                  cat: 'gouvernement', sousCat: 'Municipal',    adresse: '1026 av. Beaumont',                 lat: 45.5182, lng: -73.6236 },

  // ════════════════════════════════════════════════════════════════
  // OUTREMONT
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-outremont',arrond: 'outremont', nom: 'Mairie — Outremont',                  cat: 'gouvernement', sousCat: 'Municipal',    adresse: '543 av. Davaar',                    lat: 45.5187, lng: -73.6124 },
  { id: 'bib-outremont',   arrond: 'outremont', nom: 'Bibliothèque d\'Outremont',           cat: 'education',    sousCat: 'Bibliothèque', adresse: '1 av. Querbes',                     lat: 45.5232, lng: -73.6132 },
  { id: 'cinema-outremont',arrond: 'outremont', nom: 'Cinéma Outremont',                    cat: 'culture',      sousCat: 'Culture',      adresse: '1248 av. Bernard O',                lat: 45.5226, lng: -73.6158 },
  { id: 'parc-outremont',  arrond: 'outremont', nom: 'Parc du Victoria (Outremont)',        cat: 'public',       sousCat: 'Parc',         adresse: 'Av. Maplewood / Ch. Queen-Mary',    lat: 45.5115, lng: -73.6191 },

  // ════════════════════════════════════════════════════════════════
  // SAINT-LAURENT
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-stlaurent',arrond: 'saint-laurent', nom: 'Mairie — Saint-Laurent',          cat: 'gouvernement', sousCat: 'Municipal',    adresse: '777 boul. Marcel-Laurin',           lat: 45.5009, lng: -73.7073 },
  { id: 'cegep-stlaurent', arrond: 'saint-laurent', nom: 'Cégep de Saint-Laurent',         cat: 'education',    sousCat: 'Cégep',        adresse: '625 av. Sainte-Croix',              lat: 45.5119, lng: -73.6967 },
  { id: 'clsc-stlaurent',  arrond: 'saint-laurent', nom: 'CLSC de Saint-Laurent',          cat: 'sante',        sousCat: 'Santé',        adresse: '1055 boul. Décarie',                lat: 45.5074, lng: -73.7070 },
  { id: 'parc-centenaire', arrond: 'saint-laurent', nom: 'Parc du Centenaire',             cat: 'public',       sousCat: 'Parc',         adresse: 'Boul. Thimens / Boul. Marcel-Laurin',lat: 45.5020, lng: -73.6980 },

  // ════════════════════════════════════════════════════════════════
  // LASALLE
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-lasalle',  arrond: 'lasalle', nom: 'Mairie — LaSalle',                     cat: 'gouvernement', sousCat: 'Municipal',    adresse: '55 av. Dupras',                     lat: 45.4342, lng: -73.6413 },
  { id: 'hopital-lasalle', arrond: 'lasalle', nom: 'Hôpital de LaSalle (CIUSSS OSO)',      cat: 'sante',        sousCat: 'Hôpital',      adresse: '8585 boul. Champlain',              lat: 45.4208, lng: -73.6270 },
  { id: 'parc-angrignon',  arrond: 'lasalle', nom: 'Parc Angrignon',                       cat: 'public',       sousCat: 'Parc',         adresse: '3400 boul. des Trinitaires',        lat: 45.4479, lng: -73.6034 },
  { id: 'clsc-lasalle',    arrond: 'lasalle', nom: 'CLSC de LaSalle',                      cat: 'sante',        sousCat: 'Santé',        adresse: '1905 boul. de La Vérendrye',        lat: 45.4321, lng: -73.6388 },

  // ════════════════════════════════════════════════════════════════
  // VERDUN
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-verdun',   arrond: 'verdun', nom: 'Mairie — Verdun',                       cat: 'gouvernement', sousCat: 'Municipal',    adresse: '4555 rue de Verdun',                lat: 45.4618, lng: -73.5724 },
  { id: 'bib-verdun',      arrond: 'verdun', nom: 'Bibliothèque de Verdun',                cat: 'education',    sousCat: 'Bibliothèque', adresse: '5955 rue de Verdun',                lat: 45.4550, lng: -73.5655 },
  { id: 'hopital-douglas', arrond: 'verdun', nom: 'Hôpital Douglas (santé mentale)',       cat: 'sante',        sousCat: 'Hôpital',      adresse: '6875 boul. LaSalle',                lat: 45.4482, lng: -73.5912 },
  { id: 'parc-bernier',    arrond: 'verdun', nom: 'Parc Mgr-Picard (bord de l\'eau)',     cat: 'public',       sousCat: 'Parc',         adresse: 'Boul. LaSalle, Verdun',             lat: 45.4598, lng: -73.5597 },

  // ════════════════════════════════════════════════════════════════
  // LE SUD-OUEST
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-sudouest', arrond: 'sud-ouest', nom: 'Mairie — Le Sud-Ouest',              cat: 'gouvernement', sousCat: 'Municipal',    adresse: '6200 boul. Monk',                   lat: 45.4637, lng: -73.5924 },
  { id: 'marche-atwater',  arrond: 'sud-ouest', nom: 'Marché Atwater',                     cat: 'identite',     sousCat: 'Emblème',      adresse: '138 av. Atwater',                   lat: 45.4866, lng: -73.5764 },
  { id: 'canal-lachine',   arrond: 'sud-ouest', nom: 'Canal de Lachine (parc fédéral)',   cat: 'public',       sousCat: 'Parc',         adresse: 'Boul. Saint-Patrick / av. Atwater', lat: 45.4758, lng: -73.5887 },
  { id: 'clsc-sudouest',   arrond: 'sud-ouest', nom: 'CLSC Saint-Henri',                  cat: 'sante',        sousCat: 'Santé',        adresse: '3833 rue Notre-Dame O',             lat: 45.4748, lng: -73.5852 },
  { id: 'bib-sudouest',    arrond: 'sud-ouest', nom: 'Bibliothèque de Saint-Henri',       cat: 'education',    sousCat: 'Bibliothèque', adresse: '3995 rue Notre-Dame O',             lat: 45.4742, lng: -73.5856 },

  // ════════════════════════════════════════════════════════════════
  // LACHINE
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-lachine',  arrond: 'lachine', nom: 'Mairie — Lachine',                    cat: 'gouvernement', sousCat: 'Municipal',    adresse: '1800 boul. Saint-Joseph, Lachine',  lat: 45.4334, lng: -73.6873 },
  { id: 'hopital-lachine', arrond: 'lachine', nom: 'Hôpital de Lachine (CUSM)',           cat: 'sante',        sousCat: 'Hôpital',      adresse: '650 16e Avenue, Lachine',           lat: 45.4327, lng: -73.6791 },
  { id: 'parc-rene-lev',   arrond: 'lachine', nom: 'Parc René-Lévesque (Lachine)',       cat: 'public',       sousCat: 'Parc',         adresse: 'Boul. Saint-Joseph, Lachine',       lat: 45.4238, lng: -73.6942 },
  { id: 'clsc-lachine',    arrond: 'lachine', nom: 'CLSC de Lachine',                    cat: 'sante',        sousCat: 'Santé',        adresse: '1900 boul. Saint-Joseph, Lachine',  lat: 45.4337, lng: -73.6879 },

  // ════════════════════════════════════════════════════════════════
  // MONTRÉAL-NORD
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-mtlnord',  arrond: 'montreal-nord', nom: 'Mairie — Montréal-Nord',        cat: 'gouvernement', sousCat: 'Municipal',    adresse: '11120 boul. Henri-Bourassa E',      lat: 45.6006, lng: -73.6086 },
  { id: 'clsc-mtlnord',    arrond: 'montreal-nord', nom: 'CLSC de Montréal-Nord',         cat: 'sante',        sousCat: 'Santé',        adresse: '11441 boul. Lacordaire',            lat: 45.6021, lng: -73.6092 },
  { id: 'parc-anibal',     arrond: 'montreal-nord', nom: 'Parc Henri-Bourassa',           cat: 'public',       sousCat: 'Parc',         adresse: 'Boul. Henri-Bourassa E, MTL-Nord',  lat: 45.6052, lng: -73.6218 },
  { id: 'comm-mtlnord',    arrond: 'montreal-nord', nom: 'Maison de la culture MTL-Nord', cat: 'culture',      sousCat: 'Culture',      adresse: '12174 boul. Henri-Bourassa E',      lat: 45.6009, lng: -73.5924 },

  // ════════════════════════════════════════════════════════════════
  // ANJOU
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-anjou',    arrond: 'anjou', nom: 'Mairie — Anjou',                        cat: 'gouvernement', sousCat: 'Municipal',    adresse: '7701 boul. Louis-H.-La Fontaine',   lat: 45.5981, lng: -73.5618 },
  { id: 'clsc-anjou',      arrond: 'anjou', nom: 'CLSC d\'Anjou',                         cat: 'sante',        sousCat: 'Santé',        adresse: '7 rue Ambroise-Lafortune',          lat: 45.5989, lng: -73.5601 },
  { id: 'galeries-anjou',  arrond: 'anjou', nom: 'Galeries d\'Anjou',                     cat: 'identite',     sousCat: 'Emblème',      adresse: '7999 boul. Les Galeries-d\'Anjou',  lat: 45.5954, lng: -73.5519 },

  // ════════════════════════════════════════════════════════════════
  // PIERREFONDS-ROXBORO
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-pierref',  arrond: 'pierrefonds', nom: 'Mairie — Pierrefonds-Roxboro',    cat: 'gouvernement', sousCat: 'Municipal',    adresse: '4919 boul. Saint-Jean',             lat: 45.4879, lng: -73.8223 },
  { id: 'clsc-pierref',    arrond: 'pierrefonds', nom: 'CLSC de Pierrefonds',             cat: 'sante',        sousCat: 'Santé',        adresse: '13800 boul. Pierrefonds',           lat: 45.4833, lng: -73.8479 },
  { id: 'parc-nature-pb',  arrond: 'pierrefonds', nom: 'Parc-nature du Bois-de-Liesse',  cat: 'public',       sousCat: 'Parc',         adresse: 'Boul. Gouin O, Pierrefonds',        lat: 45.5003, lng: -73.7992 },

  // ════════════════════════════════════════════════════════════════
  // RIVIÈRE-DES-PRAIRIES–POINTE-AUX-TREMBLES (RDP-PAT)
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-rdp-pat',  arrond: 'rdp-pat', nom: 'Mairie — Rivière-des-Prairies–PAT',  cat: 'gouvernement', sousCat: 'Municipal',    adresse: '12300 rue Notre-Dame E',            lat: 45.6500, lng: -73.5175 },
  { id: 'clsc-rdp',        arrond: 'rdp-pat', nom: 'CLSC de Rivière-des-Prairies',       cat: 'sante',        sousCat: 'Santé',        adresse: '8655 boul. Perras',                 lat: 45.6387, lng: -73.5045 },
  { id: 'parc-rdp',        arrond: 'rdp-pat', nom: 'Parc-nature de la Pointe-aux-Prairies',cat:'public',      sousCat: 'Parc',         adresse: 'Rue Sherbrooke E, PAT',             lat: 45.6607, lng: -73.5062 },

  // ════════════════════════════════════════════════════════════════
  // SAINT-LÉONARD
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-stleon',   arrond: 'saint-leonard', nom: 'Mairie — Saint-Léonard',        cat: 'gouvernement', sousCat: 'Municipal',    adresse: '8400 boul. Lacordaire',             lat: 45.5818, lng: -73.5762 },
  { id: 'clsc-stleon',     arrond: 'saint-leonard', nom: 'CLSC de Saint-Léonard',         cat: 'sante',        sousCat: 'Santé',        adresse: '4750 rue Jarry E',                  lat: 45.5845, lng: -73.5653 },
  { id: 'bib-stleon',      arrond: 'saint-leonard', nom: 'Bibliothèque de Saint-Léonard', cat: 'education',    sousCat: 'Bibliothèque', adresse: '8200 rue Lacordaire',               lat: 45.5808, lng: -73.5764 },

  // ════════════════════════════════════════════════════════════════
  // L'ÎLE-BIZARD–SAINTE-GENEVIÈVE
  // ════════════════════════════════════════════════════════════════
  { id: 'mairie-ilebizard',arrond: 'ile-bizard', nom: 'Mairie — L\'Île-Bizard–Ste-Geneviève',cat:'gouvernement',sousCat:'Municipal', adresse: '460 ch. du Bord-du-Lac, Île-Bizard', lat: 45.4748, lng: -73.8700 },
  { id: 'parc-ile-bizard', arrond: 'ile-bizard', nom: 'Parc-nature de l\'Île-Bizard',     cat: 'public',       sousCat: 'Parc',         adresse: 'Ch. du Bord-du-Lac, Île-Bizard',    lat: 45.5038, lng: -73.8691 },

  // ════════════════════════════════════════════════════════════════
  // LAVAL
  // ════════════════════════════════════════════════════════════════
  { id: 'hdv-laval',       arrond: 'laval', nom: 'Hôtel de Ville de Laval',               cat: 'gouvernement', sousCat: 'Municipal',    adresse: '1 Place du Génie, Laval',           lat: 45.5531, lng: -73.7548 },
  { id: 'cite-sante-laval',arrond: 'laval', nom: 'Hôpital Cité-de-la-Santé (Laval)',     cat: 'sante',        sousCat: 'Hôpital',      adresse: '1755 boul. René-Laennec, Laval',    lat: 45.5585, lng: -73.7493 },
  { id: 'clsc-laval-mille',arrond: 'laval', nom: 'CLSC des Mille-Îles (Laval)',           cat: 'sante',        sousCat: 'Santé',        adresse: '4731 boul. Lévesque E, Laval',      lat: 45.5629, lng: -73.7210 },
  { id: 'cosmodome',       arrond: 'laval', nom: 'Cosmodôme',                             cat: 'education',    sousCat: 'Institution',  adresse: '2150 autoroute des Laurentides, Laval',lat: 45.5544, lng: -73.7635 },
  { id: 'spvm-spl',        arrond: 'laval', nom: 'Service de police de Laval (SPL)',      cat: 'gouvernement', sousCat: 'Municipal',    adresse: '4 boul. Chomedey, Laval',           lat: 45.5667, lng: -73.7365 },
  { id: 'parc-laval',      arrond: 'laval', nom: 'Parc de la Rivière-des-Mille-Îles',    cat: 'public',       sousCat: 'Parc',         adresse: '345 boul. Sainte-Rose, Laval',      lat: 45.6183, lng: -73.7464 },

  // ════════════════════════════════════════════════════════════════
  // LONGUEUIL
  // ════════════════════════════════════════════════════════════════
  { id: 'hdv-longueuil',   arrond: 'longueuil', nom: 'Hôtel de Ville de Longueuil',       cat: 'gouvernement', sousCat: 'Municipal',    adresse: '4250 ch. de la Savane, Longueuil',  lat: 45.5265, lng: -73.5210 },
  { id: 'hcm',             arrond: 'longueuil', nom: 'Hôpital Charles-Le Moyne',          cat: 'sante',        sousCat: 'Hôpital',      adresse: '3120 boul. Taschereau, Greenfield', lat: 45.5137, lng: -73.4741 },
  { id: 'cegep-em',        arrond: 'longueuil', nom: 'Cégep Édouard-Montpetit',           cat: 'education',    sousCat: 'Cégep',        adresse: '945 ch. de Chambly, Longueuil',     lat: 45.5165, lng: -73.5030 },
  { id: 'clsc-longueuil',  arrond: 'longueuil', nom: 'CLSC Longueuil-Ouest',              cat: 'sante',        sousCat: 'Santé',        adresse: '201 boul. Curé-Poirier O, Longueuil',lat:45.5214, lng: -73.5222 },
  { id: 'parc-longueuil',  arrond: 'longueuil', nom: 'Parc de Longueuil',                 cat: 'public',       sousCat: 'Parc',         adresse: 'Boul. Marie-Victorin, Longueuil',   lat: 45.5369, lng: -73.5105 },

  // ════════════════════════════════════════════════════════════════
  // BROSSARD
  // ════════════════════════════════════════════════════════════════
  { id: 'hdv-brossard',    arrond: 'brossard', nom: 'Hôtel de Ville de Brossard',         cat: 'gouvernement', sousCat: 'Municipal',    adresse: '2001 boul. de Rome, Brossard',      lat: 45.4598, lng: -73.4638 },
  { id: 'dix30',           arrond: 'brossard', nom: 'Quartier DIX30 (pôle commercial)',   cat: 'identite',     sousCat: 'Emblème',      adresse: '9182 boul. Leduc, Brossard',        lat: 45.4518, lng: -73.4701 },
  { id: 'clsc-brossard',   arrond: 'brossard', nom: 'CLSC de Brossard',                   cat: 'sante',        sousCat: 'Santé',        adresse: '9001 boul. Leduc, Brossard',        lat: 45.4540, lng: -73.4730 },
];
