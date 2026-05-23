/**
 * EluActions — Écran 4 de la fiche élu
 * Phase G.2 - Lot 15
 *
 * Timeline des actions concrètes (lois, projets, décisions, déclarations).
 */

const TYPE_LABELS = {
  loi: { label: 'Loi', icon: '⚖️', color: 'bg-purple-100 text-purple-800' },
  projet_loi: { label: 'Projet de loi', icon: '📜', color: 'bg-indigo-100 text-indigo-800' },
  motion: { label: 'Motion', icon: '✋', color: 'bg-blue-100 text-blue-800' },
  vote: { label: 'Vote', icon: '🗳️', color: 'bg-cyan-100 text-cyan-800' },
  decision: { label: 'Décision', icon: '⚡', color: 'bg-yellow-100 text-yellow-800' },
  declaration: { label: 'Déclaration', icon: '🎤', color: 'bg-orange-100 text-orange-800' },
  intervention: { label: 'Intervention', icon: '💬', color: 'bg-pink-100 text-pink-800' },
  communique: { label: 'Communiqué', icon: '📰', color: 'bg-gray-100 text-gray-800' },
  autre: { label: 'Autre', icon: '•', color: 'bg-gray-100 text-gray-800' },
};

export function EluActions({ actions, loading, error }) {
  if (loading) return <div className="py-8 text-center text-gray-400">Chargement…</div>;
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>;

  const list = actions?.data || [];

  if (list.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        Aucune action enregistrée pour cet élu.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-600 mb-3">
        {list.length} action{list.length > 1 ? 's' : ''}
      </div>

      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200" />
        {list.map((a) => {
          const t = TYPE_LABELS[a.type] || TYPE_LABELS.autre;
          return (
            <div key={a.id} className="relative pl-12 pb-4">
              <div
                className={`absolute left-2 top-1 w-4 h-4 rounded-full ring-4 ring-white ${t.color}`}
              />
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${t.color}`}>
                    {t.icon} {t.label}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(a.date)}</span>
                </div>
                <h4 className="mt-1 font-semibold text-gray-900">{a.titre}</h4>
                {a.description && (
                  <p className="mt-1 text-sm text-gray-700">{a.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {a.promise_id && (
                    <span className="text-purple-700">↳ liée à une promesse</span>
                  )}
                  {a.source_url && (
                    <a
                      href={a.source_url}
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
          );
        })}
      </div>
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

export default EluActions;
