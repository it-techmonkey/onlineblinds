// Creates or updates the generic (v2) LPO configs of one category, inactive.
// Usage: node scripts/shopify-preview/lpo-generic-create.mjs roller
// New configs are server-side copies of an existing migration config (LPO
// creates copies disabled), then get their name, generic options and explicit
// product targeting through the sessionless config_update. Idempotent: the
// created UUIDs are kept in categories/<name>/drafts.json.
import fs from 'node:fs';
import path from 'node:path';
import {work} from './env.mjs';
import {initialize, call, updateConfig} from './lpo-mcp.mjs';

const category = process.argv[2];
const folder = path.join('shopify-migration/lpo/categories', category);
const plan = JSON.parse(fs.readFileSync(path.join(folder, 'generic-plan.json')));
const draftsFile = path.join(folder, 'drafts.json');
const drafts = fs.existsSync(draftsFile) ? JSON.parse(fs.readFileSync(draftsFile)) : [];
const TEMPLATE = 'clfhanm6jjqw'; // OB Preview - Dayandnight - Band A (provides design/preview settings)
const read = (r) => r.structuredContent || JSON.parse(r.content.find((c) => c.type === 'text').text);
await initialize();

const template = read(await call('config_get', {configUuid: TEMPLATE}));
const pick = (name) => structuredClone(template.config.options.find((o) => o.name === name));
function genericOptions(formula, kind = 'band') {
  const unit = pick('_measurementUnit');
  unit.values.forEach((v) => { v.priceFormula = formula; });
  const customizations = pick('_blindName');
  Object.assign(customizations, {name: '_customizations', label: 'Customizations', required: false, value: '', conditions: []});
  // Slats are priced by drop only and skylights at a fixed size, so the page
  // leaves those fields empty; LPO must not demand them.
  const width = pick('_width'), height = pick('_height');
  if (kind === 'slat' || kind === 'skylight') width.required = false;
  if (kind === 'skylight') height.required = false;
  return [width, height, unit, pick('_widthFraction'), pick('_heightFraction'), customizations];
}

if (new Set(plan.configurations.map((g) => g.slug)).size !== plan.configurations.length) throw new Error('Duplicate config slugs in plan');
// Existing configs first, so a copy limit never blocks updates.
const ordered = [...plan.configurations].sort((a, b) => !drafts.some((d) => d.slug === a.slug) - !drafts.some((d) => d.slug === b.slug));
for (const g of ordered) {
  let record = drafts.find((d) => d.slug === g.slug);
  if (!record) {
    let copy;
    try { copy = read(await call('config_duplicate', {configUuid: TEMPLATE, description: g.description})); }
    catch (e) {
      // LPO allows 10 copies per hour; stop cleanly and resume later.
      console.log('STOPPED before ' + g.description + ': ' + e.message.slice(0, 900));
      process.exitCode = 2;
      break;
    }
    record = {slug: g.slug, configUuid: copy.config.uuid, description: g.description, products: g.products.length};
    drafts.push(record);
    fs.writeFileSync(draftsFile, JSON.stringify(drafts, null, 2) + '\n');
    console.log('Created ' + g.description + ' (' + record.configUuid + ')');
  }
  const formula = fs.readFileSync(path.join(folder, g.slug + '-formula.js'), 'utf8');
  const products = g.products.map((p) => ({id: String(p.id), title: p.title, handle: p.handle, type: 'product', quantity: 1}));
  const rep = products.find((p) => p.handle === g.representative) || products[0];
  const before = read(await call('config_get', {configUuid: record.configUuid}));
  if (before.enabled) { console.log('Skipping active config: ' + g.description); continue; }
  await updateConfig(record.configUuid, {name: g.description, config: {
    options: genericOptions(formula, g.schema?.kind), targetMode: 1, conditionMode: 1, product: rep,
    conditions: [{data: 'product', field: 'product', operator: '=', products}],
  }});
  const saved = read(await call('config_get', {configUuid: record.configUuid}));
  const ids = saved.config.conditions.flatMap((c) => (c.products || []).map((p) => String(p.id))).sort();
  if (saved.enabled) throw new Error('Config became active: ' + g.description);
  if (JSON.stringify(ids) !== JSON.stringify(products.map((p) => p.id).sort())) throw new Error('Targeting mismatch: ' + g.description);
  if (!saved.config.options.find((o) => o.name === '_measurementUnit').values.every((v) => v.priceFormula === formula)) throw new Error('Formula mismatch: ' + g.description);
  record.products = products.length;
  fs.writeFileSync(path.join(work, 'lpo-config-backups', record.configUuid + '-saved.json'), JSON.stringify(saved, null, 2) + '\n');
  console.log(`Saved ${g.description}: ${products.length} products, inactive, ${JSON.stringify(saved).length} bytes`);
}
fs.writeFileSync(draftsFile, JSON.stringify(drafts, null, 2) + '\n');
