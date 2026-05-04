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

export function getMotorizedRemoteOptions<T extends { id: string }>(
  options: T[]
): T[] {
  return options.filter((option) => option.id !== 'none');
}

export const getElectricalRollerRemoteOptions = getMotorizedRemoteOptions;

export function getMotorizationBasePrice(
  productTags: string[] = [],
  selectedCustomizations: { category: string; optionId: string }[] = []
): number {
  const hasMotorization = selectedCustomizations.some(
    (customization) => customization.category === 'motorization'
  );

  if (!hasMotorization) {
    return 0;
  }

  return isSpecialMotorizedProduct(productTags) ? 100 : 95;
}

export function getMinimumPriceWithMotorizedUplift(
  basePrice: number,
  productTags: string[] = []
): number {
  return isSpecialMotorizedProduct(productTags) ? basePrice + 100 : basePrice;
}

export const getMinimumPriceWithElectricalRollerUplift = getMinimumPriceWithMotorizedUplift;
