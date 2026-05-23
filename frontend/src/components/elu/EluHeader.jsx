/**
 * EluHeader — Écran 1 de la fiche élu
 * Phase G.2 - Lot 15
 *
 * Header zone critique : photo, nom, parti, poste, niveau, circonscription,
 * boutons d'action (Suivre, Contacter, Voir promesses).
 */

import { useState } from 'react';

const PARTI_COULEURS = {
  'Parti libéral du Canada': '#d71920',
  'Parti conservateur du Canada': '#0e2c52',
  'Bloc québécois': '#3389e0',
  'Nouveau Parti démocratique': '#f37021',
  'Parti vert': '#3d9b35',
  'Indépendant': '#6b7280',
  'Groupe des sénateurs indépendants': '#7c3aed',
  'Groupe des sénateurs canadiens': '#0891b2',
  'Groupe progressiste du Sénat': '#16a34a',
};

const STATUT_BADGES = {
  actif: { label: 'Actif', color: 'bg-green-100 text-green-800' },
  sortant: { label: 'Sortant', color: 'bg-orange-100 text-orange-800' },
  ancien: { label: 'Ancien', color: 'bg-gray-100 text-gray-700' },
  decede: { label: 'Décédé', color: 'bg-gray-900 text-white' },
  candidat: { label: 'Candidat', color: 'bg-blue-100 text-blue-800' },
};

export function EluHeader({ elu, followStatus, onFollow, onUnfollow, onContact, onShowPromesses }) {
  const [loading, setLoading] = useState(false);

  if (!elu) return null;

  const couleur = PARTI_COULEURS[elu.parti_politique] || '#6b7280';
  const statut = STATUT_BADGES[elu.statut] || STATUT_BADGES.actif;
  const followed = followStatus?.followed || false;

  const handleFollow = async () => {
    setLoading(true);
    try {
      if (followed) await onUnfollow();
      else await onFollow();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {elu.photo_url ? (
              <img
                src={elu.photo_url}
                alt={elu.nom}
                className="w-32 h-32 md:w-40 md:h-40 rounded-lg object-cover bg-gray-100"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-4xl text-gray-400">
                  {(elu.nom || '?').charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Identité */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {elu.nom}
              </h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statut.color}`}>
                {statut.label}
              </span>
            </div>

            <div className="mt-2 text-gray-700">
              <span className="font-semibold">{elu.titre || elu.poste}</span>
              {elu.niveau && (
                <span className="text-gray-500"> • niveau {elu.niveau}</span>
              )}
            </div>

            {elu.parti_politique && (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: couleur }}
                />
                <span className="text-sm font-medium" style={{ color: couleur }}>
                  {elu.parti_politique}
                </span>
              </div>
            )}

            {elu.region && (
              <div className="mt-1 text-sm text-gray-600">
                📍 {elu.region}
                {elu.circonscription?.nom && ` — ${elu.circonscription.nom}`}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleFollow}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition ${
                  followed
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                {followed ? '✓ Suivi' : '+ Suivre'}
              </button>
              <button
                onClick={onContact}
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-white border border-gray-300 hover:bg-gray-50"
              >
                Contacter
              </button>
              <button
                onClick={onShowPromesses}
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-white border border-gray-300 hover:bg-gray-50"
              >
                Voir promesses
              </button>
              {followStatus?.total_followers !== undefined && (
                <span className="ml-auto text-sm text-gray-500 self-center">
                  {followStatus.total_followers} abonné{followStatus.total_followers > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EluHeader;
