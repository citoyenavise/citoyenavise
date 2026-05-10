/**
 * Models Index & Relations
 * Agrège tous les modèles et définit les relations
 */

import User from './User.js';
import Elu from './Elu.js';
import Petition from './Petition.js';
import Signature from './Signature.js';
import Actualite from './Actualite.js';
import EmailVerification from './EmailVerification.js';

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

// Elu Relations
Elu.hasMany(Petition, {
  foreignKey: 'eluId',
  as: 'petitions',
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

// ═══════════════════════════════════════════════════════════════════
// Export all models
// ═══════════════════════════════════════════════════════════════════

export { User, Elu, Petition, Signature, Actualite, EmailVerification };

export default {
  User,
  Elu,
  Petition,
  Signature,
  Actualite,
  EmailVerification,
};
