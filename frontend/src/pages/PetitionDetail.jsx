import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const PetitionDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const [petition, setPetition] = useState(null);
  const [hasSigned, setHasSigned] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/v1/petitions/${id}`)
      .then((r) => r.json())
      .then(setPetition);

    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(setUser);
    }
  }, [id]);

  const handleSign = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/v1/petitions/${id}/sign`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      setHasSigned(true);
      alert(t('petitions.signed'));
    } else if (response.status === 409) {
      alert(t('petitions.alreadySigned'));
    }
  };

  if (!petition) return <div>{t('actualites.loading')}</div>;

  return (
    <div>
      <h1>{petition.titre}</h1>
      <p>{petition.description}</p>
      <p>{t('petitions.createdBy')} : {petition.creator?.nom}</p>
      <p>{t('petitions.targetElu')} : {petition.elu?.nom}</p>
      <p>{t('petitions.totalSignatures', { count: petition.signatures_count })}</p>

      {user && !hasSigned && (
        <button onClick={handleSign}>{t('petitions.sign')}</button>
      )}

      {hasSigned && (
        <button onClick={handleSign}>{t('petitions.unsign')}</button>
      )}

      {!user && (
        <p>{t('auth.login')}</p>
      )}
    </div>
  );
};

export default PetitionDetail;
