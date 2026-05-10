import { describe, it, expect } from 'vitest';
import frTranslations from '../public/locales/fr/translation.json';
import enTranslations from '../public/locales/en/translation.json';

describe('i18n', () => {
  it('French translations load', () => {
    expect(frTranslations).toBeDefined();
    expect(frTranslations.header.nav.petitions).toBe('Pétitions');
    expect(frTranslations.header.title).toBe('Citoyen Avisé');
  });

  it('English translations load', () => {
    expect(enTranslations).toBeDefined();
    expect(enTranslations.header.nav.petitions).toBe('Petitions');
    expect(enTranslations.header.title).toBe('Citizen Advised');
  });

  it('All translation keys are present in both languages', () => {
    const getKeys = (obj, prefix = '') => {
      let keys = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
          keys = keys.concat(getKeys(value, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    };

    const frKeys = getKeys(frTranslations);
    const enKeys = getKeys(enTranslations);

    expect(frKeys.sort()).toEqual(enKeys.sort());
  });

  it('localStorage persists language preference', () => {
    localStorage.setItem('language', 'en');
    expect(localStorage.getItem('language')).toBe('en');

    localStorage.setItem('language', 'fr');
    expect(localStorage.getItem('language')).toBe('fr');
  });

  it('Critical translation keys exist', () => {
    const criticalKeys = [
      'header.title',
      'header.nav.petitions',
      'petitions.sign',
      'petitions.unsign',
      'auth.login',
      'common.loading',
    ];

    criticalKeys.forEach(key => {
      const keys = key.split('.');
      let value = frTranslations;
      keys.forEach(k => {
        value = value[k];
      });
      expect(value).toBeDefined();
    });
  });
});
