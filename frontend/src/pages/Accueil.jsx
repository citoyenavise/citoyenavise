import { Link } from 'react-router-dom';
import { listerCategories } from '../lib/contentLoader';
import './Accueil.css';

const ORDRE_CATEGORIES = [
  'Droits-Libertes',
  'Gouvernement',
  'Elections',
  'Services',
  'Participer',
  'Ressources',
];

export default function Accueil() {
  const toutes = listerCategories();
  const categoriesOrdonnees = ORDRE_CATEGORIES
    .map((nom) => toutes.find((c) => c.nom === nom))
    .filter(Boolean);

  return (
    <div className="accueil">
      <section className="accueil-hero" aria-label="Présentation">
        <p className="accueil-eyebrow">Plateforme civique canadienne</p>
        <h1 className="accueil-slogan">
          Citoyen avisé = plus fort.
          <br />
          Unis = inbattable.
        </h1>
        <p className="accueil-intro">
          Toute l’information civique canadienne, rassemblée. Vos droits, vos élus,
          vos services publics — sources officielles, sans publicité, sans partisanerie.
        </p>
        <div className="accueil-actions-principales">
          <Link to="/carte" className="accueil-action accueil-action-primaire">
            Explorer la carte
          </Link>
          <Link to="/elus" className="accueil-action accueil-action-secondaire">
            Trouver mon élu
          </Link>
        </div>
      </section>

      <section className="accueil-categories" aria-labelledby="accueil-categories-titre">
        <h2 id="accueil-categories-titre" className="accueil-categories-titre">
          Explorer par catégorie
        </h2>
        <ul className="accueil-categories-grille">
          {categoriesOrdonnees.map((c) => (
            <li key={c.slug} className="accueil-categorie">
              <Link
                to={`/${c.nom.toLowerCase()}`}
                className="accueil-categorie-lien"
              >
                <h3 className="accueil-categorie-titre-carte">{c.titre}</h3>
                <span className="accueil-categorie-meta">
                  {c.pageCount} page{c.pageCount > 1 ? 's' : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="accueil-conclusion">
        <p className="accueil-conclusion-texte">
          Citoyen Avisé est gratuit, indépendant et non partisan.
          Notre mission&nbsp;: rendre l’information civique accessible à tous les Canadiens.
        </p>
      </section>
    </div>
  );
}
