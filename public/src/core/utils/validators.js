/**
 * Validators - Validation de données
 */

module.exports = {
  /**
   * Valider un email
   */
  email: (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  /**
   * Valider un mot de passe
   */
  password: (value) => {
    // Min 8 chars, une majuscule, un chiffre
    return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
  },

  /**
   * Valider un username
   */
  username: (value) => {
    return /^[a-zA-Z0-9_]{3,50}$/.test(value);
  },

  /**
   * Valider une URL
   */
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Valider un téléphone
   */
  phone: (value) => {
    return /^[\d\s\-\+\(\)]{10,}$/.test(value);
  },

  /**
   * Valider un code postal
   */
  postal: (value) => {
    return /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(value);
  },

  /**
   * Valider un objet contre un schéma
   */
  validate(data, schema) {
    const errors = {};

    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];

      for (const rule of Array.isArray(rules) ? rules : [rules]) {
        if (typeof rule === 'function' && !rule(value)) {
          errors[key] = `Validation échouée pour ${key}`;
        } else if (rule === 'required' && !value) {
          errors[key] = `${key} est requis`;
        } else if (rule === 'email' && !module.exports.email(value)) {
          errors[key] = 'Email invalide';
        } else if (rule === 'password' && !module.exports.password(value)) {
          errors[key] = 'Mot de passe trop faible';
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  },
};
