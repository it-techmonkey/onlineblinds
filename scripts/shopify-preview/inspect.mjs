import fs from 'node:fs';
import path from 'node:path';
import { readAdmin, work, storeDomain } from './env.mjs';

fs.mkdirSync(work, { recursive: true });
const data = await readAdmin(`{
  shop { name myshopifyDomain primaryDomain { url } metafields(first: 100) { nodes { namespace key type value } } }
  themes(first: 20) { nodes { id name role updatedAt } }
  productsCount { count }
  pages(first: 100) { nodes { id title handle templateSuffix } }
  appInstallations(first: 50) { nodes { app { title handle } } }
  products(first: 5, query: "status:active") { nodes {
    id handle title tags templateSuffix
    metafields(first: 100) { nodes { namespace key type value } }
  } }
}`);
const baseline = path.join(work, 'store-baseline.json');
if (!fs.existsSync(baseline)) fs.writeFileSync(baseline, JSON.stringify(data, null, 2));
fs.writeFileSync(path.join(work, 'store-inspection.json'), JSON.stringify(data, null, 2));
console.log(JSON.stringify({
  store: storeDomain(), themes: data.themes.nodes, products: data.productsCount.count,
  apps: data.appInstallations.nodes.map(n => n.app.title),
  shopMetafields: data.shop.metafields.nodes.map(({namespace, key, type, value}) => ({ namespace, key, type, bytes: value.length })),
  productMetafields: data.products.nodes.map(p => ({ handle: p.handle, template: p.templateSuffix,
    fields: p.metafields.nodes.map(m => ({ namespace: m.namespace, key: m.key, value: m.value.slice(0, 120) })) })),
}, null, 2));
