import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';

export function PetitionsListPage() {
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadPetitions = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { limit, offset };
        if (searchQuery) {
          params.search = searchQuery;
        }
        const response = await api.petitions.list(params);
        setPetitions(response.data || []);
        setTotal(response.total || 0);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des pétitions');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPetitions();
  }, [limit, offset, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    setOffset(0);
    setSearchQuery(search);
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pétitions Publiques</h1>
        <p className="text-gray-600">
          {total} pétitions • Signez pour faire entendre votre voix
        </p>
      </div>

      <Card className="mb-8 p-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher une pétition..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="primary">Rechercher</Button>
        </form>
      </Card>

      {error && (
        <Card className="mb-6 bg-red-50 border border-red-200">
          <div className="text-red-700">
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {petitions.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchQuery ? 'Aucune pétition ne correspond à votre recherche' : 'Aucune pétition disponible'}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setSearchQuery('');
                setOffset(0);
              }}
              className="mt-4"
            >
              Effacer la recherche
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {petitions.map((petition) => (
            <Card key={petition.id} className="hover:shadow-md transition p-6">
              <Link to={`/petitions/${petition.id}`}>
                <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 mb-2">
                  {petition.titre}
                </h2>
              </Link>

              <p className="text-gray-700 mb-3 line-clamp-2">
                {petition.description}
              </p>

              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>📝 {petition.signaturesCount || 0} signatures</span>
                  {petition.deadline && (
                    <span>
                      📅{' '}
                      {new Date(petition.deadline).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                </div>
              </div>

              {petition.elu && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Adressée à{' '}
                    <Link
                      to={`/elus/${petition.elu.id}`}
                      className="font-semibold hover:underline"
                    >
                      {petition.elu.nom}
                    </Link>{' '}
                    • {petition.elu.titre}
                  </p>
                </div>
              )}

              <Link to={`/petitions/${petition.id}`}>
                <Button variant="primary" className="w-full">
                  Voir et signer
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            ← Précédent
          </Button>
          <span className="text-gray-600 text-sm">
            Pétitions {offset + 1}–{Math.min(offset + limit, total)} sur {total}
          </span>
          <Button
            variant="outline"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Suivant →
          </Button>
        </div>
      )}
    </div>
  );
}
