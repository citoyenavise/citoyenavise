#!/usr/bin/env node
/**
 * sync-content.mjs
 *
 * Copie les pages éditoriales depuis PHOENIX/CONTENU/ vers frontend/src/content/
 * et génère un _manifest.json listant toutes les pages avec leurs métadonnées.
 *
 * Usage :
 *   npm run sync:content
 *
 * Variables d'env :
 *   PHOENIX_CONTENU_PATH — chemin source (défaut: C:\Users\Dave\PHOENIX\03_PROJETS\CITOYEN_AVISÉ\CONTENU)
 *
 * Mode Vercel cloud : si PHOENIX_CONTENU_PATH est inaccessible, le script
 * skip proprement (le contenu est déjà commité dans frontend/src/content/).
 *
 * Format attendu des .md (PHOENIX/CONTENU/) :
 *   # Titre
 *
 *   **Statut :** [VÉRIFIÉ] [PUBLIC]
 *   **À jour :** YYYY-MM-DD
 *
 *   ---
 *   ... contenu ...
 *   Wikilinks : [[Slug]] ou [[Slug|Alias affiché]]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE = 'C:\\Users\\Dave\\PHOENIX\\03_PROJETS\\CITOYEN_AVISÉ\\CONTENU';
const SOURCE_DIR = process.env.PHOENIX_CONTENU_PATH || DEFAULT_SOURCE;
const DEST_DIR = path.join(REPO_ROOT, 'frontend', 'src', 'content');
const MANIFEST_PATH = path.join(DEST_DIR, '_manifest.json');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function walkDir(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkDir(full)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function toSlug(filename) {
  return filename
    .replace(/\.md$/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseMarkdown(content, relPath) {
  const filename = path.basename(relPath, '.md');
  const slug = toSlug(filename);

  const h1Match = content.match(/^#\s+(.+)$/m);
  const title = h1Match ? h1Match[1].trim() : filename;

  const statutMatch = content.match(/\*\*Statut\s*:\*\*\s*((?:\[[^\]]+\]\s*)+)/);
  const statut = statutMatch
    ? [...statutMatch[1].matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].trim())
    : [];

  const aJourMatch = content.match(/\*\*À\s+jour\s*:\*\*\s*(\d{4}-\d{2}-\d{2})/);
  const aJour = aJourMatch ? aJourMatch[1] : null;

  const wikilinks = [
    ...new Set(
      [...content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map((m) =>
        m[1].trim()
      )
    ),
  ];

  const normalizedRel = relPath.split(path.sep).join('/');

  return {
    slug,
    filename,
    title,
    relativePath: normalizedRel,
    statut,
    aJour,
    wikilinks,
  };
}

async function emptyDestKeepManifest() {
  if (!(await exists(DEST_DIR))) return;
  const entries = await fs.readdir(DEST_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '_manifest.json') continue;
    const full = path.join(DEST_DIR, entry.name);
    await fs.rm(full, { recursive: true, force: true });
  }
}

async function main() {
  console.log('--- sync-content ---');
  console.log(`Source : ${SOURCE_DIR}`);
  console.log(`Dest   : ${DEST_DIR}`);

  if (!(await exists(SOURCE_DIR))) {
    console.log('');
    console.log('PHOENIX non monte (source introuvable). Sync skip.');
    console.log('Mode Vercel cloud : OK (contenu deja commite dans le repo).');
    return;
  }

  await fs.mkdir(DEST_DIR, { recursive: true });
  await emptyDestKeepManifest();

  const sourceFiles = await walkDir(SOURCE_DIR);
  console.log(`Trouve : ${sourceFiles.length} fichiers .md`);

  const manifest = {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    sourcePath: SOURCE_DIR,
    pageCount: 0,
    hubCount: 0,
    categoryCount: 0,
    categories: {},
  };

  const skippedFiles = [];

  for (const sourceFile of sourceFiles) {
    const relPath = path.relative(SOURCE_DIR, sourceFile);
    const parts = relPath.split(path.sep);

    if (parts.length < 2) {
      skippedFiles.push(relPath);
      continue;
    }

    const destPath = path.join(DEST_DIR, relPath);
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    const content = await fs.readFile(sourceFile, 'utf8');
    await fs.writeFile(destPath, content, 'utf8');

    const category = parts[0];

    if (!manifest.categories[category]) {
      manifest.categories[category] = {
        slug: toSlug(category),
        hub: null,
        pages: [],
        subcategories: {},
      };
      manifest.categoryCount++;
    }
    const cat = manifest.categories[category];

    const parsed = parseMarkdown(content, relPath);
    const isHub = parsed.filename === '_hub';

    if (parts.length === 2) {
      if (isHub) {
        cat.hub = parsed;
        manifest.hubCount++;
      } else {
        cat.pages.push(parsed);
      }
    } else {
      const subcat = parts[1];
      if (!cat.subcategories[subcat]) {
        cat.subcategories[subcat] = {
          slug: toSlug(subcat),
          hub: null,
          pages: [],
        };
      }
      if (isHub) {
        cat.subcategories[subcat].hub = parsed;
        manifest.hubCount++;
      } else {
        cat.subcategories[subcat].pages.push(parsed);
      }
    }
    manifest.pageCount++;
  }

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('');
  console.log('=== RESUME ===');
  console.log(`Pages copiees    : ${manifest.pageCount}`);
  console.log(`Hubs detectes    : ${manifest.hubCount}`);
  console.log(`Categories       : ${manifest.categoryCount}`);
  for (const [name, cat] of Object.entries(manifest.categories)) {
    const subCount = Object.keys(cat.subcategories).length;
    const pageCount = cat.pages.length;
    const subPagesCount = Object.values(cat.subcategories).reduce(
      (acc, s) => acc + s.pages.length,
      0
    );
    const total = pageCount + subPagesCount;
    console.log(
      `  - ${name.padEnd(20)} : ${String(total).padStart(3)} pages` +
        (subCount > 0 ? ` (dans ${subCount} sous-categories)` : '')
    );
  }
  if (skippedFiles.length > 0) {
    console.log('');
    console.log(`Skippes (racine, fichiers meta) : ${skippedFiles.length}`);
    for (const f of skippedFiles) console.log(`  - ${f}`);
  }
  console.log('');
  console.log(`Manifest : ${MANIFEST_PATH}`);
  console.log('OK.');
}

main().catch((err) => {
  console.error('Sync content failed:');
  console.error(err);
  process.exit(1);
});
