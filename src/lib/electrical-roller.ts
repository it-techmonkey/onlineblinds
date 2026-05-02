const ELECTRICAL_ROLLER_COLLECTION_TAG = 'roller-blinds-electrical';
const ELECTRICAL_ROLLER_BAND_TAG = /^roller[-_]\d+(?:1)?[-_]e$/;

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

export function getElectricalRollerRemoteOptions<T extends { id: string }>(
  options: T[]
): T[] {
  return options.filter((option) => option.id !== 'none');
}

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

  return isElectricalRollerProduct(productTags) ? 100 : 95;
}

export function getMinimumPriceWithElectricalRollerUplift(
  basePrice: number,
  productTags: string[] = []
): number {
  return isElectricalRollerProduct(productTags) ? basePrice + 100 : basePrice;
}
