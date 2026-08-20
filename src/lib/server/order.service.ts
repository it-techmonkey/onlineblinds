import { calculateProductPrice, type PricingRequest, type PricingResponse } from './pricing.service';
import { getAdminApiUrl, getAdminHeaders, validateShopifyConfig } from './shopify-admin';
import { getCachedProduct } from './product-cache';
import { resolveDiscountCode } from './discount.service';
import { isHeightOnlyVerticalProduct } from '@/lib/vertical-blinds';
import { isRomanProduct } from '@/lib/roman-blinds';
import { isRollerBlindProduct } from '@/lib/roller-blinds';
import { isSkylightProduct } from '@/lib/skylight';
import { isPerfectFitMetalProduct } from '@/lib/perfect-fit-metal';
import { isPerfectFitShutterProduct } from '@/lib/perfect-fit-shutter';
import { findSkylightBlindTypeOption, findSkylightBrandOption } from '@/data/skylight';
import { getInstallationServiceTier } from '@/lib/pricing';

// ============================================
// Types
// ============================================

export interface CheckoutItemRequest {
  handle: string;
  widthInches: number;
  heightInches: number;
  quantity: number;
  submittedPrice: number;
  configuration: {
    roomType?: string;
    blindName?: string;
    headrail?: string;
    headrailColour?: string;
    installationMethod?: string;
    controlOption?: string;
    liningType?: string;
    stacking?: string;
    controlSide?: string;
    bottomChain?: string;
    bracketType?: string;
    chainColor?: string;
    wrappedCassette?: string;
    cassetteMatchingBar?: string;
    motorization?: string;
    brand?: string;
    blindType?: string;
    blindColor?: string;
    frameColor?: string;
    handlePosition?: string;
    numberOfPanels?: string;
    openingDirection?: string;
    bottomBar?: string;
    rollStyle?: string;
    [key: string]: string | undefined;
  };
}

export interface CreateCheckoutRequest {
  items: CheckoutItemRequest[];
  customerEmail?: string;
  note?: string;
  installationService?: boolean;
  discountCode?: string;
}

export interface CreateCheckoutResponse {
  checkoutUrl: string;
  draftOrderId: string;
  lineItems: {
    handle: string;
    title: string;
    calculatedPrice: number;
    quantity: number;
  }[];
  subtotal: number;
}

interface ShopifyDraftOrderLineItem {
  quantity: number;
  customAttributes: { key: string; value: string }[];
  variantId?: string;
  priceOverride?: { amount: string; currencyCode: string };
  title?: string;
  originalUnitPriceWithCurrency?: { amount: string; currencyCode: string };
}

const variantIdByHandleCache = new Map<string, number | null>();
const DRAFT_ORDER_CURRENCY = 'GBP';
const INSTALLATION_SERVICE_HANDLE = 'installation-service';

let installationServiceVariantsCache: Map<string, number> | null = null;

// ============================================
// Helper Functions
// ============================================

function configToCustomizations(
  config: CheckoutItemRequest['configuration'],
  productTags: string[]
): PricingRequest['customizations'] {
  const customizations: { category: string; optionId: string }[] = [];
  const romanProduct = isRomanProduct(productTags);
  const rollerProduct = isRollerBlindProduct(productTags);
  const perfectFitMetalProduct = isPerfectFitMetalProduct({ tags: productTags });

  const mappings: Record<string, string> = {
    roomType: 'room-type',
    headrail: 'headrail',
    headrailColour: 'headrail-colour',
    installationMethod: 'installation-method',
    controlOption: 'control-option',
    liningType: 'lining-type',
    stacking: 'stacking',
    controlSide: 'control-side',
    bottomChain: 'bottom-chain',
    bracketType: 'bracket-type',
    chainColor: romanProduct ? 'roman-chain-color' : 'chain-color',
    chromeUpgrade: 'chrome-upgrade',
    wrappedCassette: 'wrapped-cassette',
    // Roller and Day & Night both use white/grey/black cassette ids but price them
    // from different tables, so the category must be chosen by product type — the
    // 'cassette-bar' → 'roller-cassette' fallback in pricing.service.ts can never
    // fire for roller, since 'cassette-bar' always matches first.
    cassetteMatchingBar: rollerProduct ? 'roller-cassette' : 'cassette-bar',
    sameFabricInsert: 'fabric-insert-cassette',
    matchingFabricCassette: 'matching-fabric-cassette',
    motorization: 'motorization',
    brand: 'skylight-brand',
    blindType: 'skylight-blind-type',
    blindColor: 'blind-color',
    numberOfPanels: 'number-of-panels',
    openingDirection: 'opening-direction',
    bottomBar: 'bottom-bar',
    rollStyle: 'roll-style',
  };

  for (const [configKey, category] of Object.entries(mappings)) {
    const value = config[configKey];
    if (value && value !== 'none') {
      customizations.push({ category, optionId: value });
    }
  }

  if (config.frameColor && config.frameColor !== 'none') {
    customizations.push({
      category: perfectFitMetalProduct ? 'perfect-fit-metal-frame-color' : 'frame-color',
      optionId: config.frameColor,
    });
  }

  return customizations;
}

