import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, username);
      navigate('/feed');
    } catch (err) {
      setError(err.message || 'Erreur d\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">S'inscrire</h1>

        {error && (
          <div className="bg-error/10 text-error px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom d'utilisateur"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirmer le mot de passe"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </Button>
        </form>

        <p className="text-center mt-4 text-gray-600">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </Card>
    </div>
  );
}
