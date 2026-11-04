// Plans, builds and verifies the generic (v2) LPO formulas for one Phase 5 category.
// Usage: node scripts/shopify-preview/lpo-kind-build.mjs vertical
// Products are selected by the price band the live server resolves for them
// (resolveHandleToPriceBand), grouped by band and by the rules their tags
// trigger, and every product is compared with the live website calculator.
// Writes categories/<name>/generic-plan.json, <slug>-formula.js, formula-check.json.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {root, work} from './env.mjs';
import {kindFormula} from './lpo-generic.mjs';
import {bandGrid} from './lpo-slim-formula.mjs';
import {upliftBasePrice} from './price-uplift.mjs';

const CATEGORIES = {
  vertical: /^(Vertical Blind - |Replacement Vertical Blinds Slat - )/,
  roman: /^Roman /,
  venetian: /^(Metal Venetian - |Perfect Fit )/,
  'no-drill': /^No Drill Blinds - /,
  'faux-wood': /^Faux Wooden - /,
  'easy-stick': /^Easy Stick - /,
  skylight: /^Skylight Blinds - /,
  other: /^Eclipsecore Band$/,
};
const category = process.argv[2];
if (!CATEGORIES[category]) throw new Error('Unknown category: ' + category + ' (one of ' + Object.keys(CATEGORIES).join(', ') + ')');
const folder = path.join('shopify-migration/lpo/categories', category);
fs.mkdirSync(folder, {recursive: true});
const catalog = JSON.parse(fs.readFileSync(path.join(work, 'catalog.json')));
const source = JSON.parse(fs.readFileSync('shopify-theme/assets/ob-catalog-data.json'));
const registry = JSON.parse(fs.readFileSync('shopify-src/lpo-configurations.json'));
const reference = await import(pathToFileURL(path.join(work, 'pricing-reference.mjs')).href);

// Family rules straight from the source (bundled once); the slat tier table is
// module-private, so it is exported for this build only.
const {build} = createRequire(path.join(work, 'tooling/package.json'))('esbuild');
const rulesFile = path.join(work, 'family-rules-v5.mjs');
await build({stdin: {contents: `export {getBlindFamilyFromTags, getControlSystemLimits, shouldClampToBandGrid} from './src/lib/measurement-ranges';
export {isRollerBlindProduct} from './src/lib/roller-blinds';
export {isSkylightProduct} from './src/lib/skylight';
export {isHeightOnlyVerticalProduct, REPLACEMENT_VERTICAL_SLAT_PRICING, getReplacementVerticalSlatBandTag} from './src/lib/vertical-blinds';`, resolveDir: root, loader: 'ts'},
  outfile: rulesFile, bundle: true, format: 'esm', platform: 'node', tsconfig: path.join(root, 'tsconfig.json'), logLevel: 'warning',
  plugins: [{name: 'slat-tiers', setup(b) { b.onLoad({filter: /vertical-blinds\.ts$/}, (args) => ({contents: fs.readFileSync(args.path, 'utf8') + '\nexport {REPLACEMENT_VERTICAL_SLAT_PRICING, getReplacementVerticalSlatBandTag};\n', loader: 'ts'})); }}]});
const rules = await import(pathToFileURL(rulesFile).href + '?' + Date.now());

const kindOf = (p) => rules.isHeightOnlyVerticalProduct(p.tags) ? 'slat'
  : rules.isSkylightProduct({category: source.products[p.handle]?.category, tags: p.tags, name: p.title, slug: p.handle}) ? 'skylight' : 'band';
const schemaFor = (bandId, p) => {
  const kind = kindOf(p), roller = rules.isRollerBlindProduct(p.tags);
  // Slat tier prices include the temporary base price increase, as on the website.
  if (kind === 'slat') return {kind, roller, tiers: rules.REPLACEMENT_VERTICAL_SLAT_PRICING[rules.getReplacementVerticalSlatBandTag(p.tags)].map((t) => ({...t, price: upliftBasePrice(t.price)}))};
  const family = rules.getBlindFamilyFromTags(p.tags);
  return {kind, bandId, clamp: rules.shouldClampToBandGrid(p.tags), any: rules.getControlSystemLimits(family, 'any'), motor: rules.getControlSystemLimits(family, 'motorized'), roller};
};

