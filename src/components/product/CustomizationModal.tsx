'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Product, ProductConfiguration, PriceBandMatrix, CustomizationPricing as CustomizationPricingType } from '@/types';
import { useCart } from '@/context/CartContext';
import ProductGallery from './ProductGallery';
import { formatPrice, formatPriceWithCurrency, fetchPriceMatrix, fetchCustomizationPricing, validateCartPrice } from '@/lib/api';
import {
  calculateTotalPrice,
  configToCustomizations,
  getTotalInches,
} from '@/lib/pricing';
import {
  getMinimumReplacementVerticalSlatPrice,
  isReplacementVerticalSlatProduct,
  REPLACEMENT_VERTICAL_SLAT_FIXED_WIDTH_INCHES,
} from '@/lib/vertical-blinds';
import {
  getElectricalRollerRemoteOptions,
  isElectricalRollerProduct,
} from '@/lib/electrical-roller';
import {
  SizeSelector,
  HeadrailSelector,
  HeadrailColourSelector,
  InstallationMethodSelector,
  ControlOptionSelector,
  StackingSelector,
  ControlSideSelector,
  BottomChainSelector,
  BracketTypeSelector,
  ChainColorSelector,
  WrappedCassetteSelector,
  SimpleDropdown,
  MotorizationSelector,
  BottomBarSelector,
} from './customization';
import {
  HEADRAIL_OPTIONS,
  HEADRAIL_COLOUR_OPTIONS,
  INSTALLATION_METHOD_OPTIONS,
  ROLLER_INSTALLATION_OPTIONS,
  ZEBRA_INSTALLATION_OPTIONS,
  CONTROL_OPTIONS,
  ROLLER_CONTROL_OPTIONS,
  VERTICAL_STACKING_OPTIONS,
  CONTROL_SIDE_OPTIONS,
  BOTTOM_CHAIN_OPTIONS,
  BRACKET_TYPE_OPTIONS,
  CHAIN_COLOR_OPTIONS,
  WRAPPED_CASSETTE_OPTIONS,
  CASSETTE_MATCHING_BAR_OPTIONS,
  ROLLER_CASSETTE_OPTIONS,
  MOTORIZATION_OPTIONS,
  BOTTOM_BAR_OPTIONS,
} from '@/data/customizations';

interface CustomizationModalProps {
  product: Product;
  config: ProductConfiguration;
  setConfig: React.Dispatch<React.SetStateAction<ProductConfiguration>>;
  onClose: () => void;
}

