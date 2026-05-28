import { Outlet } from 'react-router-dom';
import NavHaut from './NavHaut';
import PiedDePage from './PiedDePage';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <NavHaut />
      <main className="layout-main" id="contenu-principal">
        <Outlet />
      </main>
      <PiedDePage />
    </div>
  );
}
