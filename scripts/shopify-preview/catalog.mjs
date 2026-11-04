import fs from 'node:fs';
import path from 'node:path';
import { readAdmin, work } from './env.mjs';

const products = [];
let cursor = null;
do {
  const { products: page } = await readAdmin(`query Catalog($cursor: String) {
    products(first: 200, after: $cursor) { pageInfo { hasNextPage endCursor } nodes {
      id handle title tags status templateSuffix updatedAt productType
      priceBandName: metafield(namespace: "custom", key: "price_band_name") { value }
    } }
  }`, { cursor });
  products.push(...page.nodes);
  cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
} while (cursor);
const collections = [];
cursor = null;
do {
  const { collections: page } = await readAdmin(`query Collections($cursor: String) {
    collections(first: 200, after: $cursor) { pageInfo { hasNextPage endCursor } nodes { id handle title templateSuffix updatedAt } }
  }`, { cursor });
  collections.push(...page.nodes);
  cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
} while (cursor);
const result = { products, collections };
fs.mkdirSync(work, { recursive: true });
const baseline = path.join(work, 'catalog-baseline.json');
if (!fs.existsSync(baseline)) fs.writeFileSync(baseline, JSON.stringify(result, null, 2));
fs.writeFileSync(path.join(work, 'catalog.json'), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ products: products.length, collections: collections.length,
  productTemplates: [...new Set(products.map(p => p.templateSuffix).filter(Boolean))],
  collectionHandles: collections.map(c => c.handle),
}, null, 2));
