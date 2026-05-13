#!/usr/bin/env node

import sequelize from '../src/db/sequelize.js';
import Elu from '../src/models/Elu.js';
import Petition from '../src/models/Petition.js';
import Actualite from '../src/models/Actualite.js';
import User from '../src/models/User.js';

async function checkAndSeedDatabase() {
  try {
    console.log('🔍 Vérification de la BD...\n');

    const eluCount = await Elu.count();
    const petitionCount = await Petition.count();
    const actualiteCount = await Actualite.count();
    const userCount = await User.count();

    console.log('📊 État actuel de la BD:');
    console.log(`  - Élus: ${eluCount}`);
    console.log(`  - Pétitions: ${petitionCount}`);
    console.log(`  - Actualités: ${actualiteCount}`);
    console.log(`  - Utilisateurs: ${userCount}\n`);

    if (eluCount > 0 && petitionCount > 0 && actualiteCount > 0) {
      console.log('✅ BD a des données. Aucun seed nécessaire.\n');
      process.exit(0);
    }

    console.log('⚠️  BD vide ou incomplète. Génération des données de test...\n');

    let testUser = await User.findOne({ where: { email: 'citoyen@test.com' } });
    if (!testUser) {
      testUser = await User.create({
        email: 'citoyen@test.com',
        nomComplet: 'Citoyen Test',
        role: 'citizen',
      });
      console.log('✅ Utilisateur de test créé');
    }

    if (eluCount === 0) {
      const elus = [
        { nom: 'François Legault', titre: 'Premier Ministre', region: 'Québec', niveau: 'provincial', email: 'francois.legault@quebec.ca', latitude: 46.8139, longitude: -71.2080 },
        { nom: 'Justin Trudeau', titre: 'Premier Ministre', region: 'Canada', niveau: 'fédéral', email: 'justin.trudeau@canada.ca', latitude: 45.4215, longitude: -75.6972 },
        { nom: 'Valérie Plante', titre: 'Maire', region: 'Montréal', niveau: 'municipal', email: 'valerie.plante@ville.montreal.qc.ca', latitude: 45.5017, longitude: -73.5673 },
        { nom: 'Denis Coderre', titre: 'Conseiller', region: 'Montréal', niveau: 'municipal', email: 'denis.coderre@ville.montreal.qc.ca', latitude: 45.5017, longitude: -73.5673 },
        { nom: 'Gilles Duceppe', titre: 'Député', region: 'Montréal', niveau: 'fédéral', email: 'gilles.duceppe@parl.ca', latitude: 45.5017, longitude: -73.5673 },
        { nom: 'Nathalie Roy', titre: 'Ministre', region: 'Québec', niveau: 'provincial', email: 'nathalie.roy@quebec.ca', latitude: 46.8139, longitude: -71.2080 },
        { nom: 'Bruno Marchand', titre: 'Maire', region: 'Québec', niveau: 'municipal', email: 'bruno.marchand@ville.quebec.qc.ca', latitude: 46.8139, longitude: -71.2080 },
        { nom: 'Karina Gould', titre: 'Ministre', region: 'Canada', niveau: 'fédéral', email: 'karina.gould@canada.ca', latitude: 45.3200, longitude: -75.7469 },
        { nom: 'Sophie Brochu', titre: 'Députée', region: 'Québec', niveau: 'provincial', email: 'sophie.brochu@quebec.ca', latitude: 46.8139, longitude: -71.2080 },
        { nom: 'Marc Miller', titre: 'Ministre', region: 'Canada', niveau: 'fédéral', email: 'marc.miller@canada.ca', latitude: 45.4215, longitude: -75.6972 },
      ];
      await Elu.bulkCreate(elus);
      console.log(`✅ ${elus.length} élus créés`);
    }

    if (petitionCount === 0) {
      const elu1 = await Elu.findOne({ where: { nom: 'François Legault' } });
      const elu2 = await Elu.findOne({ where: { nom: 'Justin Trudeau' } });
      const petitions = [
        { titre: 'Améliorer les transports en commun à Montréal', description: 'Nous demandons une augmentation du financement des transports en commun...', status: 'published', eluId: elu1?.id || null, citoyenId: testUser.id, signaturesCount: 145, deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) },
        { titre: 'Augmenter le financement pour l\'éducation post-secondaire', description: 'Les étudiants canadiens sont confrontés à des frais de scolarité croissants...', status: 'published', eluId: elu2?.id || null, citoyenId: testUser.id, signaturesCount: 287, deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000) },
        { titre: 'Créer des zones vertes dans tous les quartiers', description: 'Chaque quartier mérite d\'avoir accès à des espaces verts publics...', status: 'published', eluId: elu1?.id || null, citoyenId: testUser.id, signaturesCount: 78, deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
      ];
      await Petition.bulkCreate(petitions);
      console.log(`✅ ${petitions.length} pétitions créées`);
    }

    if (actualiteCount === 0) {
      const actualites = [
        { titre: 'Nouvelle politique climatique annoncée', contenu: 'Le gouvernement a annoncé une nouvelle politique climatique ambitieuse...', status: 'published', authorId: testUser.id, likesCount: 42, commentsCount: 8, publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { titre: 'Réforme de l\'assurance-maladie au Québec', contenu: 'Le ministre de la Santé a dévoilé les détails de la réforme...', status: 'published', authorId: testUser.id, likesCount: 67, commentsCount: 15, publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { titre: 'Investissement majeur dans l\'infrastructure de transport', contenu: 'Le gouvernement fédéral investira 10 milliards de dollars...', status: 'published', authorId: testUser.id, likesCount: 89, commentsCount: 23, publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        { titre: 'Programme de bourses pour les jeunes citoyens', contenu: 'Un nouveau programme de bourses a été lancé...', status: 'published', authorId: testUser.id, likesCount: 54, commentsCount: 11, publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
        { titre: 'Consultation publique sur la réforme électorale', contenu: 'Le gouvernement lance une consultation publique...', status: 'published', authorId: testUser.id, likesCount: 31, commentsCount: 6, publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      ];
      await Actualite.bulkCreate(actualites);
      console.log(`✅ ${actualites.length} actualités créées`);
    }

    console.log('\n✅ Seed de données complété avec succès!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  }
}

checkAndSeedDatabase();
