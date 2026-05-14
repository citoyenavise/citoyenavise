import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';

export function ElusPage() {
  const { lang } = useParams();
  const [elus, setElus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadElus = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { limit, offset };
        if (searchQuery) {
          params.search = searchQuery;
        }
        const response = await api.elus.list(params);
        const data = Array.isArray(response) ? response : (response?.data || []);
        setElus(data);
        setTotal(response?.total || response?.count || data.length);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des élus');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadElus();
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
        <h1 className="text-4xl font-bold mb-2">Élus du Canada</h1>
        <p className="text-gray-600">
          {total} élus • Suivez les promesses électorales
        </p>
      </div>

      <Card className="mb-8 p-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Rechercher un élu..."
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

      {elus.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {searchQuery ? 'Aucun élu ne correspond à votre recherche' : 'Aucun élu disponible'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {elus.map((elu) => (
            <Card key={elu.id} className="hover:shadow-md transition p-6">
              <Link to={`/${lang}/elus/${elu.id}`}>
                <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 mb-2">
                  {elu.nom || 'N/A'}
                </h2>
              </Link>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <span>📍 {elu.region || 'N/A'}</span>
                <span>🏛️ {elu.niveau || 'N/A'}</span>
              </div>
              <Link to={`/${lang}/elus/${elu.id}`}>
                <Button variant="primary" className="w-full">
                  Voir le profil
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
            Élus {offset + 1}–{Math.min(offset + limit, total)} sur {total}
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

export default ElusPage;
