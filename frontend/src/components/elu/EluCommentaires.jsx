/**
 * EluCommentaires — Écran 9 de la fiche élu
 * Phase G.2 - Lot 15
 *
 * Commentaires / questions / signalements publiés + formulaire d'ajout.
 * Modération obligatoire avant publication (statut initial : en_attente).
 */

import { useState } from 'react';

const TYPE_LABELS = {
  commentaire: { label: 'Commentaire', color: 'bg-blue-100 text-blue-800' },
  question: { label: 'Question', color: 'bg-purple-100 text-purple-800' },
  signalement: { label: 'Signalement', color: 'bg-orange-100 text-orange-800' },
};

export function EluCommentaires({ comments, loading, error, onPost, isAuthenticated }) {
  const [type, setType] = useState('commentaire');
  const [contenu, setContenu] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (loading) return <div className="py-8 text-center text-gray-400">Chargement…</div>;
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>;

  const list = comments?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (contenu.trim().length < 1) {
      setFeedback({ type: 'error', text: 'Le commentaire ne peut pas être vide.' });
      return;
    }

    setSending(true);
    try {
      await onPost({ type, contenu });
      setContenu('');
      setFeedback({
        type: 'success',
        text: 'Envoyé. Votre contribution sera publiée après modération.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || "Échec de l'envoi." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulaire */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Donner votre avis, poser une question ou signaler
        </h3>

        {!isAuthenticated ? (
          <p className="text-sm text-gray-700">
            Vous devez être connecté pour contribuer.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded"
            >
              <option value="commentaire">💬 Commentaire</option>
              <option value="question">❓ Question</option>
              <option value="signalement">⚠️ Signalement</option>
            </select>
            <textarea
              placeholder="Votre contribution…"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              maxLength={5000}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {contenu.length} / 5000 caractères
              </span>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {sending ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
            {feedback && (
              <div
                className={`text-sm rounded p-2 border ${
                  feedback.type === 'success'
                    ? 'text-green-700 bg-green-50 border-green-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}
              >
                {feedback.text}
              </div>
            )}
          </form>
        )}
      </section>

      {/* Liste des commentaires publiés */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Contributions publiées
        </h3>

        {list.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Aucune contribution publiée pour l'instant.
          </p>
        ) : (
          <div className="space-y-3">
            {list.map((c) => {
              const t = TYPE_LABELS[c.type] || TYPE_LABELS.commentaire;
              return (
                <div key={c.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${t.color}`}>
                      {t.label}
                    </span>
                    <span className="text-sm text-gray-700">
                      {c.author?.username || 'Citoyen anonyme'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(c.created_at)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-900 whitespace-pre-line">
                    {c.contenu}
                  </p>

                  {c.reponse && (
                    <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 pl-3 py-2">
                      <div className="text-xs font-semibold text-blue-700 uppercase">
                        Réponse de l'équipe
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">
                        {c.reponse}
                      </p>
                      {c.reponse_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(c.reponse_at)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-CA', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return d;
  }
}

export default EluCommentaires;
