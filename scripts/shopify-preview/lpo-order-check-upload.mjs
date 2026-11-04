// Uploads the order price check data to two shop metafields (namespace
// ob_order_check) and reads them back. This is the only write it can make.
import fs from 'node:fs';
import {environment, storeDomain, readAdmin} from './env.mjs';

const NAMESPACE = 'ob_order_check';
const files = {pricing: 'shopify-migration/lpo/order-check/pricing.json', products: 'shopify-migration/lpo/order-check/products.json'};
const {shop} = await readAdmin('{shop{id}}');
const metafields = Object.entries(files).map(([key, file]) => ({ownerId: shop.id, namespace: NAMESPACE, key, type: 'json', value: fs.readFileSync(file, 'utf8')}));
const env = environment();
const response = await fetch(`https://${storeDomain(env)}/admin/api/2026-10/graphql.json`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN},
  body: JSON.stringify({query: 'mutation($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){metafields{key} userErrors{field message}}}', variables: {m: metafields}}),
  signal: AbortSignal.timeout(60000),
});
const result = await response.json();
if (!response.ok || result.errors || result.data.metafieldsSet.userErrors.length) throw new Error(JSON.stringify(result.errors || result.data.metafieldsSet.userErrors));
const back = await readAdmin(`{shop{pricing: metafield(namespace:"${NAMESPACE}", key:"pricing"){value} products: metafield(namespace:"${NAMESPACE}", key:"products"){value}}}`);
for (const key of Object.keys(files)) if (JSON.stringify(JSON.parse(back.shop[key].value)) !== JSON.stringify(JSON.parse(fs.readFileSync(files[key], 'utf8')))) throw new Error('Read-back mismatch: ' + key);
console.log('Uploaded and verified shop metafields ' + Object.keys(files).map((k) => NAMESPACE + '.' + k).join(', '));
