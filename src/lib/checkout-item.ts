import { CartItem, CheckoutItemRequest, ProductConfiguration } from '@/types';
import { getTotalInches } from '@/lib/pricing';
import {
  isReplacementVerticalSlatProduct,
  REPLACEMENT_VERTICAL_SLAT_FIXED_WIDTH_INCHES,
} from '@/lib/vertical-blinds';
import { getSkylightPricingDimensions, isSkylightProduct } from '@/lib/skylight';

/**
 * Reduce a ProductConfiguration to the customization fields the checkout API
 * accepts, dropping sizing fields and empty values.
 *
 * This lives in one place on purpose. The mapping used to be duplicated in the
 * product page and the cart page, and a field added to only one of them was
 * silently dropped from checkout — which then made the server fall back to the
 * product's first variant and book the wrong colour.
 */
export function buildBackendConfiguration(
  config: ProductConfiguration
): Record<string, string | undefined> {
  const keys: Array<keyof ProductConfiguration> = [
    'roomType',
    'blindName',
    'colour',
    'headrail',
    'headrailColour',
    'installationMethod',
    'controlOption',
    'liningType',
    'stacking',
    'controlSide',
    'bottomChain',
    'bracketType',
    'chainColor',
    'chromeUpgrade',
    'wrappedCassette',
    'cassetteMatchingBar',
    'sameFabricInsert',
    'matchingFabricCassette',
    'motorization',
    'brand',
    'blindType',
    'blindColor',
    'frameColor',
    'handlePosition',
    'numberOfPanels',
    'openingDirection',
    'bottomBar',
    'rollStyle',
  ];

  const backendConfig: Record<string, string | undefined> = {};
  for (const key of keys) {
    const value = config[key];
    backendConfig[key] = typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  return backendConfig;
}

/**
 * Build the checkout-API request for one cart item. Used both to submit
 * checkout and to re-validate cart prices beforehand — sharing this in one
 * place keeps the two calls asking the same question about the same item,
 * so a stale-price check can never disagree with what checkout itself sends.
 */
export function buildCheckoutItemRequest(item: CartItem): CheckoutItemRequest {
  const config = item.configuration;
  const isReplacementVerticalSlat = isReplacementVerticalSlatProduct(item.product.tags);
  const skylightProduct = isSkylightProduct({
    category: item.product.category,
    tags: item.product.tags,
    name: item.product.name,
    slug: item.product.slug,
  });

  const widthInches = skylightProduct
    ? getSkylightPricingDimensions().widthInches
    : isReplacementVerticalSlat
      ? REPLACEMENT_VERTICAL_SLAT_FIXED_WIDTH_INCHES
      : getTotalInches(config.width, config.widthFraction, config.widthUnit);
  const heightInches = skylightProduct
    ? getSkylightPricingDimensions().heightInches
    : getTotalInches(config.height, config.heightFraction, config.heightUnit);

  return {
    handle: item.product.slug,
    widthInches,
    heightInches,
    quantity: item.quantity,
    submittedPrice: item.product.price,
    configuration: buildBackendConfiguration(config),
  };
}
