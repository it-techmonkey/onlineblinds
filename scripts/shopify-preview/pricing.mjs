import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { root, work, themePath } from './env.mjs';
const require = createRequire(path.join(work, 'tooling/package.json'));
const { build } = require('esbuild');
const catalogue = JSON.parse(fs.readFileSync(path.join(work, 'catalog.json'), 'utf8'));
const pricing = JSON.parse(fs.readFileSync(path.join(root, 'src/data/pricing/pricing-data.json'), 'utf8'));
const products = Object.fromEntries(catalogue.products.map(p => [p.handle, { title: p.title, tags: p.tags, priceBandName: p.priceBandName?.value || null }]));
const pricingPath = path.join(root, 'src/lib/server/pricing.service.ts');
const common = { bundle: true, format: 'esm', platform: 'node', tsconfig: path.join(root, 'tsconfig.json'), logLevel: 'warning',
  plugins: [{ name: 'offline-catalog', setup(b) {
    b.onResolve({ filter: /product-cache$/ }, () => ({ path: 'offline-catalog', namespace: 'offline' }));
    b.onLoad({ filter: /.*/, namespace: 'offline' }, () => ({ contents: `export function getAllCachedProducts(){return ${JSON.stringify(products)}}`, loader: 'js' }));
  } }],
};
await build({ ...common, entryPoints: [pricingPath], outfile: path.join(work, 'pricing-reference.mjs') });
const engine = await import(pathToFileURL(path.join(work, 'pricing-reference.mjs')).href + `?v=${Date.now()}`);
const prices = await engine.getMinimumPricesByHandle();
fs.mkdirSync(path.join(themePath, 'snippets'), { recursive: true });
fs.writeFileSync(path.join(themePath, 'snippets/ob-minimum-price.liquid'), `{%- case product.handle -%}\n${Object.entries(prices).map(([handle, price]) => `{%- when '${handle}' -%}${Math.round(price * 100)}`).join('\n')}\n{%- else -%}{{- product.price -}}{%- endcase -%}\n`);
fs.writeFileSync(path.join(themePath, 'snippets/ob-minimum-prices-json.liquid'), JSON.stringify(prices));

const output = path.join(root, 'shopify-migration/lpo');
fs.mkdirSync(path.join(output, 'price-bands'), { recursive: true });
const widths = new Map(pricing.widthBands.map(b => [b.id, b]));
const heights = new Map(pricing.heightBands.map(b => [b.id, b]));
const csv = value => '"' + String(value ?? '').replaceAll('"', '""') + '"';
for (const band of pricing.priceBands) {
  const cells = pricing.priceCells.filter(c => c.priceBandId === band.id);
  const rows = [['width_mm', 'width_inches', 'height_mm', 'height_inches', 'price_gbp'], ...cells.map(c => [widths.get(c.widthBandId).widthMm, widths.get(c.widthBandId).widthInches, heights.get(c.heightBandId).heightMm, heights.get(c.heightBandId).heightInches, c.price])];
  fs.writeFileSync(path.join(output, 'price-bands', band.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.csv'), rows.map(r => r.map(csv).join(',')).join('\n') + '\n');
}
const options = new Map(pricing.customizationOptions.map(o => [o.id, o]));
const customizationRows = [['category', 'option_id', 'name', 'width_mm', 'price_gbp', 'is_per_unit'], ...pricing.customizationPricings.map(p => {
  const o = options.get(p.customizationOptionId);
  return [o.category, o.optionId, o.name, p.widthBandId ? widths.get(p.widthBandId).widthMm : '', p.price, p.isPerUnit];
})];
fs.writeFileSync(path.join(output, 'customization-prices.csv'), customizationRows.map(r => r.map(csv).join(',')).join('\n') + '\n');
fs.writeFileSync(path.join(output, 'product-band-mapping.csv'), [['handle', 'price_band', 'tags', 'template'], ...catalogue.products.map(p => [p.handle, p.priceBandName?.value || '', p.tags.join('|'), p.templateSuffix || ''])].map(r => r.map(csv).join(',')).join('\n') + '\n');

// The app's Formula extension executes synchronously. The existing pricing
// module is entirely local after substituting its catalog lookup; the reference
// export above keeps async behavior for comparison. This build is preparation
// only and is NOT enabled or installed into Live Product Options automatically.
await build({
  entryPoints: [pricingPath], outfile: path.join(output, 'pricing-engine.js'), bundle: true, format: 'iife', globalName: 'OnlineBlindsPricing', platform: 'browser', minify: true,
  tsconfig: path.join(root, 'tsconfig.json'), logLevel: 'warning',
  plugins: [{ name: 'synchronous-local-pricing', setup(b) {
    b.onResolve({ filter: /product-cache$/ }, () => ({ path: 'current-product', namespace: 'current' }));
    b.onLoad({ filter: /.*/, namespace: 'current' }, () => ({ contents: 'export function getAllCachedProducts(){ const p=globalThis.OnlineBlindsPricingProduct; if(!p?.handle) throw new Error("Pricing product context missing"); return {[p.handle]:p}; }', loader: 'js' }));
    b.onLoad({ filter: /pricing\.service\.ts$/ }, args => ({ contents: fs.readFileSync(args.path, 'utf8').replace(/\basync\s+/g, '').replace(/\bawait\s+/g, ''), loader: 'ts', resolveDir: path.dirname(args.path) }));
  } }],
});
fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({
  sourceChecksum: pricing.checksum, priceBands: pricing.priceBands.length, priceCells: pricing.priceCells.length,
  customizationOptions: pricing.customizationOptions.length, customizationPriceEntries: pricing.customizationPricings.length,
  products: catalogue.products.length, pricedProducts: Object.keys(prices).length,
  status: 'Prepared reference exports; not configured in Live Product Options. CSV files are not app configuration imports.',
  lookup: 'Preserve existing ceiling-by-inch lookup and family clamping. Do not import as unmodified LPO dimension lower-bound price lists.',
}, null, 2));
console.log(`Prepared ${pricing.priceBands.length} price bands, ${pricing.priceCells.length} price cells and ${pricing.customizationPricings.length} option price entries. ${Object.keys(prices).length} product starting prices generated from the existing server calculator.`);
