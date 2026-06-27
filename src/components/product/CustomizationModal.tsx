'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Product, ProductConfiguration, PriceBandMatrix, CustomizationPricing as CustomizationPricingType } from '@/types';
import { useCart } from '@/context/CartContext';
import ProductGallery from './ProductGallery';
import { formatPrice, formatPriceWithCurrency, fetchPriceMatrix, fetchCustomizationPricing, validateCartPrice } from '@/lib/api';
import { getDeliveryDateRange } from '@/lib/delivery';
import {
  calculateTotalPrice,
  configToCustomizations,
  getTotalInches,
} from '@/lib/pricing';
import {
  formatMissingCustomizationsMessage,
  getMissingRequiredCustomizations,
} from '@/lib/product-customization-validation';
import {
  getMinimumReplacementVerticalSlatPrice,
  isReplacementVerticalSlatProduct,
  REPLACEMENT_VERTICAL_SLAT_FIXED_WIDTH_INCHES,
} from '@/lib/vertical-blinds';
import {
  getMotorizedRemoteOptions,
  isSpecialMotorizedProduct,
} from '@/lib/electrical-roller';
import {
  getEasyStickFieldLabels,
  getEasyStickSubtype,
  isEasyStickProduct,
} from '@/lib/easy-stick';
import { isFauxWoodenProduct } from '@/lib/faux-wooden';
import { getPerfectFitMetalFieldLabels, isPerfectFitMetalProduct } from '@/lib/perfect-fit-metal';
import {
  getPerfectFitShutterFieldLabels,
  getPerfectFitShutterPanelOption,
  isPerfectFitShutterHandlePositionRequired,
  isPerfectFitShutterHandlePositionValid,
  isPerfectFitShutterProduct,
  PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM,
  PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM,
} from '@/lib/perfect-fit-shutter';
import { getPerfectFitWoodenFieldLabels, isPerfectFitWoodenProduct } from '@/lib/perfect-fit-wooden';
import { getSkylightBlindTypeOptions, SKYLIGHT_BRAND_OPTIONS } from '@/data/skylight';
import { getSkylightPricingDimensions, isSkylightProduct } from '@/lib/skylight';
import {
  SizeSelector,
  RoomTypeSelector,
  HeadrailSelector,
  HeadrailColourSelector,
  InstallationMethodSelector,
  LiningTypeSelector,
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
  NO_DRILL_INSTALLATION_OPTIONS,
  EASY_STICK_MEASUREMENT_TYPE_OPTIONS,
  EASY_STICK_HONEYCOMB_OPERATION_OPTIONS,
  EASY_STICK_WOOD_OPERATION_OPTIONS,
  EASY_STICK_PROFILE_COLOR_OPTIONS,
  EASY_STICK_FITTING_OPTIONS,
  EASY_STICK_SLAT_SIZE_OPTIONS,
  EASY_STICK_METAL_CONTROLS_OPTIONS,
  EASY_STICK_WOOD_CONTROL_SIDE_OPTIONS,
  PERFECT_FIT_SHUTTER_BRACKET_SIZE_OPTIONS,
  PERFECT_FIT_SHUTTER_HANDLE_LOCATION_OPTIONS,
  PERFECT_FIT_SHUTTER_MEASUREMENT_TYPE_OPTIONS,
  PERFECT_FIT_WOODEN_MEASUREMENT_TYPE_OPTIONS,
  PERFECT_FIT_WOODEN_CONTROL_SIDE_OPTIONS,
  PERFECT_FIT_WOODEN_FRAME_COLOR_OPTIONS,
  PERFECT_FIT_WOODEN_BRACKET_SIZE_OPTIONS,
  PERFECT_FIT_METAL_MEASUREMENT_TYPE_OPTIONS,
  PERFECT_FIT_METAL_CONTROL_SIDE_OPTIONS,
  PERFECT_FIT_METAL_FRAME_COLOR_OPTIONS,
  PERFECT_FIT_METAL_BRACKET_SIZE_OPTIONS,
  ROMAN_INSTALLATION_OPTIONS,
  VENETIAN_INSTALLATION_OPTIONS,
  WOODEN_TOGGLE_OPTIONS,
  ZEBRA_INSTALLATION_OPTIONS,
  CONTROL_OPTIONS,
  ROLLER_CONTROL_OPTIONS,
  ROMAN_CONTROL_OPTIONS,
  VERTICAL_STACKING_OPTIONS,
  CONTROL_SIDE_OPTIONS,
  BOTTOM_CHAIN_OPTIONS,
  BRACKET_TYPE_OPTIONS,
  CHAIN_COLOR_OPTIONS,
  ROMAN_CHAIN_COLOR_OPTIONS,
  LINING_TYPE_OPTIONS,
  WRAPPED_CASSETTE_OPTIONS,
  CASSETTE_MATCHING_BAR_OPTIONS,
  ROLLER_CASSETTE_OPTIONS,
  MOTORIZATION_OPTIONS,
  BOTTOM_BAR_OPTIONS,
} from '@/data/customizations';
import { ROOM_TYPE_OPTIONS } from '@/data/roomTypes';
import { isRomanProduct } from '@/lib/roman-blinds';

