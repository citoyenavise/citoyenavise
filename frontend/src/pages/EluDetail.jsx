import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const EluDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [elu, setElu] = useState(null);
  const [promises, setPromises] = useState([]);

  useEffect(() => {
    fetch(`/api/v1/elus/${id}`)
      .then((r) => r.json())
      .then(setElu);

    fetch(`/api/v1/elus/${id}/promises`)
      .then((r) => r.json())
      .then(setPromises);
  }, [id]);

  if (!elu) return <div>{t('actualites.loading')}</div>;

  return (
    <div>
      <h1>{elu.nom}</h1>
      <p>{elu.titre}</p>
      <p>{t('elus.region')} : {elu.region}</p>
      <p>{t('elus.level')} : {elu.niveau}</p>

      <h2>{t('elus.promises')}</h2>
      <ul>
        {promises.map((promise) => (
          <li key={promise.id}>
            {promise.titre} - {promise.status}
          </li>
        ))}
      </ul>

      <a href={'/transparence/ranking'}>{t('header.nav.transparence')}</a>
    </div>
  );
};

export default EluDetail;
