// Storefront check for generic (v2) LPO configs on the unpublished preview.
// Drives the real LPO instance on one product per active config and compares
// with the website calculator. Read-only: never adds to cart.
// Usage: node scripts/shopify-preview/lpo-storefront-check-generic.mjs roller
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {work} from './env.mjs';
import {initialize, call} from './lpo-mcp.mjs';

const category = process.argv[2];
const folder = path.join('shopify-migration/lpo/categories', category);
const plan = JSON.parse(fs.readFileSync(path.join(folder, 'generic-plan.json')));
const drafts = JSON.parse(fs.readFileSync(path.join(folder, 'drafts.json')));
const reference = await import(pathToFileURL(path.join(work, 'pricing-reference.mjs')).href);
const {chromium} = createRequire(path.join(work, 'tooling/package.json'))('playwright');
const read = (r) => r.structuredContent || JSON.parse(r.content.find((c) => c.type === 'text').text);
await initialize();

const base = {width: 100, height: 120, widthFraction: 0, heightFraction: 0, measurementUnit: 'cm'};
const cases = [
  ['base', {}, []],
  ['mm', {width: 1000, height: 1200, measurementUnit: 'mm'}, []],
  ['fractions', {width: 99, widthFraction: 7, height: 151, heightFraction: 3}, [['installation-method', 'inside-recess']]],
  ['cassette', {}, [['roller-cassette', 'grey'], ['matching-fabric-cassette', 'yes']]],
  ['chain + bottom bar', {}, [['chain-color', 'chrome-metal'], ['bottom-bar', 'grey-round-bar']]],
  ['motorised', {width: 150}, [['motorization', 'motorized']]],
  ['large', {width: 250, height: 280}, [['roller-cassette', 'black']]],
  ['too small', {width: 10}, []],
  ['too large', {width: 400}, []],
  ['zero', {width: 0}, []],
];

const browser = await chromium.connectOverCDP('http://127.0.0.1:9334');
const page = await browser.contexts()[0].newPage();
const results = [];
try {
  for (const g of plan.configurations) {
    const draft = drafts.find((d) => d.slug === g.slug);
    if (!draft || !read(await call('config_get', {configUuid: draft.configUuid})).enabled) { console.log('SKIP (inactive) ' + g.description); continue; }
    await page.goto(`https://online-blinds-express.myshopify.com/products/${g.representative}?preview_theme_id=200474362240`, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.OnlineBlindsLpoPilot?.instance, null, {timeout: 30000});
    const kind = g.schema?.kind || 'band';
    // Skylights add a blind type; slats and skylights ignore the hidden size fields.
    const raw = JSON.parse(fs.readFileSync('src/data/pricing/pricing-data.json', 'utf8'));
    const skylightType = raw.customizationOptions.find((o) => o.category === 'skylight-blind-type');
    const extra = kind === 'skylight' ? [['skylight type', {}, [['skylight-blind-type', skylightType.optionId]]]] : kind === 'slat' ? [['slat drop 230cm', {height: 230}, []], ['slat drop 2400mm', {height: 2400, measurementUnit: 'mm'}, []]] : [];
    for (const [name, change, set] of [...cases, ...extra]) {
      const values = {...base, ...change, customizations: set.map((s) => s.join(':')).join('|')};
      if (kind !== 'band') values.width = '';
      if (kind === 'skylight') values.height = '';
      const state = await page.evaluate(async (v) => {
        const inst = window.OnlineBlindsLpoPilot.instance;
        await inst.updateValues(Object.fromEntries(Object.entries(v).map(([k, x]) => ['_' + k, x])));
        await new Promise((r) => setTimeout(r, 400));
        const input = document.querySelector('[data-option="_width"] input');
        return {price: inst.price.final, native: input ? input.validationMessage : null};
      }, values);
      const cm = values.measurementUnit === 'cm';
      let w = cm ? (values.width + values.widthFraction / 10) / 2.54 : values.width / 25.4;
      let h = cm ? (values.height + values.heightFraction / 10) / 2.54 : values.height / 25.4;
      if (kind === 'slat') w = 16;
      if (kind === 'skylight') { w = 1; h = 1; }
      let expected = null, error = null;
      try { expected = (await reference.calculateProductPrice({handle: g.representative, widthInches: w, heightInches: h, customizations: set.map(([category, optionId]) => ({category, optionId}))})).totalPrice; }
      catch (e) { error = e.message; }
      const passed = error ? state.price === 0 && state.native === error : Math.abs(state.price - expected) < 0.011 && !state.native;
      results.push({config: g.description, product: g.representative, case: name, expected, error, actual: state.price, native: state.native, passed});
      console.log(`${passed ? 'PASS' : 'FAIL'} ${g.description} / ${name}: LPO ${state.price}${error ? ' (expects rejection: ' + state.native + ')' : ' vs ' + expected}`);
    }
  }
} finally { await page.close(); await browser.close(); }
fs.writeFileSync(path.join(folder, 'storefront-check.json'), JSON.stringify({date: new Date().toISOString().slice(0, 10), scope: 'Real LPO on the preview product page; no cart', passed: results.every((r) => r.passed), total: results.length, results}, null, 2) + '\n');
if (!results.every((r) => r.passed)) process.exitCode = 1;
