const { z } = require('zod');

const auditQueryRules = {
  limit: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
  userId: z.string().optional(),
  action: z.string().optional(),
};

const permissionUpdateRules = {
  userId: z.string().uuid(),
  permission: z.string(),
};

module.exports = {
  auditQueryRules,
  permissionUpdateRules,
};
