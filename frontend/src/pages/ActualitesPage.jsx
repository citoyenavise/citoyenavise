import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';

export function ActualitesPage() {
  const { lang } = useParams();
  const [actualites, setActualites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadActualites = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.actualites.list({ status: 'published' });
        setActualites(Array.isArray(response) ? response : response.data || []);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des actualités');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadActualites();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Fil d'actualité</h1>
        <p className="text-gray-600">
          {actualites.length} actualité{actualites.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <Card className="mb-6 bg-red-50 border border-red-200">
          <div className="text-red-700">
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {actualites.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 text-lg">
            Aucune actualité disponible pour le moment
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {actualites.map((actualite) => (
            <Card key={actualite.id} className="hover:shadow-md transition p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {actualite.titre || 'N/A'}
              </h2>
              <p className="text-gray-600 mb-4">
                {actualite.contenu || 'N/A'}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  {actualite.published_at
                    ? new Date(actualite.published_at).toLocaleDateString('fr-FR')
                    : 'Date inconnue'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActualitesPage;
