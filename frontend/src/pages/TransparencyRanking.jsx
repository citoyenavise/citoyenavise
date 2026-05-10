import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const TransparencyRanking = () => {
  const { t } = useTranslation();
  const [elus, setElus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('transparency');

  useEffect(() => {
    const fetchElus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/elus?sort=transparency&order=desc');
        if (!response.ok) throw new Error('Failed to fetch elus');
        const data = await response.json();
        setElus(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchElus();
  }, []);

  const handleSort = (field) => {
    setSortBy(field);
    const sorted = [...elus].sort((a, b) => {
      if (field === 'transparency') {
        return (b.transparencyIndex || 0) - (a.transparencyIndex || 0);
      }
      if (field === 'promises') {
        return (b.promisesCount || 0) - (a.promisesCount || 0);
      }
      return 0;
    });
    setElus(sorted);
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        {t('common.loading')}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>
        {t('common.error')} : {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>{t('elus.transparency')}</h1>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ marginRight: '1rem' }}>
          {t('common.sortBy')} :
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
          >
            <option value="transparency">{t('elus.transparency')}</option>
            <option value="promises">{t('elus.promises')}</option>
          </select>
        </label>
      </div>

      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '1rem',
      }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd', backgroundColor: '#f9f9f9' }}>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Rang</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Nom</th>
            <th style={{ padding: '1rem', textAlign: 'left' }}>Titre</th>
            <th style={{ padding: '1rem', textAlign: 'center' }}>
              {t('elus.transparency')}
            </th>
            <th style={{ padding: '1rem', textAlign: 'center' }}>
              {t('elus.promises')}
            </th>
          </tr>
        </thead>
        <tbody>
          {elus.map((elu, index) => (
            <tr
              key={elu.id}
              style={{
                borderBottom: '1px solid #eee',
                backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
              }}
            >
              <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                {index + 1}
              </td>
              <td style={{ padding: '1rem' }}>
                {elu.firstName} {elu.lastName}
              </td>
              <td style={{ padding: '1rem' }}>
                {elu.title}
              </td>
              <td style={{ padding: '1rem', textAlign: 'center' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    borderRadius: '4px',
                    backgroundColor: elu.transparencyIndex > 70 ? '#4CAF50' : '#FF9800',
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                >
                  {Math.round(elu.transparencyIndex || 0)}
                  %
                </span>
              </td>
              <td style={{ padding: '1rem', textAlign: 'center' }}>
                {elu.promisesCount || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {elus.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
          {t('petitions.noFound')}
        </div>
      )}
    </div>
  );
};

export default TransparencyRanking;
