import './TableContenus.css';

/**
 * TableContenus — Table des matières d'une page éditoriale.
 *
 * Affiche les sections principales détectées dans le contenu markdown
 * (synthèse 30s, essentiel 3 min, approfondir, faire la démarche, etc.).
 * Sticky sur grand écran, collapsible sur mobile.
 *
 * Props :
 *   sections — tableau d'objets { id, titre } (id = slug ancre)
 *   titre — optionnel, défaut « Sur cette page »
 */
export default function TableContenus({ sections, titre = 'Sur cette page' }) {
  if (!Array.isArray(sections) || sections.length === 0) return null;

  return (
    <nav className="table-contenus" aria-label="Table des matières">
      <h4 className="table-contenus-titre">{titre}</h4>
      <ol className="table-contenus-liste">
        {sections.map((s) => (
          <li key={s.id} className="table-contenus-item">
            <a href={`#${s.id}`} className="table-contenus-lien">
              {s.titre}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
