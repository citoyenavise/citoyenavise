/**
 * Page Pétitions - Listing avec filtres et recherche
 * Affiche les pétitions publiées avec filtres, recherche, pagination
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/PetitionsPage.css';

function PetitionsPage() {
  // ═══════════════════════════════════════════════════════════════
  // State
  // ═══════════════════════════════════════════════════════════════
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    status: 'published',
    elu_id: '',
    search: '',
    sort: 'created_at',
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ═══════════════════════════════════════════════════════════════
  // Fetch Pétitions
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const fetchPetitions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construire query string
        const params = new URLSearchParams();
        params.append('page', pagination.page);
        params.append('limit', pagination.limit);

        if (filters.status) {
          params.append('status', filters.status);
        }
        if (filters.elu_id) {
          params.append('elu_id', filters.elu_id);
        }
        if (filters.search) {
          params.append('search', filters.search);
        }
        if (filters.sort) {
          params.append('sort', filters.sort);
        }

        // Fetch
        const response = await fetch(
          `/api/v1/petitions?${params.toString()}`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Erreur lors de la récupération des pétitions');
        }

        setPetitions(data.data || []);
        setPagination({
          page: data.page,
          limit: data.limit,
          total: data.total,
          totalPages: data.totalPages,
        });
      } catch (err) {
        console.error('Erreur fetch pétitions:', err);
        setError(err.message || 'Impossible de charger les pétitions');
        setPetitions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPetitions();
  }, [filters, pagination.page, pagination.limit]);

  // ═══════════════════════════════════════════════════════════════
  // Handlers
  // ═══════════════════════════════════════════════════════════════

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    // Reset pagination quand on change les filtres
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      search: value,
    }));
    // Reset pagination
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({
      ...prev,
      sort: value,
    }));
    setPagination(prev => ({
      ...prev,
      page: 1,
    }));
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({
        ...prev,
        page: prev.page - 1,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        page: prev.page + 1,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToPage = (pageNum) => {
    if (pageNum >= 1 && pageNum <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        page: pageNum,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="petitions-page">
      <div className="petitions-container">
        {/* Header */}
        <div className="petitions-header">
          <h1>Pétitions</h1>
          <p>Découvrez et signez les pétitions citoyennes</p>
        </div>

        {/* Filtres */}
        <div className="petitions-filters">
          <div className="filters-row">
            {/* Search Input */}
            <div className="filter-group search-group">
              <label htmlFor="search">Rechercher</label>
              <input
                type="text"
                id="search"
                placeholder="Titre ou description..."
                value={filters.search}
                onChange={handleSearchChange}
                className="search-input"
              />
            </div>

            {/* Status Filter */}
            <div className="filter-group">
              <label htmlFor="status">Statut</label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Tous les statuts</option>
                <option value="published">Publiées</option>
                <option value="closed">Fermées</option>
                <option value="won">Gagnées</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="filter-group">
              <label htmlFor="sort">Trier par</label>
              <select
                id="sort"
                name="sort"
                value={filters.sort}
                onChange={handleSortChange}
                className="filter-select"
              >
                <option value="created_at">Récentes</option>
                <option value="signatures_count">Populaires</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="filters-actions">
            <button
              onClick={() => {
                setFilters({
                  status: 'published',
                  elu_id: '',
                  search: '',
                  sort: 'created_at',
                });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="btn-clear-filters"
            >
              Réinitialiser filtres
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="petitions-loading">
            <div className="spinner"></div>
            <p>Chargement des pétitions...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="petitions-error">
            <div className="error-icon">⚠️</div>
            <h3>Erreur</h3>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-retry"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && petitions.length === 0 && (
          <div className="petitions-empty">
            <div className="empty-icon">📋</div>
            <h3>Aucune pétition trouvée</h3>
            <p>Essayez de modifier vos filtres ou votre recherche</p>
          </div>
        )}

        {/* Petitions Grid */}
        {!loading && !error && petitions.length > 0 && (
          <div className="petitions-grid">
            {petitions.map(petition => (
              <Link
                key={petition.id}
                to={`/petitions/${petition.id}`}
                className="petition-card-link"
              >
                <div className="petition-card">
                  {/* Status Badge */}
                  <div className={`status-badge status-${petition.status}`}>
                    {petition.status === 'published' && 'Publiée'}
                    {petition.status === 'draft' && 'Brouillon'}
                    {petition.status === 'closed' && 'Fermée'}
                    {petition.status === 'won' && '✓ Gagnée'}
                  </div>

                  {/* Card Body */}
                  <div className="card-body">
                    {/* Titre */}
                    <h2 className="petition-title">{petition.titre}</h2>

                    {/* Description */}
                    <p className="petition-description">
                      {petition.description.substring(0, 120)}
                      {petition.description.length > 120 ? '...' : ''}
                    </p>

                    {/* Creator & Target Elu */}
                    <div className="petition-meta">
                      {petition.creator && (
                        <div className="creator-info">
                          <span className="label">Par</span>
                          <span className="value">{petition.creator.nomComplet}</span>
                        </div>
                      )}
                      {petition.elu && (
                        <div className="elu-info">
                          <span className="label">Vers</span>
                          <span className="value">{petition.elu.nom}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer - Signatures */}
                  <div className="card-footer">
                    <div className="signatures-stat">
                      <span className="icon">✍️</span>
                      <span className="count">{petition.signaturesCount}</span>
                      <span className="label">signature{petition.signaturesCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="view-button">
                      Voir →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && petitions.length > 0 && pagination.totalPages > 1 && (
          <div className="petitions-pagination">
            <button
              onClick={handlePreviousPage}
              disabled={pagination.page === 1}
              className="btn-pagination btn-prev"
            >
              ← Précédent
            </button>

            <div className="pagination-info">
              Page {pagination.page} sur {pagination.totalPages}
              <span className="total-count">
                ({pagination.total} pétition{pagination.total !== 1 ? 's' : ''})
              </span>
            </div>

            {/* Page Numbers */}
            <div className="page-numbers">
              {(() => {
                const pages = [];
                const maxButtons = 5;
                let startPage = Math.max(1, pagination.page - 2);
                let endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1);

                if (endPage - startPage < maxButtons - 1) {
                  startPage = Math.max(1, endPage - maxButtons + 1);
                }

                if (startPage > 1) {
                  pages.push(
                    <button
                      key="first"
                      onClick={() => handleGoToPage(1)}
                      className="page-btn"
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    pages.push(<span key="dots1" className="dots">...</span>);
                  }
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handleGoToPage(i)}
                      className={`page-btn ${pagination.page === i ? 'active' : ''}`}
                    >
                      {i}
                    </button>
                  );
                }

                if (endPage < pagination.totalPages) {
                  if (endPage < pagination.totalPages - 1) {
                    pages.push(<span key="dots2" className="dots">...</span>);
                  }
                  pages.push(
                    <button
                      key="last"
                      onClick={() => handleGoToPage(pagination.totalPages)}
                      className="page-btn"
                    >
                      {pagination.totalPages}
                    </button>
                  );
                }

                return pages;
              })()}
            </div>

            <button
              onClick={handleNextPage}
              disabled={pagination.page === pagination.totalPages}
              className="btn-pagination btn-next"
            >
              Suivant →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PetitionsPage;
