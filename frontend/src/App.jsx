import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Header } from './components/Header'
import { ProtectedRoute } from './components/ProtectedRoute'

import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Feed } from './pages/Feed'
import { PostDetail } from './pages/PostDetail'
import { Notifications } from './pages/Notifications'
import { ElussPage } from './pages/ElussPage'
import { EluDetailPage } from './pages/EluDetailPage'
import PetitionDetailPage from './pages/PetitionDetailPage'
import CreatePetitionPage from './pages/CreatePetitionPage'
import { PetitionsListPage } from './pages/PetitionsListPage'

const LanguageWrapper = () => {
  const { lang } = useParams()
  const { i18n } = useTranslation()

  useEffect(() => {
    if (lang === 'fr' || lang === 'en') {
      i18n.changeLanguage(lang)
      localStorage.setItem('language', lang)
    }
  }, [lang, i18n])

  return <Outlet />
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <Routes>
          {/* Routes sans langue (global) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Routes avec paramètre de langue */}
          <Route path="/:lang" element={<LanguageWrapper />}>
            <Route index element={<Home />} />
            <Route path="petitions" element={<PetitionsListPage />} />
            <Route path="petitions/:id" element={<PetitionDetailPage />} />
            <Route
              path="create-petition"
              element={
                <ProtectedRoute>
                  <CreatePetitionPage />
                </ProtectedRoute>
              }
            />
            <Route path="elus" element={<ElussPage />} />
            <Route path="elus/:id" element={<EluDetailPage />} />

            <Route
              path="feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="post/:postId"
              element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/fr" replace />} />
          <Route path="*" element={<Navigate to="/fr" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
