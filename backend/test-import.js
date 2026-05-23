import fs from 'fs';
import sequelize from './src/db/sequelize.js';
import './src/models/index.js';
import { syncFromCsv } from './src/services/electoralSync.js';

const csvContent = fs.readFileSync('./data/federal-extras.csv', 'utf8');

const result = await syncFromCsv(csvContent, {
  niveau: 'fédéral',
  legislature: '45',
  dryRun: true,
  autoMarkSortant: false,
});

console.log('=== Result ===');
console.log(`created: ${result.created}`);
console.log(`updated: ${result.updated}`);
console.log(`errors: ${result.errors?.length || 0}`);

if (result.preview) {
  console.log(`\n=== Preview ===`);
  console.log(`to_create: ${result.preview.to_create.length}`);
  console.log(`to_update: ${result.preview.to_update.length}`);
  console.log(`to_mark_sortant: ${result.preview.to_mark_sortant.length}`);
  
  console.log(`\nFirst 3 to_create:`);
  result.preview.to_create.slice(0, 3).forEach((item, i) => {
    console.log(`  [${i}] ${item.nom} (${item.titre}, ${item.region})`);
  });
}

if (result.errors && result.errors.length > 0) {
  console.log(`\nErrors:`);
  result.errors.slice(0, 5).forEach((e) => {
    console.log(`  - ${e.nom}: ${e.message}`);
  });
}

process.exit(0);
