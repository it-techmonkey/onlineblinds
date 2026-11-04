import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { root, work } from './env.mjs';
const { chromium } = createRequire(path.join(work, 'tooling/package.json'))('playwright');
const state = JSON.parse(fs.readFileSync(path.join(root, 'shopify-migration/preview.json')));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [], requests = [];
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => { const u = new URL(r.url()); if (/^\/api\/(pricing|reviews|checkout|cart)(\/|$)/.test(u.pathname) || /^\/cart\/add/.test(u.pathname) || (r.isNavigationRequest() && /^\/checkouts?(\/|$)/.test(u.pathname) && !u.pathname.startsWith('/checkouts/internal/'))) requests.push(u.origin + u.pathname); });
await page.goto(`${state.preview_url.replace('?','/products/plain-soft-white-day-and-night-blind?')}`, { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: 'Measure your windows' }).waitFor();
await page.waitForTimeout(2000);
const measure = page.getByRole('button', { name: 'Measure your windows' });
if (await measure.getAttribute('aria-expanded') !== 'true') await measure.click();
const inputs = page.locator('[data-ob-island="product-preview"] input[type="number"]');
if (await inputs.count() < 2) throw new Error('Measurement fields missing');
await inputs.nth(0).fill('100'); await inputs.nth(0).blur();
await inputs.nth(1).fill('120'); await inputs.nth(1).blur();
await measure.click();
if (await measure.getAttribute('aria-expanded') !== 'false') throw new Error('Measurement panel did not collapse');
await measure.click();
const buttons = page.getByRole('button', { name: /^(Add to Cart|Buy Now)/ });
if (!await buttons.count()) throw new Error('Purchase controls missing');
for (const button of await buttons.all()) if (!await button.isDisabled()) throw new Error('Purchase control enabled');
const reports = [];
for (const [name, width, height] of [['desktop',1440,1000],['mobile',390,844]]) {
  await page.setViewportSize({ width, height });
  await page.evaluate(async () => { for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,100));} scrollTo(0,0); });
  await page.waitForTimeout(600);
  await page.screenshot({ path:path.join(work,`product-design-${name}.png`), fullPage:true });
  reports.push(await page.evaluate(() => ({ overflow:document.documentElement.scrollWidth>innerWidth+1, brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src), themeId:window.Shopify.theme.id })));
}
const catalog = JSON.parse(fs.readFileSync(path.join(work,'catalog.json')));
const families = [];
for (const family of ['vertical', 'roller', 'roman', 'skylight', 'perfect-fit']) {
  const product = catalog.products.find(p => p.status === 'ACTIVE' && p.handle.includes(family) && p.priceBandName?.value);
  if (!product) continue;
  await page.goto(`https://${state.store}/products/${product.handle}?preview_theme_id=${state.id}`, {waitUntil:'domcontentloaded'});
  await page.locator('[data-ob-island="product-preview"] h1').waitFor();
  await page.waitForTimeout(1000);
  const content = await page.locator('[data-ob-island="product-preview"]').innerText();
  if (!content.includes(product.title)) throw new Error(`Product failed to render: ${product.handle}`);
  families.push({family,handle:product.handle});
}
await browser.close();
console.log(JSON.stringify({ reports, families, errors, forbiddenRequests: requests },null,2));
if(errors.length||requests.length||reports.some(r=>r.overflow||r.brokenImages.length||String(r.themeId)!==String(state.id))) process.exitCode=1;
