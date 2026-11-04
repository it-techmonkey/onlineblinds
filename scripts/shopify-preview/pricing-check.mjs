import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { root, work } from './env.mjs';
const reference = await import(pathToFileURL(path.join(work, 'pricing-reference.mjs')).href);
const catalogue = JSON.parse(fs.readFileSync(path.join(work, 'catalog.json'), 'utf8'));
const data = JSON.parse(fs.readFileSync(path.join(root, 'src/data/pricing/pricing-data.json'), 'utf8'));
const context = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(root, 'shopify-migration/lpo/pricing-engine.js'), 'utf8'), context);
const bands = new Map(data.priceBands.map(b => [b.name, b]));
const widths = new Map(data.widthBands.map(b => [b.id, b.widthInches]));
const heights = new Map(data.heightBands.map(b => [b.id, b.heightInches]));
let compared = 0, rejected = 0;
const normalized = async fn => { try { return { ok: true, value: JSON.parse(JSON.stringify(await fn())) }; } catch (e) { return { ok: false, error: e.message }; } };
// All price cells, including transitions on either side of each width and height
// boundary, plus option surcharges. The original server engine is the oracle.
const representatives = new Map();
for (const p of catalogue.products) {
  const name = p.priceBandName?.value;
  const family = p.tags.filter(t => /roller|day|vertical|slat|electrical/i.test(t)).sort().join('|');
  const key = `${name}:${family}`;
  if (name && bands.has(name) && !representatives.has(key)) representatives.set(key, p);
}
for (const p of representatives.values()) {
  context.OnlineBlindsPricingProduct = { handle: p.handle, title: p.title, tags: p.tags, priceBandName: p.priceBandName.value };
  const band = bands.get(p.priceBandName.value);
  for (const cell of data.priceCells.filter(c => c.priceBandId === band.id)) {
    const w = widths.get(cell.widthBandId), h = heights.get(cell.heightBandId);
    for (const [dw, dh] of [[0, 0], [-0.01, 0], [0.01, 0], [0, -0.01], [0, 0.01]]) {
      const request = { handle: p.handle, widthInches: w + dw, heightInches: h + dh, customizations: [] };
      const expected = await normalized(() => reference.calculateProductPrice(request));
      const actual = await normalized(() => context.OnlineBlindsPricing.calculateProductPrice(request));
      assert.deepEqual(actual, expected, `Pricing mismatch: ${p.handle}, ${w + dw} x ${h + dh}`);
      compared++; if (!expected.ok) rejected++;
    }
  }
  const first = data.priceCells.find(c => c.priceBandId === band.id);
  for (const option of data.customizationOptions) {
    const request = { handle: p.handle, widthInches: widths.get(first.widthBandId), heightInches: heights.get(first.heightBandId), customizations: [{ category: option.category, optionId: option.optionId }] };
    assert.deepEqual(await normalized(() => context.OnlineBlindsPricing.calculateProductPrice(request)), await normalized(() => reference.calculateProductPrice(request)));
    compared++;
  }
}
const report = { compared, boundaryRejections: rejected, representativeProductProfiles: representatives.size, result: 'pass', scope: 'Offline formula engine vs existing server calculator. Does not verify LPO configuration, cart or checkout.' };
fs.writeFileSync(path.join(root, 'shopify-migration/lpo/pricing-check.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
