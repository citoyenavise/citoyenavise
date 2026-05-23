/**
 * Tests pour le modèle Promise (Sequelize)
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Promise as PromiseModel, Elu } from '../src/models/index.js';
import sequelize from '../src/db/sequelize.js';

describe('Promise Model (Sequelize)', () => {
  beforeAll(async () => {
    // sync alter:false — schéma déjà appliqué au boot serveur (Famille A bug Phase F)
    try {
      await sequelize.sync({ alter: false });
    } catch (err) {
      console.warn('⚠️  Database sync warning:', err.message);
    }
  });

  describe('Model Definition', () => {
    it('should have Promise model defined', () => {
      expect(PromiseModel).toBeDefined();
      expect(PromiseModel.name).toBe('Promise');
    });

    it('should have correct attributes', () => {
      const attributes = Object.keys(PromiseModel.rawAttributes);

      expect(attributes).toContain('id');
      expect(attributes).toContain('titre');
      expect(attributes).toContain('description');
      expect(attributes).toContain('status');
      expect(attributes).toContain('deadline');
      expect(attributes).toContain('completedAt');
      expect(attributes).toContain('createdAt');
      expect(attributes).toContain('updatedAt');
    });

    it('should have titre as required field', () => {
      const titreAttribute = PromiseModel.rawAttributes.titre;
      expect(titreAttribute.allowNull).toBe(false);
    });

    it('should have default status of engagee', () => {
      const statusAttribute = PromiseModel.rawAttributes.status;
      expect(statusAttribute.defaultValue).toBe('engagee');
    });
  });

  describe('Associations', () => {
    it('should have association with Elu', () => {
      const associations = Object.keys(PromiseModel.associations || {});
      expect(associations).toContain('elu');
    });

    it('should have belongsTo Elu relationship', () => {
      const eluAssociation = PromiseModel.associations?.elu;
      expect(eluAssociation).toBeDefined();
      expect(eluAssociation?.associationType).toBe('BelongsTo');
    });
  });

  describe('Validations', () => {
    it('should accept valid titre', async () => {
      expect(() => {
        PromiseModel.build({
          titre: 'Test Promise',
          eluId: 1,
        }).validate();
      }).not.toThrow();
    });

    it('should reject empty titre', async () => {
      const promise = PromiseModel.build({
        titre: '',
        eluId: 1,
      });

      try {
        await promise.validate();
        expect(true).toBe(false); // Should have thrown
      } catch (err) {
        expect(err.message).toContain('notEmpty');
      }
    });

    it('should accept valid status values', () => {
      const validStatuses = ['engagee', 'en_cours', 'completee', 'abandonnee'];

      validStatuses.forEach((status) => {
        const promise = PromiseModel.build({
          titre: 'Test',
          eluId: 1,
          status,
        });

        expect(promise.status).toBe(status);
      });
    });
  });

  describe('Status Enum', () => {
    it('should have 4 valid status values', () => {
      const statusAttribute = PromiseModel.rawAttributes.status;
      const { values } = statusAttribute;

      expect(values).toEqual([
        'engagee',
        'en_cours',
        'completee',
        'abandonnee',
      ]);
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt field', () => {
      expect(PromiseModel.rawAttributes.createdAt).toBeDefined();
    });

    it('should have updatedAt field', () => {
      expect(PromiseModel.rawAttributes.updatedAt).toBeDefined();
    });

    it('should have completedAt field', () => {
      expect(PromiseModel.rawAttributes.completedAt).toBeDefined();
    });
  });

  describe('Table Name', () => {
    it('should use promises table', () => {
      expect(PromiseModel.tableName).toBe('promises');
    });
  });

  afterAll(async () => {
    try {
      // sequelize.close() retiré (Famille A) — instance partagée, forceExit handle exit
    } catch (err) {
      console.warn('⚠️  Database close warning:', err.message);
    }
  });
});
