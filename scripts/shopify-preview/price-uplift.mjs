// The temporary base price increase, read from src/data/promotions.ts so the
// Shopify formulas use exactly the same number and rounding as the website.
import fs from 'node:fs';
import path from 'node:path';
import {root} from './env.mjs';

const source = fs.readFileSync(path.join(root, 'src/data/promotions.ts'), 'utf8');
const match = source.match(/^export const BASE_PRICE_MULTIPLIER(?:: number)? = ([0-9.]+);\r?$/m);
if (!match) throw new Error('BASE_PRICE_MULTIPLIER not found in src/data/promotions.ts');
export const BASE_PRICE_MULTIPLIER = Number(match[1]);
if (!(BASE_PRICE_MULTIPLIER >= 1 && BASE_PRICE_MULTIPLIER <= 2)) throw new Error('Unexpected BASE_PRICE_MULTIPLIER: ' + match[1]);

// Same as upliftBasePrice in src/data/promotions.ts.
export function upliftBasePrice(price) {
  if (BASE_PRICE_MULTIPLIER === 1) return price;
  return Math.round((price * BASE_PRICE_MULTIPLIER + Number.EPSILON) * 100) / 100;
}
