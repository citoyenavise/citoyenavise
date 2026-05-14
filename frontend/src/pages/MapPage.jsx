import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Loader } from '../components/ui/Loader';
import { Card } from '../components/ui/Card';
import Map from '../components/Map';
import '../styles/map.css';

export function MapPage() {
  const [elus, setElus] = useState([]);
  const [region, setRegion] = useState('all');
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadElus = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.elus.list();
        const data = Array.isArray(response) ? response : response.data || [];

        const uniqueRegions = [...new Set(data.map((e) => e.region).filter(Boolean))];
        setRegions(uniqueRegions.sort());

        // On passe les élus tels quels — Map.jsx lit marker.nom, marker.latitude, marker.longitude.
        // On filtre seulement ceux qui ont des coordonnées valides.
        const markers = data.filter((elu) => elu.latitude != null && elu.longitude != null);
        setElus(markers);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement de la carte');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadElus();
  }, []);

  const filteredElus = region === 'all'
    ? elus
    : elus.filter((elu) => elu.region === region);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div className="max-w-4xl mx-auto p-4">
          <Card className="bg-red-50 border border-red-200">
            <div className="text-red-700">
              <p className="font-semibold">Erreur</p>
              <p className="text-sm">{error}</p>
            </div>
          </Card>
        </div>
      )}

      <div className="map-container">
        <div className="map-filters">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les régions</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <p className="text-gray-600">
            {filteredElus.length} élus
          </p>
        </div>
        <Map markers={filteredElus} />
      </div>
    </div>
  );
}

export default MapPage;
