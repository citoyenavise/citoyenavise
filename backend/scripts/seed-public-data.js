/**
 * Script de seed — Importer des données publiques d'exemple pour le PDE
 * Usage: node scripts/seed-public-data.js
 */

import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:5000/api/v1';

// Données d'exemple : Hôpitaux du Québec
const hospitalsSampleData = {
  dataset_name: 'hospitals_qc_2026',
  type: 'hospital',
  source_name: 'gouvernement.qc.ca',
  source_url: 'https://gouv.qc.ca/hospitals',
  description: 'Liste officielle des hôpitaux du Québec en 2026',
  reliability: 'verified',
  data: [
    {
      id: 'hosp_001',
      name: 'CHU Sainte-Justine',
      adresse: '3175 Chemin de la Côte-Sainte-Catherine',
      ville: 'Montreal',
      province: 'QC',
      code_postal: 'H3H 1P3',
      telephone: '(514) 345-4931',
      email: 'info@chusj.org',
      website: 'https://www.chusj.org',
      type: 'hospital',
      categorie: 'public',
      jurisdiction: 'provincial',
      services: ['emergency', 'pediatrics', 'surgery', 'oncology'],
      employees: 2500,
      capacity: 400,
      official_status: 'active',
    },
    {
      id: 'hosp_002',
      name: 'Royal Victoria Hospital',
      adresse: '687 Avenue des Pins Ouest',
      ville: 'Montreal',
      province: 'QC',
      code_postal: 'H3A 1A1',
      telephone: '(514) 842-1231',
      email: 'info@muhc.ca',
      website: 'https://www.muhc.ca',
      type: 'hospital',
      categorie: 'public',
      jurisdiction: 'provincial',
      services: ['emergency', 'general', 'research'],
      employees: 2200,
      capacity: 350,
      official_status: 'active',
    },
    {
      id: 'hosp_003',
      name: 'Hôpital Général Juif',
      adresse: '3755 Chemin de la Côte-Sainte-Catherine',
      ville: 'Montreal',
      province: 'QC',
      code_postal: 'H3T 1E2',
      telephone: '(514) 340-8222',
      email: 'info@jgh.ca',
      website: 'https://www.jgh.ca',
      type: 'hospital',
      categorie: 'public',
      jurisdiction: 'provincial',
      services: ['emergency', 'general', 'geriatric'],
      employees: 1800,
      capacity: 300,
      official_status: 'active',
    },
    {
      id: 'hosp_004',
      name: 'Hôpital Maisonneuve-Rosemont',
      adresse: '5415 Boulevard de l\'Assomption',
      ville: 'Montreal',
      province: 'QC',
      code_postal: 'H1T 2M4',
      telephone: '(514) 252-3400',
      email: 'info@hmr.ca',
      website: 'https://www.hmr.ca',
      type: 'hospital',
      categorie: 'public',
      jurisdiction: 'provincial',
      services: ['emergency', 'surgery', 'cardiology'],
      employees: 1600,
      capacity: 280,
      official_status: 'active',
    },
  ],
};

// Données d'exemple : Écoles du Québec
const schoolsSampleData = {
  dataset_name: 'schools_qc_2026',
  type: 'school',
  source_name: 'ministere-education.qc.ca',
  source_url: 'https://education.qc.ca/schools',
  description: 'Liste officielle des écoles du Québec en 2026',
  reliability: 'verified',
  data: [
    {
      id: 'sch_001',
      name: 'Lycée Jean-Emond Montpetit',
      adresse: '4585 Avenue de Lorimier',
      ville: 'Montreal',
      province: 'QC',
      code_postal: 'H2H 2B6',
      telephone: '(514) 527-2600',
      website: 'https://jeaned-montpetit.csdm.qc.ca',
      type: 'école',
      categorie: 'public',
      jurisdiction: 'provincial',
      services: ['secondary', 'sports', 'arts'],
      students: 1500,
      official_status: 'active',
    },
    {
      id: 'sch_002',
      name: 'Collège Dawson',
      adresse: '3040 Sherbrooke Ouest',
      ville: 'Montreal',
      province: 'QC',
      code_postal: 'H3Z 1A4',
      telephone: '(514) 931-8731',
      website: 'https://www.dawsoncollege.qc.ca',
      type: 'school',
      categorie: 'public',
      jurisdiction: 'provincial',
      services: ['cegep', 'science', 'technology'],
      students: 8000,
      official_status: 'active',
    },
    {
      id: 'sch_003',
      name: 'École Élémentaire Saint-Louis',
      adresse: '2500 Rue Saint-Louis',
      ville: 'Quebec City',
      province: 'QC',
      code_postal: 'G1R 4P5',
      telephone: '(418) 691-6700',
      website: 'https://www.csap.qc.ca',
      type: 'school',
      categorie: 'public',
      jurisdiction: 'provincial',
      services: ['elementary', 'daycare'],
      students: 450,
      official_status: 'active',
    },
  ],
};

