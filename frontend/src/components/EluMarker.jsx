import { Marker, Popup } from 'react-leaflet';
import { useParams } from 'react-router-dom';
import L from 'leaflet';
import './EluMarker.css';

const EluMarker = ({ elu }) => {
  const { lang } = useParams();
  const eluUrl = `/${lang || 'fr'}/elus/${elu.id}`;

  return (
    <Marker position={[elu.lat, elu.lng]}>
      <Popup>
        <div className="elu-popup">
          <h3>{elu.name}</h3>
          <p className="titre">{elu.titre}</p>
          <p className="region">{elu.region}</p>
          <a href={eluUrl} className="btn-detail">
            Voir profil complet
          </a>
        </div>
      </Popup>
    </Marker>
  );
};

export default EluMarker;
