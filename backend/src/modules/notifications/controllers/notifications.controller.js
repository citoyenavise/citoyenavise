/**
 * Contrôleur notifications
 */

const { z } = require('zod');
const notificationsService = require('../services/notifications.service');
const { AppError } = require('../../../core/middleware/errorHandler');

const sendNotificationSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  type: z.enum(['info', 'warning', 'success', 'error']).optional(),
});

async function listNotifications(req, res) {
  const { limit = 20, page = 1 } = req.query;
  const result = await notificationsService.listNotifications(req.user.userId, {
    limit: Math.min(parseInt(limit), 100),
    page: Math.max(1, parseInt(page)),
  });

  res.apiPaginated(result.data, result.meta.total, result.meta.page, result.meta.limit);
}

async function getNotification(req, res) {
  const { id } = req.params;
  const notification = await notificationsService.getNotification(id, req.user.userId);

  if (!notification) {
    throw new AppError('NOT_FOUND', 404, 'Notification not found');
  }

  res.apiSuccess(notification);
}

async function sendNotification(req, res) {
  const validated = sendNotificationSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      'Invalid request body',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const notification = await notificationsService.sendNotification(validated.data);
  res.apiCreated(notification);
}

async function markAsRead(req, res) {
  const { id } = req.params;
  const notification = await notificationsService.markAsRead(id, req.user.userId);
  res.apiSuccess(notification);
}

async function deleteNotification(req, res) {
  const { id } = req.params;
  await notificationsService.deleteNotification(id, req.user.userId);
  res.apiDeleted(id);
}

module.exports = {
  listNotifications,
  getNotification,
  sendNotification,
  markAsRead,
  deleteNotification,
};
