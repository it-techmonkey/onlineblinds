'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Product, ProductConfiguration, DEFAULT_CONFIGURATION, PriceBandMatrix, CustomizationPricing as CustomizationPricingType, CheckoutItemRequest } from '@/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import ProductGallery from './ProductGallery';
import ProductReviews from './ProductReviews';
import RelatedProducts from './RelatedProducts';
import StickyAddToCartBar from './StickyAddToCartBar';
import { getDeliveryDateRange } from '@/lib/delivery';
import CategoryInfoSection from '@/components/collection/CategoryInfoSection';
import { BlackoutFeaturesSection } from './BlackoutFeaturesSection';
import { formatPrice, formatPriceWithCurrency, fetchPriceMatrix, fetchCustomizationPricing, validateCartPrice, createCheckout } from '@/lib/api';
import { getMeasurementRanges } from '@/lib/measurement-ranges';
import { PRODUCT_GUIDES } from '@/data/guides';
import {
  calculateTotalPrice,
  configToCustomizations,
  getTotalInches,
  getInstallationServicePrice,
} from '@/lib/pricing';
import InstallationServiceInfo from './customization/InstallationServiceInfo';
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
  FieldHighlight,
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
  const { addToCart, clearCart } = useCart();
  const [wantsInstallation, setWantsInstallation] = useState(false);
  const { customer } = useAuth();
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
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const customizationFetchingRef = useRef(false);
  const matrixFetchingRef = useRef(false);

  // Hide the sticky bottom bar while the inline Add to Cart / Buy Now buttons are on screen.
  const inlineButtonsRef = useRef<HTMLDivElement>(null);
  const [inlineButtonsVisible, setInlineButtonsVisible] = useState(true);

  useEffect(() => {
    const node = inlineButtonsRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInlineButtonsVisible(entry.isIntersecting),
      { rootMargin: '0px' }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  // Tracks which required fields are currently missing/invalid, shown as a red
  // highlight + helper text and used to scroll the user to the first offender.
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const registerFieldRef = (key: string, el: HTMLDivElement | null) => {
    fieldRefs.current[key] = el;
  };
  const clearFieldInvalid = (key: string) => {
    setInvalidFields((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

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

  // A size can sit inside the band's overall width/height range and still have no
  // price cell, because some bands leave large width/drop combinations out (the
  // supplier does not make them). Without this the page falls back to the product's
  // "from" price, which reads as a valid quote for a size we cannot actually sell.
  const isSizeUnavailable = useMemo(() => {
    if (isSkylight || usesHeightOnlyVerticalPricing || !priceMatrix || isMeasurementOutOfRange) {
      return false;
    }

    const widthInches = getTotalInches(config.width, config.widthFraction, config.widthUnit);
    const heightInches = getTotalInches(config.height, config.heightFraction, config.heightUnit);

    if (widthInches <= 0 || heightInches <= 0) {
      return false;
    }

    return priceCalculation === null;
  }, [config.height, config.heightFraction, config.heightUnit, config.width, config.widthFraction, config.widthUnit, isMeasurementOutOfRange, isSkylight, priceCalculation, priceMatrix, usesHeightOnlyVerticalPricing]);

  const sizeFieldMessage = isSizeUnavailable
    ? 'We cannot make this blind in that width and drop combination. Please adjust your measurements.'
    : 'Please enter a valid size';

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

  // Determines which required fields are currently unmet. Used on click instead of
  // disabling the buttons, so we can scroll to and highlight the offending fields.
  const getInvalidFieldKeys = (): Set<string> => {
    const keys = new Set<string>();

    if (isSkylight) {
      if (!config.brand) keys.add('brand');
      if (!config.blindType) keys.add('blindType');
    } else {
      if (config.width === 0 && !usesHeightOnlyVerticalPricing) keys.add('width');
      if (config.height === 0) keys.add('height');
      if (isMeasurementOutOfRange || isSizeUnavailable) {
        keys.add('width');
        keys.add('height');
      }
    }

    missingRequiredCustomizations.forEach((item) => keys.add(item.key));

    if (isPerfectFitShutterConfigurationIncomplete) {
      if (!config.installationMethod) keys.add('installationMethod');
      if (!config.controlOption) keys.add('controlOption');
      if (!config.bracketType) keys.add('bracketType');
      if (!config.numberOfPanels) keys.add('numberOfPanels');
      if (shutterHandlePositionRequired && !shutterHandlePositionValid) keys.add('handlePosition');
    }

    return keys;
  };

  // Expands any collapsed section that contains an invalid field, then scrolls to
  // and highlights every invalid field so the user can see what's missing.
  const focusInvalidFields = (keys: Set<string>) => {
    setInvalidFields(keys);

    const measureKeys = new Set(['width', 'height', 'brand', 'blindType', 'rollStyle']);
    if (!isEasyStick) {
      measureKeys.add('installationMethod');
    }
    if (!isMeasureOpen && [...keys].some((key) => measureKeys.has(key))) {
      setIsMeasureOpen(true);
    }
    if (!isCustomizeOpen && [...keys].some((key) => !measureKeys.has(key))) {
      setIsCustomizeOpen(true);
    }

    if (!selectedOptionalCards.cassette && (keys.has('wrappedCassette') || keys.has('cassetteMatchingBar'))) {
      setSelectedOptionalCards((prev) => ({ ...prev, cassette: true }));
    }

    if (!selectedOptionalCards.bottomBar && keys.has('bottomBar')) {
      setSelectedOptionalCards((prev) => ({ ...prev, bottomBar: true }));
    }

    if (!selectedOptionalCards.continuousChain && (keys.has('continuousChainLocation') || keys.has('chainColor'))) {
      setSelectedOptionalCards((prev) => ({ ...prev, continuousChain: true }));
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const orderedKeys = Object.keys(fieldRefs.current);
        const firstKey = orderedKeys.find((key) => keys.has(key)) ?? [...keys][0];
        const el = firstKey ? fieldRefs.current[firstKey] : null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  };

  const buildCheckoutItem = (): CheckoutItemRequest => {
    const widthInches = isSkylight
      ? getSkylightPricingDimensions().widthInches
      : isReplacementVerticalSlat
        ? REPLACEMENT_VERTICAL_SLAT_FIXED_WIDTH_INCHES
        : getTotalInches(config.width, config.widthFraction, config.widthUnit);
    const heightInches = isSkylight
      ? getSkylightPricingDimensions().heightInches
      : getTotalInches(config.height, config.heightFraction, config.heightUnit);

    const backendConfig: Record<string, string | undefined> = {
      roomType: config.roomType || undefined,
      blindName: config.blindName || undefined,
      headrail: config.headrail || undefined,
      headrailColour: config.headrailColour || undefined,
      installationMethod: config.installationMethod || undefined,
      controlOption: config.controlOption || undefined,
      liningType: config.liningType || undefined,
      stacking: config.stacking || undefined,
      controlSide: config.controlSide || undefined,
      bottomChain: config.bottomChain || undefined,
      bracketType: config.bracketType || undefined,
      chainColor: config.chainColor || undefined,
      wrappedCassette: config.wrappedCassette || undefined,
      cassetteMatchingBar: config.cassetteMatchingBar || undefined,
      motorization: config.motorization || undefined,
      brand: config.brand || undefined,
      blindType: config.blindType || undefined,
      blindColor: config.blindColor || undefined,
      frameColor: config.frameColor || undefined,
      handlePosition: config.handlePosition || undefined,
      numberOfPanels: config.numberOfPanels || undefined,
      openingDirection: config.openingDirection || undefined,
      bottomBar: config.bottomBar || undefined,
      rollStyle: config.rollStyle || undefined,
    };

    return {
      handle: product.slug,
      widthInches,
      heightInches,
      quantity: 1,
      submittedPrice: totalPrice,
      configuration: backendConfig,
    };
  };

  const handleAddToCart = async () => {
    const invalidKeys = getInvalidFieldKeys();
    if (invalidKeys.size > 0) {
      focusInvalidFields(invalidKeys);
      return;
    }
    setInvalidFields(new Set());

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
        addToCart(productWithPrice, config, wantsInstallation);
      } else {
        // Price matches, proceed with cart
        const productWithPrice = {
          ...product,
          price: totalPrice,
        };
        addToCart(productWithPrice, config, wantsInstallation);
      }
    } catch (error) {
      console.error('Price validation failed:', error);
      // Fallback: add to cart anyway with frontend calculated price
      const productWithPrice = {
        ...product,
        price: totalPrice,
      };
      addToCart(productWithPrice, config, wantsInstallation);
    } finally {
      setIsValidating(false);
    }
  };

  const handleBuyNow = async () => {
    const invalidKeys = getInvalidFieldKeys();
    if (invalidKeys.size > 0) {
      focusInvalidFields(invalidKeys);
      return;
    }
    setInvalidFields(new Set());

    setIsCheckingOut(true);

    try {
      const result = await createCheckout(
        [buildCheckoutItem()],
        customer?.email || undefined,
        wantsInstallation
      );
      clearCart();
      window.location.href = result.checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Something went wrong starting checkout. Please try again.');
      setIsCheckingOut(false);
    }
  };

  return (
    <div className={`bg-white ${!isSkylight ? 'pb-20 md:pb-24' : ''}`}>
      {/* Breadcrumb */}
      <div className="px-4 md:px-6 lg:px-16 py-3 md:py-5">
        <div className="max-w-[1320px] mx-auto">
          <nav className="flex items-center gap-2 text-xs md:text-sm text-muted tracking-[0.02em]">
            <Link href="/collections" className="hover:text-primary transition-colors">Back to Shop</Link>
            <span>&gt;</span>
            <span className="text-foreground truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="px-4 md:px-6 lg:px-16 pb-8 md:pb-14">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-5 md:gap-10 lg:gap-12">
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
              <div className="flex items-center border border-border rounded-[16px] mb-4 md:mb-6 px-3 md:px-4 py-2.5 md:py-3 bg-surface shadow-[0_4px_14px_rgba(31,41,51,0.04)]">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-soft rounded-[12px] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <div className="ml-2 md:ml-3">
                  <div className="text-[10px] md:text-xs text-muted">Est. Delivery</div>
                  <div className="text-xs md:text-sm font-semibold text-foreground">{getDeliveryDateRange(product.estimatedDelivery) ?? product.estimatedDelivery}</div>
                </div>
              </div>

              {/* Urgency Bar */}
              <div className="mb-4 md:mb-6">
                <ProductUrgencyBar productSlug={product.slug} />
              </div>

              {/* Price Section */}
              <div className="border border-border rounded-[16px] p-4 md:p-6 mb-4 md:mb-6 bg-surface shadow-[0_6px_18px_rgba(31,41,51,0.05)]">
                <div className="flex flex-col items-center lg:items-start">
                  {isSizeUnavailable ? (
                    <div className="mb-2 md:mb-3">
                      <span className="text-xl md:text-2xl leading-none font-semibold text-[#c24646]">
                        Not available in this size
                      </span>
                    </div>
                  ) : (
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
                  )}
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
              <div className="space-y-4 md:space-y-5">
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
                    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-surface">
                      {/* Size Selector */}
                      {product.features.hasSize && (
                        <FieldHighlight
                          fieldKey={['width', 'height']}
                          invalid={invalidFields.has('width') || invalidFields.has('height')}
                          registerRef={registerFieldRef}
                          message={sizeFieldMessage}
                        >
                          <SizeSelector
                            width={config.width}
                            widthFraction={config.widthFraction}
                            height={config.height}
                            heightFraction={config.heightFraction}
                            unit={config.widthUnit}
                            onWidthChange={(value) => { setConfig({ ...config, width: value }); clearFieldInvalid('width'); }}
                            onWidthFractionChange={(value) => setConfig({ ...config, widthFraction: value })}
                            onHeightChange={(value) => { setConfig({ ...config, height: value }); clearFieldInvalid('height'); }}
                            onHeightFractionChange={(value) => setConfig({ ...config, heightFraction: value })}
                            onUnitChange={(unit) => setConfig({ ...config, widthUnit: unit, heightUnit: unit })}
                            minWidth={sizeRanges?.minWidth}
                            maxWidth={sizeRanges?.maxWidth}
                            minHeight={sizeRanges?.minHeight}
                            maxHeight={sizeRanges?.maxHeight}
                            showWidth={!usesHeightOnlyVerticalPricing}
                          />
                        </FieldHighlight>
                      )}

                      {/* Installation Method Selector */}
                      {product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && !isEasyStick && !isPerfectFitWooden && !isPerfectFitShutter && !isPerfectFitMetal && (
                        <FieldHighlight fieldKey="installationMethod" invalid={invalidFields.has('installationMethod')} registerRef={registerFieldRef}>
                          <InstallationMethodSelector
                            options={standardInstallationOptions}
                            selectedMethod={config.installationMethod}
                            onMethodChange={(methodId) => { setConfig({ ...config, installationMethod: methodId }); clearFieldInvalid('installationMethod'); }}
                          />
                        </FieldHighlight>
                      )}

                      {isPerfectFitWooden && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                        <FieldHighlight fieldKey="installationMethod" invalid={invalidFields.has('installationMethod')} registerRef={registerFieldRef}>
                          <SimpleDropdown
                            label={perfectFitWoodenLabels.installationMethod}
                            options={installationOptions}
                            selectedValue={config.installationMethod}
                            onChange={(optionId) => { setConfig({ ...config, installationMethod: optionId }); clearFieldInvalid('installationMethod'); }}
                            placeholder={`Select ${perfectFitWoodenLabels.installationMethod.toLowerCase()}`}
                          />
                        </FieldHighlight>
                      )}

                      {isPerfectFitShutter && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                        <FieldHighlight fieldKey="installationMethod" invalid={invalidFields.has('installationMethod')} registerRef={registerFieldRef}>
                          <SimpleDropdown
                            label={perfectFitShutterLabels.installationMethod}
                            options={installationOptions}
                            selectedValue={config.installationMethod}
                            onChange={(optionId) => { setConfig({ ...config, installationMethod: optionId }); clearFieldInvalid('installationMethod'); }}
                            placeholder={`Select ${perfectFitShutterLabels.installationMethod.toLowerCase()}`}
                          />
                        </FieldHighlight>
                      )}

                      {isPerfectFitMetal && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                        <FieldHighlight fieldKey="installationMethod" invalid={invalidFields.has('installationMethod')} registerRef={registerFieldRef}>
                          <SimpleDropdown
                            label={perfectFitMetalLabels.installationMethod}
                            options={installationOptions}
                            selectedValue={config.installationMethod}
                            onChange={(optionId) => { setConfig({ ...config, installationMethod: optionId }); clearFieldInvalid('installationMethod'); }}
                            placeholder={`Select ${perfectFitMetalLabels.installationMethod.toLowerCase()}`}
                          />
                        </FieldHighlight>
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
                        <FieldHighlight fieldKey="rollStyle" invalid={invalidFields.has('rollStyle')} registerRef={registerFieldRef}>
                          <RollStyleSelector
                            options={ROLL_STYLE_OPTIONS}
                            selectedRollStyle={config.rollStyle}
                            onRollStyleChange={(styleId) => setConfig({ ...config, rollStyle: styleId })}
                          />
                        </FieldHighlight>
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
                      <div className="p-4 md:p-6 space-y-4 md:space-y-6 divide-y divide-border bg-surface">
                      {isSkylight && (
                        <div className="pt-0 first:pt-0 pb-4 md:pb-6 space-y-4 md:space-y-6">
                          <FieldHighlight fieldKey="brand" invalid={invalidFields.has('brand')} registerRef={registerFieldRef}>
                            <h3 className="text-sm font-medium text-foreground mb-3">Brand</h3>
                            <div className="flex flex-wrap gap-3">
                              {SKYLIGHT_BRAND_OPTIONS.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => {
                                    setConfig((prev) => ({
                                      ...prev,
                                      brand: option.id,
                                      blindType: prev.brand === option.id ? prev.blindType : null,
                                    }));
                                    clearFieldInvalid('brand');
                                  }}
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
                          </FieldHighlight>

                          <FieldHighlight fieldKey="blindType" invalid={invalidFields.has('blindType')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label="Blind Type"
                              options={skylightBlindTypeOptions}
                              selectedValue={config.blindType}
                              onChange={(optionId) => { setConfig({ ...config, blindType: optionId }); clearFieldInvalid('blindType'); }}
                              placeholder={config.brand ? 'Select blind type' : 'Select brand first'}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {/* Headrail Selector */}
                      {product.features.hasHeadrail && (
                        <div className="pt-0 first:pt-0 pb-4 md:pb-6">
                          <FieldHighlight fieldKey="headrail" invalid={invalidFields.has('headrail')} registerRef={registerFieldRef}>
                            <HeadrailSelector
                              options={HEADRAIL_OPTIONS}
                              selectedHeadrail={config.headrail}
                              onHeadrailChange={(headrailId) => { setConfig({ ...config, headrail: headrailId }); clearFieldInvalid('headrail'); }}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {/* Headrail Colour Selector */}
                      {product.features.hasHeadrailColour && visibleOptions.showHeadrailColour && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="headrailColour" invalid={invalidFields.has('headrailColour')} registerRef={registerFieldRef}>
                            <HeadrailColourSelector
                              options={HEADRAIL_COLOUR_OPTIONS}
                              selectedColour={config.headrailColour}
                              onColourChange={(colourId) => { setConfig({ ...config, headrailColour: colourId }); clearFieldInvalid('headrailColour'); }}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {/* Control Option Selector */}
                      {product.features.hasControlOption && visibleOptions.showControlOption && !isRoman && !isEasyStick && !isPerfectFitShutter && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="controlOption" invalid={invalidFields.has('controlOption')} registerRef={registerFieldRef}>
                            <ControlOptionSelector
                              options={controlOptions}
                              selectedOption={config.controlOption}
                              onOptionChange={(optionId) => { setConfig({ ...config, controlOption: optionId }); clearFieldInvalid('controlOption'); }}
                              title={isFauxWooden ? 'Toggle' : 'Control Option'}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {isPerfectFitShutter && product.features.hasControlOption && visibleOptions.showControlOption && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="controlOption" invalid={invalidFields.has('controlOption')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={perfectFitShutterLabels.controlOption}
                              options={controlOptions}
                              selectedValue={config.controlOption}
                              onChange={(optionId) => {
                                setConfig((prev) => ({
                                  ...prev,
                                  controlOption: optionId,
                                  handlePosition: optionId === 'none' ? null : prev.handlePosition,
                                }));
                                clearFieldInvalid('controlOption');
                              }}
                              placeholder={`Select ${perfectFitShutterLabels.controlOption.toLowerCase()}`}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {isPerfectFitShutter && shutterHandlePositionRequired && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="handlePosition" invalid={invalidFields.has('handlePosition')} registerRef={registerFieldRef} message={`Handle position must be between ${PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM} mm and ${PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM} mm`}>
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
                                onChange={(event) => {
                                  setConfig((prev) => ({
                                    ...prev,
                                    handlePosition: event.target.value || null,
                                  }));
                                  clearFieldInvalid('handlePosition');
                                }}
                                placeholder={`${PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM}-${PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM}`}
                                className="w-full bg-transparent border-none p-0 text-base font-medium text-foreground focus:outline-none"
                              />
                            </div>
                            <p className="mt-2 text-xs text-muted">
                              Allowed range: {PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM}-{PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM} mm
                            </p>
                          </FieldHighlight>
                        </div>
                      )}

                      {isEasyStick && product.features.hasInstallationMethod && visibleOptions.showInstallationMethod && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="installationMethod" invalid={invalidFields.has('installationMethod')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={easyStickLabels.installationMethod}
                              options={installationOptions}
                              selectedValue={config.installationMethod}
                              onChange={(optionId) => { setConfig({ ...config, installationMethod: optionId }); clearFieldInvalid('installationMethod'); }}
                              placeholder={`Select ${easyStickLabels.installationMethod.toLowerCase()}`}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {isEasyStick && product.features.hasControlOption && visibleOptions.showControlOption && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="controlOption" invalid={invalidFields.has('controlOption')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={easyStickLabels.controlOption}
                              options={controlOptions}
                              selectedValue={config.controlOption}
                              onChange={(optionId) => { setConfig({ ...config, controlOption: optionId }); clearFieldInvalid('controlOption'); }}
                              placeholder={`Select ${easyStickLabels.controlOption.toLowerCase()}`}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {isPerfectFitWooden && product.features.hasControlSide && visibleOptions.showControlSide && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="controlSide" invalid={invalidFields.has('controlSide')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={perfectFitWoodenLabels.controlSide}
                              options={controlSideOptions}
                              selectedValue={config.controlSide}
                              onChange={(optionId) => { setConfig({ ...config, controlSide: optionId }); clearFieldInvalid('controlSide'); }}
                              placeholder={`Select ${perfectFitWoodenLabels.controlSide.toLowerCase()}`}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {isPerfectFitMetal && product.features.hasControlSide && visibleOptions.showControlSide && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="controlSide" invalid={invalidFields.has('controlSide')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={perfectFitMetalLabels.controlSide}
                              options={controlSideOptions}
                              selectedValue={config.controlSide}
                              onChange={(optionId) => { setConfig({ ...config, controlSide: optionId }); clearFieldInvalid('controlSide'); }}
                              placeholder={`Select ${perfectFitMetalLabels.controlSide.toLowerCase()}`}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {isEasyStick && product.features.hasControlSide && visibleOptions.showControlSide && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="controlSide" invalid={invalidFields.has('controlSide')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={easyStickLabels.controlSide || 'Control Side'}
                              options={easyStickControlSideOptions}
                              selectedValue={config.controlSide}
                              onChange={(optionId) => { setConfig({ ...config, controlSide: optionId }); clearFieldInvalid('controlSide'); }}
                              placeholder={`Select ${(easyStickLabels.controlSide || 'control side').toLowerCase()}`}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {visibleOptions.showLiningType && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="liningType" invalid={invalidFields.has('liningType')} registerRef={registerFieldRef}>
                            <LiningTypeSelector
                              options={LINING_TYPE_OPTIONS}
                              selectedLiningType={config.liningType}
                              onLiningTypeChange={(liningTypeId) => { setConfig({ ...config, liningType: liningTypeId }); clearFieldInvalid('liningType'); }}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {/* Stacking Selector */}
                      {product.features.hasStacking && visibleOptions.showStacking && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="stacking" invalid={invalidFields.has('stacking')} registerRef={registerFieldRef}>
                            <StackingSelector
                              options={stackingOptions}
                              selectedStacking={config.stacking}
                              onStackingChange={(stackingId) => { setConfig({ ...config, stacking: stackingId }); clearFieldInvalid('stacking'); }}
                            />
                          </FieldHighlight>
                        </div>
                      )}


                      {/* Bottom Chain Selector */}
                      {product.features.hasBottomChain && visibleOptions.showBottomChain && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="bottomChain" invalid={invalidFields.has('bottomChain')} registerRef={registerFieldRef}>
                            <BottomChainSelector
                              options={BOTTOM_CHAIN_OPTIONS.filter(opt => !('pvcOnly' in opt) || product.features.hasPvcFabric)}
                              selectedChain={config.bottomChain}
                              onChainChange={(chainId) => { setConfig({ ...config, bottomChain: chainId }); clearFieldInvalid('bottomChain'); }}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {/* Bracket Type Selector */}
                      {product.features.hasBracketType && visibleOptions.showBracketType && !isPerfectFitWooden && !isPerfectFitShutter && !isPerfectFitMetal && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="bracketType" invalid={invalidFields.has('bracketType')} registerRef={registerFieldRef}>
                            <BracketTypeSelector
                              options={BRACKET_TYPE_OPTIONS}
                              selectedBracket={config.bracketType}
                              onBracketChange={(bracketId) => { setConfig({ ...config, bracketType: bracketId }); clearFieldInvalid('bracketType'); }}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {isPerfectFitShutter && product.features.hasBracketType && visibleOptions.showBracketType && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="bracketType" invalid={invalidFields.has('bracketType')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={perfectFitShutterLabels.bracketType}
                              options={PERFECT_FIT_SHUTTER_BRACKET_SIZE_OPTIONS}
                              selectedValue={config.bracketType}
                              onChange={(optionId) => { setConfig({ ...config, bracketType: optionId }); clearFieldInvalid('bracketType'); }}
                              placeholder={`Select ${perfectFitShutterLabels.bracketType.toLowerCase()}`}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {isPerfectFitWooden && product.features.hasBracketType && visibleOptions.showBracketType && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="bracketType" invalid={invalidFields.has('bracketType')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={perfectFitWoodenLabels.bracketType}
                              options={PERFECT_FIT_WOODEN_BRACKET_SIZE_OPTIONS}
                              selectedValue={config.bracketType}
                              onChange={(optionId) => { setConfig({ ...config, bracketType: optionId }); clearFieldInvalid('bracketType'); }}
                              placeholder={`Select ${perfectFitWoodenLabels.bracketType.toLowerCase()}`}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {isPerfectFitShutter && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="numberOfPanels" invalid={invalidFields.has('numberOfPanels')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={perfectFitShutterLabels.numberOfPanels}
                              options={shutterPanelOptions}
                              selectedValue={config.numberOfPanels}
                              onChange={() => undefined}
                              placeholder="Select size first"
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {isPerfectFitMetal && product.features.hasBracketType && visibleOptions.showBracketType && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="bracketType" invalid={invalidFields.has('bracketType')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={perfectFitMetalLabels.bracketType}
                              options={PERFECT_FIT_METAL_BRACKET_SIZE_OPTIONS}
                              selectedValue={config.bracketType}
                              onChange={(optionId) => { setConfig({ ...config, bracketType: optionId }); clearFieldInvalid('bracketType'); }}
                              placeholder={`Select ${perfectFitMetalLabels.bracketType.toLowerCase()}`}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {/* Blind Color Selector */}
                      {product.features.hasBlindColor && visibleOptions.showBlindColor && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="blindColor" invalid={invalidFields.has('blindColor')} registerRef={registerFieldRef}>
                            <h3 className="text-sm font-medium text-foreground mb-3">Blind Color</h3>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                              {BLIND_COLOR_OPTIONS.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => { setConfig({ ...config, blindColor: option.id }); clearFieldInvalid('blindColor'); }}
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
                          </FieldHighlight>
                        </div>
                      )}

                      {/* Frame Color Selector */}
                      {product.features.hasFrameColor && visibleOptions.showFrameColor && !isEasyStick && !isPerfectFitWooden && !isPerfectFitMetal && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="frameColor" invalid={invalidFields.has('frameColor')} registerRef={registerFieldRef}>
                            <h3 className="text-sm font-medium text-foreground mb-3">Frame Color</h3>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                              {FRAME_COLOR_OPTIONS.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => { setConfig({ ...config, frameColor: option.id }); clearFieldInvalid('frameColor'); }}
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
                          </FieldHighlight>
                        </div>
                      )}

                      {(isEasyStick || isPerfectFitWooden || isPerfectFitMetal) && product.features.hasFrameColor && visibleOptions.showFrameColor && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="frameColor" invalid={invalidFields.has('frameColor')} registerRef={registerFieldRef}>
                            <SimpleDropdown
                              label={isPerfectFitWooden ? perfectFitWoodenLabels.frameColor : isPerfectFitMetal ? perfectFitMetalLabels.frameColor : easyStickLabels.frameColor || 'Profile Color'}
                              options={frameColorOptions}
                              selectedValue={config.frameColor}
                              onChange={(optionId) => { setConfig({ ...config, frameColor: optionId }); clearFieldInvalid('frameColor'); }}
                              placeholder={`Select ${(isPerfectFitWooden ? perfectFitWoodenLabels.frameColor : isPerfectFitMetal ? perfectFitMetalLabels.frameColor : easyStickLabels.frameColor || 'profile color').toLowerCase()}`}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {/* Opening Direction Selector */}
                      {product.features.hasOpeningDirection && visibleOptions.showOpeningDirection && (
                        <div className="pt-4 md:pt-6">
                          <FieldHighlight fieldKey="openingDirection" invalid={invalidFields.has('openingDirection')} registerRef={registerFieldRef}>
                            <OpeningDirectionSelector
                              options={OPENING_DIRECTION_OPTIONS}
                              selectedDirection={config.openingDirection}
                              onDirectionChange={(optionId) => { setConfig({ ...config, openingDirection: optionId }); clearFieldInvalid('openingDirection'); }}
                            />
                          </FieldHighlight>
                        </div>
                      )}

                      {/* Optional Customization Cards Row */}
                      {hasOptionalCustomizationCards && (
                      <div className="pt-4 md:pt-6 pb-4 md:pb-6 border-b border-border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">

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
                              className={`relative border rounded-[12px] p-4 md:p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${invalidFields.has('bottomBar')
                                ? 'border-[#c24646]'
                                : selectedOptionalCards.bottomBar
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
                              <div className="flex items-center gap-3 md:block">
                                {BOTTOM_BAR_CARD?.image && (
                                  <div className={`relative h-16 w-16 shrink-0 md:h-[120px] md:w-full md:mb-3 rounded-[12px] overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.bottomBar
                                    ? 'bg-surface-soft shadow-inner'
                                    : 'bg-surface-soft group-hover:bg-surface-contrast'
                                    }`}>
                                    <Image
                                      src={BOTTOM_BAR_CARD.image}
                                      alt={BOTTOM_BAR_CARD.name}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-base font-semibold text-foreground mb-1.5 pr-8">
                                    {BOTTOM_BAR_CARD?.name || 'Bottom Bar Option'}
                                  </h4>
                                  {BOTTOM_BAR_CARD?.description && (
                                    <p className="text-xs text-muted leading-relaxed mb-2">{BOTTOM_BAR_CARD.description}</p>
                                  )}
                                </div>
                              </div>

                              {/* Dropdowns inside the card */}
                              {selectedOptionalCards.bottomBar && (
                                <div
                                  className="mt-4 space-y-3 pt-3 border-t border-border"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FieldHighlight fieldKey="bottomBar" invalid={invalidFields.has('bottomBar')} registerRef={registerFieldRef}>
                                    <SimpleDropdown
                                      label="Select Bottom Bar"
                                      options={BOTTOM_BAR_OPTIONS}
                                      selectedValue={config.bottomBar}
                                      onChange={(optionId) => { setConfig({ ...config, bottomBar: optionId }); clearFieldInvalid('bottomBar'); }}
                                      placeholder="Select bottom bar style"
                                    />
                                  </FieldHighlight>
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
                                  clearFieldInvalid('chainOrMotorization');
                                } else {
                                  setConfig({
                                    ...config,
                                    chainColor: null,
                                    controlSide: isRoman ? config.controlSide : null,
                                    controlOption: isRoman ? null : config.controlOption,
                                  });
                                }
                              }}
                              className={`relative border rounded-[12px] p-4 md:p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${invalidFields.has('chainOrMotorization') || invalidFields.has('continuousChainLocation') || invalidFields.has('chainColor')
                                ? 'border-[#c24646]'
                                : selectedOptionalCards.continuousChain
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
                              <div className="flex items-center gap-3 md:block">
                                {continuousChainCard.image && (
                                  <div className={`relative h-16 w-16 shrink-0 md:h-[120px] md:w-full md:mb-3 rounded-[12px] overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.continuousChain
                                    ? 'bg-surface-soft shadow-inner'
                                    : 'bg-surface-soft group-hover:bg-surface-contrast'
                                    }`}>
                                    <Image
                                      src={continuousChainCard.image}
                                      alt={continuousChainCard.name}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-base font-semibold text-foreground mb-1.5 pr-8">
                                    {continuousChainCard.name}
                                  </h4>
                                  {continuousChainCard.description && (
                                    <p className="text-xs text-muted leading-relaxed mb-2">{continuousChainCard.description}</p>
                                  )}
                                </div>
                              </div>
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
                                  <FieldHighlight fieldKey="continuousChainLocation" invalid={invalidFields.has('continuousChainLocation')} registerRef={registerFieldRef}>
                                    <SimpleDropdown
                                      label="Select Location"
                                      options={isRoman ? controlOptions : CONTROL_SIDE_OPTIONS}
                                      selectedValue={isRoman ? config.controlOption : config.controlSide}
                                      onChange={(sideId) => {
                                        setConfig({
                                          ...config,
                                          controlOption: isRoman ? sideId : config.controlOption,
                                          controlSide: isRoman ? config.controlSide : sideId,
                                        });
                                        clearFieldInvalid('continuousChainLocation');
                                      }}
                                      placeholder="Select location"
                                    />
                                  </FieldHighlight>
                                  <FieldHighlight fieldKey="chainColor" invalid={invalidFields.has('chainColor')} registerRef={registerFieldRef}>
                                    <SimpleDropdown
                                      label="Chain Color"
                                      options={chainColorOptions}
                                      selectedValue={config.chainColor}
                                      onChange={(colorId) => { setConfig({ ...config, chainColor: colorId }); clearFieldInvalid('chainColor'); }}
                                      placeholder="Select chain color"
                                    />
                                  </FieldHighlight>
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
                              className={`relative border rounded-[12px] p-4 md:p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${invalidFields.has('wrappedCassette') || invalidFields.has('cassetteMatchingBar')
                                ? 'border-[#c24646]'
                                : selectedOptionalCards.cassette
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
                              <div className="flex items-center gap-3 md:block">
                                {cassetteCard.image && (
                                  <div className={`relative h-16 w-16 shrink-0 md:h-[120px] md:w-full md:mb-3 rounded-[12px] overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.cassette
                                    ? 'bg-surface-soft shadow-inner'
                                    : 'bg-surface-soft group-hover:bg-surface-contrast'
                                    }`}>
                                    <Image
                                      src={cassetteCard.image}
                                      alt={cassetteCard.name}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-base font-semibold text-foreground mb-1.5 pr-8">
                                    {cassetteCard.name}
                                  </h4>
                                  {cassetteCard.description && (
                                    <p className="text-xs text-muted leading-relaxed mb-2">{cassetteCard.description}</p>
                                  )}
                                </div>
                              </div>
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
                                    <FieldHighlight fieldKey="wrappedCassette" invalid={invalidFields.has('wrappedCassette')} registerRef={registerFieldRef}>
                                      <SimpleDropdown
                                        label="Cassette Color"
                                        options={WRAPPED_CASSETTE_OPTIONS}
                                        selectedValue={config.wrappedCassette}
                                        onChange={(optionId) => { setConfig({ ...config, wrappedCassette: optionId }); clearFieldInvalid('wrappedCassette'); }}
                                        placeholder="Select cassette color"
                                      />
                                    </FieldHighlight>
                                  )}
                                  {product.features.hasCassetteMatchingBar && (
                                    <FieldHighlight fieldKey="cassetteMatchingBar" invalid={invalidFields.has('cassetteMatchingBar')} registerRef={registerFieldRef}>
                                      <SimpleDropdown
                                        label="Cassette and Bottom Matching Bar"
                                        options={CASSETTE_MATCHING_BAR_OPTIONS}
                                        selectedValue={config.cassetteMatchingBar}
                                        onChange={(optionId) => { setConfig({ ...config, cassetteMatchingBar: optionId }); clearFieldInvalid('cassetteMatchingBar'); }}
                                        placeholder="Select cassette and bottom bar"
                                      />
                                    </FieldHighlight>
                                  )}
                                  {product.features.hasRollerCassette && (
                                    <FieldHighlight fieldKey="cassetteMatchingBar" invalid={invalidFields.has('cassetteMatchingBar')} registerRef={registerFieldRef}>
                                      <SimpleDropdown
                                        label="Cassette and Bottom Matching Bar"
                                        options={ROLLER_CASSETTE_OPTIONS}
                                        selectedValue={config.cassetteMatchingBar}
                                        onChange={(optionId) => { setConfig({ ...config, cassetteMatchingBar: optionId }); clearFieldInvalid('cassetteMatchingBar'); }}
                                        placeholder="Select cassette color"
                                      />
                                    </FieldHighlight>
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
                                  clearFieldInvalid('chainOrMotorization');
                                } else {
                                  setConfig({ ...config, motorization: null });
                                }
                              }}
                              className={`relative border rounded-[12px] p-4 md:p-5 transition-all duration-300 text-left group cursor-pointer h-full flex flex-col ${invalidFields.has('motorization') || invalidFields.has('chainOrMotorization')
                                ? 'border-[#c24646]'
                                : selectedOptionalCards.motorization
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
                              <div className="flex items-center gap-3 md:block">
                                {MOTORIZATION_CARD.image && (
                                  <div className={`relative h-16 w-16 shrink-0 md:h-[120px] md:w-full md:mb-3 rounded-[12px] overflow-hidden flex items-center justify-center transition-all duration-300 ${selectedOptionalCards.motorization
                                    ? 'bg-surface-soft shadow-inner'
                                    : 'bg-surface-soft group-hover:bg-surface-contrast'
                                    }`}>
                                    <Image
                                      src={MOTORIZATION_CARD.image}
                                      alt={MOTORIZATION_CARD.name}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
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
                                </div>
                              </div>

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
                                  <FieldHighlight fieldKey="motorization" invalid={invalidFields.has('motorization')} registerRef={registerFieldRef}>
                                    <SimpleDropdown
                                      label={isSpecialMotorized ? 'Remote Option' : 'Motorization Option'}
                                      options={isSpecialMotorized ? motorizedRemoteOptions : MOTORIZATION_OPTIONS}
                                      selectedValue={config.motorization}
                                      onChange={(optionId) => { setConfig({ ...config, motorization: optionId }); clearFieldInvalid('motorization'); }}
                                      placeholder={isSpecialMotorized ? 'Select remote option' : 'Select motorization'}
                                    />
                                  </FieldHighlight>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {invalidFields.has('chainOrMotorization') && (
                          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#c24646]">
                            <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.28 11.18c.75 1.334-.213 2.987-1.744 2.987H3.72c-1.53 0-2.493-1.653-1.743-2.987l6.28-11.18zM10 7a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 7zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Please choose either Continuous Chain or Motorization
                          </p>
                        )}
                      </div>
                      )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <label className="flex items-start justify-between gap-3 mt-4 md:mt-6 p-3.5 rounded-[12px] border border-border bg-surface cursor-pointer">
                <span className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={wantsInstallation}
                    onChange={(e) => setWantsInstallation(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    Add professional installation
                    <InstallationServiceInfo currency={product.currency} />
                  </span>
                </span>
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                  {formatPriceWithCurrency(getInstallationServicePrice(1), product.currency)}
                </span>
              </label>

              <div ref={inlineButtonsRef}>
                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isValidating || isCheckingOut}
                  className={`w-full mt-4 md:mt-6 py-3 md:py-3.5 px-4 md:px-6 rounded-[14px] text-sm md:text-base font-medium transition-all ${isValidating || isCheckingOut
                    ? 'bg-[#98a4bb] text-white cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark shadow-[0_10px_20px_rgba(68,87,102,0.24)] hover:shadow-[0_12px_24px_rgba(68,87,102,0.28)]'
                    }`}
                >
                  {isValidating
                    ? 'Adding to Cart...'
                    : isSizeUnavailable
                      ? 'Add to Cart'
                      : `Add to Cart — ${formatPriceWithCurrency(showMinPriceIndicator ? formatPrice(minimumDisplayedPrice) : formatPrice(totalPrice), product.currency)}`}
                </button>

                {/* Buy Now Button */}
                <button
                  onClick={handleBuyNow}
                  disabled={isValidating || isCheckingOut}
                  className={`w-full mt-3 py-3 md:py-3.5 px-4 md:px-6 rounded-[14px] text-sm md:text-base font-medium transition-all border flex items-center justify-center gap-2 ${isValidating || isCheckingOut
                    ? 'border-border bg-surface-soft text-muted cursor-not-allowed'
                    : 'border-primary text-primary bg-white hover:bg-surface-soft'
                    }`}
                >
                  {isCheckingOut && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  Buy Now
                </button>
              </div>

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
              <div className="mt-5 md:mt-6 border border-border rounded-[16px] p-3 md:p-4 bg-surface shadow-[0_6px_16px_rgba(31,41,51,0.04)]">
                {/* Payment logos */}
                <div className="flex justify-center mb-3 md:mb-4">
                  <Image
                    src="/products/payment-badge.png"
                    alt="Accepted payment methods"
                    width={500}
                    height={80}
                    className="h-10 md:h-12 w-auto object-contain"
                  />
                </div>
                {/* Trust cards */}
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  <div className="flex flex-col items-center text-center p-2 md:p-3 border border-border rounded-[12px] bg-surface-soft">
                    <Image
                      src="/products/warranty.webp"
                      alt="Warranty"
                      width={48}
                      height={48}
                      className="w-8 h-8 md:w-10 md:h-10 object-contain mb-1.5 md:mb-2"
                    />
                    <span className="text-[11px] md:text-xs font-semibold text-foreground leading-tight">Warranty</span>
                    <span className="text-[10px] md:text-xs text-muted mt-0.5 leading-tight">
                      {product.category.toLowerCase() === 'vertical blinds' && product.tags.includes('waterproof') && product.tags.includes('blackout')
                        ? '10 Years Warranty'
                        : '5 Years Warranty'}
                    </span>
                  </div>
                  <div className="flex flex-col items-center text-center p-2 md:p-3 border border-border rounded-[12px] bg-surface-soft">
                    <Image
                      src="/products/easyAssembly.webp"
                      alt="Easy Assembly"
                      width={48}
                      height={48}
                      className="w-8 h-8 md:w-10 md:h-10 object-contain mb-1.5 md:mb-2"
                    />
                    <span className="text-[11px] md:text-xs font-semibold text-foreground leading-tight">Easy Assembly</span>
                    <span className="text-[10px] md:text-xs text-muted mt-0.5 leading-tight">Minimal no hassle assembly. All Fittings included</span>
                  </div>
                  <div className="flex flex-col items-center text-center p-2 md:p-3 border border-border rounded-[12px] bg-surface-soft">
                    <Image
                      src="/products/review.png"
                      alt="Trustpilot reviews"
                      width={80}
                      height={40}
                      className="w-14 md:w-16 h-auto object-contain mb-1.5 md:mb-2"
                    />
                    <span className="text-[11px] md:text-xs font-semibold text-foreground leading-tight">Trusted by Customers</span>
                    <span className="text-[10px] md:text-xs text-muted mt-0.5 leading-tight">Rated Excellent on Trustpilot</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blackout & Comfort Features - Complete Blackout Blinds only */}
      {product.slug === 'non-driii-honeycomb-blackout-blinds' && <BlackoutFeaturesSection />}

      {/* Product Details Section - Full Width */}
      <CategoryInfoSection
        categorySlug={
          forceMotorization
            ? (({ 'roller-blinds': 'motorised-roller-shades', 'day-and-night-blinds': 'motorised-dual-zebra-shades', 'pleated-blinds': 'motorised-eclipsecore' } as Record<string, string>)[product.category.toLowerCase().replace(/\s+/g, '-')] ?? product.category.toLowerCase().replace(/\s+/g, '-'))
            : product.category.toLowerCase().replace(/\s+/g, '-')
        }
        productTags={product.tags}
        productDetails={product.productDetails}
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

      {!isSkylight && !inlineButtonsVisible && (
        <StickyAddToCartBar
          productName={product.name}
          price={isSizeUnavailable
            ? 'Not available in this size'
            : formatPriceWithCurrency(showMinPriceIndicator ? formatPrice(minimumDisplayedPrice) : formatPrice(totalPrice), product.currency)}
          compareAtPrice={isSizeUnavailable
            ? ''
            : formatPriceWithCurrency(
              formatPrice(Math.round((showMinPriceIndicator ? product.price : totalPrice) * 1.67)),
              product.currency
            )}
          onAddToCart={handleAddToCart}
          addToCartLabel={isValidating ? 'Adding to Cart...' : 'Add to Cart'}
          addToCartDisabled={isValidating || isCheckingOut}
          onBuyNow={handleBuyNow}
          buyNowLabel="Buy Now"
          buyNowLoading={isCheckingOut}
          buyNowDisabled={isValidating || isCheckingOut}
        />
      )}
    </div>
  );
};

export default ProductPage;
