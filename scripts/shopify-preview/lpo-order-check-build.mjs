// Builds the Shopify-only order price check (Shopify Flow "Run code").
// LPO's cart transform charges whatever price the browser sends, so every web
// order is re-priced in Flow from the order details staff build from (Width,
// Height, Motorization, ...) with the same formulas LPO uses, and compared with
// what was charged. Live-site orders (draft orders) are not checked; the live
// site and its backend are not involved.
// Writes shopify-migration/lpo/order-check/: pricing.json + products.json (shop
// metafields), run-code.js, input-query.graphql, output-schema.graphql, test.json.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {root, work} from './env.mjs';

const OUT = 'shopify-migration/lpo/order-check';
const NAMESPACE = 'ob_order_check';
fs.mkdirSync(OUT, {recursive: true});
const reference = await import(pathToFileURL(path.join(work, 'pricing-reference.mjs')).href);

// Live helpers, bundled from the source (live code is read, never changed).
const {build} = createRequire(path.join(work, 'tooling/package.json'))('esbuild');
const helpersFile = path.join(work, 'order-check-helpers.mjs');
await build({stdin: {contents: `export {configToCustomizations, buildLineItemProperties} from 'ob-order-functions';
export {isRomanProduct} from './src/lib/roman-blinds';
export {isRollerBlindProduct} from './src/lib/roller-blinds';
export {isPerfectFitMetalProduct} from './src/lib/perfect-fit-metal';
export {isPerfectFitShutterProduct} from './src/lib/perfect-fit-shutter';
export {isHeightOnlyVerticalProduct} from './src/lib/vertical-blinds';
export {isSkylightProduct} from './src/lib/skylight';
export {SKYLIGHT_BRAND_OPTIONS, SKYLIGHT_BLIND_TYPE_PRICING, getSkylightBlindTypeOptionId} from './src/data/skylight';
export {getInstallationServiceTier} from './src/lib/pricing';`, resolveDir: root, loader: 'ts'},
  outfile: helpersFile, bundle: true, format: 'esm', platform: 'node', tsconfig: path.join(root, 'tsconfig.json'), logLevel: 'warning',
  plugins: [{name: 'order-functions', setup(b) {
    b.onResolve({filter: /^ob-order-functions$/}, (args) => ({path: args.path, namespace: 'order-functions'}));
    b.onLoad({filter: /.*/, namespace: 'order-functions'}, () => {
      const source = fs.readFileSync(path.join(root, 'src/lib/server/order.service.ts'), 'utf8').replace(/\r\n/g, '\n');
      const start = source.indexOf('function configToCustomizations(');
      const end = source.indexOf('\n}\n', source.indexOf('function buildLineItemProperties(')) + 3;
      if (start < 0 || end < start) throw new Error('Order service source structure changed');
      const imports = source.split('\n').filter((l) => /^import .* from '@\/(lib|data)\//.test(l) && !l.includes('@/lib/pricing')).join('\n');
      return {contents: `${imports}\ntype PricingRequest = any; type CheckoutItemRequest = any;\n${source.slice(start, end)}\nexport {configToCustomizations, buildLineItemProperties};`, loader: 'ts', resolveDir: path.join(root, 'src/lib/server')};
    });
  }}]});
const H = await import(pathToFileURL(helpersFile).href + '?' + Date.now());

// 1. Pricing data: each config's formula data, with shared option tables stored once.
const base = 'shopify-migration/lpo/categories';
const bodies = [], tables = [], configs = [], configIndex = {};
for (const category of fs.readdirSync(base).sort()) {
  const draftsFile = path.join(base, category, 'drafts.json');
  if (!fs.existsSync(draftsFile)) continue;
  for (const draft of JSON.parse(fs.readFileSync(draftsFile))) {
    const formula = fs.readFileSync(path.join(base, category, draft.slug + '-formula.js'), 'utf8');
    const m = formula.match(/^var D=(\{.*?\}),M=(\[.*?\]),Q=("[^"]*");\n?/s);
    if (!m) throw new Error('Unexpected formula format: ' + draft.slug);
    const body = formula.slice(m[0].length);
    if (!bodies.includes(body)) bodies.push(body);
    const D = JSON.parse(m[1]);
    if (D.t) { const key = JSON.stringify(D.t); let i = tables.findIndex((t) => JSON.stringify(t) === key); if (i < 0) i = tables.push(D.t) - 1; delete D.t; D.T = i; }
    configIndex[draft.configUuid] = configs.length;
    configs.push([bodies.indexOf(body), D]);
  }
}
const MESSAGES = JSON.parse(fs.readFileSync(path.join(base, 'day-night', 'day-and-night-band-d-formula.js'), 'utf8').match(/,M=(\[.*?\]),Q=/s)[1]);
// Day & Night (schema 1) formulas read named fields instead of a customization list.
const dnBody = bodies.findIndex((b) => b.includes('for(var n in D.p)'));
const brands = Object.fromEntries(H.SKYLIGHT_BRAND_OPTIONS.map((o) => [o.name, o.id]));
const blindTypes = {};
for (const [brand, list] of Object.entries(H.SKYLIGHT_BLIND_TYPE_PRICING)) for (const o of list) blindTypes[brand + '|' + o.code] = H.getSkylightBlindTypeOptionId(brand, o.code);
const installation = Object.fromEntries([1, 2, 6].map((n) => { const t = H.getInstallationServiceTier(n); return [t.variantTitle, t.price]; }));
// Day & Night choices LPO offers (union over its configurations); other values are not orderable.
const dnAllowed = {};
for (const file of fs.readdirSync(path.join(base, 'day-night')).filter((f) => f.endsWith('-options.json'))) {
  for (const field of JSON.parse(fs.readFileSync(path.join(base, 'day-night', file)))) {
    const key = field.name.slice(1);
    if (!field.values || !['installationMethod', 'controlSide', 'chromeUpgrade', 'cassetteMatchingBar', 'sameFabricInsert', 'motorization'].includes(key)) continue;
    dnAllowed[key] = [...new Set([...(dnAllowed[key] || []), ...field.values.map((x) => x.value)])];
  }
}
if (Object.keys(dnAllowed).length !== 6) throw new Error('Day & Night option lists not found');
const pricing = {v: 1, M: MESSAGES, T: tables, C: configs, dn: dnBody, dnAllowed, brands, blindTypes, installation};

// 2. Products: numeric product id (base 36) -> [config index, flags].
// flags: 1 Roman (chain colour table), 2 Perfect Fit metal (frame colour table),
// 4 Roller (cassette bar table) - the same product rules the live server uses.
const catalog = JSON.parse(fs.readFileSync(path.join(work, 'catalog.json')));
const registry = JSON.parse(fs.readFileSync('shopify-src/lpo-configurations.json'));
const products = {}, productInfo = {};
for (const p of catalog.products) {
  const entry = registry[p.handle];
  if (!entry) continue;
  const index = configIndex[entry.configId];
  if (index === undefined) throw new Error('No formula for ' + p.handle);
  const id = Number(p.id.split('/').at(-1));
  const flags = (H.isRomanProduct(p.tags) ? 1 : 0) | (H.isPerfectFitMetalProduct({tags: p.tags}) ? 2 : 0) | (H.isRollerBlindProduct(p.tags) ? 4 : 0);
  products[id.toString(36)] = flags ? [index, flags] : index;
  productInfo[p.handle] = {id, tags: p.tags, index};
}

// 3. The Flow code. CHECK is plain ES2020 so the same text runs here in tests.
const CHECK = String.raw`
var BODIES = [${bodies.map((b) => 'function(D,M,Q,options){' + b + '\n}').join(',\n')}];
var LABELS = {'Colour':'colour','Headrail':'headrail','Headrail Colour':'headrailColour','Installation':'installationMethod','Measurement Type':'installationMethod','Control Option':'controlOption','Window Handle Location':'controlOption','Lining Type':'liningType','Stacking':'stacking','Control Side':'controlSide','Bottom Chain':'bottomChain','Bracket Type':'bracketType','Bracket Size':'bracketType','Chain Color':'chainColor','Chrome Upgrade':'chromeUpgrade','Wrapped Cassette':'wrappedCassette','Cassette Bar':'cassetteMatchingBar','Same Fabric Insert':'sameFabricInsert','Matching Fabric on Cover Cassette':'matchingFabricCassette','Motorization':'motorization','Brand':'brand','Blind Type':'blindType','Blind Color':'blindColor','Frame Color':'frameColor','Handle Position':'handlePosition','Number of Panels':'numberOfPanels','Opening Direction':'openingDirection','Bottom Bar':'bottomBar','Roll Style':'rollStyle','Room Type':'roomType','Blind Name':'blindName','Width':'','Height':''};
var CATEGORY = {roomType:'room-type',headrail:'headrail',headrailColour:'headrail-colour',installationMethod:'installation-method',controlOption:'control-option',liningType:'lining-type',stacking:'stacking',controlSide:'control-side',bottomChain:'bottom-chain',bracketType:'bracket-type',chainColor:'chain-color',chromeUpgrade:'chrome-upgrade',wrappedCassette:'wrapped-cassette',cassetteMatchingBar:'cassette-bar',sameFabricInsert:'fabric-insert-cassette',matchingFabricCassette:'matching-fabric-cassette',motorization:'motorization',brand:'skylight-brand',blindType:'skylight-blind-type',blindColor:'blind-color',numberOfPanels:'number-of-panels',openingDirection:'opening-direction',bottomBar:'bottom-bar',rollStyle:'roll-style',frameColor:'frame-color'};
var DN_FIELDS = ['installationMethod','controlSide','chromeUpgrade','cassetteMatchingBar','sameFabricInsert','motorization','roomType','blindName'];
var TOLERANCE = 0.5; // the live checkout accepts the same difference
function list(x) { return !x ? [] : Array.isArray(x) ? x : x.nodes ? x.nodes : x.edges ? x.edges.map(function (e) { return e.node; }) : []; }
function num(gid) { return gid ? Number(String(gid).split('/').pop()) : null; }
function money(set) { return set && set.shopMoney ? Number(set.shopMoney.amount) : NaN; }
function cm(inches) { return (inches * 2.54).toFixed(1) + 'cm'; }
function attrs(items) { var out = {}; items.forEach(function (a) { if (a && a.key != null) out[a.key] = String(a.value == null ? '' : a.value); }); return out; }

// Price one blind from the details written on the order. Returns {price} or {error}.
function priceBlind(P, entry, a) {
  var index = typeof entry === 'number' ? entry : entry[0], flags = typeof entry === 'number' ? 0 : entry[1];
  var c = P.C[index], body = BODIES[c[0]], D = c[1];
  if (D.T != null) { D = Object.assign({}, D, {t: P.T[D.T]}); }
  for (var key in a) if (key.charAt(0) !== '_' && !(key in LABELS)) return {error: 'unexpected detail "' + key + '"'};
  // Size: LPO's own values, which must agree with the readable Width/Height
  // staff build from. Without LPO's values, the readable size (cm) is priced.
  var unit = a._measurementUnit === 'mm' || a._measurementUnit === 'cm' ? a._measurementUnit : null, v = {_measurementUnit: unit || 'cm'};
  ['width', 'height'].forEach(function (s) {
    var raw = a['_' + s], frac = Number(a['_' + s + 'Fraction'] || 0), label = s === 'width' ? 'Width' : 'Height', shown = a[label];
    if (raw != null && String(raw).trim() !== '' && unit) {
      var n = Number(raw), inches = unit === 'cm' ? (n + frac / 10) / 2.54 : n / 25.4;
      if (!isFinite(inches)) v.error = label + ' could not be read';
      else if (shown == null) v.error = label + ' is missing from the order details';
      else if (shown !== cm(inches)) v.error = label + ' on the order (' + shown + ') differs from the priced size (' + cm(inches) + ')';
      v['_' + s] = raw; v['_' + s + 'Fraction'] = frac;
    } else if (shown != null) {
      var parsed = /^\d+(\.\d+)?cm$/.test(shown) ? Number(shown.slice(0, -2)) : NaN;
      if (!isFinite(parsed)) v.error = label + ' could not be read';
      v['_' + s] = String(v._measurementUnit === 'mm' ? Math.round(parsed * 10) : parsed); v['_' + s + 'Fraction'] = 0;
    } else v['_' + s] = '';
  });
  if (v.error) return {error: v.error};
  // Options: what staff will build, as the live server reads it.
  if (c[0] === P.dn) {
    var bad = null;
    DN_FIELDS.forEach(function (f) {
      for (var label in LABELS) if (LABELS[label] === f && a[label] != null) {
        if (P.dnAllowed[f] && P.dnAllowed[f].indexOf(a[label]) < 0) bad = label + ' "' + a[label] + '" is not offered for this blind';
        v['_' + f] = a[label];
      }
    });
    // Paid manual-control extras are not offered on motorised blinds.
    if (!bad && (D.f === 1 || v._motorization === 'motorized')) (D.o || []).forEach(function (n) { if (D.p[n] && D.p[n][v['_' + n]] > 0) bad = n + ' "' + v['_' + n] + '" is not offered with motorisation'; });
    if (bad) return {error: bad};
  } else {
    var parts = [], brand = a.Brand != null ? P.brands[a.Brand] : null;
    if (a.Brand != null && !brand) return {error: 'unknown skylight brand "' + a.Brand + '"'};
    for (var label in LABELS) {
      var k = LABELS[label], value = a[label];
      if (!k || value == null || value === '' || !CATEGORY[k]) continue;
      var cat = CATEGORY[k];
      if (k === 'chainColor' && (flags & 1)) cat = 'roman-chain-color';
      if (k === 'frameColor' && (flags & 2)) cat = 'perfect-fit-metal-frame-color';
      if (k === 'cassetteMatchingBar' && (flags & 4)) cat = 'roller-cassette';
      if (k === 'brand') value = brand;
      if (k === 'blindType') { value = P.blindTypes[brand + '|' + value]; if (!value) return {error: 'unknown skylight blind type "' + a[label] + '"'}; }
      parts.push(cat + ':' + value);
    }
    v._customizations = parts.join('|');
  }
  var error = null;
  var price = body(D, P.M, '_', {value: function (n) { return v[n]; }, option: function () { return null; }, error: function (n, m) { error = m; }});
  if (error || !(price > 0)) return {error: error || 'the size or options could not be priced'};
  return {price: price};
}

function check(input) {
  var order = input && input.order;
  if (!order) return result(true, 0, 'No order in the trigger.');
  // Shop metafields arrive through Flow variables (strings); tests may pass {value}.
  var shop = input.shop || {}, P = null, PRODUCTS = null;
  function data(x) { var t = x != null && typeof x === 'object' && 'value' in x ? x.value : x; return typeof t === 'string' ? JSON.parse(t) : t; }
  try { P = data(shop.pricing); PRODUCTS = data(shop.products); if (!P || !P.C || !P.installation || !PRODUCTS) P = null; } catch { P = null; }
  if (order.sourceName === 'shopify_draft_order') return result(true, 0, 'Live-site draft order: priced by the live backend, not checked here.' + (P ? ' (Price data loaded: ' + P.C.length + ' configurations.)' : ' (Price data could not be read.)'));
  if (!P) return result(false, 0, 'The price check data is missing. Check this order manually.');
  var lines = list(order.lineItems), groups = {}, problems = [], blindCount = 0, checked = 0, installations = [];
  lines.forEach(function (line) {
    var g = line.lineItemGroup, key = g && g.id ? 'g' + g.id : 'l' + line.id;
    if (!groups[key]) groups[key] = {group: g, lines: []};
    groups[key].lines.push(line);
  });
  Object.keys(groups).forEach(function (key) {
    var entry = groups[key], g = entry.group, blind = null, helpers = 0, other = [];
    entry.lines.forEach(function (line) {
      var handle = line.product && line.product.handle, id = num(line.product && line.product.id);
      if (handle === 'installation-service') installations.push(line);
      else if (handle === 'product-options') helpers++;
      else if (id != null && PRODUCTS[id.toString(36)] != null && !blind) blind = line;
      else other.push(line);
    });
    other.forEach(function (line) { problems.push((line.title || 'Item') + ': not a product the price check knows.'); });
    if (!blind) { if (helpers) problems.push('Product options line without a blind.'); return; }
    var quantity = g && g.quantity ? Number(g.quantity) : Number(blind.quantity);
    var charged = 0; entry.lines.forEach(function (line) { var h = line.product && line.product.handle; if (h !== 'installation-service') charged += money(line.originalTotalSet); });
    var unit = charged / quantity, a = attrs(list(g && g.customAttributes)), own = attrs(list(blind.customAttributes));
    for (var k in own) { if (k in a && a[k] !== own[k]) { problems.push(blind.title + ': order details disagree ("' + k + '").'); return; } a[k] = own[k]; }
    blindCount += quantity; checked++;
    var priced = priceBlind(P, PRODUCTS[num(blind.product.id).toString(36)], a);
    if (priced.error) problems.push(blind.title + ': ' + priced.error + '.');
    else if (!isFinite(unit) || unit + TOLERANCE < priced.price) problems.push(blind.title + ': charged ' + (isFinite(unit) ? unit.toFixed(2) : '?') + ' each, but the order details price at ' + priced.price.toFixed(2) + '.');
  });
  installations.forEach(function (line) {
    var tier = blindCount <= 1 ? '1 Blind' : blindCount <= 5 ? '2-5 Blinds' : '6+ Blinds', price = money(line.originalTotalSet);
    var title = line.variant && line.variant.title;
    if (!blindCount) problems.push('Installation ordered without a blind.');
    else if (title !== tier || Number(line.quantity) !== 1 || Math.abs(price - P.installation[tier]) > 0.01) problems.push('Installation: charged ' + (isFinite(price) ? price.toFixed(2) : '?') + ' for "' + title + '" x' + line.quantity + '; ' + blindCount + ' blind(s) need "' + tier + '" at ' + P.installation[tier].toFixed(2) + '.');
  });
  if (installations.length > 1) problems.push('More than one installation line.');
  return result(!problems.length, checked, problems.length ? problems.join(' ') : 'All ' + checked + ' blind line(s) match their prices.');
}
function result(ok, checked, summary) { return {ok: ok, checked: checked, summary: summary.slice(0, 4000)}; }
`;
const runCode = `// Online Blinds - order price check (generated by scripts/shopify-preview/lpo-order-check-build.mjs).\n${CHECK}\nexport default function main(input) { return check(input); }\n`;
const inputQuery = `query {
  order {
    sourceName
    lineItems {
      id
      title
      quantity
      originalTotalSet { shopMoney { amount } }
      product { id handle }
      variant { title }
      customAttributes { key value }
      lineItemGroup { id quantity customAttributes { key value } }
    }
  }
  shop {
    pricing { value }
    products { value }
  }
}
`;
const outputSchema = `"The order price check result"
type Output {
  "True when every web-order line was charged at least what its order details cost"
  ok: Boolean!
  "Number of blind lines checked"
  checked: Int!
  "What was found"
  summary: String!
}
`;

// 4. Offline tests: the exact Flow code against the live pricing code.
// Genuine orders must price exactly as the live site; tampered ones must be flagged.
const {check, priceBlind} = new Function(CHECK + '\nreturn {check: check, priceBlind: priceBlind};')();
const pricingJson = JSON.stringify(pricing), productsJson = JSON.stringify(products);
const shop = {pricing: {value: pricingJson}, products: {value: productsJson}};
const parsedPricing = JSON.parse(pricingJson), parsedProducts = JSON.parse(productsJson);
const raw = JSON.parse(fs.readFileSync('src/data/pricing/pricing-data.json', 'utf8'));
const CONFIG_KEY = {'room-type': 'roomType', headrail: 'headrail', 'headrail-colour': 'headrailColour', 'installation-method': 'installationMethod', 'control-option': 'controlOption', 'lining-type': 'liningType', stacking: 'stacking', 'control-side': 'controlSide', 'bottom-chain': 'bottomChain', 'bracket-type': 'bracketType', 'chain-color': 'chainColor', 'roman-chain-color': 'chainColor', 'chrome-upgrade': 'chromeUpgrade', 'wrapped-cassette': 'wrappedCassette', 'cassette-bar': 'cassetteMatchingBar', 'roller-cassette': 'cassetteMatchingBar', 'fabric-insert-cassette': 'sameFabricInsert', 'matching-fabric-cassette': 'matchingFabricCassette', motorization: 'motorization', 'skylight-brand': 'brand', 'skylight-blind-type': 'blindType', 'blind-color': 'blindColor', 'number-of-panels': 'numberOfPanels', 'opening-direction': 'openingDirection', 'bottom-bar': 'bottomBar', 'roll-style': 'rollStyle', 'frame-color': 'frameColor', 'perfect-fit-metal-frame-color': 'frameColor'};
const DN_KEYS = ['installationMethod', 'controlSide', 'chromeUpgrade', 'cassetteMatchingBar', 'sameFabricInsert', 'motorization'];
let seed = 99;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (a) => a[Math.floor(rand() * a.length)];
const optionsByKey = {};
for (const o of raw.customizationOptions) { const k = CONFIG_KEY[o.category]; if (k) (optionsByKey[k] ||= new Set()).add(o.optionId); }
for (const k in optionsByKey) optionsByKey[k] = [...optionsByKey[k]];
const kindOf = (handle) => {
  const info = productInfo[handle], dn = configs[info.index][0] === dnBody;
  const slat = H.isHeightOnlyVerticalProduct(info.tags), skylight = !slat && H.isSkylightProduct({tags: info.tags});
  return {info, dn, slat, skylight, D: configs[info.index][1], forced: Boolean(registry[handle].forceMotorized || configs[info.index][1].f === 1)};
};
const optionKeys = (kind) => kind.dn ? DN_KEYS : Object.keys(optionsByKey).filter((k) => k !== 'brand' && k !== 'blindType');
// Day & Night: only what the page can send (motorised clears the manual controls).
const valuesFor = (kind, k) => kind.dn ? dnAllowed[k].filter((x) => x !== 'none') : optionsByKey[k] || ['yes'];
const pageConfig = (kind, config) => { if (kind.dn && (config.motorization === 'motorized' || kind.forced)) { delete config.controlSide; delete config.chromeUpgrade; } return config; };

// The size the page would send (cm with a 1-decimal fraction, or whole mm).
const sizeOf = (inches, mm) => { const t = Math.round(inches * 25.4); return mm ? {v: t, f: 0, inches: t / 25.4} : {v: Math.floor(t / 10), f: t % 10, inches: (Math.floor(t / 10) + (t % 10) / 10) / 2.54}; };

// A blind as LPO puts it in the cart: readable details (live builder), LPO's
// hidden size/option values, the live price. null if the live site rejects it.
async function blindFor(handle, config, wIn, hIn, mm = false) {
  const kind = kindOf(handle), {info} = kind;
  const W = sizeOf(wIn, mm), Hh = sizeOf(hIn, mm);
  const widthInches = kind.skylight ? 1 : kind.slat ? 16 : W.inches, heightInches = kind.skylight ? 1 : Hh.inches;
  const customizations = H.configToCustomizations(config, info.tags);
  // Day & Night: the page refuses sizes outside its manual/motorised limits (LPO's D.m/D.z).
  if (kind.dn) { const L = kind.forced || config.motorization === 'motorized' ? kind.D.z : kind.D.m; if (W.inches < L[0] || W.inches > L[1] || Hh.inches < L[2] || Hh.inches > L[3]) return null; }
  let price;
  try { price = (await reference.calculateProductPrice({handle, widthInches, heightInches, customizations})).totalPrice; } catch { return null; }
  if (!(price > 0)) return null;
  const item = {handle, widthInches, heightInches, quantity: 1, configuration: config};
  const readable = H.buildLineItemProperties(item, price, info.tags);
  const lpo = [['_width', kind.skylight || kind.slat ? '' : String(W.v)], ['_height', kind.skylight ? '' : String(Hh.v)], ['_widthFraction', String(W.f)], ['_heightFraction', String(Hh.f)], ['_measurementUnit', mm ? 'mm' : 'cm'],
    ...(kind.dn ? DN_KEYS.map((k) => ['_' + k, config[k] || '']) : [['_customizations', customizations.map((c) => c.category + ':' + c.optionId).join('|')]]),
    ['_cl_options', 'clp9w6g4woxo'], ['_cl_options_id', String(1793277166933 + lineId)], ['_cl_options_price', String(Math.round(price * 100))]].map(([key, value]) => ({key, value}));
  return {handle, config, attributes: [...readable, ...lpo, {key: '_ob_config', value: JSON.stringify({config})}], lpo, unitPrice: price, wIn, hIn, mm};
}
async function randomBlind(handle) {
  const kind = kindOf(handle);
  for (let attempt = 0; attempt < 40; attempt++) {
    const config = {};
    for (const k of optionKeys(kind)) if (rand() < (kind.dn ? 0.5 : 0.25)) config[k] = pick(valuesFor(kind, k));
    if ((kind.dn && rand() < 0.3) || kind.forced) config.motorization = 'motorized';
    pageConfig(kind, config);
    if (kind.skylight) { const brand = pick(H.SKYLIGHT_BRAND_OPTIONS).id; const list = H.SKYLIGHT_BLIND_TYPE_PRICING[brand] || []; if (!list.length) continue; config.brand = brand; config.blindType = H.getSkylightBlindTypeOptionId(brand, pick(list).code); }
    config.roomType = 'bedroom'; config.blindName = 'Test';
    const l = kind.D.m || [10, 100, 10, 100];
    const blind = await blindFor(handle, config, l[0] + rand() * (Math.min(l[1], 120) - l[0]), l[2] + rand() * (Math.min(l[3], 120) - l[2]), rand() < 0.3);
    if (blind) return blind;
  }
  return null;
}

// Orders in the shape Shopify records LPO bundles (seen on a real transformed
// cart): the group carries every detail, the blind component LPO's hidden
// values at £0, and the "Product options" component the price.
let lineId = 1;
const orderOf = (blinds, extra = []) => ({order: {sourceName: 'web', lineItems: [...blinds.flatMap(({handle, attributes, lpo, unitPrice, quantity = 1, grouped = true}) => {
  const info = productInfo[handle] || {id: 1}, gid = lineId++;
  const group = {id: 'gid://shopify/LineItemGroup/' + gid, quantity, customAttributes: attributes};
  if (!grouped) return [{id: 'b' + gid, title: handle, quantity, originalTotalSet: {shopMoney: {amount: (unitPrice * quantity).toFixed(2)}}, product: {id: 'gid://shopify/Product/' + info.id, handle}, variant: {title: 'Default Title'}, customAttributes: attributes, lineItemGroup: null}];
  return [
    {id: 'b' + gid, title: handle, quantity, originalTotalSet: {shopMoney: {amount: '0.0'}}, product: {id: 'gid://shopify/Product/' + info.id, handle}, variant: {title: 'Default Title'}, customAttributes: lpo || attributes.filter((x) => x.key.startsWith('_')), lineItemGroup: group},
    {id: 'o' + gid, title: 'Product options', quantity, originalTotalSet: {shopMoney: {amount: (unitPrice * quantity).toFixed(2)}}, product: {id: 'gid://shopify/Product/16021381841280', handle: 'product-options'}, variant: {title: 'Default Title'}, customAttributes: [{key: '_cl_options_id', value: '1'}, {key: '_measurementUnit', value: unitPrice.toFixed(2) + ' GBP'}], lineItemGroup: group},
  ];
}), ...extra]}, shop});
const installationLine = (title, price, quantity = 1) => ({id: 'i' + lineId++, title: 'Installation Service', quantity, originalTotalSet: {shopMoney: {amount: (price * quantity).toFixed(2)}}, product: {id: 'gid://shopify/Product/15858557845888', handle: 'installation-service'}, variant: {title}, customAttributes: [], lineItemGroup: null});
const withAttr = (blind, key, value) => ({...blind, attributes: value == null ? blind.attributes.filter((a) => a.key !== key) : blind.attributes.some((a) => a.key === key) ? blind.attributes.map((a) => a.key === key ? {...a, value} : a) : [...blind.attributes, {key, value}]});

const failures = [], counts = {};
const count = (name) => { counts[name] = (counts[name] || 0) + 1; };
const expect = (group, name, input, ok) => { count(group); const r = check(input); if (r.ok !== ok) failures.push({group, name, expectedOk: ok, result: r}); return r; };
// Genuine: the order passes and the check's own price equals the live price.
const genuine = (group, blind) => {
  expect(group, blind.handle, orderOf([blind]), true);
  const attrs = Object.fromEntries(blind.attributes.map((a) => [a.key, a.value]));
  const priced = priceBlind(parsedPricing, parsedProducts[productInfo[blind.handle].id.toString(36)], attrs);
  if (priced.error || Math.abs(priced.price - blind.unitPrice) > 0.005) failures.push({group: group + ' (price)', name: blind.handle, config: blind.config, size: [blind.wIn, blind.hIn, blind.mm], live: blind.unitPrice, check: priced});
};

// A. Every product: three random genuine configurations each, plus a price cut.
const handles = Object.keys(productInfo);
for (const handle of handles) {
  for (let i = 0; i < 3; i++) {
    const blind = await randomBlind(handle);
    if (!blind) { failures.push({group: 'every product', name: handle, error: 'no configuration the live site accepts'}); continue; }
    genuine('every product', blind);
    if (i === 0) expect('every product: price cut', handle, orderOf([{...blind, unitPrice: Math.max(0.01, blind.unitPrice - 1)}]), false);
  }
}

// One product per pricing kind (configuration, product rules) for the sweeps.
const kinds = new Map();
for (const handle of handles) {
  const k = kindOf(handle), sig = [k.info.index, parsedProducts[k.info.id.toString(36)], k.slat, k.skylight, k.forced, H.isPerfectFitShutterProduct({tags: k.info.tags})].join('|');
  if (!kinds.has(sig)) kinds.set(sig, []);
  kinds.get(sig).push(handle);
}
const reps = [...kinds.values()].flatMap((list) => list.length > 1 ? [list[0], list.at(-1)] : list);

// B. Every option value of every option, one at a time (and a random pair),
// for each kind; every skylight brand and blind type.
for (const handle of reps) {
  const kind = kindOf(handle), l = kind.D.m || [10, 100, 10, 100];
  const w = (l[0] + Math.min(l[1], 120)) / 2, h = (l[2] + Math.min(l[3], 120)) / 2;
  const baseConfig = {roomType: 'living-room', blindName: 'Sweep', ...(kind.forced ? {motorization: 'motorized'} : {})};
  const skylightPairs = kind.skylight ? H.SKYLIGHT_BRAND_OPTIONS.flatMap((b) => (H.SKYLIGHT_BLIND_TYPE_PRICING[b.id] || []).map((t) => ({brand: b.id, blindType: H.getSkylightBlindTypeOptionId(b.id, t.code)}))) : [{}];
  for (const sky of skylightPairs) {
    const base = {...baseConfig, ...sky};
    const plain = await blindFor(handle, base, w, h);
    if (plain) genuine('option sweep', plain); else count('option sweep: rejected by live');
    if (kind.skylight) continue;
    for (const key of optionKeys(kind)) for (const value of valuesFor(kind, key)) {
      const config = pageConfig(kind, {...base, [key]: value});
      if (kind.dn && config[key] !== value) continue;
      const blind = await blindFor(handle, config, w, h);
      if (!blind) { count('option sweep: rejected by live'); continue; }
      genuine('option sweep', blind);
      // Tamper: written option upgraded after pricing, paying the plain price.
      if (plain && blind.unitPrice > plain.unitPrice + 0.5) {
        const label = blind.attributes.find((a) => !plain.attributes.some((p) => p.key === a.key && p.value === a.value) && !a.key.startsWith('_'));
        if (label) expect('tamper: option added without paying', handle + ' ' + key + '=' + value, orderOf([{...plain, attributes: [...plain.attributes.filter((a) => a.key !== label.key), label]}]), false);
      }
    }
    for (let i = 0; i < 6; i++) { const keys = optionKeys(kind); const c = {...base}; for (const k of [pick(keys), pick(keys)]) c[k] = pick(valuesFor(kind, k)); pageConfig(kind, c); const b = await blindFor(handle, c, w, h); if (b) genuine('option sweep: pairs', b); }
  }
}

// C. Sizes: limits, just outside them, cm with fractions and mm.
for (const handle of reps) {
  const kind = kindOf(handle);
  if (kind.skylight) continue;
  const l = kind.D.m || [10, 100, 10, 100], config = {roomType: 'office', ...(kind.forced ? {motorization: 'motorized'} : {})};
  const widths = [l[0], l[0] + 0.01, (l[0] + l[1]) / 2, l[1] - 0.01, l[1]], heights = [l[2], (l[2] + l[3]) / 2, l[3]];
  for (const wIn of widths) for (const hIn of heights) for (const mm of [false, true]) {
    const blind = await blindFor(handle, config, wIn, hIn, mm);
    if (blind) genuine('sizes', blind); else count('sizes: rejected by live');
  }
  for (const [wIn, hIn] of [[l[0] - 1, (l[2] + l[3]) / 2], [l[1] + 2, (l[2] + l[3]) / 2], [(l[0] + l[1]) / 2, l[2] - 1], [(l[0] + l[1]) / 2, l[3] + 2]]) {
    const live = await blindFor(handle, config, wIn, hIn);
    if (live) { genuine('sizes: outside the band table', live); continue; }
    // The live site rejects this size, so an order for it must be flagged.
    const inside = await blindFor(handle, config, (l[0] + l[1]) / 2, (l[2] + l[3]) / 2);
    if (!inside) continue;
    const W = sizeOf(kind.slat ? (l[0] + l[1]) / 2 : wIn, false), Hh = sizeOf(hIn, false);
    let forged = withAttr(withAttr(inside, '_width', kind.slat ? '' : String(W.v)), '_widthFraction', String(W.f));
    forged = withAttr(withAttr(forged, '_height', String(Hh.v)), '_heightFraction', String(Hh.f));
    if (!kind.slat) forged = withAttr(forged, 'Width', (W.inches * 2.54).toFixed(1) + 'cm');
    forged = withAttr(forged, 'Height', (Hh.inches * 2.54).toFixed(1) + 'cm');
    expect('sizes: rejected by live must be flagged', handle + ' ' + wIn.toFixed(1) + 'x' + hIn.toFixed(1), orderOf([{...forged, lpo: null}]), false);
  }
}

// D. Tampering on each kind.
for (const handle of reps) {
  const kind = kindOf(handle), blind = await randomBlind(handle);
  if (!blind) continue;
  const t = (name, order) => expect('tamper: ' + name, handle, order, false);
  t('paid 1p', orderOf([{...blind, unitPrice: 0.01}]));
  t('LPO data stripped (£0 blind)', orderOf([{...blind, unitPrice: 0, attributes: blind.attributes.filter((a) => !a.key.startsWith('_')), lpo: []}]));
  t('extra instruction', orderOf([withAttr(blind, 'Note', 'make it motorised')]));
  if (!kind.skylight) {
    t('written height enlarged', orderOf([withAttr(blind, 'Height', '400.0cm')]));
    t('written height removed', orderOf([withAttr(blind, 'Height', null)]));
    t('hidden height changed', orderOf([withAttr({...blind, lpo: null}, '_height', String(Number(blind.attributes.find((a) => a.key === '_height').value) - 20))]));
  }
  if (!kind.skylight && !kind.slat) {
    t('written width enlarged', orderOf([withAttr(blind, 'Width', '400.0cm')]));
    t('written width removed', orderOf([withAttr(blind, 'Width', null)]));
    // Hidden sizes removed and unit switched to mm: the written cm size is priced.
    const big = await blindFor(handle, blind.config, Math.min(kind.D.m?.[1] || 100, 120), Math.min(kind.D.m?.[3] || 100, 120));
    if (big && big.unitPrice > blind.unitPrice + 0.5) {
      const stripped = big.attributes.filter((a) => !['_width', '_height', '_widthFraction', '_heightFraction', '_measurementUnit'].includes(a.key)).concat([{key: '_measurementUnit', value: 'mm'}]);
      t('hidden sizes removed, unit mm', orderOf([{...big, unitPrice: blind.unitPrice, attributes: stripped, lpo: null}]));
    }
  }
  if (!kind.dn && !kind.forced && !kind.skylight) {
    const motor = await blindFor(handle, {...blind.config, motorization: 'motorized'}, blind.wIn, blind.hIn, blind.mm);
    if (motor && motor.unitPrice > blind.unitPrice + 0.5) t('motorised written, not paid', orderOf([withAttr(blind, 'Motorization', 'motorized')]));
  }
  if (kind.dn) {
    t('Day & Night option not offered', orderOf([withAttr(blind, 'Motorization', '2ch-remote')]));
    if (!kind.forced) { const m = await blindFor(handle, pageConfig(kind, {...blind.config, motorization: 'motorized'}), blind.wIn, blind.hIn, blind.mm); if (m) t('chrome upgrade on a motorised blind', orderOf([withAttr(m, 'Chrome Upgrade', 'yes')])); }
  }
  t('details disagree (group vs blind line)', orderOf([{...blind, lpo: blind.lpo.map((a) => a.key === '_height' ? {...a, value: String(Number(a.value) + 1)} : a)}]));
}

// E. Order shapes, quantities, installation tiers and data problems.
const sample = await randomBlind('cairo-blackout-beige-roller-blind');
const otherHandle = handles.find((h) => productInfo[h].index !== productInfo['cairo-blackout-beige-roller-blind'].index && !kindOf(h).dn);
const other = await randomBlind(otherHandle), dnBlind = await randomBlind(handles.find((h) => kindOf(h).dn));
const e = (name, input, ok) => expect('orders', name, input, ok);
for (const q of [1, 2, 3, 7]) e('quantity ' + q, orderOf([{...sample, quantity: q}]), true);
e('quantity 3, paid for 1', {order: {...orderOf([{...sample, quantity: 3}]).order, lineItems: orderOf([{...sample, quantity: 3}]).order.lineItems.map((l) => l.id.startsWith('o') ? {...l, originalTotalSet: {shopMoney: {amount: sample.unitPrice.toFixed(2)}}} : l)}, shop}, false);
e('three different blinds', orderOf([sample, other, dnBlind]), true);
e('one of three blinds cut to 1p', orderOf([sample, {...other, unitPrice: 0.01}, dnBlind]), false);
e('blind without bundle (ungrouped, priced)', orderOf([{...sample, grouped: false}]), true);
e('blind without bundle at £0', orderOf([{...sample, grouped: false, unitPrice: 0}]), false);
e('price split across components', {order: {...orderOf([sample]).order, lineItems: orderOf([sample]).order.lineItems.map((l) => ({...l, originalTotalSet: {shopMoney: {amount: (sample.unitPrice / 2).toFixed(2)}}}))}, shop}, true);
for (const [n, tier, price] of [[1, '1 Blind', 40], [2, '2-5 Blinds', 60], [5, '2-5 Blinds', 60], [6, '6+ Blinds', 85], [9, '6+ Blinds', 85]]) {
  e(`installation ${n} blind(s) ${tier}`, orderOf([{...sample, quantity: n}], [installationLine(tier, price)]), true);
  e(`installation ${n} blind(s) wrong tier`, orderOf([{...sample, quantity: n}], [installationLine(n === 1 ? '2-5 Blinds' : '1 Blind', n === 1 ? 60 : 40)]), false);
}
e('installation across two blind lines (2 blinds)', orderOf([sample, other], [installationLine('2-5 Blinds', 60)]), true);
e('installation re-priced to £1', orderOf([sample], [installationLine('1 Blind', 1)]), false);
e('installation quantity 2', orderOf([sample], [installationLine('1 Blind', 40, 2)]), false);
e('two installation lines', orderOf([sample], [installationLine('1 Blind', 40), installationLine('1 Blind', 40)]), false);
e('installation alone', orderOf([], [installationLine('1 Blind', 40)]), false);
e('product options line alone', {order: {sourceName: 'web', lineItems: [orderOf([sample]).order.lineItems[1]]}, shop}, false);
productInfo['not-set-up'] = {id: 1, tags: [], index: 0};
e('product not set up for LPO', orderOf([{...sample, handle: 'not-set-up'}]), false);
delete productInfo['not-set-up'];
e('draft order (live site) skipped', {order: {...orderOf([{...sample, unitPrice: 1}]).order, sourceName: 'shopify_draft_order'}, shop}, true);
e('no line items', {order: {sourceName: 'web', lineItems: []}, shop}, true);
e('price data missing', {order: orderOf([sample]).order, shop: {}}, false);
e('price data null', {order: orderOf([sample]).order, shop: {pricing: null, products: null}}, false);
e('price data corrupt', {order: orderOf([sample]).order, shop: {pricing: {value: '{'}, products: {value: productsJson}}}, false);
e('price data as plain strings', {order: orderOf([sample]).order, shop: {pricing: pricingJson, products: productsJson}}, true);
e('price data empty strings', {order: orderOf([sample]).order, shop: {pricing: {value: ''}, products: {value: null}}}, false);
e('Flow list shapes (edges)', {order: {sourceName: 'web', lineItems: {edges: orderOf([sample]).order.lineItems.map((node) => ({node}))}}, shop}, true);

// Cases for the storefront check (real LPO engine on the preview theme).
const browserCases = [];
const byConfig = new Map(); for (const h of handles) { const i = productInfo[h].index; if (!byConfig.has(i)) byConfig.set(i, []); byConfig.get(i).push(h); }
for (const [index, list] of byConfig) for (const handle of [list[0], list.at(-1)]) for (let i = 0; i < 2; i++) {
  let blind = await randomBlind(handle); if (!blind) continue;
  const kind = kindOf(handle);
  // The page requires installation, cassette bar and (manual) control side on Day & Night.
  if (kind.dn) {
    const c = {...blind.config, installationMethod: blind.config.installationMethod || pick(dnAllowed.installationMethod), cassetteMatchingBar: blind.config.cassetteMatchingBar || pick(dnAllowed.cassetteMatchingBar)};
    if (!(kind.forced || c.motorization === 'motorized')) c.controlSide ||= pick(dnAllowed.controlSide);
    blind = await blindFor(handle, c, blind.wIn, blind.hIn, blind.mm); if (!blind) continue;
  }
  const cfg = blind.config, size = Object.fromEntries(blind.lpo.filter((a) => /^_(width|height|widthFraction|heightFraction|measurementUnit)$/.test(a.key)).map((a) => [a.key, a.key.endsWith('Fraction') ? Number(a.value) : a.value]));
  const values = kind.dn ? {...size, _installationMethod: cfg.installationMethod || '', _controlSide: cfg.controlSide || '', _chromeUpgrade: cfg.chromeUpgrade || 'no', _cassetteMatchingBar: cfg.cassetteMatchingBar || '', _sameFabricInsert: cfg.sameFabricInsert || 'no', _motorization: kind.forced ? 'motorized' : cfg.motorization || 'none', _roomType: cfg.roomType || '', _blindName: cfg.blindName || ''}
    : {...size, _customizations: blind.lpo.find((a) => a.key === '_customizations').value};
  browserCases.push({index, handle, values, readable: blind.attributes.filter((a) => !a.key.startsWith('_') || a.key === '_calculatedPrice'), live: blind.unitPrice});
}
fs.writeFileSync(path.join(work, 'phase6/order-check-browser-cases.json'), JSON.stringify(browserCases));

// Launch audit (opt-in): one random page-valid selection for every product.
if (process.env.ALL_PRODUCT_CASES) {
  const all = [];
  for (const handle of handles) {
    let blind = await randomBlind(handle); if (!blind) { all.push({handle, none: true}); continue; }
    const kind = kindOf(handle);
    if (kind.dn) {
      const c = {...blind.config, installationMethod: blind.config.installationMethod || pick(dnAllowed.installationMethod), cassetteMatchingBar: blind.config.cassetteMatchingBar || pick(dnAllowed.cassetteMatchingBar)};
      if (!(kind.forced || c.motorization === 'motorized')) c.controlSide ||= pick(dnAllowed.controlSide);
      blind = await blindFor(handle, c, blind.wIn, blind.hIn, blind.mm); if (!blind) { all.push({handle, none: true}); continue; }
    }
    const cfg = blind.config, size = Object.fromEntries(blind.lpo.filter((a) => /^_(width|height|widthFraction|heightFraction|measurementUnit)$/.test(a.key)).map((a) => [a.key, a.key.endsWith('Fraction') ? Number(a.value) : a.value]));
    const values = kind.dn ? {...size, _installationMethod: cfg.installationMethod || '', _controlSide: cfg.controlSide || '', _chromeUpgrade: cfg.chromeUpgrade || 'no', _cassetteMatchingBar: cfg.cassetteMatchingBar || '', _sameFabricInsert: cfg.sameFabricInsert || 'no', _motorization: kind.forced ? 'motorized' : cfg.motorization || 'none', _roomType: cfg.roomType || '', _blindName: cfg.blindName || ''}
      : {...size, _customizations: blind.lpo.find((a) => a.key === '_customizations').value};
    all.push({index: productInfo[handle].index, handle, values, config: cfg, wIn: blind.wIn, hIn: blind.hIn, mm: blind.mm, widthInches: kind.skylight ? 1 : kind.slat ? 16 : sizeOf(blind.wIn, blind.mm).inches, heightInches: kind.skylight ? 1 : sizeOf(blind.hIn, blind.mm).inches, customizations: H.configToCustomizations(cfg, productInfo[handle].tags), readable: blind.attributes.filter((a) => !a.key.startsWith('_') || a.key === '_calculatedPrice'), live: blind.unitPrice});
  }
  fs.writeFileSync(path.join(work, 'launch/all-product-cases.json'), JSON.stringify(all));
  console.log('all-product cases', all.length, 'without a valid selection', all.filter((c) => c.none).length);
}

const report = {date: new Date().toISOString().slice(0, 10), configs: configs.length, products: Object.keys(products).length, pricingBytes: Buffer.byteLength(pricingJson), productsBytes: Buffer.byteLength(productsJson), runCodeChars: runCode.length, inputQueryChars: inputQuery.length, counts, failures, failureCount: failures.length, passed: !failures.length};
fs.writeFileSync(path.join(OUT, 'pricing.json'), pricingJson);
fs.writeFileSync(path.join(OUT, 'products.json'), productsJson);
fs.writeFileSync(path.join(OUT, 'run-code.js'), runCode);
fs.writeFileSync(path.join(OUT, 'input-query.graphql'), inputQuery);
fs.writeFileSync(path.join(OUT, 'output-schema.graphql'), outputSchema);
fs.writeFileSync(path.join(OUT, 'test.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({...report, failures: report.failures.slice(0, 8)}, null, 1));
if (runCode.length > 50000) throw new Error('Run code is over Flow\'s 50,000 character limit');
if (inputQuery.length > 5000) throw new Error('Input query is over Flow\'s 5,000 character limit');
for (const [name, json] of [['pricing', pricingJson], ['products', productsJson]]) if (Buffer.byteLength(json) > 128 * 1024) throw new Error(name + ' metafield is over 128 KB');
if (failures.length) process.exitCode = 1;
