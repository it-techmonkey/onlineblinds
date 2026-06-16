'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product, ProductConfiguration, DEFAULT_CONFIGURATION, PriceBandMatrix, CustomizationPricing as CustomizationPricingType } from '@/types';
import { useCart } from '@/context/CartContext';
import ProductGallery from './ProductGallery';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import CategoryInfoSection from '@/components/collection/CategoryInfoSection';
import { formatPrice, formatPriceWithCurrency, fetchPriceMatrix, fetchCustomizationPricing, validateCartPrice } from '@/lib/api';
import { getMeasurementRanges } from '@/lib/measurement-ranges';
import { PRODUCT_GUIDES } from '@/data/guides';
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
import { trackShopifyProductView } from '@/lib/shopify-analytics';
import {
  SizeSelector,
  RoomTypeSelector,
  HeadrailSelector,
  HeadrailColourSelector,
  InstallationMethodSelector,
  LiningTypeSelector,
  ControlOptionSelector,
  StackingSelector,
  BottomChainSelector,
  BracketTypeSelector,
  SimpleDropdown,
  RollStyleSelector,
  OpeningDirectionSelector,
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
  BLIND_COLOR_OPTIONS,
  FRAME_COLOR_OPTIONS,
  OPENING_DIRECTION_OPTIONS,
  BOTTOM_BAR_OPTIONS,
  ROLL_STYLE_OPTIONS
} from '@/data/customizations';
import { ROOM_TYPE_OPTIONS } from '@/data/roomTypes';
import { CONTINUOUS_CHAIN_CARD, CONTINUOUS_CHAIN_CARD_ROLLER, CONTINUOUS_CHAIN_CARD_ZEBRA, CASSETTE_CARD, CASSETTE_CARD_ROLLER, CASSETTE_CARD_ZEBRA, MOTORIZATION_CARD, BOTTOM_BAR_CARD } from '@/data/optionalCustomizations';
import Image from 'next/image';
import { isRomanProduct } from '@/lib/roman-blinds';
import ProductUrgencyBar from './ProductUrgencyBar';
import ProductTrustStrip from './ProductTrustStrip';

