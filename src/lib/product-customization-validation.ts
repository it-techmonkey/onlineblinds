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

export function getMissingRequiredCustomizations({
  product,
  config,
  visibleOptions,
  isSkylight,
  isRoman,
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
  isSpecialMotorized: boolean;
  selectedOptionalCards?: OptionalCardSelection;
  forceMotorization?: boolean;
  requireVisibleControlSide?: boolean;
  labels?: CustomizationLabelOverrides;
}): string[] {
  const missing: string[] = [];
  const hasValue = (value: string | number | null | undefined) =>
    typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
  const addMissing = (shouldRequire: boolean | undefined, value: string | number | null | undefined, label: string) => {
    if (shouldRequire && !hasValue(value) && !missing.includes(label)) {
      missing.push(label);
    }
  };

  addMissing(isSkylight, config.brand, 'Brand');
  addMissing(isSkylight, config.blindType, 'Blind type');
  addMissing(product.features.hasHeadrail && visibleOptions.showHeadrail, config.headrail, 'Headrail');
  addMissing(
    product.features.hasHeadrailColour && visibleOptions.showHeadrailColour,
    config.headrailColour,
    'Headrail colour'
  );
  addMissing(
    product.features.hasInstallationMethod && visibleOptions.showInstallationMethod,
    config.installationMethod,
    labels.installationMethod ?? 'Installation method'
  );
  addMissing(
    product.features.hasControlOption && visibleOptions.showControlOption,
    config.controlOption,
    labels.controlOption ?? 'Control option'
  );
  addMissing(visibleOptions.showLiningType, config.liningType, 'Lining type');
  addMissing(product.features.hasStacking && visibleOptions.showStacking, config.stacking, 'Stacking');
  addMissing(
    product.features.hasControlSide && visibleOptions.showControlSide && requireVisibleControlSide,
    config.controlSide,
    labels.controlSide ?? 'Control side'
  );
  addMissing(
    product.features.hasBottomChain && visibleOptions.showBottomChain,
    config.bottomChain,
    'Bottom chain'
  );
  addMissing(
    product.features.hasBracketType && visibleOptions.showBracketType,
    config.bracketType,
    labels.bracketType ?? 'Bracket type'
  );
  addMissing(product.features.hasBlindColor && visibleOptions.showBlindColor, config.blindColor, 'Blind color');
  addMissing(
    product.features.hasFrameColor && visibleOptions.showFrameColor,
    config.frameColor,
    labels.frameColor ?? 'Frame color'
  );
  addMissing(
    product.features.hasOpeningDirection && visibleOptions.showOpeningDirection,
    config.openingDirection,
    'Opening direction'
  );
  addMissing(product.features.hasRollStyle && visibleOptions.showRollStyle, config.rollStyle, 'Roll style');

  if (selectedOptionalCards) {
    addMissing(
      Boolean(selectedOptionalCards.continuousChain),
      isRoman ? config.controlOption : config.controlSide,
      'Chain location'
    );
    addMissing(
      Boolean(selectedOptionalCards.continuousChain),
      config.chainColor,
      'Chain color'
    );
    addMissing(
      Boolean(selectedOptionalCards.cassette && product.features.hasWrappedCassette),
      config.wrappedCassette,
      'Cassette color'
    );
    addMissing(
      Boolean(selectedOptionalCards.cassette && (product.features.hasCassetteMatchingBar || product.features.hasRollerCassette)),
      config.cassetteMatchingBar,
      'Cassette and bottom bar'
    );
    addMissing(
      Boolean(selectedOptionalCards.bottomBar && product.features.hasBottomBar && visibleOptions.showBottomBar),
      config.bottomBar,
      'Bottom bar'
    );
    addMissing(
      Boolean(selectedOptionalCards.motorization || forceMotorization || isSpecialMotorized),
      config.motorization,
      isSpecialMotorized ? 'Remote control' : 'Motorization'
    );

    return missing;
  }

  addMissing(
    product.features.hasChainColor && visibleOptions.showChainColor && !isSpecialMotorized,
    config.chainColor,
    'Chain color'
  );
  addMissing(product.features.hasWrappedCassette, config.wrappedCassette, 'Cassette color');
  addMissing(
    product.features.hasCassetteMatchingBar || product.features.hasRollerCassette,
    config.cassetteMatchingBar,
    'Cassette and bottom bar'
  );
  addMissing(
    product.features.hasBottomBar && visibleOptions.showBottomBar,
    config.bottomBar,
    'Bottom bar'
  );
  addMissing(
    product.features.hasMotorization || isSpecialMotorized,
    config.motorization,
    isSpecialMotorized ? 'Remote control' : 'Motorization'
  );

  return missing;
}

export function formatMissingCustomizationsMessage(missingCustomizations: string[]): string {
  if (missingCustomizations.length === 0) {
    return '';
  }

  return `Please complete the required customizations before adding to cart: ${missingCustomizations.join(', ')}.`;
}
