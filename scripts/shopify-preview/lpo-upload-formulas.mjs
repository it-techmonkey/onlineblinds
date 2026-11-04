// Uploads the slim formulas of one category to its stored LPO configs.
// Usage: node scripts/shopify-preview/lpo-upload-formulas.mjs day-night [slug]
// Option names are moved to hidden (_name) form and the unit price formulas are
// replaced; every other part of each stored option is
// sent back exactly as LPO returned it. A full copy of each stored config is
// saved locally first, and the saved result is read back and compared.
import fs from 'node:fs';
import path from 'node:path';
import {work} from './env.mjs';
import {initialize, call, updateConfig} from './lpo-mcp.mjs';
import {renameOptions} from './lpo-slim-formula.mjs';

const category = process.argv[2], only = process.argv[3];
if (!category) throw new Error('Category folder required');
const folder = path.join('shopify-migration/lpo/categories', category);
const backup = path.join(work, 'lpo-config-backups', new Date().toISOString().slice(0, 10));
fs.mkdirSync(backup, {recursive: true});
const read = (r) => r.structuredContent || JSON.parse(r.content.find((c) => c.type === 'text').text);
await initialize();

const open = read(await call('session_list')).sessions.filter((s) => s.activeConfigUuid);
const drafts = JSON.parse(fs.readFileSync(path.join(folder, 'drafts.json')));
for (const draft of drafts) {
  if (only && draft.slug !== only) continue;
  if (open.some((s) => s.activeConfigUuid === draft.configUuid)) throw new Error('Close the LPO editor for ' + draft.description + ' first; it would overwrite this update');
  const formula = fs.readFileSync(path.join(folder, draft.slug + '-formula.js'), 'utf8');
  const stored = read(await call('config_get', {configUuid: draft.configUuid}));
  const backupFile = path.join(backup, draft.configUuid + '.json');
  if (!fs.existsSync(backupFile)) fs.writeFileSync(backupFile, JSON.stringify(stored, null, 2) + '\n');

  const options = renameOptions(structuredClone(stored.config.options));
  const unit = options.find((o) => o.name === '_measurementUnit');
  if (!unit || !unit.values.length) throw new Error('No measurementUnit option in ' + draft.description);
  if (JSON.stringify(options) === JSON.stringify(stored.config.options) && unit.values.every((v) => v.priceFormula === formula)) { console.log('Already current: ' + draft.description); continue; }
  unit.values.forEach((v) => { v.priceFormula = formula; });

  const {answer} = await updateConfig(draft.configUuid, {config: {options}});
  const saved = read(await call('config_get', {configUuid: draft.configUuid}));
  // Everything except the formulas must be unchanged.
  const strip = (opts) => JSON.stringify(renameOptions(opts).map((o) => o.name !== '_measurementUnit' ? o : {...o, values: o.values.map(({priceFormula, ...rest}) => rest)}));
  if (strip(saved.config.options) !== strip(stored.config.options)) throw new Error('Unexpected option change in ' + draft.description);
  if (!saved.config.options.find((o) => o.name === '_measurementUnit').values.every((v) => v.priceFormula === formula)) throw new Error('Formula not saved for ' + draft.description);
  if (saved.enabled !== stored.enabled) throw new Error('Enabled state changed for ' + draft.description);
  if (JSON.stringify(saved.config.conditions) !== JSON.stringify(stored.config.conditions)) throw new Error('Targeting changed for ' + draft.description);
  console.log(`Updated ${draft.description}: ${JSON.stringify(stored).length} -> ${JSON.stringify(saved).length} bytes stored (${answer.changed.length} paths changed)`);
}
