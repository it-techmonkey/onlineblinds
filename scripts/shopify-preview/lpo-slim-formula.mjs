// Builds small, data-driven LPO price formulas for one category.
// LPO ships every active configuration to every product page in one script, so
// each formula must carry only its own band grid and option prices, not the
// whole source calculator. The price grid itself is embedded (under 1 KB).
import fs from 'node:fs';
import {upliftBasePrice} from './price-uplift.mjs';

export const MESSAGES = [
  'Please enter a valid size',
  'Selected measurements are outside the allowed range for this product',
  'We cannot make this blind in that width and drop combination. Please adjust your measurements.',
  'The pricing list could not be verified. Please try again.',
];

const raw = JSON.parse(fs.readFileSync('src/data/pricing/pricing-data.json', 'utf8'));

// Width/height bands and available cells for one source price band.
// Cell prices include the temporary base price increase (src/data/promotions.ts),
// exactly as the website's price calculator applies it.
// {uplift: false} gives the original table prices (used only for regression checks).
export function bandGrid(bandId, {uplift = true} = {}) {
  const cells = raw.priceCells.filter((c) => c.priceBandId === bandId).map((c) => ({...c, price: uplift ? upliftBasePrice(Number(c.price)) : Number(c.price)}));
  const widthById = new Map(raw.widthBands.map((b) => [b.id, b]));
  const heightById = new Map(raw.heightBands.map((b) => [b.id, b]));
  const sortW = (a, b) => a.widthInches - b.widthInches || a.widthMm - b.widthMm;
  const sortH = (a, b) => a.heightInches - b.heightInches || a.heightMm - b.heightMm;
  const ws = [...new Map(cells.map((c) => [c.widthBandId, widthById.get(c.widthBandId)])).values()].sort(sortW);
  const hs = [...new Map(cells.map((c) => [c.heightBandId, heightById.get(c.heightBandId)])).values()].sort(sortH);
  const priceOf = new Map(cells.map((c) => [c.widthBandId + ':' + c.heightBandId, Number(c.price)]));
  // Row-major by height then width; 0 marks a combination the supplier does not make.
  const v = [];
  for (const h of hs) for (const w of ws) v.push(priceOf.get(w.id + ':' + h.id) ?? 0);
  if (cells.some((c) => !(Number(c.price) > 0))) throw new Error('A zero or invalid price cell would read as unavailable');
  return {
    w: ws.map((b) => [b.widthInches, b.widthMm]),
    h: hs.map((b) => [b.heightInches, b.heightMm]),
    ids: ws.map((b) => b.id),
    v,
    cells,
  };
}

// Flat (width-independent) price for a customization option, as the source resolves it.
export function flatPrice(category, optionId) {
  const tryCategories = category === 'cassette-bar' ? ['cassette-bar', 'roller-cassette'] : [category];
  for (const cat of tryCategories) {
    const option = raw.customizationOptions.find((o) => o.category === cat && o.optionId === optionId);
    if (!option) continue;
    const entries = raw.customizationPricings.filter((p) => p.customizationOptionId === option.id);
    if (entries.some((p) => p.widthBandId)) throw new Error(`Width-dependent price for ${cat}/${optionId} needs a band table`);
    const entry = entries.find((p) => p.widthBandId === null);
    return entry ? Number(entry.price) : 0;
  }
  return 0;
}

// LPO writes every option to the order under its name. Hidden (underscore) names
// keep those internal; the theme adds the same readable properties as the live site.
export const PREFIX = '_';
export function renameOptions(options) {
  const named = (n) => (n.startsWith(PREFIX) ? n : PREFIX + n);
  return options.map((o) => ({...o, name: named(o.name), conditions: (o.conditions || []).map((c) => (c.data === 'options' ? {...c, field: named(c.field)} : c))}));
}

const limitArray = (l) => [l.minWidth, l.maxWidth, l.minHeight, l.maxHeight];

/**
 * schema = {
 *   grid: bandGrid(...),
 *   clamp: boolean,
 *   manual: limits | null, motor: limits | null   (inches; null = band range),
 *   forceMotorized: boolean,
 *   prices: { optionName: { valueId: price } },   (flat add-ons, only non-zero)
 *   manualOnly: [option names ignored when motorized],
 *   motorBase: number added when motorized,
 * }
 */
export function formulaSource(schema) {
  const { grid } = schema;
  const fallback = [grid.w[0][0], grid.w.at(-1)[0], grid.h[0][0], grid.h.at(-1)[0]];
  // Prices are embedded: the storefront only receives Assets lists that are
  // linked to a config, so a lookup by list name works in the editor but not live.
  const data = {
    w: grid.w.map((b) => b[0]),
    h: grid.h.map((b) => b[0]),
    v: grid.v,
    k: schema.clamp ? 1 : 0,
    m: schema.manual ? limitArray(schema.manual) : fallback,
    z: schema.motor ? limitArray(schema.motor) : fallback,
    f: schema.forceMotorized ? 1 : 0,
    p: schema.prices,
    o: schema.manualOnly,
    b: schema.motorBase,
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
var mot=D.f===1||V('motorization')==='motorized',L=mot?D.z:D.m;
function fail(i){options.error(Q+'width',M[i]);return 0;}
if(w<L[0]||w>L[1]||h<L[2]||h>L[3])return fail(1);
function band(a,v){if(v<a[0])return D.k?0:-1;if(v>a[a.length-1])return D.k?a.length-1:-1;var c=Math.ceil(v);for(var i=0;i<a.length;i++)if(a[i]>=c)return i;return D.k?a.length-1:-1;}
var x=band(D.w,w),y=band(D.h,h);
if(x<0||y<0)return fail(1);
var t=D.v[y*D.w.length+x];
if(!t)return fail(2);
for(var n in D.p){if(mot&&D.o.indexOf(n)>=0)continue;var s=V(n);if(s!=null&&D.p[n][s])t+=D.p[n][s];}
if(mot)t+=D.b;
return Math.round(t*100)/100;`;
}
