import { Product, ProductConfiguration } from '@/types';

type VisibleCustomizationOptions = {
  showHeadrail?: boolean;
  showHeadrailColour?: boolean;
  showInstallationMethod?: boolean;
  showControlOption?: boolean;
  showLiningType?: boolean;
  showStacking?: boolean;
  showControlSide?: boolean;
  showBottomChain?: boolean;
  showBracketType?: boolean;
  showChainColor?: boolean;
  showMotorization?: boolean;
  showBlindColor?: boolean;
  showFrameColor?: boolean;
  showOpeningDirection?: boolean;
  showBottomBar?: boolean;
  showRollStyle?: boolean;
};

type OptionalCardSelection = {
  continuousChain?: boolean;
  cassette?: boolean;
  motorization?: boolean;
  bottomBar?: boolean;
};

type CustomizationLabelOverrides = {
  installationMethod?: string;
  controlOption?: string;
  controlSide?: string;
  bracketType?: string;
  frameColor?: string;
};

export interface MissingCustomization {
  key: string;
  label: string;
}

export function getMissingRequiredCustomizations({
  product,
  config,
  visibleOptions,
  isSkylight,
  isRoman,
  isDayNight = false,
  isSpecialMotorized,
  selectedOptionalCards,
  forceMotorization = false,
  requireVisibleControlSide = true,
  labels = {},
}: {
  product: Product;
  config: ProductConfiguration;
  visibleOptions: VisibleCustomizationOptions;
  isSkylight: boolean;
  isRoman: boolean;
  /** Day & Night blinds swap the chain-colour picker for a chrome upgrade toggle, and add a standalone fabric-insert requirement */
  isDayNight?: boolean;
  isSpecialMotorized: boolean;
  selectedOptionalCards?: OptionalCardSelection;
  forceMotorization?: boolean;
  requireVisibleControlSide?: boolean;
  labels?: CustomizationLabelOverrides;
}): MissingCustomization[] {
  const missing: MissingCustomization[] = [];
  const hasValue = (value: string | number | null | undefined) =>
    typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
  const addMissing = (
    shouldRequire: boolean | undefined,
    value: string | number | null | undefined,
    key: string,
    label: string
  ) => {
    if (shouldRequire && !hasValue(value) && !missing.some((item) => item.key === key)) {
      missing.push({ key, label });
    }
  };

  // Colour is required whenever the Shopify product exposes colour variants —
  // the chosen colour is what the draft order books at checkout.
  addMissing((product.colourVariants?.length ?? 0) > 0, config.colour, 'colour', 'Colour');
  addMissing(isSkylight, config.brand, 'brand', 'Brand');
  addMissing(isSkylight, config.blindType, 'blindType', 'Blind type');
  addMissing(product.features.hasHeadrail && visibleOptions.showHeadrail, config.headrail, 'headrail', 'Headrail');
  addMissing(
    product.features.hasHeadrailColour && visibleOptions.showHeadrailColour,
    config.headrailColour,
    'headrailColour',
    'Headrail colour'
  );
  addMissing(
    product.features.hasInstallationMethod && visibleOptions.showInstallationMethod,
    config.installationMethod,
    'installationMethod',
    labels.installationMethod ?? 'Installation method'
  );
  addMissing(
    product.features.hasControlOption && visibleOptions.showControlOption,
    config.controlOption,
    'controlOption',
    labels.controlOption ?? 'Control option'
  );
  addMissing(visibleOptions.showLiningType, config.liningType, 'liningType', 'Lining type');
  addMissing(product.features.hasStacking && visibleOptions.showStacking, config.stacking, 'stacking', 'Stacking');
  addMissing(
    product.features.hasControlSide && visibleOptions.showControlSide && requireVisibleControlSide,
    config.controlSide,
    'controlSide',
    labels.controlSide ?? 'Control side'
  );
  addMissing(
    product.features.hasBottomChain && visibleOptions.showBottomChain,
    config.bottomChain,
    'bottomChain',
    'Bottom chain'
  );
  addMissing(
    product.features.hasBracketType && visibleOptions.showBracketType,
    config.bracketType,
    'bracketType',
    labels.bracketType ?? 'Bracket type'
  );
  addMissing(product.features.hasBlindColor && visibleOptions.showBlindColor, config.blindColor, 'blindColor', 'Blind color');
  addMissing(
    product.features.hasFrameColor && visibleOptions.showFrameColor,
    config.frameColor,
    'frameColor',
    labels.frameColor ?? 'Frame color'
  );
  addMissing(
    product.features.hasOpeningDirection && visibleOptions.showOpeningDirection,
    config.openingDirection,
    'openingDirection',
    'Opening direction'
  );
  addMissing(product.features.hasRollStyle && visibleOptions.showRollStyle, config.rollStyle, 'rollStyle', 'Roll style');

  if (selectedOptionalCards) {
    const chainOrMotorizationRequired =
      product.features.hasChainColor &&
      visibleOptions.showChainColor &&
      product.features.hasMotorization &&
      !forceMotorization &&
      !isSpecialMotorized;
    if (
      chainOrMotorizationRequired &&
      !selectedOptionalCards.continuousChain &&
      !selectedOptionalCards.motorization
    ) {
      missing.push({ key: 'chainOrMotorization', label: 'Continuous chain or motorization' });
    }

    const continuousChainRequired =
      Boolean(selectedOptionalCards.continuousChain) ||
      Boolean(isRoman && product.features.hasChainColor && visibleOptions.showChainColor);
    addMissing(
      continuousChainRequired,
      isRoman ? config.controlOption : config.controlSide,
      'continuousChainLocation',
      'Chain location'
    );
    if (isDayNight) {
      addMissing(continuousChainRequired, config.chromeUpgrade, 'chromeUpgrade', 'Chrome upgrade');
    } else {
      addMissing(continuousChainRequired, config.chainColor, 'chainColor', 'Chain color');
    }
    addMissing(
      Boolean(product.features.hasWrappedCassette),
      config.wrappedCassette,
      'wrappedCassette',
      'Cassette color'
    );
    addMissing(
      Boolean(product.features.hasCassetteMatchingBar) ||
        Boolean(selectedOptionalCards.cassette && product.features.hasRollerCassette),
      config.cassetteMatchingBar,
      'cassetteMatchingBar',
      'Cassette and bottom bar'
    );
    addMissing(
      Boolean(isDayNight && product.features.hasCassetteMatchingBar),
      config.sameFabricInsert,
      'sameFabricInsert',
      'Same fabric insert'
    );
    addMissing(
      Boolean(selectedOptionalCards.cassette && product.features.hasRollerCassette),
      config.matchingFabricCassette,
      'matchingFabricCassette',
      'Matching fabric on cover cassette'
    );
    addMissing(
      Boolean(selectedOptionalCards.bottomBar && product.features.hasBottomBar && visibleOptions.showBottomBar),
      config.bottomBar,
      'bottomBar',
      'Bottom bar'
    );
    addMissing(
      Boolean(selectedOptionalCards.motorization || forceMotorization || isSpecialMotorized),
      config.motorization,
      'motorization',
      isSpecialMotorized ? 'Remote control' : 'Motorization'
    );

    return missing;
  }

  if (isDayNight) {
    addMissing(
      product.features.hasChainColor && visibleOptions.showChainColor && !isSpecialMotorized,
      config.chromeUpgrade,
      'chromeUpgrade',
      'Chrome upgrade'
    );
  } else {
    addMissing(
      product.features.hasChainColor && visibleOptions.showChainColor && !isSpecialMotorized,
      config.chainColor,
      'chainColor',
      'Chain color'
    );
  }
  addMissing(product.features.hasWrappedCassette, config.wrappedCassette, 'wrappedCassette', 'Cassette color');
  addMissing(
    product.features.hasCassetteMatchingBar || product.features.hasRollerCassette,
    config.cassetteMatchingBar,
    'cassetteMatchingBar',
    'Cassette and bottom bar'
  );
  addMissing(
    isDayNight && product.features.hasCassetteMatchingBar,
    config.sameFabricInsert,
    'sameFabricInsert',
    'Same fabric insert'
  );
  addMissing(
    product.features.hasRollerCassette,
    config.matchingFabricCassette,
    'matchingFabricCassette',
    'Matching fabric on cover cassette'
  );
  addMissing(
    product.features.hasBottomBar && visibleOptions.showBottomBar,
    config.bottomBar,
    'bottomBar',
    'Bottom bar'
  );
  addMissing(
    product.features.hasMotorization || isSpecialMotorized,
    config.motorization,
    'motorization',
    isSpecialMotorized ? 'Remote control' : 'Motorization'
  );

  return missing;
}

export function formatMissingCustomizationsMessage(missingCustomizations: MissingCustomization[]): string {
  if (missingCustomizations.length === 0) {
    return '';
  }

  return `Please complete the required customizations before adding to cart: ${missingCustomizations
    .map((item) => item.label)
    .join(', ')}.`;
}
