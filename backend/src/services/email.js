/**
 * Email Service
 * Gère l'envoi d'emails (magic link, notifications, etc.)
 */

import nodemailer from 'nodemailer';
import { getConfig } from '../config/env.js';

const config = getConfig();

// Créer un transporteur SMTP
let transporter = null;

/**
 * Initialiser le transporteur email
 * Configuration: variables d'env SMTP_*
 */
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  // En développement, utiliser un service de test
  if (config.NODE_ENV === 'development') {
    // nodemailer.createTestAccount() peut être utilisé pour les tests
    // Pour maintenant, retourner un transporter fake
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('📧 [DEV] Email would be sent:', {
          to: mailOptions.to,
          subject: mailOptions.subject,
        });
        return { messageId: `dev-${Date.now()}` };
      },
    };
  } else {
    // Production: utiliser SMTP réel
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  return transporter;
}

/**
 * Envoyer email magic link
 * @param {string} email - Adresse email
 * @param {string} magicLinkUrl - URL complète du magic link
 * @returns {Promise<object>} Résultat de l'envoi
 */
export async function sendMagicLinkEmail(email, magicLinkUrl) {
  if (!email || !magicLinkUrl) {
    throw new Error('Email et magicLinkUrl sont requis');
  }

  const transporter = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@citoyenavise.org',
    to: email,
    subject: '🔐 Votre lien de connexion - Citoyen Avisé',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenue sur Citoyen Avisé!</h2>

        <p>Vous avez demandé un lien de connexion sécurisé.</p>

        <p style="margin: 30px 0;">
          <a href="${magicLinkUrl}"
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            ✓ Se connecter
          </a>
        </p>

        <p style="color: #666; font-size: 12px;">
          <strong>Ou copiez ce lien dans votre navigateur:</strong><br/>
          ${magicLinkUrl}
        </p>

        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Ce lien expire dans <strong>15 minutes</strong>.<br/>
          Si vous n'avez pas demandé ce lien, ignorez simplement cet email.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

        <p style="color: #999; font-size: 11px;">
          © 2026 Citoyen Avisé - Plateforme de participation citoyenne<br/>
          <a href="https://citoyenavise.org" style="color: #007bff;">citoyenavise.org</a>
        </p>
      </div>
    `,
    text: `
Bienvenue sur Citoyen Avisé!

Vous avez demandé un lien de connexion sécurisé.

Cliquez ici pour vous connecter:
${magicLinkUrl}

Ce lien expire dans 15 minutes.

Si vous n'avez pas demandé ce lien, ignorez simplement cet email.

---
© 2026 Citoyen Avisé
https://citoyenavise.org
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error('Email envoi erreur:', err);
    throw new Error(`Impossible d'envoyer l'email: ${err.message}`);
  }
}

/**
 * Envoyer email de bienvenue
 * @param {string} email - Adresse email
 * @param {string} nomComplet - Nom complet de l'utilisateur
 */
export async function sendWelcomeEmail(email, nomComplet = null) {
  const transporter = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@citoyenavise.org',
    to: email,
    subject: '👋 Bienvenue à Citoyen Avisé!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenue${nomComplet ? `, ${nomComplet}` : ''}!</h2>

        <p>Votre compte a été créé avec succès sur <strong>Citoyen Avisé</strong>.</p>

        <p>Vous pouvez maintenant:</p>
        <ul>
          <li>Créer et signer des pétitions citoyennes</li>
          <li>Suivre les engagements de vos élus</li>
          <li>Partager vos idées avec la communauté</li>
          <li>Participer aux débats civiques</li>
        </ul>

        <p style="margin-top: 30px;">
          <a href="${config.FRONTEND_URL}"
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            → Accéder à la plateforme
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

        <p style="color: #999; font-size: 11px;">
          © 2026 Citoyen Avisé<br/>
          <a href="https://citoyenavise.org" style="color: #28a745;">citoyenavise.org</a>
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error('Email envoi erreur:', err);
    throw new Error(`Impossible d'envoyer l'email: ${err.message}`);
  }
}

/**
 * Test email (utile pour développement)
 * @param {string} email - Adresse email test
 */
export async function sendTestEmail(email) {
  const transporter = getTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@citoyenavise.org',
    to: email,
    subject: '🧪 Email de test - Citoyen Avisé',
    text: "Cet email confirme que le service d'email fonctionne correctement.",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    throw new Error(`Impossible d'envoyer l'email test: ${err.message}`);
  }
}

export default {
  sendMagicLinkEmail,
  sendWelcomeEmail,
  sendTestEmail,
};
