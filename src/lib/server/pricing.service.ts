import pricingDataFile from '@/data/pricing/pricing-data.json';
import { getAllCachedProducts } from './product-cache';
import {
  calculateReplacementVerticalSlatPrice,
  inferVerticalPriceBandNameFromTags,
  isHeightOnlyVerticalProduct,
} from '@/lib/vertical-blinds';
import {
  getMinimumPriceWithMotorizedUplift,
  getMotorizationBasePrice,
} from '@/lib/electrical-roller';

export interface PricingRequest {
  handle: string;
  widthInches: number;
  heightInches: number;
  customizations?: {
    category: string;
    optionId: string;
  }[];
}

export interface PricingResponse {
  dimensionPrice: number;
  customizationPrices: {
    category: string;
    optionId: string;
    name: string;
    price: number;
  }[];
  totalPrice: number;
  widthBand: { mm: number; inches: number };
  heightBand: { mm: number; inches: number };
}

export interface PriceBandMatrix {
  id: string;
  name: string;
  widthBands: { id: string; mm: number; inches: number }[];
  heightBands: { id: string; mm: number; inches: number }[];
  prices: { widthMm: number; heightMm: number; price: number }[];
}

export interface CustomizationPricingData {
  category: string;
  optionId: string;
  name: string;
  prices: { widthMm: number | null; price: number }[];
}

interface JsonPriceBand {
  id: string;
  name: string;
  description: string | null;
}

interface JsonWidthBand {
  id: string;
  widthMm: number;
  widthInches: number;
  sortOrder: number;
}

interface JsonHeightBand {
  id: string;
  heightMm: number;
  heightInches: number;
  sortOrder: number;
}

interface JsonPriceCell {
  id: string;
  priceBandId: string;
  widthBandId: string;
  heightBandId: string;
  price: number;
}

