/**
 * EluFinancement — Écran 7 de la fiche élu
 * Phase G.2 - Lot 15
 *
 * Donateurs + liens d'intérêts + conflits déclarés.
 */

const LIEN_TYPE = {
  directorat: 'Directorat',
  actionnariat: 'Actionnariat',
  emploi: 'Emploi',
  consultation: 'Consultation',
  lobby: 'Lobby',
  beneficiaire: 'Bénéficiaire',
  famille: 'Famille',
  association: 'Association',
  autre: 'Autre',
};

export function EluFinancement({ financement, loading, error }) {
  if (loading) return <div className="py-8 text-center text-gray-400">Chargement…</div>;
  if (error) return <div className="py-8 text-center text-red-600">{error}</div>;

  const donateurs = financement?.donateurs || { count: 0, data: [], total_dons: 0, repartition: {} };
  const liens = financement?.liens_interets || { count: 0, data: [] };

  return (
    <div className="space-y-6">
      {/* Donateurs */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Financement déclaré
        </h3>

        {donateurs.count === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Aucun donateur déclaré dans nos sources.
          </p>
        ) : (
          <>
            <div className="bg-gray-50 rounded-lg p-3 mb-3 text-sm">
              <div>
                <strong>{donateurs.count}</strong> contribution(s) recensée(s)
              </div>
              <div>
                Total déclaré : <strong>{formatMontant(donateurs.total_dons)}</strong>
              </div>
            </div>

            <div className="space-y-2">
              {donateurs.data.slice(0, 50).map((d) => (
                <div
                  key={d.id}
                  className="flex justify-between items-start border border-gray-200 rounded p-3 bg-white"
                >
                  <div>
                    <div className="font-semibold text-gray-900">{d.nom}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {d.type_donateur}
                      {d.campagne && ` — ${d.campagne}`}
                    </div>
                    {d.source_url && (
                      <a
                        href={d.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        🔗 Source
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {d.montant ? formatMontant(d.montant) : '—'}
                    </div>
                    <div className="text-xs text-gray-500">{formatDate(d.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Liens d'intérêts */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Liens d'intérêts
        </h3>

        {liens.count === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Aucun lien d'intérêt déclaré dans nos sources.
          </p>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-2">
              {liens.count} lien(s) — {liens.actuels} actuel(s) — {liens.declares_officiellement} déclaré(s) officiellement
            </div>
            <div className="space-y-2">
              {liens.data.map((l) => (
                <div
                  key={l.id}
                  className={`border rounded p-3 bg-white ${
                    l.actuel ? 'border-orange-300' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-800">
                      {LIEN_TYPE[l.type] || l.type}
                    </span>
                    {l.actuel && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-orange-100 text-orange-800">
                        Actuel
                      </span>
                    )}
                    {l.declare_officiellement && (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                        ✓ Déclaré
                      </span>
                    )}
                  </div>
                  <div className="mt-1 font-semibold text-gray-900">{l.entite}</div>
                  {l.role && <div className="text-sm text-gray-700">{l.role}</div>}
                  {l.secteur && (
                    <div className="text-xs text-gray-500">Secteur : {l.secteur}</div>
                  )}
                  {l.description && (
                    <p className="mt-1 text-sm text-gray-700">{l.description}</p>
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    {l.date_debut && `Depuis ${formatDate(l.date_debut)}`}
                    {l.date_fin && ` — jusqu'à ${formatDate(l.date_fin)}`}
                    {l.source_url && (
                      <a
                        href={l.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        🔗 Source
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function formatMontant(m) {
  if (m === null || m === undefined) return '—';
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(m);
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-CA');
  } catch {
    return d;
  }
}

export default EluFinancement;
