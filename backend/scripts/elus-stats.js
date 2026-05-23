/**
 * Script audit — statistiques table elus
 * Phase G.2 - Lot 14
 *
 * Usage : node scripts/elus-stats.js
 *
 * Affiche :
 *   - Répartition par titre
 *   - Répartition par niveau / statut
 *   - Répartition par parti politique (top 15)
 *   - Répartition par province / région (top 15)
 *   - Présence des champs critiques (email, photo, source_url, mandat_debut)
 */

import sequelize from '../src/db/sequelize.js';

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  AUDIT TABLE elus — citoyenavise.org');
  console.log('═══════════════════════════════════════════════════════════\n');

  const [total] = await sequelize.query('SELECT COUNT(*) AS c FROM elus');
  console.log(`Total élus en base : ${total[0].c}\n`);

  // === Par titre ===
  const [parTitre] = await sequelize.query(`
    SELECT titre, COUNT(*) AS c
    FROM elus
    GROUP BY titre
    ORDER BY c DESC
  `);
  console.log('─── Répartition par titre ───');
  console.table(parTitre);

  // === Par niveau + statut ===
  const [parNiveauStatut] = await sequelize.query(`
    SELECT niveau, statut, COUNT(*) AS c
    FROM elus
    GROUP BY niveau, statut
    ORDER BY niveau, statut
  `);
  console.log('─── Répartition par niveau × statut ───');
  console.table(parNiveauStatut);

  // === Par parti politique (top 15) ===
  const [parParti] = await sequelize.query(`
    SELECT COALESCE(parti_politique, '(non renseigné)') AS parti, COUNT(*) AS c
    FROM elus
    WHERE statut = 'actif'
    GROUP BY parti_politique
    ORDER BY c DESC
    LIMIT 15
  `);
  console.log('─── Top 15 partis politiques (actifs) ───');
  console.table(parParti);

  // === Par région (top 15) ===
  const [parRegion] = await sequelize.query(`
    SELECT region, COUNT(*) AS c
    FROM elus
    WHERE statut = 'actif'
    GROUP BY region
    ORDER BY c DESC
    LIMIT 15
  `);
  console.log('─── Top 15 régions (actifs) ───');
  console.table(parRegion);

  // === Complétude champs critiques ===
  const [completude] = await sequelize.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(email) AS avec_email,
      COUNT(photo_url) AS avec_photo,
      COUNT(source_url) AS avec_source,
      COUNT(mandat_debut) AS avec_mandat_debut,
      COUNT(parti_politique) AS avec_parti
    FROM elus
    WHERE statut = 'actif'
  `);
  console.log('─── Complétude des champs (élus actifs) ───');
  const c = completude[0];
  const t = parseInt(c.total, 10);
  console.table([
    { champ: 'email', renseigné: c.avec_email, pct: `${Math.round((c.avec_email / t) * 100)}%` },
    { champ: 'photo_url', renseigné: c.avec_photo, pct: `${Math.round((c.avec_photo / t) * 100)}%` },
    { champ: 'source_url', renseigné: c.avec_source, pct: `${Math.round((c.avec_source / t) * 100)}%` },
    { champ: 'mandat_debut', renseigné: c.avec_mandat_debut, pct: `${Math.round((c.avec_mandat_debut / t) * 100)}%` },
    { champ: 'parti_politique', renseigné: c.avec_parti, pct: `${Math.round((c.avec_parti / t) * 100)}%` },
  ]);

  // === Mandats actuels ===
  const [mandats] = await sequelize.query(`
    SELECT COUNT(*) AS total_mandats,
           COUNT(CASE WHEN est_actuel THEN 1 END) AS mandats_actuels
    FROM mandats
  `);
  console.log('─── Mandats ───');
  console.table(mandats);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Audit terminé.');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[elus-stats] ÉCHEC :', err.message);
    console.error(err.stack);
    process.exit(1);
  });
