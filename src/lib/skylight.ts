import { findSkylightBlindTypeOption, type SkylightBrandId } from '@/data/skylight';

export const SKYLIGHT_BASE_PRICE = 20;
export const SKYLIGHT_BASE_PRICE_BAND_NAME = 'Skylight Blinds - Base Band';
export const SKYLIGHT_FIXED_WIDTH_INCHES = 1;
export const SKYLIGHT_FIXED_HEIGHT_INCHES = 1;

function normalizeValue(value: string | null | undefined) {
  return (value || '').toLowerCase().trim();
}

export function isSkylightProduct(params: {
  category?: string | null;
  tags?: string[];
  name?: string | null;
  slug?: string | null;
}) {
  const category = normalizeValue(params.category);
  const name = normalizeValue(params.name);
  const slug = normalizeValue(params.slug);
  const tags = (params.tags || []).map((tag) => normalizeValue(tag));

  return (
    category.includes('skylight') ||
    tags.includes('sky_light_blinds') ||
    tags.includes('skylight-blinds') ||
    name.includes('skylight') ||
    slug.includes('skylight')
  );
}

export function getSkylightPricingDimensions() {
  return {
    widthInches: SKYLIGHT_FIXED_WIDTH_INCHES,
    heightInches: SKYLIGHT_FIXED_HEIGHT_INCHES,
  };
}

export function getSkylightBlindTypeBrand(optionId: string | null | undefined): SkylightBrandId | null {
  const blindType = findSkylightBlindTypeOption(optionId);
  return blindType?.brand ?? null;
}
