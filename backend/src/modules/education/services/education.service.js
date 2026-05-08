
const { query } = require('../../../core/services/database');
const logger = require('../../../core/utils/logger');

async function getResources() {
  const result = await query('SELECT * FROM education_resources ORDER BY created_at DESC');
  return result.rows;
}

async function createResource({ title, content, level }) {
  const result = await query(
    'INSERT INTO education_resources (title, content, level, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [title, content, level]
  );
  return result.rows[0];
}

module.exports = {
  getResources,
  createResource
};
