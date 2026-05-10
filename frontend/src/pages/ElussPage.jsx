import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'

export function ElussPage() {
  const [elus, setElus] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [limit, setLimit] = useState(20)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const loadElus = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await api.elus.list({ limit, offset })
        setElus(response.data || [])
        setTotal(response.total || 0)
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement des élus')
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }

    loadElus()
  }, [limit, offset])

  if (loading) return <Loader />

  const niveauLabels = {
    fédéral: '🇨🇦 Fédéral',
    provincial: '🏛️ Provincial',
    municipal: '🏙️ Municipal',
  }

  const niveauColors = {
    fédéral: 'bg-blue-50',
    provincial: 'bg-green-50',
    municipal: 'bg-purple-50',
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Élus Canadiens</h1>
        <p className="text-gray-600">
          {total} élus • Trouvez et interpellez vos représentants
        </p>
      </div>

      {error && (
        <Card className="mb-6 bg-red-50 border border-red-200">
          <div className="text-red-700">
            <p className="font-semibold">Erreur</p>
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      )}

      {elus.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun élu disponible</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 bg-gray-50">
                <th className="text-left p-4 font-semibold text-gray-700">Nom</th>
                <th className="text-left p-4 font-semibold text-gray-700">Titre</th>
                <th className="text-left p-4 font-semibold text-gray-700">Région</th>
                <th className="text-left p-4 font-semibold text-gray-700">Niveau</th>
                <th className="text-center p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {elus.map(elu => (
                <tr
                  key={elu.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition ${
                    niveauColors[elu.niveau] || 'bg-white'
                  }`}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-gray-900">{elu.nom}</p>
                      {elu.email && (
                        <p className="text-sm text-gray-500">{elu.email}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-700">{elu.titre}</td>
                  <td className="p-4 text-gray-700">{elu.region}</td>
                  <td className="p-4">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-white border">
                      {niveauLabels[elu.niveau] || elu.niveau}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Link to={`/elus/${elu.id}`}>
                      <Button variant="primary" size="sm">
                        Voir détail
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > limit && (
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            ← Précédent
          </Button>
          <span className="text-gray-600 text-sm">
            Élus {offset + 1}–{Math.min(offset + limit, total)} sur {total}
          </span>
          <Button
            variant="outline"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            Suivant →
          </Button>
        </div>
      )}
    </div>
  )
}
