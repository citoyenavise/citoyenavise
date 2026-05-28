import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PageHub from '../../components/editorial/PageHub';
import {
  chargerPage,
  getManifest,
  trouverCategorieParSlug,
  trouverSousCategorieParSlug,
} from '../../lib/contentLoader';

/**
 * RouteHub — charge un hub de catégorie ou sous-catégorie et le rend
 * via PageHub avec ses pages enfants et sous-catégories.
 *
 * Gère :
 *   /:categorie
 *   /:categorie/:sousCategorie
 */
export default function RouteHub({ forceCategorie, forceSousCategorie } = {}) {
  const params = useParams();
  const categorie = forceCategorie ?? params.categorie;
  const sousCategorie = forceSousCategorie ?? params.sousCategorie;
  const [hub, setHub] = useState(null);
  const [pages, setPages] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [baseRoute, setBaseRoute] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreur(null);

    const cat = trouverCategorieParSlug(categorie);
    if (!cat) {
      setErreur('Catégorie introuvable');
      setChargement(false);
      return;
    }

    if (sousCategorie) {
      const sub = trouverSousCategorieParSlug(cat, sousCategorie);
      if (!sub) {
        setErreur('Sous-catégorie introuvable');
        setChargement(false);
        return;
      }
      setBaseRoute(`/${categorie}/${sousCategorie}`);
      setPages(sub.pages || []);
      setSousCategories([]);
    } else {
      setBaseRoute(`/${categorie}`);
      setPages(cat.pages || []);
      setSousCategories(Object.values(cat.subcategories || {}));
    }

    chargerPage(categorie, sousCategorie, undefined)
      .then((h) => {
        if (!actif) return;
        setHub(h);
        setChargement(false);
      })
      .catch((err) => {
        if (!actif) return;
        setErreur(err.message || 'Erreur de chargement');
        setChargement(false);
      });

    return () => {
      actif = false;
    };
  }, [categorie, sousCategorie]);

  if (chargement) {
    return (
      <div className="route-editoriale-etat" aria-live="polite">
        Chargement…
      </div>
    );
  }

  if (erreur || !hub) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageHub
      hub={hub}
      pages={pages}
      sousCategories={sousCategories}
      manifest={getManifest()}
      baseRoute={baseRoute}
    />
  );
}
