/**
 * Notifications Routes
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired } = require('../../core/middleware/auth');
const controller = require('./controllers/notifications.controller');

const router = express.Router();

router.get('/', authRequired, asyncHandler(controller.listNotifications));
router.post('/', authRequired, asyncHandler(controller.sendNotification));
router.patch('/:id/read', authRequired, asyncHandler(controller.markAsRead));
router.delete('/:id', authRequired, asyncHandler(controller.deleteNotification));

module.exports = router;
