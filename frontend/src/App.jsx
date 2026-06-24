import React, { Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BrowserRouter, Routes, Route, Navigate, useLocation,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Accueil from './pages/Accueil';
import CentreControle from './pages/CentreControle';
import RouteHub from './pages/editorial/RouteHub';
import RouteEditoriale from './pages/editorial/RouteEditoriale';
import RouteAutoDispatch from './pages/editorial/RouteAutoDispatch';

// Pages transactionnelles existantes (code-splitted)
const PetitionsListPage = React.lazy(() => import('./pages/PetitionsListPage'));
const PetitionDetail = React.lazy(() => import('./pages/PetitionDetail'));
const ElusPage = React.lazy(() => import('./pages/ElusPage'));
const EluDetail = React.lazy(() => import('./pages/EluDetail'));
const ActualitesPage = React.lazy(() => import('./pages/ActualitesPage'));
const CreatePetitionPage = React.lazy(() => import('./pages/CreatePetitionPage'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const TransparencyRanking = React.lazy(() => import('./pages/TransparencyRanking'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminElusPage = React.lazy(() => import('./pages/AdminElusPage'));
const Login = React.lazy(() => import('./pages/Login'));
const VerifyPage = React.lazy(() => import('./pages/VerifyPage'));
const TerritoirePage = React.lazy(() => import('./pages/TerritoirePage'));

// Compatibilite : de nombreux composants naviguent encore vers /fr/... ou /en/...
// (heritage du routage multilingue). Focus FR = routes sans prefixe de langue.
// On retire le prefixe en preservant le reste du chemin + la query (?token=...),
// au lieu de rediriger vers l'accueil (ce qui cassait Connexion, magic link, etc.).
const StripLangRedirect = () => {
  const { pathname, search } = useLocation();
  const stripped = pathname.replace(/^\/(fr|en)(?=\/|$)/, '') || '/';
  return <Navigate to={`${stripped}${search}`} replace />;
};

const ChargementFallback = () => (
  <div
    style={{
      padding: '4rem 2rem',
      textAlign: 'center',
      color: 'var(--color-texte-doux)',
      fontFamily: 'var(--font-texte)',
    }}
  >
    Chargement…
  </div>
);

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Focus FR uniquement (decision Vision-Incarnee + audit 2026-05-26)
    if (i18n.language !== 'fr') {
      i18n.changeLanguage('fr');
    }
    localStorage.setItem('language', 'fr');
  }, [i18n]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<ChargementFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Accueil />} />

              {/* Routes transactionnelles preservees */}
              <Route path="petitions" element={<PetitionsListPage />} />
              <Route
                path="petitions/create"
                element={(
                  <ProtectedRoute>
                    <CreatePetitionPage />
                  </ProtectedRoute>
                )}
              />
              <Route path="petitions/:id" element={<PetitionDetail />} />
              <Route path="elus" element={<ElusPage />} />
              <Route path="elus/:id" element={<EluDetail />} />
              <Route path="actualites" element={<ActualitesPage />} />
              <Route path="carte" element={<MapPage />} />
              <Route
                path="transparence/ranking"
                element={<TransparencyRanking />}
              />
              <Route
                path="admin"
                element={(
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="admin/elus"
                element={(
                  <ProtectedRoute>
                    <AdminElusPage />
                  </ProtectedRoute>
                )}
              />
              <Route path="login" element={<Login />} />
              <Route path="verify" element={<VerifyPage />} />
              <Route
                path="centre-controle"
                element={(
                  <ProtectedRoute>
                    <CentreControle />
                  </ProtectedRoute>
                )}
              />

              {/* Fiches territoire (donnees publiques sourcees) */}
              <Route path="territoire" element={<TerritoirePage />} />
              <Route path="territoire/:slug" element={<TerritoirePage />} />

              {/* Routes editoriales dynamiques.
                  La forme :categorie/:second est ambigue (sous-categorie
                  ou page) — un dispatcher tranche au runtime via manifest. */}
              <Route
                path=":categorie/:sousCategorie/:slugPage"
                element={<RouteEditoriale />}
              />
              <Route
                path=":categorie/:second"
                element={<RouteAutoDispatch />}
              />
              <Route path=":categorie" element={<RouteHub />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            {/* Anciennes routes /fr/* et /en/* : retirer le prefixe, garder la destination */}
            <Route path="/fr/*" element={<StripLangRedirect />} />
            <Route path="/en/*" element={<StripLangRedirect />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
