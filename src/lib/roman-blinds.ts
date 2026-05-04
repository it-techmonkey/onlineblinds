const ROMAN_TAG_PATTERNS = [
  /^roman_[abcd]$/,
  /^romna_eb_(aa|a|b|c|d)$/,
];

export function isRomanProduct(tags: string[] = []): boolean {
  return tags.some((tag) => {
    const normalized = tag.toLowerCase().trim();
    return normalized === 'roman-blinds' || ROMAN_TAG_PATTERNS.some((pattern) => pattern.test(normalized));
  });
}
