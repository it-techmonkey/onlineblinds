import {
  checksumPricingData,
  fetchDbPricingData,
  pricingSummary,
  readPricingData,
  stableStringify,
} from './pricing-data-utils.mjs';

const jsonData = readPricingData();
const dbData = await fetchDbPricingData();

const normalizedJson = { ...jsonData };
const normalizedDb = { ...dbData };
delete normalizedJson.generatedAt;
delete normalizedJson.source;
delete normalizedJson.checksum;
delete normalizedDb.generatedAt;
delete normalizedDb.source;
delete normalizedDb.checksum;

const jsonChecksum = checksumPricingData({
  schemaVersion: 1,
  generatedAt: 'compare',
  source: 'compare',
  ...normalizedJson,
});
const dbChecksum = checksumPricingData({
  schemaVersion: 1,
  generatedAt: 'compare',
  source: 'compare',
  ...normalizedDb,
});

if (stableStringify(normalizedJson) !== stableStringify(normalizedDb)) {
  console.error('Pricing JSON does not match current Neon pricing data.');
  console.error(`JSON normalized checksum: ${jsonChecksum}`);
  console.error(`DB normalized checksum:   ${dbChecksum}`);
  console.error('Run `npm run pricing:export` if Neon is still the intended source.');
  process.exit(1);
}

console.log('Pricing JSON matches current Neon pricing data.');
console.log(JSON.stringify(pricingSummary(jsonData), null, 2));
