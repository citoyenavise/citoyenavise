/**
 * Routes utilisateurs
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired } = require('../../core/middleware/auth');
const usersController = require('./controllers/users.controller');

const router = express.Router();

router.get('/:id', asyncHandler(usersController.getUser));
router.put('/:id', authRequired, asyncHandler(usersController.updateUser));
router.delete('/:id', authRequired, asyncHandler(usersController.deleteUser));

module.exports = router;
