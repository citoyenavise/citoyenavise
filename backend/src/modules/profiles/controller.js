/**
 * Contrôleur profils — version corrigée
 */

const { z } = require('zod');
const profilesService = require('./service');

// Validation stricte
const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  location: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  interests: z.array(z.string()).optional(),
});

const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
});

// LIST
async function listProfiles(req, res) {
  const validated = paginationSchema.extend({
    search: z.string().optional(),
    region: z.string().optional(),
  }).parse(req.query);

  const result = await profilesService.listProfiles(validated);
  res.json(result);
}

// GET
async function getProfile(req, res) {
  const { id } = req.params;
  const profile = await profilesService.getProfile(id);
  res.json(profile);
}

// UPDATE (pas de createProfile)
async function updateProfile(req, res) {
  const { id } = req.params; // profileId
  const validated = updateProfileSchema.parse(req.body);

  const profile = await profilesService.updateProfile(
    id,
    validated,
    req.user.userId
  );

  res.json(profile);
}

// POSTS
async function getProfilePosts(req, res) {
  const { id } = req.params;
  const validated = paginationSchema.parse(req.query);

  const posts = await profilesService.getProfilePosts(id, validated);
  res.json(posts);
}

// FOLLOWERS
async function getFollowers(req, res) {
  const { id } = req.params;
  const validated = paginationSchema.parse(req.query);

  const followers = await profilesService.getFollowers(id, validated);
  res.json(followers);
}

// FOLLOW
async function followProfile(req, res) {
  const { id } = req.params;
  await profilesService.followProfile(id, req.user.userId);
  res.status(201).json({ message: 'Followed' });
}

// UNFOLLOW
async function unfollowProfile(req, res) {
  const { id } = req.params;
  await profilesService.unfollowProfile(id, req.user.userId);
  res.status(204).send();
}

module.exports = {
  listProfiles,
  getProfile,
  updateProfile,
  getProfilePosts,
  getFollowers,
  followProfile,
  unfollowProfile,
};
