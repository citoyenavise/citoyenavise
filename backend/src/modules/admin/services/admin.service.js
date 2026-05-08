/**
 * Service admin
 */

const { query } = require('../../../core/services/database');
const logger = require('../../../core/utils/logger');

async function getAuditLogs({ limit = 20, page = 1 }) {
  const offset = (page - 1) * limit;
  const maxLimit = Math.min(limit, 100);

  const result = await query(
    `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [maxLimit, offset]
  );

  const countResult = await query('SELECT COUNT(*) as total FROM audit_logs');

  return {
    data: result.rows,
    meta: {
      total: parseInt(countResult.rows[0].total),
      page,
      limit: maxLimit,
    },
  };
}

async function logAdminAction({ adminId, action, resourceType, resourceId }) {
  await query(
    `INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [adminId, action, resourceType, resourceId]
  );

  logger.info('Admin action logged', { meta: { adminId, action } });
}

module.exports = {
  getAuditLogs,
  logAdminAction,
};
