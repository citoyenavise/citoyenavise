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
 * Pétitions seed ancrées à Québec ville (phase pilote)
 */
const petitionsData = [
  {
    titre: 'Étendre le réseau de pistes cyclables sécurisées à Québec',
    description: `Le réseau cyclable de Québec ville est fragmenté et incomplet. Les cyclistes ne peuvent pas se déplacer
    en toute sécurité entre les quartiers. Nous demandons à la Ville de Québec d'investir dans la création de pistes
    cyclables protégées, particulièrement sur les axes Est-Ouest (Grande-Allée, Route de l'Église, Boulevard Hochelaga).
    Une infrastructure cyclable sécurisée encouragerait les déplacements actifs, réduirait la congestion automobile
    et améliorerait la santé publique. C'est une priorité pour une ville durable et vivable.`,
    eluId: 1, // Marthe Belleville
    enjeu: 'environnement',
  },
  {
    titre: 'Améliorer la fréquence des autobus RTC en banlieue de Québec',
    description: `Les citoyens des banlieues (Sainte-Foy, Sillery, Beauport) dépendent du RTC pour se déplacer, mais
    la fréquence des autobus est insuffisante. Attendre 30-40 minutes entre deux autobus décourage l'utilisation
    du transport en commun. Nous demandons à la Ville et au RTC d'augmenter la fréquence des lignes de banlieue
    à au moins un autobus toutes les 15 minutes aux heures de pointe. Cela réduirait les embouteillages,
    diminuerait les émissions de carbone et rendrait le RTC vraiment accessible à tous.`,
    eluId: 3, // Sophie Goyette
    enjeu: 'autre',
  },
  {
    titre: 'Préserver les espaces verts du quartier Sainte-Foy contre la densification excessive',
    description: `Le quartier Sainte-Foy est menacé par une densification immobilière rapide et non planifiée.
    Les espaces verts disparaissent pour faire place à des immeubles résidentiels de grande hauteur.
    Nous demandons à la Ville de Québec de protéger les parcs et boisés du secteur (Parc du Bois-de-Coulonge, etc.)
    en adoptant un plan de conservation des espaces naturels. La Ville doit exiger que les nouveaux projets immobiliers
    préservent les milieux naturels et offrent des espaces verts accessibles au public.
    Une densification sans verdure nuit à la qualité de vie.`,
    eluId: 5, // Caroline Matte
    enjeu: 'environnement',
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

    // 3. Créer pétitions (idempotent via findOrCreate sur titre)
    console.log('📋 Création des pétitions...');
    const createdPetitions = [];

    for (let i = 0; i < petitionsData.length; i++) {
      const petitionData = petitionsData[i];
      const [petition, created] = await Petition.findOrCreate({
        where: { titre: petitionData.titre },
        defaults: {
          ...petitionData,
          citoyenId: createdUsers[i].id,
          status: 'published',
          signaturesCount: 0,
        },
      });
      // Backfill enjeu si pétition pré-existait sans cette colonne (V011)
      if (!created && petitionData.enjeu && petition.enjeu !== petitionData.enjeu) {
        petition.enjeu = petitionData.enjeu;
        await petition.save();
      }
      createdPetitions.push(petition);
      console.log(`  ${created ? '✓ créé' : '↺ existant'} : "${petition.titre}" (${petition.status}, enjeu=${petition.enjeu || 'NULL'})`);
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
