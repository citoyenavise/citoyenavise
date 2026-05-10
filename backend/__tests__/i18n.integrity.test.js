/**
 * i18n Integrity Tests
 * Verifies that translation files have consistent keys across languages
 * and that no critical translations are missing
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '../../frontend');
const localesDir = path.join(frontendDir, 'public/locales');

// Helper to ensure locales directory exists
function ensureLocalesDir() {
  if (!fs.existsSync(localesDir)) {
    fs.mkdirSync(path.join(localesDir, 'fr'), { recursive: true });
    fs.mkdirSync(path.join(localesDir, 'en'), { recursive: true });
  }
}

// Helper to flatten nested translation objects
function flattenTranslations(obj, prefix = '') {
  let result = {};
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      result = { ...result, ...flattenTranslations(value, newKey) };
    } else if (typeof value === 'string') {
      result[newKey] = value;
    }
  }
  return result;
}

let frenchTranslations;
let englishTranslations;
let frenchFlat;
let englishFlat;

describe('i18n Integrity - Translation File Consistency', () => {
  beforeAll(() => {
    ensureLocalesDir();

    const frPath = path.join(localesDir, 'fr/translation.json');
    const enPath = path.join(localesDir, 'en/translation.json');

    // Load French translations
    if (fs.existsSync(frPath)) {
      const frContent = fs.readFileSync(frPath, 'utf-8');
      frenchTranslations = JSON.parse(frContent);
    } else {
      throw new Error(`French translation file not found at ${frPath}`);
    }

    // Load English translations
    if (fs.existsSync(enPath)) {
      const enContent = fs.readFileSync(enPath, 'utf-8');
      englishTranslations = JSON.parse(enContent);
    } else {
      throw new Error(`English translation file not found at ${enPath}`);
    }

    // Flatten for easier key comparison
    frenchFlat = flattenTranslations(frenchTranslations);
    englishFlat = flattenTranslations(englishTranslations);
  });

  it('should load French translations', () => {
    expect(frenchTranslations).toBeDefined();
    expect(Object.keys(frenchTranslations).length).toBeGreaterThan(0);
  });

  it('should load English translations', () => {
    expect(englishTranslations).toBeDefined();
    expect(Object.keys(englishTranslations).length).toBeGreaterThan(0);
  });

  it('should have same keys in both French and English', () => {
    const frenchKeys = Object.keys(frenchFlat).sort();
    const englishKeys = Object.keys(englishFlat).sort();

    const missingInEnglish = frenchKeys.filter((k) => !englishKeys.includes(k));
    const missingInFrench = englishKeys.filter((k) => !frenchKeys.includes(k));

    if (missingInEnglish.length > 0) {
      console.warn(`Missing in English: ${missingInEnglish.join(', ')}`);
    }
    if (missingInFrench.length > 0) {
      console.warn(`Missing in French: ${missingInFrench.join(', ')}`);
    }

    expect(missingInEnglish).toEqual([]);
    expect(missingInFrench).toEqual([]);
  });

  it('should not have empty translation values', () => {
    const frenchEmpty = Object.entries(frenchFlat)
      .filter(
        ([key, value]) =>
          !value || (typeof value === 'string' && value.trim() === '')
      )
      .map(([key]) => key);

    const englishEmpty = Object.entries(englishFlat)
      .filter(
        ([key, value]) =>
          !value || (typeof value === 'string' && value.trim() === '')
      )
      .map(([key]) => key);

    if (frenchEmpty.length > 0) {
      console.warn(`Empty French translations: ${frenchEmpty.join(', ')}`);
    }
    if (englishEmpty.length > 0) {
      console.warn(`Empty English translations: ${englishEmpty.join(', ')}`);
    }

    expect(frenchEmpty.length).toBe(0);
    expect(englishEmpty.length).toBe(0);
  });

  it('should have proper translation file format (JSON)', () => {
    const frPath = path.join(localesDir, 'fr/translation.json');
    const enPath = path.join(localesDir, 'en/translation.json');

    expect(() => JSON.parse(fs.readFileSync(frPath, 'utf-8'))).not.toThrow();
    expect(() => JSON.parse(fs.readFileSync(enPath, 'utf-8'))).not.toThrow();
  });

  it('should have critical keys in both languages', () => {
    const criticalKeys = [
      'header.title',
      'auth.login',
      'petitions.title',
      'errors.notFound',
      'common.loading',
    ];

    criticalKeys.forEach((key) => {
      expect(frenchFlat[key]).toBeDefined();
      expect(englishFlat[key]).toBeDefined();
    });
  });

  it('should have translation coverage above minimum', () => {
    const frenchCount = Object.keys(frenchFlat).length;
    const englishCount = Object.keys(englishFlat).length;

    // Both should have at least 20 translations
    expect(frenchCount).toBeGreaterThanOrEqual(20);
    expect(englishCount).toBeGreaterThanOrEqual(20);
  });
});