/**
 * The server only ever sees a size in total inches — CheckoutItemRequest doesn't
 * carry which display unit (cm/mm) the customer used on the size selector. Display
 * everything in cm here, matching the metric-only frontend.
 */
function formatInchesAsCm(inches: number): string {
  return `${(inches * 2.54).toFixed(1)}cm`;
}

function buildLineItemProperties(
  item: CheckoutItemRequest,
  calculatedPrice: number,
  productTags: string[]
): { key: string; value: string }[] {
  const properties: { key: string; value: string }[] = [];
  const heightOnlyVertical = isHeightOnlyVerticalProduct(productTags);
  const skylightProduct = isSkylightProduct({ tags: productTags });
  const perfectFitShutterProduct = isPerfectFitShutterProduct({ tags: productTags });

  if (!heightOnlyVertical && !skylightProduct) {
    properties.push({ key: 'Width', value: formatInchesAsCm(item.widthInches) });
  }
  if (!skylightProduct) {
    properties.push({ key: 'Height', value: formatInchesAsCm(item.heightInches) });
  }

  if (item.configuration.roomType) {
    properties.push({ key: 'Room Type', value: item.configuration.roomType });
  }
  if (item.configuration.blindName) {
    properties.push({ key: 'Blind Name', value: item.configuration.blindName });
  }

  const labelMap: Record<string, string> = {
    colour: 'Colour',
    headrail: 'Headrail',
    headrailColour: 'Headrail Colour',
    installationMethod: perfectFitShutterProduct ? 'Measurement Type' : 'Installation',
    controlOption: perfectFitShutterProduct ? 'Window Handle Location' : 'Control Option',
    liningType: 'Lining Type',
    stacking: 'Stacking',
    controlSide: 'Control Side',
    bottomChain: 'Bottom Chain',
    bracketType: perfectFitShutterProduct ? 'Bracket Size' : 'Bracket Type',
    chainColor: 'Chain Color',
    chromeUpgrade: 'Chrome Upgrade',
    wrappedCassette: 'Wrapped Cassette',
    cassetteMatchingBar: 'Cassette Bar',
    sameFabricInsert: 'Same Fabric Insert',
    matchingFabricCassette: 'Matching Fabric on Cover Cassette',
    motorization: 'Motorization',
    brand: 'Brand',
    blindType: 'Blind Type',
    blindColor: 'Blind Color',
    frameColor: 'Frame Color',
    handlePosition: 'Handle Position',
    numberOfPanels: 'Number of Panels',
    openingDirection: 'Opening Direction',
    bottomBar: 'Bottom Bar',
    rollStyle: 'Roll Style',
  };

  for (const [key, label] of Object.entries(labelMap)) {
    const value = item.configuration[key];
    if (value && value !== 'none') {
      if (key === 'brand') {
        properties.push({ key: label, value: findSkylightBrandOption(value)?.name || value });
        continue;
      }
      if (key === 'blindType') {
        properties.push({ key: label, value: findSkylightBlindTypeOption(value)?.code || value });
        continue;
      }
      if (key === 'handlePosition') {
        properties.push({ key: label, value: `${value} mm` });
        continue;
      }
      properties.push({ key: label, value });
    }
  }

  properties.push({ key: '_calculatedPrice', value: calculatedPrice.toFixed(2) });

  return properties;
}

/**
 * Resolve the Shopify variant to book for a line item.
 *
 * Most products have a single default variant, but products with a `Colour`
 * option have one variant per colour — for those the customer's chosen colour
 * must select the matching variant. Taking `variants[0]` would silently book
 * every order against the first colour.
 *
 * The cache is keyed by handle *and* colour for the same reason.
 */
