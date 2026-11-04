// Generic ("v2") LPO price formula used from Roller onwards.
// The theme sends the source page's own customization list
// ("category:optionId|...") in one hidden text option, so a single formula
// mirrors the server's calculateProductPrice for any band-priced family:
// size envelope -> ceiling band (with clamp) -> cell price -> customization
// prices (flat or per width band) -> +£75 base when motorised.
import fs from 'node:fs';
import {bandGrid, MESSAGES, PREFIX} from './lpo-slim-formula.mjs';

const raw = JSON.parse(fs.readFileSync('src/data/pricing/pricing-data.json', 'utf8'));
const MOTOR_BASE = 75; // MOTORIZATION_BASE_PRICE in src/lib/electrical-roller.ts

// Non-zero customization prices as the server resolves them for one family.
// Flat entries are numbers; width-band entries are {widthMm: price, '*': fallback}.
// `roller` selects how cassette-bar / roller-cassette are normalised (server:
// normalizeCustomizationCategory + the cassette-bar -> roller-cassette fallback).
export function customizationTable(roller, skip = ['skylight-blind-type']) {
  const widthMm = new Map(raw.widthBands.map((b) => [b.id, b.widthMm]));
  const table = {};
  const optionsOf = (cat) => raw.customizationOptions.filter((o) => o.category === cat);
  const priceOf = (option) => {
    const entries = raw.customizationPricings.filter((p) => p.customizationOptionId === option.id);
    if (!entries.some((e) => Number(e.price))) return null;
    if (!entries.some((e) => e.widthBandId)) return Number(entries.find((e) => !e.widthBandId).price);
    // Per-band: keep zero entries too, because an exact-band £0 overrides the fallback.
    const out = {};
    for (const e of entries) out[e.widthBandId ? widthMm.get(e.widthBandId) : '*'] = Number(e.price);
    return out;
  };
  for (const cat of new Set(raw.customizationOptions.map((o) => o.category))) {
    if (skip.includes(cat) || cat === 'cassette-bar' || cat === 'roller-cassette') continue;
    for (const option of optionsOf(cat)) {
      const p = priceOf(option);
      if (p !== null) (table[cat] ||= {})[option.optionId] = p;
    }
  }
  // Both cassette categories are priced under the family's normalised category.
  const target = roller ? 'roller-cassette' : 'cassette-bar';
  const primary = optionsOf(target), fallback = roller ? [] : optionsOf('roller-cassette');
  for (const option of [...primary, ...fallback.filter((f) => !primary.some((p) => p.optionId === f.optionId))]) {
    const p = priceOf(option);
    if (p !== null) (table[target] ||= {})[option.optionId] = p;
  }
  return table;
}

const limitArray = (l) => (l ? [l.minWidth, l.maxWidth, l.minHeight, l.maxHeight] : null);

/**
 * schema = { bandId, clamp, any: limits|null, motor: limits|null, roller: boolean }
 * `any` / `motor` are the server's sheet envelope (null when the family has none).
 */
