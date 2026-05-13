/**
 * Utilitaires de sérialisation - Convertir camelCase → snake_case
 */

const camelToSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Convertir un objet de camelCase à snake_case (récursif)
 */
export const toSnakeCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }

  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = camelToSnakeCase(key);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {});
  }

  return obj;
};

export default toSnakeCase;
