import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, work } from './env.mjs';

const { customizationOptions } = await import(pathToFileURL(path.join(work, 'theme-ssr.mjs')).href);
const escape = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
const lines = [
  '# Existing option labels and images', '',
  'Generated from `src/data/customizations.ts`. Use this as a transcription reference when building inactive Live Product Options configurations.', '',
  'These lists are shared source definitions, not a complete configuration for every product. ProductPage.tsx controls which choices are shown, required, conditional or replaced for each family. Do not add every list to every product.', '',
  'Prices are deliberately omitted: some are dimension-dependent, some are overridden by the server, and the motorization charge is calculated separately. Use the server calculator and exported pricing references to verify actual totals.', '',
  'Images below are repository paths under `public/`. They are not Shopify-hosted image URLs. For an image swatch, upload the corresponding original image through the app.', '',
];
function section(name, options) {
  if (!options.length || !options.every(o => o && typeof o === 'object' && 'id' in o)) return;
  lines.push(`## ${name}`, '', '| Existing ID | Customer label | Image |', '| --- | --- | --- |');
  for (const option of options) lines.push(`| ${escape(option.id)} | ${escape(option.name)} | ${escape(option.image)} |`);
  lines.push('');
}
for (const [name, value] of Object.entries(customizationOptions)) {
  if (Array.isArray(value)) section(name, value);
  else if (value && typeof value === 'object') {
    for (const [key, options] of Object.entries(value)) if (Array.isArray(options)) section(`${name}: ${key}`, options);
  }
}
fs.writeFileSync(path.join(root, 'shopify-migration/lpo/option-reference.md'), lines.join('\n'));
console.log('Generated readable option labels and image reference from the existing site.');
