const ELU_COORDS = {
  Montréal: { lat: 45.5017, lng: -73.5673 },
  Québec: { lat: 46.8139, lng: -71.208 },
  Toronto: { lat: 43.6629, lng: -79.3957 },
  Vancouver: { lat: 49.2827, lng: -123.1207 },
  Calgary: { lat: 51.0447, lng: -114.0719 },
  Ottawa: { lat: 45.4215, lng: -75.6972 },
};

const getEluCoordinates = (region) =>
  ELU_COORDS[region] || { lat: 45.5, lng: -73.5 };

export { getEluCoordinates };
