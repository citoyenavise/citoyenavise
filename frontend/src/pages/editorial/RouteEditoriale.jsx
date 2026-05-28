import { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PageEditoriale from '../../components/editorial/PageEditoriale';
import {
  chargerPage,
  getManifest,
} from '../../lib/contentLoader';
import './RouteEditoriale.css';

/**
 * RouteEditoriale — charge dynamiquement une page éditoriale .md
 * et la rend via le composant PageEditoriale.
 *
 * Gère :
 *   /:categorie/:slugPage
 *   /:categorie/:sousCategorie/:slugPage
 */
export default function RouteEditoriale() {
  const { categorie, sousCategorie, slugPage } = useParams();
  const [page, setPage] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreur(null);
    chargerPage(categorie, sousCategorie, slugPage)
      .then((p) => {
        if (!actif) return;
        if (!p) {
          setErreur('Page introuvable');
          setPage(null);
        } else {
          setPage(p);
        }
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
  }, [categorie, sousCategorie, slugPage]);

  if (chargement) {
    return (
      <div className="route-editoriale-etat" aria-live="polite">
        Chargement…
      </div>
    );
  }

  if (erreur || !page) {
    return <Navigate to="/" replace />;
  }

  return <PageEditoriale page={page} manifest={getManifest()} />;
}
