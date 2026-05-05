import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'

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

        <div className="flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link to="/feed" className="text-gray-600 hover:text-primary transition">
                Fil d'actualité
              </Link>
              <Link to="/notifications" className="relative text-gray-600 hover:text-primary transition">
                Notifications
                <span className="absolute -top-2 -right-2 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </Link>

              <div className="flex items-center gap-4">
                <Avatar name={user?.username || 'User'} size="sm" />
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
      </nav>
    </header>
  )
}
