/**
 * ElectoralSyncService
 * Phase G.2 - Lot 13 : synchronisation des élus depuis sources officielles
 *
 * Sources supportées :
 *   - ourcommons      : Chambre des communes XML (officiel)
 *   - openparliament  : openparliament.ca JSON
 *   - sencanada       : Sénat (CSV à fournir, pas d'API publique stable)
 *   - csv             : Import CSV générique
 *
 * Stratégie : fetch → normalize → diff → apply (avec audit auditSource).
 */

import { XMLParser } from 'fast-xml-parser';
import Elu from '../models/Elu.js';
import Mandat from '../models/Mandat.js';

const USER_AGENT = 'citoyenavise.org/1.0 (+infocitoyenavise@gmail.com)';

// ═══════════════════════════════════════════════════════════════════
// Normalisations (codes ISO → français, partis anglais → français)
// ═══════════════════════════════════════════════════════════════════

const REGIONS_MAP = {
  AB: 'Alberta',
  BC: 'Colombie-Britannique',
  MB: 'Manitoba',
  NB: 'Nouveau-Brunswick',
  NL: 'Terre-Neuve-et-Labrador',
  NS: 'Nouvelle-Écosse',
  NT: 'Territoires du Nord-Ouest',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Île-du-Prince-Édouard',
  QC: 'Québec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
};

const PARTIS_MAP = {
  Liberal: 'Parti libéral du Canada',
  Conservative: 'Parti conservateur du Canada',
  Bloc: 'Bloc québécois',
  NDP: 'Nouveau Parti démocratique',
  Green: 'Parti vert',
  Independent: 'Indépendant',
  'Non affilié': 'Indépendant',
};

function normalizeRegion(r) {
  if (!r) return r;
  return REGIONS_MAP[r] || r;
}

function normalizeParti(p) {
  if (!p) return p;
  return PARTIS_MAP[p] || p;
}

// ═══════════════════════════════════════════════════════════════════
// Adaptateur : OurCommons (députés fédéraux — XML officiel)
// ═══════════════════════════════════════════════════════════════════

async function fetchOurCommons() {
  const url = 'https://www.ourcommons.ca/Members/en/search/xml';
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    throw new Error(`OurCommons HTTP ${res.status}`);
  }
  const xml = await res.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });
  const data = parser.parse(xml);

  const members = data?.ArrayOfMemberOfParliament?.MemberOfParliament || [];
  const list = Array.isArray(members) ? members : [members];

  return list.map((m) => ({
    sourceKey: `ourcommons:${m.PersonShortHonorific || ''}:${m.PersonOfficialFirstName} ${m.PersonOfficialLastName}`,
    nom: `${m.PersonOfficialFirstName || ''} ${m.PersonOfficialLastName || ''}`.trim(),
    titre: 'Député',
    niveau: 'fédéral',
    partiPolitique: normalizeParti(m.CaucusShortName || null),
    region: normalizeRegion(m.ConstituencyProvinceTerritoryName || m.ProvinceTerritoryName || null),
    legislature: '45',
    statut: 'actif',
    sourceUrl: m.HonorificTitle ? `https://www.ourcommons.ca/Members/en/${(m.PersonOfficialFirstName || '').toLowerCase()}-${(m.PersonOfficialLastName || '').toLowerCase()}` : null,
    circonscriptionNom: m.ConstituencyName || null,
    _raw: m,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Adaptateur : openparliament.ca (députés fédéraux — JSON)
// ═══════════════════════════════════════════════════════════════════

async function fetchOpenParliament(limit = 400) {
  const url = `https://api.openparliament.ca/politicians/?limit=${limit}&current=true&format=json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'API-Version': 'v1' },
  });
  if (!res.ok) {
    throw new Error(`openparliament HTTP ${res.status}`);
  }
  const data = await res.json();
  const objects = data?.objects || [];

  return objects.map((p) => ({
    sourceKey: `openparl:${p.url}`,
    nom: p.name || '',
    titre: 'Député',
    niveau: 'fédéral',
    partiPolitique: normalizeParti(p.current_party?.short_name?.en || p.current_party?.name?.en || null),
    region: normalizeRegion(p.current_riding?.province || null),
    legislature: '45',
    statut: 'actif',
    sourceUrl: p.url ? `https://openparliament.ca${p.url}` : null,
    circonscriptionNom: p.current_riding?.name?.en || null,
    photoUrl: p.image ? `https://openparliament.ca${p.image}` : null,
    _raw: p,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Adaptateur : CSV générique (sénateurs, ministres, juges, etc.)
// ═══════════════════════════════════════════════════════════════════

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length !== headers.length) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx]?.trim() || null;
    });
    rows.push(obj);
  }
  return rows;
}

