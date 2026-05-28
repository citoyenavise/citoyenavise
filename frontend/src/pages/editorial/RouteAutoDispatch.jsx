import { useParams, Navigate } from 'react-router-dom';
import RouteHub from './RouteHub';
import RouteEditoriale from './RouteEditoriale';
import {
  trouverCategorieParSlug,
  trouverSousCategorieParSlug,
} from '../../lib/contentLoader';

/**
 * RouteAutoDispatch — résout l'ambiguïté entre /:categorie/:sousCategorie
 * (hub de sous-catégorie) et /:categorie/:slugPage (page éditoriale).
 *
 * Au runtime, on regarde le manifest pour déterminer si le second segment
 * est une sous-catégorie connue. Si oui, on rend RouteHub. Sinon, on
 * suppose que c'est une page et on rend RouteEditoriale.
 *
 * URL d'entrée : /:categorie/:second
 *   - second = nom de sous-catégorie → RouteHub
 *   - second = slug de page         → RouteEditoriale
 *   - aucun match                    → Navigate vers /
 */
export default function RouteAutoDispatch() {
  const { categorie, second } = useParams();

  const cat = trouverCategorieParSlug(categorie);
  if (!cat) return <Navigate to="/" replace />;

  const sousCat = trouverSousCategorieParSlug(cat, second);
  if (sousCat) {
    return <RouteHub forceCategorie={categorie} forceSousCategorie={second} />;
  }

  const page = (cat.pages || []).find((p) => p.slug === second);
  if (page) {
    return (
      <RouteEditoriale forceCategorie={categorie} forceSlugPage={second} />
    );
  }

  return <Navigate to="/" replace />;
}