// Compact inline star rating shown below the product title
function ProductRatingBadge({ productSlug }: { productSlug: string }) {
  const [rating, setRating] = useState<{ avg: number; total: number } | null>(null);

  useEffect(() => {
    fetch(`/api/reviews/${encodeURIComponent(productSlug)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d && d.totalReviews > 0) setRating({ avg: d.averageRating, total: d.totalReviews });
      })
      .catch(() => {});
  }, [productSlug]);

  if (!rating) return null;

  const stars = [1, 2, 3, 4, 5].map((i) => {
    const filled = i <= Math.floor(rating.avg);
    const half = !filled && i === Math.ceil(rating.avg) && !Number.isInteger(rating.avg);
    return { i, filled, half };
  });

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="flex items-center gap-0.5 text-gold">
        {stars.map(({ i, filled, half }) => (
          <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={filled || half ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </span>
      <span className="text-sm font-semibold text-foreground">{rating.avg.toFixed(1)}</span>
      <span className="text-sm text-muted">({rating.total} {rating.total === 1 ? 'review' : 'reviews'})</span>
    </div>
  );
}

function withBottomBarPricing(
  customizations: CustomizationPricingType[]
): CustomizationPricingType[] {
  return [
    ...customizations,
    ...BOTTOM_BAR_OPTIONS.map((option) => ({
      category: 'bottom-bar',
      optionId: option.id,
      name: option.name,
      prices: [{ widthMm: null, price: option.price || 0 }],
    })),
  ];
}

interface ProductPageProps {
  product: Product;
  relatedProducts: Product[];
  initialPriceMatrix?: PriceBandMatrix | null;
  initialCustomizationPricing?: CustomizationPricingType[];
}

const ProductPage = ({
  product,
  relatedProducts,
  initialPriceMatrix = null,
  initialCustomizationPricing = [],
}: ProductPageProps) => {
  const { addToCart } = useCart();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackShopifyProductView(product);
  }, [product]);

  const [config, setConfig] = useState<ProductConfiguration>({
    ...DEFAULT_CONFIGURATION,
    width: 0,
    widthFraction: '0',
    height: 0,
    heightFraction: '0',
  });

  // State for pricing data from backend
  const [priceMatrix, setPriceMatrix] = useState<PriceBandMatrix | null>(initialPriceMatrix);
  const [customizationPricing, setCustomizationPricing] = useState<CustomizationPricingType[]>(
    () => withBottomBarPricing(initialCustomizationPricing)
  );
  const [isValidating, setIsValidating] = useState(false);
  const customizationFetchingRef = useRef(false);
  const matrixFetchingRef = useRef(false);

  // Collapsible sections state
  const [isMeasureOpen, setIsMeasureOpen] = useState(true);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(true);

  // Selected optional customization cards (multi-select)
  const [selectedOptionalCards, setSelectedOptionalCards] = useState<{
    continuousChain: boolean;
    cassette: boolean;
    motorization: boolean;
    bottomBar: boolean;
  }>({
    continuousChain: false,
    cassette: false,
    motorization: false,
    bottomBar: false,
  });

  // Force motorization when arriving from a motorised collection page (e.g. Motorised EclipseCore)
  const forceMotorization = searchParams.get('motorized') === 'true';
  const isSpecialMotorized = useMemo(
    () => isSpecialMotorizedProduct(product.tags),
    [product.tags]
  );
  const motorizedRemoteOptions = useMemo(
    () => getMotorizedRemoteOptions(MOTORIZATION_OPTIONS),
    []
  );

  // Pre-select motorization when arriving from a motorised collection page
  useEffect(() => {
    if (forceMotorization || isSpecialMotorized) {
      setSelectedOptionalCards((prev) => ({
        ...prev,
        motorization: true,
        continuousChain: false,
      }));
      setConfig((prev) => ({
        ...prev,
        chainColor: null,
        controlSide: null,
        motorization:
          isSpecialMotorized && !prev.motorization
            ? motorizedRemoteOptions[0]?.id ?? null
            : prev.motorization,
      }));
    }
  }, [forceMotorization, isSpecialMotorized, motorizedRemoteOptions]);

  // Fetch customization pricing on mount
  useEffect(() => {
    if (initialCustomizationPricing.length > 0) {
      return;
    }
    if (customizationFetchingRef.current) {
      return;
    }

    customizationFetchingRef.current = true;
    let isMounted = true;

    const loadCustomizationPricing = async () => {
      try {
        const customizations = await fetchCustomizationPricing();

        if (isMounted) {
          setCustomizationPricing(withBottomBarPricing(customizations));
        }
      } catch (error) {
        console.error('Failed to load customization pricing:', error);
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
  }, [initialCustomizationPricing.length, product.slug]);

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

  const guideType = useMemo(() => {
    const cat = product.category.toLowerCase();
    if (isSpecialMotorized && (cat.includes('day') || cat.includes('night') || cat.includes('zebra'))) return 'zebra' as const;
    if (isSpecialMotorized)                                             return 'roller' as const;
    if (cat.includes('vertical'))                                               return 'vertical' as const;
    if (isSkylight)                                                           return null;
    if (isEasyStick)                                                           return null;
    if (cat.includes('no drill'))                                               return 'roller' as const;
    if (cat.includes('zebra') || cat.includes('day') || cat.includes('night')) return 'zebra' as const;
    if (cat.includes('roller'))                                                return 'roller' as const;
    return null;
  }, [isEasyStick, isSkylight, isSpecialMotorized, product.category]);

  const guideLinks = useMemo(() => {
    if (guideType) {
      return PRODUCT_GUIDES[guideType];
    }

    // Fallback so both guide buttons are always available.
    return {
      installation: '/guides',
      measurement: '/guides',
    };
  }, [guideType]);

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
  const continuousChainCard = isDayNight
    ? CONTINUOUS_CHAIN_CARD_ZEBRA
    : (isRollerOrDayNight || isRoman)
    ? CONTINUOUS_CHAIN_CARD_ROLLER
    : CONTINUOUS_CHAIN_CARD;
  const cassetteCard = isDayNight ? CASSETTE_CARD_ZEBRA : isRollerOrDayNight ? CASSETTE_CARD_ROLLER : CASSETTE_CARD;

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

  // Fetch matrix pricing only for width-based paths
  useEffect(() => {
    if (!shouldFetchPriceMatrix) {
      setPriceMatrix(null);
      return;
    }
    if (initialPriceMatrix) {
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
  }, [initialPriceMatrix, product.slug, shouldFetchPriceMatrix]);

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
  }, [usesHeightOnlyVerticalPricing]);

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
  }, [isPerfectFitShutter, shutterPanelOption]);

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
        showBlindColor: false,
        showFrameColor: false,
        showOpeningDirection: false,
        showBottomBar: false,
        showRollStyle: false,
      };
    }

    // Categories that use direct feature visibility without vertical headrail logic
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
        showBlindColor: product.features.hasBlindColor,
        showFrameColor: isEasyStick
          ? product.features.hasFrameColor && (easyStickSubtype === 'honeycomb' || easyStickSubtype === 'wood')
          : isPerfectFitWooden
          ? product.features.hasFrameColor
          : isPerfectFitShutter
          ? product.features.hasFrameColor
          : isPerfectFitMetal
          ? product.features.hasFrameColor
          : product.features.hasFrameColor,
        showOpeningDirection: product.features.hasOpeningDirection,
        showBottomBar: product.features.hasBottomBar,
        showRollStyle: product.features.hasRollStyle,
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
        showBlindColor: false,
        showFrameColor: false,
        showOpeningDirection: false,
        showBottomBar: false,
        showRollStyle: false,
      };
    }

    // For vertical blinds (with headrail)
    return {
      // Size and Headrail are always visible
      showSize: product.features.hasSize,
      showHeadrail: product.features.hasHeadrail,

      // Headrail Colour only for Platinum
      showHeadrailColour: product.features.hasHeadrailColour && config.headrail === 'platinum',

      // Installation Method remains available for regular vertical blinds
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

      showBlindColor: product.features.hasBlindColor,
      showFrameColor: product.features.hasFrameColor,
      showOpeningDirection: product.features.hasOpeningDirection,
      showBottomBar: product.features.hasBottomBar,
      showRollStyle: product.features.hasRollStyle,
    };
  }, [config.headrail, easyStickSubtype, isReplacementVerticalSlat, isRollerOrDayNight, isRoman, isVenetian, isNoDrill, isEasyStick, isFauxWooden, isPerfectFitWooden, isPerfectFitShutter, isPerfectFitMetal, isSkylight, product.features]);

  const hasCustomizeSection = useMemo(() => {
    return (
      isSkylight ||
      product.features.hasHeadrail ||
      (product.features.hasHeadrailColour && visibleOptions.showHeadrailColour) ||
      (isEasyStick && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod) ||
      (product.features.hasControlOption && visibleOptions.showControlOption) ||
      (isEasyStick && product.features.hasControlSide && visibleOptions.showControlSide) ||
      visibleOptions.showLiningType ||
      (product.features.hasStacking && visibleOptions.showStacking) ||
      (product.features.hasBottomChain && visibleOptions.showBottomChain) ||
      (product.features.hasBracketType && visibleOptions.showBracketType) ||
      (product.features.hasBlindColor && visibleOptions.showBlindColor) ||
      (product.features.hasFrameColor && visibleOptions.showFrameColor) ||
      (product.features.hasOpeningDirection && visibleOptions.showOpeningDirection) ||
      (product.features.hasBottomBar && visibleOptions.showBottomBar) ||
      (product.features.hasChainColor && visibleOptions.showChainColor) ||
      product.features.hasWrappedCassette ||
      product.features.hasCassetteMatchingBar ||
      product.features.hasRollerCassette ||
      product.features.hasMotorization ||
      forceMotorization ||
      isSpecialMotorized
    );
  }, [forceMotorization, isEasyStick, isSkylight, isSpecialMotorized, product.features, visibleOptions]);

  const hasOptionalCustomizationCards = useMemo(() => {
    return (
      (product.features.hasBottomBar && visibleOptions.showBottomBar) ||
      (product.features.hasChainColor && visibleOptions.showChainColor && !isSpecialMotorized) ||
      product.features.hasWrappedCassette ||
      product.features.hasCassetteMatchingBar ||
      product.features.hasRollerCassette ||
      product.features.hasMotorization ||
      forceMotorization ||
      isSpecialMotorized
    );
  }, [forceMotorization, isSpecialMotorized, product.features, visibleOptions]);

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
      rollStyle: visibleOptions.showRollStyle ? config.rollStyle : null,
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

  // Show minimum price indicator when no dimensions selected
  const showMinPriceIndicator = isSkylight
    ? !config.blindType
    : usesHeightOnlyVerticalPricing
      ? config.height === 0
      : config.width === 0 || config.height === 0;

  // Calculate dynamic size ranges from price band
  const sizeRanges = useMemo(() => {
    return getMeasurementRanges(priceMatrix);
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
      selectedOptionalCards,
      forceMotorization,
      requireVisibleControlSide:
        isEasyStick ||
        isPerfectFitWooden ||
        isPerfectFitShutter ||
        isPerfectFitMetal ||
        (!product.features.hasChainColor && visibleOptions.showControlSide),
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
    forceMotorization,
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
    selectedOptionalCards,
    visibleOptions,
  ]);
  const isRequiredCustomizationIncomplete = missingRequiredCustomizations.length > 0;

  const handleAddToCart = async () => {
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
    <div className="bg-white">
      {/* Breadcrumb */}
      <div className="px-4 md:px-6 lg:px-16 py-4 md:py-5">
        <div className="max-w-[1320px] mx-auto">
          <nav className="flex items-center gap-2 text-xs md:text-sm text-muted tracking-[0.02em]">
            <Link href="/collections" className="hover:text-primary transition-colors">Back to Shop</Link>
            <span>&gt;</span>
            <span className="text-foreground truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="px-4 md:px-6 lg:px-16 pb-10 md:pb-14">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-7 md:gap-10 lg:gap-12">
            {/* Left - Gallery with Thumbnails on Left */}
            <div className="w-full lg:w-[52%] lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-[20px] border border-border bg-surface p-3 md:p-4 shadow-[0_8px_26px_rgba(31,41,51,0.06)]">
                <ProductGallery images={product.images} videos={product.videos} productName={product.name} />
              </div>
            </div>

            {/* Right - Product Info */}
            <div className="w-full lg:w-[48%]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted mb-2">
                {product.category}
              </p>
              {/* Product Title */}
              <h1 className="font-display text-[34px] leading-[1.05] md:text-[42px] md:leading-[1.04] font-semibold text-foreground mb-2">
                {product.name}
              </h1>

              {/* Rating badge */}
              <ProductRatingBadge productSlug={product.slug} />

              {/* Shipping Info Box */}
              <div className="flex items-center border border-border rounded-[16px] mb-5 md:mb-6 px-3 md:px-4 py-3 bg-surface shadow-[0_4px_14px_rgba(31,41,51,0.04)]">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-soft rounded-[12px] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <div className="ml-2 md:ml-3">
                  <div className="text-[10px] md:text-xs text-muted">Estimated Delivery Date</div>
                  <div className="text-xs md:text-sm font-semibold text-foreground">12 Working Days</div>
                </div>
              </div>

              {/* Urgency Bar */}
              <div className="mb-5 md:mb-6">
                <ProductUrgencyBar productSlug={product.slug} />
              </div>

              {/* Price Section */}
              <div className="border border-border rounded-[16px] p-4 md:p-6 mb-5 md:mb-6 bg-surface shadow-[0_6px_18px_rgba(31,41,51,0.05)]">
                <div className="flex flex-col items-center lg:items-start">
                  <div className="flex items-baseline gap-3 mb-2 md:mb-3">
                    <span className="text-2xl md:text-[34px] leading-none font-semibold text-foreground">
                      {showMinPriceIndicator
                        ? formatPriceWithCurrency(formatPrice(product.price), product.currency)
                        : formatPriceWithCurrency(formatPrice(totalPrice), product.currency)
                      }
                    </span>
                    <span className="text-base md:text-xl text-muted line-through">
                      {showMinPriceIndicator
                        ? formatPriceWithCurrency(formatPrice(Math.round(product.price * 1.67)), product.currency)
                        : formatPriceWithCurrency(formatPrice(Math.round(totalPrice * 1.67)), product.currency)
                      }
                    </span>
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700">
                      Save 40%
                    </span>
                  </div>
                  {priceCalculation && !showMinPriceIndicator && (
                    <div className="text-xs text-muted mb-1">
                      {isSkylight
                        ? 'Base price plus selected skylight blind type.'
                        : usesHeightOnlyVerticalPricing
                        ? `Height-only pricing: ${getTotalInches(config.height, config.heightFraction, config.heightUnit).toFixed(2)}"`
                        : `Size: ${priceCalculation.widthBand?.inches}" × ${priceCalculation.heightBand?.inches}"`}
                    </div>
                  )}
                </div>
              </div>

              {/* Customization Sections */}
              <div className="space-y-5">
                {/* Measure your windows - Collapsible Section */}
                {!isSkylight && (
                <div className="border border-border rounded-[16px] overflow-hidden bg-surface shadow-[0_4px_16px_rgba(31,41,51,0.04)]">
                  <button
                    onClick={() => setIsMeasureOpen(!isMeasureOpen)}
                    className="w-full flex items-center justify-between p-4 md:p-5 bg-surface-soft hover:bg-surface-contrast transition-colors"
                    aria-expanded={isMeasureOpen}
                  >
                    <h2 className="text-lg font-medium text-foreground">Measure your windows</h2>
                    <div className="shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center ml-3">
                      {isMeasureOpen ? (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {isMeasureOpen && (
                    <div className="p-4 md:p-6 space-y-6 bg-surface">
                      {/* Size Selector */}
                      {product.features.hasSize && (
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
                      )}

                      {/* Installation Method Selector */}
                      {product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && !isEasyStick && !isPerfectFitWooden && !isPerfectFitShutter && !isPerfectFitMetal && (
                        <InstallationMethodSelector
                          options={standardInstallationOptions}
                          selectedMethod={config.installationMethod}
                          onMethodChange={(methodId) => setConfig({ ...config, installationMethod: methodId })}
                        />
                      )}

                      {isPerfectFitWooden && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                        <SimpleDropdown
                          label={perfectFitWoodenLabels.installationMethod}
                          options={installationOptions}
                          selectedValue={config.installationMethod}
                          onChange={(optionId) => setConfig({ ...config, installationMethod: optionId })}
                          placeholder={`Select ${perfectFitWoodenLabels.installationMethod.toLowerCase()}`}
                        />
                      )}

                      {isPerfectFitShutter && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                        <SimpleDropdown
                          label={perfectFitShutterLabels.installationMethod}
                          options={installationOptions}
                          selectedValue={config.installationMethod}
                          onChange={(optionId) => setConfig({ ...config, installationMethod: optionId })}
                          placeholder={`Select ${perfectFitShutterLabels.installationMethod.toLowerCase()}`}
                        />
                      )}

                      {isPerfectFitMetal && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                        <SimpleDropdown
                          label={perfectFitMetalLabels.installationMethod}
                          options={installationOptions}
                          selectedValue={config.installationMethod}
                          onChange={(optionId) => setConfig({ ...config, installationMethod: optionId })}
                          placeholder={`Select ${perfectFitMetalLabels.installationMethod.toLowerCase()}`}
                        />
                      )}



                      {/* Blind Name Selector (Room Type dropdown AND input) */}
                      <RoomTypeSelector
                        options={ROOM_TYPE_OPTIONS}
                        selectedRoomType={config.roomType}
                        onRoomTypeChange={(roomTypeId) => setConfig({ ...config, roomType: roomTypeId })}
                        blindName={config.blindName}
                        onBlindNameChange={(value) => setConfig({ ...config, blindName: value || null })}
                      />

                      {/* Roll Style Selector */}
                      {product.features.hasRollStyle && visibleOptions.showRollStyle && (
                        <RollStyleSelector
                          options={ROLL_STYLE_OPTIONS}
                          selectedRollStyle={config.rollStyle}
                          onRollStyleChange={(styleId) => setConfig({ ...config, rollStyle: styleId })}
                        />
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Customize your order - Collapsible Section */}
                {hasCustomizeSection && (
                  <div className="border border-border rounded-[16px] overflow-hidden bg-surface shadow-[0_4px_16px_rgba(31,41,51,0.04)]">
                    <button
                      onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
                      className="w-full flex items-center justify-between p-4 md:p-5 bg-surface-soft hover:bg-surface-contrast transition-colors"
                      aria-expanded={isCustomizeOpen}
                    >
                      <h2 className="text-lg font-medium text-foreground">Customize your blind</h2>
                      <div className="shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center ml-3">
                        {isCustomizeOpen ? (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </div>
                    </button>

                    {isCustomizeOpen && (
                      <div className="p-4 md:p-6 space-y-6 divide-y divide-border bg-surface">
                      {isSkylight && (
                        <div className="pt-0 first:pt-0 pb-6 space-y-6">
                          <div>
                            <h3 className="text-sm font-medium text-foreground mb-3">Brand</h3>
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
                                      ? 'border-primary bg-surface-soft text-foreground shadow-sm'
                                      : 'border-border bg-surface text-muted hover:border-border-strong hover:text-foreground'
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

                      {/* Headrail Selector */}
                      {product.features.hasHeadrail && (
                        <div className="pt-0 first:pt-0 pb-6">
                          <HeadrailSelector
                            options={HEADRAIL_OPTIONS}
                            selectedHeadrail={config.headrail}
                            onHeadrailChange={(headrailId) => setConfig({ ...config, headrail: headrailId })}
                          />
                        </div>
                      )}

                      {/* Headrail Colour Selector */}
                      {product.features.hasHeadrailColour && visibleOptions.showHeadrailColour && (
                        <div className="pt-6">
                          <HeadrailColourSelector
                            options={HEADRAIL_COLOUR_OPTIONS}
                            selectedColour={config.headrailColour}
                            onColourChange={(colourId) => setConfig({ ...config, headrailColour: colourId })}
                          />
                        </div>
                      )}

                      {/* Control Option Selector */}
                      {product.features.hasControlOption && visibleOptions.showControlOption && !isRoman && !isEasyStick && !isPerfectFitShutter && (
                        <div className="pt-6">
                          <ControlOptionSelector
                            options={controlOptions}
                            selectedOption={config.controlOption}
                            onOptionChange={(optionId) => setConfig({ ...config, controlOption: optionId })}
                            title={isFauxWooden ? 'Toggle' : 'Control Option'}
                          />
                        </div>
                      )}

                      {isPerfectFitShutter && product.features.hasControlOption && visibleOptions.showControlOption && (
                        <div className="pt-6">
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
                        <div className="pt-6">
                          <label className="text-sm font-medium text-foreground block mb-3">
                            {perfectFitShutterLabels.handlePosition}
                          </label>
                          <div className={`rounded-[12px] border px-4 py-3 bg-white shadow-[0_1px_2px_rgba(31,42,68,0.06)] ${shutterHandlePositionRequired && !shutterHandlePositionValid && config.handlePosition ? 'border-[#c24646]' : 'border-border'}`}>
                            <div className="text-[10px] uppercase tracking-wide text-muted mb-1">In mm</div>
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
                              className="w-full bg-transparent border-none p-0 text-base font-medium text-foreground focus:outline-none"
                            />
                          </div>
                          <p className="mt-2 text-xs text-muted">
                            Allowed range: {PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM}-{PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM} mm
                          </p>
                        </div>
                      )}

                      {isEasyStick && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                        <div className="pt-6">
                          <SimpleDropdown
                            label={easyStickLabels.installationMethod}
                            options={installationOptions}
                            selectedValue={config.installationMethod}
                            onChange={(optionId) => setConfig({ ...config, installationMethod: optionId })}
                            placeholder={`Select ${easyStickLabels.installationMethod.toLowerCase()}`}
                          />
                        </div>
                      )}

                      {isEasyStick && product.features.hasControlOption && visibleOptions.showControlOption && (
                        <div className="pt-6">
                          <SimpleDropdown
                            label={easyStickLabels.controlOption}
                            options={controlOptions}
                            selectedValue={config.controlOption}
                            onChange={(optionId) => setConfig({ ...config, controlOption: optionId })}
                            placeholder={`Select ${easyStickLabels.controlOption.toLowerCase()}`}
                          />
                        </div>
                      )}

                      {isPerfectFitWooden && product.features.hasControlSide && visibleOptions.showControlSide && (
                        <div className="pt-6">
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
                        <div className="pt-6">
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
                        <div className="pt-6">
                          <SimpleDropdown
                            label={easyStickLabels.controlSide || 'Control Side'}
                            options={easyStickControlSideOptions}
                            selectedValue={config.controlSide}
                            onChange={(optionId) => setConfig({ ...config, controlSide: optionId })}
                            placeholder={`Select ${(easyStickLabels.controlSide || 'control side').toLowerCase()}`}
                          />
                        </div>
                      )}

                      {visibleOptions.showLiningType && (
                        <div className="pt-6">
                          <LiningTypeSelector
                            options={LINING_TYPE_OPTIONS}
                            selectedLiningType={config.liningType}
                            onLiningTypeChange={(liningTypeId) => setConfig({ ...config, liningType: liningTypeId })}
                          />
                        </div>
                      )}

                      {/* Stacking Selector */}
                      {product.features.hasStacking && visibleOptions.showStacking && (
                        <div className="pt-6">
                          <StackingSelector
                            options={stackingOptions}
                            selectedStacking={config.stacking}
                            onStackingChange={(stackingId) => setConfig({ ...config, stacking: stackingId })}
                          />
                        </div>
                      )}


                      {/* Bottom Chain Selector */}
                      {product.features.hasBottomChain && visibleOptions.showBottomChain && (
                        <div className="pt-6">
                          <BottomChainSelector
                            options={BOTTOM_CHAIN_OPTIONS.filter(opt => !('pvcOnly' in opt) || product.features.hasPvcFabric)}
                            selectedChain={config.bottomChain}
                            onChainChange={(chainId) => setConfig({ ...config, bottomChain: chainId })}
                          />
                        </div>
                      )}

                      {/* Bracket Type Selector */}
                      {product.features.hasBracketType && visibleOptions.showBracketType && !isPerfectFitWooden && !isPerfectFitShutter && !isPerfectFitMetal && (
                        <div className="pt-6">
                          <BracketTypeSelector
                            options={BRACKET_TYPE_OPTIONS}
                            selectedBracket={config.bracketType}
                            onBracketChange={(bracketId) => setConfig({ ...config, bracketType: bracketId })}
                          />
                        </div>
                      )}

                      {isPerfectFitShutter && product.features.hasBracketType && visibleOptions.showBracketType && (
                        <div className="pt-6">
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
                        <div className="pt-6">
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
                        <div className="pt-6">
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
                        <div className="pt-6">
                          <SimpleDropdown
                            label={perfectFitMetalLabels.bracketType}
                            options={PERFECT_FIT_METAL_BRACKET_SIZE_OPTIONS}
                            selectedValue={config.bracketType}
                            onChange={(optionId) => setConfig({ ...config, bracketType: optionId })}
                            placeholder={`Select ${perfectFitMetalLabels.bracketType.toLowerCase()}`}
                          />
                        </div>
                      )}

                      {/* Blind Color Selector */}
                      {product.features.hasBlindColor && visibleOptions.showBlindColor && (
                        <div className="pt-6">
                          <h3 className="text-sm font-medium text-foreground mb-3">Blind Color</h3>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {BLIND_COLOR_OPTIONS.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => setConfig({ ...config, blindColor: option.id })}
                                className={`flex flex-col items-center justify-center p-2 border-2 rounded-[12px] transition-all ${config.blindColor === option.id
                                  ? 'border-primary bg-surface-soft'
                                  : 'border-border hover:border-border-strong'
                                  }`}
                              >
                                <div className="w-full aspect-square relative mb-1.5 rounded overflow-hidden shadow-sm">
                                  <div
                                    className={`w-full h-full ${option.id === 'white' ? 'border border-gray-100' : ''}`}
                                    style={{ backgroundColor: option.hex }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-center text-foreground">{option.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Frame Color Selector */}
                      {product.features.hasFrameColor && visibleOptions.showFrameColor && !isEasyStick && !isPerfectFitWooden && !isPerfectFitMetal && (
                        <div className="pt-6">
                          <h3 className="text-sm font-medium text-foreground mb-3">Frame Color</h3>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {FRAME_COLOR_OPTIONS.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => setConfig({ ...config, frameColor: option.id })}
                                className={`flex flex-col items-center justify-center p-2 border-2 rounded-[12px] transition-all ${config.frameColor === option.id
                                  ? 'border-primary bg-surface-soft'
                                  : 'border-border hover:border-border-strong'
                                  }`}
                              >
                                <div className="w-full aspect-square relative mb-1.5 rounded overflow-hidden shadow-sm">
                                  <div
                                    className={`w-full h-full ${option.id === 'white' ? 'border border-gray-100' : ''}`}
                                    style={{ backgroundColor: option.hex }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-center text-foreground">{option.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {(isEasyStick || isPerfectFitWooden || isPerfectFitMetal) && product.features.hasFrameColor && visibleOptions.showFrameColor && (
                        <div className="pt-6">
                          <SimpleDropdown
                            label={isPerfectFitWooden ? perfectFitWoodenLabels.frameColor : isPerfectFitMetal ? perfectFitMetalLabels.frameColor : easyStickLabels.frameColor || 'Profile Color'}
                            options={frameColorOptions}
                            selectedValue={config.frameColor}
                            onChange={(optionId) => setConfig({ ...config, frameColor: optionId })}
                            placeholder={`Select ${(isPerfectFitWooden ? perfectFitWoodenLabels.frameColor : isPerfectFitMetal ? perfectFitMetalLabels.frameColor : easyStickLabels.frameColor || 'profile color').toLowerCase()}`}
                          />
                        </div>
                      )}

                      {/* Opening Direction Selector */}
                      {product.features.hasOpeningDirection && visibleOptions.showOpeningDirection && (
                        <div className="pt-6">
                          <OpeningDirectionSelector
                            options={OPENING_DIRECTION_OPTIONS}
                            selectedDirection={config.openingDirection}
                            onDirectionChange={(optionId) => setConfig({ ...config, openingDirection: optionId })}
                          />
                        </div>
                      )}

                      {/* Optional Customization Cards Row */}
                      {hasOptionalCustomizationCards && (
                      <div className="pt-6 pb-6 border-b border-border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                          {/* Bottom Bar Card - Only for products with hasBottomBar */}
                          {product.features.hasBottomBar && visibleOptions.showBottomBar && (
                            <div
                              onClick={() => {
                                const newValue = !selectedOptionalCards.bottomBar;
                                setSelectedOptionalCards({
                                  ...selectedOptionalCards,
                                  bottomBar: newValue,
                                });
                                if (!newValue) {
                                  setConfig({
                                    ...config,
                                    bottomBar: null
                                  });
                                }
                              }}
                              className={`relative border rounded-[12px] p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${selectedOptionalCards.bottomBar
                                ? 'border-primary bg-surface-soft shadow-sm'
                                : 'border-border bg-surface hover:border-border-strong hover:shadow-sm'
                                }`}
                            >
                              {selectedOptionalCards.bottomBar && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm z-10">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {BOTTOM_BAR_CARD?.image && (
                                <div className={`relative h-[120px] w-full mb-3 rounded-[12px] overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.bottomBar
                                  ? 'bg-surface-soft shadow-inner'
                                  : 'bg-surface-soft group-hover:bg-surface-contrast'
                                  }`}>
                                  <Image
                                    src={BOTTOM_BAR_CARD.image}
                                    alt={BOTTOM_BAR_CARD.name}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <h4 className="text-base font-semibold text-foreground mb-1.5 pr-8">
                                {BOTTOM_BAR_CARD?.name || 'Bottom Bar Option'}
                              </h4>
                              {BOTTOM_BAR_CARD?.description && (
                                <p className="text-xs text-muted leading-relaxed mb-2">{BOTTOM_BAR_CARD.description}</p>
                              )}

                              {/* Dropdowns inside the card */}
                              {selectedOptionalCards.bottomBar && (
                                <div
                                  className="mt-4 space-y-3 pt-3 border-t border-border"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SimpleDropdown
                                    label="Select Bottom Bar"
                                    options={BOTTOM_BAR_OPTIONS}
                                    selectedValue={config.bottomBar}
                                    onChange={(optionId) => setConfig({ ...config, bottomBar: optionId })}
                                    placeholder="Select bottom bar style"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                          {/* Continuous Chain - Select Location Card */}
                          {product.features.hasChainColor && visibleOptions.showChainColor && !isSpecialMotorized && (
                            <div
                              onClick={() => {
                                const newValue = !selectedOptionalCards.continuousChain;
                                setSelectedOptionalCards({
                                  ...selectedOptionalCards,
                                  continuousChain: newValue,
                                  motorization: newValue ? false : selectedOptionalCards.motorization,
                                });
                                if (newValue) {
                                  setConfig({ ...config, motorization: null });
                                } else {
                                  setConfig({
                                    ...config,
                                    chainColor: null,
                                    controlSide: isRoman ? config.controlSide : null,
                                    controlOption: isRoman ? null : config.controlOption,
                                  });
                                }
                              }}
                              className={`relative border rounded-[12px] p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${selectedOptionalCards.continuousChain
                                ? 'border-primary bg-surface-soft shadow-sm'
                                : 'border-border bg-surface hover:border-border-strong hover:shadow-sm'
                                }`}
                            >
                              {selectedOptionalCards.continuousChain && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm z-10">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {continuousChainCard.image && (
                                <div className={`relative h-[120px] w-full mb-3 rounded-[12px] overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.continuousChain
                                  ? 'bg-surface-soft shadow-inner'
                                  : 'bg-surface-soft group-hover:bg-surface-contrast'
                                  }`}>
                                  <Image
                                    src={continuousChainCard.image}
                                    alt={continuousChainCard.name}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <h4 className="text-base font-semibold text-foreground mb-1.5 pr-8">
                                {continuousChainCard.name}
                              </h4>
                              {continuousChainCard.description && (
                                <p className="text-xs text-muted leading-relaxed mb-2">{continuousChainCard.description}</p>
                              )}
                              {continuousChainCard.price > 0 && (
                                <span className="absolute bottom-4 right-4 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-[12px] shadow-sm">
                                  +£{continuousChainCard.price.toFixed(2)}
                                </span>
                              )}

                              {/* Dropdowns inside the card */}
                              {selectedOptionalCards.continuousChain && (
                                <div
                                  className="mt-4 space-y-3 pt-3 border-t border-border"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SimpleDropdown
                                    label="Select Location"
                                    options={isRoman ? controlOptions : CONTROL_SIDE_OPTIONS}
                                    selectedValue={isRoman ? config.controlOption : config.controlSide}
                                    onChange={(sideId) => setConfig({
                                      ...config,
                                      controlOption: isRoman ? sideId : config.controlOption,
                                      controlSide: isRoman ? config.controlSide : sideId,
                                    })}
                                    placeholder="Select location"
                                  />
                                  <SimpleDropdown
                                    label="Chain Color"
                                    options={chainColorOptions}
                                    selectedValue={config.chainColor}
                                    onChange={(colorId) => setConfig({ ...config, chainColor: colorId })}
                                    placeholder="Select chain color"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Cassette and Bottom Matching Bar Card */}
                          {(product.features.hasWrappedCassette || product.features.hasCassetteMatchingBar || product.features.hasRollerCassette) && (
                            <div
                              onClick={() => {
                                const newValue = !selectedOptionalCards.cassette;
                                setSelectedOptionalCards({
                                  ...selectedOptionalCards,
                                  cassette: newValue,
                                });
                                if (!newValue) {
                                  setConfig({
                                    ...config,
                                    wrappedCassette: null,
                                    cassetteMatchingBar: null
                                  });
                                }
                              }}
                              className={`relative border rounded-[12px] p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${selectedOptionalCards.cassette
                                ? 'border-primary bg-surface-soft shadow-sm'
                                : 'border-border bg-surface hover:border-border-strong hover:shadow-sm'
                                }`}
                            >
                              {selectedOptionalCards.cassette && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm z-10">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {cassetteCard.image && (
                                <div className={`relative h-[120px] w-full mb-3 rounded-[12px] overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.cassette
                                  ? 'bg-surface-soft shadow-inner'
                                  : 'bg-surface-soft group-hover:bg-surface-contrast'
                                  }`}>
                                  <Image
                                    src={cassetteCard.image}
                                    alt={cassetteCard.name}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <h4 className="text-base font-semibold text-foreground mb-1.5 pr-8">
                                {cassetteCard.name}
                              </h4>
                              {cassetteCard.description && (
                                <p className="text-xs text-muted leading-relaxed mb-2">{cassetteCard.description}</p>
                              )}
                              {cassetteCard.price > 0 && (
                                <span className="absolute bottom-4 right-4 bg-primary text-white text-xs font-semibold px-3 py-1.5 rounded-[12px] shadow-sm">
                                  +£{cassetteCard.price.toFixed(2)}
                                </span>
                              )}

                              {/* Dropdowns inside the card */}
                              {selectedOptionalCards.cassette && (
                                <div
                                  className="mt-4 space-y-3 pt-3 border-t border-border"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {product.features.hasWrappedCassette && (
                                    <SimpleDropdown
                                      label="Cassette Color"
                                      options={WRAPPED_CASSETTE_OPTIONS}
                                      selectedValue={config.wrappedCassette}
                                      onChange={(optionId) => setConfig({ ...config, wrappedCassette: optionId })}
                                      placeholder="Select cassette color"
                                    />
                                  )}
                                  {product.features.hasCassetteMatchingBar && (
                                    <SimpleDropdown
                                      label="Cassette and Bottom Matching Bar"
                                      options={CASSETTE_MATCHING_BAR_OPTIONS}
                                      selectedValue={config.cassetteMatchingBar}
                                      onChange={(optionId) => setConfig({ ...config, cassetteMatchingBar: optionId })}
                                      placeholder="Select cassette and bottom bar"
                                    />
                                  )}
                                  {product.features.hasRollerCassette && (
                                    <SimpleDropdown
                                      label="Cassette and Bottom Matching Bar"
                                      options={ROLLER_CASSETTE_OPTIONS}
                                      selectedValue={config.cassetteMatchingBar}
                                      onChange={(optionId) => setConfig({ ...config, cassetteMatchingBar: optionId })}
                                      placeholder="Select cassette color"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Motorization Card */}
                          {(product.features.hasMotorization || forceMotorization || isSpecialMotorized) && (
                            <div
                              onClick={() => {
                                if (forceMotorization || isSpecialMotorized) return;
                                const newValue = !selectedOptionalCards.motorization;
                                setSelectedOptionalCards({
                                  ...selectedOptionalCards,
                                  motorization: newValue,
                                  continuousChain: newValue ? false : selectedOptionalCards.continuousChain,
                                });
                                if (newValue) {
                                  setConfig({ ...config, chainColor: null, controlSide: null });
                                } else {
                                  setConfig({ ...config, motorization: null });
                                }
                              }}
                              className={`relative border rounded-[12px] p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${selectedOptionalCards.motorization
                                ? 'border-primary bg-surface-soft shadow-sm'
                                : 'border-border bg-surface hover:border-border-strong hover:shadow-sm'
                                }`}
                            >
                              {selectedOptionalCards.motorization && (
                                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm z-10">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                              {MOTORIZATION_CARD.image && (
                                <div className={`relative h-[120px] w-full mb-3 rounded-[12px] overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.motorization
                                  ? 'bg-surface-soft shadow-inner'
                                  : 'bg-surface-soft group-hover:bg-surface-contrast'
                                  }`}>
                                  <Image
                                    src={MOTORIZATION_CARD.image}
                                    alt={MOTORIZATION_CARD.name}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                  />
                                </div>
                              )}
                              <h4 className="text-base font-semibold text-foreground mb-1.5 pr-8">
                                {isSpecialMotorized ? 'Remote Control' : MOTORIZATION_CARD.name}
                              </h4>
                              {(isSpecialMotorized
                                ? 'Choose the remote control supplied with your electrical roller blind.'
                                : MOTORIZATION_CARD.description) && (
                                <p className="text-xs text-muted leading-relaxed mb-2">
                                  {isSpecialMotorized
                                    ? 'Choose the remote control supplied with your motorised blind.'
                                    : MOTORIZATION_CARD.description}
                                </p>
                              )}

                              {/* Simple Price Text */}
                              <div className="mt-2 text-sm font-medium text-primary">
                                {isSpecialMotorized ? '+£100.00 (Motor)' : '+£95.00 (Motor)'}
                              </div>

                              {/* Dropdowns inside the card */}
                              {selectedOptionalCards.motorization && (
                                <div
                                  className="mt-4 pt-3 border-t border-[#d9dfeb]/50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <SimpleDropdown
                                    label={isSpecialMotorized ? 'Remote Option' : 'Motorization Option'}
                                    options={isSpecialMotorized ? motorizedRemoteOptions : MOTORIZATION_OPTIONS}
                                    selectedValue={config.motorization}
                                    onChange={(optionId) => setConfig({ ...config, motorization: optionId })}
                                    placeholder={isSpecialMotorized ? 'Select remote option' : 'Select motorization'}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isValidating || showMinPriceIndicator || isMeasurementOutOfRange || isRequiredCustomizationIncomplete || isPerfectFitShutterConfigurationIncomplete}
                className={`w-full mt-5 md:mt-6 py-3 md:py-3.5 px-4 md:px-6 rounded-[14px] text-sm md:text-base font-medium transition-all ${isValidating || showMinPriceIndicator || isMeasurementOutOfRange || isRequiredCustomizationIncomplete || isPerfectFitShutterConfigurationIncomplete
                  ? 'bg-[#98a4bb] text-white cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark shadow-[0_10px_20px_rgba(68,87,102,0.24)] hover:shadow-[0_12px_24px_rgba(68,87,102,0.28)]'
                  }`}
              >
                {isValidating
                  ? 'Adding to Cart...'
                  : isMeasurementOutOfRange
                  ? 'Selected Size Not Available'
                  : isPerfectFitShutterConfigurationIncomplete
                  ? 'Complete Shutter Options'
                  : `Add to Cart — ${formatPriceWithCurrency(showMinPriceIndicator ? formatPrice(minimumDisplayedPrice) : formatPrice(totalPrice), product.currency)}`}
              </button>

              {/* Installation & Measurement Guide Buttons */}
              <div className="flex gap-3 mt-3">
                <a
                  href={guideLinks.installation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 border border-border bg-surface text-muted text-sm font-medium rounded-[12px] text-center hover:border-border-strong hover:text-foreground hover:bg-surface-soft transition-colors"
                >
                  Installation Guide
                </a>
                <a
                  href={guideLinks.measurement}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 border border-border bg-surface text-muted text-sm font-medium rounded-[12px] text-center hover:border-border-strong hover:text-foreground hover:bg-surface-soft transition-colors"
                >
                  Measurement Guide
                </a>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 border border-border rounded-[16px] p-4 bg-surface shadow-[0_6px_16px_rgba(31,41,51,0.04)]">
                {/* Payment logos */}
                <div className="flex justify-center mb-4">
                  <Image
                    src="/products/payment-badge.png"
                    alt="Accepted payment methods"
                    width={500}
                    height={80}
                    className="h-12 w-auto object-contain"
                  />
                </div>
                {/* Trust cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center text-center p-3 border border-border rounded-[12px] bg-surface-soft">
                    <Image
                      src="/products/warranty.webp"
                      alt="Warranty"
                      width={48}
                      height={48}
                      className="w-10 h-10 object-contain mb-2"
                    />
                    <span className="text-xs font-semibold text-foreground leading-tight">Warranty</span>
                    <span className="text-xs text-muted mt-0.5 leading-tight">
                      {product.category.toLowerCase() === 'vertical blinds' && product.tags.includes('waterproof') && product.tags.includes('blackout')
                        ? '10 Years Warranty'
                        : '5 Years Warranty'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 border border-border rounded-[12px] bg-surface-soft">
                    <Image
                      src="/products/easyAssembly.webp"
                      alt="Easy Assembly"
                      width={48}
                      height={48}
                      className="w-10 h-10 object-contain mb-2"
                    />
                    <span className="text-xs font-semibold text-foreground leading-tight">Easy Assembly</span>
                    <span className="text-xs text-muted mt-0.5 leading-tight">Minimal no hassle assembly. All Fittings included</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-3 border border-border rounded-[12px] bg-surface-soft">
                    <Image
                      src="/products/review.png"
                      alt="Trustpilot reviews"
                      width={80}
                      height={40}
                      className="w-16 h-auto object-contain mb-2"
                    />
                    <span className="text-xs font-semibold text-foreground leading-tight">Trusted by Customers</span>
                    <span className="text-xs text-muted mt-0.5 leading-tight">Rated Excellent on Trustpilot</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Section - Full Width */}
      <CategoryInfoSection
        categorySlug={
          forceMotorization
            ? (({ 'roller-blinds': 'motorised-roller-shades', 'day-and-night-blinds': 'motorised-dual-zebra-shades', 'pleated-blinds': 'motorised-eclipsecore' } as Record<string, string>)[product.category.toLowerCase().replace(/\s+/g, '-')] ?? product.category.toLowerCase().replace(/\s+/g, '-'))
            : product.category.toLowerCase().replace(/\s+/g, '-')
        }
        productTags={product.tags}
      />

      {/* Reviews Section */}
      {product.slug !== 'non-driii-honeycomb-blackout-blinds' && (
        <section className="px-4 md:px-6 lg:px-16 py-8 md:py-12 bg-white border-t border-border">
          <div className="max-w-[1320px] mx-auto">
            <ProductReviews productHandle={product.slug} />
          </div>
        </section>
      )}

      {/* Related Products */}
      {product.slug !== 'non-driii-honeycomb-blackout-blinds' && relatedProducts.length > 0 && (
        <section className="px-4 md:px-6 lg:px-16 py-8 md:py-12 bg-white">
          <div className="max-w-[1320px] mx-auto">
            <RelatedProducts products={relatedProducts} />
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;
