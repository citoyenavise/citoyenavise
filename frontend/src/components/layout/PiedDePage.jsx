import { NavLink } from 'react-router-dom';
import './PiedDePage.css';

const ELEMENTS_PIED = [
  { to: '/a-propos', label: 'À propos' },
  { to: '/aide', label: 'Aide' },
  { to: '/legal', label: 'Légal' },
];

export default function PiedDePage() {
  const annee = new Date().getFullYear();

  return (
    <footer className="pied-de-page">
      <div className="pied-de-page-conteneur">
        <nav className="pied-de-page-nav" aria-label="Navigation secondaire">
          <ul className="pied-de-page-liste">
            {ELEMENTS_PIED.map(({ to, label }) => (
              <li key={to}>
                <NavLink to={to} className="pied-de-page-lien">
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <p className="pied-de-page-mention">
          Citoyen Avisé · Plateforme civique canadienne ·
          Sans publicité, sans partisanerie · © {annee}
        </p>
      </div>
    </footer>
  );
}
