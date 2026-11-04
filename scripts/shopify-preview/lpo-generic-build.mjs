// Builds and verifies generic (v2) LPO formulas for one band-priced category.
// Usage: node scripts/shopify-preview/lpo-generic-build.mjs roller
// Reads categories/<name>/plan.json, merges its profiles into one config per
// price band, derives the family rules from each product's tags using the
// source modules, and compares every product with the website calculator.
// Writes generic-plan.json, <slug>-formula.js and formula-check.json.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {root, work} from './env.mjs';
import {genericFormula} from './lpo-generic.mjs';
import {bandGrid} from './lpo-slim-formula.mjs';

const category = process.argv[2];
const folder = path.join('shopify-migration/lpo/categories', category);
const plan = JSON.parse(fs.readFileSync(path.join(folder, 'plan.json')));
const catalog = JSON.parse(fs.readFileSync(path.join(work, 'catalog.json')));
const reference = await import(pathToFileURL(path.join(work, 'pricing-reference.mjs')).href);

// Family rules straight from the source (bundled once).
const {build} = createRequire(path.join(work, 'tooling/package.json'))('esbuild');
const rulesFile = path.join(work, 'family-rules.mjs');
await build({stdin: {contents: `export {getBlindFamilyFromTags, getControlSystemLimits, shouldClampToBandGrid} from './src/lib/measurement-ranges';
export {isRollerBlindProduct} from './src/lib/roller-blinds';`, resolveDir: root, loader: 'ts'},
  outfile: rulesFile, bundle: true, format: 'esm', platform: 'node', tsconfig: path.join(root, 'tsconfig.json'), logLevel: 'warning'});
const rules = await import(pathToFileURL(rulesFile).href + '?' + Date.now());
const schemaFor = (bandId, tags) => {
  const family = rules.getBlindFamilyFromTags(tags);
  return {bandId, clamp: rules.shouldClampToBandGrid(tags), any: rules.getControlSystemLimits(family, 'any'), motor: rules.getControlSystemLimits(family, 'motorized'), roller: rules.isRollerBlindProduct(tags)};
};

// One config per band and rule set (tags decide the server's size envelope,
// clamping and cassette pricing, so products whose tags differ cannot share).
const groups = new Map();
for (const profile of plan.configurations) {
  for (const p of profile.products) {
    const tags = catalog.products.find((c) => c.handle === p.handle)?.tags;
    if (!tags) throw new Error('Product missing from catalog: ' + p.handle);
    const key = profile.bandId + JSON.stringify(schemaFor(profile.bandId, tags));
    const g = groups.get(key) || {bandId: profile.bandId, band: profile.band, products: [], variant: [...groups.values()].filter((x) => x.bandId === profile.bandId).length};
    if (!g.products.some((x) => x.id === p.id)) g.products.push(p);
    groups.set(key, g);
  }
}

// Deterministic pseudo-random customization sets.
let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const raw = JSON.parse(fs.readFileSync('src/data/pricing/pricing-data.json', 'utf8'));
const allOptions = raw.customizationOptions.filter((o) => o.category !== 'skylight-blind-type').map((o) => [o.category, o.optionId]);
const pickSet = () => {
  const n = Math.floor(rand() * 5), set = [];
  for (let i = 0; i < n; i++) { const o = allOptions[Math.floor(rand() * allOptions.length)]; if (!set.some((s) => s[0] === o[0])) set.push(o); }
  if (rand() < 0.4) set.push(['motorization', 'motorized']);
  return set;
};

