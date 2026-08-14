/**
 * Roller blinds carry a `roller-blinds` tag (verified across the whole roller
 * collection, and absent from every Day & Night product).
 *
 * This matters for pricing: roller and Day & Night both offer a cassette in
 * white/grey/black, but they're separate pricing categories at different prices
 * (`roller-cassette` vs `cassette-bar`). The server has to know which one a
 * product uses — it can't trust the client for pricing.
 */
export function isRollerBlindProduct(tags: string[] = []): boolean {
  return tags.some((tag) => tag.toLowerCase().trim() === 'roller-blinds');
}
