import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

const ElusPage = () => {
  const { t } = useTranslation();
  const [elus, setElus] = useState([]);

  useEffect(() => {
    fetch('/api/v1/elus')
      .then((r) => r.json())
      .then(setElus);
  }, []);

  return (
    <div>
      <h1>{t('header.nav.elus')}</h1>
      <table>
        <thead>
          <tr>
            <th>{t('elus.title')}</th>
            <th>{t('elus.region')}</th>
            <th>{t('elus.level')}</th>
            <th>{t('elus.promises')}</th>
            <th>{t('elus.transparency')}</th>
          </tr>
        </thead>
        <tbody>
          {elus.map((elu) => (
            <tr key={elu.id}>
              <td>{elu.nom}</td>
              <td>{elu.region}</td>
              <td>{elu.niveau}</td>
              <td><a href={`/elus/${elu.id}`}>{t('elus.promises')}</a></td>
              <td><a href={'/transparence/ranking'}>{t('header.nav.transparence')}</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ElusPage;
