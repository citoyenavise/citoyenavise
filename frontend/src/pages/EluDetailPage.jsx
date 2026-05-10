import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';

export function EluDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [elu, setElu] = useState(null);
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [eluResponse, petitionsResponse] = await Promise.all([
          api.elus.get(id),
          api.elus.getPetitions(id),
        ]);
        setElu(eluResponse.data);
        setPetitions(petitionsResponse.data || []);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) return <Loader />;

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="bg-red-50 border border-red-200">
          <div className="text-red-700">
            <p className="font-semibold mb-2">Erreur</p>
            <p className="text-sm mb-4">{error}</p>
            <Button variant="outline" onClick={() => navigate('/elus')}>
              ← Retour aux élus
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!elu) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="text-center py-12">
          <p className="text-gray-500">Élu non trouvé</p>
          <Button variant="outline" onClick={() => navigate('/elus')} className="mt-4">
            ← Retour aux élus
          </Button>
        </Card>
      </div>
    );
  }

  const niveauLabels = {
    fédéral: '🇨🇦 Fédéral',
    provincial: '🏛️ Provincial',
    municipal: '🏙️ Municipal',
  };

  const niveauColors = {
    fédéral: 'bg-blue-100 text-blue-900',
    provincial: 'bg-green-100 text-green-900',
    municipal: 'bg-purple-100 text-purple-900',
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => navigate('/elus')} className="mb-6">
        ← Retour aux élus
      </Button>

      <Card className="mb-6">
        <div className="border-b pb-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{elu.nom}</h1>
              <p className="text-lg text-gray-600 mt-1">{elu.titre}</p>
            </div>
            <span className={`inline-block px-4 py-2 rounded-lg font-semibold ${niveauColors[elu.niveau] || 'bg-gray-100'}`}>
              {niveauLabels[elu.niveau] || elu.niveau}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Région</p>
              <p className="text-lg font-semibold text-gray-900">{elu.region}</p>
            </div>
            {elu.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <a
                  href={`mailto:${elu.email}`}
                  className="text-lg font-semibold text-blue-600 hover:underline"
                >
                  {elu.email}
                </a>
              </div>
            )}
          </div>

          {elu.siteWeb && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Site web</p>
              <a
                href={elu.siteWeb}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-blue-600 hover:underline"
              >
                {elu.siteWeb}
              </a>
            </div>
          )}
        </div>

        {elu.photoUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={elu.photoUrl}
              alt={elu.nom}
              className="w-48 h-48 rounded-lg object-cover"
            />
          </div>
        )}
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Pétitions ({petitions.length})
        </h2>

        {petitions.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">Aucune pétition pour cet élu</p>
            <Link to="/elus" className="text-blue-600 hover:underline mt-2 inline-block">
              Voir d'autres élus
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {petitions.map((petition) => (
              <Card key={petition.id} className="hover:shadow-md transition">
                <Link to={`/petitions/${petition.id}`}>
                  <h3 className="font-semibold text-lg text-gray-900 hover:text-blue-600">
                    {petition.titre}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                  {petition.description}
                </p>
                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                  <span>📝 {petition.signaturesCount || 0} signatures</span>
                  <span>Status: {petition.status}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
