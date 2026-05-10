/**
 * Auth Service
 * Gère l'authentification par magic link
 */

import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { User, EmailVerification } from '../models/User.js';
import { emailService } from './EmailService.js';
import { pool } from '../database.js';

export class AuthService {
  /**
   * Générer token magique (random string)
   */
  static generateMagicToken() {
    return randomBytes(32).toString('hex');
  }

  /**
   * Générer JWT (pour la session utilisateur)
   */
  static generateJWT(userId, email) {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token valide 7 jours
    );
  }

  /**
   * Vérifier JWT
   */
  static verifyJWT(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  /**
   * ÉTAPE 1 : Demander magic link (register ou login)
   * POST /api/v1/auth/request-login { email }
   */
  static async requestLogin(email) {
    // Trouver ou créer utilisateur
    let user = await User.findByEmail(email);

    if (!user) {
      // Si nouvel utilisateur, créer un compte basique
      user = await User.create(
        email,
        null, // nom_complet sera complété plus tard
        null, // province
        null  // code_postal
      );
    }

    // Générer token magique
    const magicToken = this.generateMagicToken();

    // Sauvegarder token en base (24h d'expiration)
    const verification = await EmailVerification.create(
      user.id,
      email,
      magicToken,
      'magic_link',
      null // pas de OTP
    );

    // Envoyer email avec magic link
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    await emailService.sendMagicLink(email, magicToken, baseUrl);

    return {
      success: true,
      message: 'Email de connexion envoyé. Vérifiez votre boîte email.',
      userId: user.id,
      email: user.email
    };
  }

  /**
   * ÉTAPE 2 : Vérifier magic link et créer session
   * GET /api/v1/auth/verify?token=xyz
   */
  static async verifyMagicLink(magicToken) {
    // Trouver le token en base
    const verification = await EmailVerification.findByToken(magicToken);

    if (!verification) {
      throw new Error('Magic link invalide ou expiré');
    }

    // Récupérer l'utilisateur
    const user = await User.findById(verification.user_id);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Marquer email comme vérifié
    await User.markVerified(user.id);

    // Marquer token comme utilisé
    await EmailVerification.markAsUsed(verification.id);

    // Générer JWT
    const token = this.generateJWT(user.id, user.email);

    // Logger le login
    // (optionnel, pour audit trail)

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        nom_complet: user.nom_complet,
        verified_at: user.verified_at
      }
    };
  }

  /**
   * Compléter profil après vérification
   * POST /api/v1/auth/complete-profile
   */
  static async completeProfile(userId, data) {
    const { nomComplet, province, codePostal } = data;

    if (!nomComplet) {
      throw new Error('nom_complet est requis');
    }

    const updated = await User.update(userId, {
      nom_complet: nomComplet,
      province,
      code_postal: codePostal
    });

    if (!updated) {
      throw new Error('Failed to update profile');
    }

    // Envoyer email de bienvenue
    await emailService.sendWelcomeEmail(updated.email, nomComplet).catch(() => {
      // Non-blocking error
    });

    return {
      success: true,
      user: updated
    };
  }

  /**
   * Obtenir utilisateur actuel (via JWT)
   * GET /api/v1/auth/me
   */
  static async getCurrentUser(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      email: user.email,
      nom_complet: user.nom_complet,
      province: user.province,
      code_postal: user.code_postal,
      created_at: user.created_at,
      verified_at: user.verified_at
    };
  }

  /**
   * Tester et nettoyer tokens expirés
   */
  static async cleanupExpiredTokens() {
    await EmailVerification.cleanupExpired();
  }
}
