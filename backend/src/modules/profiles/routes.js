/**
 * Routes profils citoyens
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired, authOptional } = require('../../core/middleware/auth');
const profilesController = require('./controller');

const router = express.Router();

// List profiles
router.get('/', authOptional, asyncHandler(profilesController.listProfiles));

// Get profile
router.get('/:id', asyncHandler(profilesController.getProfile));

// Create profile (protected)
router.post('/', authRequired, asyncHandler(profilesController.createProfile));

// Update profile (protected)
router.put('/:id', authRequired, asyncHandler(profilesController.updateProfile));

// Get profile posts
router.get('/:id/posts', asyncHandler(profilesController.getProfilePosts));

// Get followers
router.get('/:id/followers', asyncHandler(profilesController.getFollowers));

// Follow profile (protected)
router.post('/:id/follow', authRequired, asyncHandler(profilesController.followProfile));

// Unfollow profile (protected)
router.delete('/:id/follow', authRequired, asyncHandler(profilesController.unfollowProfile));

module.exports = router;
