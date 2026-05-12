import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';

export function EluDetail() {
  const { lang, id } = useParams();
  const [elu, setElu] = useState(null);
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEluDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const eluResponse = await api.elus.get(id);
        setElu(eluResponse);

        try {
          const commitmentsResponse = await api.commitments.byElu(id);
          setCommitments(Array.isArray(commitmentsResponse) ? commitmentsResponse : []);
        } catch (err) {
          console.error('Erreur lors du chargement des engagements:', err);
          setCommitments([]);
        }
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement de l\'élu');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEluDetail();
  }, [id]);

  if (loading) return <Loader />;

  if (!elu) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="text-center py-12">
          <p className="text-gray-500 text-lg">Élu non trouvé</p>
          <Link to={`/${lang}/elus`} className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Retour aux élus
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link to={`/${lang}/elus`} className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
        ← Retour aux élus
      </Link>

      {error && (
        <Card className="mb-6 bg-red-50 border border-red-200">
          <div className="text-red-700">
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      <Card className="mb-6 p-6">
        <h1 className="text-4xl font-bold mb-2">{elu.nom || 'N/A'}</h1>
        <p className="text-gray-600 mb-4">{elu.titre || 'N/A'}</p>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-500">Région</p>
            <p className="font-semibold">{elu.region || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Niveau</p>
            <p className="font-semibold">{elu.niveau || 'N/A'}</p>
          </div>
        </div>

        <Link to={`/${lang}/transparence/ranking`}>
          <Button variant="outline" className="w-full">
            Voir le classement de transparence
          </Button>
        </Link>
      </Card>

      {commitments.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Engagements</h2>
          <div className="space-y-4">
            {commitments.map((commitment) => (
              <Card key={commitment.id} className="p-4">
                <h3 className="font-bold mb-2">{commitment.titre || 'N/A'}</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{commitment.description || 'N/A'}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    commitment.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : commitment.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {commitment.status || 'unknown'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EluDetail;
