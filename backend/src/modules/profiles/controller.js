/**
 * Contrôleur profils
 */

const { z } = require('zod');
const profilesService = require('./service');

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  location: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  interests: z.array(z.string()).optional(),
});

const listSchema = z.object({
  limit: z.coerce.number().default(20),
  page: z.coerce.number().default(1),
  search: z.string().optional(),
  region: z.string().optional(),
});

async function listProfiles(req, res) {
  const validated = listSchema.parse(req.query);
  const result = await profilesService.listProfiles(validated);
  res.json(result);
}

async function getProfile(req, res) {
  const { id } = req.params;
  const profile = await profilesService.getProfile(id);
  res.json(profile);
}

async function createProfile(req, res) {
  const validated = updateProfileSchema.parse(req.body);
  const profile = await profilesService.updateProfile(
    (await req.user.profileId) || (await profilesService.getProfile(req.user.userId)).id,
    validated,
    req.user.userId
  );
  res.status(201).json(profile);
}

async function updateProfile(req, res) {
  const { id } = req.params;
  const validated = updateProfileSchema.parse(req.body);
  const profile = await profilesService.updateProfile(id, validated, req.user.userId);
  res.json(profile);
}

async function getProfilePosts(req, res) {
  const { id } = req.params;
  const { limit = 20, page = 1 } = req.query;
  const posts = await profilesService.getProfilePosts(id, {
    limit: parseInt(limit, 10),
    page: parseInt(page, 10),
  });
  res.json(posts);
}

async function getFollowers(req, res) {
  const { id } = req.params;
  const { limit = 20, page = 1 } = req.query;
  const followers = await profilesService.getFollowers(id, {
    limit: parseInt(limit, 10),
    page: parseInt(page, 10),
  });
  res.json(followers);
}

async function followProfile(req, res) {
  const { id } = req.params;
  await profilesService.followProfile(id, req.user.userId);
  res.status(201).json({ message: 'Followed' });
}

async function unfollowProfile(req, res) {
  const { id } = req.params;
  await profilesService.unfollowProfile(id, req.user.userId);
  res.status(204).send();
}

module.exports = {
  listProfiles,
  getProfile,
  createProfile,
  updateProfile,
  getProfilePosts,
  getFollowers,
  followProfile,
  unfollowProfile,
};
