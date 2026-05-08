/**
 * Service notifications
 */

const { v4: uuidv4 } = require('uuid');
const { query } = require('../../../core/services/database');
const { AppError } = require('../../../core/middleware/errorHandler');
const logger = require('../../../core/utils/logger');

async function listNotifications(userId, { limit = 20, page = 1 }) {
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1',
    [userId]
  );

  return {
    data: result.rows,
    meta: {
      total: parseInt(countResult.rows[0].total),
      page,
      limit,
    },
  };
}

async function getNotification(notificationId, userId) {
  const result = await query(
    'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Notification not found', 404);
  }

  return result.rows[0];
}

async function sendNotification({ userId, title, message, type = 'info' }) {
  const notificationId = uuidv4();

  const result = await query(
    `INSERT INTO notifications (id, user_id, title, message, type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [notificationId, userId, title, message, type]
  );

  logger.info('Notification sent', { meta: { notificationId, userId } });
  return result.rows[0];
}

async function markAsRead(notificationId, userId) {
  const result = await query(
    `UPDATE notifications SET read = true, read_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Notification not found', 404);
  }

  logger.info('Notification marked as read', { meta: { notificationId, userId } });
  return result.rows[0];
}

async function deleteNotification(notificationId, userId) {
  const result = await query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
    [notificationId, userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Notification not found', 404);
  }

  logger.info('Notification deleted', { meta: { notificationId, userId } });
}

module.exports = {
  listNotifications,
  getNotification,
  sendNotification,
  markAsRead,
  deleteNotification,
};
