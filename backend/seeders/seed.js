/**
 * Database Seeder
 * Remplit la BD avec des données de test réalistes
 *
 * Usage: node seeders/seed.js
 */

import sequelize from '../src/db/sequelize.js';
import User from '../src/models/User.js';
import Elu from '../src/models/Elu.js';
import Petition from '../src/models/Petition.js';
import { getConfig } from '../src/config/env.js';

const config = getConfig();

/**
 * Élus réalistes du Québec/Canada avec coordonnées géographiques
 */
const elusData = [
  {
    nom: 'Marthe Belleville',
    titre: 'Député',
    region: 'Québec',
    niveau: 'fédéral',
    email: 'marthe.belleville@parl.gc.ca',
    photoUrl: 'https://via.placeholder.com/300?text=Marthe+Belleville',
    siteWeb: 'https://marthe-belleville.ca',
    latitude: 46.8139,
    longitude: -71.2080,
  },
  {
    nom: 'Jean-Marie Pépin',
    titre: 'Sénateur',
    region: 'Toronto',
    niveau: 'fédéral',
    email: 'jm.pepin@senate.ca',
    photoUrl: 'https://via.placeholder.com/300?text=Jean-Marie+Pepin',
    siteWeb: 'https://jmpepin.ca',
    latitude: 43.6629,
    longitude: -79.3957,
  },
  {
    nom: 'Sophie Goyette',
    titre: 'Député',
    region: 'Montréal',
    niveau: 'provincial',
    email: 'sophie.goyette@assnat.qc.ca',
    photoUrl: 'https://via.placeholder.com/300?text=Sophie+Goyette',
    siteWeb: 'https://sophiegoyette.ca',
    latitude: 45.5017,
    longitude: -73.5673,
  },
  {
    nom: 'André Lamproze',
    titre: 'Maire',
    region: 'Vancouver',
    niveau: 'municipal',
    email: 'alamproze@ville.vancouver.bc.ca',
    photoUrl: 'https://via.placeholder.com/300?text=Andre+Lamproze',
    siteWeb: 'https://ville.vancouver.bc.ca/maire',
    latitude: 49.2827,
    longitude: -123.1207,
  },
  {
    nom: 'Caroline Matte',
    titre: 'Conseiller',
    region: 'Calgary',
    niveau: 'municipal',
    email: 'cmatte@ville.calgary.ab.ca',
    photoUrl: 'https://via.placeholder.com/300?text=Caroline+Matte',
    siteWeb: 'https://ville.calgary.ab.ca/conseillers',
    latitude: 51.0447,
    longitude: -114.0719,
  },
];

/**
 * Utilisateurs de test
 */
const usersData = Array.from({ length: 10 }, (_, i) => ({
  email: `test${i + 1}@citoyenavise.com`,
  nomComplet: `Citoyen Test ${i + 1}`,
  province: ['QC', 'ON', 'BC', 'AB', 'MB'][i % 5],
  codePostal: ['H1A 1A1', 'M1A 1A1', 'V1A 1A1', 'T1A 1A1', 'R1A 1A1'][i % 5],
}));

/**
 * Pétitions de test
 */
const petitionsData = [
  {
    titre: 'Améliorer l\'accès aux soins dentaires pour tous',
    description: `Les soins dentaires au Canada coûtent extremement cher. Beaucoup de citoyens ne peuvent pas se permettre
    des détartrage réguliers ou des détartrage. Nous demandons au gouvernement d'inclure les soins dentaires dans
    le système de santé universel, comme c'est le cas dans plusieurs autres pays développés.
    Cette mesure serait beneficial pour la santé publique et réduirait les inégalités d'accès aux soins.`,
    eluId: 1, // Marthe Belleville
  },
  {
    titre: 'Augmenter les investissements en transports en commun',
    description: `Le réseau de transports en commun est saturé aux heures de pointe et de nombreux autobus sont en retard.
    Nous demandons une augmentation significative des budgets alloués aux transports publics pour:
    - Acheter de nouveaux autobus plus modernes et écologiques
    - Augmenter la fréquence des lignes principales
    - Étendre le réseau vers les banlieues
    - Réduire les tarifs pour les étudiants et les personnes à revenu faible
    Cette investissement créerait des milliers d'emplois et réduirait la congestion routière.`,
    eluId: 3, // Sophie Goyette
  },
  {
    titre: 'Protéger les forêts anciennes du Québec',
    description: `Les forêts anciennes du Québec sont des écosystèmes fragiles et irremplaçables.
    Elles abritent des espèces en danger et jouent un rôle crucial dans la lutte contre les changements climatiques.
    Nous demandons un moratoire immédiat sur l'exploitation forestière dans les forêts de plus de 100 ans.
    Le gouvernement doit mettre en place une stratégie de conservation long terme et investir dans
    la recherche sur ces écosystèmes précieux pour les générations futures.`,
    eluId: 5, // Caroline Matte
  },
];