export function genericFormula(schema) {
  const grid = bandGrid(schema.bandId);
  const fallback = [grid.w[0][0], grid.w.at(-1)[0], grid.h[0][0], grid.h.at(-1)[0]];
  const data = {
    w: grid.w.map((b) => b[0]), x: grid.w.map((b) => b[1]), h: grid.h.map((b) => b[0]), v: grid.v,
    k: schema.clamp ? 1 : 0,
    m: limitArray(schema.any) || fallback, z: limitArray(schema.motor) || limitArray(schema.any) || fallback,
    r: schema.roller ? 1 : 0, t: customizationTable(schema.roller), b: MOTOR_BASE,
  };
  return `var D=${JSON.stringify(data)},M=${JSON.stringify(MESSAGES)},Q=${JSON.stringify(PREFIX)};
function V(n){return options.value(Q+n);}
var wo=options.option&&options.option(Q+'width');
if(wo&&Array.isArray(wo.errors))wo.errors=wo.errors.filter(function(m){return m&&M.indexOf(m)<0;});
var unit=V('measurementUnit'),wv=V('width'),hv=V('height');
if(wv==null||hv==null||String(wv).trim()===''||String(hv).trim()===''||(unit!=='cm'&&unit!=='mm'))return 0;
var w=Number(wv),h=Number(hv);
if(!isFinite(w)||!isFinite(h)){options.error(Q+'width',M[0]);return 0;}
if(unit==='cm'){w+=Number(V('widthFraction')||0)/10;h+=Number(V('heightFraction')||0)/10;}
var u=unit==='cm'?2.54:25.4;w/=u;h/=u;
var C=String(V('customizations')||'').split('|').filter(function(s){return s;}).map(function(s){var i=s.indexOf(':');return [s.slice(0,i),s.slice(i+1)];});
var mot=C.some(function(c){return c[0]==='motorization'&&c[1]!=='none';}),L=mot?D.z:D.m;
function fail(i){options.error(Q+'width',M[i]);return 0;}
if(w<L[0]||w>L[1]||h<L[2]||h>L[3])return fail(1);
function band(a,v){if(v<a[0])return D.k?0:-1;if(v>a[a.length-1])return D.k?a.length-1:-1;var c=Math.ceil(v);for(var i=0;i<a.length;i++)if(a[i]>=c)return i;return D.k?a.length-1:-1;}
var x=band(D.w,w),y=band(D.h,h);
if(x<0||y<0)return fail(1);
var t=D.v[y*D.w.length+x];
if(!t)return fail(2);
C.forEach(function(c){var cat=c[0];if(cat==='cassette-bar'||cat==='roller-cassette')cat=D.r?'roller-cassette':'cassette-bar';var p=D.t[cat]&&D.t[cat][c[1]];if(p==null)return;if(typeof p==='object'){var q=p[D.x[x]];p=q!=null?q:(p['*']||0);}t+=p;});
if(C.some(function(c){return c[0]==='motorization';}))t+=D.b;
return Math.round(t*100)/100;`;
}

// ---------------------------------------------------------------------------
// v2 "kinds" used from Phase 5 on. Roller schemas have no `kind` and keep the
// formula above unchanged (so their stored, verified formulas stay identical).
//
// Customization prices are resolved per column of the product's own band,
// exactly like findCustomizationOption + findMatchingPricingEntry: an entry for
// that width band wins, else the entry without a width band, else nothing.
// Width-band ids are used (not mm), so bands whose columns share a width in mm
// cannot pick up each other's prices.
export function customizationColumns({roller, widthBandIds = null, skylight = false}) {
  const table = {};
  const optionsOf = (cat) => raw.customizationOptions.filter((o) => o.category === cat);
  const pricesOf = (option) => {
    const entries = raw.customizationPricings.filter((p) => p.customizationOptionId === option.id);
    const nul = entries.find((e) => e.widthBandId === null);
    const cols = (widthBandIds || [null]).map((id) => {
      const e = (id && entries.find((x) => x.widthBandId === id)) || nul;
      return e ? Number(e.price) : 0;
    });
    if (cols.every((c) => c === 0)) return null;
    return cols.every((c) => c === cols[0]) ? cols[0] : cols;
  };
  for (const cat of new Set(raw.customizationOptions.map((o) => o.category))) {
    if ((!skylight && cat === 'skylight-blind-type') || cat === 'cassette-bar' || cat === 'roller-cassette') continue;
    for (const option of optionsOf(cat)) {
      const p = pricesOf(option);
      if (p !== null) (table[cat] ||= {})[option.optionId] = p;
    }
  }
  const target = roller ? 'roller-cassette' : 'cassette-bar';
  const primary = optionsOf(target), fallback = roller ? [] : optionsOf('roller-cassette');
  for (const option of [...primary, ...fallback.filter((f) => !primary.some((p) => p.optionId === f.optionId))]) {
    const p = pricesOf(option);
    if (p !== null) (table[target] ||= {})[option.optionId] = p;
  }
  return table;
}

const CUSTOMIZATIONS = `var C=String(V('customizations')||'').split('|').filter(function(s){return s;}).map(function(s){var i=s.indexOf(':');return [s.slice(0,i),s.slice(i+1)];});
function extras(x){var s=0;C.forEach(function(c){var cat=c[0];if(cat==='cassette-bar'||cat==='roller-cassette')cat=D.r?'roller-cassette':'cassette-bar';var p=D.t[cat]&&D.t[cat][c[1]];if(p==null)return;if(typeof p==='object')p=p[x]||0;s+=p;});return s;}`;

