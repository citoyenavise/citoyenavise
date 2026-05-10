/**
 * Page Créer une Pétition
 * Formulaire protégé pour créer une nouvelle pétition
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/Toast';
import '../styles/CreatePetitionPage.css';

function CreatePetitionPage() {
  const navigate = useNavigate();

  // ═══════════════════════════════════════════════════════════════
  // State - Form Data
  // ═══════════════════════════════════════════════════════════════
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    eluId: '',
  });

  // ═══════════════════════════════════════════════════════════════
  // State - Elus List
  // ═══════════════════════════════════════════════════════════════
  const [elus, setElus] = useState([]);
  const [elusLoading, setElusLoading] = useState(true);
  const [elusError, setElusError] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  // State - Form State
  // ═══════════════════════════════════════════════════════════════
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // ═══════════════════════════════════════════════════════════════
  // State - Notifications
  // ═══════════════════════════════════════════════════════════════
  const [toast, setToast] = useState(null);

  // ═══════════════════════════════════════════════════════════════
  // Check Authentication
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login', { state: { from: '/create-petition' } });
      return;
    }

    // Fetch élus
    fetchElus();
  }, [navigate]);

  // ═══════════════════════════════════════════════════════════════
  // Fetch Élus
  // ═══════════════════════════════════════════════════════════════
  const fetchElus = async () => {
    try {
      setElusLoading(true);
      setElusError(null);

      const response = await fetch('/api/v1/elus?limit=100');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des élus');
      }

      const data = await response.json();
      setElus(data.data || []);
    } catch (err) {
      console.error('Erreur fetch élus:', err);
      setElusError(err.message);
      showToast('Erreur lors du chargement des élus', 'error');
    } finally {
      setElusLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Form Validation (Client-side)
  // ═══════════════════════════════════════════════════════════════
  const validateForm = () => {
    const newErrors = {};

    // Validation titre
    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    } else if (formData.titre.length < 10) {
      newErrors.titre = 'Le titre doit avoir minimum 10 caractères';
    } else if (formData.titre.length > 200) {
      newErrors.titre = 'Le titre ne doit pas dépasser 200 caractères';
    }

    // Validation description
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (formData.description.length < 20) {
      newErrors.description = 'La description doit avoir minimum 20 caractères';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'La description ne doit pas dépasser 2000 caractères';
    }

    // Note: eluId is optional

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ═══════════════════════════════════════════════════════════════
  // Handle Form Change
  // ═══════════════════════════════════════════════════════════════
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Handle Submit
  // ═══════════════════════════════════════════════════════════════
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      showToast('Veuillez corriger les erreurs du formulaire', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('authToken');

      if (!token) {
        navigate('/login');
        return;
      }

      // Préparer les données
      const submitData = {
        titre: formData.titre.trim(),
        description: formData.description.trim(),
      };

      // Ajouter eluId si sélectionné
      if (formData.eluId) {
        submitData.eluId = parseInt(formData.eluId, 10);
      }

      // Submit à l'API
      const response = await fetch('/api/v1/petitions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      // Handle Zod validation errors
      if (response.status === 400) {
        // Erreur de validation
        const validationErrors = {};

        if (data.details && Array.isArray(data.details)) {
          data.details.forEach(error => {
            const field = error.path?.[0] || 'general';
            validationErrors[field] = error.message;
          });
        } else if (data.error) {
          validationErrors.general = data.error;
        }

        setErrors(validationErrors);
        showToast('Veuillez corriger les erreurs du formulaire', 'error');
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la pétition');
      }

      // Success
      showToast('Pétition créée avec succès! 🎉', 'success');

      // Redirect to petition detail
      const petitionId = data.data?.id;
      if (petitionId) {
        setTimeout(() => {
          navigate(`/petitions/${petitionId}`);
        }, 1000);
      }
    } catch (err) {
      console.error('Erreur création pétition:', err);
      showToast(err.message || 'Erreur lors de la création', 'error');
    } finally {
      setIsSubmitting(false);
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
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="create-petition-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="create-petition-container">
        {/* Header */}
        <div className="create-petition-header">
          <h1>Créer une Pétition</h1>
          <p>Proposez une pétition citoyenne et engagez-vous pour le changement</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="create-petition-form">
          {/* Title Field */}
          <div className="form-group">
            <label htmlFor="titre">
              Titre de la pétition
              <span className="required">*</span>
            </label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleInputChange}
              placeholder="Ex: Améliorer les transports publics"
              disabled={isSubmitting}
              className={`form-input ${errors.titre ? 'has-error' : ''}`}
              maxLength="200"
            />
            <div className="field-help">
              <span className="char-count">
                {formData.titre.length} / 200
              </span>
              {errors.titre && (
                <span className="error-message">⚠ {errors.titre}</span>
              )}
            </div>
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="description">
              Description
              <span className="required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Décrivez en détail votre pétition. Pourquoi cette pétition est-elle importante ? Quels changements souhaitez-vous ? Comment cela bénéficiera-t-il à la communauté ?"
              disabled={isSubmitting}
              className={`form-textarea ${errors.description ? 'has-error' : ''}`}
              rows="8"
              maxLength="2000"
            />
            <div className="field-help">
              <span className="char-count">
                {formData.description.length} / 2000
              </span>
              {errors.description && (
                <span className="error-message">⚠ {errors.description}</span>
              )}
            </div>
          </div>

          {/* Elu Select Field */}
          <div className="form-group">
            <label htmlFor="eluId">
              Élu cible (optionnel)
            </label>
            {elusLoading ? (
              <select id="eluId" disabled className="form-select">
                <option>Chargement des élus...</option>
              </select>
            ) : elusError ? (
              <div className="select-error">
                <p>Erreur lors du chargement des élus</p>
                <button
                  type="button"
                  onClick={fetchElus}
                  className="btn btn-link"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <>
                <select
                  id="eluId"
                  name="eluId"
                  value={formData.eluId}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  className="form-select"
                >
                  <option value="">-- Sélectionner un élu --</option>
                  <optgroup label="Fédéral">
                    {elus
                      .filter(e => e.niveau === 'fédéral')
                      .map(e => (
                        <option key={e.id} value={e.id}>
                          {e.nom} ({e.titre})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Provincial">
                    {elus
                      .filter(e => e.niveau === 'provincial')
                      .map(e => (
                        <option key={e.id} value={e.id}>
                          {e.nom} ({e.titre})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Municipal">
                    {elus
                      .filter(e => e.niveau === 'municipal')
                      .map(e => (
                        <option key={e.id} value={e.id}>
                          {e.nom} ({e.titre})
                        </option>
                      ))}
                  </optgroup>
                </select>
                <div className="field-help">
                  <p>La pétition peut être adressée à un élu spécifique</p>
                </div>
              </>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="form-error">
              <p>⚠ {errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || elusLoading}
            className="btn btn-primary btn-lg btn-block"
          >
            {isSubmitting ? 'Création en cours...' : 'Créer la pétition'}
          </button>

          {/* Info Text */}
          <div className="form-info">
            <p>
              <strong>Important :</strong> Votre pétition doit respecter nos
              {' '}
              <a href="/conditions" target="_blank" rel="noopener noreferrer">
                conditions d'utilisation
              </a>
              {' '}
              et ne doit pas contenir de contenu offensant, illégal ou discriminatoire.
            </p>
          </div>
        </form>

        {/* Benefits Section */}
        <div className="benefits-section">
          <h2>Pourquoi créer une pétition ?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">👥</div>
              <h3>Rassembler</h3>
              <p>Fédérez les citoyens autour d'une cause commune</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📢</div>
              <h3>Amplifier</h3>
              <p>Donnez une voix à votre cause et inspirez le changement</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">⚡</div>
              <h3>Agir</h3>
              <p>Persuadez les élus de prendre des mesures concrètes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePetitionPage;
