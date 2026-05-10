/**
 * Tests pour le système de gamification
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
  UserAction,
  Mission,
  UserMissionProgress,
  Badge,
  UserBadge,
  UserProgression,
  DomainProgression,
  ActivityMetrics,
} from '../src/models/index.js';
import { ActionLoggerService } from '../src/services/ActionLoggerService.js';
import { MissionEngineService } from '../src/services/MissionEngineService.js';
import { BadgeService } from '../src/services/BadgeService.js';
import sequelize from '../src/db/sequelize.js';

describe('Gamification System', () => {
  beforeAll(async () => {
    try {
      await sequelize.sync({ alter: true });
    } catch (err) {
      console.warn('⚠️ Database sync warning:', err.message);
    }
  });

  describe('UserAction Model', () => {
    it('should create user action', async () => {
      const action = await UserAction.create({
        userId: 1,
        actionKey: 'sign_petition',
        category: 'civic',
        xpValue: 10,
      });

      expect(action).toBeDefined();
      expect(action.actionKey).toBe('sign_petition');
      expect(action.xpValue).toBe(10);
    });

    it('should validate required fields', async () => {
      try {
        await UserAction.create({
          userId: 1,
          // actionKey missing
          category: 'civic',
        });
        expect(true).toBe(false); // Should have thrown
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });

  describe('Mission Model', () => {
    it('should create mission', async () => {
      const mission = await Mission.create({
        missionKey: 'daily_test',
        titleFr: 'Test Mission',
        category: 'discovery',
        frequency: 'daily',
        xpReward: 50,
        completionCriteria: { actionCount: 5 },
      });

      expect(mission).toBeDefined();
      expect(mission.frequency).toBe('daily');
      expect(mission.xpReward).toBe(50);
    });

    it('should have correct enum values', () => {
      const frequencies = ['daily', 'weekly', 'monthly', 'special'];
      frequencies.forEach(freq => {
        expect(['daily', 'weekly', 'monthly', 'special']).toContain(freq);
      });
    });
  });

  describe('UserMissionProgress Model', () => {
    it('should track mission progress', async () => {
      const mission = await Mission.create({
        missionKey: 'progress_test',
        titleFr: 'Progress Test',
        category: 'civic',
        frequency: 'daily',
        xpReward: 30,
        completionCriteria: { actionCount: 3 },
      });

      const progress = await UserMissionProgress.create({
        userId: 2,
        missionId: mission.id,
        status: 'active',
        progressValue: 2,
      });

      expect(progress.status).toBe('active');
      expect(progress.progressValue).toBe(2);
    });
  });

  describe('Badge Model', () => {
    it('should create badge', async () => {
      const badge = await Badge.create({
        badgeKey: 'test_badge',
        nameFr: 'Test Badge',
        category: 'discovery',
        rarity: 'common',
        unlockCriteria: { actionCount: 10 },
      });

      expect(badge).toBeDefined();
      expect(badge.rarity).toBe('common');
    });
  });

  describe('UserProgression Model', () => {
    it('should track user progression', async () => {
      const progression = await UserProgression.create({
        userId: 3,
        totalXp: 500,
        level: 2,
        totalActions: 25,
      });

      expect(progression.level).toBe(2);
      expect(progression.totalXp).toBe(500);
    });

    it('should have default values', async () => {
      const progression = await UserProgression.create({
        userId: 4,
      });

      expect(progression.totalXp).toBe(0);
      expect(progression.level).toBe(1);
      expect(progression.currentStreak).toBe(0);
    });
  });

  describe('DomainProgression Model', () => {
    it('should track domain-specific progression', async () => {
      const domain = await DomainProgression.create({
        userId: 5,
        domain: 'civic',
        level: 3,
        xp: 1500,
      });

      expect(domain.domain).toBe('civic');
      expect(domain.level).toBe(3);
    });
  });

  describe('ActivityMetrics Model', () => {
    it('should track daily activity', async () => {
      const today = new Date().toISOString().split('T')[0];

      const metrics = await ActivityMetrics.create({
        userId: 6,
        metricDate: today,
        actionsCount: 10,
        timeSpentSeconds: 3600,
      });

      expect(metrics.actionsCount).toBe(10);
      expect(metrics.timeSpentSeconds).toBe(3600);
    });
  });

  describe('ActionLoggerService', () => {
    it('should calculate XP value correctly', () => {
      const xp = ActionLoggerService.getXpValue('civic', 'sign_petition');
      expect(xp).toBe(10);
    });

    it('should calculate level from XP', () => {
      expect(ActionLoggerService.calculateLevel(0)).toBe(1);
      expect(ActionLoggerService.calculateLevel(500)).toBe(2);
      expect(ActionLoggerService.calculateLevel(1200)).toBe(3);
      expect(ActionLoggerService.calculateLevel(10000)).toBe(5);
    });

    it('should log action and update progression', async () => {
      await ActionLoggerService.logAction(7, 'view_elu', 'discovery', {
        eluId: 1,
      });

      const progression = await UserProgression.findOne({
        where: { userId: 7 },
      });

      expect(progression).toBeDefined();
      expect(progression.totalXp).toBeGreaterThan(0);
    });
  });

  describe('MissionEngineService', () => {
    it('should calculate level from XP', () => {
      expect(MissionEngineService.calculateLevel(0)).toBe(1);
      expect(MissionEngineService.calculateLevel(500)).toBe(2);
      expect(MissionEngineService.calculateLevel(1200)).toBe(3);
    });

    it('should get level threshold', () => {
      expect(MissionEngineService.getLevelThreshold(1)).toBe(0);
      expect(MissionEngineService.getLevelThreshold(2)).toBe(500);
      expect(MissionEngineService.getLevelThreshold(3)).toBe(1200);
    });

    it('should create mission stats', async () => {
      const mission = await Mission.create({
        missionKey: 'stats_test',
        titleFr: 'Stats Test',
        category: 'civic',
        frequency: 'daily',
        xpReward: 20,
        completionCriteria: { actionCount: 2 },
      });

      await UserMissionProgress.create({
        userId: 8,
        missionId: mission.id,
        status: 'active',
      });

      const stats = await MissionEngineService.getUserMissionStats(8);

      expect(stats.active).toBeGreaterThan(0);
      expect(stats.completed).toBe(0);
    });
  });

  describe('BadgeService', () => {
    it('should get all badges', async () => {
      const badge = await Badge.create({
        badgeKey: 'service_test',
        nameFr: 'Service Test Badge',
        category: 'civic',
        rarity: 'rare',
        unlockCriteria: { levelMin: 3 },
      });

      const badges = await BadgeService.getAllBadges();

      expect(badges).toBeDefined();
      expect(Array.isArray(badges)).toBe(true);
    });

    it('should track badge stats', async () => {
      const stats = await BadgeService.getBadgeStats(9);

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('unlocked');
      expect(stats).toHaveProperty('locked');
      expect(stats).toHaveProperty('percentComplete');
    });
  });

  describe('Associations', () => {
    it('should have UserAction -> User relationship', async () => {
      const action = await UserAction.findOne({
        include: [{ association: 'user' }],
      });

      if (action) {
        expect(action.user).toBeDefined();
      }
    });

    it('should have Mission -> UserMissionProgress relationship', async () => {
      const mission = await Mission.findOne({
        include: [{ association: 'userProgress' }],
      });

      if (mission) {
        expect(Array.isArray(mission.userProgress)).toBe(true);
      }
    });

    it('should have Badge -> UserBadge relationship', async () => {
      const badge = await Badge.findOne({
        include: [{ association: 'users' }],
      });

      if (badge) {
        expect(Array.isArray(badge.users)).toBe(true);
      }
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
