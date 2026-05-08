const { z } = require('zod');

const sendNotificationRules = {
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  type: z.enum(['info', 'warning', 'success', 'error']).optional(),
};

module.exports = {
  sendNotificationRules,
};