interface JsonCustomizationOption {
  id: string;
  category: string;
  optionId: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

interface JsonCustomizationPricing {
  id: string;
  customizationOptionId: string;
  widthBandId: string | null;
  price: number;
  isPerUnit: boolean;
}

interface PricingDataFile {
  schemaVersion: 1;
  generatedAt: string;
  source: string;
  checksum?: string;
  priceBands: JsonPriceBand[];
  widthBands: JsonWidthBand[];
  heightBands: JsonHeightBand[];
  priceCells: JsonPriceCell[];
  customizationOptions: JsonCustomizationOption[];
  customizationPricings: JsonCustomizationPricing[];
}

interface PricingIndexes {
  priceBandsById: Map<string, JsonPriceBand>;
  priceBandsByName: Map<string, JsonPriceBand>;
  widthBandsById: Map<string, JsonWidthBand>;
  heightBandsById: Map<string, JsonHeightBand>;
  priceCellsByBand: Map<string, JsonPriceCell[]>;
  priceCellByCompositeKey: Map<string, JsonPriceCell>;
  customizationOptionsByKey: Map<string, JsonCustomizationOption>;
  customizationPricingsByOptionId: Map<string, JsonCustomizationPricing[]>;
}

const pricingData = pricingDataFile as PricingDataFile;
let indexes: PricingIndexes | null = null;

function key(...parts: Array<string | null>) {
  return parts.map((part) => part ?? '__null__').join('::');
}

function validatePricingData(data: PricingDataFile) {
  const errors: string[] = [];

  if (data.schemaVersion !== 1) {
    errors.push(`Unsupported pricing data schemaVersion: ${data.schemaVersion}`);
  }

  const requiredArrays: Array<keyof PricingDataFile> = [
    'priceBands',
    'widthBands',
    'heightBands',
    'priceCells',
    'customizationOptions',
    'customizationPricings',
  ];

  for (const field of requiredArrays) {
    if (!Array.isArray(data[field])) {
      errors.push(`pricing-data.json field "${field}" must be an array`);
    }
  }

  const priceBandIds = new Set<string>();
  const priceBandNames = new Set<string>();
  for (const band of data.priceBands ?? []) {
    if (!band.id) errors.push('Price band is missing id');
    if (!band.name) errors.push(`Price band "${band.id}" is missing name`);
    if (priceBandIds.has(band.id)) errors.push(`Duplicate price band id: ${band.id}`);
    if (priceBandNames.has(band.name)) errors.push(`Duplicate price band name: ${band.name}`);
    priceBandIds.add(band.id);
    priceBandNames.add(band.name);
  }

  const widthBandIds = new Set<string>();
  for (const band of data.widthBands ?? []) {
    if (widthBandIds.has(band.id)) errors.push(`Duplicate width band id: ${band.id}`);
    if (!Number.isFinite(band.widthMm) || !Number.isFinite(band.widthInches)) {
      errors.push(`Invalid width band dimensions: ${band.id}`);
    }
    widthBandIds.add(band.id);
  }

  const heightBandIds = new Set<string>();
  for (const band of data.heightBands ?? []) {
    if (heightBandIds.has(band.id)) errors.push(`Duplicate height band id: ${band.id}`);
    if (!Number.isFinite(band.heightMm) || !Number.isFinite(band.heightInches)) {
      errors.push(`Invalid height band dimensions: ${band.id}`);
    }
    heightBandIds.add(band.id);
  }

  const priceCellKeys = new Set<string>();
  for (const cell of data.priceCells ?? []) {
    if (!priceBandIds.has(cell.priceBandId)) {
      errors.push(`Price cell "${cell.id}" references missing priceBandId "${cell.priceBandId}"`);
    }
    if (!widthBandIds.has(cell.widthBandId)) {
      errors.push(`Price cell "${cell.id}" references missing widthBandId "${cell.widthBandId}"`);
    }
    if (!heightBandIds.has(cell.heightBandId)) {
      errors.push(`Price cell "${cell.id}" references missing heightBandId "${cell.heightBandId}"`);
    }
    if (!Number.isFinite(cell.price) || cell.price < 0) {
      errors.push(`Price cell "${cell.id}" has invalid price "${cell.price}"`);
    }
    const compositeKey = key(cell.priceBandId, cell.widthBandId, cell.heightBandId);
    if (priceCellKeys.has(compositeKey)) {
      errors.push(`Duplicate price cell for ${compositeKey}`);
    }
    priceCellKeys.add(compositeKey);
  }

  const optionIds = new Set<string>();
  const optionKeys = new Set<string>();
  for (const option of data.customizationOptions ?? []) {
    if (optionIds.has(option.id)) errors.push(`Duplicate customization option id: ${option.id}`);
    const optionKey = key(option.category, option.optionId);
    if (optionKeys.has(optionKey)) errors.push(`Duplicate customization option key: ${optionKey}`);
    optionIds.add(option.id);
    optionKeys.add(optionKey);
  }

  const customizationPricingKeys = new Set<string>();
  for (const pricing of data.customizationPricings ?? []) {
    if (!optionIds.has(pricing.customizationOptionId)) {
      errors.push(`Customization pricing "${pricing.id}" references missing option "${pricing.customizationOptionId}"`);
    }
    if (pricing.widthBandId && !widthBandIds.has(pricing.widthBandId)) {
      errors.push(`Customization pricing "${pricing.id}" references missing widthBandId "${pricing.widthBandId}"`);
    }
    if (!Number.isFinite(pricing.price) || pricing.price < 0) {
      errors.push(`Customization pricing "${pricing.id}" has invalid price "${pricing.price}"`);
    }
    const compositeKey = key(pricing.customizationOptionId, pricing.widthBandId);
    if (customizationPricingKeys.has(compositeKey)) {
      errors.push(`Duplicate customization pricing for ${compositeKey}`);
    }
    customizationPricingKeys.add(compositeKey);
  }

  for (const priceBand of data.priceBands ?? []) {
    const cells = data.priceCells.filter((cell) => cell.priceBandId === priceBand.id);
    if (cells.length === 0) {
      errors.push(`Price band "${priceBand.name}" has no price cells`);
      continue;
    }

    const widthIds = new Set(cells.map((cell) => cell.widthBandId));
    const heightIds = new Set(cells.map((cell) => cell.heightBandId));
    const expectedCells = widthIds.size * heightIds.size;
    if (cells.length !== expectedCells) {
      errors.push(
        `Price band "${priceBand.name}" has ${cells.length} cells but expected ${expectedCells} for its width/height grid`
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid pricing-data.json:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }
}

function getIndexes(): PricingIndexes {
  if (indexes) return indexes;

  validatePricingData(pricingData);

  const priceBandsById = new Map(pricingData.priceBands.map((band) => [band.id, band]));
  const priceBandsByName = new Map(pricingData.priceBands.map((band) => [band.name, band]));
  const widthBandsById = new Map(pricingData.widthBands.map((band) => [band.id, band]));
  const heightBandsById = new Map(pricingData.heightBands.map((band) => [band.id, band]));
  const priceCellsByBand = new Map<string, JsonPriceCell[]>();
  const priceCellByCompositeKey = new Map<string, JsonPriceCell>();
  const customizationOptionsByKey = new Map<string, JsonCustomizationOption>();
  const customizationPricingsByOptionId = new Map<string, JsonCustomizationPricing[]>();

  for (const cell of pricingData.priceCells) {
    if (!priceCellsByBand.has(cell.priceBandId)) {
      priceCellsByBand.set(cell.priceBandId, []);
    }
    priceCellsByBand.get(cell.priceBandId)!.push(cell);
    priceCellByCompositeKey.set(key(cell.priceBandId, cell.widthBandId, cell.heightBandId), cell);
  }

  for (const option of pricingData.customizationOptions) {
    customizationOptionsByKey.set(key(option.category, option.optionId), option);
  }

  for (const pricing of pricingData.customizationPricings) {
    if (!customizationPricingsByOptionId.has(pricing.customizationOptionId)) {
      customizationPricingsByOptionId.set(pricing.customizationOptionId, []);
    }
    customizationPricingsByOptionId.get(pricing.customizationOptionId)!.push(pricing);
  }

  indexes = {
    priceBandsById,
    priceBandsByName,
    widthBandsById,
    heightBandsById,
    priceCellsByBand,
    priceCellByCompositeKey,
    customizationOptionsByKey,
    customizationPricingsByOptionId,
  };

  return indexes;
}

function sortWidthBands(a: JsonWidthBand, b: JsonWidthBand) {
  return a.sortOrder - b.sortOrder || a.widthInches - b.widthInches;
}

function sortHeightBands(a: JsonHeightBand, b: JsonHeightBand) {
  return a.sortOrder - b.sortOrder || a.heightInches - b.heightInches;
}

function getBandWidthBands(priceBandId: string): JsonWidthBand[] {
  const data = getIndexes();
  const cells = data.priceCellsByBand.get(priceBandId) ?? [];
  const bands = new Map<string, JsonWidthBand>();

  for (const cell of cells) {
    const band = data.widthBandsById.get(cell.widthBandId);
    if (band) bands.set(band.id, band);
  }

  return Array.from(bands.values()).sort(sortWidthBands);
}

function getBandHeightBands(priceBandId: string): JsonHeightBand[] {
  const data = getIndexes();
  const cells = data.priceCellsByBand.get(priceBandId) ?? [];
  const bands = new Map<string, JsonHeightBand>();

  for (const cell of cells) {
    const band = data.heightBandsById.get(cell.heightBandId);
    if (band) bands.set(band.id, band);
  }

  return Array.from(bands.values()).sort(sortHeightBands);
}

function findCeilingWidthBand(widthInches: number, priceBandId: string): JsonWidthBand | null {
  const widthBands = getBandWidthBands(priceBandId);
  if (widthBands.length === 0) return null;

  const min = widthBands[0].widthInches;
  const max = widthBands[widthBands.length - 1].widthInches;
  if (widthInches < min || widthInches > max) return null;

  return widthBands.find((band) => band.widthInches >= Math.ceil(widthInches)) ?? null;
}

function findCeilingHeightBand(heightInches: number, priceBandId: string): JsonHeightBand | null {
  const heightBands = getBandHeightBands(priceBandId);
  if (heightBands.length === 0) return null;

  const min = heightBands[0].heightInches;
  const max = heightBands[heightBands.length - 1].heightInches;
  if (heightInches < min || heightInches > max) return null;

  return heightBands.find((band) => band.heightInches >= Math.ceil(heightInches)) ?? null;
}

async function resolvePriceBand(handle: string): Promise<JsonPriceBand> {
  const cachedProducts = await getAllCachedProducts();
  const cachedProduct = cachedProducts[handle];
  const priceBandName =
    cachedProduct?.priceBandName ??
    inferVerticalPriceBandNameFromTags(cachedProduct?.tags ?? []);

  if (!priceBandName) {
    throw new Error(`Product "${handle}" not found or has no price band assigned`);
  }

  const priceBand = getIndexes().priceBandsByName.get(priceBandName);
  if (!priceBand) {
    throw new Error(`Price band "${priceBandName}" not found in pricing data`);
  }

  return priceBand;
}

function findCustomizationOption(
  category: string,
  optionId: string,
  widthBandId?: string | null
): (JsonCustomizationOption & { pricingEntries: JsonCustomizationPricing[] }) | null {
  const data = getIndexes();
  const categoriesToTry =
    category === 'cassette-bar'
      ? [category, 'roller-cassette']
      : [category];

  for (const categoryName of categoriesToTry) {
    const option = data.customizationOptionsByKey.get(key(categoryName, optionId));
    if (!option) continue;

    const entries = (data.customizationPricingsByOptionId.get(option.id) ?? []).filter((entry) =>
      widthBandId
        ? entry.widthBandId === null || entry.widthBandId === widthBandId
        : entry.widthBandId === null
    );

    return { ...option, pricingEntries: entries };
  }

  return null;
}

function findMatchingPricingEntry(
  entries: JsonCustomizationPricing[],
  preferredWidthBandId?: string | null
) {
  if (preferredWidthBandId) {
    return (
      entries.find((entry) => entry.widthBandId === preferredWidthBandId) ??
      entries.find((entry) => entry.widthBandId === null)
    );
  }

  return entries.find((entry) => entry.widthBandId === null);
}

function getPriceBandMatrixFromJson(priceBandId: string): PriceBandMatrix | null {
  const data = getIndexes();
  const priceBand = data.priceBandsById.get(priceBandId);
  if (!priceBand) return null;

  const cells = data.priceCellsByBand.get(priceBandId) ?? [];
  return {
    id: priceBand.id,
    name: priceBand.name,
    widthBands: getBandWidthBands(priceBandId).map((band) => ({
      id: band.id,
      mm: band.widthMm,
      inches: band.widthInches,
    })),
    heightBands: getBandHeightBands(priceBandId).map((band) => ({
      id: band.id,
      mm: band.heightMm,
      inches: band.heightInches,
    })),
    prices: cells.map((cell) => ({
      widthMm: data.widthBandsById.get(cell.widthBandId)!.widthMm,
      heightMm: data.heightBandsById.get(cell.heightBandId)!.heightMm,
      price: Number(cell.price),
    })),
  };
}

function getCustomizationPricingFromJson(): CustomizationPricingData[] {
  const data = getIndexes();
  return [...pricingData.customizationOptions]
    .sort((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder)
    .map((option) => ({
      category: option.category,
      optionId: option.optionId,
      name: option.name,
      prices: (data.customizationPricingsByOptionId.get(option.id) ?? [])
        .slice()
        .sort((a, b) => {
          const aSort = a.widthBandId ? data.widthBandsById.get(a.widthBandId)?.sortOrder ?? 0 : -1;
          const bSort = b.widthBandId ? data.widthBandsById.get(b.widthBandId)?.sortOrder ?? 0 : -1;
          return aSort - bSort;
        })
        .map((entry) => ({
          widthMm: entry.widthBandId ? data.widthBandsById.get(entry.widthBandId)?.widthMm ?? null : null,
          price: Number(entry.price),
        })),
    }));
}

function getMinimumPricesBatch(priceBandIds: string[]): Map<string, number> {
  const data = getIndexes();
  const result = new Map<string, number>();

  for (const priceBandId of priceBandIds) {
    const cells = data.priceCellsByBand.get(priceBandId) ?? [];
    if (cells.length === 0) continue;

    const sortedCells = [...cells].sort((a, b) => {
      const aWidth = data.widthBandsById.get(a.widthBandId)!;
      const aHeight = data.heightBandsById.get(a.heightBandId)!;
      const bWidth = data.widthBandsById.get(b.widthBandId)!;
      const bHeight = data.heightBandsById.get(b.heightBandId)!;
      const areaA = aWidth.widthMm * aHeight.heightMm;
      const areaB = bWidth.widthMm * bHeight.heightMm;
      if (areaA !== areaB) return areaA - areaB;
      if (aWidth.widthMm !== bWidth.widthMm) return aWidth.widthMm - bWidth.widthMm;
      return aHeight.heightMm - bHeight.heightMm;
    });

    result.set(priceBandId, Number(sortedCells[0].price));
  }

  return result;
}

async function getMinimumPricesByHandleFromJson(): Promise<Record<string, number>> {
  const allProducts = await getAllCachedProducts();
  const data = getIndexes();
  const result: Record<string, number> = {};
  const bandNames = new Set<string>();

  for (const product of Object.values(allProducts)) {
    const priceBandName =
      product.priceBandName ??
      inferVerticalPriceBandNameFromTags(product.tags);
    if (priceBandName) bandNames.add(priceBandName);
  }

  const priceBands = Array.from(bandNames)
    .map((bandName) => data.priceBandsByName.get(bandName))
    .filter((band): band is JsonPriceBand => Boolean(band));
  const bandNameToId = new Map(priceBands.map((band) => [band.name, band.id]));
  const minPrices = getMinimumPricesBatch(priceBands.map((band) => band.id));

  for (const [handle, product] of Object.entries(allProducts)) {
    const priceBandName =
      product.priceBandName ??
      inferVerticalPriceBandNameFromTags(product.tags);
    if (!priceBandName) continue;

    const bandId = bandNameToId.get(priceBandName);
    const price = bandId ? minPrices.get(bandId) : undefined;
    if (price !== undefined) {
      result[handle] = getMinimumPriceWithMotorizedUplift(price, product.tags);
    }
  }

  return result;
}

export async function calculateProductPrice(request: PricingRequest): Promise<PricingResponse> {
  const cachedProducts = await getAllCachedProducts();
  const cachedProduct = cachedProducts[request.handle];

  if (!cachedProduct) {
    throw new Error(`Product "${request.handle}" not found or has no price band assigned`);
  }

  if (isHeightOnlyVerticalProduct(cachedProduct.tags)) {
    const dimensionPrice = calculateReplacementVerticalSlatPrice(request.heightInches, cachedProduct.tags);
    if (dimensionPrice == null) {
      throw new Error(`Unable to determine replacement vertical slat pricing for "${request.handle}"`);
    }

    const customizationPrices: PricingResponse['customizationPrices'] = [];

    for (const customization of request.customizations ?? []) {
      const option = findCustomizationOption(customization.category, customization.optionId);
      const pricing = option ? findMatchingPricingEntry(option.pricingEntries) : null;

      if (option && pricing) {
        customizationPrices.push({
          category: option.category,
          optionId: option.optionId,
          name: option.name,
          price: Number(pricing.price),
        });
      }
    }

    const customizationTotal = customizationPrices.reduce((sum, customization) => sum + customization.price, 0);
    return {
      dimensionPrice,
      customizationPrices,
      totalPrice: dimensionPrice + customizationTotal,
      widthBand: { mm: 0, inches: 0 },
      heightBand: { mm: Math.round(request.heightInches * 25.4), inches: Math.ceil(request.heightInches) },
    };
  }

  const priceBand = await resolvePriceBand(request.handle);
  const widthBand = findCeilingWidthBand(request.widthInches, priceBand.id);
  const heightBand = findCeilingHeightBand(request.heightInches, priceBand.id);

  if (!widthBand || !heightBand) {
    throw new Error('Selected measurements are outside the allowed range for this product');
  }

  const priceCell = getIndexes().priceCellByCompositeKey.get(
    key(priceBand.id, widthBand.id, heightBand.id)
  );

  if (!priceCell) {
    throw new Error('Price not found for the given dimensions');
  }

  const dimensionPrice = Number(priceCell.price);
  const customizationPrices: PricingResponse['customizationPrices'] = [];

  for (const customization of request.customizations ?? []) {
    const option = findCustomizationOption(
      customization.category,
      customization.optionId,
      widthBand.id
    );
    const pricing = option ? findMatchingPricingEntry(option.pricingEntries, widthBand.id) : null;

    if (option && pricing) {
      customizationPrices.push({
        category: option.category,
        optionId: option.optionId,
        name: option.name,
        price: Number(pricing.price),
      });
    }
  }

  const customizationTotal = customizationPrices.reduce((sum, customization) => sum + customization.price, 0);
  const motorizationBasePrice = getMotorizationBasePrice(
    cachedProduct.tags,
    request.customizations ?? []
  );
  const totalPrice = dimensionPrice + customizationTotal + motorizationBasePrice;

  return {
    dimensionPrice,
    customizationPrices,
    totalPrice,
    widthBand: { mm: widthBand.widthMm, inches: widthBand.widthInches },
    heightBand: { mm: heightBand.heightMm, inches: heightBand.heightInches },
  };
}

export async function getPriceBandMatrix(priceBandId: string): Promise<PriceBandMatrix | null> {
  return getPriceBandMatrixFromJson(priceBandId);
}

export async function getCustomizationPricing(): Promise<CustomizationPricingData[]> {
  return getCustomizationPricingFromJson();
}

export async function getWidthBands() {
  return [...pricingData.widthBands].sort(sortWidthBands);
}

export async function getHeightBands() {
  return [...pricingData.heightBands].sort(sortHeightBands);
}

export async function resolveHandleToPriceBand(handle: string) {
  try {
    const priceBand = await resolvePriceBand(handle);
    return { id: priceBand.id, name: priceBand.name };
  } catch {
    return null;
  }
}

export async function validateCartPrice(
  request: PricingRequest,
  submittedPrice: number,
  tolerance: number = 0.01
): Promise<{ valid: boolean; calculatedPrice: number; difference: number }> {
  const pricing = await calculateProductPrice(request);
  const difference = Math.abs(pricing.totalPrice - submittedPrice);

  return {
    valid: difference <= tolerance,
    calculatedPrice: pricing.totalPrice,
    difference,
  };
}

export async function getMinimumPricesByHandle(): Promise<Record<string, number>> {
  return getMinimumPricesByHandleFromJson();
}
