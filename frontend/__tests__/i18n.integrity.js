import fs from 'fs';

const frTranslations = JSON.parse(
  fs.readFileSync('./public/locales/fr/translation.json', 'utf8')
);
const enTranslations = JSON.parse(
  fs.readFileSync('./public/locales/en/translation.json', 'utf8')
);

const getKeys = (obj, prefix = '') => {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
};

const frKeys = new Set(getKeys(frTranslations));
const enKeys = new Set(getKeys(enTranslations));

const missing = [];
frKeys.forEach(key => {
  if (!enKeys.has(key)) missing.push(`Missing EN: ${key}`);
});
enKeys.forEach(key => {
  if (!frKeys.has(key)) missing.push(`Missing FR: ${key}`);
});

if (missing.length > 0) {
  console.error('❌ Translation integrity failed:');
  missing.forEach(m => console.error(m));
  process.exit(1);
} else {
  console.log('✅ All translations complete');
}
