import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import Map from '../components/Map';
import '../styles/map.css';

const MapPage = () => {
  const { t } = useTranslation();
  const [elus, setElus] = useState([]);
  const [region, setRegion] = useState('all');
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    fetch('/api/v1/elus')
      .then((r) => r.json())
      .then((data) => {
        const uniqueRegions = [...new Set(data.map((e) => e.region))];
        setRegions(uniqueRegions);

        const markers = data.map((elu) => ({
          id: elu.id,
          name: elu.nom,
          lat: elu.latitude,
          lng: elu.longitude,
          titre: elu.titre,
          region: elu.region,
        }));
        setElus(markers);
      });
  }, []);

  const filteredElus = region === 'all'
    ? elus
    : elus.filter((elu) => elu.region === region);

  return (
    <div className="map-container">
      <div className="map-filters">
        <select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="all">Toutes régions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <p>{t('elus.title')} - {filteredElus.length} résultats</p>
      </div>
      <Map markers={filteredElus} />
    </div>
  );
};

export default MapPage;