const out = [], checks = [];
for (const g of groups.values()) {
  const slug = (category + '-' + g.band.replace(/^.*? - /, '') + (g.variant ? (g.products.every((p) => /electrical/.test(p.handle)) ? '-electrical' : '-' + (g.variant + 1)) : '')).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const products = g.products.map((p) => ({...p, tags: catalog.products.find((c) => c.handle === p.handle)?.tags}));
  if (products.some((p) => !p.tags)) throw new Error('Product missing from catalog in ' + g.band);
  const schema = schemaFor(g.bandId, products[0].tags);
  for (const p of products) if (JSON.stringify(schemaFor(g.bandId, p.tags)) !== JSON.stringify(schema)) throw new Error(`Mixed family rules in ${g.band}: ${p.handle}`);
  const formula = genericFormula(schema);
  const run = new Function('options', formula);
  const grid = bandGrid(g.bandId);

  const edges = (bands) => { const s = new Set([0, 5, 7.99, 8, 10.99, 11, 21.99, 22, 116, 116.01, 144, 144.01]); for (const [inch] of bands) for (const d of [-0.6, -0.01, 0, 0.01, 0.6]) s.add(inch + d); return [...s].filter((v) => v >= 0).sort((a, b) => a - b); };
  const ws = edges(grid.w), hs = edges(grid.h);
  let compared = 0, rejected = 0;
  const check = async (handle, wIn, hIn, unit, set) => {
    const factor = unit === 'cm' ? 2.54 : 25.4;
    const wv = unit === 'cm' ? Math.floor(wIn * factor) : Math.round(wIn * factor), hv = unit === 'cm' ? Math.floor(hIn * factor) : Math.round(hIn * factor);
    const wf = unit === 'cm' ? Math.round((wIn * factor - wv) * 10) % 10 : 0, hf = unit === 'cm' ? Math.round((hIn * factor - hv) * 10) % 10 : 0;
    const values = {_width: wv, _height: hv, _widthFraction: wf, _heightFraction: hf, _measurementUnit: unit, _customizations: set.map((s) => s.join(':')).join('|')};
    let error;
    const actual = run({value: (n) => values[n], option: () => ({errors: []}), error: (n, m) => { error = m; }});
    const w = unit === 'cm' ? (wv + wf / 10) / 2.54 : wv / 25.4, h = unit === 'cm' ? (hv + hf / 10) / 2.54 : hv / 25.4;
    let expected, expectedError;
    try { expected = (await reference.calculateProductPrice({handle, widthInches: w, heightInches: h, customizations: set.map(([category, optionId]) => ({category, optionId}))})).totalPrice; }
    catch (e) { expectedError = e.message; }
    if (expectedError) { if (actual !== 0 || error !== expectedError) throw new Error(`Rejection mismatch ${slug} ${handle} ${JSON.stringify(values)} got ${actual}/${error} want ${expectedError}`); rejected++; }
    else if (error || Math.abs(actual - expected) > 0.011) throw new Error(`Price mismatch ${slug} ${handle} ${JSON.stringify(values)} got ${actual}/${error} want ${expected}`);
    compared++;
  };
  const rep = products[0].handle;
  for (const unit of ['cm', 'mm']) for (const w of ws) for (const h of hs) { await check(rep, w, h, unit, []); await check(rep, w, h, unit, pickSet()); }
  // Every single customization option on a spread of sizes (covers width-band prices).
  for (const o of allOptions) for (const [w, h] of [[20, 30], [33, 47], [60, 80], [100, 120]]) { await check(rep, w, h, 'cm', [o]); await check(rep, w, h, 'cm', [o, ['motorization', 'motorized']]); }
  for (const p of products) for (const [w, h] of [[20, 30], [40.2, 55.5], [70, 90], [110, 140]]) for (let i = 0; i < 4; i++) await check(p.handle, w, h, i % 2 ? 'mm' : 'cm', pickSet());

  fs.writeFileSync(path.join(folder, slug + '-formula.js'), formula);
  out.push({slug, bandId: g.bandId, band: g.band, description: 'OB Preview - ' + g.band + (g.variant ? (g.products.every((p) => /electrical/.test(p.handle)) ? ' - Electrical' : ' (' + (g.variant + 1) + ')') : ''), representative: rep, schema, products: g.products});
  checks.push({slug, band: g.band, products: products.length, compared, rejected, formulaBytes: Buffer.byteLength(formula), formulaSha256: createHash('sha256').update(formula).digest('hex')});
  console.log(`${g.band}: ${products.length} products, ${compared} checks (${rejected} rejections), formula ${Buffer.byteLength(formula)} bytes`);
}
fs.writeFileSync(path.join(folder, 'generic-plan.json'), JSON.stringify({date: new Date().toISOString().slice(0, 10), category, schema: 2, configurations: out}, null, 2) + '\n');
fs.writeFileSync(path.join(folder, 'formula-check.json'), JSON.stringify({date: new Date().toISOString().slice(0, 10), scope: 'Generic v2 formulas vs website calculator: every band edge in cm/mm, every customization option, every product.', passed: true, checks}, null, 2) + '\n');
