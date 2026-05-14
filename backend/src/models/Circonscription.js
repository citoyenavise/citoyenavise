/**
 * Circonscription Model
 * Représente les circonscriptions électorales (fédérales, provinciales, municipales)
 * Migré de legacy pg pool vers Sequelize ORM
 */

import { DataTypes, Op } from 'sequelize';
import sequelize from '../db/sequelize.js';

const Circonscription = sequelize.define(
  'Circonscription',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nom: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    niveau: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['fédéral', 'provincial', 'municipal']],
      },
    },
    région: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    codePostal: {
      type: DataTypes.STRING(10),
      field: 'code_postal',
    },
    elusIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      field: 'elus_ids',
      defaultValue: [],
    },
    population: {
      type: DataTypes.INTEGER,
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
    tableName: 'circonscriptions',
    timestamps: false,
  }
);

Circonscription.list = async function(filters = {}, limit = 50, offset = 0) {
  const { niveau, région, searchTerm, codePostal } = filters;
  const where = {};

  if (niveau) where.niveau = niveau;
  if (région) where.région = { [Op.iLike]: `%${région}%` };
  if (codePostal) where.codePostal = { [Op.like]: `${codePostal}%` };

  return this.findAll({
    where,
    limit: Math.min(limit, 100),
    offset: parseInt(offset),
    order: [['niveau', 'DESC'], ['région', 'ASC'], ['nom', 'ASC']],
  });
};

Circonscription.findById = async function(id) {
  return this.findByPk(id);
};

Circonscription.findByCodePostal = async function(codePostal, niveau = null) {
  const where = { codePostal };
  if (niveau) where.niveau = niveau;
  return this.findAll({ where });
};

Circonscription.findByRégion = async function(région, niveau = null) {
  const where = { région: { [Op.iLike]: `%${région}%` } };
  if (niveau) where.niveau = niveau;
  return this.findAll({
    where,
    order: [['nom', 'ASC']],
  });
};

Circonscription.listByNiveau = async function(niveau, limit = 50, offset = 0) {
  return this.list({ niveau }, limit, offset);
};

Circonscription.getStats = async function() {
  const count = await this.count();
  const niveaux = await this.count({
    distinct: true,
    col: 'niveau',
  });
  const régions = await this.count({
    distinct: true,
    col: 'région',
  });
  return {
    total_circonscriptions: count,
    niveaux,
    régions,
    total_population: 0,
  };
};

Circonscription.search = async function(searchTerm, limit = 50, offset = 0) {
  return this.list({ searchTerm }, limit, offset);
};

export default Circonscription;