interface CustomizationModalProps {
  product: Product;
  config: ProductConfiguration;
  setConfig: React.Dispatch<React.SetStateAction<ProductConfiguration>>;
  onClose: () => void;
  mode?: 'add' | 'edit';
  presentation?: 'page' | 'modal';
  onSaveConfiguredProduct?: (product: Product, configuration: ProductConfiguration) => void;
}

const CustomizationModal = ({
  product,
  config,
  setConfig,
  onClose,
  mode = 'add',
  presentation = 'page',
  onSaveConfiguredProduct,
}: CustomizationModalProps) => {
  const { addToCart } = useCart();
  const isSpecialMotorized = useMemo(
    () => isSpecialMotorizedProduct(product.tags),
    [product.tags]
  );
  const motorizedRemoteOptions = useMemo(
    () => getMotorizedRemoteOptions(MOTORIZATION_OPTIONS),
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
    return isSpecialMotorized || category.includes('roller') || category.includes('day') || category.includes('night');
  }, [isSpecialMotorized, product.category]);

  const isDayNight = useMemo(() => {
    const category = product.category.toLowerCase();
    return category.includes('day') || category.includes('night') || category.includes('zebra');
  }, [product.category]);

  const isNoDrill = useMemo(() => {
    const category = product.category.toLowerCase();
    return category.includes('no drill') || product.tags.includes('no-drill-blinds');
  }, [product.category, product.tags]);

  const isEasyStick = useMemo(() => {
    return isEasyStickProduct({
      category: product.category,
      tags: product.tags,
      name: product.name,
      slug: product.slug,
    });
  }, [product.category, product.name, product.slug, product.tags]);

  const easyStickSubtype = useMemo(() => {
    if (!isEasyStick) {
      return null;
    }

    return getEasyStickSubtype({
      name: product.name,
      slug: product.slug,
      tags: product.tags,
    });
  }, [isEasyStick, product.name, product.slug, product.tags]);

  const easyStickLabels = useMemo(
    () => getEasyStickFieldLabels(easyStickSubtype),
    [easyStickSubtype]
  );

  const isSkylight = useMemo(() => {
    return isSkylightProduct({
      category: product.category,
      tags: product.tags,
      name: product.name,
      slug: product.slug,
    });
  }, [product.category, product.name, product.slug, product.tags]);

  const isFauxWooden = useMemo(() => {
    return isFauxWoodenProduct({
      category: product.category,
      tags: product.tags,
      name: product.name,
      slug: product.slug,
    });
  }, [product.category, product.name, product.slug, product.tags]);

  const isPerfectFitWooden = useMemo(() => {
    return isPerfectFitWoodenProduct({
      category: product.category,
      tags: product.tags,
      name: product.name,
      slug: product.slug,
    });
  }, [product.category, product.name, product.slug, product.tags]);

  const isPerfectFitShutter = useMemo(() => {
    return isPerfectFitShutterProduct({
      category: product.category,
      tags: product.tags,
      name: product.name,
      slug: product.slug,
    });
  }, [product.category, product.name, product.slug, product.tags]);

  const isPerfectFitMetal = useMemo(() => {
    return isPerfectFitMetalProduct({
      category: product.category,
      tags: product.tags,
      name: product.name,
      slug: product.slug,
    });
  }, [product.category, product.name, product.slug, product.tags]);

  const perfectFitWoodenLabels = useMemo(
    () => getPerfectFitWoodenFieldLabels(),
    []
  );

  const perfectFitShutterLabels = useMemo(
    () => getPerfectFitShutterFieldLabels(),
    []
  );

  const perfectFitMetalLabels = useMemo(
    () => getPerfectFitMetalFieldLabels(),
    []
  );

  const skylightBlindTypeOptions = useMemo(
    () => getSkylightBlindTypeOptions((config.brand as Parameters<typeof getSkylightBlindTypeOptions>[0]) || null),
    [config.brand]
  );

  const isVenetian = useMemo(() => {
    const category = product.category.toLowerCase();
    return category.includes('venetian');
  }, [product.category]);

  const isRoman = useMemo(() => {
    const category = product.category.toLowerCase();
    return category.includes('roman') || isRomanProduct(product.tags);
  }, [product.category, product.tags]);

  const standardInstallationOptions = isDayNight
    ? ZEBRA_INSTALLATION_OPTIONS
    : isPerfectFitShutter
    ? VENETIAN_INSTALLATION_OPTIONS
    : isPerfectFitMetal
    ? VENETIAN_INSTALLATION_OPTIONS
    : isPerfectFitWooden
    ? VENETIAN_INSTALLATION_OPTIONS
    : isFauxWooden
    ? VENETIAN_INSTALLATION_OPTIONS
    : isNoDrill
    ? NO_DRILL_INSTALLATION_OPTIONS
    : isRoman
    ? ROMAN_INSTALLATION_OPTIONS
    : isVenetian
    ? VENETIAN_INSTALLATION_OPTIONS
    : isRollerOrDayNight
    ? ROLLER_INSTALLATION_OPTIONS
    : INSTALLATION_METHOD_OPTIONS;
  const installationOptions = isDayNight
    ? ZEBRA_INSTALLATION_OPTIONS
    : isPerfectFitShutter
    ? PERFECT_FIT_SHUTTER_MEASUREMENT_TYPE_OPTIONS
    : isPerfectFitMetal
    ? PERFECT_FIT_METAL_MEASUREMENT_TYPE_OPTIONS
    : isPerfectFitWooden
    ? PERFECT_FIT_WOODEN_MEASUREMENT_TYPE_OPTIONS
    : isEasyStick && easyStickSubtype === 'metal'
    ? EASY_STICK_FITTING_OPTIONS
    : isEasyStick
    ? EASY_STICK_MEASUREMENT_TYPE_OPTIONS
    : isFauxWooden
    ? VENETIAN_INSTALLATION_OPTIONS
    : isNoDrill
    ? NO_DRILL_INSTALLATION_OPTIONS
    : isRoman
    ? ROMAN_INSTALLATION_OPTIONS
    : isVenetian
    ? VENETIAN_INSTALLATION_OPTIONS
    : isRollerOrDayNight
    ? ROLLER_INSTALLATION_OPTIONS
    : INSTALLATION_METHOD_OPTIONS;
  const controlOptions = isRoman
    ? ROMAN_CONTROL_OPTIONS
    : isPerfectFitShutter
    ? PERFECT_FIT_SHUTTER_HANDLE_LOCATION_OPTIONS
    : isFauxWooden
    ? WOODEN_TOGGLE_OPTIONS
    : isEasyStick && easyStickSubtype === 'metal'
    ? EASY_STICK_SLAT_SIZE_OPTIONS
    : isEasyStick && easyStickSubtype === 'wood'
    ? EASY_STICK_WOOD_OPERATION_OPTIONS
    : isEasyStick
    ? EASY_STICK_HONEYCOMB_OPERATION_OPTIONS
    : (isRollerOrDayNight || isNoDrill)
    ? ROLLER_CONTROL_OPTIONS
    : CONTROL_OPTIONS;
  const easyStickControlSideOptions = easyStickSubtype === 'metal'
    ? EASY_STICK_METAL_CONTROLS_OPTIONS
    : EASY_STICK_WOOD_CONTROL_SIDE_OPTIONS;
  const controlSideOptions = isPerfectFitWooden
    ? PERFECT_FIT_WOODEN_CONTROL_SIDE_OPTIONS
    : isPerfectFitMetal
    ? PERFECT_FIT_METAL_CONTROL_SIDE_OPTIONS
    : CONTROL_SIDE_OPTIONS;
  const frameColorOptions = isPerfectFitWooden
    ? PERFECT_FIT_WOODEN_FRAME_COLOR_OPTIONS
    : isPerfectFitMetal
    ? PERFECT_FIT_METAL_FRAME_COLOR_OPTIONS
    : EASY_STICK_PROFILE_COLOR_OPTIONS;
  const chainColorOptions = isRoman ? ROMAN_CHAIN_COLOR_OPTIONS : CHAIN_COLOR_OPTIONS;
  const shutterPanelOption = useMemo(() => {
    if (!isPerfectFitShutter) {
      return null;
    }

    const widthMm = getTotalInches(config.width, config.widthFraction, config.widthUnit) * 25.4;
    return getPerfectFitShutterPanelOption(widthMm);
  }, [config.width, config.widthFraction, config.widthUnit, isPerfectFitShutter]);
  const shutterPanelOptions = useMemo(
    () => (shutterPanelOption ? [shutterPanelOption] : []),
    [shutterPanelOption]
  );
  const shutterHandlePositionRequired = useMemo(
    () => isPerfectFitShutter && isPerfectFitShutterHandlePositionRequired(config.controlOption),
    [config.controlOption, isPerfectFitShutter]
  );
  const shutterHandlePositionValid = useMemo(
    () =>
      !isPerfectFitShutter ||
      !shutterHandlePositionRequired ||
      isPerfectFitShutterHandlePositionValid(config.handlePosition),
    [config.handlePosition, isPerfectFitShutter, shutterHandlePositionRequired]
  );

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
    if (!isSpecialMotorized) return;

    setConfig((prev) => {
      const nextMotorization =
        prev.motorization && prev.motorization !== 'none'
          ? prev.motorization
          : motorizedRemoteOptions[0]?.id ?? null;

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
  }, [motorizedRemoteOptions, isSpecialMotorized, setConfig]);

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

  useEffect(() => {
    if (!isPerfectFitShutter) return;

    setConfig((prev) => {
      const nextNumberOfPanels = shutterPanelOption?.id ?? null;
      const nextHandlePosition = isPerfectFitShutterHandlePositionRequired(prev.controlOption)
        ? prev.handlePosition
        : null;

      if (
        prev.numberOfPanels === nextNumberOfPanels &&
        prev.handlePosition === nextHandlePosition
      ) {
        return prev;
      }

      return {
        ...prev,
        numberOfPanels: nextNumberOfPanels,
        handlePosition: nextHandlePosition,
      };
    });
  }, [isPerfectFitShutter, setConfig, shutterPanelOption]);

  // Determine which options should be visible based on product type and selected headrail
  const visibleOptions = useMemo(() => {
    if (isSkylight) {
      return {
        showSize: false,
        showHeadrail: false,
        showHeadrailColour: false,
        showInstallationMethod: false,
        showControlOption: false,
        showLiningType: false,
        showStacking: false,
        showControlSide: false,
        showBottomChain: false,
        showBracketType: false,
        showChainColor: false,
        showMotorization: false,
        showBottomBar: false,
        showFrameColor: false,
      };
    }

    // For roller blinds and day/night blinds - use product.features settings
    if (isRollerOrDayNight || isRoman || isVenetian || isNoDrill || isEasyStick || isFauxWooden || isPerfectFitWooden || isPerfectFitShutter || isPerfectFitMetal) {
      return {
        showSize: product.features.hasSize,
        showHeadrail: product.features.hasHeadrail,
        showHeadrailColour: product.features.hasHeadrailColour,
        showInstallationMethod: product.features.hasInstallationMethod,
        showControlOption: product.features.hasControlOption,
        showLiningType: isRoman,
        showStacking: product.features.hasStacking,
        showControlSide: isEasyStick
          ? product.features.hasControlSide && (easyStickSubtype === 'metal' || easyStickSubtype === 'wood')
          : isPerfectFitWooden
          ? product.features.hasControlSide
          : isPerfectFitShutter
          ? product.features.hasControlSide
          : isPerfectFitMetal
          ? product.features.hasControlSide
          : product.features.hasControlSide,
        showBottomChain: product.features.hasBottomChain,
        showBracketType: product.features.hasBracketType,
        showChainColor: product.features.hasChainColor,
        showMotorization: product.features.hasMotorization,
        showBottomBar: product.features.hasBottomBar,
        showFrameColor: isEasyStick
          ? product.features.hasFrameColor && (easyStickSubtype === 'honeycomb' || easyStickSubtype === 'wood')
          : isPerfectFitWooden
          ? product.features.hasFrameColor
          : isPerfectFitShutter
          ? product.features.hasFrameColor
          : isPerfectFitMetal
          ? product.features.hasFrameColor
          : false,
      };
    }

    if (isReplacementVerticalSlat) {
      return {
        showSize: product.features.hasSize,
        showHeadrail: false,
        showHeadrailColour: false,
        showInstallationMethod: false,
        showControlOption: false,
        showLiningType: false,
        showStacking: false,
        showControlSide: false,
        showBottomChain: product.features.hasBottomChain,
        showBracketType: false,
        showChainColor: false,
        showMotorization: product.features.hasMotorization,
        showBottomBar: false,
        showFrameColor: false,
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
      showLiningType: false,

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
      showChainColor: false,

      showBottomBar: product.features.hasBottomBar,
      showFrameColor: false,
    };
  }, [config.headrail, easyStickSubtype, isReplacementVerticalSlat, isRollerOrDayNight, isRoman, isVenetian, isNoDrill, isEasyStick, isFauxWooden, isPerfectFitWooden, isPerfectFitShutter, isPerfectFitMetal, isSkylight, product.features]);

  // Build list of selected customizations for pricing
  const selectedCustomizations = useMemo(() => {
    return configToCustomizations({
      headrail: config.headrail,
      headrailColour: visibleOptions.showHeadrailColour ? config.headrailColour : null,
      installationMethod: visibleOptions.showInstallationMethod ? config.installationMethod : null,
      controlOption: visibleOptions.showControlOption ? config.controlOption : null,
      liningType: visibleOptions.showLiningType ? config.liningType : null,
      stacking: visibleOptions.showStacking ? config.stacking : null,
      controlSide: visibleOptions.showControlSide ? config.controlSide : null,
      bottomChain: visibleOptions.showBottomChain ? config.bottomChain : null,
      bracketType: visibleOptions.showBracketType ? config.bracketType : null,
      chainColor: !visibleOptions.showChainColor || isSpecialMotorized ? null : config.chainColor,
      chainColorCategory: isRoman ? 'roman-chain-color' : 'chain-color',
      frameColor: visibleOptions.showFrameColor ? config.frameColor : null,
      frameColorCategory: isPerfectFitMetal ? 'perfect-fit-metal-frame-color' : 'frame-color',
      numberOfPanels: isPerfectFitShutter ? config.numberOfPanels : null,
      wrappedCassette: config.wrappedCassette,
      cassetteMatchingBar: config.cassetteMatchingBar,
      isRollerCassette: product.features.hasRollerCassette,
      motorization: config.motorization,
      brand: config.brand,
      blindType: config.blindType,
      bottomBar: visibleOptions.showBottomBar ? config.bottomBar : null,
    });
  }, [config, visibleOptions, product.features.hasRollerCassette, isRoman, isSpecialMotorized, isPerfectFitMetal, isPerfectFitShutter]);

  // Calculate price using new pricing system
  const priceCalculation = useMemo(() => {
    const widthInches = isSkylight
      ? getSkylightPricingDimensions().widthInches
      : isReplacementVerticalSlat
        ? REPLACEMENT_VERTICAL_SLAT_FIXED_WIDTH_INCHES
        : getTotalInches(config.width, config.widthFraction, config.widthUnit);
    const heightInches = isSkylight
      ? getSkylightPricingDimensions().heightInches
      : getTotalInches(config.height, config.heightFraction, config.heightUnit);

    if (!isSkylight && heightInches <= 0) {
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
  }, [config.width, config.widthFraction, config.widthUnit, config.height, config.heightFraction, config.heightUnit, isReplacementVerticalSlat, isSkylight, usesHeightOnlyVerticalPricing, priceMatrix, product.tags, selectedCustomizations, customizationPricing]);

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

  const isMeasurementOutOfRange = useMemo(() => {
    if (isSkylight || usesHeightOnlyVerticalPricing || !sizeRanges) {
      return false;
    }

    const widthInches = getTotalInches(config.width, config.widthFraction, config.widthUnit);
    const heightInches = getTotalInches(config.height, config.heightFraction, config.heightUnit);

    if (widthInches <= 0 || heightInches <= 0) {
      return false;
    }

    return (
      widthInches < sizeRanges.minWidth ||
      widthInches > sizeRanges.maxWidth ||
      heightInches < sizeRanges.minHeight ||
      heightInches > sizeRanges.maxHeight
    );
  }, [config.height, config.heightFraction, config.heightUnit, config.width, config.widthFraction, config.widthUnit, isSkylight, sizeRanges, usesHeightOnlyVerticalPricing]);
  const isPerfectFitShutterConfigurationIncomplete = useMemo(() => {
    if (!isPerfectFitShutter) {
      return false;
    }

    return (
      !config.installationMethod ||
      !config.controlOption ||
      !config.bracketType ||
      !config.numberOfPanels ||
      (shutterHandlePositionRequired && !shutterHandlePositionValid)
    );
  }, [
    config.bracketType,
    config.controlOption,
    config.installationMethod,
    config.numberOfPanels,
    isPerfectFitShutter,
    shutterHandlePositionRequired,
    shutterHandlePositionValid,
  ]);
  const missingRequiredCustomizations = useMemo(() => {
    return getMissingRequiredCustomizations({
      product,
      config,
      visibleOptions,
      isSkylight,
      isRoman,
      isSpecialMotorized,
      labels: {
        installationMethod: isPerfectFitWooden
          ? perfectFitWoodenLabels.installationMethod
          : isPerfectFitShutter
          ? perfectFitShutterLabels.installationMethod
          : isPerfectFitMetal
          ? perfectFitMetalLabels.installationMethod
          : isEasyStick
          ? easyStickLabels.installationMethod
          : 'Installation method',
        controlOption: isPerfectFitShutter
          ? perfectFitShutterLabels.controlOption
          : isEasyStick
          ? easyStickLabels.controlOption
          : isFauxWooden
          ? 'Toggle'
          : 'Control option',
        controlSide: isPerfectFitWooden
          ? perfectFitWoodenLabels.controlSide
          : isPerfectFitMetal
          ? perfectFitMetalLabels.controlSide
          : easyStickLabels.controlSide || 'Control side',
        bracketType: isPerfectFitShutter
          ? perfectFitShutterLabels.bracketType
          : isPerfectFitWooden
          ? perfectFitWoodenLabels.bracketType
          : isPerfectFitMetal
          ? perfectFitMetalLabels.bracketType
          : 'Bracket type',
        frameColor: isPerfectFitWooden
          ? perfectFitWoodenLabels.frameColor
          : isPerfectFitMetal
          ? perfectFitMetalLabels.frameColor
          : easyStickLabels.frameColor || 'Frame color',
      },
    });
  }, [
    config,
    easyStickLabels,
    isEasyStick,
    isFauxWooden,
    isPerfectFitMetal,
    isPerfectFitShutter,
    isPerfectFitWooden,
    isRoman,
    isSkylight,
    isSpecialMotorized,
    perfectFitMetalLabels,
    perfectFitShutterLabels,
    perfectFitWoodenLabels,
    product,
    visibleOptions,
  ]);
  const isRequiredCustomizationIncomplete = missingRequiredCustomizations.length > 0;

  // Show minimum price indicator when no dimensions selected
  const showMinPriceIndicator = isSkylight
    ? !config.blindType
    : usesHeightOnlyVerticalPricing
      ? config.height === 0
      : config.width === 0 || config.height === 0;

  const saveConfiguredProduct = (productWithPrice: Product) => {
    if (mode === 'edit' && onSaveConfiguredProduct) {
      onSaveConfiguredProduct(productWithPrice, config);
      return;
    }

    addToCart(productWithPrice, config);
  };

  const handleSubmitConfiguration = async () => {
    // Validate dimensions are selected
    if (isSkylight && (!config.brand || !config.blindType)) {
      alert('Please select a brand and blind type before adding to cart.');
      return;
    }
    if (!isSkylight && ((usesHeightOnlyVerticalPricing && config.height === 0) || (!usesHeightOnlyVerticalPricing && (config.width === 0 || config.height === 0)))) {
      alert(usesHeightOnlyVerticalPricing ? 'Please select height before adding to cart.' : 'Please select width and height before adding to cart.');
      return;
    }
    if (isMeasurementOutOfRange) {
      alert('Selected measurements are outside the allowed range for this product.');
      return;
    }
    if (isRequiredCustomizationIncomplete) {
      alert(formatMissingCustomizationsMessage(missingRequiredCustomizations));
      return;
    }
    if (isPerfectFitShutterConfigurationIncomplete) {
      alert(
        shutterHandlePositionRequired && !shutterHandlePositionValid
          ? `Handle position must be between ${PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM} mm and ${PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM} mm.`
          : 'Please complete the shutter options before adding to cart.'
      );
      return;
    }

    setIsValidating(true);

    try {
      // Validate price with backend
      const widthInches = isSkylight
        ? getSkylightPricingDimensions().widthInches
        : isReplacementVerticalSlat
          ? REPLACEMENT_VERTICAL_SLAT_FIXED_WIDTH_INCHES
          : getTotalInches(config.width, config.widthFraction, config.widthUnit);
      const heightInches = isSkylight
        ? getSkylightPricingDimensions().heightInches
        : getTotalInches(config.height, config.heightFraction, config.heightUnit);

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
        saveConfiguredProduct(productWithPrice);
      } else {
        // Price matches, proceed with cart
        const productWithPrice = {
          ...product,
          price: totalPrice,
        };
        saveConfiguredProduct(productWithPrice);
      }
    } catch (error) {
      console.error('Price validation failed:', error);
      // Fallback: add to cart anyway with frontend calculated price
      const productWithPrice = {
        ...product,
        price: totalPrice,
      };
      saveConfiguredProduct(productWithPrice);
    } finally {
      setIsValidating(false);
    }
  };

  const isModalPresentation = presentation === 'modal';
  const rootClassName = isModalPresentation
    ? 'bg-white relative z-20'
    : 'bg-white min-h-screen relative z-20';
  const bottomBarClassName = isModalPresentation
    ? 'sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50'
    : 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50';
  const submitLabel = mode === 'edit' ? 'Save Changes' : 'Add to Cart';
  const validatingLabel = mode === 'edit' ? 'Saving Changes...' : 'Adding to Cart...';

  return (
    <div className={rootClassName}>
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
                Estimated Delivery: <span className="text-[#335c99] font-medium">{getDeliveryDateRange(product.estimatedDelivery) ?? product.estimatedDelivery}</span>
              </p>

              {/* Configuration Title */}
              <h2 className="text-lg md:text-xl font-medium text-[#25344d] mb-4 md:mb-6 mt-6 md:mt-8">Configure Your Window Treatment</h2>

              <div className="space-y-8 divide-y divide-gray-100">
                {isSkylight && (
                  <div className="pt-6 first:pt-0 space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-[#25344d] mb-3">Brand</h3>
                      <div className="flex flex-wrap gap-3">
                        {SKYLIGHT_BRAND_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                brand: option.id,
                                blindType: prev.brand === option.id ? prev.blindType : null,
                              }))
                            }
                            className={`min-w-[96px] rounded-[12px] border px-4 py-3 text-sm font-medium transition-all ${
                              config.brand === option.id
                                ? 'border-[#25344d] bg-[#f5f7fb] text-[#25344d] shadow-sm'
                                : 'border-gray-200 bg-white text-[#4a5565] hover:border-[#8ca0bf] hover:text-[#25344d]'
                            }`}
                          >
                            {option.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <SimpleDropdown
                      label="Blind Type"
                      options={skylightBlindTypeOptions}
                      selectedValue={config.blindType}
                      onChange={(optionId) => setConfig({ ...config, blindType: optionId })}
                      placeholder={config.brand ? 'Select blind type' : 'Select brand first'}
                    />
                  </div>
                )}

                {/* Size Selector */}
                {product.features.hasSize && visibleOptions.showSize && (
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
                {product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && !isEasyStick && !isPerfectFitWooden && !isPerfectFitShutter && !isPerfectFitMetal && (
                  <div className="pt-6 relative z-[45]">
                    <InstallationMethodSelector
                      options={standardInstallationOptions}
                      selectedMethod={config.installationMethod}
                      onMethodChange={(methodId) => setConfig({ ...config, installationMethod: methodId })}
                    />
                  </div>
                )}

                {isPerfectFitWooden && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                  <div className="pt-6 relative z-[45]">
                    <SimpleDropdown
                      label={perfectFitWoodenLabels.installationMethod}
                      options={installationOptions}
                      selectedValue={config.installationMethod}
                      onChange={(optionId) => setConfig({ ...config, installationMethod: optionId })}
                      placeholder={`Select ${perfectFitWoodenLabels.installationMethod.toLowerCase()}`}
                    />
                  </div>
                )}

                {isPerfectFitShutter && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                  <div className="pt-6 relative z-[45]">
                    <SimpleDropdown
                      label={perfectFitShutterLabels.installationMethod}
                      options={installationOptions}
                      selectedValue={config.installationMethod}
                      onChange={(optionId) => setConfig({ ...config, installationMethod: optionId })}
                      placeholder={`Select ${perfectFitShutterLabels.installationMethod.toLowerCase()}`}
                    />
                  </div>
                )}

                {isPerfectFitMetal && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                  <div className="pt-6 relative z-[45]">
                    <SimpleDropdown
                      label={perfectFitMetalLabels.installationMethod}
                      options={installationOptions}
                      selectedValue={config.installationMethod}
                      onChange={(optionId) => setConfig({ ...config, installationMethod: optionId })}
                      placeholder={`Select ${perfectFitMetalLabels.installationMethod.toLowerCase()}`}
                    />
                  </div>
                )}

                {isEasyStick && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                  <div className="pt-6 relative z-[45]">
                    <SimpleDropdown
                      label={easyStickLabels.installationMethod}
                      options={installationOptions}
                      selectedValue={config.installationMethod}
                      onChange={(optionId) => setConfig({ ...config, installationMethod: optionId })}
                      placeholder={`Select ${easyStickLabels.installationMethod.toLowerCase()}`}
                    />
                  </div>
                )}

                {/* Control Option Selector */}
                {product.features.hasControlOption && visibleOptions.showControlOption && !isEasyStick && !isPerfectFitShutter && (
                  <div className="pt-6 relative z-[40]">
                    <ControlOptionSelector
                      options={controlOptions}
                      selectedOption={config.controlOption}
                      onOptionChange={(optionId) => setConfig({ ...config, controlOption: optionId })}
                      title={isFauxWooden ? 'Toggle' : 'Control Option'}
                    />
                  </div>
                )}

                {isPerfectFitShutter && product.features.hasControlOption && visibleOptions.showControlOption && (
                  <div className="pt-6 relative z-[40]">
                    <SimpleDropdown
                      label={perfectFitShutterLabels.controlOption}
                      options={controlOptions}
                      selectedValue={config.controlOption}
                      onChange={(optionId) =>
                        setConfig((prev) => ({
                          ...prev,
                          controlOption: optionId,
                          handlePosition: optionId === 'none' ? null : prev.handlePosition,
                        }))
                      }
                      placeholder={`Select ${perfectFitShutterLabels.controlOption.toLowerCase()}`}
                    />
                  </div>
                )}

                {isPerfectFitShutter && shutterHandlePositionRequired && (
                  <div className="pt-6 relative z-[39]">
                    <label className="text-sm font-medium text-[#1f2a44] block mb-3">
                      {perfectFitShutterLabels.handlePosition}
                    </label>
                    <div className={`rounded-xl border px-4 py-3 bg-white shadow-[0_1px_2px_rgba(31,42,68,0.06)] ${shutterHandlePositionRequired && !shutterHandlePositionValid && config.handlePosition ? 'border-[#c24646]' : 'border-[#c4d0e4]'}`}>
                      <div className="text-[10px] uppercase tracking-wide text-[#8d9ab1] mb-1">In mm</div>
                      <input
                        type="number"
                        min={PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM}
                        max={PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM}
                        value={config.handlePosition ?? ''}
                        onChange={(event) =>
                          setConfig((prev) => ({
                            ...prev,
                            handlePosition: event.target.value || null,
                          }))
                        }
                        placeholder={`${PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM}-${PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM}`}
                        className="w-full bg-transparent border-none p-0 text-base font-medium text-[#1f2a44] focus:outline-none"
                      />
                    </div>
                    <p className="mt-2 text-xs text-[#67748a]">
                      Allowed range: {PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM}-{PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM} mm
                    </p>
                  </div>
                )}

                {isEasyStick && product.features.hasControlOption && visibleOptions.showControlOption && (
                  <div className="pt-6 relative z-[40]">
                    <SimpleDropdown
                      label={easyStickLabels.controlOption}
                      options={controlOptions}
                      selectedValue={config.controlOption}
                      onChange={(optionId) => setConfig({ ...config, controlOption: optionId })}
                      placeholder={`Select ${easyStickLabels.controlOption.toLowerCase()}`}
                    />
                  </div>
                )}

                {visibleOptions.showLiningType && (
                  <div className="pt-6 relative z-[38]">
                    <LiningTypeSelector
                      options={LINING_TYPE_OPTIONS}
                      selectedLiningType={config.liningType}
                      onLiningTypeChange={(optionId) => setConfig({ ...config, liningType: optionId })}
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
                {product.features.hasControlSide && visibleOptions.showControlSide && !isEasyStick && !isPerfectFitWooden && !isPerfectFitMetal && (
                  <div className="pt-6 relative z-[32]">
                    <ControlSideSelector
                      options={CONTROL_SIDE_OPTIONS}
                      selectedSide={config.controlSide}
                      onSideChange={(sideId) => setConfig({ ...config, controlSide: sideId })}
                    />
                  </div>
                )}

                {isPerfectFitWooden && product.features.hasControlSide && visibleOptions.showControlSide && (
                  <div className="pt-6 relative z-[32]">
                    <SimpleDropdown
                      label={perfectFitWoodenLabels.controlSide}
                      options={controlSideOptions}
                      selectedValue={config.controlSide}
                      onChange={(optionId) => setConfig({ ...config, controlSide: optionId })}
                      placeholder={`Select ${perfectFitWoodenLabels.controlSide.toLowerCase()}`}
                    />
                  </div>
                )}

                {isPerfectFitMetal && product.features.hasControlSide && visibleOptions.showControlSide && (
                  <div className="pt-6 relative z-[32]">
                    <SimpleDropdown
                      label={perfectFitMetalLabels.controlSide}
                      options={controlSideOptions}
                      selectedValue={config.controlSide}
                      onChange={(optionId) => setConfig({ ...config, controlSide: optionId })}
                      placeholder={`Select ${perfectFitMetalLabels.controlSide.toLowerCase()}`}
                    />
                  </div>
                )}

                {isEasyStick && product.features.hasControlSide && visibleOptions.showControlSide && (
                  <div className="pt-6 relative z-[32]">
                    <SimpleDropdown
                      label={easyStickLabels.controlSide || 'Control Side'}
                      options={easyStickControlSideOptions}
                      selectedValue={config.controlSide}
                      onChange={(optionId) => setConfig({ ...config, controlSide: optionId })}
                      placeholder={`Select ${(easyStickLabels.controlSide || 'control side').toLowerCase()}`}
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
                {product.features.hasBracketType && visibleOptions.showBracketType && !isPerfectFitWooden && !isPerfectFitShutter && !isPerfectFitMetal && (
                  <div className="pt-6 relative z-20">
                    <BracketTypeSelector
                      options={BRACKET_TYPE_OPTIONS}
                      selectedBracket={config.bracketType}
                      onBracketChange={(bracketId) => setConfig({ ...config, bracketType: bracketId })}
                    />
                  </div>
                )}

                {isPerfectFitShutter && product.features.hasBracketType && visibleOptions.showBracketType && (
                  <div className="pt-6 relative z-20">
                    <SimpleDropdown
                      label={perfectFitShutterLabels.bracketType}
                      options={PERFECT_FIT_SHUTTER_BRACKET_SIZE_OPTIONS}
                      selectedValue={config.bracketType}
                      onChange={(optionId) => setConfig({ ...config, bracketType: optionId })}
                      placeholder={`Select ${perfectFitShutterLabels.bracketType.toLowerCase()}`}
                    />
                  </div>
                )}

                {isPerfectFitWooden && product.features.hasBracketType && visibleOptions.showBracketType && (
                  <div className="pt-6 relative z-20">
                    <SimpleDropdown
                      label={perfectFitWoodenLabels.bracketType}
                      options={PERFECT_FIT_WOODEN_BRACKET_SIZE_OPTIONS}
                      selectedValue={config.bracketType}
                      onChange={(optionId) => setConfig({ ...config, bracketType: optionId })}
                      placeholder={`Select ${perfectFitWoodenLabels.bracketType.toLowerCase()}`}
                    />
                  </div>
                )}

                {isPerfectFitShutter && (
                  <div className="pt-6 relative z-[19]">
                    <SimpleDropdown
                      label={perfectFitShutterLabels.numberOfPanels}
                      options={shutterPanelOptions}
                      selectedValue={config.numberOfPanels}
                      onChange={() => undefined}
                      placeholder="Select size first"
                    />
                  </div>
                )}

                {isPerfectFitMetal && product.features.hasBracketType && visibleOptions.showBracketType && (
                  <div className="pt-6 relative z-20">
                    <SimpleDropdown
                      label={perfectFitMetalLabels.bracketType}
                      options={PERFECT_FIT_METAL_BRACKET_SIZE_OPTIONS}
                      selectedValue={config.bracketType}
                      onChange={(optionId) => setConfig({ ...config, bracketType: optionId })}
                      placeholder={`Select ${perfectFitMetalLabels.bracketType.toLowerCase()}`}
                    />
                  </div>
                )}

                {/* Chain Color Selector */}
                {product.features.hasChainColor && visibleOptions.showChainColor && !isSpecialMotorized && (
                  <div className="pt-6 relative z-10">
                    <ChainColorSelector
                      options={chainColorOptions}
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

                {(isEasyStick || isPerfectFitWooden || isPerfectFitMetal) && product.features.hasFrameColor && visibleOptions.showFrameColor && (
                  <div className="pt-6 relative z-[2.4]">
                    <SimpleDropdown
                      label={isPerfectFitWooden ? perfectFitWoodenLabels.frameColor : isPerfectFitMetal ? perfectFitMetalLabels.frameColor : easyStickLabels.frameColor || 'Profile Color'}
                      options={frameColorOptions}
                      selectedValue={config.frameColor}
                      onChange={(optionId) => setConfig({ ...config, frameColor: optionId })}
                      placeholder={`Select ${(isPerfectFitWooden ? perfectFitWoodenLabels.frameColor : isPerfectFitMetal ? perfectFitMetalLabels.frameColor : easyStickLabels.frameColor || 'profile color').toLowerCase()}`}
                    />
                  </div>
                )}

                {/* Motorization Selector */}
                {(product.features.hasMotorization || isSpecialMotorized) && (
                  <div className="pt-6 relative z-[2]">
                    {isSpecialMotorized ? (
                      <SimpleDropdown
                        label="Remote Control"
                        options={motorizedRemoteOptions}
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

                <div className="pt-6 relative z-[1]">
                  <RoomTypeSelector
                    options={ROOM_TYPE_OPTIONS}
                    selectedRoomType={config.roomType}
                    onRoomTypeChange={(roomTypeId) => setConfig({ ...config, roomType: roomTypeId })}
                    blindName={config.blindName}
                    onBlindNameChange={(value) => setConfig({ ...config, blindName: value || null })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className={bottomBarClassName}>
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
                  {isSkylight
                    ? 'Base price plus selected skylight blind type.'
                    : usesHeightOnlyVerticalPricing
                    ? `Height-only pricing: ${getTotalInches(config.height, config.heightFraction, config.heightUnit).toFixed(2)}"`
                    : `Size: ${priceCalculation.widthBand?.inches}" × ${priceCalculation.heightBand?.inches}"`}
                </div>
              )}
            </div>
            <button
              onClick={handleSubmitConfiguration}
              disabled={isValidating || showMinPriceIndicator || isMeasurementOutOfRange || isRequiredCustomizationIncomplete || isPerfectFitShutterConfigurationIncomplete}
              className={`py-2.5 md:py-3 px-6 md:px-8 rounded text-sm md:text-base font-medium transition-colors ${isValidating || showMinPriceIndicator || isMeasurementOutOfRange || isRequiredCustomizationIncomplete || isPerfectFitShutterConfigurationIncomplete
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-[#335c99] text-white hover:bg-[#244779]'
                }`}
            >
              {isValidating ? validatingLabel : isMeasurementOutOfRange ? 'Selected Size Not Available' : isPerfectFitShutterConfigurationIncomplete ? 'Complete Shutter Options' : submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;
