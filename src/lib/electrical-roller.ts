const ELECTRICAL_ROLLER_COLLECTION_TAG = 'roller-blinds-electrical';
const ELECTRICAL_ROLLER_BAND_TAG = /^roller[-_]\d+(?:1)?[-_]e$/;
const ELECTRICAL_DAY_NIGHT_COLLECTION_TAG = 'day-and-night-blinds-electrical';
const ELECTRICAL_DAY_NIGHT_BAND_TAG = /^day_band_ele_[a-z]+$/;

function normalizeTag(tag: string): string {
  return tag.toLowerCase().trim();
}

export function isElectricalRollerTag(tag: string): boolean {
  const normalized = normalizeTag(tag);
  return (
    normalized === ELECTRICAL_ROLLER_COLLECTION_TAG ||
    ELECTRICAL_ROLLER_BAND_TAG.test(normalized)
  );
}

export function isElectricalRollerProduct(tags: string[] = []): boolean {
  return tags.some(isElectricalRollerTag);
}

export function isElectricalDayNightTag(tag: string): boolean {
  const normalized = normalizeTag(tag);
  return (
    normalized === ELECTRICAL_DAY_NIGHT_COLLECTION_TAG ||
    ELECTRICAL_DAY_NIGHT_BAND_TAG.test(normalized)
  );
}

export function isElectricalDayNightProduct(tags: string[] = []): boolean {
  return tags.some(isElectricalDayNightTag);
}

export function isSpecialMotorizedProduct(tags: string[] = []): boolean {
  return isElectricalRollerProduct(tags) || isElectricalDayNightProduct(tags);
}

/**
 * Flat motorization charge, remote and charging wire included. Customers no longer
 * pick a remote channel count, so this is the entire motorization price — the
 * `motorized` sentinel option itself is priced at £0.
 *
 * Keep in sync with MOTORIZATION_PRICE in src/data/customizations.ts (display) and
 * the uplift in scripts/export-shopify-products.mjs (CSV export).
 */
export const MOTORIZATION_BASE_PRICE = 75;

export function getMotorizationBasePrice(
  selectedCustomizations: { category: string; optionId: string }[] = []
): number {
  const hasMotorization = selectedCustomizations.some(
    (customization) => customization.category === 'motorization'
  );

  return hasMotorization ? MOTORIZATION_BASE_PRICE : 0;
}

export function getMinimumPriceWithMotorizedUplift(
  basePrice: number,
  productTags: string[] = []
): number {
  return isSpecialMotorizedProduct(productTags) ? basePrice + MOTORIZATION_BASE_PRICE : basePrice;
}

export const getMinimumPriceWithElectricalRollerUplift = getMinimumPriceWithMotorizedUplift;
