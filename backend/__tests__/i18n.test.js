/**
 * Tests for i18n (Internationalization)
 * Tests the translation service (unit tests - no database required)
 */

import { describe, it, expect } from '@jest/globals';
import { translate } from '../src/services/i18n.js';

describe('i18n - Translation Service', () => {
  describe('translate() function', () => {
    it('should translate French keys to French text', () => {
      const result = translate('petition.created', 'fr');
      expect(result).toBe('Pétition créée avec succès');
    });

    it('should translate English keys to English text', () => {
      const result = translate('petition.created', 'en');
      expect(result).toBe('Petition created successfully');
    });

    it('should handle missing translations with fallback to French', () => {
      const result = translate('nonexistent.key', 'en');
      expect(result).toBe('nonexistent.key');
    });

    it('should support parameter interpolation', () => {
      const result = translate('auth.loginRequested', 'fr', {
        email: 'test@example.com',
      });
      expect(result).toContain('test@example.com');
    });

    it('should support parameter interpolation in English', () => {
      const result = translate('auth.loginRequested', 'en', {
        email: 'user@example.com',
      });
      expect(result).toContain('user@example.com');
    });

    it('should default to French when no language specified', () => {
      const result = translate('petition.signed');
      expect(result).toBe('Merci de votre signature');
    });
  });

  describe('Translation keys coverage', () => {
    it('should have French translations for error.notFound', () => {
      const result = translate('error.notFound', 'fr');
      expect(result).not.toContain('error.notFound');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should have English translations for error.notFound', () => {
      const result = translate('error.notFound', 'en');
      expect(result).toBe('Not found');
    });

    it('should have French translations for petition.alreadySigned', () => {
      const result = translate('petition.alreadySigned', 'fr');
      expect(result).toContain('déjà signé');
    });

    it('should have English translations for petition.alreadySigned', () => {
      const result = translate('petition.alreadySigned', 'en');
      expect(result).toContain('already signed');
    });
  });
});

// Note: API Integration tests (requires running server + PostgreSQL)
// These tests validate middleware and HTTP-level language detection
// Run with: DATABASE_URL=postgresql://... npm test
// Commented out to allow unit tests to run without database
