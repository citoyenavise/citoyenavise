import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../api/client';
import './NetworkSidebar.css';

/**
 * NetworkSidebar — barre latérale gauche affichée sur la MapPage.
 *
 * Contenu (Lot 3) :
 *  1. Profil utilisateur (depuis /auth/me) ou prompt de connexion
 *  2. Bloc « Réseau Québec » (4 compteurs : élus, pétitions, signatures, citoyens)
 *  3. Bloc « Réseau Canada » (idem)
 *
 * Décisions :
 *  - Aucune donnée mockée. Source unique : GET /api/v1/network/snapshot.
 *  - Affichage en parallèle Québec + Canada (option τ).
 *  - Pas de gamification, pas de groupes, pas de feed — gelés (cf. §10 et conseil opérateur).
 */

function formatNumber(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('fr-CA').format(n);
}

function CounterRow({ label, value, accent }) {
  return (
    <div className="cv-network-counter">
      <span className="cv-network-counter-value" style={accent ? { color: accent } : undefined}>
        {formatNumber(value)}
      </span>
      <span className="cv-network-counter-label">{label}</span>
    </div>
  );
}

function ScopeBlock({ title, accent, snapshot, loading }) {
  return (
    <section className="cv-network-scope">
      <header className="cv-network-scope-header" style={{ borderTopColor: accent }}>
        <h3 style={{ color: accent }}>{title}</h3>
      </header>
      {loading || !snapshot ? (
        <div className="cv-network-loading">…</div>
      ) : (
        <div className="cv-network-grid">
          <CounterRow label="Élus" value={snapshot.elus} accent={accent} />
          <CounterRow label="Pétitions" value={snapshot.petitions} accent={accent} />
          <CounterRow label="Signatures" value={snapshot.signatures} accent={accent} />
          <CounterRow label="Citoyens" value={snapshot.users} accent={accent} />
        </div>
      )}
    </section>
  );
}

export default function NetworkSidebar() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { i18n } = useTranslation();
  const lang = i18n.language || 'fr';

  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.network.snapshot();
        if (mounted) setSnapshot(data);
      } catch (err) {
        if (mounted) {
          // eslint-disable-next-line no-console
          console.error('NetworkSidebar snapshot error:', err);
          setError(err.message || 'Erreur de chargement');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <aside className="cv-network-sidebar">
      {/* ─── Profil utilisateur ────────────────────────────── */}
      <section className="cv-network-profile">
        {isAuthenticated && user ? (
          <>
            <div className="cv-network-avatar" aria-hidden="true">
              {(user.nomComplet || user.nom_complet || user.email || '?')
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="cv-network-profile-info">
              <div className="cv-network-profile-name">
                {user.nomComplet || user.nom_complet || user.email}
              </div>
              {user.province && (
                <div className="cv-network-profile-meta">{user.province}</div>
              )}
            </div>
          </>
        ) : (
          <Link to={`/${lang}/login`} className="cv-network-login-cta">
            Se connecter
          </Link>
        )}
      </section>

      {/* ─── Erreur réseau (fail silencieux pour ne pas casser la carte) ─── */}
      {error && (
        <div className="cv-network-error">
          Compteurs indisponibles ({error})
        </div>
      )}

      {/* ─── Bloc Réseau Québec (pilote) ───────────────────── */}
      <ScopeBlock
        title="Réseau Québec"
        accent="#ec4899"
        snapshot={snapshot?.quebec}
        loading={loading}
      />

      {/* ─── Bloc Réseau Canada (global) ───────────────────── */}
      <ScopeBlock
        title="Réseau Canada"
        accent="#06b6d4"
        snapshot={snapshot?.canada}
        loading={loading}
      />

      {/* ─── Pied de sidebar ───────────────────────────────── */}
      <footer className="cv-network-footer">
        <span>Pilote — Québec ville</span>
      </footer>
    </aside>
  );
}
