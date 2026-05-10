/**
 * Seed script for gamification data
 * Creates default missions and badges
 * Usage: npm run seed:gamification
 */

import sequelize from '../src/db/sequelize.js';
import { Mission, Badge } from '../src/models/index.js';

const MISSIONS = [
  // Daily Missions
  {
    missionKey: 'daily_explore',
    titleFr: '🔍 Explorer 5 établissements',
    descriptionFr: 'Découvrez 5 nouveaux établissements sur la plateforme',
    category: 'discovery',
    frequency: 'daily',
    xpReward: 25,
    completionCriteria: {
      actionKey: 'view_establishment',
      actionCount: 5,
    },
    displayOrder: 1,
  },
  {
    missionKey: 'daily_engage',
    titleFr: '💬 Participez à une discussion',
    descriptionFr: 'Commentez ou répondez à au moins un commentaire',
    category: 'social',
    frequency: 'daily',
    xpReward: 20,
    completionCriteria: {
      specificActions: ['comment', 'reply_to_comment'],
      actionCount: 1,
    },
    displayOrder: 2,
  },
  {
    missionKey: 'daily_civic',
    titleFr: '🏛️ Engagez-vous civiquement',
    descriptionFr: 'Signez une pétition ou votez dans un sondage',
    category: 'civic',
    frequency: 'daily',
    xpReward: 30,
    completionCriteria: {
      specificActions: ['sign_petition', 'vote_sondage'],
      actionCount: 1,
    },
    displayOrder: 3,
  },

  // Weekly Missions
  {
    missionKey: 'weekly_petitions',
    titleFr: '📝 Activiste de la semaine',
    descriptionFr: 'Signez 3 pétitions cette semaine',
    category: 'civic',
    frequency: 'weekly',
    xpReward: 75,
    completionCriteria: {
      actionKey: 'sign_petition',
      actionCount: 3,
    },
    displayOrder: 4,
  },
  {
    missionKey: 'weekly_contributor',
    titleFr: '✍️ Contributeur de la semaine',
    descriptionFr: 'Contribuez à 2 fiches d\'établissement',
    category: 'public_data',
    frequency: 'weekly',
    xpReward: 60,
    completionCriteria: {
      actionKey: 'contribute_fiche',
      actionCount: 2,
    },
    displayOrder: 5,
  },
  {
    missionKey: 'weekly_discoverer',
    titleFr: '🌍 Explorateur de la semaine',
    descriptionFr: 'Découvrez 10 élus différents',
    category: 'discovery',
    frequency: 'weekly',
    xpReward: 50,
    completionCriteria: {
      actionKey: 'view_elu',
      actionCount: 10,
    },
    displayOrder: 6,
  },

  // Monthly Missions
  {
    missionKey: 'monthly_creator',
    titleFr: '🎨 Créateur du mois',
    descriptionFr: 'Publiez 2 contenus créatifs (idées, photos, vidéos)',
    category: 'creative',
    frequency: 'monthly',
    xpReward: 150,
    completionCriteria: {
      specificActions: ['publish_idea', 'publish_photo', 'publish_video'],
      actionCount: 2,
    },
    displayOrder: 7,
  },
  {
    missionKey: 'monthly_champion',
    titleFr: '🏆 Champion civique du mois',
    descriptionFr: 'Complétez 8 missions hebdomadaires',
    category: 'civic',
    frequency: 'monthly',
    xpReward: 200,
    completionCriteria: {
      missionsCompletedMin: 8,
    },
    displayOrder: 8,
  },
];

