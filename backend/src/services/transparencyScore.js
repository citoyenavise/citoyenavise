/**
 * Service de calcul du score de transparence d'un élu
 * Phase G.2 - Lot 11 : refonte intégrant promesses + votes + complétude données
 *
 * Composantes du score global (sur 100) :
 *   - 50% : taux de promesses tenues (completees / total)
 *   - 25% : participation aux votes ((total - absent) / total)
 *   - 15% : alignement vs indépendance (info, non pondéré pénalisant)
 *   - 10% : complétude des sources (présence source_url sur promesses/votes/actions)
 */

/**
 * Accepte alias 'Promises' (legacy) ou 'promises' (nouveau)
 */
function extractPromises(elu) {
  return elu.Promises || elu.promises || [];
}

function extractVotes(elu) {
  return elu.Votes || elu.votes || [];
}

function extractActions(elu) {
  return elu.Actions || elu.actions || [];
}

/**
 * Score legacy (rétro-compatibilité)
 */
export const calculateTransparencyScore = (elu) => {
  const promises = extractPromises(elu);
  if (promises.length === 0) return 0;

  const completed = promises.filter((p) => p.status === 'completee').length;
  const abandoned = promises.filter((p) => p.status === 'abandonnee').length;

  const completionRate = (completed / promises.length) * 100;
  const keepRate = ((promises.length - abandoned) / promises.length) * 100;

  return Math.round(completionRate * 0.7 + keepRate * 0.3);
};

/**
 * Score détaillé — version Phase G.2
 * Intègre votes + complétude sources
 */
export const calculateDetailedTransparencyScore = (elu) => {
  const promises = extractPromises(elu);
  const votes = extractVotes(elu);
  const actions = extractActions(elu);

  // === Composante 1 : Promesses ===
  let completionRate = 0;
  let keepRate = 0;
  const completed = promises.filter((p) => p.status === 'completee').length;
  const inProgress = promises.filter((p) => p.status === 'en_cours').length;
  const abandoned = promises.filter((p) => p.status === 'abandonnee').length;
  const committed = promises.filter((p) => p.status === 'engagee').length;

  if (promises.length > 0) {
    completionRate = (completed / promises.length) * 100;
    keepRate = ((promises.length - abandoned) / promises.length) * 100;
  }
  const scorePromesses = completionRate * 0.7 + keepRate * 0.3;

  // === Composante 2 : Participation aux votes ===
  let participationRate = 0;
  let alignementRate = null;
  const totalVotes = votes.length;
  const votesAbsent = votes.filter((v) => v.position === 'absent').length;
  const votesAvecAlignement = votes.filter(
    (v) => v.alignementParti !== null && v.alignementParti !== undefined
  );

  if (totalVotes > 0) {
    participationRate = ((totalVotes - votesAbsent) / totalVotes) * 100;
  }
  if (votesAvecAlignement.length > 0) {
    const aligned = votesAvecAlignement.filter((v) => v.alignementParti).length;
    alignementRate = (aligned / votesAvecAlignement.length) * 100;
  }

  // === Composante 3 : Complétude des sources ===
  const totalEntities = promises.length + votes.length + actions.length;
  let sourcedCount = 0;
  if (totalEntities > 0) {
    sourcedCount += promises.filter((p) => p.sourceUrl || p.source_url).length;
    sourcedCount += votes.filter((v) => v.sourceUrl || v.source_url).length;
    sourcedCount += actions.filter((a) => a.sourceUrl || a.source_url).length;
  }
  const completudeSources =
    totalEntities > 0 ? (sourcedCount / totalEntities) * 100 : 0;

  // === Score global pondéré ===
  // Si aucune donnée du tout : score 0
  let overall = 0;
  if (promises.length > 0 || totalVotes > 0) {
    const pondPromesses = promises.length > 0 ? 0.5 : 0;
    const pondVotes = totalVotes > 0 ? 0.35 : 0;
    const pondSources = totalEntities > 0 ? 0.15 : 0;

    const sommePond = pondPromesses + pondVotes + pondSources;
    if (sommePond > 0) {
      overall =
        (scorePromesses * pondPromesses +
          participationRate * pondVotes +
          completudeSources * pondSources) /
        sommePond;
    }
  }

  return {
    overall: Math.round(overall),
    completionRate: Math.round(completionRate),
    keepRate: Math.round(keepRate),
    totalPromises: promises.length,
    completed,
    inProgress,
    abandoned,
    committed,

    // Votes
    totalVotes,
    participationRate: Math.round(participationRate),
    alignementRate: alignementRate !== null ? Math.round(alignementRate) : null,

    // Actions
    totalActions: actions.length,

    // Sources
    completudeSources: Math.round(completudeSources),
    sourcedCount,
    totalEntities,

    // Breakdown détaillé
    breakdown: {
      completionRate: Math.round(completionRate),
      keepRate: Math.round(keepRate),
      participationRate: Math.round(participationRate),
      alignementRate:
        alignementRate !== null ? Math.round(alignementRate) : null,
      completudeSources: Math.round(completudeSources),
    },
  };
};

export const getTransparencyRating = (score) => {
  if (score >= 80) return { rating: 'Excellent', color: '#10b981' };
  if (score >= 60) return { rating: 'Bon', color: '#3b82f6' };
  if (score >= 40) return { rating: 'Moyen', color: '#f59e0b' };
  if (score > 0) return { rating: 'Faible', color: '#ef4444' };
  return { rating: 'Indéterminé', color: '#9ca3af' };
};

export default {
  calculateTransparencyScore,
  calculateDetailedTransparencyScore,
  getTransparencyRating,
};
