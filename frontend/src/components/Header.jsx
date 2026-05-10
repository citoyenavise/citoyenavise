import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import LanguageSelector from './LanguageSelector'

export function Header() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary">
          Citoyen Avisé
        </Link>

        <div className="flex items-center gap-8">
          <div className="flex gap-6">
            <Link to="/elus" className="text-gray-600 hover:text-primary transition font-medium">
              Élus
            </Link>
            <Link to="/petitions" className="text-gray-600 hover:text-primary transition font-medium">
              Pétitions
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/create-petition" className="text-gray-600 hover:text-primary transition font-medium">
                  Créer pétition
                </Link>
                <Link to="/feed" className="text-gray-600 hover:text-primary transition font-medium">
                  Fil d'actualité
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-6">
            <LanguageSelector />

            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="relative text-gray-600 hover:text-primary transition">
                  🔔
                  <span className="absolute -top-2 -right-2 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </Link>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={user?.username || 'User'} size="sm" />
                    <span className="text-sm text-gray-600">{user?.email}</span>
                  </div>
                  <Button variant="danger" size="sm" onClick={handleLogout}>
                    Déconnexion
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Connexion
                </Button>
                <Button onClick={() => navigate('/register')}>
                  S'inscrire
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
