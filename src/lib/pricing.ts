import { PriceBandMatrix, CustomizationPricing, WidthBand, HeightBand } from '@/types';
import {
  calculateReplacementVerticalSlatPrice,
  isHeightOnlyVerticalProduct,
} from './vertical-blinds';
import { getMotorizationBasePrice } from './electrical-roller';

// ============================================
// Types
// ============================================

export interface PriceCalculationResult {
  dimensionPrice: number;
  widthBand: WidthBand;
  heightBand: HeightBand;
}

export interface CustomizationPriceResult {
  category: string;
  optionId: string;
  name: string;
  price: number;
}

// ============================================
// Ceiling-based Band Lookup
// ============================================

/**
 * Find the ceiling width band for a given width in inches
 * Returns the smallest band that can accommodate the width
 */
export function findCeilingWidthBand(widthInches: number, widthBands: WidthBand[]): WidthBand | null {
  // Sort bands by inches ascending
  const sortedBands = [...widthBands].sort((a, b) => a.inches - b.inches);
  if (sortedBands.length === 0) {
    return null;
  }

  const minBand = sortedBands[0];
  const maxBand = sortedBands[sortedBands.length - 1];
  if (widthInches < minBand.inches || widthInches > maxBand.inches) {
    return null;
  }

  // Find the smallest band >= requested width
  const ceilingBand = sortedBands.find(band => band.inches >= Math.ceil(widthInches));

  return ceilingBand || null;
}

/**
 * Find the ceiling height band for a given height in inches
 * Returns the smallest band that can accommodate the height
 */
export function findCeilingHeightBand(heightInches: number, heightBands: HeightBand[]): HeightBand | null {
  // Sort bands by inches ascending
  const sortedBands = [...heightBands].sort((a, b) => a.inches - b.inches);
  if (sortedBands.length === 0) {
    return null;
  }

  const minBand = sortedBands[0];
  const maxBand = sortedBands[sortedBands.length - 1];
  if (heightInches < minBand.inches || heightInches > maxBand.inches) {
    return null;
  }

  // Find the smallest band >= requested height
  const ceilingBand = sortedBands.find(band => band.inches >= Math.ceil(heightInches));

  return ceilingBand || null;
}

// ============================================
// Price Calculation
// ============================================

/**
 * Calculate dimension price from the price matrix
 * Uses ceiling-based lookup for both width and height
 */
export function calculateDimensionPrice(
  widthInches: number,
  heightInches: number,
  priceMatrix: PriceBandMatrix
): PriceCalculationResult | null {
  const widthBand = findCeilingWidthBand(widthInches, priceMatrix.widthBands);
  const heightBand = findCeilingHeightBand(heightInches, priceMatrix.heightBands);

  if (!widthBand || !heightBand) {
    return null;
  }

  // Find the price cell for this combination
  const priceCell = priceMatrix.prices.find(
    p => p.widthMm === widthBand.mm && p.heightMm === heightBand.mm
  );

  if (!priceCell) {
    return null;
  }

  return {
    dimensionPrice: priceCell.price,
    widthBand,
    heightBand,
  };
}

/**
 * Get the price for a customization option
 * Some options have width-dependent pricing, others have fixed pricing
 */
export function getCustomizationPrice(
  category: string,
  optionId: string,
  widthBand: WidthBand | null,
  customizationPricing: CustomizationPricing[]
): CustomizationPriceResult | null {
  const option = customizationPricing.find(
    c => c.category === category && c.optionId === optionId
  );

  if (!option) {
    return null;
  }

  // Check for width-specific pricing first
  if (widthBand) {
    const widthSpecificPrice = option.prices.find(p => p.widthMm === widthBand.mm);
    if (widthSpecificPrice) {
      return {
        category: option.category,
        optionId: option.optionId,
        name: option.name,
        price: widthSpecificPrice.price,
      };
    }
  }

  // Fall back to fixed pricing (widthMm === null)
  const fixedPrice = option.prices.find(p => p.widthMm === null);
  if (fixedPrice) {
    return {
      category: option.category,
      optionId: option.optionId,
      name: option.name,
      price: fixedPrice.price,
    };
  }

  return null;
}

/**
 * Calculate total price for a product configuration
 */
