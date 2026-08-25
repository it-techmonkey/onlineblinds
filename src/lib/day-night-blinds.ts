/**
 * Zebra / Day & Night blinds carry a `day_night_blinds` tag. Verified against the
 * product export: 111 of the 112 day-and-night handles carry it, no product in any
 * other category does, and it never co-occurs with `roller-blinds`.
 *
 * (The one gap, `blackout-pitch-charcoal-grey-motorised-day-and-night-blind`, has
 * no price-band tag either, so it cannot be quoted at all.)
 *
 * This matters for sizing: the supplier sheet, not the price band, defines what
 * sizes a zebra shade can be built in — see `measurement-ranges.ts`. The server
 * has to be able to tell, because it cannot trust the client for pricing.
 *
 * The comparison is separator-agnostic (`_`, `-`, whitespace all fold to `-`):
 * the raw Shopify tag is `day_night_blinds`, but the client only ever sees tags
 * after `slugify()` (src/lib/shopify.ts) has turned every non-alphanumeric run
 * into a hyphen, producing `day-night-blinds`. A literal-string check matches the
 * server's raw Admin API tags but silently never matches on the client — every
 * zebra product would look untagged there, disabling clamping in browser-side
 * pricing and pricing-error checks even though the server accepts the size.
 */
function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/[-_\s]+/g, '-');
}

export function isDayNightBlindProduct(tags: string[] = []): boolean {
  return tags.some((tag) => normalizeTag(tag) === 'day-night-blinds');
}
