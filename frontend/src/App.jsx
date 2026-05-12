import React, { useEffect, Suspense } from 'react';

import { useTranslation } from 'react-i18next';
import {
  BrowserRouter, Routes, Route, Navigate, useParams, Outlet,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';

// Code splitting with React.lazy
const PetitionsListPage = React.lazy(() => import('./pages/PetitionsListPage'));
const PetitionDetail = React.lazy(() => import('./pages/PetitionDetail'));
const ElusPage = React.lazy(() => import('./pages/ElusPage'));
const EluDetail = React.lazy(() => import('./pages/EluDetail'));
const ActualitesPage = React.lazy(() => import('./pages/ActualitesPage'));
const CreatePetitionPage = React.lazy(() => import('./pages/CreatePetitionPage'));
const MapPage = React.lazy(() => import('./pages/MapPage'));
const TransparencyRanking = React.lazy(() => import('./pages/TransparencyRanking'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const VerifyPage = React.lazy(() => import('./pages/VerifyPage'));
// Loading fallback
const LoadingFallback = () => <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

const LanguageWrapper = () => {
  const { lang } = useParams();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (lang === 'fr' || lang === 'en') {
      i18n.changeLanguage(lang);
      localStorage.setItem('language', lang);
    }
  }, [lang, i18n]);

  return <Outlet />;
};

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'fr';
    i18n.changeLanguage(savedLang);

    if (!localStorage.getItem('language')) {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en' || browserLang === 'fr') {
        i18n.changeLanguage(browserLang);
        localStorage.setItem('language', browserLang);
      }
    }
  }, [i18n]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/:lang" element={<LanguageWrapper />}>
              <Route path="petitions" element={<PetitionsListPage />} />
              <Route path="petitions/:id" element={<PetitionDetail />} />
              <Route path="petitions/create" element={<ProtectedRoute><CreatePetitionPage /></ProtectedRoute>} />
              <Route path="elus" element={<ElusPage />} />
              <Route path="elus/:id" element={<EluDetail />} />
              <Route path="actualites" element={<ActualitesPage />} />
              <Route path="carte" element={<MapPage />} />
              <Route path="transparence/ranking" element={<TransparencyRanking />} />
              <Route path="admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="login" element={<Login />} />
              <Route path="verify" element={<VerifyPage />} />
            </Route>
            <Route path="/" element={<Navigate to="/fr" />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
