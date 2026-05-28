import React, { Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BrowserRouter, Routes, Route, Navigate,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Accueil from './pages/Accueil';
import CentreControle from './pages/CentreControle';
import RouteHub from './pages/editorial/RouteHub';
import RouteEditoriale from './pages/editorial/RouteEditoriale';

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

              {/* Routes editoriales dynamiques
                  (matchent par categorie/sous-categorie du manifest) */}
              <Route
                path=":categorie/:sousCategorie/:slugPage"
                element={<RouteEditoriale />}
              />
              <Route
                path=":categorie/:sousCategorie"
                element={<RouteHub />}
              />
              <Route
                path=":categorie/:slugPage"
                element={<RouteEditoriale />}
              />
              <Route path=":categorie" element={<RouteHub />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            {/* Redirect anciennes routes /fr/* et /en/* vers / */}
            <Route path="/fr/*" element={<Navigate to="/" replace />} />
            <Route path="/en/*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
