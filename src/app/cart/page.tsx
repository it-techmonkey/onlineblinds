'use client';

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Header, Footer } from '@/components';
import { CustomizationModal } from '@/components/product';
import { formatPriceWithCurrency, createCheckout, validateCartItemPrices, validateDiscountCode } from '@/lib/api';
import { getInstallationServicePrice, formatMeasurement } from '@/lib/pricing';
import { buildCheckoutItemRequest } from '@/lib/checkout-item';
import InstallationServiceInfo from '@/components/product/customization/InstallationServiceInfo';
import { CartItem, CartDiscount, CheckoutItemRequest, DEFAULT_CONFIGURATION, Product, ProductConfiguration } from '@/types';
import { isReplacementVerticalSlatProduct } from '@/lib/vertical-blinds';
import { findSkylightBlindTypeOption, findSkylightBrandOption } from '@/data/skylight';
import { isSkylightProduct } from '@/lib/skylight';
import { isFauxWoodenProduct } from '@/lib/faux-wooden';
import { getPerfectFitMetalFieldLabels, isPerfectFitMetalProduct } from '@/lib/perfect-fit-metal';
import {
  getPerfectFitShutterFieldLabels,
  isPerfectFitShutterProduct,
} from '@/lib/perfect-fit-shutter';
import { getPerfectFitWoodenFieldLabels, isPerfectFitWoodenProduct } from '@/lib/perfect-fit-wooden';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { trackBeginCheckout, trackViewCart } from '@/lib/gtm';

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
  PERFECT_FIT_WOODEN_MEASUREMENT_TYPE_OPTIONS,
  PERFECT_FIT_WOODEN_CONTROL_SIDE_OPTIONS,
  PERFECT_FIT_WOODEN_FRAME_COLOR_OPTIONS,
  PERFECT_FIT_WOODEN_BRACKET_SIZE_OPTIONS,
  PERFECT_FIT_METAL_MEASUREMENT_TYPE_OPTIONS,
  PERFECT_FIT_METAL_CONTROL_SIDE_OPTIONS,
  PERFECT_FIT_METAL_FRAME_COLOR_OPTIONS,
  PERFECT_FIT_METAL_BRACKET_SIZE_OPTIONS,
  PERFECT_FIT_SHUTTER_BRACKET_SIZE_OPTIONS,
  PERFECT_FIT_SHUTTER_HANDLE_LOCATION_OPTIONS,
  PERFECT_FIT_SHUTTER_MEASUREMENT_TYPE_OPTIONS,
  PERFECT_FIT_SHUTTER_PANEL_OPTIONS,
  ROMAN_INSTALLATION_OPTIONS,
  VENETIAN_INSTALLATION_OPTIONS,
  CONTROL_OPTIONS,
  ROLLER_CONTROL_OPTIONS,
  WOODEN_TOGGLE_OPTIONS,
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
  CHROME_UPGRADE_OPTIONS,
  FABRIC_INSERT_CASSETTE_OPTIONS,
  MATCHING_FABRIC_CASSETTE_OPTIONS,
  MOTORIZATION_OPTIONS,
} from '@/data/customizations';
import { getEasyStickFieldLabels, getEasyStickSubtype, isEasyStickProduct } from '@/lib/easy-stick';
import { isRomanProduct } from '@/lib/roman-blinds';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateCartItem,
    updateQuantity,
    updateItemPrices,
    setInstallationService,
    applyDiscount,
    removeDiscount,
    clearCart,
  } = useCart();
  const { customer } = useAuth();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editingConfig, setEditingConfig] = useState<ProductConfiguration>(DEFAULT_CONFIGURATION);
  const [priceUpdateNotice, setPriceUpdateNotice] = useState<
    { id: string; name: string; oldPrice: number; newPrice: number }[] | null
  >(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // The cart hydrates from localStorage after mount, so fire `view_cart` on the
  // first render that actually has items rather than on the initial empty state.
  const hasTrackedViewCart = useRef(false);
  useEffect(() => {
    if (hasTrackedViewCart.current) return;
    if (cart.items.length === 0) return;

    hasTrackedViewCart.current = true;
    trackViewCart(cart.items, cart.total);
  }, [cart.items, cart.total]);

  // Cart items can sit in localStorage indefinitely, so a price baked in at
  // add-to-cart time can go stale (e.g. after a pricing update) long before
  // the customer checks out. Re-check once per visit and correct + surface
  // any drift here, instead of letting it surface as an opaque error at checkout.
  const hasValidatedPrices = useRef(false);
  useEffect(() => {
    if (hasValidatedPrices.current) return;
    if (cart.items.length === 0) return;
    hasValidatedPrices.current = true;

    const itemsToCheck = cart.items;
    (async () => {
      try {
        const checkoutItems = itemsToCheck.map(buildCheckoutItemRequest);
        const results = await validateCartItemPrices(checkoutItems);

        const updates: { id: string; price: number }[] = [];
        const changed: { id: string; name: string; oldPrice: number; newPrice: number }[] = [];

        itemsToCheck.forEach((item, index) => {
          const result = results[index];
          if (result && !result.valid) {
            updates.push({ id: item.id, price: result.calculatedPrice });
            changed.push({
              id: item.id,
              name: item.product.name,
              oldPrice: item.product.price,
              newPrice: result.calculatedPrice,
            });
          }
        });

        if (updates.length > 0) {
          updateItemPrices(updates);
          setPriceUpdateNotice(changed);
        }
      } catch (error) {
        console.error('Cart price revalidation failed:', error);
      }
    })();
  }, [cart.items, updateItemPrices]);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim();
    if (!code) return;

    setIsApplyingCoupon(true);
    setCouponError(null);
    try {
      const discount = await validateDiscountCode(code);
      applyDiscount(discount);
      setCouponCode('');
    } catch (error: any) {
      setCouponError(error.message || 'Invalid discount code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeDiscount();
    setCouponError(null);
  };

  const openEditModal = (item: CartItem) => {
    setEditingItem(item);
    setEditingConfig({ ...item.configuration });
  };

  const closeEditModal = () => {
    setEditingItem(null);
    setEditingConfig(DEFAULT_CONFIGURATION);
  };

  const handleSaveEditedItem = (product: Product, configuration: ProductConfiguration) => {
    if (!editingItem) return;

    updateCartItem(editingItem.id, product, configuration);
    closeEditModal();
  };

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    trackBeginCheckout(cart.items, cart.total);

    try {
      const checkoutItems: CheckoutItemRequest[] = cart.items.map(buildCheckoutItemRequest);

      // Re-check prices one more time right before submitting — pricing data
      // can change while this tab has been sitting open. Catching it here and
      // asking the customer to confirm beats letting the order fail at
      // Shopify with an opaque error after they've already left the site.
      const priceChecks = await validateCartItemPrices(checkoutItems);
      const staleUpdates: { id: string; price: number }[] = [];
      const staleItems: { id: string; name: string; oldPrice: number; newPrice: number }[] = [];

      cart.items.forEach((item, index) => {
        const check = priceChecks[index];
        if (check && !check.valid) {
          staleUpdates.push({ id: item.id, price: check.calculatedPrice });
          staleItems.push({
            id: item.id,
            name: item.product.name,
            oldPrice: item.product.price,
            newPrice: check.calculatedPrice,
          });
        }
      });

      if (staleUpdates.length > 0) {
        updateItemPrices(staleUpdates);
        setPriceUpdateNotice(staleItems);
        setCheckoutError('Some prices in your cart just changed — please review the updated total below and click checkout again.');
        setIsCheckingOut(false);
        return;
      }

      const result = await createCheckout(
        checkoutItems,
        customer?.email || undefined,
        cart.installationService,
        cart.discount?.code
      );

      // Clear cart before redirecting
      clearCart();

      // Redirect to Shopify checkout
      window.location.href = result.checkoutUrl;
    } catch (error: any) {
      console.error('Checkout error:', error);
      setCheckoutError(
        error.message || 'Something went wrong. Please try again.'
      );
      setIsCheckingOut(false);
    }
  };

  const finalTotal = cart.total;

  const formatConfiguration = (config: any, productTags: string[], productName?: string, productSlug?: string) => {
    const parts = [];
    const usesHeightOnlyVerticalPricing = isReplacementVerticalSlatProduct(productTags);
    const romanProduct = isRomanProduct(productTags);
    const easyStickProduct = isEasyStickProduct({
      tags: productTags,
      name: productName,
      slug: productSlug,
    });
    const fauxWoodenProduct = isFauxWoodenProduct({
      tags: productTags,
      name: productName,
      slug: productSlug,
    });
    const perfectFitWoodenProduct = isPerfectFitWoodenProduct({
      tags: productTags,
      name: productName,
      slug: productSlug,
    });
    const perfectFitMetalProduct = isPerfectFitMetalProduct({
      tags: productTags,
      name: productName,
    });
    const perfectFitShutterProduct = isPerfectFitShutterProduct({
      tags: productTags,
      name: productName,
      slug: productSlug,
    });
    const easyStickSubtype = easyStickProduct
      ? getEasyStickSubtype({ tags: productTags, name: productName, slug: productSlug })
      : null;
    const easyStickLabels = getEasyStickFieldLabels(easyStickSubtype);
    const perfectFitWoodenLabels = getPerfectFitWoodenFieldLabels();
    const perfectFitMetalLabels = getPerfectFitMetalFieldLabels();
    const perfectFitShutterLabels = getPerfectFitShutterFieldLabels();

    // Size (always show if available)
    if (usesHeightOnlyVerticalPricing && config.height) {
      parts.push(`Height: ${formatMeasurement(config.height, config.heightFraction, config.heightUnit)}`);
    } else if (config.width && config.height) {
      const widthStr = formatMeasurement(config.width, config.widthFraction, config.widthUnit);
      const heightStr = formatMeasurement(config.height, config.heightFraction, config.heightUnit);
      parts.push(`Size: ${widthStr} × ${heightStr}`);
    }

    // Colour (Shopify variant, for products with a Colour option)
    if (config.colour) {
      parts.push(`Colour: ${config.colour}`);
    }

    // Room Type
    if (config.roomType) {
      const label = config.roomType.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      parts.push(`Room: ${label}`);
    }

    // Blind Name
    if (config.blindName) {
      parts.push(`Blind Name: ${config.blindName}`);
    }

    if (config.brand) {
      const brandOption = findSkylightBrandOption(config.brand);
      parts.push(`Brand: ${brandOption?.name || config.brand}`);
    }

    if (config.blindType) {
      const blindTypeOption = findSkylightBlindTypeOption(config.blindType);
      parts.push(`Blind Type: ${blindTypeOption?.code || config.blindType}`);
    }

    // Headrail Type
    if (config.headrail) {
      const headrailOption = HEADRAIL_OPTIONS.find(opt => opt.id === config.headrail);
      parts.push(`Headrail: ${headrailOption?.name || config.headrail}`);
    }

    // Headrail Colour
    if (config.headrailColour) {
      const colourOption = HEADRAIL_COLOUR_OPTIONS.find(opt => opt.id === config.headrailColour);
      parts.push(`Headrail Colour: ${colourOption?.name || config.headrailColour}`);
    }

    // Installation Method
    if (config.installationMethod) {
      const methodOption = INSTALLATION_METHOD_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        ROLLER_INSTALLATION_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        NO_DRILL_INSTALLATION_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        EASY_STICK_MEASUREMENT_TYPE_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        EASY_STICK_FITTING_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        PERFECT_FIT_SHUTTER_MEASUREMENT_TYPE_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        PERFECT_FIT_WOODEN_MEASUREMENT_TYPE_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        PERFECT_FIT_METAL_MEASUREMENT_TYPE_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        ROMAN_INSTALLATION_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        VENETIAN_INSTALLATION_OPTIONS.find(opt => opt.id === config.installationMethod);
      parts.push(`${easyStickProduct ? easyStickLabels.installationMethod : perfectFitWoodenProduct ? perfectFitWoodenLabels.installationMethod : perfectFitShutterProduct ? perfectFitShutterLabels.installationMethod : perfectFitMetalProduct ? perfectFitMetalLabels.installationMethod : 'Installation'}: ${methodOption?.name || config.installationMethod}`);
    }

    // Control Option
    if (config.controlOption) {
      const controlOpt = CONTROL_OPTIONS.find(opt => opt.id === config.controlOption) ||
        ROLLER_CONTROL_OPTIONS.find(opt => opt.id === config.controlOption) ||
        WOODEN_TOGGLE_OPTIONS.find(opt => opt.id === config.controlOption) ||
        EASY_STICK_HONEYCOMB_OPERATION_OPTIONS.find(opt => opt.id === config.controlOption) ||
        EASY_STICK_WOOD_OPERATION_OPTIONS.find(opt => opt.id === config.controlOption) ||
        EASY_STICK_SLAT_SIZE_OPTIONS.find(opt => opt.id === config.controlOption) ||
        PERFECT_FIT_SHUTTER_HANDLE_LOCATION_OPTIONS.find(opt => opt.id === config.controlOption) ||
        ROMAN_CONTROL_OPTIONS.find(opt => opt.id === config.controlOption);
      parts.push(`${easyStickProduct ? easyStickLabels.controlOption : perfectFitShutterProduct ? perfectFitShutterLabels.controlOption : fauxWoodenProduct ? 'Toggle' : 'Control'}: ${controlOpt?.name || config.controlOption}`);
    }

    if (config.liningType) {
      const liningOption = LINING_TYPE_OPTIONS.find(opt => opt.id === config.liningType);
      parts.push(`Lining Type: ${liningOption?.name || config.liningType}`);
    }

    // Stacking
    if (config.stacking) {
      const stackingOption = Object.values(VERTICAL_STACKING_OPTIONS).flat().find((opt: { id: string; name: string }) => opt.id === config.stacking);
      parts.push(`Stacking: ${stackingOption?.name || config.stacking}`);
    }

    // Control Side
    if (config.controlSide) {
      const sideOption = CONTROL_SIDE_OPTIONS.find(opt => opt.id === config.controlSide) ||
        PERFECT_FIT_WOODEN_CONTROL_SIDE_OPTIONS.find(opt => opt.id === config.controlSide) ||
        PERFECT_FIT_METAL_CONTROL_SIDE_OPTIONS.find(opt => opt.id === config.controlSide) ||
        EASY_STICK_METAL_CONTROLS_OPTIONS.find(opt => opt.id === config.controlSide) ||
        EASY_STICK_WOOD_CONTROL_SIDE_OPTIONS.find(opt => opt.id === config.controlSide);
      parts.push(`${easyStickProduct ? (easyStickLabels.controlSide || 'Control Side') : perfectFitWoodenProduct ? perfectFitWoodenLabels.controlSide : perfectFitMetalProduct ? perfectFitMetalLabels.controlSide : 'Control Side'}: ${sideOption?.name || config.controlSide}`);
    }

    // Bottom Chain
    if (config.bottomChain) {
      const chainOption = BOTTOM_CHAIN_OPTIONS.find(opt => opt.id === config.bottomChain);
      parts.push(`Bottom Weight/Chain: ${chainOption?.name || config.bottomChain}`);
    }

    // Bracket Type
    if (config.bracketType) {
      const bracketOption = BRACKET_TYPE_OPTIONS.find(opt => opt.id === config.bracketType) ||
        PERFECT_FIT_SHUTTER_BRACKET_SIZE_OPTIONS.find(opt => opt.id === config.bracketType) ||
        PERFECT_FIT_WOODEN_BRACKET_SIZE_OPTIONS.find(opt => opt.id === config.bracketType) ||
        PERFECT_FIT_METAL_BRACKET_SIZE_OPTIONS.find(opt => opt.id === config.bracketType);
      parts.push(`${perfectFitWoodenProduct ? perfectFitWoodenLabels.bracketType : perfectFitShutterProduct ? perfectFitShutterLabels.bracketType : perfectFitMetalProduct ? perfectFitMetalLabels.bracketType : 'Bracket Type'}: ${bracketOption?.name || config.bracketType}`);
    }

    if (config.handlePosition) {
      parts.push(`${perfectFitShutterLabels.handlePosition}: ${config.handlePosition} mm`);
    }

    if (config.numberOfPanels) {
      const panelOption = PERFECT_FIT_SHUTTER_PANEL_OPTIONS.find(opt => opt.id === config.numberOfPanels);
      parts.push(`${perfectFitShutterLabels.numberOfPanels}: ${panelOption?.name || config.numberOfPanels}`);
    }

    // Chain Color
    if (config.chainColor) {
      const colorOption = (romanProduct ? ROMAN_CHAIN_COLOR_OPTIONS : CHAIN_COLOR_OPTIONS)
        .find(opt => opt.id === config.chainColor);
      parts.push(`Chain Color: ${colorOption?.name || config.chainColor}`);
    }

    // Chrome Upgrade (Day & Night)
    if (config.chromeUpgrade) {
      const chromeOption = CHROME_UPGRADE_OPTIONS.find(opt => opt.id === config.chromeUpgrade);
      parts.push(`Upgrade to Chrome: ${chromeOption?.name || config.chromeUpgrade}`);
    }

    if (config.frameColor) {
      const frameOption = EASY_STICK_PROFILE_COLOR_OPTIONS.find(opt => opt.id === config.frameColor) ||
        PERFECT_FIT_WOODEN_FRAME_COLOR_OPTIONS.find(opt => opt.id === config.frameColor) ||
        PERFECT_FIT_METAL_FRAME_COLOR_OPTIONS.find(opt => opt.id === config.frameColor);
      parts.push(`${easyStickProduct ? (easyStickLabels.frameColor || 'Profile Color') : perfectFitWoodenProduct ? perfectFitWoodenLabels.frameColor : perfectFitMetalProduct ? perfectFitMetalLabels.frameColor : 'Frame Color'}: ${frameOption?.name || config.frameColor}`);
    }

    // Wrapped Cassette
    if (config.wrappedCassette) {
      const cassetteOption = WRAPPED_CASSETTE_OPTIONS.find(opt => opt.id === config.wrappedCassette);
      parts.push(`Wrapped Cassette: ${cassetteOption?.name || config.wrappedCassette}`);
    }

    // Cassette Matching Bar
    if (config.cassetteMatchingBar) {
      const barOption = CASSETTE_MATCHING_BAR_OPTIONS.find(opt => opt.id === config.cassetteMatchingBar);
      parts.push(`Cassette Bar: ${barOption?.name || config.cassetteMatchingBar}`);
    }

    // Same Fabric Insert in Cassette (Day & Night)
    if (config.sameFabricInsert) {
      const insertOption = FABRIC_INSERT_CASSETTE_OPTIONS.find(opt => opt.id === config.sameFabricInsert);
      parts.push(`Same Fabric Insert: ${insertOption?.name || config.sameFabricInsert}`);
    }

    // Matching Fabric on cover cassette (Roller)
    if (config.matchingFabricCassette) {
      const fabricOption = MATCHING_FABRIC_CASSETTE_OPTIONS.find(opt => opt.id === config.matchingFabricCassette);
      parts.push(`Matching Fabric on Cover Cassette: ${fabricOption?.name || config.matchingFabricCassette}`);
    }

    // Motorization
    if (config.motorization && config.motorization !== 'none') {
      const motorOption = MOTORIZATION_OPTIONS.find(opt => opt.id === config.motorization);
      parts.push(`Motorization: ${motorOption?.name || config.motorization}`);
    }

    // Legacy fields (for backwards compatibility)
    if (config.mount) {
      parts.push(`Mount: ${config.mount.charAt(0).toUpperCase() + config.mount.slice(1)}`);
    }
    if (config.room) parts.push(`Room: ${config.room}`);
    if (config.colour) parts.push(`Color: ${config.colour}`);
    if (config.valance) parts.push(`Valance: ${config.valance}`);
    if (config.control) parts.push(`Control: ${config.control}`);
    if (config.lift) parts.push(`Lift: ${config.lift}`);

    return parts;
  };

  const getCustomizationCosts = (config: any, productTags: string[], productName?: string, productSlug?: string) => {
    const costs: { label: string; price: number }[] = [];
    const romanProduct = isRomanProduct(productTags);
    const easyStickProduct = isEasyStickProduct({
      tags: productTags,
      name: productName,
      slug: productSlug,
    });
    const fauxWoodenProduct = isFauxWoodenProduct({
      tags: productTags,
      name: productName,
      slug: productSlug,
    });
    const perfectFitWoodenProduct = isPerfectFitWoodenProduct({
      tags: productTags,
      name: productName,
      slug: productSlug,
    });
    const perfectFitMetalProduct = isPerfectFitMetalProduct({
      tags: productTags,
      name: productName,
    });
    const skylightProduct = isSkylightProduct({
      tags: productTags,
      name: productName,
      slug: productSlug,
    });
    const easyStickSubtype = easyStickProduct
      ? getEasyStickSubtype({ tags: productTags, name: productName, slug: productSlug })
      : null;
    const easyStickLabels = getEasyStickFieldLabels(easyStickSubtype);
    const perfectFitWoodenLabels = getPerfectFitWoodenFieldLabels();
    const perfectFitMetalLabels = getPerfectFitMetalFieldLabels();

    // Headrail Colour
    if (config.headrailColour) {
      const option = HEADRAIL_COLOUR_OPTIONS.find(opt => opt.id === config.headrailColour);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Installation Method
    if (config.installationMethod) {
      const option = INSTALLATION_METHOD_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        ROLLER_INSTALLATION_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        NO_DRILL_INSTALLATION_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        EASY_STICK_MEASUREMENT_TYPE_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        EASY_STICK_FITTING_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        PERFECT_FIT_WOODEN_MEASUREMENT_TYPE_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        PERFECT_FIT_METAL_MEASUREMENT_TYPE_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        ROMAN_INSTALLATION_OPTIONS.find(opt => opt.id === config.installationMethod) ||
        VENETIAN_INSTALLATION_OPTIONS.find(opt => opt.id === config.installationMethod);
      if (option?.price && option.price > 0) {
        costs.push({ label: easyStickProduct ? `${easyStickLabels.installationMethod}: ${option.name}` : perfectFitWoodenProduct ? `${perfectFitWoodenLabels.installationMethod}: ${option.name}` : perfectFitMetalProduct ? `${perfectFitMetalLabels.installationMethod}: ${option.name}` : option.name, price: option.price });
      }
    }

    // Control Option
    if (config.controlOption) {
      const option = CONTROL_OPTIONS.find(opt => opt.id === config.controlOption) ||
        ROLLER_CONTROL_OPTIONS.find(opt => opt.id === config.controlOption) ||
        WOODEN_TOGGLE_OPTIONS.find(opt => opt.id === config.controlOption) ||
        EASY_STICK_HONEYCOMB_OPERATION_OPTIONS.find(opt => opt.id === config.controlOption) ||
        EASY_STICK_WOOD_OPERATION_OPTIONS.find(opt => opt.id === config.controlOption) ||
        EASY_STICK_SLAT_SIZE_OPTIONS.find(opt => opt.id === config.controlOption) ||
        ROMAN_CONTROL_OPTIONS.find(opt => opt.id === config.controlOption);
      if (option?.price && option.price > 0) {
        costs.push({ label: easyStickProduct ? `${easyStickLabels.controlOption}: ${option.name}` : fauxWoodenProduct ? `Toggle: ${option.name}` : option.name, price: option.price });
      }
    }

    if (config.liningType) {
      const option = LINING_TYPE_OPTIONS.find(opt => opt.id === config.liningType);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Stacking
    if (config.stacking) {
      const option = Object.values(VERTICAL_STACKING_OPTIONS).flat().find((opt: { id: string; price: number }) => opt.id === config.stacking);
      if (option?.price && option.price > 0) {
        costs.push({ label: 'Stacking', price: option.price });
      }
    }

    // Control Side
    if (config.controlSide) {
      const option = CONTROL_SIDE_OPTIONS.find(opt => opt.id === config.controlSide) ||
        PERFECT_FIT_WOODEN_CONTROL_SIDE_OPTIONS.find(opt => opt.id === config.controlSide) ||
        PERFECT_FIT_METAL_CONTROL_SIDE_OPTIONS.find(opt => opt.id === config.controlSide) ||
        EASY_STICK_METAL_CONTROLS_OPTIONS.find(opt => opt.id === config.controlSide) ||
        EASY_STICK_WOOD_CONTROL_SIDE_OPTIONS.find(opt => opt.id === config.controlSide);
      if (option?.price && option.price > 0) {
        costs.push({ label: easyStickProduct ? `${easyStickLabels.controlSide || 'Control Side'}: ${option.name}` : perfectFitWoodenProduct ? `${perfectFitWoodenLabels.controlSide}: ${option.name}` : perfectFitMetalProduct ? `${perfectFitMetalLabels.controlSide}: ${option.name}` : option.name, price: option.price });
      }
    }

    if (config.frameColor) {
      const option = EASY_STICK_PROFILE_COLOR_OPTIONS.find(opt => opt.id === config.frameColor) ||
        PERFECT_FIT_WOODEN_FRAME_COLOR_OPTIONS.find(opt => opt.id === config.frameColor) ||
        PERFECT_FIT_METAL_FRAME_COLOR_OPTIONS.find(opt => opt.id === config.frameColor);
      if (option?.price && option.price > 0) {
        costs.push({ label: easyStickProduct ? `${easyStickLabels.frameColor || 'Profile Color'}: ${option.name}` : perfectFitWoodenProduct ? `${perfectFitWoodenLabels.frameColor}: ${option.name}` : perfectFitMetalProduct ? `${perfectFitMetalLabels.frameColor}: ${option.name}` : option.name, price: option.price });
      }
    }

    if (skylightProduct && config.blindType) {
      const option = findSkylightBlindTypeOption(config.blindType);
      if (option?.price && option.price > 0) {
        costs.push({ label: `Blind Type: ${option.code}`, price: option.price });
      }
    }

    // Bottom Chain
    if (config.bottomChain) {
      const option = BOTTOM_CHAIN_OPTIONS.find(opt => opt.id === config.bottomChain);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Bracket Type
    if (config.bracketType) {
      const option = BRACKET_TYPE_OPTIONS.find(opt => opt.id === config.bracketType) ||
        PERFECT_FIT_WOODEN_BRACKET_SIZE_OPTIONS.find(opt => opt.id === config.bracketType) ||
        PERFECT_FIT_METAL_BRACKET_SIZE_OPTIONS.find(opt => opt.id === config.bracketType);
      if (option?.price && option.price > 0) {
        costs.push({ label: perfectFitWoodenProduct ? `${perfectFitWoodenLabels.bracketType}: ${option.name}` : perfectFitMetalProduct ? `${perfectFitMetalLabels.bracketType}: ${option.name}` : option.name, price: option.price });
      }
    }

    // Chain Color
    if (config.chainColor) {
      const option = (romanProduct ? ROMAN_CHAIN_COLOR_OPTIONS : CHAIN_COLOR_OPTIONS)
        .find(opt => opt.id === config.chainColor);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Chrome Upgrade (Day & Night)
    if (config.chromeUpgrade) {
      const option = CHROME_UPGRADE_OPTIONS.find(opt => opt.id === config.chromeUpgrade);
      if (option?.price && option.price > 0) {
        costs.push({ label: 'Upgrade to Chrome', price: option.price });
      }
    }

    // Wrapped Cassette
    if (config.wrappedCassette) {
      const option = WRAPPED_CASSETTE_OPTIONS.find(opt => opt.id === config.wrappedCassette);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Cassette Matching Bar
    if (config.cassetteMatchingBar) {
      const option = CASSETTE_MATCHING_BAR_OPTIONS.find(opt => opt.id === config.cassetteMatchingBar);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    // Same Fabric Insert in Cassette (Day & Night)
    if (config.sameFabricInsert) {
      const option = FABRIC_INSERT_CASSETTE_OPTIONS.find(opt => opt.id === config.sameFabricInsert);
      if (option?.price && option.price > 0) {
        costs.push({ label: 'Same Fabric Insert in Cassette', price: option.price });
      }
    }

    // Matching Fabric on cover cassette (Roller)
    if (config.matchingFabricCassette) {
      const option = MATCHING_FABRIC_CASSETTE_OPTIONS.find(opt => opt.id === config.matchingFabricCassette);
      if (option?.price && option.price > 0) {
        costs.push({ label: 'Matching Fabric on Cover Cassette', price: option.price });
      }
    }

    // Motorization
    if (config.motorization && config.motorization !== 'none') {
      const option = MOTORIZATION_OPTIONS.find(opt => opt.id === config.motorization);
      if (option?.price && option.price > 0) {
        costs.push({ label: option.name, price: option.price });
      }
    }

    return costs;
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background-alt">
        <Header />

        <main className="px-4 py-12 md:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-border bg-white px-6 py-10 text-center shadow-sm md:px-10 md:py-14">
              <div className="mb-6 flex justify-center">
                <div className="flex h-22 w-22 items-center justify-center rounded-full bg-primary-light text-primary">
                  <Image src="/icons/cart.svg" alt="Empty Cart" width={44} height={44} className="opacity-80" />
                </div>
              </div>
              <h1 className="font-display text-[36px] leading-none text-foreground md:text-[44px]">Your Cart is Empty</h1>
              <p className="mx-auto mt-3 max-w-lg text-[15px] text-muted md:text-[16px]">
                Looks like you haven&apos;t added any custom blinds yet. Explore collections and build your perfect fit.
              </p>
              <Link
                href="/collections"
                className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-jost text-[14px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-primary-dark"
              >
                Browse Collections
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-alt">
      <Header />

      <section className="border-b border-border bg-white px-4 py-5 md:px-6 md:py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav className="mb-2 flex items-center gap-2 text-[13px] text-muted">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <span className="font-medium text-foreground">Shopping Cart</span>
          </nav>
          <h1 className="font-display text-[34px] leading-none text-foreground md:text-[42px]">
            Your Cart <span className="font-jost text-[17px] font-medium text-muted">({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})</span>
          </h1>
        </div>
      </section>

      <main className="px-4 py-8 md:px-6 md:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            <section className="lg:col-span-8 xl:col-span-9">
              <div className="rounded-2xl border border-border bg-white p-4 md:p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-jost text-[15px] font-semibold uppercase tracking-[0.08em] text-foreground">
                    Selected Products
                  </h2>
                  {cart.items.length > 0 && (
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-red-600 transition-colors hover:bg-red-50"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <article key={item.id} className="rounded-xl border border-border bg-surface-muted p-4 md:p-5">
                      <div className="flex gap-4 md:gap-6">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-white md:h-28 md:w-28">
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="mb-3 flex justify-between gap-4">
                            <div>
                              <Link
                                href={`/product/${item.product.slug}`}
                                className="line-clamp-2 text-[16px] font-semibold text-foreground hover:text-primary md:text-[18px]"
                              >
                                {item.product.name}
                              </Link>
                            </div>
                            <div className="flex shrink-0 items-start gap-2">
                              <button
                                onClick={() => openEditModal(item)}
                                className="rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-muted transition-colors hover:text-red-600"
                                aria-label="Remove item"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          <div className="mb-4 space-y-1">
                            {formatConfiguration(item.configuration, item.product.tags, item.product.name, item.product.slug).map((detail, idx) => (
                              <p key={idx} className="text-[12px] text-muted md:text-[13px]">
                                {detail}
                              </p>
                            ))}

                            {/* Show customization costs if any */}
                            {(() => {
                              const costs = getCustomizationCosts(item.configuration, item.product.tags, item.product.name, item.product.slug);
                              if (costs.length > 0) {
                                return (
                                  <div className="mt-3 rounded-lg border border-primary/20 bg-primary-light p-3">
                                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-foreground">Customization Costs</p>
                                    {costs.map((cost, idx) => (
                                      <p key={idx} className="flex justify-between text-[12px] text-foreground">
                                        <span>+ {cost.label}</span>
                                        <span className="font-medium">${cost.price.toFixed(2)}</span>
                                      </p>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-[13px] text-muted">Quantity</span>
                              <div className="flex items-center overflow-hidden rounded-lg border border-border bg-white">
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="px-3 py-1.5 text-foreground transition-colors hover:bg-surface-muted"
                                  aria-label="Decrease quantity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                  </svg>
                                </button>
                                <span className="min-w-10 px-4 py-1.5 text-center text-sm font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="px-3 py-1.5 text-foreground transition-colors hover:bg-surface-muted"
                                  aria-label="Increase quantity"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="text-[20px] font-bold text-foreground md:text-[22px]">
                              {formatPriceWithCurrency(item.product.price * item.quantity, item.product.currency)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-6 border-t border-border pt-6">
                  <Link
                    href="/collections"
                    className="inline-flex items-center gap-2 font-medium text-primary hover:text-primary-dark"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </section>

            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-sm lg:sticky lg:top-24 md:p-6">
                <h2 className="mb-4 font-display text-[30px] leading-none text-foreground">Order Summary</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-medium text-foreground">
                      {formatPriceWithCurrency(cart.total - cart.installationServicePrice + cart.discountAmount)}
                    </span>
                  </div>
                  {cart.discount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted">Discount ({cart.discount.code})</span>
                      <span className="font-medium text-green-700">
                        -{formatPriceWithCurrency(cart.discountAmount)}
                      </span>
                    </div>
                  )}
                  <label className="flex items-start justify-between gap-3 text-sm cursor-pointer">
                    <span className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={cart.installationService}
                        onChange={(e) => setInstallationService(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="flex items-center gap-1.5 text-muted">
                        Add professional installation
                        <InstallationServiceInfo />
                      </span>
                    </span>
                    <span className="font-medium text-foreground whitespace-nowrap">
                      {formatPriceWithCurrency(getInstallationServicePrice(cart.itemCount))}
                    </span>
                  </label>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Shipping</span>
                    <span className="text-sm italic text-muted">Calculated at checkout</span>
                  </div>
                </div>

                <div className="mb-4 border-t border-border pt-4">
                  {cart.discount ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-green-800">{cart.discount.title}</p>
                        <p className="text-[11px] text-green-700">Code &quot;{cart.discount.code}&quot; applied</p>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="shrink-0 text-xs font-semibold text-green-800 underline hover:text-green-900"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          placeholder="Discount code"
                          className="h-10 flex-1 min-w-0 rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim()}
                          className="h-10 shrink-0 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isApplyingCoupon ? 'Applying…' : 'Apply'}
                        </button>
                      </div>
                      {couponError && <p className="mt-1.5 text-xs text-red-600">{couponError}</p>}
                    </div>
                  )}
                </div>

                <div className="mb-6 border-t border-border pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatPriceWithCurrency(finalTotal)}</span>
                  </div>
                </div>

                {priceUpdateNotice && priceUpdateNotice.length > 0 && (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-amber-900">
                      Some prices in your cart were updated
                    </p>
                    <ul className="space-y-0.5 text-xs text-amber-800">
                      {priceUpdateNotice.map((change) => (
                        <li key={change.id}>
                          {change.name}: {formatPriceWithCurrency(change.oldPrice)} →{' '}
                          {formatPriceWithCurrency(change.newPrice)}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setPriceUpdateNotice(null)}
                      className="mt-2 text-xs font-semibold text-amber-900 underline hover:text-amber-950"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {checkoutError && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-xs text-red-800">{checkoutError}</p>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  data-gtm="begin-checkout"
                  data-gtm-location="shopping-cart"
                  className="mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCheckingOut ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>

                <button className="h-12 w-full rounded-lg border border-border px-6 text-base font-medium text-foreground transition-colors hover:bg-surface-muted">
                  Request Free Samples
                </button>

                <div className="mt-6 border-t border-border pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-muted">30-day return policy</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-muted">Secure checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-lg">
            <h3 className="mb-3 text-xl font-bold text-foreground">Clear Cart?</h3>
            <p className="mb-6 text-muted">
              Are you sure you want to remove all items from your cart? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 font-medium text-foreground transition-colors hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-[60] bg-black/55 p-3 md:p-6">
          <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Edit Customisation</p>
                <p className="truncate text-sm font-semibold text-foreground md:text-base">{editingItem.product.name}</p>
              </div>
              <button
                onClick={closeEditModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                aria-label="Close edit customisation"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <CustomizationModal
                product={editingItem.product}
                config={editingConfig}
                setConfig={setEditingConfig}
                onClose={closeEditModal}
                mode="edit"
                presentation="modal"
                onSaveConfiguredProduct={handleSaveEditedItem}
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
