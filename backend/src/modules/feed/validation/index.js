const { z } = require('zod');

const getFeedRules = {
  limit: z.number().min(1).max(100).optional(),
  page: z.number().min(1).optional(),
};

module.exports = {
  getFeedRules,
};
