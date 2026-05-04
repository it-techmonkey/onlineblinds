import { PriceOption } from '@/types';

export type SkylightBrandId = 'velux' | 'fakro' | 'rooflite' | 'dakstra' | 'dakea';

type SkylightBlindTypePrice = {
  code: string;
  price: number;
};

export const SKYLIGHT_BRAND_OPTIONS: PriceOption[] = [
  { id: 'velux', name: 'Velux', price: 0 },
  { id: 'fakro', name: 'Fakro', price: 0 },
  { id: 'rooflite', name: 'Rooflite', price: 0 },
  { id: 'dakstra', name: 'Dakstra', price: 0 },
  { id: 'dakea', name: 'Dakea', price: 0 },
];

const ROOFLITE_FAMILY_OPTIONS: SkylightBlindTypePrice[] = [
  { code: 'C2A', price: 56.4 },
  { code: 'C4A', price: 58.8 },
  { code: 'C6A', price: 62.4 },
  { code: 'F4A', price: 58.8 },
  { code: 'F6A', price: 63.6 },
  { code: 'M4A', price: 69.6 },
  { code: 'M6A', price: 75.6 },
  { code: 'M8A', price: 82.8 },
  { code: 'M10A', price: 21.6 },
  { code: 'P6A', price: 84.0 },
  { code: 'P8A', price: 86.4 },
  { code: 'S6A', price: 94.8 },
  { code: 'S8A', price: 104.4 },
  { code: 'U4A', price: 99.6 },
  { code: 'U8A', price: 120.0 },
];

export const SKYLIGHT_BLIND_TYPE_PRICING: Record<SkylightBrandId, SkylightBlindTypePrice[]> = {
  velux: [
    { code: 'C01', price: 45.6 },
    { code: '102', price: 48.0 },
    { code: '5', price: 60.0 },
    { code: 'C02', price: 49.2 },
    { code: '104', price: 55.2 },
    { code: '206', price: 56.4 },
    { code: 'C04', price: 56.4 },
    { code: 'C06', price: 60.0 },
    { code: 'F04', price: 52.8 },
    { code: 'F06', price: 57.6 },
    { code: 'F08', price: 61.2 },
    { code: 'M04', price: 63.6 },
    { code: 'M06', price: 69.6 },
    { code: 'M08', price: 76.8 },
    { code: 'M10', price: 82.8 },
    { code: 'P04', price: 72.0 },
    { code: 'P06', price: 75.6 },
    { code: 'P08', price: 79.2 },
    { code: 'P10', price: 91.2 },
    { code: 'S01', price: 81.6 },
    { code: 'S06', price: 91.2 },
    { code: 'S08', price: 96.0 },
    { code: 'S10', price: 100.8 },
    { code: 'U04', price: 93.6 },
    { code: 'U06', price: 105.6 },
    { code: 'U08', price: 110.4 },
    { code: 'CK01', price: 51.6 },
    { code: 'CK02', price: 55.2 },
    { code: 'CK04', price: 61.2 },
    { code: 'CK06', price: 66.0 },
    { code: 'FK04', price: 61.2 },
    { code: 'FK06', price: 63.6 },
    { code: 'FK08', price: 66.0 },
    { code: 'MK04', price: 69.6 },
    { code: 'MK06', price: 75.6 },
    { code: 'MK08', price: 84.0 },
    { code: 'MK10', price: 91.2 },
    { code: 'PK04', price: 79.2 },
    { code: 'PK06', price: 84.0 },
    { code: 'PK08', price: 87.6 },
    { code: 'PK10', price: 102.0 },
    { code: 'SK01', price: 88.8 },
    { code: 'SK06', price: 94.8 },
    { code: 'SK08', price: 102.0 },
    { code: 'SK10', price: 105.6 },
    { code: 'UK04', price: 102.0 },
    { code: 'UK06', price: 110.4 },
    { code: 'UK08', price: 120.0 },
    { code: 'M34', price: 63.6 },
    { code: 'M36', price: 70.8 },
    { code: 'M38', price: 75.6 },
    { code: 'MK34', price: 64.8 },
    { code: 'MK35', price: 64.8 },
    { code: 'MK36', price: 70.8 },
    { code: 'MK38', price: 79.2 },
    { code: 'P34', price: 74.4 },
    { code: 'P38', price: 79.2 },
    { code: 'PK34', price: 74.4 },
    { code: 'PK35', price: 74.4 },
    { code: 'PK38', price: 79.2 },
    { code: 'S36', price: 90.0 },
    { code: 'SK36', price: 91.2 },
    { code: 'U34', price: 93.6 },
    { code: 'UK34', price: 94.8 },
    { code: 'UK35', price: 94.8 },
    { code: 'UK38', price: 99.6 },
  ],
  fakro: [
    { code: '1 55/78', price: 55.2 },
    { code: '2 55/98', price: 61.2 },
    { code: '3 66/98', price: 62.4 },
    { code: '4 66/118', price: 63.6 },
    { code: '5 78/98', price: 70.8 },
    { code: '6 78/118', price: 75.6 },
    { code: '7 78/140', price: 84.0 },
    { code: '8 94/118', price: 93.6 },
    { code: '9 94/140', price: 98.4 },
    { code: '10 114/118', price: 98.4 },
    { code: '11 114/140', price: 102.0 },
    { code: '12 134/98', price: 102.0 },
    { code: '13 78/160', price: 85.2 },
    { code: '15 94/98', price: 91.2 },
    { code: '16 55/118', price: 78.0 },
    { code: '17 134/140', price: 120.0 },
    { code: '23 78/78', price: 66.0 },
    { code: '80 94/160', price: 120.0 },
  ],
  rooflite: ROOFLITE_FAMILY_OPTIONS,
  dakstra: ROOFLITE_FAMILY_OPTIONS,
  dakea: ROOFLITE_FAMILY_OPTIONS,
};

function normalizeBlindTypeCode(code: string) {
  return code.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getSkylightBlindTypeOptionId(brand: SkylightBrandId, code: string) {
  return `${brand}-${normalizeBlindTypeCode(code)}`;
}

export function formatSkylightBlindTypeName(code: string, price: number) {
  return `${code} (+ £${price.toFixed(2)})`;
}

export function getSkylightBlindTypeOptions(brand: SkylightBrandId | null | undefined): PriceOption[] {
  if (!brand) {
    return [];
  }

  return (SKYLIGHT_BLIND_TYPE_PRICING[brand] || []).map((option) => ({
    id: getSkylightBlindTypeOptionId(brand, option.code),
    name: formatSkylightBlindTypeName(option.code, option.price),
    price: option.price,
  }));
}

export function findSkylightBrandOption(brandId: string | null | undefined) {
  return SKYLIGHT_BRAND_OPTIONS.find((option) => option.id === brandId) || null;
}

export function findSkylightBlindTypeOption(optionId: string | null | undefined) {
  if (!optionId) {
    return null;
  }

  for (const [brand, options] of Object.entries(SKYLIGHT_BLIND_TYPE_PRICING) as Array<[SkylightBrandId, SkylightBlindTypePrice[]]>) {
    const match = options.find((option) => getSkylightBlindTypeOptionId(brand, option.code) === optionId);
    if (match) {
      return {
        brand,
        ...match,
      };
    }
  }

  return null;
}
