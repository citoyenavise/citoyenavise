import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'

export function PostDetail() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true)
      try {
        const data = await api.posts.get(postId)
        setPost(data)

        const commentsData = await api.comments.getByPost(postId)
        setComments(commentsData.items || [])
      } catch (err) {
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }

    loadPost()
  }, [postId])

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const comment = await api.comments.create(postId, newComment)
      setComments([...comments, comment])
      setNewComment('')
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Loader />

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card>
          <p className="text-center py-12 text-gray-500">Post non trouvé</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-6">
        ← Retour
      </Button>

      <Card className="mb-6">
        <div className="flex gap-4">
          <Avatar name={post.author?.username} size="md" />
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{post.title}</h1>
            <p className="text-gray-500 mt-2">
              @{post.author?.username} • {new Date(post.createdAt).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <p className="mt-6 text-lg text-gray-700">{post.content}</p>

        <div className="mt-6 flex gap-4 text-gray-600">
          <button className="hover:text-primary transition">
            ❤️ {post.likesCount || 0}
          </button>
          <button className="hover:text-primary transition">
            💬 {post.commentsCount || 0}
          </button>
        </div>
      </Card>

      <Card className="mb-6">
        <h3 className="text-xl font-bold mb-4">Ajouter un commentaire</h3>
        <form onSubmit={handleAddComment} className="space-y-4">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Votre commentaire..."
            as="textarea"
            rows="3"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Envoi...' : 'Commenter'}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        <h3 className="text-xl font-bold">Commentaires ({comments.length})</h3>
        {comments.length === 0 ? (
          <Card>
            <p className="text-center py-8 text-gray-500">Aucun commentaire pour le moment</p>
          </Card>
        ) : (
          comments.map(comment => (
            <Card key={comment.id}>
              <div className="flex gap-4">
                <Avatar name={comment.author?.username} size="sm" />
                <div className="flex-1">
                  <p className="font-semibold">@{comment.author?.username}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="mt-2 text-gray-700">{comment.content}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
