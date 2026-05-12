/**
 * Authentication Service
 * Gère JWT, magic links, et vérification d'identité
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getConfig } from '../config/env.js';

const config = getConfig();

/**
 * Génère un token JWT signé
 * @param {number} userId - ID de l'utilisateur
 * @returns {string} JWT token
 */
export function createJWT(userId) {
  if (!userId) {
    throw new Error('userId is required');
  }

  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });

  return token;
}

/**
 * Vérifie et décide un JWT
 * @param {string} token - JWT à vérifier
 * @returns {object|null} Payload décidé ou null si invalide
 */
export function verifyJWT(token) {
  if (!token) {
    return null;
  }

  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return decoded;
  } catch (err) {
    // Token invalide, expiré, ou autres erreurs JWT
    return null;
  }
}

/**
 * Génère un token magic link (aléatoire, 32 bytes)
 * @param {string} email - Email du citoyen
 * @param {string} lang - Langue (fr|en), défaut: fr
 * @returns {object} { token, expiresAt, magicLinkUrl }
 */
export function generateMagicLink(email, lang = 'fr') {
  if (!email) {
    throw new Error('email is required');
  }

  // Générer token aléatoire (32 bytes = 256 bits, format hex = 64 caractères)
  const token = crypto.randomBytes(32).toString('hex');

  // Expiration: 15 minutes
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // URL de vérification (utilise la langue fournie)
  const magicLinkUrl = `${config.FRONTEND_URL}/${lang}/verify?token=${token}`;

  return {
    token,
    expiresAt,
    magicLinkUrl,
  };
}

/**
 * Vérifie un magic link token
 * @param {string} token - Token magic link à vérifier
 * @param {object} tokenRecord - Enregistrement du token depuis la BD
 *   Structure: { token, email, expiresAt }
 * @returns {object|null} { email, userId } si valide, null sinon
 */
export function verifyMagicLink(token, tokenRecord) {
  if (!token || !tokenRecord) {
    return null;
  }

  // Vérifier que les tokens correspondent (case-sensitive, exact match)
  if (token !== tokenRecord.token) {
    return null;
  }

  // Vérifier l'expiration
  if (new Date() > new Date(tokenRecord.expiresAt)) {
    return null;
  }

  // Token valide, retourner les infos
  return {
    email: tokenRecord.email,
    userId: tokenRecord.userId,
  };
}

/**
 * Hash un email pour stockage sécurisé
 * Utilisé pour retrouver les tokens magic links
 * @param {string} email - Email à hasher
 * @returns {string} Hash SHA256 de l'email
 */
export function hashEmail(email) {
  return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
}

/**
 * Génère un code de vérification numérique court (6 chiffres)
 * Utilisé comme backup au magic link
 * @returns {string} Code numérique
 */
export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Export class pour compatibilité avec middleware existant
 */
export class AuthService {
  static createJWT(userId) {
    return createJWT(userId);
  }

  static verifyJWT(token) {
    return verifyJWT(token);
  }

  static generateMagicLink(email) {
    return generateMagicLink(email);
  }

  static verifyMagicLink(token, tokenRecord) {
    return verifyMagicLink(token, tokenRecord);
  }

  static hashEmail(email) {
    return hashEmail(email);
  }

  static generateVerificationCode() {
    return generateVerificationCode();
  }
}

export default AuthService;
