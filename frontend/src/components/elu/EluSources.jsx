/**
 * EluSources — Écran 10 de la fiche élu
 * Phase G.2 - Lot 15
 *
 * Agrégat de toutes les sources rattachées à la fiche élu.
 * Vue de transparence totale.
 */

export function EluSources({ elu, promises, actions, votes, controverses, financement }) {
  const sources = collectSources({ elu, promises, actions, votes, controverses, financement });

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">
        Toutes les données affichées sont rattachées à une source publique vérifiable.
        Cliquez sur chaque lien pour consulter l'origine.
      </p>

      <div className="space-y-3">
        {sources.length === 0 ? (
          <p className="text-sm text-gray-500 italic">Aucune source enregistrée.</p>
        ) : (
          sources.map((s, i) => (
            <div key={i} className="border border-gray-200 rounded p-3 bg-white text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 uppercase">
                  {s.bloc}
                </span>
                <span className="text-gray-900">{s.titre}</span>
                {s.date && (
                  <span className="text-xs text-gray-500">{formatDate(s.date)}</span>
                )}
              </div>
              {s.url && (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 text-xs text-blue-600 hover:underline break-all"
                >
                  🔗 {s.url}
                </a>
              )}
              {s.label && !s.url && (
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-6 text-xs text-gray-500">
        {sources.length} source(s) au total.
      </div>
    </div>
  );
}

function collectSources({ elu, promises, actions, votes, controverses, financement }) {
  const out = [];

  if (elu?.source_url) {
    out.push({ bloc: 'Identité', titre: elu.nom, url: elu.source_url, date: elu.source_derniere_maj });
  }

  (promises?.data || []).forEach((p) => {
    if (p.source_url) {
      out.push({ bloc: 'Promesse', titre: p.titre, url: p.source_url, date: p.date_promesse, label: p.source });
    }
  });

  (actions?.data || []).forEach((a) => {
    if (a.source_url) {
      out.push({ bloc: 'Action', titre: a.titre, url: a.source_url, date: a.date, label: a.source });
    }
  });

  (votes?.data || []).forEach((v) => {
    if (v.source_url) {
      out.push({ bloc: 'Vote', titre: v.loi_titre, url: v.source_url, date: v.date, label: v.source });
    }
  });

  (controverses?.data || []).forEach((c) => {
    if (c.source_url) {
      out.push({ bloc: 'Controverse', titre: c.titre, url: c.source_url, date: c.date_debut, label: c.source });
    }
    (c.sources_complementaires || []).forEach((sc) => {
      out.push({ bloc: 'Controverse (compl.)', titre: c.titre, url: sc.url, label: sc.label });
    });
  });

  (financement?.donateurs?.data || []).forEach((d) => {
    if (d.source_url) {
      out.push({ bloc: 'Donateur', titre: d.nom, url: d.source_url, date: d.date, label: d.source });
    }
  });

  (financement?.liens_interets?.data || []).forEach((l) => {
    if (l.source_url) {
      out.push({ bloc: 'Lien d\'intérêt', titre: l.entite, url: l.source_url, date: l.date_debut, label: l.source });
    }
  });

  return out;
}

function formatDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-CA');
  } catch {
    return d;
  }
}

export default EluSources;