// Select and group the products.
const groups = new Map();
// --rebuild regenerates a category that already has LPO configs (e.g. after a
// size-limit change); otherwise products that already have one are skipped.
const rebuild = process.argv.includes('--rebuild');
for (const p of catalog.products) {
  if (registry[p.handle] && !rebuild) continue;
  const band = await reference.resolveHandleToPriceBand(p.handle);
  if (!band || !CATEGORIES[category].test(band.name)) continue;
  const product = {id: p.id.split('/').at(-1), type: 'product', title: p.title, handle: p.handle, tags: p.tags};
  const schema = schemaFor(band.id, product);
  const key = band.id + JSON.stringify(schema);
  if (!groups.has(key)) groups.set(key, {bandId: band.id, band: band.name, schema, products: [], variant: [...groups.values()].filter((g) => g.bandId === band.id).length});
  groups.get(key).products.push(product);
}

// Deterministic pseudo-random customization sets.
let seed = 12345;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const raw = JSON.parse(fs.readFileSync('src/data/pricing/pricing-data.json', 'utf8'));
const optionsFor = (kind) => raw.customizationOptions.filter((o) => kind === 'skylight' || o.category !== 'skylight-blind-type').map((o) => [o.category, o.optionId]);
const pickSet = (all) => {
  const n = Math.floor(rand() * 5), set = [];
  for (let i = 0; i < n; i++) { const o = all[Math.floor(rand() * all.length)]; if (!set.some((s) => s[0] === o[0])) set.push(o); }
  if (rand() < 0.4) set.push(['motorization', 'motorized']);
  return set;
};