const BADGES = [
  // Discovery Badges
  {
    badgeKey: 'explorer',
    nameFr: '🔍 Explorateur',
    descriptionFr: 'Explorez 20 établissements',
    category: 'discovery',
    rarity: 'common',
    unlockCriteria: {
      actionCategoryCount: 20,
      category: 'discovery',
    },
  },
  {
    badgeKey: 'cartographer',
    nameFr: '🗺️ Cartographe',
    descriptionFr: 'Explorez 100 établissements',
    category: 'discovery',
    rarity: 'rare',
    unlockCriteria: {
      actionCategoryCount: 100,
      category: 'discovery',
    },
  },
  {
    badgeKey: 'elu_observer',
    nameFr: '👁️ Observateur d\'élus',
    descriptionFr: 'Consultez 50 fiches d\'élus',
    category: 'discovery',
    rarity: 'uncommon',
    unlockCriteria: {
      specificActionKey: 'view_elu',
      specificActionCount: 50,
    },
  },

  // Civic Badges
  {
    badgeKey: 'petitioner',
    nameFr: '📝 Pétitionnaire',
    descriptionFr: 'Signez votre première pétition',
    category: 'civic',
    rarity: 'common',
    unlockCriteria: {
      specificActionKey: 'sign_petition',
      specificActionCount: 1,
    },
  },
  {
    badgeKey: 'activist',
    nameFr: '⚡ Activiste',
    descriptionFr: 'Signez 25 pétitions',
    category: 'civic',
    rarity: 'rare',
    unlockCriteria: {
      specificActionKey: 'sign_petition',
      specificActionCount: 25,
    },
  },
  {
    badgeKey: 'civic_champion',
    nameFr: '🏛️ Champion civique',
    descriptionFr: 'Signez 100 pétitions',
    category: 'civic',
    rarity: 'epic',
    unlockCriteria: {
      specificActionKey: 'sign_petition',
      specificActionCount: 100,
    },
  },
  {
    badgeKey: 'promise_tracker',
    nameFr: '✔️ Suivi des promesses',
    descriptionFr: 'Suivez 10 promesses d\'élus',
    category: 'civic',
    rarity: 'uncommon',
    unlockCriteria: {
      specificActionKey: 'track_promise',
      specificActionCount: 10,
    },
  },

  // Contribution Badges
  {
    badgeKey: 'contributor',
    nameFr: '📊 Contributeur',
    descriptionFr: 'Contribuez à 5 fiches',
    category: 'contribution',
    rarity: 'common',
    unlockCriteria: {
      specificActionKey: 'contribute_fiche',
      specificActionCount: 5,
    },
  },
  {
    badgeKey: 'photographer',
    nameFr: '📸 Photographe',
    descriptionFr: 'Ajoutez 20 photos',
    category: 'contribution',
    rarity: 'uncommon',
    unlockCriteria: {
      specificActionKey: 'add_photo',
      specificActionCount: 20,
    },
  },
  {
    badgeKey: 'content_creator',
    nameFr: '🎥 Créateur de contenu',
    descriptionFr: 'Publiez 10 contenus créatifs',
    category: 'contribution',
    rarity: 'rare',
    unlockCriteria: {
      specificActions: ['publish_idea', 'publish_photo', 'publish_video'],
      actionCount: 10,
    },
  },

  // Loyalty Badges
  {
    badgeKey: 'early_adopter',
    nameFr: '🌟 Précurseur',
    descriptionFr: 'Connectez-vous le premier jour',
    category: 'fidélisation',
    rarity: 'rare',
    unlockCriteria: {
      specificActionKey: 'first_login',
      specificActionCount: 1,
    },
  },
  {
    badgeKey: 'committed',
    nameFr: '🔥 Engagé',
    descriptionFr: 'Maintenez une séquence de 7 jours',
    category: 'fidélisation',
    rarity: 'uncommon',
    unlockCriteria: {
      streakDaysMin: 7,
    },
  },
  {
    badgeKey: 'loyal',
    nameFr: '💪 Fidèle',
    descriptionFr: 'Maintenez une séquence de 30 jours',
    category: 'fidélisation',
    rarity: 'rare',
    unlockCriteria: {
      streakDaysMin: 30,
    },
  },
  {
    badgeKey: 'legendary',
    nameFr: '👑 Légendaire',
    descriptionFr: 'Atteindre le niveau 6',
    category: 'fidélisation',
    rarity: 'epic',
    unlockCriteria: {
      levelMin: 6,
    },
  },

  // Level Badges
  {
    badgeKey: 'level_2',
    nameFr: '📚 Niveau 2 - Explorateur',
    descriptionFr: 'Atteindre le niveau 2',
    category: 'progression',
    rarity: 'common',
    unlockCriteria: {
      levelMin: 2,
    },
  },
  {
    badgeKey: 'level_3',
    nameFr: '🎯 Niveau 3 - Contributeur',
    descriptionFr: 'Atteindre le niveau 3',
    category: 'progression',
    rarity: 'uncommon',
    unlockCriteria: {
      levelMin: 3,
    },
  },
  {
    badgeKey: 'level_4',
    nameFr: '⭐ Niveau 4 - Expert',
    descriptionFr: 'Atteindre le niveau 4',
    category: 'progression',
    rarity: 'uncommon',
    unlockCriteria: {
      levelMin: 4,
    },
  },
  {
    badgeKey: 'level_5',
    nameFr: '👑 Niveau 5 - Maître',
    descriptionFr: 'Atteindre le niveau 5',
    category: 'progression',
    rarity: 'rare',
    unlockCriteria: {
      levelMin: 5,
    },
  },
];

async function seed() {
  try {
    console.log('🌱 Seeding gamification data...');

    // Sync database
    await sequelize.sync();
    console.log('✅ Database synced');

    // Create missions
    const createdMissions = await Mission.bulkCreate(MISSIONS, {
      ignoreDuplicates: true,
    });
    console.log(`✅ Created ${createdMissions.length} missions`);

    // Create badges
    const createdBadges = await Badge.bulkCreate(BADGES, {
      ignoreDuplicates: true,
    });
    console.log(`✅ Created ${createdBadges.length} badges`);

    console.log('✨ Gamification data seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding data:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run seed
seed();
