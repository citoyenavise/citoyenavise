
const { query } = require('../../../core/services/database');
const logger = require('../../../core/utils/logger');

async function getContent(id) {
  const result = await query('SELECT * FROM content WHERE id = $1', [id]);
  return result.rows[0];
}

async function createContent({ title, description, type }) {
  const result = await query(
    'INSERT INTO content (title, description, type, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
    [title, description, type]
  );
  return result.rows[0];
}

module.exports = {
  getContent,
  createContent
};
