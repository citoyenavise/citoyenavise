import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

const PetitionsPage = () => {
  const { t } = useTranslation();
  const [petitions, setPetitions] = useState([]);
  const [status, setStatus] = useState('published');

  useEffect(() => {
    fetch(`/api/v1/petitions?status=${status}`)
      .then((r) => r.json())
      .then((data) => setPetitions(data));
  }, [status]);

  return (
    <div>
      <h1>{t('header.nav.petitions')}</h1>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="published">{t('actualites.published')}</option>
        <option value="draft">{t('actualites.draft')}</option>
      </select>

      <button>{t('petitions.create')}</button>

      <div className="petitions-list">
        {petitions.map((petition) => (
          <div key={petition.id} className="petition-card">
            <h3>{petition.titre}</h3>
            <p>{petition.description}</p>
            <p>{t('petitions.totalSignatures', { count: petition.signatures_count })}</p>
            <a href={`/petitions/${petition.id}`}>{t('petitions.sign')}</a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PetitionsPage;
