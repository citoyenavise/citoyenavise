/**
 * Vote Model
 * Représente un vote d'un élu sur une loi/motion/projet
 * Phase G.2 - Lot 4
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const POSITIONS_AUTORISEES = [
  'pour',
  'contre',
  'abstention',
  'absent',
  'paire',
];

const Vote = sequelize.define(
  'Vote',
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

    // Identification du vote
    loiTitre: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'loi_titre',
      validate: {
        notEmpty: true,
      },
    },
    loiReference: {
      type: DataTypes.STRING(100),
      field: 'loi_reference',
    },
    loiDescription: {
      type: DataTypes.TEXT,
      field: 'loi_description',
    },
    enjeu: {
      type: DataTypes.STRING(50),
    },

    // Position
    position: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [POSITIONS_AUTORISEES],
      },
    },

    // Métadonnées analytiques
    alignementParti: {
      type: DataTypes.BOOLEAN,
      field: 'alignement_parti',
    },
    estVoteCle: {
      type: DataTypes.BOOLEAN,
      field: 'est_vote_cle',
      defaultValue: false,
    },
    legislature: {
      type: DataTypes.STRING(10),
    },
    session: {
      type: DataTypes.STRING(20),
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    source: {
      type: DataTypes.STRING(255),
    },
    sourceUrl: {
      type: DataTypes.TEXT,
      field: 'source_url',
    },

    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
  },
  {
    tableName: 'votes',
    timestamps: true,
    underscored: true,
  }
);

export { POSITIONS_AUTORISEES };
export default Vote;
