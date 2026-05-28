/**
 * lib/contentLoader.js
 *
 * Charge le manifest et les contenus markdown générés par sync-content.mjs.
 * Utilise Vite import.meta.glob pour bundle statique au build.
 */

import manifest from '../content/_manifest.json';

const modules = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
});

export function getManifest() {
  return manifest;
}

/**
 * Charge le contenu brut d'un fichier markdown via son chemin relatif
 * (tel qu'enregistré dans le manifest, ex: "Droits-Libertes/Charte-canadienne.md").
 *
 * Retourne une promesse qui résout vers le contenu raw du .md.
 * Retourne null si le fichier n'existe pas.
 */
export async function chargerContenu(cheminRelatif) {
  const cle = `../content/${cheminRelatif}`;
  if (!modules[cle]) return null;
  return modules[cle]();
}

/**
 * Trouve une page éditoriale dans le manifest par slug et catégorie/sous-catégorie.
 * Retourne un objet enrichi { ...page, contenu, statuts, aJour, wikilinks } ou null.
 */
export async function chargerPage(categorie, sousCategorie, slugPage) {
  const cat = trouverCategorieParSlug(categorie);
  if (!cat) return null;

  if (!sousCategorie) {
    if (slugPage === undefined || slugPage === null) {
      if (!cat.hub) return null;
      const contenu = await chargerContenu(cat.hub.relativePath);
      return assembler(cat.hub, contenu);
    }
    const page = (cat.pages || []).find((p) => p.slug === slugPage);
    if (!page) return null;
    const contenu = await chargerContenu(page.relativePath);
    return assembler(page, contenu);
  }

  const sub = trouverSousCategorieParSlug(cat, sousCategorie);
  if (!sub) return null;

  if (slugPage === undefined || slugPage === null) {
    if (!sub.hub) return null;
    const contenu = await chargerContenu(sub.hub.relativePath);
    return assembler(sub.hub, contenu);
  }
  const page = (sub.pages || []).find((p) => p.slug === slugPage);
  if (!page) return null;
  const contenu = await chargerContenu(page.relativePath);
  return assembler(page, contenu);
}

function assembler(meta, contenu) {
  return {
    titre: meta.title,
    contenu: contenu || '',
    statuts: meta.statut || [],
    aJour: meta.aJour,
    wikilinks: meta.wikilinks || [],
  };
}

export function trouverCategorieParSlug(slug) {
  if (!slug) return null;
  const cible = slug.toLowerCase();
  for (const [nom, cat] of Object.entries(manifest.categories)) {
    if (cat.slug === cible || nom.toLowerCase() === cible) {
      return { ...cat, nom };
    }
  }
  return null;
}

export function trouverSousCategorieParSlug(categorie, slug) {
  if (!categorie || !categorie.subcategories || !slug) return null;
  const cible = slug.toLowerCase();
  for (const [nom, sub] of Object.entries(categorie.subcategories)) {
    if (sub.slug === cible || nom.toLowerCase() === cible) {
      return { ...sub, nom };
    }
  }
  return null;
}

/**
 * Liste les catégories pour affichage dans la page d'accueil.
 */
export function listerCategories() {
  return Object.entries(manifest.categories || {}).map(([nom, cat]) => ({
    nom,
    slug: cat.slug,
    titre: cat.hub?.title || nom,
    pageCount:
      (cat.pages?.length || 0) +
      Object.values(cat.subcategories || {}).reduce(
        (acc, s) => acc + (s.pages?.length || 0),
        0
      ),
  }));
}
