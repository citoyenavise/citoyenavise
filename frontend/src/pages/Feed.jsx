import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';

export function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const data = await api.posts.list({
          page,
          limit: 10,
          sort: 'latest',
        });
        setPosts(data.items || []);
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [page]);

  if (loading) return <Loader />;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Fil d'actualité</h1>

      <div className="space-y-6">
        {posts.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">Aucun post pour le moment</p>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <div className="flex gap-4">
                <Avatar name={post.author?.username} size="md" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{post.title}</h3>
                      <p className="text-sm text-gray-500">
                        @{post.author?.username} • {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-gray-700">{post.content}</p>

                  <div className="mt-4 flex items-center gap-6 text-gray-500 text-sm">
                    <button className="hover:text-primary transition">
                      ❤️ {post.likesCount || 0}
                    </button>
                    <button className="hover:text-primary transition">
                      💬 {post.commentsCount || 0}
                    </button>
                    <Link
                      to={`/post/${post.id}`}
                      className="text-primary hover:underline ml-auto"
                    >
                      Voir plus
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Précédent
        </Button>
        <span className="text-gray-600">Page {page}</span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
