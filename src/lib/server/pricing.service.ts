/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './database';
import { getPriceBandNameByHandle, getAllCachedProducts } from './product-cache';

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

// ============================================
// Helper Functions
// ============================================

async function findCeilingWidthBand(widthInches: number, priceBandId: string) {
  const widthBand = await prisma.widthBand.findFirst({
    where: {
      widthInches: { gte: Math.ceil(widthInches) },
      priceCells: { some: { priceBandId } },
    },
    orderBy: { widthInches: 'asc' },
  });

  if (!widthBand) {
    return prisma.widthBand.findFirst({
      where: { priceCells: { some: { priceBandId } } },
      orderBy: { widthInches: 'desc' },
    });
  }

  return widthBand;
}

async function findCeilingHeightBand(heightInches: number, priceBandId: string) {
  const heightBand = await prisma.heightBand.findFirst({
    where: {
      heightInches: { gte: Math.ceil(heightInches) },
      priceCells: { some: { priceBandId } },
    },
    orderBy: { heightInches: 'asc' },
  });

  if (!heightBand) {
    return prisma.heightBand.findFirst({
      where: { priceCells: { some: { priceBandId } } },
      orderBy: { heightInches: 'desc' },
    });
  }

  return heightBand;
}

async function resolvePriceBand(handle: string) {
  const priceBandName = await getPriceBandNameByHandle(handle);
  if (!priceBandName) {
    throw new Error(`Product "${handle}" not found or has no price band assigned`);
  }

  const priceBand = await prisma.priceBand.findUnique({
    where: { name: priceBandName },
  });

  if (!priceBand) {
    throw new Error(`Price band "${priceBandName}" not found in database`);
  }

  return priceBand;
}

// ============================================
// Service Functions
// ============================================

export async function calculateProductPrice(request: PricingRequest): Promise<PricingResponse> {
  const priceBand = await resolvePriceBand(request.handle);

  const widthBand = await findCeilingWidthBand(request.widthInches, priceBand.id);
  const heightBand = await findCeilingHeightBand(request.heightInches, priceBand.id);

  if (!widthBand || !heightBand) {
    throw new Error('Unable to find appropriate size bands');
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
      const option = await prisma.customizationOption.findUnique({
        where: {
          category_optionId: {
            category: customization.category,
            optionId: customization.optionId,
          },
        },
        include: {
          pricingEntries: {
            where: {
              OR: [
                { widthBandId: null },
                { widthBandId: widthBand.id },
              ],
            },
          },
        },
      }) ?? await prisma.customizationOption.findUnique({
        where: {
          category_optionId: {
            category: customization.category === 'cassette-bar' ? 'roller-cassette' : customization.category,
            optionId: customization.optionId,
          },
        },
        include: {
          pricingEntries: {
            where: {
              OR: [
                { widthBandId: null },
                { widthBandId: widthBand.id },
              ],
            },
          },
        },
      });

      if (option && option.pricingEntries.length > 0) {
        const pricing = option.pricingEntries.find((p: { widthBandId: string | null; price: unknown }) => p.widthBandId === widthBand.id) ||
          option.pricingEntries.find((p: { widthBandId: string | null; price: unknown }) => p.widthBandId === null);

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
  const hasMotorization = request.customizations?.some(c => c.category === 'motorization');
  const motorizationBasePrice = hasMotorization ? 95 : 0;
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
  const priceBand = await prisma.priceBand.findUnique({
    where: { id: priceBandId },
    include: {
      priceCells: {
        include: { widthBand: true, heightBand: true },
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

export async function getCustomizationPricing(): Promise<CustomizationPricingData[]> {
  const options = await prisma.customizationOption.findMany({
    include: {
      pricingEntries: {
        include: { widthBand: true },
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

export async function getWidthBands() {
  return prisma.widthBand.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function getHeightBands() {
  return prisma.heightBand.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function resolveHandleToPriceBand(handle: string) {
  const priceBandName = await getPriceBandNameByHandle(handle);
  if (!priceBandName) return null;

  return prisma.priceBand.findUnique({ where: { name: priceBandName } });
}

async function getMinimumPricesBatch(priceBandIds: string[]): Promise<Map<string, number>> {
  if (priceBandIds.length === 0) return new Map();

  const validIds = priceBandIds.filter(Boolean);
  if (validIds.length === 0) return new Map();

  const priceCells = await prisma.priceCell.findMany({
    where: { priceBandId: { in: validIds } },
    include: { widthBand: true, heightBand: true },
  });

  const cellsByBand = new Map<string, typeof priceCells>();
  priceCells.forEach((cell: any) => {
    if (!cellsByBand.has(cell.priceBandId)) {
      cellsByBand.set(cell.priceBandId, []);
    }
    cellsByBand.get(cell.priceBandId)!.push(cell);
  });

  const result = new Map<string, number>();
  cellsByBand.forEach((cells: any[], priceBandId) => {
    if (cells.length === 0) return;

    const sortedCells = cells.sort((a: any, b: any) => {
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
  const allProducts = await getAllCachedProducts();
  const result: Record<string, number> = {};

  const bandNames = new Set<string>();
  for (const handle of Object.keys(allProducts)) {
    const product = allProducts[handle];
    if (product.priceBandName) bandNames.add(product.priceBandName);
  }

  const priceBands = await prisma.priceBand.findMany({
    where: { name: { in: Array.from(bandNames) } },
  });
  const bandNameToId = new Map(priceBands.map(b => [b.name, b.id]));

  const minPrices = await getMinimumPricesBatch(priceBands.map(b => b.id));

  for (const handle of Object.keys(allProducts)) {
    const product = allProducts[handle];
    if (!product.priceBandName) continue;
    const bandId = bandNameToId.get(product.priceBandName);
    if (bandId) {
      const price = minPrices.get(bandId);
      if (price !== undefined) {
        result[handle] = price;
      }
    }
  }

  return result;
}
