/* eslint-disable @typescript-eslint/no-explicit-any */
import { unstable_cache } from 'next/cache';
import { prisma } from './database';
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

const PRICING_CACHE_REVALIDATE_SECONDS = 900;

// ============================================
// Types
// ============================================

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

interface CustomizationOptionRecord {
  category: string;
  optionId: string;
  name: string;
  pricingEntries: Array<{
    widthBandId: string | null;
    price: unknown;
  }>;
}

// ============================================
// Helper Functions
// ============================================

async function findCeilingWidthBand(widthInches: number, priceBandId: string) {
  const [minWidthBand, maxWidthBand] = await Promise.all([
    prisma.widthBand.findFirst({
      where: { priceCells: { some: { priceBandId } } },
      orderBy: { widthInches: 'asc' },
      select: { widthInches: true },
    }),
    prisma.widthBand.findFirst({
      where: { priceCells: { some: { priceBandId } } },
      orderBy: { widthInches: 'desc' },
      select: { widthInches: true },
    }),
  ]);

  if (!minWidthBand || !maxWidthBand) {
    return null;
  }

  if (widthInches < minWidthBand.widthInches || widthInches > maxWidthBand.widthInches) {
    return null;
  }

  const widthBand = await prisma.widthBand.findFirst({
    where: {
      widthInches: { gte: Math.ceil(widthInches) },
      priceCells: { some: { priceBandId } },
    },
    orderBy: { widthInches: 'asc' },
    select: {
      id: true,
      widthMm: true,
      widthInches: true,
    },
  });

  return widthBand;
}

async function findCeilingHeightBand(heightInches: number, priceBandId: string) {
  const [minHeightBand, maxHeightBand] = await Promise.all([
    prisma.heightBand.findFirst({
      where: { priceCells: { some: { priceBandId } } },
      orderBy: { heightInches: 'asc' },
      select: { heightInches: true },
    }),
    prisma.heightBand.findFirst({
      where: { priceCells: { some: { priceBandId } } },
      orderBy: { heightInches: 'desc' },
      select: { heightInches: true },
    }),
  ]);

  if (!minHeightBand || !maxHeightBand) {
    return null;
  }

  if (heightInches < minHeightBand.heightInches || heightInches > maxHeightBand.heightInches) {
    return null;
  }

  const heightBand = await prisma.heightBand.findFirst({
    where: {
      heightInches: { gte: Math.ceil(heightInches) },
      priceCells: { some: { priceBandId } },
    },
    orderBy: { heightInches: 'asc' },
    select: {
      id: true,
      heightMm: true,
      heightInches: true,
    },
  });

  return heightBand;
}

async function resolvePriceBand(handle: string) {
  const cachedProducts = await getAllCachedProducts();
  const cachedProduct = cachedProducts[handle];
  const priceBandName =
    cachedProduct?.priceBandName ??
    inferVerticalPriceBandNameFromTags(cachedProduct?.tags ?? []);

  if (!priceBandName) {
    throw new Error(`Product "${handle}" not found or has no price band assigned`);
  }

  const priceBand = await prisma.priceBand.findUnique({
    where: { name: priceBandName },
    select: {
      id: true,
      name: true,
    },
  });

  if (!priceBand) {
    throw new Error(`Price band "${priceBandName}" not found in database`);
  }

  return priceBand;
}

async function findCustomizationOption(
  category: string,
  optionId: string,
  widthBandId?: string | null
): Promise<CustomizationOptionRecord | null> {
  const categoriesToTry =
    category === 'cassette-bar'
      ? [category, 'roller-cassette']
      : [category];

  for (const categoryName of categoriesToTry) {
    const option = await prisma.customizationOption.findUnique({
      where: {
        category_optionId: {
          category: categoryName,
          optionId,
        },
      },
      select: {
        category: true,
        optionId: true,
        name: true,
        pricingEntries: {
          where: widthBandId
            ? {
                OR: [
                  { widthBandId: null },
                  { widthBandId },
                ],
              }
            : { widthBandId: null },
          select: {
            widthBandId: true,
            price: true,
          },
        },
      },
    });

    if (option) {
      return option;
    }
  }

  return null;
}

