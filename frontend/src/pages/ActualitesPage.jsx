import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

const ActualitesPage = () => {
  const { t } = useTranslation();
  const [actualites, setActualites] = useState([]);

  useEffect(() => {
    fetch('/api/v1/actualites?status=published')
      .then((r) => r.json())
      .then(setActualites);
  }, []);

  return (
    <div>
      <h1>{t('header.nav.actualites')}</h1>
      <button>{t('actualites.publish')}</button>

      <div className="actualites-list">
        {actualites.map((actualite) => (
          <div key={actualite.id} className="actualite-card">
            <h3>{actualite.titre}</h3>
            <p>{actualite.contenu}</p>
            <small>{new Date(actualite.published_at).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActualitesPage;
