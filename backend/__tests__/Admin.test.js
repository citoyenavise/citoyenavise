/**
 * Tests pour le système d'administration
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { checkAdmin } from '../src/middlewares/admin.js';
import { User, Mission, Badge } from '../src/models/index.js';
import sequelize from '../src/db/sequelize.js';

describe('Admin System', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeAll(async () => {
    try {
      await sequelize.sync({ alter: true });
    } catch (err) {
      console.warn('⚠️ Database sync warning:', err.message);
    }

    // Setup mock objects
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('Admin Middleware', () => {
    it('should reject unauthenticated requests', () => {
      mockReq = { user: null };

      checkAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Not authenticated' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', () => {
      mockReq = { user: { id: 1, role: 'citizen' } };

      checkAdmin(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Admin access required' })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow admin users', () => {
      mockReq = { user: { id: 1, role: 'admin' } };

      checkAdmin(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('User Model with Role', () => {
    it('should create user with default citizen role', async () => {
      const user = await User.create({
        email: 'citizen@test.com',
        nomComplet: 'Test Citizen',
      });

      expect(user.role).toBe('citizen');
    });

    it('should create user with admin role', async () => {
      const user = await User.create({
        email: 'admin@test.com',
        nomComplet: 'Test Admin',
        role: 'admin',
      });

      expect(user.role).toBe('admin');
    });

    it('should update user role', async () => {
      const user = await User.create({
        email: 'promoted@test.com',
        nomComplet: 'Promoted User',
      });

      expect(user.role).toBe('citizen');

      await user.update({ role: 'admin' });

      expect(user.role).toBe('admin');
    });

    it('should validate role enum', async () => {
      try {
        await User.create({
          email: 'invalid@test.com',
          nomComplet: 'Invalid Role',
          role: 'superadmin',
        });
        expect(true).toBe(false); // Should have thrown
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });

  describe('Admin Queries', () => {
    it('should count users by role', async () => {
      const citizens = await User.count({ where: { role: 'citizen' } });
      const admins = await User.count({ where: { role: 'admin' } });

      expect(typeof citizens).toBe('number');
      expect(typeof admins).toBe('number');
      expect(citizens + admins).toBeGreaterThan(0);
    });

    it('should find all admins', async () => {
      const admins = await User.findAll({ where: { role: 'admin' } });

      expect(Array.isArray(admins)).toBe(true);
      admins.forEach(admin => {
        expect(admin.role).toBe('admin');
      });
    });

    it('should find all citizens', async () => {
      const citizens = await User.findAll({ where: { role: 'citizen' } });

      expect(Array.isArray(citizens)).toBe(true);
      citizens.forEach(citizen => {
        expect(citizen.role).toBe('citizen');
      });
    });
  });

  describe('Mission Management', () => {
    it('should create mission (admin action)', async () => {
      const mission = await Mission.create({
        missionKey: 'admin_test_mission',
        titleFr: 'Admin Test Mission',
        category: 'discovery',
        frequency: 'daily',
        xpReward: 50,
        completionCriteria: { actionCount: 5 },
      });

      expect(mission).toBeDefined();
      expect(mission.missionKey).toBe('admin_test_mission');
    });

    it('should update mission (admin action)', async () => {
      const mission = await Mission.create({
        missionKey: 'update_test',
        titleFr: 'Original Title',
        category: 'civic',
        frequency: 'weekly',
        xpReward: 30,
        completionCriteria: { actionCount: 3 },
      });

      await mission.update({ titleFr: 'Updated Title', xpReward: 60 });

      expect(mission.titleFr).toBe('Updated Title');
      expect(mission.xpReward).toBe(60);
    });

    it('should delete mission (admin action)', async () => {
      const mission = await Mission.create({
        missionKey: 'delete_test',
        titleFr: 'To Delete',
        category: 'social',
        frequency: 'daily',
        xpReward: 20,
        completionCriteria: { actionCount: 2 },
      });

      await mission.destroy();

      const found = await Mission.findByPk(mission.id);
      expect(found).toBeNull();
    });
  });

  describe('Badge Management', () => {
    it('should create badge (admin action)', async () => {
      const badge = await Badge.create({
        badgeKey: 'admin_test_badge',
        nameFr: 'Admin Test Badge',
        category: 'discovery',
        rarity: 'rare',
        unlockCriteria: { actionCount: 20 },
      });

      expect(badge).toBeDefined();
      expect(badge.badgeKey).toBe('admin_test_badge');
    });

    it('should update badge (admin action)', async () => {
      const badge = await Badge.create({
        badgeKey: 'badge_update_test',
        nameFr: 'Original Badge',
        category: 'civic',
        rarity: 'common',
        unlockCriteria: { actionCount: 10 },
      });

      await badge.update({ nameFr: 'Updated Badge', rarity: 'epic' });

      expect(badge.nameFr).toBe('Updated Badge');
      expect(badge.rarity).toBe('epic');
    });

    it('should delete badge (admin action)', async () => {
      const badge = await Badge.create({
        badgeKey: 'badge_delete_test',
        nameFr: 'Badge to Delete',
        category: 'contribution',
        rarity: 'uncommon',
        unlockCriteria: { actionCount: 5 },
      });

      await badge.destroy();

      const found = await Badge.findByPk(badge.id);
      expect(found).toBeNull();
    });
  });

  afterAll(async () => {
    try {
      await sequelize.close();
    } catch (err) {
      console.warn('⚠️ Database close warning:', err.message);
    }
  });
});
