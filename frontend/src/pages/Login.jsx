import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Login() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { requestMagicLink } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi du lien');
    } finally {
      setLoading(false);
    }
  };

  // État : email envoyé avec succès
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold mb-3">Vérifiez votre boîte mail</h1>
          <p className="text-gray-600 mb-4">
            Nous avons envoyé un lien de connexion à <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Le lien expire dans 15 minutes. N'oubliez pas de vérifier votre dossier spam.
          </p>
          <Button
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
            className="w-full"
          >
            Renvoyer un lien
          </Button>
        </Card>
      </div>
    );
  }

  // État initial : formulaire
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2 text-center">Connexion</h1>
        <p className="text-center text-gray-600 mb-6">
          Entrez votre email, nous vous enverrons un lien de connexion sécurisé.
        </p>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            required
          />
          <Button type="submit" disabled={loading || !email} className="w-full">
            {loading ? 'Envoi en cours...' : 'Recevoir mon lien de connexion'}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Pas encore inscrit ? Pas besoin — le lien créera votre compte automatiquement.
        </p>
      </Card>
    </div>
  );
}

export default Login;