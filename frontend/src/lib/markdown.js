/**
 * lib/markdown.js
 *
 * Utilitaires de transformation du contenu markdown PHOENIX
 * pour rendu via react-markdown.
 */

/**
 * Convertit un texte (généralement un titre H2/H3) en slug d'ancre.
 * Gère diacritiques, ponctuation, espaces.
 */
export function slugifier(texte) {
  return String(texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Extrait les sections H2 d'un contenu markdown pour générer un TOC.
 * Retourne un tableau d'objets { id, titre } ordonnés.
 */
export function extraireSections(markdown) {
  const sections = [];
  const regex = /^##\s+(.+)$/gm;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    const titre = match[1].trim();
    sections.push({ id: slugifier(titre), titre });
  }
  return sections;
}

/**
 * Transforme les wikilinks PHOENIX [[Slug]] ou [[Slug|Alias affiché]]
 * en liens markdown standard avec préfixe `wikilink:` (résolus au rendu).
 *
 * Exemple :
 *   [[Charte-canadienne]]                  → [Charte-canadienne](wikilink:Charte-canadienne)
 *   [[Sources-methodologie|Méthodologie]]  → [Méthodologie](wikilink:Sources-methodologie)
 */
export function transformerWikilinks(markdown) {
  return markdown.replace(
    /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
    (_, slug, alias) => {
      const texte = (alias || slug).trim();
      return `[${texte}](wikilink:${slug.trim()})`;
    }
  );
}

/**
 * Retire le bloc d'en-tête (titre H1 + tampons + À jour + separator)
 * d'une page éditoriale PHOENIX, pour éviter le doublon avec le header
 * rendu par le composant PageEditoriale.
 */
export function retirerEnTete(markdown) {
  let sansEnTete = markdown.replace(/^#\s+.+\n+/m, '');
  sansEnTete = sansEnTete.replace(/^\*\*Statut\s*:\*\*[^\n]+\n+/m, '');
  sansEnTete = sansEnTete.replace(/^\*\*À\s+jour\s*:\*\*[^\n]+\n+/m, '');
  sansEnTete = sansEnTete.replace(/^---\n+/m, '');
  return sansEnTete.trimStart();
}

/**
 * Résolution d'un slug wikilink vers une route React Router via le manifest.
 * Retourne null si introuvable.
 */
export function resoudreWikilink(slug, manifest) {
  if (!manifest || !manifest.categories) return null;
  const cible = String(slug).trim();
  for (const [nomCat, cat] of Object.entries(manifest.categories)) {
    if (cat.hub && cat.hub.filename === cible) {
      return {
        route: `/${nomCat.toLowerCase()}`,
        titre: cat.hub.title,
        type: 'hub-categorie',
      };
    }
    const page = (cat.pages || []).find((p) => p.filename === cible);
    if (page) {
      return {
        route: `/${nomCat.toLowerCase()}/${page.slug}`,
        titre: page.title,
        type: 'page',
      };
    }
    for (const [nomSub, sub] of Object.entries(cat.subcategories || {})) {
      if (sub.hub && sub.hub.filename === cible) {
        return {
          route: `/${nomCat.toLowerCase()}/${nomSub.toLowerCase()}`,
          titre: sub.hub.title,
          type: 'hub-sous-categorie',
        };
      }
      const subPage = (sub.pages || []).find((p) => p.filename === cible);
      if (subPage) {
        return {
          route: `/${nomCat.toLowerCase()}/${nomSub.toLowerCase()}/${subPage.slug}`,
          titre: subPage.title,
          type: 'page',
        };
      }
    }
  }
  return null;
}