const CustomizationModal = ({
  product,
  config,
  setConfig,
  onClose,
}: CustomizationModalProps) => {
  const { addToCart } = useCart();
  const isElectricalRoller = useMemo(
    () => isElectricalRollerProduct(product.tags),
    [product.tags]
  );
  const electricalRollerMotorizationOptions = useMemo(
    () => getElectricalRollerRemoteOptions(MOTORIZATION_OPTIONS),
    []
  );

  // State for pricing data from backend
  const [priceMatrix, setPriceMatrix] = useState<PriceBandMatrix | null>(null);
  const [customizationPricing, setCustomizationPricing] = useState<CustomizationPricingType[]>([]);
  const [pricingLoaded, setPricingLoaded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const customizationFetchingRef = useRef(false);
  const matrixFetchingRef = useRef(false);

  // Fetch customization pricing on mount
  useEffect(() => {
    if (customizationFetchingRef.current) {
      return;
    }

    customizationFetchingRef.current = true;
    let isMounted = true;

    const loadCustomizationPricing = async () => {
      try {
        const customizations = await fetchCustomizationPricing();

        if (isMounted) {
          const bottomBarPricing = BOTTOM_BAR_OPTIONS.map(option => ({
            category: 'bottom-bar',
            optionId: option.id,
            name: option.name,
            prices: [{ widthMm: null, price: option.price || 0 }]
          }));

          setCustomizationPricing([...customizations, ...bottomBarPricing]);
          setPricingLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load customization pricing:', error);
        if (isMounted) {
          setPricingLoaded(true);
        }
      } finally {
        if (isMounted) {
          customizationFetchingRef.current = false;
        }
      }
    };

    loadCustomizationPricing();

    return () => {
      isMounted = false;
      customizationFetchingRef.current = false;
    };
  }, [product.slug]);

  // Determine which options to use based on product category
  const isRollerOrDayNight = useMemo(() => {
    const category = product.category.toLowerCase();
    return isElectricalRoller || category.includes('roller') || category.includes('day') || category.includes('night');
  }, [isElectricalRoller, product.category]);

  const isDayNight = useMemo(() => {
    const category = product.category.toLowerCase();
    return category.includes('day') || category.includes('night') || category.includes('zebra');
  }, [product.category]);

  const installationOptions = isDayNight
    ? ZEBRA_INSTALLATION_OPTIONS
    : isRollerOrDayNight
    ? ROLLER_INSTALLATION_OPTIONS
    : INSTALLATION_METHOD_OPTIONS;
  const controlOptions = isRollerOrDayNight ? ROLLER_CONTROL_OPTIONS : CONTROL_OPTIONS;

  // Dynamic stacking options for vertical blinds — combination-specific images per control type
  const stackingOptions = useMemo(() => {
    return VERTICAL_STACKING_OPTIONS[config.controlOption ?? ''] ?? [];
  }, [config.controlOption]);
  const isReplacementVerticalSlat = useMemo(
    () => isReplacementVerticalSlatProduct(product.tags),
    [product.tags]
  );
  const usesHeightOnlyVerticalPricing = isReplacementVerticalSlat;
  const shouldFetchPriceMatrix = useMemo(() => {
    if (isReplacementVerticalSlat) {
      return false;
    }

    return true;
  }, [
    isReplacementVerticalSlat,
  ]);

  useEffect(() => {
    if (!shouldFetchPriceMatrix) {
      setPriceMatrix(null);
      return;
    }
    if (matrixFetchingRef.current) {
      return;
    }

    matrixFetchingRef.current = true;
    let isMounted = true;

    const loadPriceMatrix = async () => {
      try {
        const matrix = await fetchPriceMatrix(product.slug);
        if (isMounted) {
          setPriceMatrix(matrix);
        }
      } catch (error) {
        console.error('Failed to load price matrix:', error);
      } finally {
        if (isMounted) {
          matrixFetchingRef.current = false;
        }
      }
    };

    loadPriceMatrix();

    return () => {
      isMounted = false;
      matrixFetchingRef.current = false;
    };
  }, [product.slug, shouldFetchPriceMatrix]);

  // Reset stacking when control changes and selected stack is no longer valid
  useEffect(() => {
    if (!config.controlOption) return;
    const validIds = (VERTICAL_STACKING_OPTIONS[config.controlOption] ?? []).map((o) => o.id);
    if (config.stacking && !validIds.includes(config.stacking)) {
      setConfig((prev) => ({ ...prev, stacking: null }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.controlOption]);

  useEffect(() => {
    if (!isElectricalRoller) return;

    setConfig((prev) => {
      const nextMotorization =
        prev.motorization && prev.motorization !== 'none'
          ? prev.motorization
          : electricalRollerMotorizationOptions[0]?.id ?? null;

      if (
        prev.chainColor === null &&
        prev.controlSide === null &&
        prev.motorization === nextMotorization
      ) {
        return prev;
      }

      return {
        ...prev,
        chainColor: null,
        controlSide: null,
        motorization: nextMotorization,
      };
    });
  }, [electricalRollerMotorizationOptions, isElectricalRoller, setConfig]);

  useEffect(() => {
    if (!usesHeightOnlyVerticalPricing) return;

    setConfig((prev) => {
      const nextConfig = {
        ...prev,
        width: 0,
        widthFraction: '0',
        headrailColour: null,
        installationMethod: null,
        controlOption: null,
        stacking: null,
        controlSide: null,
        bracketType: null,
      };

      const changed =
        prev.width !== nextConfig.width ||
        prev.widthFraction !== nextConfig.widthFraction ||
        prev.headrailColour !== nextConfig.headrailColour ||
        prev.installationMethod !== nextConfig.installationMethod ||
        prev.controlOption !== nextConfig.controlOption ||
        prev.stacking !== nextConfig.stacking ||
        prev.controlSide !== nextConfig.controlSide ||
        prev.bracketType !== nextConfig.bracketType;

      return changed ? nextConfig : prev;
    });
  }, [usesHeightOnlyVerticalPricing, setConfig]);

  // Determine which options should be visible based on product type and selected headrail
  const visibleOptions = useMemo(() => {
    // For roller blinds and day/night blinds - use product.features settings
    if (isRollerOrDayNight) {
      return {
        showSize: product.features.hasSize,
        showHeadrail: product.features.hasHeadrail,
        showHeadrailColour: product.features.hasHeadrailColour,
        showInstallationMethod: product.features.hasInstallationMethod,
        showControlOption: product.features.hasControlOption,
        showStacking: product.features.hasStacking,
        showControlSide: product.features.hasControlSide,
        showBottomChain: product.features.hasBottomChain,
        showBracketType: product.features.hasBracketType,
        showMotorization: product.features.hasMotorization,
        showBottomBar: product.features.hasBottomBar,
      };
    }

    if (isReplacementVerticalSlat) {
      return {
        showSize: product.features.hasSize,
        showHeadrail: false,
        showHeadrailColour: false,
        showInstallationMethod: false,
        showControlOption: false,
        showStacking: false,
        showControlSide: false,
        showBottomChain: product.features.hasBottomChain,
        showBracketType: false,
        showMotorization: product.features.hasMotorization,
        showBottomBar: false,
      };
    }

    // For vertical blinds (with headrail)
    return {
      // Size and Headrail are always visible
      showSize: product.features.hasSize,
      showHeadrail: product.features.hasHeadrail,

      // Headrail Colour only for Platinum
      showHeadrailColour: product.features.hasHeadrailColour && config.headrail === 'platinum',

      showInstallationMethod: product.features.hasInstallationMethod,

      // Control Option for Classic and Platinum
      showControlOption: product.features.hasControlOption && (config.headrail === 'classic' || config.headrail === 'platinum'),

      // Stacking for Classic and Platinum
      showStacking: product.features.hasStacking && (config.headrail === 'classic' || config.headrail === 'platinum'),

      // Control Side for Classic and Platinum
      showControlSide: product.features.hasControlSide && (config.headrail === 'classic' || config.headrail === 'platinum'),

      // Bottom Chain is available on regular vertical blinds
      showBottomChain: product.features.hasBottomChain && (
        config.headrail === 'classic' ||
        config.headrail === 'platinum'
      ),

      // Bracket Type for Classic and Platinum
      showBracketType: product.features.hasBracketType && (config.headrail === 'classic' || config.headrail === 'platinum'),

      showBottomBar: product.features.hasBottomBar,
    };
  }, [config.headrail, isReplacementVerticalSlat, isRollerOrDayNight, product.features]);

  // Build list of selected customizations for pricing
  const selectedCustomizations = useMemo(() => {
    return configToCustomizations({
      headrail: config.headrail,
      headrailColour: visibleOptions.showHeadrailColour ? config.headrailColour : null,
      installationMethod: visibleOptions.showInstallationMethod ? config.installationMethod : null,
      controlOption: visibleOptions.showControlOption ? config.controlOption : null,
      stacking: visibleOptions.showStacking ? config.stacking : null,
      controlSide: visibleOptions.showControlSide ? config.controlSide : null,
      bottomChain: visibleOptions.showBottomChain ? config.bottomChain : null,
      bracketType: visibleOptions.showBracketType ? config.bracketType : null,
      chainColor: isElectricalRoller ? null : config.chainColor,
      wrappedCassette: config.wrappedCassette,
      cassetteMatchingBar: config.cassetteMatchingBar,
      isRollerCassette: product.features.hasRollerCassette,
      motorization: config.motorization,
      bottomBar: visibleOptions.showBottomBar ? config.bottomBar : null,
    });
  }, [config, visibleOptions, product.features.hasRollerCassette, isElectricalRoller]);

  // Calculate price using new pricing system
  const priceCalculation = useMemo(() => {
    const widthInches = isReplacementVerticalSlat
      ? REPLACEMENT_VERTICAL_SLAT_FIXED_WIDTH_INCHES
      : getTotalInches(config.width, config.widthFraction, config.widthUnit);
    const heightInches = getTotalInches(config.height, config.heightFraction, config.heightUnit);

    if (heightInches <= 0) {
      return null;
    }
    if (!usesHeightOnlyVerticalPricing && (!priceMatrix || widthInches <= 0)) {
      return null;
    }

    return calculateTotalPrice(
      widthInches,
      heightInches,
      priceMatrix ?? { id: '', name: '', widthBands: [], heightBands: [], prices: [] },
      selectedCustomizations,
      customizationPricing,
      product.tags
    );
  }, [config.width, config.widthFraction, config.widthUnit, config.height, config.heightFraction, config.heightUnit, isReplacementVerticalSlat, usesHeightOnlyVerticalPricing, priceMatrix, product.tags, selectedCustomizations, customizationPricing]);

  // Get display price - use new pricing system if available, otherwise fallback
  const totalPrice = useMemo(() => {
    if (priceCalculation) {
      return priceCalculation.totalPrice;
    }
    // Fallback to base price from product if pricing not loaded
    return product.price;
  }, [priceCalculation, product.price]);

  const minimumDisplayedPrice = useMemo(() => {
    if (!usesHeightOnlyVerticalPricing) {
      return product.price;
    }

    return getMinimumReplacementVerticalSlatPrice(product.tags) ?? product.price;
  }, [product.price, product.tags, usesHeightOnlyVerticalPricing]);

  // Calculate dynamic size ranges from price band
  const sizeRanges = useMemo(() => {
    if (!priceMatrix || !priceMatrix.widthBands.length || !priceMatrix.heightBands.length) {
      return null;
    }

    const widthBands = priceMatrix.widthBands;
    const heightBands = priceMatrix.heightBands;

    const minWidth = Math.min(...widthBands.map(b => b.inches));
    const maxWidth = Math.max(...widthBands.map(b => b.inches));
    const minHeight = Math.min(...heightBands.map(b => b.inches));
    const maxHeight = Math.max(...heightBands.map(b => b.inches));

    return {
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
    };
  }, [priceMatrix]);

  // Show minimum price indicator when no dimensions selected
  const showMinPriceIndicator = usesHeightOnlyVerticalPricing
    ? config.height === 0
    : config.width === 0 || config.height === 0;

  const handleAddToCart = async () => {
    // Validate dimensions are selected
    if ((usesHeightOnlyVerticalPricing && config.height === 0) || (!usesHeightOnlyVerticalPricing && (config.width === 0 || config.height === 0))) {
      alert(usesHeightOnlyVerticalPricing ? 'Please select height before adding to cart.' : 'Please select width and height before adding to cart.');
      return;
    }

    setIsValidating(true);

    try {
      // Validate price with backend
      const widthInches = isReplacementVerticalSlat
        ? REPLACEMENT_VERTICAL_SLAT_FIXED_WIDTH_INCHES
        : getTotalInches(config.width, config.widthFraction, config.widthUnit);
      const heightInches = getTotalInches(config.height, config.heightFraction, config.heightUnit);

      const validation = await validateCartPrice(
        {
          handle: product.slug,
          widthInches,
          heightInches,
          customizations: selectedCustomizations,
        },
        totalPrice
      );

      if (!validation.valid) {
        console.warn('Price mismatch detected:', {
          submitted: totalPrice,
          calculated: validation.calculatedPrice,
          difference: validation.difference,
        });
        // Use the backend calculated price to ensure accuracy
        const productWithPrice = {
          ...product,
          price: validation.calculatedPrice,
        };
        addToCart(productWithPrice, config);
      } else {
        // Price matches, proceed with cart
        const productWithPrice = {
          ...product,
          price: totalPrice,
        };
        addToCart(productWithPrice, config);
      }
    } catch (error) {
      console.error('Price validation failed:', error);
      // Fallback: add to cart anyway with frontend calculated price
      const productWithPrice = {
        ...product,
        price: totalPrice,
      };
      addToCart(productWithPrice, config);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-white min-h-screen relative z-20">
      {/* Breadcrumb */}
      <div className="px-4 md:px-6 lg:px-20 py-3 md:py-4 border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto">
          <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
            <Link href="/" className="hover:text-[#335c99]">{product.category}</Link>
            <span>&gt;</span>
            <button onClick={onClose} className="hover:text-[#335c99] truncate max-w-[120px] md:max-w-none">{product.name}</button>
            <span>&gt;</span>
            <span className="text-gray-900">Customize</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 lg:px-20 py-6 md:py-8 pb-24">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-12">
            {/* Left - Gallery (Sticky on desktop) */}
            <div className="w-full lg:w-[45%] lg:sticky lg:top-4 lg:self-start">
              <ProductGallery images={product.images} productName={product.name} />
            </div>

            {/* Right - Configuration */}
            <div className="w-full lg:w-[55%]">
              {/* Product Title */}
              <h1 className="text-xl md:text-2xl lg:text-3xl font-medium text-[#25344d] mb-2">{product.name}</h1>
              <p className="text-xs md:text-sm text-gray-500 mb-2">
                Estimated Shipping Date: <span className="text-[#335c99] font-medium">{product.estimatedDelivery}</span>
              </p>

              {/* Configuration Title */}
              <h2 className="text-lg md:text-xl font-medium text-[#25344d] mb-4 md:mb-6 mt-6 md:mt-8">Configure Your Window Treatment</h2>

              <div className="space-y-8 divide-y divide-gray-100">
                {/* Size Selector */}
                {product.features.hasSize && (
                  <div className="pt-6 first:pt-0">
                    <SizeSelector
                      width={config.width}
                      widthFraction={config.widthFraction}
                      height={config.height}
                      heightFraction={config.heightFraction}
                      unit={config.widthUnit}
                      onWidthChange={(value) => setConfig({ ...config, width: value })}
                      onWidthFractionChange={(value) => setConfig({ ...config, widthFraction: value })}
                      onHeightChange={(value) => setConfig({ ...config, height: value })}
                      onHeightFractionChange={(value) => setConfig({ ...config, heightFraction: value })}
                      onUnitChange={(unit) => setConfig({ ...config, widthUnit: unit, heightUnit: unit })}
                      minWidth={sizeRanges?.minWidth}
                      maxWidth={sizeRanges?.maxWidth}
                      minHeight={sizeRanges?.minHeight}
                      maxHeight={sizeRanges?.maxHeight}
                      showWidth={!usesHeightOnlyVerticalPricing}
                    />
                  </div>
                )}

                {/* Headrail Selector */}
                {product.features.hasHeadrail && (
                  <div className="pt-6 relative z-[60]">
                    <HeadrailSelector
                      options={HEADRAIL_OPTIONS}
                      selectedHeadrail={config.headrail}
                      onHeadrailChange={(headrailId) => setConfig({ ...config, headrail: headrailId })}
                    />
                  </div>
                )}

                {/* Headrail Colour Selector */}
                {product.features.hasHeadrailColour && visibleOptions.showHeadrailColour && (
                  <div className="pt-6 relative z-50">
                    <HeadrailColourSelector
                      options={HEADRAIL_COLOUR_OPTIONS}
                      selectedColour={config.headrailColour}
                      onColourChange={(colourId) => setConfig({ ...config, headrailColour: colourId })}
                    />
                  </div>
                )}

                {/* Installation Method Selector */}
                {product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                  <div className="pt-6 relative z-[45]">
                    <InstallationMethodSelector
                      options={installationOptions}
                      selectedMethod={config.installationMethod}
                      onMethodChange={(methodId) => setConfig({ ...config, installationMethod: methodId })}
                    />
                  </div>
                )}

                {/* Control Option Selector */}
                {product.features.hasControlOption && visibleOptions.showControlOption && (
                  <div className="pt-6 relative z-[40]">
                    <ControlOptionSelector
                      options={controlOptions}
                      selectedOption={config.controlOption}
                      onOptionChange={(optionId) => setConfig({ ...config, controlOption: optionId })}
                    />
                  </div>
                )}

                {/* Stacking Selector */}
                {product.features.hasStacking && visibleOptions.showStacking && (
                  <div className="pt-6 relative z-[35]">
                    <StackingSelector
                      options={stackingOptions}
                      selectedStacking={config.stacking}
                      onStackingChange={(stackingId) => setConfig({ ...config, stacking: stackingId })}
                    />
                  </div>
                )}

                {/* Control Side Selector */}
                {product.features.hasControlSide && visibleOptions.showControlSide && (
                  <div className="pt-6 relative z-[32]">
                    <ControlSideSelector
                      options={CONTROL_SIDE_OPTIONS}
                      selectedSide={config.controlSide}
                      onSideChange={(sideId) => setConfig({ ...config, controlSide: sideId })}
                    />
                  </div>
                )}

                {/* Bottom Chain Selector */}
                {product.features.hasBottomChain && visibleOptions.showBottomChain && (
                  <div className="pt-6 relative z-30">
                    <BottomChainSelector
                      options={BOTTOM_CHAIN_OPTIONS.filter(opt => !('pvcOnly' in opt) || product.features.hasPvcFabric)}
                      selectedChain={config.bottomChain}
                      onChainChange={(chainId) => setConfig({ ...config, bottomChain: chainId })}
                    />
                  </div>
                )}

                {/* Bracket Type Selector */}
                {product.features.hasBracketType && visibleOptions.showBracketType && (
                  <div className="pt-6 relative z-20">
                    <BracketTypeSelector
                      options={BRACKET_TYPE_OPTIONS}
                      selectedBracket={config.bracketType}
                      onBracketChange={(bracketId) => setConfig({ ...config, bracketType: bracketId })}
                    />
                  </div>
                )}

                {/* Chain Color Selector */}
                {product.features.hasChainColor && !isElectricalRoller && (
                  <div className="pt-6 relative z-10">
                    <ChainColorSelector
                      options={CHAIN_COLOR_OPTIONS}
                      selectedColor={config.chainColor}
                      onColorChange={(colorId) => setConfig({ ...config, chainColor: colorId })}
                    />
                  </div>
                )}

                {/* Wrapped Cassette Selector */}
                {product.features.hasWrappedCassette && (
                  <div className="pt-6 relative z-[5]">
                    <WrappedCassetteSelector
                      options={WRAPPED_CASSETTE_OPTIONS}
                      selectedOption={config.wrappedCassette}
                      onOptionChange={(optionId) => setConfig({ ...config, wrappedCassette: optionId })}
                    />
                  </div>
                )}

                {/* Cassette Matching Bar Selector */}
                {product.features.hasCassetteMatchingBar && (
                  <div className="pt-6 relative z-[3]">
                    <SimpleDropdown
                      label="Cassette and Bottom Matching Bar"
                      options={CASSETTE_MATCHING_BAR_OPTIONS}
                      selectedValue={config.cassetteMatchingBar}
                      onChange={(barId) => setConfig({ ...config, cassetteMatchingBar: barId })}
                      placeholder="Select cassette and bottom bar"
                    />
                  </div>
                )}

                {/* Roller Cassette Selector */}
                {product.features.hasRollerCassette && (
                  <div className="pt-6 relative z-[3]">
                    <SimpleDropdown
                      label="Cassette and Bottom Matching Bar"
                      options={ROLLER_CASSETTE_OPTIONS}
                      selectedValue={config.cassetteMatchingBar}
                      onChange={(barId) => setConfig({ ...config, cassetteMatchingBar: barId })}
                      placeholder="Select cassette color"
                    />
                  </div>
                )}

                {/* Bottom Bar Selector */}
                {product.features.hasBottomBar && visibleOptions.showBottomBar && (
                  <div className="pt-6 relative z-[2.5]">
                    <BottomBarSelector
                      options={BOTTOM_BAR_OPTIONS}
                      selectedBottomBar={config.bottomBar}
                      onBottomBarChange={(optionId) => setConfig({ ...config, bottomBar: optionId })}
                    />
                  </div>
                )}

                {/* Motorization Selector */}
                {(product.features.hasMotorization || isElectricalRoller) && (
                  <div className="pt-6 relative z-[2]">
                    {isElectricalRoller ? (
                      <SimpleDropdown
                        label="Remote Control"
                        options={electricalRollerMotorizationOptions}
                        selectedValue={config.motorization}
                        onChange={(optionId) => setConfig({ ...config, motorization: optionId })}
                        placeholder="Select remote option"
                      />
                    ) : (
                      <MotorizationSelector
                        options={MOTORIZATION_OPTIONS}
                        selectedOption={config.motorization}
                        onOptionChange={(optionId) => setConfig({ ...config, motorization: optionId })}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-20 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs md:text-sm text-gray-500">
                {showMinPriceIndicator ? 'From' : 'Price'}
              </span>
              <div className="text-xl md:text-2xl font-bold text-[#25344d]">
                {showMinPriceIndicator
                  ? formatPriceWithCurrency(formatPrice(minimumDisplayedPrice), product.currency)
                  : formatPriceWithCurrency(formatPrice(totalPrice), product.currency)
                }
              </div>
              {priceCalculation && !showMinPriceIndicator && (
                <div className="text-xs text-gray-400">
                  {usesHeightOnlyVerticalPricing
                    ? `Height-only pricing: ${getTotalInches(config.height, config.heightFraction, config.heightUnit).toFixed(2)}"`
                    : `Size: ${priceCalculation.widthBand?.inches}" × ${priceCalculation.heightBand?.inches}"`}
                </div>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isValidating || showMinPriceIndicator}
              className={`py-2.5 md:py-3 px-6 md:px-8 rounded text-sm md:text-base font-medium transition-colors ${isValidating || showMinPriceIndicator
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-[#335c99] text-white hover:bg-[#244779]'
                }`}
            >
              {isValidating ? 'Adding to Cart...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;