export function calculateTotalPrice(
  widthInches: number,
  heightInches: number,
  priceMatrix: PriceBandMatrix,
  selectedCustomizations: { category: string; optionId: string }[],
  customizationPricing: CustomizationPricing[],
  productTags: string[] = []
): {
  dimensionPrice: number;
  customizationPrices: CustomizationPriceResult[];
  totalPrice: number;
  widthBand: WidthBand | null;
  heightBand: HeightBand | null;
} | null {
  if (isHeightOnlyVerticalProduct(productTags)) {
    const dimensionPrice = calculateReplacementVerticalSlatPrice(heightInches, productTags);

    if (dimensionPrice == null) {
      return null;
    }

    const customizationPrices: CustomizationPriceResult[] = [];

    for (const customization of selectedCustomizations) {
      const priceResult = getCustomizationPrice(
        customization.category,
        customization.optionId,
        null,
        customizationPricing
      );

      if (priceResult && priceResult.price > 0) {
        customizationPrices.push(priceResult);
      }
    }

    const customizationTotal = customizationPrices.reduce((sum, c) => sum + c.price, 0);

    return {
      dimensionPrice,
      customizationPrices,
      totalPrice: dimensionPrice + customizationTotal,
      widthBand: null,
      heightBand: null,
    };
  }

  // Calculate dimension price
  const dimensionResult = calculateDimensionPrice(widthInches, heightInches, priceMatrix);

  if (!dimensionResult) {
    return null;
  }

  // Calculate customization prices
  const customizationPrices: CustomizationPriceResult[] = [];

  for (const customization of selectedCustomizations) {
    const priceResult = getCustomizationPrice(
      customization.category,
      customization.optionId,
      dimensionResult.widthBand,
      customizationPricing
    );

    if (priceResult && priceResult.price > 0) {
      customizationPrices.push(priceResult);
    }
  }

  // Calculate total
  const customizationTotal = customizationPrices.reduce((sum, c) => sum + c.price, 0);

  // Add motorization base price if applicable
  const motorizationBasePrice = getMotorizationBasePrice(selectedCustomizations);

  const totalPrice = dimensionResult.dimensionPrice + customizationTotal + motorizationBasePrice;

  return {
    dimensionPrice: dimensionResult.dimensionPrice,
    customizationPrices,
    totalPrice,
    widthBand: dimensionResult.widthBand,
    heightBand: dimensionResult.heightBand,
  };
}

/**
 * Convert configuration options to customization category/optionId pairs
 * Maps frontend option IDs to backend category names
 */
export function configToCustomizations(config: {
  headrail?: string | null;
  headrailColour?: string | null;
  installationMethod?: string | null;
  controlOption?: string | null;
  liningType?: string | null;
  stacking?: string | null;
  controlSide?: string | null;
  bottomChain?: string | null;
  bracketType?: string | null;
  chainColor?: string | null;
  chainColorCategory?: string;
  chromeUpgrade?: string | null;
  frameColorCategory?: string;
  wrappedCassette?: string | null;
  cassetteMatchingBar?: string | null;
  sameFabricInsert?: string | null;
  matchingFabricCassette?: string | null;
  isRollerCassette?: boolean;
  motorization?: string | null;
  brand?: string | null;
  blindType?: string | null;
  blindColor?: string | null;
  frameColor?: string | null;
  numberOfPanels?: string | null;
  openingDirection?: string | null;
  bottomBar?: string | null;
  rollStyle?: string | null;
}): { category: string; optionId: string }[] {
  const customizations: { category: string; optionId: string }[] = [];

  if (config.headrail) {
    customizations.push({ category: 'headrail', optionId: config.headrail });
  }
  if (config.headrailColour) {
    customizations.push({ category: 'headrail-colour', optionId: config.headrailColour });
  }
  if (config.installationMethod) {
    customizations.push({ category: 'installation-method', optionId: config.installationMethod });
  }
  if (config.controlOption) {
    customizations.push({ category: 'control-option', optionId: config.controlOption });
  }
  if (config.liningType) {
    customizations.push({ category: 'lining-type', optionId: config.liningType });
  }
  if (config.stacking) {
    customizations.push({ category: 'stacking', optionId: config.stacking });
  }
  if (config.controlSide) {
    customizations.push({ category: 'control-side', optionId: config.controlSide });
  }
  if (config.bottomChain) {
    customizations.push({ category: 'bottom-chain', optionId: config.bottomChain });
  }
  if (config.bracketType) {
    customizations.push({ category: 'bracket-type', optionId: config.bracketType });
  }
  if (config.chainColor) {
    customizations.push({ category: config.chainColorCategory ?? 'chain-color', optionId: config.chainColor });
  }
  if (config.chromeUpgrade) {
    customizations.push({ category: 'chrome-upgrade', optionId: config.chromeUpgrade });
  }
  if (config.wrappedCassette) {
    customizations.push({ category: 'wrapped-cassette', optionId: config.wrappedCassette });
  }
  if (config.cassetteMatchingBar) {
    const cassetteCategory = config.isRollerCassette ? 'roller-cassette' : 'cassette-bar';
    customizations.push({ category: cassetteCategory, optionId: config.cassetteMatchingBar });
  }
  if (config.sameFabricInsert) {
    customizations.push({ category: 'fabric-insert-cassette', optionId: config.sameFabricInsert });
  }
  if (config.matchingFabricCassette) {
    customizations.push({ category: 'matching-fabric-cassette', optionId: config.matchingFabricCassette });
  }
  if (config.motorization && config.motorization !== 'none') {
    customizations.push({ category: 'motorization', optionId: config.motorization });
  }
  if (config.brand) {
    customizations.push({ category: 'skylight-brand', optionId: config.brand });
  }
  if (config.blindType) {
    customizations.push({ category: 'skylight-blind-type', optionId: config.blindType });
  }
  if (config.blindColor) {
    customizations.push({ category: 'blind-color', optionId: config.blindColor });
  }
  if (config.frameColor) {
    customizations.push({ category: config.frameColorCategory ?? 'frame-color', optionId: config.frameColor });
  }
  if (config.numberOfPanels) {
    customizations.push({ category: 'number-of-panels', optionId: config.numberOfPanels });
  }
  if (config.openingDirection) {
    customizations.push({ category: 'opening-direction', optionId: config.openingDirection });
  }
  if (config.bottomBar) {
    customizations.push({ category: 'bottom-bar', optionId: config.bottomBar });
  }
  if (config.rollStyle) {
    customizations.push({ category: 'roll-style', optionId: config.rollStyle });
  }

  return customizations;
}