async function getVariantIdByHandle(handle: string, colour?: string): Promise<number | null> {
  const cacheKey = colour ? `${handle}::${colour}` : handle;
  const cached = variantIdByHandleCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const url = getAdminApiUrl(`/products.json?handle=${encodeURIComponent(handle)}&fields=variants`);
    const response = await fetch(url, {
      headers: getAdminHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      variantIdByHandleCache.set(cacheKey, null);
      return null;
    }

    const data = (await response.json()) as {
      products?: Array<{ variants?: Array<{ id?: number | string; title?: string; option1?: string }> }>;
    };
    const variants = data.products?.[0]?.variants || [];

    // Match on the colour option value. For a multi-variant product we never guess:
    // booking the wrong colour would put the wrong blind into manufacturing, so an
    // unmatched or missing colour returns null and the line item is created without
    // a variant binding instead.
    const matched = colour
      ? variants.find(
          (variant) =>
            variant.option1?.toLowerCase() === colour.toLowerCase() ||
            variant.title?.toLowerCase() === colour.toLowerCase()
        )
      : undefined;

    const isMultiVariant = variants.length > 1;
    const selected = isMultiVariant ? matched : variants[0];

    if (isMultiVariant && !matched) {
      console.error(
        `[OrderService] "${handle}" has ${variants.length} variants but ` +
          (colour
            ? `no variant matches colour "${colour}"`
            : 'no colour was supplied') +
          ' — refusing to fall back to the first variant.'
      );
    }

    const rawId = selected?.id;
    const parsed =
      typeof rawId === 'number'
        ? rawId
        : typeof rawId === 'string'
          ? Number(rawId)
          : NaN;

    const variantId = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    variantIdByHandleCache.set(cacheKey, variantId);
    return variantId;
  } catch (error) {
    console.error(`[OrderService] Failed variant lookup for handle "${handle}":`, error);
    variantIdByHandleCache.set(cacheKey, null);
    return null;
  }
}

