/**
 * EluComment Model
 * Représente un commentaire, une question ou un signalement citoyen sur un élu
 * Phase G.2 - Lot 7
 *
 * Distinct de Comment (lié aux pétitions).
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const TYPES_AUTORISES = ['commentaire', 'question', 'signalement'];

const STATUTS_AUTORISES = [
  'en_attente',
  'publie',
  'rejete',
  'masque',
  'supprime',
];

const EluComment = sequelize.define(
  'EluComment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    eluId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'elu_id',
    },
    citoyenId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'citoyen_id',
    },

    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'commentaire',
      validate: {
        isIn: [TYPES_AUTORISES],
      },
    },

    contenu: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 5000],
      },
    },

    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'en_attente',
      validate: {
        isIn: [STATUTS_AUTORISES],
      },
    },
    motifRejet: {
      type: DataTypes.TEXT,
      field: 'motif_rejet',
    },
    moderatedBy: {
      type: DataTypes.INTEGER,
      field: 'moderated_by',
    },
    moderatedAt: {
      type: DataTypes.DATE,
      field: 'moderated_at',
    },

    reponse: {
      type: DataTypes.TEXT,
    },
    reponsePar: {
      type: DataTypes.INTEGER,
      field: 'reponse_par',
    },
    reponseAt: {
      type: DataTypes.DATE,
      field: 'reponse_at',
    },

    likesCount: {
      type: DataTypes.INTEGER,
      field: 'likes_count',
      defaultValue: 0,
    },
    signaledCount: {
      type: DataTypes.INTEGER,
      field: 'signaled_count',
      defaultValue: 0,
    },

    parentId: {
      type: DataTypes.INTEGER,
      field: 'parent_id',
    },

    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at',
    },
  },
  {
    tableName: 'elu_comments',
    timestamps: true,
    paranoid: true,
    underscored: true,
  }
);

export { TYPES_AUTORISES, STATUTS_AUTORISES };
export default EluComment;