/**
 * Parse fraction string to decimal (e.g., "1/4" => 0.25)
 */
export function parseFraction(fraction: string): number {
  if (!fraction || fraction === '0') return 0;
  const parts = fraction.split('/');
  if (parts.length !== 2) return 0;
  const [num, denom] = parts.map(parseFloat);
  if (isNaN(num) || isNaN(denom) || denom === 0) return 0;
  return num / denom;
}

/**
 * Get total inches including fraction, converting from other units if necessary
 */
export function getTotalInches(whole: number, fraction: string, unit: 'inches' | 'cm' | 'mm' = 'inches'): number {
  if (unit === 'cm') {
    // For CM, 'whole' is cm, 'fraction' is mm (as a whole number 0-9)
    const mm = parseFloat(fraction) || 0;
    const totalCm = whole + (mm / 10);
    return totalCm / 2.54;
  }
  if (unit === 'mm') {
    return whole / 25.4;
  }
  return whole + parseFraction(fraction);
}

/**
 * Format a customer-entered width/height for display in its selected unit.
 * In cm mode `fraction` is the sub-unit millimeters (0-9), shown as a decimal.
 */
export function formatMeasurement(whole: number, fraction: string, unit: 'cm' | 'mm'): string {
  if (unit === 'mm') {
    return `${whole} mm`;
  }
  const mm = parseInt(fraction, 10) || 0;
  return mm > 0 ? `${whole}.${mm} cm` : `${whole} cm`;
}

/**
 * Format a price band's matched size (stored in mm) for display in the customer's
 * selected unit.
 */
export function formatBandSizeMm(mm: number, unit: 'cm' | 'mm'): string {
  return unit === 'mm' ? `${Math.round(mm)} mm` : `${(mm / 10).toFixed(1)} cm`;
}

// ============================================
// Installation Service
// ============================================

export type InstallationServiceTier = '1-blind' | '2-5-blinds' | '6-plus-blinds';

export interface InstallationServiceTierInfo {
  tier: InstallationServiceTier;
  price: number;
  variantTitle: string;
}

// Must stay in sync with the variants created by scripts/create-installation-service-product.mjs
const INSTALLATION_SERVICE_TIERS: InstallationServiceTierInfo[] = [
  { tier: '1-blind', price: 40, variantTitle: '1 Blind' },
  { tier: '2-5-blinds', price: 60, variantTitle: '2-5 Blinds' },
  { tier: '6-plus-blinds', price: 85, variantTitle: '6+ Blinds' },
];

/**
 * Installation service pricing tier for a given number of blinds in the order.
 */
export function getInstallationServiceTier(blindQuantity: number): InstallationServiceTierInfo {
  if (blindQuantity <= 1) return INSTALLATION_SERVICE_TIERS[0];
  if (blindQuantity <= 5) return INSTALLATION_SERVICE_TIERS[1];
  return INSTALLATION_SERVICE_TIERS[2];
}

export function getInstallationServicePrice(blindQuantity: number): number {
  return getInstallationServiceTier(blindQuantity).price;
}

/**
 * Display-friendly breakdown of installation service pricing tiers, for showing
 * customers the full price ladder (not just the price for their current quantity).
 */
export const INSTALLATION_SERVICE_PRICING_TIERS: {
  label: string;
  price: number;
  matches: (blindQuantity: number) => boolean;
}[] = [
  { label: '1 blind', price: INSTALLATION_SERVICE_TIERS[0].price, matches: (qty) => qty <= 1 },
  { label: '2-5 blinds', price: INSTALLATION_SERVICE_TIERS[1].price, matches: (qty) => qty >= 2 && qty <= 5 },
  { label: '6+ blinds', price: INSTALLATION_SERVICE_TIERS[2].price, matches: (qty) => qty >= 6 },
];