function findMatchingPricingEntry(
  entries: CustomizationOptionRecord['pricingEntries'],
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

async function getPriceBandMatrixUncached(priceBandId: string): Promise<PriceBandMatrix | null> {
  const priceBand = await prisma.priceBand.findUnique({
    where: { id: priceBandId },
    select: {
      id: true,
      name: true,
      priceCells: {
        select: {
          price: true,
          widthBand: {
            select: {
              id: true,
              widthMm: true,
              widthInches: true,
            },
          },
          heightBand: {
            select: {
              id: true,
              heightMm: true,
              heightInches: true,
            },
          },
        },
      },
    },
  });

  if (!priceBand) return null;

  const widthBandMap = new Map<string, { id: string; mm: number; inches: number }>();
  const heightBandMap = new Map<string, { id: string; mm: number; inches: number }>();

  priceBand.priceCells.forEach((cell: any) => {
    if (!widthBandMap.has(cell.widthBand.id)) {
      widthBandMap.set(cell.widthBand.id, {
        id: cell.widthBand.id,
        mm: cell.widthBand.widthMm,
        inches: cell.widthBand.widthInches,
      });
    }
    if (!heightBandMap.has(cell.heightBand.id)) {
      heightBandMap.set(cell.heightBand.id, {
        id: cell.heightBand.id,
        mm: cell.heightBand.heightMm,
        inches: cell.heightBand.heightInches,
      });
    }
  });

  return {
    id: priceBand.id,
    name: priceBand.name,
    widthBands: Array.from(widthBandMap.values()).sort((a, b) => a.inches - b.inches),
    heightBands: Array.from(heightBandMap.values()).sort((a, b) => a.inches - b.inches),
    prices: priceBand.priceCells.map((cell: any) => ({
      widthMm: cell.widthBand.widthMm,
      heightMm: cell.heightBand.heightMm,
      price: Number(cell.price),
    })),
  };
}

async function getCustomizationPricingUncached(): Promise<CustomizationPricingData[]> {
  const options = await prisma.customizationOption.findMany({
    select: {
      category: true,
      optionId: true,
      name: true,
      sortOrder: true,
      pricingEntries: {
        select: {
          price: true,
          widthBand: {
            select: {
              widthMm: true,
            },
          },
        },
        orderBy: { widthBand: { sortOrder: 'asc' } },
      },
    },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  return options.map((option: any) => ({
    category: option.category,
    optionId: option.optionId,
    name: option.name,
    prices: option.pricingEntries.map((entry: any) => ({
      widthMm: entry.widthBand?.widthMm || null,
      price: Number(entry.price),
    })),
  }));
}

async function getMinimumPricesBatch(priceBandIds: string[]): Promise<Map<string, number>> {
  if (priceBandIds.length === 0) return new Map();

  const validIds = priceBandIds.filter(Boolean);
  if (validIds.length === 0) return new Map();

  const priceCells = await prisma.priceCell.findMany({
    where: { priceBandId: { in: validIds } },
    select: {
      priceBandId: true,
      price: true,
      widthBand: {
        select: {
          widthMm: true,
        },
      },
      heightBand: {
        select: {
          heightMm: true,
        },
      },
    },
  });

  const cellsByBand = new Map<string, typeof priceCells>();
  priceCells.forEach((cell) => {
    if (!cellsByBand.has(cell.priceBandId)) {
      cellsByBand.set(cell.priceBandId, []);
    }
    cellsByBand.get(cell.priceBandId)!.push(cell);
  });

  const result = new Map<string, number>();
  cellsByBand.forEach((cells, priceBandId) => {
    if (cells.length === 0) return;

    const sortedCells = [...cells].sort((a, b) => {
      const areaA = a.widthBand.widthMm * a.heightBand.heightMm;
      const areaB = b.widthBand.widthMm * b.heightBand.heightMm;
      if (areaA !== areaB) return areaA - areaB;
      if (a.widthBand.widthMm !== b.widthBand.widthMm) return a.widthBand.widthMm - b.widthBand.widthMm;
      return a.heightBand.heightMm - b.heightBand.heightMm;
    });

    result.set(priceBandId, Number(sortedCells[0].price));
  });

  return result;
}

async function getMinimumPricesByHandleUncached(): Promise<Record<string, number>> {
  const allProducts = await getAllCachedProducts();
  const result: Record<string, number> = {};

  const bandNames = new Set<string>();
  for (const handle of Object.keys(allProducts)) {
    const product = allProducts[handle];
    const priceBandName =
      product.priceBandName ??
      inferVerticalPriceBandNameFromTags(product.tags);
    if (priceBandName) {
      bandNames.add(priceBandName);
    }
  }

  const priceBands = await prisma.priceBand.findMany({
    where: { name: { in: Array.from(bandNames) } },
    select: {
      id: true,
      name: true,
    },
  });
  const bandNameToId = new Map(priceBands.map((band) => [band.name, band.id]));

  const minPrices = await getMinimumPricesBatch(priceBands.map((band) => band.id));

  for (const handle of Object.keys(allProducts)) {
    const product = allProducts[handle];
    const priceBandName =
      product.priceBandName ??
      inferVerticalPriceBandNameFromTags(product.tags);
    if (!priceBandName) continue;
    const bandId = bandNameToId.get(priceBandName);
    if (bandId) {
      const price = minPrices.get(bandId);
      if (price !== undefined) {
        result[handle] = getMinimumPriceWithMotorizedUplift(
          price,
          product.tags
        );
      }
    }
  }

  return result;
}

const getCachedPriceBandMatrix = unstable_cache(
  async (priceBandId: string) => getPriceBandMatrixUncached(priceBandId),
  ['pricing-price-band-matrix'],
  { revalidate: PRICING_CACHE_REVALIDATE_SECONDS }
);

const getCachedCustomizationPricing = unstable_cache(
  async () => getCustomizationPricingUncached(),
  ['pricing-customization-pricing'],
  { revalidate: PRICING_CACHE_REVALIDATE_SECONDS }
);

const getCachedWidthBands = unstable_cache(
  async () =>
    prisma.widthBand.findMany({
      select: {
        id: true,
        widthMm: true,
        widthInches: true,
      },
      orderBy: { sortOrder: 'asc' },
    }),
  ['pricing-width-bands'],
  { revalidate: PRICING_CACHE_REVALIDATE_SECONDS }
);

const getCachedHeightBands = unstable_cache(
  async () =>
    prisma.heightBand.findMany({
      select: {
        id: true,
        heightMm: true,
        heightInches: true,
      },
      orderBy: { sortOrder: 'asc' },
    }),
  ['pricing-height-bands'],
  { revalidate: PRICING_CACHE_REVALIDATE_SECONDS }
);

const getCachedMinimumPricesByHandle = unstable_cache(
  async () => getMinimumPricesByHandleUncached(),
  ['pricing-minimum-prices-by-handle'],
  { revalidate: PRICING_CACHE_REVALIDATE_SECONDS }
);

// ============================================
// Service Functions
// ============================================

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

    if (request.customizations && request.customizations.length > 0) {
      for (const customization of request.customizations) {
        const option = await findCustomizationOption(
          customization.category,
          customization.optionId
        );

        if (option && option.pricingEntries.length > 0) {
          const pricing = findMatchingPricingEntry(option.pricingEntries);

          if (pricing) {
            customizationPrices.push({
              category: option.category,
              optionId: option.optionId,
              name: option.name,
              price: Number(pricing.price),
            });
          }
        }
      }
    }

    const customizationTotal = customizationPrices.reduce((sum, c) => sum + c.price, 0);

    return {
      dimensionPrice,
      customizationPrices,
      totalPrice: dimensionPrice + customizationTotal,
      widthBand: { mm: 0, inches: 0 },
      heightBand: { mm: Math.round(request.heightInches * 25.4), inches: Math.ceil(request.heightInches) },
    };
  }

  const priceBand = await resolvePriceBand(request.handle);

  const widthBand = await findCeilingWidthBand(request.widthInches, priceBand.id);
  const heightBand = await findCeilingHeightBand(request.heightInches, priceBand.id);

  if (!widthBand || !heightBand) {
    throw new Error('Selected measurements are outside the allowed range for this product');
  }

  const priceCell = await prisma.priceCell.findUnique({
    where: {
      priceBandId_widthBandId_heightBandId: {
        priceBandId: priceBand.id,
        widthBandId: widthBand.id,
        heightBandId: heightBand.id,
      },
    },
  });

  if (!priceCell) {
    throw new Error('Price not found for the given dimensions');
  }

  const dimensionPrice = Number(priceCell.price);

  const customizationPrices: PricingResponse['customizationPrices'] = [];

  if (request.customizations && request.customizations.length > 0) {
    for (const customization of request.customizations) {
      const option = await findCustomizationOption(
        customization.category,
        customization.optionId,
        widthBand.id
      );

      if (option && option.pricingEntries.length > 0) {
        const pricing = findMatchingPricingEntry(option.pricingEntries, widthBand.id);

        if (pricing) {
          customizationPrices.push({
            category: option.category,
            optionId: option.optionId,
            name: option.name,
            price: Number(pricing.price),
          });
        }
      }
    }
  }

  const customizationTotal = customizationPrices.reduce((sum, c) => sum + c.price, 0);
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
  return getCachedPriceBandMatrix(priceBandId);
}

export async function getCustomizationPricing(): Promise<CustomizationPricingData[]> {
  return getCachedCustomizationPricing();
}

export async function getWidthBands() {
  return getCachedWidthBands();
}

export async function getHeightBands() {
  return getCachedHeightBands();
}

export async function resolveHandleToPriceBand(handle: string) {
  const cachedProducts = await getAllCachedProducts();
  const cachedProduct = cachedProducts[handle];
  const priceBandName =
    cachedProduct?.priceBandName ??
    inferVerticalPriceBandNameFromTags(cachedProduct?.tags ?? []);

  if (!priceBandName) return null;

  return prisma.priceBand.findUnique({
    where: { name: priceBandName },
    select: {
      id: true,
      name: true,
    },
  });
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
  return getCachedMinimumPricesByHandle();
}
