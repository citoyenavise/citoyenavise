/**
 * Email Service
 * Gère l'envoi d'emails (magic links, notifications, etc.)
 */

import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialiser le service email
   */
  async initialize() {
    try {
      // Configuration SMTP
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      // Vérifier connexion
      await this.transporter.verify();
      this.initialized = true;
      console.log('✅ Email service initialized');
    } catch (err) {
      console.error('❌ Email service initialization failed:', err.message);
      this.initialized = false;
    }
  }

  /**
   * Envoyer magic link
   */
  async sendMagicLink(email, token, baseUrl = 'https://citoyenavise.org') {
    if (!this.initialized) {
      throw new Error('Email service not initialized');
    }

    const magicLink = `${baseUrl}/auth/verify?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a5c8e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; background-color: #1a5c8e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Citoyen Avisé</h1>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Vous avez demandé un lien de connexion pour <strong>Citoyen Avisé</strong>.</p>
            <p>Cliquez le bouton ci-dessous pour vous connecter :</p>
            <center>
              <a href="${magicLink}" class="button">Me connecter</a>
            </center>
            <p>Ou copiez ce lien :</p>
            <p><code>${magicLink}</code></p>
            <p style="color: #999; font-size: 12px;">Ce lien est valide pendant 24 heures.</p>
            <hr>
            <p>Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email.</p>
          </div>
          <div class="footer">
            <p>© 2026 Citoyen Avisé — Plateforme civique canadienne</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
      Bonjour,

      Vous avez demandé un lien de connexion pour Citoyen Avisé.

      Visitez ce lien pour vous connecter :
      ${magicLink}

      Ce lien est valide pendant 24 heures.

      Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email.

      ---
      © 2026 Citoyen Avisé
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@citoyenavise.org',
        to: email,
        subject: '[Citoyen Avisé] Votre lien de connexion',
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ Magic link sent to ${email}`);
      return true;
    } catch (err) {
      console.error(`❌ Failed to send magic link to ${email}:`, err.message);
      throw err;
    }
  }

  /**
   * Envoyer email de bienvenue
   */
  async sendWelcomeEmail(email, nomComplet) {
    if (!this.initialized) {
      throw new Error('Email service not initialized');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a5c8e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue à Citoyen Avisé!</h1>
          </div>
          <div class="content">
            <p>Bonjour ${nomComplet || 'Citoyen'},</p>
            <p>Bienvenue sur <strong>Citoyen Avisé</strong>, la plateforme civique canadienne!</p>
            <p>Vous pouvez maintenant :</p>
            <ul>
              <li>Créer des pétitions adressées aux élus</li>
              <li>Signer les pétitions d'autres citoyens</li>
              <li>Découvrir vos représentants politiques</li>
              <li>Participer aux débats civiques</li>
            </ul>
            <p>Merci de contribuer à une démocratie plus participative!</p>
          </div>
          <div class="footer">
            <p>© 2026 Citoyen Avisé — Plateforme civique canadienne</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@citoyenavise.org',
        to: email,
        subject: 'Bienvenue à Citoyen Avisé!',
        html: htmlContent,
      });

      console.log(`✅ Welcome email sent to ${email}`);
      return true;
    } catch (err) {
      console.error(
        `❌ Failed to send welcome email to ${email}:`,
        err.message
      );
      throw err;
    }
  }

  /**
   * Envoyer notification de pétition créée
   */
  async sendPetitionNotification(eluEmail, petitionTitle, citoyenName) {
    if (!this.initialized) {
      throw new Error('Email service not initialized');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a5c8e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nouvelle pétition</h1>
          </div>
          <div class="content">
            <p>Une nouvelle pétition a été créée à votre intention :</p>
            <p><strong>${petitionTitle}</strong></p>
            <p>Créée par : <strong>${citoyenName}</strong></p>
            <p><a href="https://citoyenavise.org/petitions">Voir la pétition</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@citoyenavise.org',
        to: eluEmail,
        subject: `Nouvelle pétition : ${petitionTitle}`,
        html: htmlContent,
      });

      return true;
    } catch (err) {
      console.error('❌ Failed to send petition notification:', err.message);
      // Non-blocking error
      return false;
    }
  }

  /**
   * Relayer un message d'un citoyen à un élu
   * Phase G.2 - Lot 11 : formulaire de contact direct sur fiche élu
   *
   * @param {Object} elu - { nom, titre, email }
   * @param {Object} citoyen - { username, email }
   * @param {string} sujet
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  async relayToElu(elu, citoyen, sujet, message) {
    if (!this.initialized) {
      throw new Error('Email service not initialized');
    }

    if (!elu.email) {
      throw new Error("Cet élu n'a pas d'email public configuré");
    }

    const safeSubject = String(sujet || '').slice(0, 200);
    const safeMessage = String(message || '').slice(0, 5000);
    const safeCitoyenName = String(citoyen.username || 'Citoyen').slice(0, 80);
    const safeCitoyenEmail = String(citoyen.email || '').slice(0, 254);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a5c8e; color: white; padding: 18px; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .meta { font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 12px; margin-top: 20px; }
          .message { background: #fff; padding: 16px; border-left: 4px solid #1a5c8e; white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin:0;">Message citoyen via citoyenavise.org</h2>
          </div>
          <div class="content">
            <p><strong>Destinataire :</strong> ${elu.titre || ''} ${elu.nom}</p>
            <p><strong>De :</strong> ${safeCitoyenName} &lt;${safeCitoyenEmail}&gt;</p>
            <p><strong>Sujet :</strong> ${safeSubject}</p>
            <div class="message">${safeMessage.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            <div class="meta">
              Ce message vous est transmis par citoyenavise.org —
              plateforme civique canadienne de transparence.<br>
              Vous pouvez répondre directement à ce courriel ; votre réponse
              sera envoyée à l'expéditeur.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = [
      `Destinataire : ${elu.titre || ''} ${elu.nom}`,
      `De : ${safeCitoyenName} <${safeCitoyenEmail}>`,
      `Sujet : ${safeSubject}`,
      '',
      safeMessage,
      '',
      '---',
      'Transmis par citoyenavise.org',
    ].join('\n');

    try {
      const fromAddress =
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        'noreply@citoyenavise.org';

      await this.transporter.sendMail({
        from: `"Citoyen Avisé (relais)" <${fromAddress}>`,
        to: elu.email,
        replyTo: safeCitoyenEmail,
        subject: `[Citoyen Avisé] ${safeSubject}`,
        html: htmlContent,
        text: textContent,
      });

      return true;
    } catch (err) {
      console.error('❌ Failed to relay message to élu:', err.message);
      throw err;
    }
  }

  /**
   * Tester connexion SMTP
   */
  async testConnection() {
    if (!this.initialized) {
      return { ok: false, error: 'Email service not initialized' };
    }

    try {
      await this.transporter.verify();
      return { ok: true, message: 'SMTP connection successful' };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
}

// Export singleton
export const emailService = new EmailService();

// Auto-initialize on import
if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  emailService.initialize().catch((err) => {
    console.error('Failed to initialize email service:', err.message);
  });
}
