/**
 * Page Détail d'une Pétition
 * Affiche : titre, description, statistiques, signatures, commentaires
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Toast from '../components/Toast';
import '../styles/PetitionDetailPage.css';

function PetitionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════════
  // State - Pétition
  // ═══════════════════════════════════════════════════════════════
  const [petition, setPetition] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  // State - Signature
  // ═══════════════════════════════════════════════════════════════
  const [isSignaturePending, setIsSignaturePending] = useState(false);
  const [userSigned, setUserSigned] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // State - Commentaires
  // ═══════════════════════════════════════════════════════════════
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isCommentPending, setIsCommentPending] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // State - Notifications
  // ═══════════════════════════════════════════════════════════════
  const [toast, setToast] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  // Fetch Pétition & Stats
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const fetchPetition = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch pétition
        const petitionResponse = await fetch(`/api/v1/petitions/${id}`);
        if (!petitionResponse.ok) {
          throw new Error(`Erreur ${petitionResponse.status}: Pétition non trouvée`);
        }
        const petitionData = await petitionResponse.json();
        setPetition(petitionData.data);

        // Fetch stats (avec goal par défaut pour exemple)
        const statsResponse = await fetch(`/api/v1/petitions/${id}/stats?goal=200`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }

        // Fetch commentaires
        fetchComments();

        // Vérifier authentification
        const token = localStorage.getItem('authToken');
        setIsAuthenticated(!!token);

        // Vérifier si user a déjà signé
        if (token) {
          checkUserSignature();
        }
      } catch (err) {
        console.error('Erreur fetch pétition:', err);
        setError(err.message || 'Impossible de charger la pétition');
      } finally {
        setLoading(false);
      }
    };

    fetchPetition();
  }, [id]);

  // ═══════════════════════════════════════════════════════════════
  // Fetch Commentaires
  // ═══════════════════════════════════════════════════════════════
  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await fetch(`/api/v1/petitions/${id}/comments?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      }
    } catch (err) {
      console.error('Erreur fetch commentaires:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Vérifier signature utilisateur
  // ═══════════════════════════════════════════════════════════════
  const checkUserSignature = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`/api/v1/petitions/${id}/has-signed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserSigned(data.hasSignedPetition || false);
      }
    } catch (err) {
      console.error('Erreur vérification signature:', err);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Sign Petition
  // ═══════════════════════════════════════════════════════════════
  const handleSignPetition = async () => {
    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        showToast('Connectez-vous pour signer cette pétition', 'warning');
        navigate('/login', { state: { from: `/petitions/${id}` } });
        return;
      }

      setIsSignaturePending(true);

      const response = await fetch(`/api/v1/petitions/${id}/sign`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.status === 409) {
        showToast('Vous avez déjà signé cette pétition', 'info');
        setUserSigned(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la signature');
      }

      // Success
      showToast('Merci de votre signature! 🎉', 'success');
      setUserSigned(true);

      // Rafraîchir statistiques
      const statsResponse = await fetch(`/api/v1/petitions/${id}/stats?goal=200`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Rafraîchir pétition
      const petitionResponse = await fetch(`/api/v1/petitions/${id}`);
      if (petitionResponse.ok) {
        const petitionData = await petitionResponse.json();
        setPetition(petitionData.data);
      }
    } catch (err) {
      console.error('Erreur signature:', err);
      showToast(err.message, 'error');
    } finally {
      setIsSignaturePending(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Unsign Petition
  // ═══════════════════════════════════════════════════════════════
  const handleUnsignPetition = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      setIsSignaturePending(true);

      const response = await fetch(`/api/v1/petitions/${id}/sign`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du retrait de signature');
      }

      // Success
      showToast('Votre signature a été retirée', 'success');
      setUserSigned(false);

      // Rafraîchir statistiques
      const statsResponse = await fetch(`/api/v1/petitions/${id}/stats?goal=200`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Rafraîchir pétition
      const petitionResponse = await fetch(`/api/v1/petitions/${id}`);
      if (petitionResponse.ok) {
        const petitionData = await petitionResponse.json();
        setPetition(petitionData.data);
      }
    } catch (err) {
      console.error('Erreur retrait signature:', err);
      showToast(err.message, 'error');
    } finally {
      setIsSignaturePending(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Add Comment
  // ═══════════════════════════════════════════════════════════════
  const handleAddComment = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        showToast('Connectez-vous pour ajouter un commentaire', 'warning');
        navigate('/login', { state: { from: `/petitions/${id}` } });
        return;
      }

      if (!commentText.trim()) {
        showToast('Veuillez entrer un commentaire', 'warning');
        return;
      }

      setIsCommentPending(true);

      const response = await fetch(`/api/v1/petitions/${id}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contenu: commentText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'ajout du commentaire');
      }

      // Success
      showToast('Commentaire ajouté avec succès', 'success');
      setCommentText('');

      // Rafraîchir commentaires
      await fetchComments();
    } catch (err) {
      console.error('Erreur commentaire:', err);
      showToast(err.message, 'error');
    } finally {
      setIsCommentPending(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Toast Notification
  // ═══════════════════════════════════════════════════════════════
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ═══════════════════════════════════════════════════════════════
  // Format Date
  // ═══════════════════════════════════════════════════════════════
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="petition-detail-page">
        <div className="petition-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement de la pétition...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="petition-detail-page">
        <div className="petition-container">
          <div className="error-state">
            <h2>Erreur</h2>
            <p>{error}</p>
            <Link to="/petitions" className="btn btn-primary">
              Retour aux pétitions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!petition) {
    return (
      <div className="petition-detail-page">
        <div className="petition-container">
          <div className="error-state">
            <h2>Pétition non trouvée</h2>
            <Link to="/petitions" className="btn btn-primary">
              Retour aux pétitions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const signaturePercentage = stats?.percentageToGoal || 0;

  return (
    <div className="petition-detail-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="petition-container">
        {/* Back Button */}
        <Link to="/petitions" className="back-link">
          ← Retour aux pétitions
        </Link>

        {/* Header */}
        <div className="petition-header">
          <div className={`status-badge status-${petition.status}`}>
            {petition.status === 'published' && 'Publiée'}
            {petition.status === 'draft' && 'Brouillon'}
            {petition.status === 'closed' && 'Fermée'}
            {petition.status === 'won' && '✓ Gagnée'}
          </div>

          <h1 className="petition-title">{petition.titre}</h1>

          <div className="petition-meta">
            {petition.creator && (
              <div className="creator">
                <span className="label">Créée par</span>
                <span className="value">{petition.creator.nomComplet}</span>
                <span className="date">le {formatDate(petition.createdAt)}</span>
              </div>
            )}
            {petition.elu && (
              <div className="target-elu">
                <span className="label">Adressée à</span>
                <Link to={`/elus/${petition.elu.id}`} className="elu-name">
                  {petition.elu.nom}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="petition-content-wrapper">
          {/* Main Content */}
          <div className="petition-main">
            {/* Description */}
            <section className="description-section">
              <h2>Description</h2>
              <div className="description-text">
                {petition.description}
              </div>
            </section>

            {/* Commentaires */}
            <section className="comments-section">
              <h2>Commentaires ({stats?.totalComments || 0})</h2>

              {/* Add Comment Form */}
              {isAuthenticated && (
                <form className="comment-form" onSubmit={handleAddComment}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Ajoutez votre commentaire..."
                    rows="4"
                    disabled={isCommentPending}
                  />
                  <div className="form-footer">
                    <span className="char-count">
                      {commentText.length} / 1000
                    </span>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isCommentPending || !commentText.trim()}
                    >
                      {isCommentPending ? 'Envoi...' : 'Ajouter un commentaire'}
                    </button>
                  </div>
                </form>
              )}

              {!isAuthenticated && (
                <div className="login-prompt">
                  <p>Connectez-vous pour ajouter un commentaire</p>
                  <Link to="/login" className="btn btn-secondary">
                    Se connecter
                  </Link>
                </div>
              )}

              {/* Comments List */}
              <div className="comments-list">
                {commentsLoading ? (
                  <p className="loading-text">Chargement des commentaires...</p>
                ) : comments.length === 0 ? (
                  <p className="empty-text">Aucun commentaire pour le moment</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment">
                      <div className="comment-header">
                        <span className="author">{comment.author?.nomComplet}</span>
                        <span className="date">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="comment-text">{comment.contenu}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="petition-sidebar">
            {/* Signatures Card */}
            <div className="signatures-card">
              <h3>Signatures</h3>

              {/* Signature Progress */}
              <div className="signature-progress">
                <div className="progress-header">
                  <span className="current">{stats?.totalSignatures || 0}</span>
                  <span className="target">/ 200</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(signaturePercentage, 100)}%` }}
                  />
                </div>
                <div className="progress-percentage">
                  {signaturePercentage}% de l'objectif
                </div>
              </div>

              {/* Sign/Unsign Button */}
              {isAuthenticated ? (
                userSigned ? (
                  <button
                    onClick={handleUnsignPetition}
                    disabled={isSignaturePending}
                    className="btn btn-danger btn-block"
                  >
                    {isSignaturePending ? 'Traitement...' : '✓ Signature retirée'}
                  </button>
                ) : (
                  <button
                    onClick={handleSignPetition}
                    disabled={isSignaturePending}
                    className="btn btn-primary btn-block"
                  >
                    {isSignaturePending ? 'Signature en cours...' : 'Signer cette pétition'}
                  </button>
                )
              ) : (
                <div className="auth-prompt">
                  <p>Connectez-vous pour signer</p>
                  <Link
                    to="/login"
                    state={{ from: `/petitions/${id}` }}
                    className="btn btn-secondary btn-block"
                  >
                    Se connecter
                  </Link>
                </div>
              )}
            </div>

            {/* Stats Card */}
            {stats && (
              <div className="stats-card">
                <h3>Statistiques</h3>
                <ul className="stats-list">
                  <li>
                    <span className="stat-label">Signatures :</span>
                    <span className="stat-value">{stats.totalSignatures}</span>
                  </li>
                  <li>
                    <span className="stat-label">Commentaires :</span>
                    <span className="stat-value">{stats.totalComments}</span>
                  </li>
                  <li>
                    <span className="stat-label">Créée :</span>
                    <span className="stat-value">{formatDate(stats.createdAt)}</span>
                  </li>
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default PetitionDetailPage;
