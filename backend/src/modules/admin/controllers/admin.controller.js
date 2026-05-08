/**
 * Contrôleur admin
 */

const adminService = require('../services/admin.service');
const { AppError } = require('../../../core/middleware/errorHandler');

async function getAuditLogs(req, res) {
  const { limit = 20, page = 1 } = req.query;

  const result = await adminService.getAuditLogs({
    limit: Math.min(parseInt(limit), 100),
    page: Math.max(1, parseInt(page)),
  });

  res.apiPaginated(result.data, result.meta.total, result.meta.page, result.meta.limit);
}

module.exports = {
  getAuditLogs,
};
