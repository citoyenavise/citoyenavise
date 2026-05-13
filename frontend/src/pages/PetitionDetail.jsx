import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';

export function PetitionDetail() {
  const { lang, id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [petition, setPetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    const loadPetition = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.petitions.get(id);
        setPetition(response);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement de la pétition');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPetition();
  }, [id]);

  const handleSign = async () => {
    if (!isAuthenticated) {
      navigate(`/${lang}/login`);
      return;
    }

    try {
      await api.petitions.sign(id);
      setHasSigned(true);
    } catch (err) {
      if (err.code === 'ALREADY_SIGNED') {
        setHasSigned(true);
      } else {
        setError(err.message || 'Erreur lors de la signature');
      }
    }
  };

  if (loading) return <Loader />;

  if (!petition) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="text-center py-12">
          <p className="text-gray-500 text-lg">Pétition non trouvée</p>
          <Link to={`/${lang}/petitions`} className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
            Retour aux pétitions
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link to={`/${lang}/petitions`} className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
        ← Retour aux pétitions
      </Link>

      {error && (
        <Card className="mb-6 bg-red-50 border border-red-200">
          <div className="text-red-700">
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      <Card className="mb-6 p-6">
        <h1 className="text-4xl font-bold mb-4">{petition.titre || 'N/A'}</h1>
        <p className="text-gray-600 mb-4">{petition.description || 'N/A'}</p>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-500">Créateur</p>
            <p className="font-semibold">{petition.creator?.nom_complet || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Signatures</p>
            <p className="font-semibold">{petition.signatures_count || 0}</p>
          </div>
        </div>

        {isAuthenticated ? (
          <Button
            variant={hasSigned ? 'outline' : 'primary'}
            onClick={handleSign}
            className="w-full"
          >
            {hasSigned ? '✓ Vous avez signé' : 'Signer cette pétition'}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => navigate(`/${lang}/login`)}
            className="w-full"
          >
            Connexion pour signer
          </Button>
        )}
      </Card>
    </div>
  );
}

export default PetitionDetail;
