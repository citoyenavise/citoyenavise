import { useContext } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './CentreControle.css';

const CHAMPS_PROFIL = [
  { cle: ['firstName', 'first_name'], label: 'Prénom' },
  { cle: ['lastName', 'last_name'], label: 'Nom' },
  { cle: ['email'], label: 'Adresse courriel' },
  { cle: ['postalCode', 'postal_code'], label: 'Code postal' },
  { cle: ['bio'], label: 'Présentation' },
  { cle: ['avatarUrl', 'avatar_url', 'avatar'], label: 'Photo de profil' },
];

function lireChamp(user, cles) {
  for (const c of cles) {
    if (user && user[c]) return user[c];
  }
  return null;
}

function calculerCompletude(user) {
  if (!user) return 0;
  const remplis = CHAMPS_PROFIL.filter(({ cle }) => lireChamp(user, cle)).length;
  return Math.round((remplis / CHAMPS_PROFIL.length) * 100);
}

function nommerCitoyen(user) {
  const prenom = lireChamp(user, ['firstName', 'first_name']);
  if (prenom) return prenom;
  if (user?.email) return user.email.split('@')[0];
  return 'Citoyen';
}

export default function CentreControle() {
  const { user, logout, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="centre-controle-etat" aria-live="polite">
        Chargement…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const completude = calculerCompletude(user);
  const champsManquants = CHAMPS_PROFIL.filter(
    ({ cle }) => !lireChamp(user, cle)
  );

  return (
    <div className="centre-controle">
      <header className="centre-controle-header">
        <div className="centre-controle-bienvenue">
          <p className="centre-controle-eyebrow">Centre de contrôle</p>
          <h1 className="centre-controle-salutation">
            Bonjour, {nommerCitoyen(user)}.
          </h1>
          <p className="centre-controle-intro">
            Vous êtes au cœur de votre engagement civique.
            Vos actions, vos publications, votre réseau — rassemblés ici.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="centre-controle-deconnexion"
        >
          Se déconnecter
        </button>
      </header>

      <section className="centre-controle-section centre-controle-jauge-section">
        <div className="centre-controle-jauge">
          <div className="centre-controle-jauge-entete">
            <h2 className="centre-controle-section-titre">Votre profil</h2>
            <span className="centre-controle-jauge-pourcent">
              {completude}%
            </span>
          </div>
          <div className="centre-controle-jauge-barre" aria-hidden="true">
            <div
              className="centre-controle-jauge-progression"
              style={{ width: `${completude}%` }}
            />
          </div>
          {champsManquants.length > 0 ? (
            <p className="centre-controle-jauge-meta">
              Il vous reste {champsManquants.length} champ
              {champsManquants.length > 1 ? 's' : ''} à compléter
              {' : '}
              <span className="centre-controle-jauge-champs">
                {champsManquants.map((c) => c.label).join(', ').toLowerCase()}.
              </span>
            </p>
          ) : (
            <p className="centre-controle-jauge-meta">
              Votre profil est complet. Merci d’être avisé.
            </p>
          )}
        </div>
      </section>

      <section className="centre-controle-section">
        <h2 className="centre-controle-section-titre">Vos publications</h2>
        <div className="centre-controle-placeholder">
          <p className="centre-controle-placeholder-titre">
            Le mur personnel arrive bientôt.
          </p>
          <p>
            Vous pourrez y partager vos analyses civiques, vos lectures de
            documents officiels, vos questions à vos élus.
            Seuls vos amis civiques verront vos publications.
          </p>
        </div>
      </section>

      <section className="centre-controle-section">
        <h2 className="centre-controle-section-titre">Vos amis civiques</h2>
        <div className="centre-controle-placeholder">
          <p className="centre-controle-placeholder-titre">
            Le réseau civique arrive bientôt.
          </p>
          <p>
            Vous pourrez vous abonner à d’autres citoyens engagés, suivre
            leurs analyses et leurs actions, et constituer votre cercle
            civique. Aucun algorithme — vous décidez à qui vous prêtez attention.
          </p>
        </div>
      </section>

      <section className="centre-controle-section">
        <h2 className="centre-controle-section-titre">Vos actions disponibles</h2>
        <ul className="centre-controle-actions-liste">
          <li>
            <Link to="/petitions" className="centre-controle-action">
              <span className="centre-controle-action-titre">
                Vos pétitions
              </span>
              <span className="centre-controle-action-meta">
                Consultez les pétitions ouvertes et celles que vous avez signées
              </span>
            </Link>
          </li>
          <li>
            <Link to="/elus" className="centre-controle-action">
              <span className="centre-controle-action-titre">
                Vos élus
              </span>
              <span className="centre-controle-action-meta">
                Consultez les fiches des 449 élus fédéraux
              </span>
            </Link>
          </li>
          <li>
            <Link to="/petitions/create" className="centre-controle-action">
              <span className="centre-controle-action-titre">
                Créer une pétition
              </span>
              <span className="centre-controle-action-meta">
                Lancez votre propre pétition civique
              </span>
            </Link>
          </li>
          <li>
            <Link to="/carte" className="centre-controle-action">
              <span className="centre-controle-action-titre">
                La carte civique
              </span>
              <span className="centre-controle-action-meta">
                Explorez les enjeux et les acteurs près de chez vous
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
