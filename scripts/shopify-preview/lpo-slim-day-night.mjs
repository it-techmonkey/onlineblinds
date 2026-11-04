// Rebuilds the Day & Night LPO formulas in the small data-driven form and
// verifies them offline against (a) the website's own price calculator and
// (b) the previous, already editor-tested formulas. Writes files only; the
// upload is a separate step (lpo-upload-formulas.mjs).
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {work} from './env.mjs';
import {bandGrid, flatPrice, formulaSource, renameOptions, MESSAGES} from './lpo-slim-formula.mjs';

const folder = 'shopify-migration/lpo/categories/day-night';
const backup = path.join(work, 'backup-2026-10-28-day-night');
const plan = JSON.parse(fs.readFileSync(folder + '/plan.json'));
const drafts = JSON.parse(fs.readFileSync(folder + '/drafts.json'));
const reference = await import(pathToFileURL(path.join(work, 'pricing-reference.mjs')).href);
const baseOptions = JSON.parse(fs.readFileSync('shopify-migration/lpo/pilot-app-options.json'));
fs.mkdirSync(backup, {recursive: true});

// Option name -> source customization category (all flat-priced for this family).
const categories = {
  installationMethod: 'installation-method',
  controlSide: 'control-side',
  chromeUpgrade: 'chrome-upgrade',
  cassetteMatchingBar: 'cassette-bar',
  sameFabricInsert: 'fabric-insert-cassette',
};

function mockOptions(values, prices, listName) {
  let error;
  const api = {
    // Accept both the hidden (_name) and the previous plain option names.
    value: (n) => values[n.replace(/^_/, '')],
    option: () => ({errors: []}),
    error: (n, m) => { error = m; },
    list: (n) => { if (n !== listName) throw new Error('Wrong list ' + n); return prices; },
    lookup: (list, x, y) => list.get(x + ':' + y),
  };
  return {api, error: () => error};
}