/**
 * schema.kind:
 *  'band'     - width x drop grid (vertical, Roman, venetian, ...)
 *  'skylight' - the page prices skylights at a fixed 1 x 1 inch cell
 *  'slat'     - replacement vertical slats: height tiers only, no grid
 */
export function kindFormula(schema) {
  const head = (data) => `var D=${JSON.stringify(data)},M=${JSON.stringify(MESSAGES)},Q=${JSON.stringify(PREFIX)};
function V(n){return options.value(Q+n);}
var wo=options.option&&options.option(Q+'width');
if(wo&&Array.isArray(wo.errors))wo.errors=wo.errors.filter(function(m){return m&&M.indexOf(m)<0;});
${CUSTOMIZATIONS}`;
  if (schema.kind === 'slat') {
    const data = {s: schema.tiers.map((t) => [Number.isFinite(t.maxInches) ? t.maxInches : null, t.price]), r: schema.roller ? 1 : 0, t: customizationColumns({roller: schema.roller}), n: 1};
    return `${head(data)}
var unit=V('measurementUnit'),hv=V('height');
if(hv==null||String(hv).trim()===''||(unit!=='cm'&&unit!=='mm'))return 0;
var h=Number(hv);
if(!isFinite(h)){options.error(Q+'height',M[0]);return 0;}
if(unit==='cm')h+=Number(V('heightFraction')||0)/10;
h/=unit==='cm'?2.54:25.4;
if(h<=0)return 0;
var t=D.s[D.s.length-1][1];
for(var i=0;i<D.s.length;i++)if(D.s[i][0]===null||h<=D.s[i][0]){t=D.s[i][1];break;}
t+=extras(0);
return Math.round(t*100)/100;`;
  }
  const grid = bandGrid(schema.bandId);
  const fallback = [grid.w[0][0], grid.w.at(-1)[0], grid.h[0][0], grid.h.at(-1)[0]];
  const data = {
    w: grid.w.map((b) => b[0]), h: grid.h.map((b) => b[0]), v: grid.v, k: schema.clamp ? 1 : 0,
    m: limitArray(schema.any) || fallback, z: limitArray(schema.motor) || limitArray(schema.any) || fallback,
    r: schema.roller ? 1 : 0, t: customizationColumns({roller: schema.roller, widthBandIds: grid.ids, skylight: schema.kind === 'skylight'}), b: MOTOR_BASE,
  };
  if (schema.kind === 'skylight') data.n = 1;
  const size = schema.kind === 'skylight'
    ? `var w=1,h=1;`
    : `var unit=V('measurementUnit'),wv=V('width'),hv=V('height');
if(wv==null||hv==null||String(wv).trim()===''||String(hv).trim()===''||(unit!=='cm'&&unit!=='mm'))return 0;
var w=Number(wv),h=Number(hv);
if(!isFinite(w)||!isFinite(h)){options.error(Q+'width',M[0]);return 0;}
if(unit==='cm'){w+=Number(V('widthFraction')||0)/10;h+=Number(V('heightFraction')||0)/10;}
var u=unit==='cm'?2.54:25.4;w/=u;h/=u;`;
  return `${head(data)}
${size}
var mot=C.some(function(c){return c[0]==='motorization'&&c[1]!=='none';}),L=mot?D.z:D.m;
function fail(i){options.error(Q+'width',M[i]);return 0;}
if(w<L[0]||w>L[1]||h<L[2]||h>L[3])return fail(1);
function band(a,v){if(v<a[0])return D.k?0:-1;if(v>a[a.length-1])return D.k?a.length-1:-1;var c=Math.ceil(v);for(var i=0;i<a.length;i++)if(a[i]>=c)return i;return D.k?a.length-1:-1;}
var x=band(D.w,w),y=band(D.h,h);
if(x<0||y<0)return fail(1);
var t=D.v[y*D.w.length+x];
if(!t)return fail(2);
t+=extras(x);
if(C.some(function(c){return c[0]==='motorization';}))t+=D.b;
return Math.round(t*100)/100;`;
}
