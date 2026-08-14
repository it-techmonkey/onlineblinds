import { ProductConfiguration } from '@/types';

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
