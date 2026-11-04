import fs from 'node:fs';
import path from 'node:path';
import { cli } from './cli.mjs';
import { readAdmin, root, work, themePath, storeDomain } from './env.mjs';

if (process.argv.length !== 2) throw new Error('This uploader takes no flags. Publishing and targeting other themes are not supported.');
const statePath = path.join(root, 'shopify-migration/preview.json');
const baseline = JSON.parse(fs.readFileSync(path.join(work, 'store-baseline.json'), 'utf8'));
const protectedIds = new Set(baseline.themes.nodes.map(t => t.id.split('/').at(-1)));
const name = 'Online Blinds - Shopify Preview';
const before = (await readAdmin('{ themes(first: 20) { nodes { id name role updatedAt } } }')).themes.nodes;
const liveBefore = before.find(t => t.role === 'MAIN');
const settings = JSON.parse(fs.readFileSync(path.join(themePath, 'config/settings_data.json'), 'utf8'));
if (settings.current.purchasing_enabled !== false) throw new Error('Preview upload requires purchasing to remain disabled.');
let state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : null;
if (state && state.store !== storeDomain()) throw new Error('Preview belongs to a different store.');
let target = state ? before.find(t => t.id.split('/').at(-1) === String(state.id)) : null;
if (state && !target) throw new Error('Recorded preview is missing. Refusing to create a replacement automatically.');
if (!state) {
  const existing = before.filter(t => t.name === name);
  const intentPath = path.join(work, 'upload-intent.json');
  if (existing.length) {
    // Recover an interrupted create only when the pre-create intent is present,
    // the theme was absent from that snapshot and it remains unpublished.
    if (!fs.existsSync(intentPath) || existing.length !== 1) throw new Error('A theme with this name already exists; refusing an ambiguous upload.');
    const intent = JSON.parse(fs.readFileSync(intentPath, 'utf8'));
    target = existing[0];
    if (intent.store !== storeDomain() || intent.existingIds.includes(target.id)) throw new Error('Theme is not from this upload attempt.');
  } else {
    fs.writeFileSync(intentPath, JSON.stringify({ store: storeDomain(), existingIds: before.map(t => t.id), name }, null, 2));
  }
}
if (target && (protectedIds.has(target.id.split('/').at(-1)) || target.role !== 'UNPUBLISHED' || target.name !== name)) {
  throw new Error('Refusing to modify a protected, published or unexpected theme.');
}
const args = ['theme', 'push', '--path', themePath, '--json', '--nodelete'];
if (target) args.push('--theme', target.id.split('/').at(-1));
else args.push('--unpublished', '--theme', name);
const result = JSON.parse(cli(args, { capture: true }));
if (!result.theme?.id) throw new Error('Upload did not return a theme ID. Inspect the recorded intent before retrying.');
state = { store: storeDomain(), id: result.theme.id, name, role: result.theme.role, preview_url: result.theme.preview_url, editor_url: result.theme.editor_url };
fs.mkdirSync(path.dirname(statePath), { recursive: true });
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
const after = (await readAdmin('{ themes(first: 20) { nodes { id name role updatedAt } } }')).themes.nodes;
const preview = after.find(t => t.id.split('/').at(-1) === String(state.id));
if (preview?.role !== 'UNPUBLISHED') throw new Error('Unexpected preview role after upload.');
if (after.find(t => t.role === 'MAIN')?.id !== liveBefore?.id) throw new Error('Published theme changed during upload.');
const changedExisting = before.filter(t => after.find(a => a.id === t.id)?.updatedAt !== t.updatedAt && t.id !== preview.id);
if (changedExisting.length) throw new Error('An existing theme changed during the upload; inspect store activity.');
console.log(JSON.stringify({ ...state, unchangedExistingThemes: before.length - (target ? 1 : 0), publishedThemeUnchanged: true }, null, 2));
