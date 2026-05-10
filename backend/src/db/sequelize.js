/**
 * Sequelize Configuration & Connection
 * ORM for database models and relations
 */

import { Sequelize } from 'sequelize';
import { getConfig } from '../config/env.js';

const config = getConfig();

// Parse DATABASE_URL
const sequelize = new Sequelize(config.DATABASE_URL, {
  dialect: 'postgres',
  logging: config.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: false,
  },
});

// Test connection
export async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Sequelize connection established');
    return true;
  } catch (error) {
    console.error('❌ Sequelize connection failed:', error.message);
    return false;
  }
}

export default sequelize;
