import { Link } from 'react-router-dom';
import './PagesConnexes.css';

/**
 * PagesConnexes — affiche la liste des wikilinks d'une page éditoriale.
 *
 * Reçoit en props un tableau de slugs (extraits par sync-content.mjs).
 * Tente de les résoudre vers une route React Router via le manifest.
 *
 * Props :
 *   wikilinks — tableau de chaînes (slugs PHOENIX)
 *   manifest — _manifest.json chargé (pour résolution)
 *   titre — optionnel, défaut « Pages connexes »
 */

function resoudreSlug(slug, manifest) {
  if (!manifest || !manifest.categories) return null;
  for (const [nomCat, cat] of Object.entries(manifest.categories)) {
    if (cat.hub && cat.hub.filename === slug) {
      return { categorie: nomCat, slug: cat.slug, titre: cat.hub.title, isHub: true };
    }
    const page = cat.pages.find((p) => p.filename === slug);
    if (page) {
      return { categorie: nomCat, slug: page.slug, titre: page.title, isHub: false };
    }
    for (const [nomSub, sub] of Object.entries(cat.subcategories || {})) {
      if (sub.hub && sub.hub.filename === slug) {
        return {
          categorie: nomCat,
          sousCategorie: nomSub,
          slug: sub.slug,
          titre: sub.hub.title,
          isHub: true,
        };
      }
      const subPage = (sub.pages || []).find((p) => p.filename === slug);
      if (subPage) {
        return {
          categorie: nomCat,
          sousCategorie: nomSub,
          slug: subPage.slug,
          titre: subPage.title,
          isHub: false,
        };
      }
    }
  }
  return null;
}

function categorieEnSlug(cat) {
  return cat.toLowerCase();
}

export default function PagesConnexes({
  wikilinks,
  manifest,
  titre = 'Pages connexes',
}) {
  if (!Array.isArray(wikilinks) || wikilinks.length === 0) return null;

  const resolues = wikilinks
    .map((wl) => ({ slug: wl, resolve: resoudreSlug(wl, manifest) }))
    .filter((x) => x.resolve);

  if (resolues.length === 0) return null;

  return (
    <aside className="pages-connexes" aria-labelledby="pages-connexes-titre">
      <h3 id="pages-connexes-titre" className="pages-connexes-titre">
        {titre}
      </h3>
      <ul className="pages-connexes-liste">
        {resolues.map(({ slug, resolve }) => {
          const baseRoute = `/${categorieEnSlug(resolve.categorie)}`;
          const sousRoute = resolve.sousCategorie
            ? `/${categorieEnSlug(resolve.sousCategorie)}`
            : '';
          const finRoute = resolve.isHub ? '' : `/${resolve.slug}`;
          const route = `${baseRoute}${sousRoute}${finRoute}`;
          return (
            <li key={slug} className="pages-connexes-item">
              <Link to={route} className="pages-connexes-lien">
                {resolve.titre}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
