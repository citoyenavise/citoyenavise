/**
 * EluVotes — Écran 5 de la fiche élu
 * Phase G.2 - Lot 15
 *
 * Liste filtrable des votes parlementaires.
 */

import { useState } from 'react';

const POSITION_BADGES = {
  pour: { label: 'Pour', color: 'bg-green-100 text-green-800' },
  contre: { label: 'Contre', color: 'bg-red-100 text-red-800' },
  abstention: { label: 'Abstention', color: 'bg-yellow-100 text-yellow-800' },
  absent: { label: 'Absent', color: 'bg-gray-100 text-gray-700' },
  paire: { label: 'Pairé', color: 'bg-blue-100 text-blue-800' },
};

export function EluVotes({ votes, loading, error, onFilter }) {
  const [position, setPosition] = useState('');
  const [cle, setCle] = useState(false);

  if (loading) return <div className="py-8 text-center text-gray-400">Chargement…</div>;
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>;

  const list = votes?.data || [];
  const stats = votes?.stats || {};

  const apply = () => {
    onFilter({
      position: position || undefined,
      cle: cle ? 'true' : undefined,
    });
  };

  return (
    <div>
      {/* Stats agrégées */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 text-center text-sm">
        <Stat label="Total" value={stats.total} />
        <Stat label="Pour" value={stats.pour} color="text-green-700" />
        <Stat label="Contre" value={stats.contre} color="text-red-700" />
        <Stat label="Abstention" value={stats.abstention} color="text-yellow-700" />
        <Stat label="Absent" value={stats.absent} color="text-gray-700" />
      </div>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap gap-2 items-center text-sm">
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1"
        >
          <option value="">Toutes positions</option>
          <option value="pour">Pour</option>
          <option value="contre">Contre</option>
          <option value="abstention">Abstention</option>
          <option value="absent">Absent</option>
          <option value="paire">Pairé</option>
        </select>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={cle}
            onChange={(e) => setCle(e.target.checked)}
          />
          Votes clés uniquement
        </label>
        <button
          onClick={apply}
          className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
        >
          Appliquer
        </button>
      </div>

      {/* Liste */}
      {list.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          Aucun vote enregistré pour ce filtre.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((v) => {
            const p = POSITION_BADGES[v.position] || POSITION_BADGES.absent;
            return (
              <div key={v.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="flex items-start gap-3 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${p.color}`}>
                    {p.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {v.loi_titre}
                    </h4>
                    {v.loi_reference && (
                      <span className="text-xs text-gray-500">{v.loi_reference}</span>
                    )}
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>{formatDate(v.date)}</span>
                      {v.enjeu && <span>📋 {v.enjeu}</span>}
                      {v.alignement_parti !== null && v.alignement_parti !== undefined && (
                        <span className={v.alignement_parti ? 'text-gray-500' : 'text-orange-600 font-semibold'}>
                          {v.alignement_parti ? '✓ aligné parti' : '⚠ divergent du parti'}
                        </span>
                      )}
                      {v.est_vote_cle && (
                        <span className="text-purple-700">⭐ vote clé</span>
                      )}
                      {v.source_url && (
                        <a
                          href={v.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          🔗 Source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="bg-white border border-gray-200 rounded p-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value ?? '—'}</div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-CA');
  } catch {
    return d;
  }
}

export default EluVotes;
