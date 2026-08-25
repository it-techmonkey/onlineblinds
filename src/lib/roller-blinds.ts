/**
 * Roller blinds carry a `roller-blinds` tag (verified across the whole roller
 * collection, and absent from every Day & Night product).
 *
 * This matters for pricing: roller and Day & Night both offer a cassette in
 * white/grey/black, but they're separate pricing categories at different prices
 * (`roller-cassette` vs `cassette-bar`). The server has to know which one a
 * product uses — it can't trust the client for pricing.
 *
 * Separator-agnostic for the same reason as `isDayNightBlindProduct`: the client
 * only ever sees tags after `slugify()` folds every non-alphanumeric run to a
 * hyphen. This tag already uses hyphens, so today it matches either way — but a
 * literal-string check here would silently break if the tag were ever entered
 * with an underscore in Shopify admin, the way `day_night_blinds` was.
 */
function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim().replace(/[-_\s]+/g, '-');
}

export function isRollerBlindProduct(tags: string[] = []): boolean {
  return tags.some((tag) => normalizeTag(tag) === 'roller-blinds');
}
