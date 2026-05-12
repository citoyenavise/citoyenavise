/**
 * AdminDashboard.jsx
 * Tableau de bord d'administration pour les promesses électorales
 * Protected - Admin only
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import '../styles/AdminDashboard.css';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { lang } = useParams();
  const { user, isAuthenticated } = useAuth();

  // Redirection si pas admin
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'admin') {
      navigate(`/${lang}/login`);
    }
  }, [user, isAuthenticated, navigate, lang]);

  // État
  const [stats, setStats] = useState({
    totalCitizens: 0,
    totalPetitions: 0,
    totalPromises: 0,
    totalSignatures: 0,
    promisesByStatus: {},
  });

  const [elus, setElus] = useState([]);
  const [promises, setPromises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulaire
  const [formData, setFormData] = useState({
    eluId: '',
    titre: '',
    description: '',
    deadline: '',
    status: 'engagee',
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
      fetchElus();
      fetchPromises();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setError('');
      setStats({
        totalCitizens: 0,
        totalPetitions: 0,
        totalPromises: 0,
        totalSignatures: 0,
        promisesByStatus: {
          engagee: 0,
          en_cours: 0,
          completee: 0,
          abandonnee: 0,
        },
      });
    } catch (err) {
      setError('Erreur lors du chargement des stats');
      console.error(err);
    }
  };

  const fetchElus = async () => {
    try {
      const response = await api.elus.list({ limit: 100 });
      setElus(Array.isArray(response) ? response : response.data || []);
    } catch (err) {
      console.error('Erreur lors du chargement des élus', err);
    }
  };

  const fetchPromises = async () => {
    try {
      setLoading(true);
      const response = await api.commitments.list({ limit: 100 });
      const data = Array.isArray(response) ? response : response.data || [];
      setPromises(data);

      // Compter par status
      const byStatus = {
        engagee: 0,
        en_cours: 0,
        completee: 0,
        abandonnee: 0,
      };
      data?.forEach((p) => {
        if (p.status in byStatus) {
          byStatus[p.status]++;
        }
      });
      setStats((prev) => ({ ...prev, promisesByStatus: byStatus }));
    } catch (err) {
      setError('Erreur lors du chargement des promesses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.eluId || !formData.titre) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (isEditMode && editingId) {
        // PUT - Modifier
        const response = await fetch(`/api/v1/promises/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          setError('');
          setShowModal(false);
          resetForm();
          await fetchPromises();
          alert('Promesse mise à jour avec succès');
        } else {
          setError('Erreur lors de la mise à jour');
        }
      } else {
        // POST - Créer
        const response = await fetch(
          `/api/v1/elus/${formData.eluId}/promises`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              titre: formData.titre,
              description: formData.description,
              deadline: formData.deadline,
              status: formData.status,
            }),
          },
        );

        if (response.ok) {
          setError('');
          resetForm();
          await fetchPromises();
          alert('Promesse créée avec succès');
        } else {
          setError('Erreur lors de la création');
        }
      }
    } catch (err) {
      setError(`Erreur serveur: ${err.message}`);
      console.error(err);
    }
  };

  const handleEdit = (promise) => {
    setEditingId(promise.id);
    setFormData({
      eluId: promise.eluId,
      titre: promise.titre,
      description: promise.description || '',
      deadline: promise.deadline ? promise.deadline.split('T')[0] : '',
      status: promise.status,
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette promesse?')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/promises/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        await fetchPromises();
        alert('Promesse supprimée avec succès');
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (err) {
      setError(`Erreur serveur: ${err.message}`);
      console.error(err);
    }
  };

  const handleStatusChange = async (promiseId, newStatus) => {
    try {
      const response = await fetch(`/api/v1/promises/${promiseId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchPromises();
      } else {
        setError('Erreur lors de la mise à jour du statut');
      }
    } catch (err) {
      setError(`Erreur serveur: ${err.message}`);
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      eluId: '',
      titre: '',
      description: '',
      deadline: '',
      status: 'engagee',
    });
    setIsEditMode(false);
    setEditingId(null);
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>👑 Tableau de Bord Administrateur</h1>
        <p>Gestion des promesses électorales et statistiques</p>
      </div>

      {error && (
        <div className="admin-error">
          <p>⚠️ {error}</p>
          <button onClick={() => setError('')}>Fermer</button>
        </div>
      )}

      {/* STATS GLOBALES */}
      <section className="stats-section">
        <h2>📊 Statistiques Globales</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Citoyens</h3>
            <p className="stat-number">{stats.totalCitizens}</p>
          </div>
          <div className="stat-card">
            <h3>Pétitions</h3>
            <p className="stat-number">{stats.totalPetitions}</p>
          </div>
          <div className="stat-card">
            <h3>Promesses</h3>
            <p className="stat-number">{stats.totalPromises}</p>
          </div>
          <div className="stat-card">
            <h3>Signatures</h3>
            <p className="stat-number">{stats.totalSignatures}</p>
          </div>
        </div>

        <div className="promises-status">
          <h3>Promesses par Statut</h3>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Engagée</span>
              <span className="status-count engagee">
                {stats.promisesByStatus.engagee || 0}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">En cours</span>
              <span className="status-count en_cours">
                {stats.promisesByStatus.en_cours || 0}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Complétée</span>
              <span className="status-count completee">
                {stats.promisesByStatus.completee || 0}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Abandonnée</span>
              <span className="status-count abandonnee">
                {stats.promisesByStatus.abandonnee || 0}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FORMULAIRE CRÉER PROMESSE */}
      <section className="form-section">
        <h2>➕ Créer une Nouvelle Promesse</h2>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="eluId">Élu *</label>
            <select
              id="eluId"
              name="eluId"
              value={formData.eluId}
              onChange={handleFormChange}
              disabled={isEditMode}
              required
            >
              <option value="">-- Sélectionner un élu --</option>
              {elus.map((elu) => (
                <option key={elu.id} value={elu.id}>
                  {elu.nom} ({elu.titre})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="titre">Titre de la Promesse *</label>
            <input
              id="titre"
              type="text"
              name="titre"
              value={formData.titre}
              onChange={handleFormChange}
              placeholder="Ex: Investir dans l'éducation"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              placeholder="Détails de la promesse..."
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="deadline">Échéance</label>
              <input
                id="deadline"
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleFormChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="status">Statut</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleFormChange}
              >
                <option value="engagee">Engagée</option>
                <option value="en_cours">En cours</option>
                <option value="completee">Complétée</option>
                <option value="abandonnee">Abandonnée</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {isEditMode ? '✏️ Mettre à jour' : '➕ Créer'}
            </button>
            {isEditMode && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setShowModal(false);
                }}
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      </section>

      {/* LISTE DES PROMESSES */}
      <section className="promises-section">
        <h2>📋 Liste des Promesses ({promises.length})</h2>

        {loading ? (
          <p className="loading">Chargement...</p>
        ) : promises.length === 0 ? (
          <p className="empty-state">Aucune promesse trouvée</p>
        ) : (
          <div className="promises-table-wrapper">
            <table className="promises-table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Élu</th>
                  <th>Statut</th>
                  <th>Échéance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promises.map((promise) => (
                  <tr key={promise.id}>
                    <td className="promise-titre">
                      <strong>{promise.titre}</strong>
                      {promise.description && (
                        <p className="promise-desc">{promise.description}</p>
                      )}
                    </td>
                    <td>{promise.elu?.nom}</td>
                    <td>
                      <select
                        className={`status-select status-${promise.status}`}
                        value={promise.status}
                        onChange={(e) => handleStatusChange(promise.id, e.target.value)
                        }
                      >
                        <option value="engagee">Engagée</option>
                        <option value="en_cours">En cours</option>
                        <option value="completee">Complétée</option>
                        <option value="abandonnee">Abandonnée</option>
                      </select>
                    </td>
                    <td>{promise.deadline?.split('T')[0]}</td>
                    <td className="actions-cell">
                      <button
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(promise)}
                        title="Éditer"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(promise.id)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODAL EDIT */}
      {showModal && isEditMode && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>✏️ Éditer la Promesse</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="modal-titre">Titre *</label>
                  <input
                    id="modal-titre"
                    type="text"
                    name="titre"
                    value={formData.titre}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="modal-description">Description</label>
                  <textarea
                    id="modal-description"
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="modal-deadline">Échéance</label>
                    <input
                      id="modal-deadline"
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="modal-status">Statut</label>
                    <select
                      id="modal-status"
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                    >
                      <option value="engagee">Engagée</option>
                      <option value="en_cours">En cours</option>
                      <option value="completee">Complétée</option>
                      <option value="abandonnee">Abandonnée</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary">
                    ✅ Enregistrer
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
