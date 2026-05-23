/**
 * EluPromesses — Écran 3 de la fiche élu
 * Phase G.2 - Lot 15
 *
 * Liste des promesses avec statut, date, source cliquable.
 */

const STATUT_LABELS = {
  engagee: { label: 'Engagée', color: 'bg-yellow-100 text-yellow-800' },
  en_cours: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
  completee: { label: 'Tenue', color: 'bg-green-100 text-green-800' },
  abandonnee: { label: 'Abandonnée', color: 'bg-red-100 text-red-800' },
};

export function EluPromesses({ promises, loading, error }) {
  if (loading) return <div className="py-8 text-center text-gray-400">Chargement…</div>;
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>;

  const list = promises?.data || [];

  if (list.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        Aucune promesse enregistrée pour cet élu.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        {list.length} promesse{list.length > 1 ? 's' : ''}
      </div>

      {list.map((p) => {
        const s = STATUT_LABELS[p.status] || STATUT_LABELS.engagee;
        return (
          <div key={p.id} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex items-start gap-3">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${s.color}`}>
                {s.label}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{p.titre}</h3>
                {p.description && (
                  <p className="mt-1 text-sm text-gray-700">{p.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                  {p.date_promesse && <span>📅 {formatDate(p.date_promesse)}</span>}
                  {p.deadline && <span>🎯 échéance {formatDate(p.deadline)}</span>}
                  {p.contexte && <span>📋 {p.contexte}</span>}
                  {p.source_url && (
                    <a
                      href={p.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      🔗 Source{p.source ? ` : ${p.source}` : ''}
                    </a>
                  )}
                </div>
              </div>
            </div>
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

export default EluPromesses;