/**
 * Créer données de test dans la BD
 */
async function seed() {
  try {
    console.log('🌱 Démarrage du seeder...\n');

    // Vérifier la connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à la BD établie\n');

    // 1. Créer élus
    console.log('📌 Création des élus...');
    const createdElus = [];
    for (const eluData of elusData) {
      const elu = await Elu.findOrCreate({
        where: { email: eluData.email },
        defaults: eluData,
      });
      createdElus.push(elu[0]);
      console.log(`  ✓ ${eluData.nom} (${eluData.titre}, ${eluData.niveau})`);
    }
    console.log(`✅ ${createdElus.length} élus créés\n`);

    // 2. Créer utilisateurs
    console.log('👥 Création des utilisateurs...');
    const createdUsers = [];
    for (const userData of usersData) {
      const user = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData,
      });
      createdUsers.push(user[0]);
      console.log(`  ✓ ${userData.email}`);
    }
    console.log(`✅ ${createdUsers.length} utilisateurs créés\n`);

    // 3. Créer pétitions
    console.log('📋 Création des pétitions...');
    const createdPetitions = [];

    for (let i = 0; i < petitionsData.length; i++) {
      const petitionData = petitionsData[i];
      const petition = await Petition.create({
        ...petitionData,
        citoyenId: createdUsers[i].id, // Assigner à un utilisateur différent
        status: i === 0 ? 'published' : 'draft', // Première pétition publiée
        signaturesCount: i === 0 ? 42 : 0,
      });
      createdPetitions.push(petition);
      console.log(`  ✓ "${petition.titre}" (${petition.status})`);
    }
    console.log(`✅ ${createdPetitions.length} pétitions créées\n`);

    // 4. Afficher résumé
    console.log('═══════════════════════════════════════════');
    console.log('📊 RÉSUMÉ DES DONNÉES CRÉÉES');
    console.log('═══════════════════════════════════════════\n');

    console.log('🎯 Élus:');
    for (const elu of createdElus) {
      console.log(`   ID: ${elu.id} | ${elu.nom} | ${elu.titre} | ${elu.region}`);
    }

    console.log('\n👥 Utilisateurs:');
    console.log(`   ${createdUsers.length} utilisateurs créés`);
    console.log(`   Emails: test1@citoyenavise.com jusqu\'à test10@citoyenavise.com`);

    console.log('\n📋 Pétitions:');
    for (const petition of createdPetitions) {
      console.log(`   ID: ${petition.id} | ${petition.titre} | Status: ${petition.status}`);
    }

    console.log('\n═══════════════════════════════════════════\n');
    console.log('✨ Seeder complété avec succès!\n');

    // 5. Afficher infos de connexion pour tester
    console.log('🔐 Pour tester l\'API:');
    console.log(`   1. Demander magic link: POST /api/v1/auth/magic-link`);
    console.log(`      Body: { "email": "test1@citoyenavise.com" }`);
    console.log(`\n   2. Récupérer le token JWT du lien magic link`);
    console.log(`      GET /api/v1/auth/verify?token=<token>`);
    console.log(`\n   3. Utiliser le JWT pour les routes protégées:`);
    console.log(`      Header: Authorization: Bearer <accessToken>`);
    console.log(`\n   4. Créer une pétition: POST /api/v1/petitions`);
    console.log(`      Signer une pétition: POST /api/v1/petitions/1/sign\n`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur lors du seeding:', err);
    process.exit(1);
  }
}

// Lancer le seeder
seed();
