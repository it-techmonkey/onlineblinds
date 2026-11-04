import fs from 'node:fs';
import path from 'node:path';
import { readAdmin, root, work } from './env.mjs';

// Run catalog.mjs first to refresh the read-only catalog snapshot.
const baseline = JSON.parse(fs.readFileSync(path.join(work, 'catalog-baseline.json'), 'utf8'));
const current = JSON.parse(fs.readFileSync(path.join(work, 'catalog.json'), 'utf8'));
const storeBaseline = JSON.parse(fs.readFileSync(path.join(work, 'store-baseline.json'), 'utf8'));
const state = JSON.parse(fs.readFileSync(path.join(root, 'shopify-migration/preview.json'), 'utf8'));
const themes = (await readAdmin('{ themes(first: 20) { nodes { id name role updatedAt } } }')).themes.nodes;
const compare = (before, after) => {
  const next = new Map(after.map(item => [item.id, item]));
  const previousIds = new Set(before.map(item => item.id));
  return {
    count: after.length,
    changed: before.filter(item => JSON.stringify(item) !== JSON.stringify(next.get(item.id))).map(item => ({
      id: item.id,
      fields: Object.keys(item).filter(key => JSON.stringify(item[key]) !== JSON.stringify(next.get(item.id)?.[key])),
    })),
    added: after.filter(item => !previousIds.has(item.id)).map(item => item.id),
  };
};
const protectedThemes = storeBaseline.themes.nodes;
const preview = themes.find(t => t.id.split('/').at(-1) === String(state.id));
const report = {
  checkedAt: new Date().toISOString(),
  products: compare(baseline.products, current.products),
  collections: compare(baseline.collections, current.collections),
  originalThemes: {
    count: protectedThemes.length,
    changed: protectedThemes.filter(t => {
      const now = themes.find(n => n.id === t.id);
      return !now || now.role !== t.role || now.updatedAt !== t.updatedAt || now.name !== t.name;
    }).map(t => t.id),
  },
  previewRole: preview?.role,
};
fs.writeFileSync(path.join(root, 'shopify-migration/store-audit.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (report.products.changed.length || report.products.added.length || report.collections.changed.length || report.collections.added.length || report.originalThemes.changed.length || preview?.role !== 'UNPUBLISHED') process.exitCode = 1;
