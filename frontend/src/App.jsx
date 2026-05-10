import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
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
import { PetitionDetailPage } from './pages/PetitionDetailPage'
import { PetitionsListPage } from './pages/PetitionsListPage'

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/elus" element={<ElussPage />} />
          <Route path="/elus/:id" element={<EluDetailPage />} />
          <Route path="/petitions" element={<PetitionsListPage />} />
          <Route path="/petitions/:id" element={<PetitionDetailPage />} />

          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <Feed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/:postId"
            element={
              <ProtectedRoute>
                <PostDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/feed" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
