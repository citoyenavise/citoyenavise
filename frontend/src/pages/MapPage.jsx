import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Loader } from '../components/ui/Loader';
import { Card } from '../components/ui/Card';
import Map from '../components/Map';
import NetworkSidebar from '../components/NetworkSidebar';
import '../styles/map.css';

/**
 * MapPage — Affiche élus et pétitions sur une carte centrée sur le pilote Québec.
 *
 * Décisions :
 * - Pilote géographique : Québec ville (décision §22, 2026-05-14).
 * - Source pétitions : géolocalisées sur la position de l'élu visé.
 * - Filtres : type (élus / pétitions / tous) + région (élus) + enjeu (pétitions, Lot 2).
 */

const TYPE_ALL = 'all';
const TYPE_ELUS = 'elus';
const TYPE_PETITIONS = 'petitions';

const ENJEU_ALL = 'all';
const ENJEUX = [
  { value: 'taxes', label: 'Taxes' },
  { value: 'logement', label: 'Logement' },
  { value: 'sante', label: 'Santé' },
  { value: 'elections', label: 'Élections' },
  { value: 'droits', label: 'Droits' },
  { value: 'environnement', label: 'Environnement' },
  { value: 'energie', label: 'Énergie' },
  { value: 'autre', label: 'Autre' },
];

export function MapPage() {
  const [eluMarkers, setEluMarkers] = useState([]);
  const [petitionMarkers, setPetitionMarkers] = useState([]);
  const [region, setRegion] = useState('all');
  const [regions, setRegions] = useState([]);
  const [typeFilter, setTypeFilter] = useState(TYPE_ALL);
  const [enjeuFilter, setEnjeuFilter] = useState(ENJEU_ALL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Chargement parallèle élus + pétitions
        const [elusResponse, petitionsResponse] = await Promise.all([
          api.elus.list(),
          api.petitions.list({ limit: 100 }),
        ]);

        // ── Élus ───────────────────────────────────────────────
        const elusData = Array.isArray(elusResponse)
          ? elusResponse
          : elusResponse?.data || elusResponse || [];

        const uniqueRegions = [
          ...new Set(elusData.map((e) => e.region).filter(Boolean)),
        ];
        setRegions(uniqueRegions.sort());

        const elusTyped = elusData
          .filter((elu) => elu.latitude != null && elu.longitude != null)
          .map((elu) => ({
            ...elu,
            type: 'elu',
          }));
        setEluMarkers(elusTyped);

        // ── Pétitions ──────────────────────────────────────────
        const petitionsData = Array.isArray(petitionsResponse)
          ? petitionsResponse
          : petitionsResponse?.data || petitionsResponse || [];

        // Décalage déterministe des pétitions autour de l'élu visé
        // pour éviter la superposition stricte (Lot 1.3).
        const PETITION_OFFSET = 0.0025;
        const petitionsTyped = petitionsData
          .map((p) => {
            const eluRef = p.elu || {};
            const baseLat = eluRef.latitude ?? p.latitude;
            const baseLng = eluRef.longitude ?? p.longitude;
            if (baseLat == null || baseLng == null) return null;

            const angle = ((p.id % 8) * 45 * Math.PI) / 180;
            const lat = baseLat + Math.cos(angle) * PETITION_OFFSET;
            const lng = baseLng + Math.sin(angle) * PETITION_OFFSET;

            return {
              id: p.id,
              titre: p.titre,
              signatures_count: p.signatures_count ?? p.signaturesCount ?? 0,
              enjeu: p.enjeu || null,
              latitude: lat,
              longitude: lng,
              type: 'petition',
            };
          })
          .filter((p) => p && p.latitude != null && p.longitude != null);
        setPetitionMarkers(petitionsTyped);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement de la carte');
        // eslint-disable-next-line no-console
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ── Filtres ────────────────────────────────────────────────
  const filteredElus = region === 'all'
    ? eluMarkers
    : eluMarkers.filter((elu) => elu.region === region);

  // Filtre enjeu sur les pétitions (Lot 2)
  const filteredPetitions = enjeuFilter === ENJEU_ALL
    ? petitionMarkers
    : petitionMarkers.filter((p) => p.enjeu === enjeuFilter);

  // Fusion selon le type sélectionné
  let displayedMarkers = [];
  if (typeFilter === TYPE_ALL) {
    displayedMarkers = [...filteredElus, ...filteredPetitions];
  } else if (typeFilter === TYPE_ELUS) {
    displayedMarkers = filteredElus;
  } else if (typeFilter === TYPE_PETITIONS) {
    displayedMarkers = filteredPetitions;
  }

  if (loading) return <Loader />;

  return (
    <div className="map-layout">
      {/* Sidebar gauche — Lot 3 (NetworkSidebar) */}
      <NetworkSidebar />

      {/* Zone principale — filtres + carte */}
      <div className="map-main">
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
          <div className="map-filter-group">
            <label className="map-filter-label">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value={TYPE_ALL}>Tous</option>
              <option value={TYPE_ELUS}>Élus</option>
              <option value={TYPE_PETITIONS}>Pétitions</option>
            </select>
          </div>

          <div className="map-filter-group">
            <label className="map-filter-label">Région (élus)</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={typeFilter === TYPE_PETITIONS}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
            >
              <option value="all">Toutes les régions</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <p className="map-counter">
            {displayedMarkers.length} marqueur{displayedMarkers.length > 1 ? 's' : ''}
            {' '}
            <span className="map-counter-detail">
              ({filteredElus.length} élu{filteredElus.length > 1 ? 's' : ''},
              {' '}
              {filteredPetitions.length} pétition{filteredPetitions.length > 1 ? 's' : ''})
            </span>
          </p>
        </div>

        {/* ────────── Pills enjeux (Lot 2) ────────── */}
        <div
          className={`map-enjeux ${typeFilter === TYPE_ELUS ? 'map-enjeux--disabled' : ''}`}
          aria-disabled={typeFilter === TYPE_ELUS}
        >
          <span className="map-enjeux-label">Enjeu&nbsp;:</span>
          <button
            type="button"
            className={`map-pill ${enjeuFilter === ENJEU_ALL ? 'map-pill--active' : ''}`}
            onClick={() => setEnjeuFilter(ENJEU_ALL)}
            disabled={typeFilter === TYPE_ELUS}
          >
            Tous
          </button>
          {ENJEUX.map((e) => (
            <button
              key={e.value}
              type="button"
              className={`map-pill ${enjeuFilter === e.value ? 'map-pill--active' : ''}`}
              onClick={() => setEnjeuFilter(e.value)}
              disabled={typeFilter === TYPE_ELUS}
            >
              {e.label}
            </button>
          ))}
        </div>

          <Map markers={displayedMarkers} />
        </div>
      </div>
    </div>
  );
}

export default MapPage;