const results = [];
for (const group of plan.configurations) {
  const draft = drafts.find((d) => d.key === group.key);
  const engine = fs.readFileSync(path.join(work, 'category-' + group.slug + '.js'), 'utf8');
  const engineApi = new Function(engine + ';return OBCategory;')();
  const grid = bandGrid(group.bandId);

  const prices = {};
  for (const [name, category] of Object.entries(categories)) {
    const option = baseOptions.find((o) => o.name === name);
    for (const v of option.values) {
      const price = flatPrice(category, v.value);
      if (price) (prices[name] ||= {})[v.value] = price;
    }
  }
  const schema = {
    list: group.listDescription,
    grid,
    clamp: engineApi.clamp,
    manual: engineApi.manualLimits,
    motor: engineApi.motorLimits,
    forceMotorized: group.motorized,
    prices,
    manualOnly: ['controlSide', 'chromeUpgrade'],
    motorBase: 75 + flatPrice('motorization', 'motorized'),
  };
  const formula = formulaSource(schema);
  // The previous formulas read original table prices from an Assets list, so the
  // old/new comparison uses a copy without the temporary price increase; the
  // real (increased) formula is checked against the website calculator below.
  const gridRaw = bandGrid(group.bandId, {uplift: false});
  const formulaRaw = formulaSource({...schema, grid: gridRaw});

  // Previous formula, kept as a second oracle.
  const oldFile = folder + '/' + group.slug + '-formula.js';
  const backupFile = path.join(backup, group.slug + '-formula.js');
  if (!fs.existsSync(backupFile)) fs.copyFileSync(oldFile, backupFile);
  const oldFormula = fs.readFileSync(backupFile, 'utf8');
  const runOld = new Function('options', oldFormula);
  const runNew = new Function('options', formula);
  const runRaw = new Function('options', formulaRaw);

  // Build the Assets list as stored: exact band coordinates in mm.
  const raw = JSON.parse(fs.readFileSync('src/data/pricing/pricing-data.json', 'utf8'));
  const wb = new Map(raw.widthBands.map((b) => [b.id, b.widthMm]));
  const hb = new Map(raw.heightBands.map((b) => [b.id, b.heightMm]));
  const stored = new Map(gridRaw.cells.map((c) => [wb.get(c.widthBandId) + ':' + hb.get(c.heightBandId), Number(c.price)]));

  // Sizes: every band edge in inches (just under, on, just over) plus a coarse sweep.
  const edgesW = new Set(), edgesH = new Set();
  for (const [inch] of grid.w) for (const d of [-0.6, -0.01, 0, 0.01, 0.6]) edgesW.add(inch + d);
  for (const [inch] of grid.h) for (const d of [-0.6, -0.01, 0, 0.01, 0.6]) edgesH.add(inch + d);
  for (const v of [0, 5, 10.9, 11, 12.99, 13, 23.99, 24, 94, 94.01, 96, 96.01, 120]) { edgesW.add(v); edgesH.add(v); }
  const ws = [...edgesW].filter((v) => v >= 0).sort((a, b) => a - b);
  const hs = [...edgesH].filter((v) => v >= 0).sort((a, b) => a - b);

  const combos = [];
  for (const motor of group.motorized ? [true] : [false, true])
    for (const chrome of ['no', 'yes'])
      for (const cassette of ['white', 'black', 'grey'])
        for (const insert of ['no', 'yes'])
          combos.push({motor, chrome, cassette, insert});

  let compared = 0, rejected = 0, oldCompared = 0;
  const check = async (handle, widthIn, heightIn, unit, combo) => {
    const factor = unit === 'cm' ? 2.54 : 25.4;
    // Values as the theme sends them: whole units plus a cm fraction digit.
    const wv = unit === 'cm' ? Math.floor(widthIn * factor) : Math.round(widthIn * factor);
    const hv = unit === 'cm' ? Math.floor(heightIn * factor) : Math.round(heightIn * factor);
    const wf = unit === 'cm' ? Math.round((widthIn * factor - wv) * 10) % 10 : 0;
    const hf = unit === 'cm' ? Math.round((heightIn * factor - hv) * 10) % 10 : 0;
    const values = {width: wv, height: hv, widthFraction: wf, heightFraction: hf, measurementUnit: unit,
      installationMethod: 'inside-mount', controlSide: 'left', chromeUpgrade: combo.chrome,
      cassetteMatchingBar: combo.cassette, sameFabricInsert: combo.insert, motorization: combo.motor ? 'motorized' : 'none'};
    const a = mockOptions(values, stored, group.listDescription);
    const actual = runNew(a.api);
    const b = mockOptions(values, stored, group.listDescription);
    const previous = runOld(b.api);
    const r = mockOptions(values, stored, group.listDescription);
    const actualRaw = runRaw(r.api);
    if (handle === group.representative) {
      if (Math.abs(actualRaw - previous) > 0.011 || (r.error() || null) !== (b.error() || null))
        throw new Error(`Old/new mismatch ${group.slug} ${JSON.stringify(values)} new=${actualRaw}/${r.error()} old=${previous}/${b.error()}`);
      oldCompared++;
    }
    const w = (wv + wf / 10) / (unit === 'cm' ? 2.54 : 25.4), h = (hv + hf / 10) / (unit === 'cm' ? 2.54 : 25.4);
    let expected, expectedError;
    try {
      engineApi.checkSize(w, h, combo.motor);
      expected = (await reference.calculateProductPrice({handle, widthInches: w, heightInches: h, customizations: [
        {category: 'installation-method', optionId: 'inside-mount'},
        {category: 'cassette-bar', optionId: combo.cassette},
        {category: 'fabric-insert-cassette', optionId: combo.insert},
        ...(combo.motor ? [{category: 'motorization', optionId: 'motorized'}]
          : [{category: 'control-side', optionId: 'left'}, {category: 'chrome-upgrade', optionId: combo.chrome}]),
      ]})).totalPrice;
    } catch (e) { expectedError = e.message; }
    if (expectedError) {
      if (actual !== 0 || a.error() !== expectedError) throw new Error(`Rejection mismatch ${group.slug} ${handle} ${JSON.stringify(values)} got ${actual}/${a.error()} want ${expectedError}`);
      rejected++;
    } else if (a.error() || Math.abs(actual - expected) > 0.011) {
      throw new Error(`Price mismatch ${group.slug} ${handle} ${JSON.stringify(values)} got ${actual}/${a.error()} want ${expected}`);
    }
    compared++;
  };

  // Add-ons do not depend on size, so the dense size grid uses the all-off and
  // all-on combos; every combo is then exercised on a spread of sizes.
  const extremes = combos.filter((c) => (c.chrome === 'no' && c.cassette === 'white' && c.insert === 'no') || (c.chrome === 'yes' && c.cassette === 'grey' && c.insert === 'yes'));
  for (const unit of ['cm', 'mm'])
    for (const wIn of ws) for (const hIn of hs) for (const combo of extremes)
      await check(group.representative, wIn, hIn, unit, combo);
  for (const unit of ['cm', 'mm'])
    for (let i = 0; i < ws.length; i += 7) for (let j = 0; j < hs.length; j += 7) for (const combo of combos)
      await check(group.representative, ws[i], hs[j], unit, combo);
  // Every assigned product, on a smaller grid.
  for (const p of group.products)
    for (const [wIn, hIn] of [[20, 30], [39.5, 47.2], [60, 80], [95.9, 93.9], [13, 13], [24, 11]])
      for (const combo of combos) await check(p.handle, wIn, hIn, 'cm', combo);

  fs.writeFileSync(oldFile, formula);
  const backupOptions = path.join(backup, group.slug + '-options.json');
  if (!fs.existsSync(backupOptions)) fs.copyFileSync(folder + '/' + group.slug + '-options.json', backupOptions);
  const options = renameOptions(JSON.parse(fs.readFileSync(backupOptions)));
  options.find((o) => o.name === '_measurementUnit').values.forEach((v) => { v.priceFormula = formula; });
  fs.writeFileSync(folder + '/' + group.slug + '-options.json', JSON.stringify(options, null, 2) + '\n');

  const record = {description: group.description, configUuid: draft.configUuid, products: group.products.length,
    compared, rejected, comparedWithPreviousFormula: oldCompared,
    formulaBytes: Buffer.byteLength(formula), previousFormulaBytes: Buffer.byteLength(oldFormula),
    formulaSha256: createHash('sha256').update(formula).digest('hex')};
  results.push(record);
  console.log(`${group.description}: ${compared} source checks (${rejected} rejections), ${oldCompared} old-formula checks, ${record.previousFormulaBytes} -> ${record.formulaBytes} bytes`);
}
fs.writeFileSync(folder + '/formula-check.json', JSON.stringify({
  date: '2026-10-28',
  scope: 'Slim data-driven formulas. Offline: website calculator for every assigned product, and identical output to the previous editor-tested formula on every band edge in cm and mm. Editor/storefront checks are separate.',
  messages: MESSAGES, passed: true, checks: results,
}, null, 2) + '\n');
