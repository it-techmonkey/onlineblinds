export const REPLACEMENT_VERTICAL_SLAT_COLLECTION_SLUG = 'replacement-vertical-blinds-slat';
export const REPLACEMENT_VERTICAL_SLAT_FIXED_WIDTH_INCHES = 16;

interface HeightPriceTier {
  maxInches: number;
  price: number;
}

const REPLACEMENT_VERTICAL_SLAT_PRICE_BAND_BY_TAG: Record<string, string> = {
  'vertical_49_slat': 'Replacement Vertical Blinds Slat - Band A',
  'vertical_40_slat': 'Replacement Vertical Blinds Slat - Band B',
  'vertical_35_slat': 'Replacement Vertical Blinds Slat - Band C',
  'vertical_31_slat': 'Replacement Vertical Blinds Slat - Band D',
  'vertical_34_slat': 'Replacement Vertical Blinds Slat - Band D',
  'vertical_25_slat': 'Replacement Vertical Blinds Slat - Band E',
  'vertical_18_slat': 'Replacement Vertical Blinds Slat - Band F',
  'vertical_22_slat': 'Replacement Vertical Blinds Slat - Band F',
  'vertical_16_slat': 'Replacement Vertical Blinds Slat - Band Premium',
};

const REGULAR_VERTICAL_PRICE_BAND_BY_TAG: Record<string, string> = {
  '50_vertical': 'Vertical Blind - Band A',
  '47_vertical': 'Vertical Blind - Band B',
  '45_vertical': 'Vertical Blind - Band C',
  '40_vertical': 'Vertical Blind - Band D',
  '39_vertical': 'Vertical Blind - Band E',
  'vertical_18': 'Vertical Blind - Band F',
  'vertical_22': 'Vertical Blind - Band F',
  'vertical_16': 'Vertical Blind - Band Premium',
};

const REPLACEMENT_VERTICAL_SLAT_PRICING: Record<string, HeightPriceTier[]> = {
  vertical_49: [
    { maxInches: 43, price: 0.96 },
    { maxInches: 59, price: 1.29 },
    { maxInches: 83, price: 1.7 },
    { maxInches: Infinity, price: 2.3 },
  ],
  vertical_40: [
    { maxInches: 43, price: 1.29 },
    { maxInches: 59, price: 1.59 },
    { maxInches: 83, price: 1.89 },
    { maxInches: Infinity, price: 2.45 },
  ],
  vertical_35: [
    { maxInches: 43, price: 1.59 },
    { maxInches: 59, price: 1.82 },
    { maxInches: 83, price: 1.99 },
    { maxInches: Infinity, price: 2.6 },
  ],
  vertical_31: [
    { maxInches: 43, price: 1.75 },
    { maxInches: 59, price: 1.99 },
    { maxInches: 83, price: 2.31 },
    { maxInches: Infinity, price: 2.81 },
  ],
  vertical_34: [
    { maxInches: 43, price: 1.75 },
    { maxInches: 59, price: 1.99 },
    { maxInches: 83, price: 2.31 },
    { maxInches: Infinity, price: 2.81 },
  ],
  vertical_25: [
    { maxInches: 43, price: 2.0 },
    { maxInches: 59, price: 2.1 },
    { maxInches: 83, price: 2.49 },
    { maxInches: Infinity, price: 3.0 },
  ],
  vertical_18: [
    { maxInches: 59, price: 2.7 },
    { maxInches: 86.6, price: 3.5 },
    { maxInches: 110, price: 4.0 },
    { maxInches: Infinity, price: 4.3 },
  ],
  vertical_22: [
    { maxInches: 59, price: 2.7 },
    { maxInches: 86.6, price: 3.5 },
    { maxInches: 110, price: 4.0 },
    { maxInches: Infinity, price: 4.3 },
  ],
  vertical_16: [
    { maxInches: 43, price: 2.49 },
    { maxInches: 59, price: 3.0 },
    { maxInches: 83, price: 3.3 },
    { maxInches: Infinity, price: 3.7 },
  ],
};

function normalizeTags(tags: string[]): string[] {
  return tags
    .map((tag) => tag.trim().toLowerCase().replace(/-/g, '_'))
    .filter(Boolean);
}

function normalizeReplacementVerticalSlatBandTag(tag: string): string {
  return tag.endsWith('_slat') ? tag.slice(0, -5) : tag;
}

export function isReplacementVerticalSlatProduct(tags: string[]): boolean {
  return normalizeTags(tags).some((tag) => tag in REPLACEMENT_VERTICAL_SLAT_PRICE_BAND_BY_TAG);
}

export function isHeightOnlyVerticalProduct(tags: string[]): boolean {
  return isReplacementVerticalSlatProduct(tags);
}

export function inferVerticalPriceBandNameFromTags(tags: string[]): string | null {
  for (const tag of normalizeTags(tags)) {
    const replacementBandName = REPLACEMENT_VERTICAL_SLAT_PRICE_BAND_BY_TAG[tag];
    if (replacementBandName) {
      return replacementBandName;
    }

    const bandName = REGULAR_VERTICAL_PRICE_BAND_BY_TAG[tag];
    if (bandName) {
      return bandName;
    }
  }

  return null;
}

function getReplacementVerticalSlatBandTag(tags: string[]): string | null {
  for (const tag of normalizeTags(tags)) {
    const normalizedTag = normalizeReplacementVerticalSlatBandTag(tag);
    if (REPLACEMENT_VERTICAL_SLAT_PRICING[normalizedTag]) {
      return normalizedTag;
    }
  }

  return null;
}

export function calculateReplacementVerticalSlatPrice(heightInches: number, tags: string[]): number | null {
  const bandTag = getReplacementVerticalSlatBandTag(tags);
  if (!bandTag || heightInches <= 0) {
    return null;
  }

  const tiers = REPLACEMENT_VERTICAL_SLAT_PRICING[bandTag];
  const tier = tiers.find((item) => heightInches <= item.maxInches) ?? tiers[tiers.length - 1];

  return tier?.price ?? null;
}

export function getMinimumReplacementVerticalSlatPrice(tags: string[]): number | null {
  const bandTag = getReplacementVerticalSlatBandTag(tags);
  if (!bandTag) {
    return null;
  }

  const tiers = REPLACEMENT_VERTICAL_SLAT_PRICING[bandTag];
  if (!tiers || tiers.length === 0) {
    return null;
  }

  return Math.min(...tiers.map((tier) => tier.price));
}
