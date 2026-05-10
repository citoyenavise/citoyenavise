export const calculateTransparencyScore = (elu) => {
  const promises = elu.Promises || [];

  if (promises.length === 0) return 0;

  const completed = promises.filter(p => p.status === 'completee').length;
  const abandoned = promises.filter(p => p.status === 'abandonnee').length;

  const completionRate = (completed / promises.length) * 100;
  const keepRate = ((promises.length - abandoned) / promises.length) * 100;

  const score = (completionRate * 0.7) + (keepRate * 0.3);

  return Math.round(score);
};

export const calculateDetailedTransparencyScore = (elu) => {
  const promises = elu.Promises || [];

  if (promises.length === 0) {
    return {
      overall: 0,
      completionRate: 0,
      keepRate: 0,
      totalPromises: 0,
      completed: 0,
      inProgress: 0,
      abandoned: 0,
      committed: 0
    };
  }

  const completed = promises.filter(p => p.status === 'completee').length;
  const inProgress = promises.filter(p => p.status === 'en_cours').length;
  const abandoned = promises.filter(p => p.status === 'abandonnee').length;
  const committed = promises.filter(p => p.status === 'engagee').length;

  const completionRate = (completed / promises.length) * 100;
  const keepRate = ((promises.length - abandoned) / promises.length) * 100;

  const overall = (completionRate * 0.7) + (keepRate * 0.3);

  return {
    overall: Math.round(overall),
    completionRate: Math.round(completionRate),
    keepRate: Math.round(keepRate),
    totalPromises: promises.length,
    completed,
    inProgress,
    abandoned,
    committed
  };
};

export const getTransparencyRating = (score) => {
  if (score >= 80) return { rating: 'Excellent', color: '#10b981' };
  if (score >= 60) return { rating: 'Bon', color: '#3b82f6' };
  if (score >= 40) return { rating: 'Moyen', color: '#f59e0b' };
  return { rating: 'Faible', color: '#ef4444' };
};
