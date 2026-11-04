// Adds Shopify URL redirects (301) from the live site's addresses to the
// matching Shopify addresses, so old links and search results keep working
// after the domain moves. Shopify only uses a redirect when the address would
// otherwise show "Page not found", and only on the Shopify domain, so this
// never changes the live Next.js site or the checkout.
//
// Dry run by default. `node redirects.mjs --apply` creates the missing ones.
// It only adds redirects: existing ones are never changed or deleted. Re-run it
// after a data sync to cover new products.
import fs from 'node:fs';
import path from 'node:path';
import { environment, readAdmin, root, storeDomain, themePath } from './env.mjs';

const apply = process.argv.includes('--apply');
const catalog = JSON.parse(fs.readFileSync(path.join(themePath, 'assets/ob-catalog-data.json'), 'utf8'));
const runtimeSource = fs.readFileSync(path.join(root, 'shopify-src/adapters/runtime.tsx'), 'utf8');
const pageRoutes = Function(`return ${runtimeSource.match(/const pageRoutes[^=]*=\s*(\{[\s\S]*?\});/)[1]}`)();
const snippet = fs.readFileSync(path.join(themePath, 'snippets/ob-runtime.liquid'), 'utf8');
const collectionRoutes = JSON.parse(snippet.match(/routes:(\{.*?\}),assets:/)[1]);

const wanted = new Map();
for (const handle of Object.keys(catalog.products)) wanted.set(`/product/${handle}`, `/products/${handle}`);
for (const [from, to] of Object.entries(pageRoutes)) wanted.set(from, to);
// Collections that exist on Shopify keep their address; the rest go to the
// page that shows the same products as live.
for (const [from, to] of Object.entries(collectionRoutes)) if (to.split('?')[0] !== from) wanted.set(from, to);

let after = null; const existing = new Map();
do {
  const d = await readAdmin('query($a:String){urlRedirects(first:250,after:$a){pageInfo{hasNextPage endCursor} nodes{path target}}}', { a: after });
  for (const r of d.urlRedirects.nodes) existing.set(r.path.toLowerCase().replace(/\/$/, ''), r.target);
  after = d.urlRedirects.pageInfo.hasNextPage ? d.urlRedirects.pageInfo.endCursor : null;
} while (after);

const toCreate = [], clashes = [];
for (const [from, to] of wanted) {
  const current = existing.get(from.toLowerCase());
  if (current === undefined) toCreate.push({ path: from, target: to });
  else if (current !== to) clashes.push({ path: from, current, wanted: to });
}
console.log(`Existing redirects: ${existing.size}. Wanted: ${wanted.size}. Missing: ${toCreate.length}.`);
for (const c of clashes) console.log(`Left unchanged (differs from live): ${c.path} -> ${c.current} (live: ${c.wanted})`);
console.log('Sample:', toCreate.slice(0, 3), toCreate.filter(r => !r.path.startsWith('/product/')));
if (!apply) console.log('Dry run. Add --apply to create them.');
else await createAll();

async function createAll() {
const env = environment();
async function create(redirect) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://${storeDomain(env)}/admin/api/2026-10/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN },
      body: JSON.stringify({ query: 'mutation($r:UrlRedirectInput!){urlRedirectCreate(urlRedirect:$r){urlRedirect{id} userErrors{field message}}}', variables: { r: redirect } }),
      signal: AbortSignal.timeout(30000),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 429 || body.errors?.some(e => e.extensions?.code === 'THROTTLED')) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); continue; }
    if (!res.ok || body.errors) throw new Error(`${redirect.path}: ${res.status} ${JSON.stringify(body.errors)}`);
    return body.data.urlRedirectCreate.userErrors;
  }
  throw new Error(`${redirect.path}: still throttled`);
}
let created = 0; const failed = [];
for (const redirect of toCreate) {
  const errors = await create(redirect);
  if (errors.length) failed.push({ ...redirect, errors }); else created++;
  if ((created + failed.length) % 100 === 0) console.log(`${created + failed.length}/${toCreate.length}`);
}
console.log(`Created ${created}. Failed ${failed.length}.`);
if (failed.length) console.log(JSON.stringify(failed, null, 1));
}
