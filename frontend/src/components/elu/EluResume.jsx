/**
 * EluResume — Écran 2 de la fiche élu
 * Phase G.2 - Lot 15
 *
 * Bloc compact : 3 KPIs (% promesses tenues, participation votes, score transparence).
 */

export function EluResume({ summary }) {
  if (!summary) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="text-center text-gray-400 py-8">Chargement du résumé…</div>
      </div>
    );
  }

  const kpi = summary.kpi || {};
  const counts = summary.counts || {};
  const color = summary.color || '#6b7280';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Promesses tenues"
          value={kpi.pct_promesses_tenues}
          unit="%"
          subtitle={`${counts.promesses || 0} promesse(s) enregistrée(s)`}
          color="#10b981"
        />
        <KpiCard
          label="Participation aux votes"
          value={kpi.pct_participation_votes}
          unit="%"
          subtitle={`${counts.votes || 0} vote(s) recensé(s)`}
          color="#3b82f6"
        />
        <KpiCard
          label="Score de transparence"
          value={kpi.score_transparence_global}
          unit="/100"
          subtitle={summary.rating || 'Indéterminé'}
          color={color}
        />
      </div>

      {/* Phrase résumé */}
      {kpi.pct_promesses_tenues !== null && counts.promesses > 0 && (
        <p className="mt-4 text-sm text-gray-700 text-center">
          Cet élu respecte <strong>{kpi.pct_promesses_tenues}%</strong> de
          ses engagements et participe à <strong>{kpi.pct_participation_votes}%</strong>{' '}
          des votes parlementaires. Score global : <strong>{kpi.score_transparence_global}/100</strong>.
        </p>
      )}
    </div>
  );
}

function KpiCard({ label, value, unit, subtitle, color }) {
  const display = value === null || value === undefined ? '—' : value;
  return (
    <div
      className="rounded-lg border bg-white p-4 text-center"
      style={{ borderTopWidth: '3px', borderTopColor: color }}
    >
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-bold" style={{ color }}>
        {display}
        {value !== null && value !== undefined && (
          <span className="text-base text-gray-500">{unit}</span>
        )}
      </div>
      <div className="mt-1 text-xs text-gray-600">{subtitle}</div>
    </div>
  );
}

export default EluResume;