function splitCsvLine(line) {
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && line[i + 1] === '"') {
      current += '"';
      i++;
    } else if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  cols.push(current);
  return cols;
}

/**
 * Format CSV attendu (entêtes obligatoires) :
 *   nom,titre,niveau,parti_politique,region,legislature,statut,
 *   email,telephone,site_web,photo_url,source_url
 */
function fetchCsv(csvContent) {
  const rows = parseCsv(csvContent);
  return rows.map((r, i) => ({
    sourceKey: `csv:${r.nom}:${r.titre}:${i}`,
    nom: r.nom,
    titre: r.titre,
    niveau: r.niveau,
    partiPolitique: r.parti_politique || null,
    region: r.region || null,
    legislature: r.legislature || null,
    statut: r.statut || 'actif',
    email: r.email || null,
    telephone: r.telephone || null,
    siteWeb: r.site_web || null,
    photoUrl: r.photo_url || null,
    sourceUrl: r.source_url || null,
    _raw: r,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// Diff : compare snapshot source vs base de données
// ═══════════════════════════════════════════════════════════════════

async function diffWithDatabase(fetched, { niveau = 'fédéral', legislature = '45' } = {}) {
  const existing = await Elu.findAll({
    where: { niveau, statut: 'actif' },
    attributes: [
      'id',
      'nom',
      'titre',
      'partiPolitique',
      'region',
      'legislature',
      'statut',
      'sourceUrl',
    ],
  });

  const existingByName = new Map();
  existing.forEach((e) => {
    existingByName.set(normalizeName(e.nom), e);
  });

  const fetchedByName = new Map();
  fetched.forEach((f) => {
    fetchedByName.set(normalizeName(f.nom), f);
  });

  const toCreate = [];
  const toUpdate = [];
  const toMarkSortant = [];

  for (const [key, f] of fetchedByName) {
    const e = existingByName.get(key);
    if (!e) {
      toCreate.push(f);
    } else {
      const diff = computeDiff(e, f);
      if (Object.keys(diff).length > 0) {
        toUpdate.push({ existing: e, changes: diff, fetched: f });
      }
    }
  }

  for (const [key, e] of existingByName) {
    if (!fetchedByName.has(key)) {
      toMarkSortant.push(e);
    }
  }

  return { toCreate, toUpdate, toMarkSortant };
}

function normalizeName(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const CHAMPS_DIFFABLES = [
  'titre',
  'partiPolitique',
  'region',
  'legislature',
  'sourceUrl',
];

function computeDiff(existing, fetched) {
  const diff = {};
  for (const champ of CHAMPS_DIFFABLES) {
    const a = existing[champ] || null;
    const b = fetched[champ] || null;
    if (a !== b && b) diff[champ] = b;
  }
  return diff;
}

// ═══════════════════════════════════════════════════════════════════
// Apply : applique les changements avec audit
// ═══════════════════════════════════════════════════════════════════

async function applyChanges(
  plan,
  {
    source = 'sync_ourcommons',
    userId = null,
    dryRun = false,
    autoMarkSortant = false,
  } = {}
) {
  const auditOpts = (details) => ({
    auditSource: source,
    auditUserId: userId,
    auditDetails: details,
  });

  const result = {
    created: 0,
    updated: 0,
    marked_sortant: 0,
    errors: [],
    dryRun,
  };

  if (dryRun) {
    result.preview = {
      to_create: plan.toCreate.map((f) => ({ nom: f.nom, titre: f.titre, region: f.region })),
      to_update: plan.toUpdate.map((u) => ({
        id: u.existing.id,
        nom: u.existing.nom,
        changes: u.changes,
      })),
      to_mark_sortant: plan.toMarkSortant.map((e) => ({ id: e.id, nom: e.nom })),
    };
    return result;
  }

  // Création nouveaux élus
  for (const f of plan.toCreate) {
    try {
      const elu = await Elu.create(
        {
          nom: f.nom,
          titre: f.titre,
          poste: f.poste || null,
          partiPolitique: f.partiPolitique,
          region: f.region || 'À renseigner',
          niveau: f.niveau,
          legislature: f.legislature,
          statut: 'actif',
          email: f.email || null,
          telephone: f.telephone || null,
          siteWeb: f.siteWeb || null,
          photoUrl: f.photoUrl || null,
          sourceUrl: f.sourceUrl || null,
          sourceDerniereMaj: new Date(),
          mandatDebut: f.mandatDebut || null,
        },
        auditOpts({ source_key: f.sourceKey })
      );

      // Création du mandat associé
      await Mandat.create(
        {
          eluId: elu.id,
          titre: f.titre,
          partiPolitique: f.partiPolitique,
          niveau: f.niveau,
          region: f.region || null,
          legislature: f.legislature,
          dateDebut: f.mandatDebut || new Date().toISOString().slice(0, 10),
          estActuel: true,
          source: source,
          sourceUrl: f.sourceUrl || null,
        },
        auditOpts({ source_key: f.sourceKey })
      );

      result.created += 1;
    } catch (err) {
      result.errors.push({ nom: f.nom, op: 'create', message: err.message });
    }
  }

  // Mise à jour élus existants
  for (const u of plan.toUpdate) {
    try {
      await u.existing.update(
        { ...u.changes, sourceDerniereMaj: new Date() },
        auditOpts({ source_key: u.fetched.sourceKey })
      );
      result.updated += 1;
    } catch (err) {
      result.errors.push({ id: u.existing.id, op: 'update', message: err.message });
    }
  }

  // Passage en 'sortant' (uniquement si autoMarkSortant)
  if (autoMarkSortant) {
    for (const e of plan.toMarkSortant) {
      try {
        await e.update(
          { statut: 'sortant', sourceDerniereMaj: new Date() },
          auditOpts({ raison: 'absent_de_la_source' })
        );
        // Fermer mandat actuel
        await Mandat.update(
          { estActuel: false, dateFin: new Date().toISOString().slice(0, 10), causeFin: 'fin_mandat' },
          {
            where: { eluId: e.id, estActuel: true },
            ...auditOpts({ raison: 'sync_absent_de_la_source' }),
          }
        );
        result.marked_sortant += 1;
      } catch (err) {
        result.errors.push({ id: e.id, op: 'mark_sortant', message: err.message });
      }
    }
  } else {
    result.skipped_sortant = plan.toMarkSortant.length;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// Façade publique
// ═══════════════════════════════════════════════════════════════════

const SOURCES_MAP = {
  ourcommons: { fetch: fetchOurCommons, auditSource: 'sync_ourcommons' },
  openparliament: { fetch: fetchOpenParliament, auditSource: 'sync_openparl' },
};

/**
 * Sync depuis une source officielle.
 * @param {string} source - 'ourcommons' | 'openparliament'
 * @param {Object} opts - { dryRun, autoMarkSortant, userId }
 */
export async function syncFromSource(source, opts = {}) {
  const config = SOURCES_MAP[source];
  if (!config) {
    throw new Error(`Source inconnue : ${source}. Valides : ${Object.keys(SOURCES_MAP).join(', ')}`);
  }

  const fetched = await config.fetch();
  const plan = await diffWithDatabase(fetched, { niveau: 'fédéral', legislature: '45' });
  return applyChanges(plan, {
    source: config.auditSource,
    userId: opts.userId || null,
    dryRun: opts.dryRun || false,
    autoMarkSortant: opts.autoMarkSortant || false,
  });
}

/**
 * Sync depuis contenu CSV fourni.
 * @param {string} csvContent
 * @param {Object} opts - { niveau, legislature, dryRun, autoMarkSortant, userId }
 */
export async function syncFromCsv(csvContent, opts = {}) {
  const fetched = fetchCsv(csvContent);
  const niveau = opts.niveau || 'fédéral';
  const legislature = opts.legislature || '45';
  const plan = await diffWithDatabase(fetched, { niveau, legislature });
  return applyChanges(plan, {
    source: 'csv_import',
    userId: opts.userId || null,
    dryRun: opts.dryRun || false,
    autoMarkSortant: opts.autoMarkSortant || false,
  });
}

export default {
  syncFromSource,
  syncFromCsv,
};