async function importDataset(dataset) {
  try {
    console.log(`\n📥 Importing ${dataset.dataset_name}...`);

    const response = await fetch(`${API_URL}/public-data/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataset),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Import failed:`, error);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Import successful!`);
    console.log(`   Dataset ID: ${result.data.dataset_id}`);
    console.log(`   Total records: ${result.data.total_count}`);
    console.log(`   Job ID: ${result.data.processing_job_id}`);

    return result.data.dataset_id;
  } catch (err) {
    console.error(`❌ Import error:`, err.message);
    return false;
  }
}

async function normalizeDataset(datasetId) {
  try {
    console.log(`\n🔄 Normalizing ${datasetId}...`);

    const response = await fetch(`${API_URL}/public-data/normalize/${datasetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Normalization failed:`, error);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Normalization complete!`);
    console.log(`   Normalized records: ${result.data.normalized_count}`);

    return true;
  } catch (err) {
    console.error(`❌ Normalization error:`, err.message);
    return false;
  }
}

async function linkDataset(datasetId) {
  try {
    console.log(`\n🔗 Linking ${datasetId}...`);

    const response = await fetch(`${API_URL}/public-data/link/${datasetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Linking failed:`, error);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Linking complete!`);
    console.log(`   Linked records: ${result.data.linked_count}`);

    return true;
  } catch (err) {
    console.error(`❌ Linking error:`, err.message);
    return false;
  }
}

async function publishDataset(datasetId) {
  try {
    console.log(`\n📢 Publishing ${datasetId}...`);

    const response = await fetch(`${API_URL}/public-data/publish/${datasetId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`❌ Publication failed:`, error);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Publication complete!`);
    console.log(`   Published records: ${result.data.published_count}`);

    return true;
  } catch (err) {
    console.error(`❌ Publication error:`, err.message);
    return false;
  }
}

async function verifyData(datasetId) {
  try {
    console.log(`\n✔️ Verifying ${datasetId}...`);

    const response = await fetch(`${API_URL}/public-data/institutions?type=${datasetId.includes('hosp') ? 'hospital' : 'school'}&limit=5`);

    if (!response.ok) {
      console.error(`❌ Verification failed`);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Verification successful!`);
    console.log(`   Total institutions: ${result.total}`);
    console.log(`   Retrieved: ${result.data.length}`);

    if (result.data.length > 0) {
      console.log(`   First institution: ${result.data[0].name}`);
    }

    return true;
  } catch (err) {
    console.error(`❌ Verification error:`, err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Seeding Public Data Engine...');
  console.log(`API URL: ${API_URL}`);

  const datasets = [hospitalsSampleData, schoolsSampleData];

  for (const dataset of datasets) {
    // Import
    const datasetId = await importDataset(dataset);
    if (!datasetId) continue;

    // Wait a bit for async processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Normalize
    if (!(await normalizeDataset(datasetId))) continue;

    // Link
    if (!(await linkDataset(datasetId))) continue;

    // Publish
    if (!(await publishDataset(datasetId))) continue;
  }

  // Verify all data
  console.log('\n\n📊 FINAL VERIFICATION');
  console.log('='.repeat(50));

  try {
    const statsResponse = await fetch(`${API_URL}/public-data/statistics`);
    const stats = await statsResponse.json();

    console.log('\n✅ Overall Statistics:');
    console.log(`   Total institutions: ${stats.data.total.total_institutions}`);
    console.log(`   Datasets: ${stats.data.total.dataset_count}`);
    console.log(`   Types: ${stats.data.total.type_count}`);
    console.log(`   Regions: ${stats.data.total.region_count}`);

    console.log('\n📊 By Type:');
    stats.data.by_type.forEach(t => {
      console.log(`   ${t.type}: ${t.count}`);
    });
  } catch (err) {
    console.error(`❌ Statistics error:`, err.message);
  }

  console.log('\n\n✨ Seeding complete!');
  console.log('\n📚 Try these endpoints:');
  console.log(`   GET  ${API_URL}/public-data/institutions`);
  console.log(`   GET  ${API_URL}/public-data/statistics`);
  console.log(`   GET  ${API_URL}/public-data/map/geojson`);
}

main().catch(console.error);
