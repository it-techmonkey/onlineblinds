// Storefront check for active LPO configurations on the unpublished preview
// theme. For one product per configuration it drives the real LPO instance on
// the product page and compares price / rejection with the website calculator.
// Read-only: it never adds to cart. Usage:
//   node scripts/shopify-preview/lpo-storefront-check.mjs day-night [slug...]
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {work} from './env.mjs';
import {initialize, call} from './lpo-mcp.mjs';

const [category, ...only] = process.argv.slice(2);
const folder = path.join('shopify-migration/lpo/categories', category);
const plan = JSON.parse(fs.readFileSync(path.join(folder, 'plan.json')));
const drafts = JSON.parse(fs.readFileSync(path.join(folder, 'drafts.json')));
const reference = await import(pathToFileURL(path.join(work, 'pricing-reference.mjs')).href);
const {chromium} = createRequire(path.join(work, 'tooling/package.json'))('playwright');
const read = (r) => r.structuredContent || JSON.parse(r.content.find((c) => c.type === 'text').text);
await initialize();

const base = {width: 100, height: 120, widthFraction: 0, heightFraction: 0, measurementUnit: 'cm', installationMethod: 'inside-mount',
  controlSide: 'left', chromeUpgrade: 'no', cassetteMatchingBar: 'white', sameFabricInsert: 'no', motorization: 'none'};
const cases = (motorizedOnly) => [
  ['base cm', {}],
  ['mm', {width: 1000, height: 1200, measurementUnit: 'mm'}],
  ['fractions', {width: 99, widthFraction: 7, height: 151, heightFraction: 3}],
  ['upgrades', {chromeUpgrade: 'yes', cassetteMatchingBar: 'grey', sameFabricInsert: 'yes'}],
  ...(motorizedOnly ? [] : [['motorised', {motorization: 'motorized', cassetteMatchingBar: 'black'}]]),
  ['large', {width: 240, height: 230}],
  ['too small', {width: 10}],
  ['too large', {width: 400}],
  ['zero', {width: 0}],
];

const browser = await chromium.connectOverCDP('http://127.0.0.1:9334');
const page = await browser.contexts()[0].newPage();
const results = [];
try {
  for (const group of plan.configurations) {
    if (only.length && !only.includes(group.slug)) continue;
    const draft = drafts.find((d) => d.key === group.key);
    const stored = read(await call('config_get', {configUuid: draft.configUuid}));
    if (!stored.enabled) { console.log('SKIP (inactive) ' + group.description); continue; }
    await page.goto(`https://online-blinds-express.myshopify.com/products/${group.representative}?preview_theme_id=200474362240`, {waitUntil: 'domcontentloaded'});
    await page.waitForFunction(() => window.OnlineBlindsLpoPilot?.instance, null, {timeout: 30000});
    for (const [name, change] of cases(group.motorized)) {
      const values = {...base, ...change, ...(group.motorized ? {motorization: 'motorized'} : {})};
      const state = await page.evaluate(async (v) => {
        const inst = window.OnlineBlindsLpoPilot.instance;
        await inst.updateValues(Object.fromEntries(Object.entries(v).map(([k, x]) => ['_' + k, x])));
        await new Promise((r) => setTimeout(r, 400));
        const input = document.querySelector('[data-option="_width"] input');
        return {price: inst.price.final, native: input ? input.validationMessage : null};
      }, values);
      // Fractions are extra millimetres and only apply to centimetre entry.
      const cm = values.measurementUnit === 'cm';
      const w = cm ? (values.width + values.widthFraction / 10) / 2.54 : values.width / 25.4;
      const h = cm ? (values.height + values.heightFraction / 10) / 2.54 : values.height / 25.4;
      const motor = values.motorization === 'motorized';
      let expected = null, error = null;
      try {
        const engine = new Function(fs.readFileSync(path.join(work, 'category-' + group.slug + '.js'), 'utf8') + ';return OBCategory;')();
        engine.checkSize(w, h, motor);
        expected = (await reference.calculateProductPrice({handle: group.representative, widthInches: w, heightInches: h, customizations: [
          {category: 'cassette-bar', optionId: values.cassetteMatchingBar}, {category: 'fabric-insert-cassette', optionId: values.sameFabricInsert},
          ...(motor ? [{category: 'motorization', optionId: 'motorized'}] : [{category: 'chrome-upgrade', optionId: values.chromeUpgrade}]),
        ]})).totalPrice;
      } catch (e) { error = e.message; }
      const passed = error ? state.price === 0 && state.native === error : Math.abs(state.price - expected) < 0.011 && !state.native;
      results.push({config: group.description, product: group.representative, case: name, expected, error, actual: state.price, native: state.native, passed});
      console.log(`${passed ? 'PASS' : 'FAIL'} ${group.description} / ${name}: LPO ${state.price}${error ? ' (expects rejection)' : ' vs ' + expected}`);
    }
  }
} finally {
  await page.close();
  await browser.close();
}
const out = path.join(folder, 'storefront-check.json');
fs.writeFileSync(out, JSON.stringify({date: new Date().toISOString().slice(0, 10), scope: 'Real LPO instance on the preview product page; no cart', passed: results.every((r) => r.passed), total: results.length, results}, null, 2) + '\n');
if (!results.every((r) => r.passed)) process.exitCode = 1;
