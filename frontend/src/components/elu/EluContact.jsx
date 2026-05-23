/**
 * EluContact — Écran 8 de la fiche élu
 * Phase G.2 - Lot 15
 *
 * Coordonnées officielles + formulaire de contact direct (relais email).
 */

import { useState } from 'react';

export function EluContact({ elu, onSend, isAuthenticated }) {
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!elu) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (sujet.length < 3) {
      setError('Le sujet doit faire au moins 3 caractères.');
      return;
    }
    if (message.length < 10) {
      setError('Le message doit faire au moins 10 caractères.');
      return;
    }

    setSending(true);
    try {
      await onSend({ sujet, message });
      setSuccess(true);
      setSujet('');
      setMessage('');
    } catch (err) {
      setError(err.message || "Échec de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  const reseaux = elu.reseaux_sociaux || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Coordonnées */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Coordonnées</h3>
        <div className="space-y-2 text-sm">
          {elu.email && (
            <a
              href={`mailto:${elu.email}`}
              className="flex items-start gap-2 text-gray-700 hover:text-blue-700"
            >
              <span>📧</span>
              <span className="break-all">{elu.email}</span>
            </a>
          )}
          {elu.telephone && (
            <div className="flex items-start gap-2 text-gray-700">
              <span>📞</span>
              <span>{elu.telephone}</span>
            </div>
          )}
          {elu.adresse_bureau && (
            <div className="flex items-start gap-2 text-gray-700">
              <span>🏛️</span>
              <span className="whitespace-pre-line">{elu.adresse_bureau}</span>
            </div>
          )}
          {elu.site_web && (
            <a
              href={elu.site_web}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-gray-700 hover:text-blue-700"
            >
              <span>🌐</span>
              <span className="break-all">{elu.site_web}</span>
            </a>
          )}

          {/* Réseaux sociaux */}
          {Object.keys(reseaux).length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Réseaux sociaux
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(reseaux).map(([nom, url]) => (
                  <a
                    key={nom}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm capitalize"
                  >
                    {nom}
                  </a>
                ))}
              </div>
            </div>
          )}

          {!elu.email && !elu.telephone && !elu.adresse_bureau && (
            <p className="text-gray-500 italic">
              Aucune coordonnée publique enregistrée pour cet élu.
            </p>
          )}
        </div>
      </section>

      {/* Formulaire de contact */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Contacter directement
        </h3>

        {!elu.email ? (
          <p className="text-sm text-gray-500 italic">
            Cet élu n'a pas d'email public configuré — le contact direct n'est pas possible.
          </p>
        ) : !isAuthenticated ? (
          <p className="text-sm text-gray-700">
            Vous devez être connecté pour envoyer un message à cet élu.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Sujet"
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <textarea
              placeholder="Votre message…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {message.length} / 5000 caractères
              </span>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
            {success && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
                Message transmis. L'élu recevra votre message à son email officiel.
              </div>
            )}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Limite : 3 messages par heure. Votre adresse email sera transmise comme expéditeur.
            </p>
          </form>
        )}
      </section>
    </div>
  );
}

export default EluContact;
