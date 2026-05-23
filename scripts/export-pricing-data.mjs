import {
  fetchDbPricingData,
  pricingDataPath,
  pricingReportPath,
  pricingSummary,
  validatePricingData,
  writeJson,
} from './pricing-data-utils.mjs';

const data = await fetchDbPricingData();
const validation = validatePricingData(data, { requireChecksum: true });

if (validation.errors.length > 0) {
  console.error('Pricing export failed validation:');
  for (const error of validation.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

writeJson(pricingDataPath, data);
writeJson(pricingReportPath, {
  ...pricingSummary(data),
  validation,
});

console.log(`Exported pricing data to ${pricingDataPath}`);
console.log(`Wrote pricing report to ${pricingReportPath}`);
console.log(JSON.stringify(pricingSummary(data), null, 2));