async function getInstallationServiceVariantId(variantTitle: string): Promise<number | null> {
  if (!installationServiceVariantsCache) {
    const url = getAdminApiUrl(
      `/products.json?handle=${encodeURIComponent(INSTALLATION_SERVICE_HANDLE)}&fields=variants`
    );
    const response = await fetch(url, {
      headers: getAdminHeaders(),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`[OrderService] Failed to fetch "${INSTALLATION_SERVICE_HANDLE}" variants: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      products?: Array<{ variants?: Array<{ id?: number | string; title?: string }> }>;
    };
    const variants = data.products?.[0]?.variants || [];

    const map = new Map<string, number>();
    for (const variant of variants) {
      const parsed = typeof variant.id === 'string' ? Number(variant.id) : variant.id;
      if (variant.title && Number.isFinite(parsed) && parsed! > 0) {
        map.set(variant.title, parsed!);
      }
    }
    installationServiceVariantsCache = map;
  }

  return installationServiceVariantsCache.get(variantTitle) ?? null;
}

const PRICE_TOLERANCE = 0.50;

// ============================================
// Service Functions
// ============================================

export class CheckoutError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'CheckoutError';
    this.statusCode = statusCode;
  }
}

/**
 * Price a single checkout item the same way regardless of caller — checkout
 * itself and the cart's pre-checkout price check both go through this, so
 * they can never compute a different price for the same item.
 */
async function computeCheckoutItemPricing(
  item: CheckoutItemRequest,
  productTags: string[]
): Promise<PricingResponse> {
  const customizations = configToCustomizations(item.configuration, productTags);
  return calculateProductPrice({
    handle: item.handle,
    widthInches: item.widthInches,
    heightInches: item.heightInches,
    customizations,
  });
}

export interface CartItemPriceCheck {
  handle: string;
  submittedPrice: number;
  calculatedPrice: number;
  valid: boolean;
}

/**
 * Re-check a set of cart items' submitted prices against a fresh calculation,
 * without creating a draft order. Used by the cart page to catch and correct
 * stale prices (e.g. after a pricing update) before the customer hits the
 * price-mismatch guard in createCheckout.
 */
export async function validateCartItemPrices(items: CheckoutItemRequest[]): Promise<CartItemPriceCheck[]> {
  const results: CartItemPriceCheck[] = [];

  for (const item of items) {
    try {
      const cachedProduct = await getCachedProduct(item.handle);
      if (!cachedProduct) {
        // Let checkout's own handle validation surface this — don't block the
        // cart from rendering over a lookup issue unrelated to pricing.
        results.push({
          handle: item.handle,
          submittedPrice: item.submittedPrice,
          calculatedPrice: item.submittedPrice,
          valid: true,
        });
        continue;
      }

      const pricing = await computeCheckoutItemPricing(item, cachedProduct.tags);
      results.push({
        handle: item.handle,
        submittedPrice: item.submittedPrice,
        calculatedPrice: pricing.totalPrice,
        valid: Math.abs(pricing.totalPrice - item.submittedPrice) <= PRICE_TOLERANCE,
      });
    } catch (error) {
      console.error(`[OrderService] Cart price check failed for "${item.handle}":`, error);
      results.push({
        handle: item.handle,
        submittedPrice: item.submittedPrice,
        calculatedPrice: item.submittedPrice,
        valid: true,
      });
    }
  }

  return results;
}

export async function createCheckout(request: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
  validateShopifyConfig();

  if (!request.items || request.items.length === 0) {
    throw new CheckoutError('Cart is empty', 400);
  }

  const lineItems: ShopifyDraftOrderLineItem[] = [];
  const responseLineItems: CreateCheckoutResponse['lineItems'] = [];
  let subtotal = 0;

  for (const item of request.items) {
    if (!item.handle) {
      throw new CheckoutError('Each item must have a handle', 400);
    }
    const cachedProduct = await getCachedProduct(item.handle);
    if (!cachedProduct) {
      throw new CheckoutError(`Product not found: ${item.handle}`, 404);
    }

    const heightOnlyVertical = isHeightOnlyVerticalProduct(cachedProduct.tags);
    const skylightProduct = isSkylightProduct({ tags: cachedProduct.tags });

    if (typeof item.widthInches !== 'number' || (!heightOnlyVertical && item.widthInches <= 0)) {
      throw new CheckoutError('Each item must have a positive widthInches', 400);
    }
    if (typeof item.heightInches !== 'number' || item.heightInches <= 0) {
      throw new CheckoutError('Each item must have a positive heightInches', 400);
    }
    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      throw new CheckoutError('Each item must have a quantity >= 1', 400);
    }

    const productTitle = item.configuration.blindName?.trim() || cachedProduct.title;
    const pricing = await computeCheckoutItemPricing(item, cachedProduct.tags);

    const priceDifference = Math.abs(pricing.totalPrice - item.submittedPrice);
    if (priceDifference > PRICE_TOLERANCE) {
      throw new CheckoutError(
        `Price mismatch for "${productTitle}": submitted $${item.submittedPrice.toFixed(2)}, ` +
        `calculated $${pricing.totalPrice.toFixed(2)} (diff: $${priceDifference.toFixed(2)})`,
        422
      );
    }

    const itemPrice = pricing.totalPrice;
    const lineItemTitle = skylightProduct
      ? productTitle
      : heightOnlyVertical
      ? `${productTitle} – Height ${formatInchesAsCm(item.heightInches)}`
      : `${productTitle} – ${formatInchesAsCm(item.widthInches)} × ${formatInchesAsCm(item.heightInches)}`;

    const variantId = await getVariantIdByHandle(item.handle, item.configuration.colour);
    const customAttributes = buildLineItemProperties(item, itemPrice, cachedProduct.tags);

    if (variantId) {
      lineItems.push({
        variantId: `gid://shopify/ProductVariant/${variantId}`,
        priceOverride: {
          amount: itemPrice.toFixed(2),
          currencyCode: DRAFT_ORDER_CURRENCY,
        },
        quantity: item.quantity,
        customAttributes,
      });
    } else {
      lineItems.push({
        title: lineItemTitle,
        quantity: item.quantity,
        originalUnitPriceWithCurrency: {
          amount: itemPrice.toFixed(2),
          currencyCode: DRAFT_ORDER_CURRENCY,
        },
        customAttributes,
      });
    }

    responseLineItems.push({
      handle: item.handle,
      title: lineItemTitle,
      calculatedPrice: itemPrice,
      quantity: item.quantity,
    });

    subtotal += itemPrice * item.quantity;
  }

  if (request.installationService) {
    const totalBlindQuantity = request.items.reduce((sum, item) => sum + item.quantity, 0);
    const tier = getInstallationServiceTier(totalBlindQuantity);
    const installationVariantId = await getInstallationServiceVariantId(tier.variantTitle);

    if (!installationVariantId) {
      throw new CheckoutError(
        `Installation service product/variant not found (handle: "${INSTALLATION_SERVICE_HANDLE}", tier: "${tier.variantTitle}"). ` +
        'Run scripts/create-installation-service-product.mjs to create it.',
        500
      );
    }

    lineItems.push({
      variantId: `gid://shopify/ProductVariant/${installationVariantId}`,
      priceOverride: {
        amount: tier.price.toFixed(2),
        currencyCode: DRAFT_ORDER_CURRENCY,
      },
      quantity: 1,
      customAttributes: [],
    });

    responseLineItems.push({
      handle: INSTALLATION_SERVICE_HANDLE,
      title: 'Installation Service',
      calculatedPrice: tier.price,
      quantity: 1,
    });

    subtotal += tier.price;
  }

  // Sanity-check the code server-side so an obviously bad one (expired,
  // inactive, exhausted) fails loudly here instead of silently doing nothing.
  // The actual redemption below goes through Shopify's own `discountCodes`
  // field rather than a hand-computed appliedDiscount, so Shopify — not us —
  // is the authority on eligibility rules we don't replicate (minimum
  // purchase, applicable products/collections, combination limits, etc.).
  if (request.discountCode) {
    const discount = await resolveDiscountCode(request.discountCode);
    if (!discount) {
      throw new CheckoutError(`Discount code "${request.discountCode}" is invalid or has expired.`, 422);
    }
  }

  const mutation = `
    mutation DraftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          invoiceUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await fetch(getAdminApiUrl('/graphql.json'), {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          lineItems,
          useCustomerDefaultAddress: true,
          note: request.note || '',
          ...(request.customerEmail && { email: request.customerEmail }),
          ...(request.discountCode && { discountCodes: [request.discountCode] }),
          // Lets the customer also enter/change a code directly on Shopify's
          // hosted checkout page — draft order checkouts hide that field by
          // default, which is exactly the gap this fills.
          allowDiscountCodesInCheckout: true,
          presentmentCurrencyCode: DRAFT_ORDER_CURRENCY,
        },
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 401) {
      throw new CheckoutError('Shopify authentication failed. Check SHOPIFY_ADMIN_ACCESS_TOKEN.', 500);
    }
    if (response.status === 429) {
      throw new CheckoutError('Shopify rate limit exceeded. Please try again in a moment.', 429);
    }
    throw new CheckoutError(`Failed to create checkout: ${errorBody}`, 500);
  }

  const data = await response.json() as {
    data?: {
      draftOrderCreate?: {
        draftOrder?: { id: string; invoiceUrl: string | null } | null;
        userErrors?: Array<{ field?: string[] | null; message: string }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  if (data.errors?.length) {
    throw new CheckoutError(`Failed to create checkout: ${data.errors[0]?.message || 'Unknown GraphQL error'}`, 500);
  }

  const draftOrderCreate = data.data?.draftOrderCreate;
  const userErrors = draftOrderCreate?.userErrors || [];
  if (userErrors.length > 0) {
    const message = userErrors.map((error) => error.message).join('; ');
    throw new CheckoutError(`Shopify rejected the draft order: ${message}`, 422);
  }

  const draftOrder = draftOrderCreate?.draftOrder;
  if (!draftOrder || !draftOrder.invoiceUrl) {
    throw new CheckoutError('Failed to create Shopify draft order: no invoice URL returned', 500);
  }

  return {
    checkoutUrl: draftOrder.invoiceUrl,
    draftOrderId: draftOrder.id.toString(),
    lineItems: responseLineItems,
    subtotal,
  };
}

export async function getDraftOrderStatus(draftOrderId: string): Promise<{
  id: string;
  status: string;
  orderId: string | null;
  orderName: string | null;
  invoiceUrl: string;
  totalPrice: string;
  createdAt: string;
}> {
  validateShopifyConfig();

  const url = getAdminApiUrl(`/draft_orders/${draftOrderId}.json`);
  const response = await fetch(url, {
    headers: getAdminHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new CheckoutError('Draft order not found', 404);
    }
    throw new CheckoutError(`Failed to get draft order status: ${response.statusText}`, 500);
  }

  const data = await response.json();
  const draftOrder = data.draft_order;
  const orderId =
    typeof draftOrder.order_id === 'string' || typeof draftOrder.order_id === 'number'
      ? String(draftOrder.order_id)
      : typeof draftOrder.order_id?.id === 'string' || typeof draftOrder.order_id?.id === 'number'
        ? String(draftOrder.order_id.id)
        : null;

  return {
    id: draftOrder.id.toString(),
    status: draftOrder.status,
    orderId,
    orderName: draftOrder.name || null,
    invoiceUrl: draftOrder.invoice_url,
    totalPrice: draftOrder.total_price,
    createdAt: draftOrder.created_at,
  };
}
