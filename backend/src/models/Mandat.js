/**
 * Mandat Model
 * Représente un mandat historique d'un élu (snapshot temporel du rôle)
 * Phase G.2 - Lot 9
 *
 * Règle : un élu peut avoir plusieurs mandats successifs (préservation historique).
 * Un seul mandat est marqué est_actuel = TRUE par élu (index unique).
 */

import { DataTypes } from 'sequelize';
import sequelize from '../db/sequelize.js';

const NIVEAUX_AUTORISES = ['fédéral', 'provincial', 'municipal'];

const CAUSES_FIN_AUTORISEES = [
  'fin_mandat',
  'demission',
  'defaite_electorale',
  'deces',
  'revocation',
  'autre',
];

const Mandat = sequelize.define(
  'Mandat',
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

    // Snapshot rôle
    titre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    poste: {
      type: DataTypes.STRING(150),
    },
    rolesSecondaires: {
      type: DataTypes.TEXT,
      field: 'roles_secondaires',
    },
    partiPolitique: {
      type: DataTypes.STRING(100),
      field: 'parti_politique',
    },
    partiCouleur: {
      type: DataTypes.STRING(20),
      field: 'parti_couleur',
    },

    // Géographie
    circonscriptionId: {
      type: DataTypes.INTEGER,
      field: 'circonscription_id',
    },
    niveau: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [NIVEAUX_AUTORISES],
      },
    },
    region: {
      type: DataTypes.STRING(50),
    },
    legislature: {
      type: DataTypes.STRING(10),
    },

    // Temporalité
    dateDebut: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'date_debut',
    },
    dateFin: {
      type: DataTypes.DATEONLY,
      field: 'date_fin',
    },
    causeFin: {
      type: DataTypes.STRING(50),
      field: 'cause_fin',
      validate: {
        isIn: [[...CAUSES_FIN_AUTORISEES, null]],
      },
    },

    estActuel: {
      type: DataTypes.BOOLEAN,
      field: 'est_actuel',
      defaultValue: false,
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
    tableName: 'mandats',
    timestamps: true,
    underscored: true,
  }
);

export { NIVEAUX_AUTORISES, CAUSES_FIN_AUTORISEES };
export default Mandat;
