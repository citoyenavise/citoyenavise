import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'

export function PetitionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [petition, setPetition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signed, setSigned] = useState(false)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    const loadPetition = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.petitions.get(id)
        setPetition(response.data)
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement')
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPetition()
  }, [id])

  const handleSign = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setSigning(true)
    try {
      await api.petitions.sign(id)
      setSigned(true)
      if (petition) {
        setPetition({
          ...petition,
          signaturesCount: (petition.signaturesCount || 0) + 1,
        })
      }
    } catch (err) {
      if (err.code === 'DUPLICATE_SIGNATURE') {
        setError('Vous avez déjà signé cette pétition')
      } else {
        setError(err.message || 'Erreur lors de la signature')
      }
    } finally {
      setSigning(false)
    }
  }

  if (loading) return <Loader />

  if (error && !petition) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="bg-red-50 border border-red-200">
          <div className="text-red-700">
            <p className="font-semibold mb-2">Erreur</p>
            <p className="text-sm mb-4">{error}</p>
            <Button variant="outline" onClick={() => navigate('/petitions')}>
              ← Retour aux pétitions
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!petition) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="text-center py-12">
          <p className="text-gray-500">Pétition non trouvée</p>
          <Button variant="outline" onClick={() => navigate('/petitions')} className="mt-4">
            ← Retour aux pétitions
          </Button>
        </Card>
      </div>
    )
  }

  const statusLabels = {
    draft: '📝 Brouillon',
    published: '✅ Publiée',
    archived: '📦 Archivée',
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
        ← Retour
      </Button>

      <Card className="mb-6">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{petition.titre}</h1>
              {petition.elu && (
                <p className="text-lg text-gray-600 mt-2">
                  Adressée à{' '}
                  <Link
                    to={`/elus/${petition.elu.id}`}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    {petition.elu.nom}
                  </Link>
                </p>
              )}
            </div>
            <span className="inline-block px-4 py-2 rounded-lg font-semibold bg-green-100 text-green-900">
              {statusLabels[petition.status] || petition.status}
            </span>
          </div>

          <div className="prose prose-sm max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{petition.description}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {petition.status === 'published' && (
            <Button
              variant="primary"
              onClick={handleSign}
              disabled={signing || signed}
              className="w-full"
            >
              {signed ? '✅ Vous avez signé' : signing ? 'Signature en cours...' : '✍️ Signer la pétition'}
            </Button>
          )}
        </div>

        <div className="border-t pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Signatures</p>
              <p className="text-2xl font-bold text-gray-900">{petition.signaturesCount || 0}</p>
            </div>
            {petition.deadline && (
              <div>
                <p className="text-sm text-gray-600">Délai</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(petition.deadline).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            {petition.creator && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Créée par</p>
                <p className="text-gray-900">{petition.creator.email}</p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-6 mt-6">
          <p className="text-xs text-gray-500">
            Créée le {new Date(petition.createdAt).toLocaleDateString('fr-FR')}
            {petition.updatedAt && ` • Modifiée le ${new Date(petition.updatedAt).toLocaleDateString('fr-FR')}`}
          </p>
        </div>
      </Card>
    </div>
  )
}
