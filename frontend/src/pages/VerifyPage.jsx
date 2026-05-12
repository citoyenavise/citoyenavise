import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Loader } from '../components/ui/Loader';

export function VerifyPage() {
  const [searchParams] = useSearchParams();
  const { lang } = useParams();
  const navigate = useNavigate();
  const { verifyMagicLink } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setError('Token invalide ou expiré');
        setLoading(false);
        return;
      }

      try {
        await verifyMagicLink(token);
        setSuccess(true);
        // Rediriger après 2 secondes
        setTimeout(() => {
          navigate(`/${lang}`);
        }, 2000);
      } catch (err) {
        setError(err.message || 'Erreur lors de la vérification du lien');
        setLoading(false);
      }
    };

    verifyToken();
  }, [searchParams, verifyMagicLink, navigate, lang]);

  if (loading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <Loader />
          <h1 className="text-2xl font-bold mt-4">Vérification en cours...</h1>
          <p className="text-gray-600 mt-2">Nous vérifions votre lien de connexion</p>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-3">Connexion réussie !</h1>
          <p className="text-gray-600">Redirection en cours...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold mb-3">Lien invalide</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate(`/${lang}/login`)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Retourner à la connexion
        </button>
      </Card>
    </div>
  );
}

export default VerifyPage;
