/**
 * lib/territoireLoader.js
 *
 * Charge les fiches territoire (.md) bundlées dans frontend/src/territoires/.
 * Découplé du système éditorial (content/ + sync-content) : ces fiches vivent
 * dans le dépôt et ne sont pas régénérées depuis PHOENIX.
 */

const modules = import.meta.glob('../territoires/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function titreDe(md) {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : 'Territoire';
}

const index = Object.entries(modules).map(([chemin, raw]) => {
  const slug = chemin.split('/').pop().replace(/\.md$/, '').toLowerCase();
  return { slug, titre: titreDe(raw), contenu: raw };
});

export function listerTerritoires() {
  return index
    .map(({ slug, titre }) => ({ slug, titre }))
    .sort((a, b) => a.titre.localeCompare(b.titre, 'fr'));
}

export function chargerTerritoire(slug) {
  if (!slug) return null;
  const t = index.find((x) => x.slug === slug.toLowerCase());
  return t ? t.contenu : null;
}
