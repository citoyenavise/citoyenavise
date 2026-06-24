import { NavLink } from 'react-router-dom';
import BasculeTheme from './BasculeTheme';
import './NavHaut.css';

const ELEMENTS_NAV = [
  { to: '/droits-libertes', label: 'Droits & libertés' },
  { to: '/gouvernement', label: 'Gouvernement' },
  { to: '/elus', label: 'Élus' },
  { to: '/elections', label: 'Élections' },
  { to: '/services', label: 'Services' },
  { to: '/participer', label: 'Participer' },
  { to: '/ressources', label: 'Ressources' },
  { to: '/territoire', label: 'Territoire' },
];

export default function NavHaut() {
  return (
    <header className="nav-haut">
      <div className="nav-haut-conteneur">
        <NavLink
          to="/"
          className="nav-haut-logo"
          aria-label="Accueil — Citoyen Avisé"
        >
          <span className="nav-haut-logo-texte">CITOYEN AVISÉ</span>
        </NavLink>

        <nav className="nav-haut-principal" aria-label="Navigation principale">
          <ul className="nav-haut-liste">
            {ELEMENTS_NAV.map(({ to, label }) => (
              <li key={to} className="nav-haut-item">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `nav-haut-lien${isActive ? ' nav-haut-lien-actif' : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-haut-actions">
          <BasculeTheme />
        </div>
      </div>
    </header>
  );
}
