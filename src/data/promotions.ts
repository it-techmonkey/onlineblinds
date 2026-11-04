// Site-wide promotion settings, shared by the Next.js site and the Shopify theme.
// See docs/promotions.md for how to change or roll back each part.

/**
 * Temporary price increase on the base (size) price of every blind.
 * 1.25 means a 20% off code brings the base price back to the old price
 * (x 1.25 x 0.8 = x 1). Extras such as motors and brackets are not increased.
 *
 * Roll back: set to 1, deploy the site and run the Shopify price sync
 * (docs/promotions.md). Keep the value on one line: the Shopify scripts read it.
 */
export const BASE_PRICE_MULTIPLIER: number = 1.25;

/** Applies the temporary increase to a base price, rounded to the penny. */
export function upliftBasePrice(price: number): number {
  if (BASE_PRICE_MULTIPLIER === 1) return price;
  return Math.round((price * BASE_PRICE_MULTIPLIER + Number.EPSILON) * 100) / 100;
}

export interface PromoCoupon {
  code: string;
  label: string;
  percentOff: number;
}

/** Codes offered in the announcement bar dropdown. Only one applies at a time. */
export const PROMO_COUPONS: PromoCoupon[] = [
  { code: 'BLKFRIDAY60', label: 'Black Friday', percentOff: 20 },
  { code: 'XMASOFF', label: 'Christmas', percentOff: 20 },
  { code: 'BOXOFF', label: 'Boxing Day', percentOff: 20 },
  { code: 'NEWYROFF', label: 'New Year', percentOff: 20 },
];

export const DEFAULT_PROMO_CODE = 'BLKFRIDAY60';

/** UK is on GMT in November. The sale includes the final minute of 30 November. */
export const BLACK_FRIDAY_PROMOTION = {
  name: 'Black Friday',
  headline: 'Up to 60% off',
  endsAt: '2026-12-01T00:00:00Z',
  shortDeadlineLabel: 'Ends 30 November',
  deadlineLabel: 'Ends 30 November · 11:59 pm UK time',
} as const;

/** A fixed deadline, independent of the visitor's timezone; never resets. */
export function getBlackFridaySeconds(now: number = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(BLACK_FRIDAY_PROMOTION.endsAt) - now) / 1000));
}

export function formatSaleCountdown(seconds: number): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days > 0 ? `${days}d ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds % 60)}`;
}

/**
 * Newsletter signup code, shown after signing up (popup and home page form).
 * In Shopify it is limited to email subscribers and combines with the codes above.
 * Keep the value on one line: the Shopify build reads it.
 */
export const NEWSLETTER_DISCOUNT_CODE = 'SUBSCRIBE15';
export const NEWSLETTER_PERCENT_OFF = 15;

/** Seconds before the signup popup opens. */
export const SIGNUP_POPUP_DELAY_SECONDS = 5;

/** After the popup is closed, wait this many days before showing it again. */
export const SIGNUP_POPUP_SNOOZE_DAYS = 7;

export function isPromoCode(code: string): boolean {
  const upper = code.trim().toUpperCase();
  return PROMO_COUPONS.some((c) => c.code === upper);
}

export function findPromoCoupon(code: string | null | undefined): PromoCoupon | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return PROMO_COUPONS.find((c) => c.code === upper);
}
