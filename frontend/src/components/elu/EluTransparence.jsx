/**
 * EluTransparence — Écran 6 de la fiche élu
 * Phase G.2 - Lot 15
 *
 * Bloc Transparence/Intégrité : controverses, enquêtes, sanctions, corrections.
 * Ton : neutre, factuel, sourcé.
 */

const TYPE_LABELS = {
  scandale: 'Scandale',
  enquete: 'Enquête',
  sanction: 'Sanction',
  correction: 'Correction',
  allegation: 'Allégation',
  condamnation: 'Condamnation',
  rappel_ethique: 'Rappel éthique',
  autre: 'Autre',
};

const STATUT_BADGES = {
  en_cours: { label: 'En cours', color: 'bg-yellow-100 text-yellow-800' },
  cloturee: { label: 'Clôturée', color: 'bg-gray-100 text-gray-700' },
  rejetee: { label: 'Rejetée', color: 'bg-green-100 text-green-800' },
  confirmee: { label: 'Confirmée', color: 'bg-red-100 text-red-800' },
  non_lieu: { label: 'Non-lieu', color: 'bg-blue-100 text-blue-800' },
};

const GRAVITE_BORDURE = {
  mineure: 'border-yellow-300',
  moderee: 'border-orange-400',
  majeure: 'border-red-500',
};

export function EluTransparence({ controverses, loading, error }) {
  if (loading) return <div className="py-8 text-center text-gray-400">Chargement…</div>;
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>;

  const list = controverses?.data || [];

  if (list.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        Aucune controverse, enquête ou sanction enregistrée à ce jour.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Ce bloc présente des faits sourcés. Les données sont validées par modération
        avant publication.
      </p>

      {list.map((c) => {
        const s = STATUT_BADGES[c.statut] || STATUT_BADGES.en_cours;
        const bordure = GRAVITE_BORDURE[c.gravite] || 'border-gray-300';

        return (
          <div
            key={c.id}
            className={`border-l-4 ${bordure} bg-white rounded-r-lg p-4 shadow-sm`}
          >
            <div className="flex items-start gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-800">
                {TYPE_LABELS[c.type] || c.type}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${s.color}`}>
                {s.label}
              </span>
              {c.gravite && (
                <span className="text-xs text-gray-500">gravité {c.gravite}</span>
              )}
              <span className="text-xs text-gray-500 ml-auto">
                {formatDate(c.date_debut)}
                {c.date_fin && ` → ${formatDate(c.date_fin)}`}
              </span>
            </div>

            <h3 className="mt-2 font-semibold text-gray-900">{c.titre}</h3>
            {c.description && (
              <p className="mt-1 text-sm text-gray-700">{c.description}</p>
            )}
            {c.position_officielle && (
              <div className="mt-2 bg-gray-50 border-l-2 border-gray-300 pl-3 py-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">
                  Position officielle de l'élu
                </div>
                <p className="text-sm text-gray-700 italic">{c.position_officielle}</p>
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {c.source_url && (
                <a
                  href={c.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  🔗 Source principale{c.source ? ` (${c.source})` : ''}
                </a>
              )}
              {c.sources_complementaires && c.sources_complementaires.length > 0 && (
                <span className="text-gray-500">
                  + {c.sources_complementaires.length} source(s) complémentaire(s)
                </span>
              )}
            </div>

            {c.sources_complementaires && c.sources_complementaires.length > 0 && (
              <ul className="mt-2 ml-4 list-disc text-xs text-gray-600 space-y-0.5">
                {c.sources_complementaires.map((s, i) => (
                  <li key={i}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {s.label || s.url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
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

export default EluTransparence;
