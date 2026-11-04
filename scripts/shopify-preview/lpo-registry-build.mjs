// Adds a generic (v2) category to the theme's LPO registry and routing snippet.
// Usage: node scripts/shopify-preview/lpo-registry-build.mjs roller
// Variant IDs are read with the read-only Admin client. Existing entries for
// other categories (e.g. Day & Night) are kept as they are.
import fs from 'node:fs';
import path from 'node:path';
import {readAdmin} from './env.mjs';

const category = process.argv[2];
const folder = path.join('shopify-migration/lpo/categories', category);
const plan = JSON.parse(fs.readFileSync(path.join(folder, 'generic-plan.json')));
const drafts = JSON.parse(fs.readFileSync(path.join(folder, 'drafts.json')));
const registryFile = 'shopify-src/lpo-configurations.json';
const registry = JSON.parse(fs.readFileSync(registryFile));

const ids = plan.configurations.flatMap((g) => g.products.map((p) => `gid://shopify/Product/${p.id}`));
const variants = new Map();
for (let i = 0; i < ids.length; i += 100) {
  const data = await readAdmin('query($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle variants(first:100){nodes{id}}}}}', {ids: ids.slice(i, i + 100)});
  for (const node of data.nodes) if (node) variants.set(node.handle, node.variants.nodes.map((v) => v.id.split('/').at(-1)));
}
for (const g of plan.configurations) {
  const configId = drafts.find((d) => d.slug === g.slug)?.configUuid;
  if (!configId) { console.log('Skipping (no config yet): ' + g.slug); continue; }
  for (const p of g.products) {
    if (!variants.has(p.handle)) throw new Error('Variants not found for ' + p.handle);
    if (registry[p.handle] && registry[p.handle].configId !== configId) throw new Error(p.handle + ' already belongs to ' + registry[p.handle].configId);
    registry[p.handle] = {configId, schema: 2, variantIds: variants.get(p.handle)};
  }
}
fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2) + '\n');

// Liquid routing: product handle -> config id for the hidden LPO form.
const groups = new Map();
for (const [handle, c] of Object.entries(registry)) groups.set(c.configId, [...(groups.get(c.configId) || []), handle]);
const lines = ['{%- case product.handle -%}', ...[...groups].map(([id, handles]) => `{%- when ${handles.map((h) => `'${h}'`).join(', ')} -%}${id}`), '{%- endcase -%}'];
fs.writeFileSync('shopify-theme/snippets/ob-lpo-config-id.liquid', lines.join('\n') + '\n');
console.log(`Registry: ${Object.keys(registry).length} handles across ${groups.size} configs`);
