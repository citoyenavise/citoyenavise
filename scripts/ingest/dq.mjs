#!/usr/bin/env node
// dq.mjs — utilitaire d'ingestion Données Québec (portail CKAN)
// Canal de téléchargement RÉEL : découverte via API CKAN (fetch) + téléchargement via curl.
// Conforme à REGLES_INGESTION.md : ne consulte que des sources officielles, ne transforme rien,
// télécharge brut. La validation/classement reste manuelle (PASS 2).
//
// Usage :
//   node scripts/ingest/dq.mjs search "<requête>"            → liste les datasets correspondants
//   node scripts/ingest/dq.mjs show <dataset-id>             → liste les ressources (nom, format, url)
//   node scripts/ingest/dq.mjs get <dataset-id> <FORMAT> [outdir]
//                                                            → télécharge (curl) chaque ressource du
//                                                              format demandé dans outdir (défaut data/geo)
//
// Exemples :
//   node scripts/ingest/dq.mjs search "régions administratives"
//   node scripts/ingest/dq.mjs show territoire-administratif
//   node scripts/ingest/dq.mjs get decoupage-municipal GeoJSON data/geo

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const API = 'https://www.donneesquebec.ca/recherche/api/3/action';

async function ckan(action, params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/${action}?${qs}`, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`CKAN ${action} → HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(`CKAN ${action} → success:false`);
  return json.result;
}

function slug(s) {
  return (s || 'ressource').normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

async function cmdSearch(query) {
  const r = await ckan('package_search', { q: query, rows: 12 });
  console.log(`${r.count} dataset(s) — top ${r.results.length} :\n`);
  for (const p of r.results) {
    const fmts = [...new Set((p.resources || []).map((x) => x.format).filter(Boolean))].join(', ');
    console.log(`# ${p.name}\n  ${p.title}\n  formats: ${fmts}\n`);
  }
}

async function cmdShow(id) {
  const r = await ckan('package_show', { id });
  const res = r.resources || [];
  console.log(`${r.title} — ${res.length} ressource(s) :\n`);
  for (const x of res) {
    console.log(`- [${(x.format || '?').toUpperCase()}] ${x.name || '(sans nom)'}\n  ${x.url}`);
  }
}

async function cmdGet(id, format, outdir = 'data/geo') {
  const r = await ckan('package_show', { id });
  const want = (format || '').toUpperCase();
  const res = (r.resources || []).filter((x) => (x.format || '').toUpperCase() === want);
  if (!res.length) {
    console.log(`Aucune ressource au format ${want} dans "${id}".`);
    process.exit(2);
  }
  mkdirSync(outdir, { recursive: true });
  let ok = 0;
  for (const x of res) {
    const ext = want.toLowerCase().replace('geojson', 'geojson').replace('shp', 'zip');
    const out = join(outdir, `${id}__${slug(x.name)}.${ext}`);
    process.stdout.write(`↓ ${x.name || x.url}\n  → ${out} ... `);
    const c = spawnSync('curl', ['-s', '-L', '-m', '300', '-o', out, '-w', '%{http_code}|%{size_download}', x.url], { encoding: 'utf8' });
    const [code, size] = (c.stdout || '').split('|');
    if (code === '200' && Number(size) > 0) { console.log(`OK (${size} octets)`); ok += 1; }
    else { console.log(`ÉCHEC (HTTP ${code || '?'}) → à signaler INBOX`); }
  }
  console.log(`\n${ok}/${res.length} téléchargé(s) dans ${outdir}/`);
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'search') await cmdSearch(args.join(' '));
  else if (cmd === 'show') await cmdShow(args[0]);
  else if (cmd === 'get') await cmdGet(args[0], args[1], args[2]);
  else { console.log('Usage: search "<q>" | show <id> | get <id> <FORMAT> [outdir]'); process.exit(1); }
} catch (e) {
  console.error('ERREUR:', e.message);
  process.exit(1);
}
