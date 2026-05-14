/**
 * Models Index & Relations
 * Agrège tous les modèles et définit les relations
 */

import User from './User.js';
import Elu from './Elu.js';
import Circonscription from './Circonscription.js';
import Petition from './Petition.js';
import Signature from './Signature.js';
import Actualite from './Actualite.js';
import EmailVerification from './EmailVerification.js';
import Comment from './Comment.js';
import Promise from './Promise.js';
// Modèles non essentiels (de phases précédentes) - commentés
// import { UserAction } from './UserAction.js';
// import { Mission } from './Mission.js';
// import { UserMissionProgress } from './UserMissionProgress.js';
// import { Badge } from './Badge.js';
// import { UserBadge } from './UserBadge.js';
// import { UserProgression } from './UserProgression.js';
// import { DomainProgression } from './DomainProgression.js';
// import { ActivityMetrics } from './ActivityMetrics.js';
// import { CivicTutorial } from './CivicTutorial.js';
// import { TutorialStep } from './TutorialStep.js';
// import { UserTutorialProgress } from './UserTutorialProgress.js';
// import { UserStepProgress } from './UserStepProgress.js';
// import { CivicAction } from './CivicAction.js';
// import { TutorialResource } from './TutorialResource.js';
// import { TutorialExample } from './TutorialExample.js';
// import { TutorialStats } from './TutorialStats.js';
import Translation from './Translation.js';
import PetitionTranslation from './PetitionTranslation.js';
import ActualiteTranslation from './ActualiteTranslation.js';
import PromiseTranslation from './PromiseTranslation.js';
import CommentTranslation from './CommentTranslation.js';

// Define Relations
// ═══════════════════════════════════════════════════════════════════

// User Relations
User.hasMany(Petition, {
  foreignKey: 'citoyenId',
  as: 'petitionsCreated',
});

User.hasMany(Signature, {
  foreignKey: 'citoyenId',
  as: 'signatures',
});

User.hasMany(Actualite, {
  foreignKey: 'authorId',
  as: 'actualites',
});

User.hasMany(EmailVerification, {
  foreignKey: 'userId',
  as: 'emailVerifications',
});
EmailVerification.belongsTo(User, {
  foreignKey: 'userId',
});

EmailVerification.belongsTo(User, {
  foreignKey: 'userId',
});

User.hasMany(Comment, {
  foreignKey: 'citoyenId',
  as: 'comments',
});

// Gamification Relations (Commented - non-essential models)
// User.hasMany(UserAction, {
//   foreignKey: 'userId',
//   as: 'actions',
// });
// User.hasMany(UserMissionProgress, {
//   foreignKey: 'userId',
//   as: 'missionProgress',
// });
// User.hasMany(UserBadge, {
//   foreignKey: 'userId',
//   as: 'badges',
// });
// User.hasOne(UserProgression, {
//   foreignKey: 'userId',
//   as: 'progression',
// });
// User.hasMany(DomainProgression, {
//   foreignKey: 'userId',
//   as: 'domainProgression',
// });
// User.hasMany(ActivityMetrics, {
//   foreignKey: 'userId',
//   as: 'activityMetrics',
// });

// Civic Tutorials Relations (Commented - non-essential models)
// User.hasMany(UserTutorialProgress, {
//   foreignKey: 'userId',
//   as: 'tutorialProgress',
// });
// User.hasMany(CivicAction, {
//   foreignKey: 'userId',
//   as: 'civicActions',
// });
// CivicTutorial.hasMany(TutorialStep, {
//   foreignKey: 'tutorialId',
//   as: 'steps',
// });
// CivicTutorial.hasMany(UserTutorialProgress, {
//   foreignKey: 'tutorialId',
//   as: 'userProgress',
// });
// CivicTutorial.hasMany(TutorialResource, {
//   foreignKey: 'tutorialId',
//   as: 'resources',
// });
// CivicTutorial.hasOne(TutorialStats, {
//   foreignKey: 'tutorialId',
//   as: 'stats',
// });
// TutorialStep.hasMany(TutorialExample, {
//   foreignKey: 'stepId',
//   as: 'examples',
// });
// UserTutorialProgress.hasMany(UserStepProgress, {
//   foreignKey: 'userTutorialProgressId',
//   as: 'stepProgress',
// });
// CivicAction.belongsTo(Elu, {
//   foreignKey: 'targetOfficialId',
//   as: 'targetOfficial',
// });

// Elu Relations
Elu.hasMany(Petition, {
  foreignKey: 'eluId',
  as: 'petitions',
});

Elu.hasMany(Promise, {
  foreignKey: 'eluId',
  as: 'promises',
});

// Petition Relations
Petition.belongsTo(User, {
  foreignKey: 'citoyenId',
  as: 'creator',
});

Petition.belongsTo(Elu, {
  foreignKey: 'eluId',
  as: 'elu',
});

Petition.hasMany(Signature, {
  foreignKey: 'petitionId',
  as: 'signatures',
});

Petition.hasMany(Comment, {
  foreignKey: 'petitionId',
  as: 'comments',
});

// Signature Relations
Signature.belongsTo(User, {
  foreignKey: 'citoyenId',
  as: 'signer',
});

Signature.belongsTo(Petition, {
  foreignKey: 'petitionId',
  as: 'petition',
});

// Actualite Relations
Actualite.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'author',
});

// Comment Relations
Comment.belongsTo(Petition, {
  foreignKey: 'petitionId',
  as: 'petition',
});

Comment.belongsTo(User, {
  foreignKey: 'citoyenId',
  as: 'author',
});

// Promise Relations
Promise.belongsTo(Elu, {
  foreignKey: 'eluId',
  as: 'elu',
});

// Translation Relations
Petition.hasMany(PetitionTranslation, {
  foreignKey: 'petitionId',
  as: 'translations',
});

Actualite.hasMany(ActualiteTranslation, {
  foreignKey: 'actualiteId',
  as: 'translations',
});

Promise.hasMany(PromiseTranslation, {
  foreignKey: 'promiseId',
  as: 'translations',
});

Comment.hasMany(CommentTranslation, {
  foreignKey: 'commentId',
  as: 'translations',
});

// ═══════════════════════════════════════════════════════════════════
// Export all models
// ═══════════════════════════════════════════════════════════════════

export {
  User,
  Elu,
  Circonscription,
  Petition,
  Signature,
  Actualite,
  EmailVerification,
  Comment,
  Promise,
  // Non-essential models exported above
  Translation,
  PetitionTranslation,
  ActualiteTranslation,
  PromiseTranslation,
  CommentTranslation,
};

export default {
  User,
  Elu,
  Circonscription,
  Petition,
  Signature,
  Actualite,
  EmailVerification,
  Comment,
  Promise,
  Translation,
  PetitionTranslation,
  ActualiteTranslation,
  PromiseTranslation,
  CommentTranslation,
};