const slugOf = (g) => (g.band + (g.variant ? '-' + (g.variant + 1) : '')).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
const out = [], checks = [];
for (const g of groups.values()) {
  const slug = slugOf(g), {schema} = g, kind = schema.kind;
  const formula = kindFormula(schema);
  const run = new Function('options', formula);
  const all = optionsFor(kind);
  let compared = 0, rejected = 0;
  const check = async (handle, wIn, hIn, unit, set) => {
    const factor = unit === 'cm' ? 2.54 : 25.4;
    const wv = unit === 'cm' ? Math.floor(wIn * factor) : Math.round(wIn * factor), hv = unit === 'cm' ? Math.floor(hIn * factor) : Math.round(hIn * factor);
    const wf = unit === 'cm' ? Math.round((wIn * factor - wv) * 10) % 10 : 0, hf = unit === 'cm' ? Math.round((hIn * factor - hv) * 10) % 10 : 0;
    // The page clears width for slats and has no size fields for skylights.
    const values = {_width: kind === 'band' ? wv : '', _height: kind === 'skylight' ? '' : hv, _widthFraction: kind === 'band' ? wf : 0, _heightFraction: kind === 'skylight' ? 0 : hf, _measurementUnit: unit, _customizations: set.map((s) => s.join(':')).join('|')};
    let error;
    const actual = run({value: (n) => values[n], option: () => ({errors: []}), error: (n, m) => { error = m; }});
    const h = unit === 'cm' ? (hv + hf / 10) / 2.54 : hv / 25.4;
    const w = kind === 'skylight' ? 1 : kind === 'slat' ? 16 : unit === 'cm' ? (wv + wf / 10) / 2.54 : wv / 25.4;
    if (kind === 'slat' && !(h > 0)) { if (actual !== 0) throw new Error('Zero height should not be priced: ' + slug); return; }
    let expected, expectedError;
    try { expected = (await reference.calculateProductPrice({handle, widthInches: w, heightInches: kind === 'skylight' ? 1 : h, customizations: set.map(([category, optionId]) => ({category, optionId}))})).totalPrice; }
    catch (e) { expectedError = e.message; }
    if (expectedError) { if (actual !== 0 || error !== expectedError) throw new Error(`Rejection mismatch ${slug} ${handle} ${JSON.stringify(values)} got ${actual}/${error} want ${expectedError}`); rejected++; }
    else if (error || Math.abs(actual - expected) > 0.011) throw new Error(`Price mismatch ${slug} ${handle} ${JSON.stringify(values)} got ${actual}/${error} want ${expected}`);
    compared++;
  };
  const rep = g.products[0].handle;
  let ws, hs;
  if (kind === 'slat') {
    ws = [0];
    hs = [...new Set([0.01, 1, 20, 42.99, 43, 43.01, 58.99, 59, 59.01, 82.99, 83, 83.01, 86.6, 86.61, 109.99, 110, 110.01, 140, 200, ...schema.tiers.flatMap((t) => Number.isFinite(t.maxInches) ? [t.maxInches - 0.05, t.maxInches, t.maxInches + 0.05] : [])])].sort((a, b) => a - b);
  } else {
    const grid = bandGrid(g.bandId);
    // Also test just inside/outside the family's own size limits (about 1mm either side).
    const near = (...limits) => limits.filter(Number.isFinite).flatMap((v) => [v - 0.04, v, v + 0.04]);
    const edges = (bands, extra) => { const s = new Set([0, 1, 5, 7.99, 8, 10.99, 11, 21.99, 22, 116, 116.01, 144, 144.01, ...extra]); for (const [inch] of bands) for (const d of [-0.6, -0.01, 0, 0.01, 0.6]) s.add(inch + d); return [...s].filter((v) => v >= 0).sort((a, b) => a - b); };
    ws = kind === 'skylight' ? [0] : edges(grid.w, near(schema.any?.minWidth, schema.any?.maxWidth)); hs = kind === 'skylight' ? [0] : edges(grid.h, near(schema.any?.minHeight, schema.any?.maxHeight));
  }
  for (const unit of ['cm', 'mm']) for (const w of ws) for (const h of hs) { await check(rep, w, h, unit, []); await check(rep, w, h, unit, pickSet(all)); }
  // Every customization option alone and with motorisation, on a spread of sizes (covers per-band prices).
  const spread = kind === 'band' ? [[20, 30], [33, 47], [45, 60], [60, 80], [75, 90], [100, 120]] : [[0, 30], [0, 50], [0, 70], [0, 100]];
  for (const o of all) for (const [w, h] of spread) { await check(rep, w, h, 'cm', [o]); await check(rep, w, h, 'cm', [o, ['motorization', 'motorized']]); }
  for (const p of g.products) for (const [w, h] of [[20, 30], [40.2, 55.5], [70, 90], [110, 140]]) for (let i = 0; i < 4; i++) await check(p.handle, w, h, i % 2 ? 'mm' : 'cm', pickSet(all));

  fs.writeFileSync(path.join(folder, slug + '-formula.js'), formula);
  out.push({slug, bandId: g.bandId, band: g.band, description: 'OB Preview - ' + g.band + (g.variant ? ' (' + (g.variant + 1) + ')' : ''), representative: rep, schema, products: g.products.map(({tags, ...p}) => p)});
  checks.push({slug, band: g.band, kind, products: g.products.length, compared, rejected, formulaBytes: Buffer.byteLength(formula), formulaSha256: createHash('sha256').update(formula).digest('hex')});
  console.log(`${g.band} [${kind}${g.variant ? ' #' + (g.variant + 1) : ''}]: ${g.products.length} products, ${compared} checks (${rejected} rejections), formula ${Buffer.byteLength(formula)} bytes`);
}
if (new Set(out.map((g) => g.slug)).size !== out.length) throw new Error('Duplicate config slugs');
if (!out.length) throw new Error(`No products to build for ${category}${rebuild ? '' : ' (they may already have configs: use --rebuild)'}; existing plan files kept`);
if (rebuild) {
  // Each rebuilt group must be exactly the products its stored config serves.
  const drafts = JSON.parse(fs.readFileSync(path.join(folder, 'drafts.json')));
  for (const g of out) {
    const draft = drafts.find((d) => d.slug === g.slug);
    if (!draft) throw new Error('Rebuilt group has no stored config: ' + g.slug);
    const wrong = g.products.filter((p) => registry[p.handle]?.configId !== draft.configUuid);
    if (wrong.length) throw new Error(`${g.slug}: products mapped to another config: ${wrong.map((p) => p.handle).join(', ')}`);
  }
  if (out.length !== drafts.length) throw new Error(`Rebuilt ${out.length} groups but ${drafts.length} configs are stored`);
}
fs.writeFileSync(path.join(folder, 'generic-plan.json'), JSON.stringify({date: new Date().toISOString().slice(0, 10), category, schema: 2, configurations: out}, null, 2) + '\n');
fs.writeFileSync(path.join(folder, 'formula-check.json'), JSON.stringify({date: new Date().toISOString().slice(0, 10), scope: 'Generic v2 formulas vs website calculator: band edges in cm/mm, every customization option alone and motorised, every product with random option sets.', passed: true, checks}, null, 2) + '\n');
console.log(`${category}: ${out.length} configurations, ${out.reduce((s, g) => s + g.products.length, 0)} products, ${checks.reduce((s, c) => s + c.compared, 0)} checks`);
