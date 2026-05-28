import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Tampon, { parseStatuts } from './Tampon';
import {
  transformerWikilinks,
  retirerEnTete,
  resoudreWikilink,
} from '../../lib/markdown';
import './PageHub.css';

/**
 * PageHub — Gabarit de page « hub catégorie ».
 *
 * Affiche une catégorie ou sous-catégorie : présentation textuelle (markdown
 * du _hub.md) + grille des pages enfants (cartes cliquables).
 *
 * Props :
 *   hub — { titre, contenu, statuts, aJour } (le _hub.md parsé)
 *   pages — tableau des pages enfants (depuis manifest)
 *   sousCategories — optionnel, tableau de sous-catégories à afficher
 *   manifest — _manifest.json (pour résolution wikilinks)
 *   baseRoute — route préfixe (ex: '/droits-libertes' ou '/services/sante')
 */

function genererLien(manifest) {
  return function Lien({ href, children, ...rest }) {
    if (typeof href === 'string' && href.startsWith('wikilink:')) {
      const slug = href.replace('wikilink:', '');
      const cible = resoudreWikilink(slug, manifest);
      if (cible) {
        return (
          <Link to={cible.route} className="wikilink wikilink-resolu">
            {children}
          </Link>
        );
      }
      return (
        <span
          className="wikilink wikilink-non-resolu"
          title={`Lien interne non résolu : ${slug}`}
        >
          {children}
        </span>
      );
    }
    if (typeof href === 'string' && /^https?:|^mailto:/.test(href)) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
          {children}
        </a>
      );
    }
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
}

export default function PageHub({
  hub,
  pages = [],
  sousCategories = [],
  manifest,
  baseRoute = '',
}) {
  const contenuPrepare = useMemo(
    () => transformerWikilinks(retirerEnTete(hub?.contenu || hub?.title || '')),
    [hub]
  );

  const tampons = parseStatuts(hub?.statuts);
  const Lien = useMemo(() => genererLien(manifest), [manifest]);

  return (
    <article className="page-hub">
      <header className="page-hub-header">
        <h1 className="page-hub-titre">{hub?.title || hub?.titre || 'Catégorie'}</h1>
        <div className="page-hub-meta">
          {tampons.map((type) => (
            <Tampon key={type} type={type} />
          ))}
          {hub?.aJour && <Tampon type="a-jour" date={hub.aJour} />}
        </div>
      </header>

      {contenuPrepare && (
        <section className="page-hub-presentation">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{ a: Lien }}
          >
            {contenuPrepare}
          </ReactMarkdown>
        </section>
      )}

      {sousCategories.length > 0 && (
        <section className="page-hub-section">
          <h2 className="page-hub-section-titre">Sous-catégories</h2>
          <ul className="page-hub-grille">
            {sousCategories.map((sc) => (
              <li key={sc.slug} className="page-hub-carte">
                <Link to={`${baseRoute}/${sc.slug}`} className="page-hub-carte-lien">
                  <h3 className="page-hub-carte-titre">
                    {sc.hub?.title || sc.slug}
                  </h3>
                  <span className="page-hub-carte-meta">
                    {(sc.pages?.length || 0)} pages
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pages.length > 0 && (
        <section className="page-hub-section">
          <h2 className="page-hub-section-titre">Pages</h2>
          <ul className="page-hub-grille">
            {pages.map((p) => (
              <li key={p.slug} className="page-hub-carte">
                <Link to={`${baseRoute}/${p.slug}`} className="page-hub-carte-lien">
                  <h3 className="page-hub-carte-titre">{p.title}</h3>
                  {p.statut && p.statut.length > 0 && (
                    <div className="page-hub-carte-tampons">
                      {parseStatuts(p.statut).slice(0, 2).map((type) => (
                        <Tampon key={type} type={type} />
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
