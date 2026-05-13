import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Loader } from '../components/ui/Loader';
import { Card } from '../components/ui/Card';

export function TransparencyRanking() {
  const [elus, setElus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('transparency');

  useEffect(() => {
    const fetchElus = async () => {
      try {
        setLoading(true);
        const response = await api.elus.list({ sort: 'transparency', order: 'desc' });
        const data = Array.isArray(response) ? response : response.data || [];
        setElus(data);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement du classement');
        console.error('Erreur:', err);
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
        return (b.transparency?.overall || 0) - (a.transparency?.overall || 0);
      }
      if (field === 'commitments') {
        return (b.commitments_count || 0) - (a.commitments_count || 0);
      }
      return 0;
    });
    setElus(sorted);
  };

  if (loading) return <Loader />;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Classement de transparence</h1>
        <p className="text-gray-600">Consultez la transparence et les engagements des élus du Canada</p>
      </div>

      {error && (
        <Card className="mb-6 bg-red-50 border border-red-200">
          <div className="text-red-700">
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      <Card className="mb-6 p-4">
        <label className="flex items-center gap-2">
          <span className="font-medium">Trier par :</span>
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="transparency">Transparence</option>
            <option value="commitments">Engagements</option>
          </select>
        </label>
      </Card>

      {elus.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun élu disponible</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold">Rang</th>
                <th className="px-4 py-3 text-left font-semibold">Nom</th>
                <th className="px-4 py-3 text-left font-semibold">Titre</th>
                <th className="px-4 py-3 text-center font-semibold">Transparence</th>
                <th className="px-4 py-3 text-center font-semibold">Engagements</th>
              </tr>
            </thead>
            <tbody>
              {elus.map((elu, index) => (
                <tr
                  key={elu.id}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-bold">{index + 1}</td>
                  <td className="px-4 py-3">{elu.nom || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">{elu.titre || 'N/A'}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded font-semibold text-white ${
                        (elu.transparency?.overall || 0) > 70
                          ? 'bg-green-500'
                          : (elu.transparency?.overall || 0) > 40
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {Math.round(elu.transparency?.overall || 0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">
                    {elu.commitments_count || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TransparencyRanking;
