"use client";

import type { CartItem, Product, ProductConfiguration } from "@/types";

/**
 * Google Tag Manager dataLayer helpers.
 *
 * Events follow the GA4 ecommerce schema so GTM tags can map them without
 * custom variables. This is a separate pipeline from `shopify-analytics.ts`,
 * which posts to Shopify's Monorail endpoint and never touches the dataLayer.
 */

const currency = process.env.NEXT_PUBLIC_SHOPIFY_ANALYTICS_CURRENCY || "GBP";

export interface DataLayerEvent {
  event: string;
  [key: string]: unknown;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/**
 * Push a raw event. The dataLayer is created by the `beforeInteractive` script
 * in the root layout, so pushes from early-mounting components are queued
 * rather than dropped if GTM itself has not loaded yet.
 */
export function pushToDataLayer(payload: DataLayerEvent) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

/**
 * Push an ecommerce event, clearing the previous `ecommerce` object first.
 *
 * Without the null push, GTM merges each new ecommerce object into the
 * previous one and stale items leak between events — a long-standing gotcha
 * on single-page apps where the dataLayer is never reset by a page load.
 */
export function pushEcommerceEvent(event: string, ecommerce: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, ecommerce: { currency, ...ecommerce } });
}

// ============================================
// Item mapping
// ============================================

/** GA4 `items` entry. */
export interface GtmItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity: number;
  index?: number;
}

/**
 * Summarise a configuration into a GA4 `item_variant` string. Blinds are made
 * to measure, so the dimensions are the closest thing to a variant identity.
 */
function describeConfiguration(configuration?: ProductConfiguration): string | undefined {
  if (!configuration) return undefined;

  const parts: string[] = [];
  if (configuration.width && configuration.height) {
    const width = `${configuration.width}${configuration.widthFraction || ""}${configuration.widthUnit}`;
    const height = `${configuration.height}${configuration.heightFraction || ""}${configuration.heightUnit}`;
    parts.push(`${width} x ${height}`);
  }

  if (configuration.colour) parts.push(configuration.colour);

  return parts.length > 0 ? parts.join(" / ") : undefined;
}

export function toGtmItem(
  product: Product,
  quantity: number = 1,
  configuration?: ProductConfiguration,
  index?: number
): GtmItem {
  const item: GtmItem = {
    item_id: product.id,
    item_name: product.name,
    price: product.price,
    quantity,
  };

  if (product.category) item.item_category = product.category;

  const variant = describeConfiguration(configuration);
  if (variant) item.item_variant = variant;

  if (typeof index === "number") item.index = index;

  return item;
}

export function toGtmItems(items: CartItem[]): GtmItem[] {
  return items.map((item, index) =>
    toGtmItem(item.product, item.quantity, item.configuration, index)
  );
}

function sumValue(items: GtmItem[]): number {
  return Number(
    items.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
  );
}

// ============================================
// Ecommerce events
// ============================================

export function trackViewItem(product: Product) {
  const items = [toGtmItem(product)];
  pushEcommerceEvent("view_item", { value: sumValue(items), items });
}

export function trackViewItemList(
  products: Product[],
  listId: string,
  listName: string
) {
  pushEcommerceEvent("view_item_list", {
    item_list_id: listId,
    item_list_name: listName,
    items: products.map((product, index) => toGtmItem(product, 1, undefined, index)),
  });
}

export function trackSelectItem(
  product: Product,
  listId: string,
  listName: string,
  index?: number
) {
  pushEcommerceEvent("select_item", {
    item_list_id: listId,
    item_list_name: listName,
    items: [toGtmItem(product, 1, undefined, index)],
  });
}

export function trackAddToCart(
  product: Product,
  quantity: number = 1,
  configuration?: ProductConfiguration
) {
  const items = [toGtmItem(product, quantity, configuration)];
  pushEcommerceEvent("add_to_cart", { value: sumValue(items), items });
}

export function trackRemoveFromCart(item: CartItem) {
  const items = [toGtmItem(item.product, item.quantity, item.configuration)];
  pushEcommerceEvent("remove_from_cart", { value: sumValue(items), items });
}

export function trackViewCart(cartItems: CartItem[], total: number) {
  pushEcommerceEvent("view_cart", {
    value: Number(total.toFixed(2)),
    items: toGtmItems(cartItems),
  });
}

export function trackBeginCheckout(cartItems: CartItem[], total: number) {
  pushEcommerceEvent("begin_checkout", {
    value: Number(total.toFixed(2)),
    items: toGtmItems(cartItems),
  });
}

// ============================================
// Engagement events
// ============================================

export function trackSearch(searchTerm: string, resultCount?: number) {
  pushToDataLayer({
    event: "search",
    search_term: searchTerm,
    ...(typeof resultCount === "number" ? { search_results: resultCount } : {}),
  });
}

export function trackViewCollection(collectionHandle: string, collectionName: string) {
  pushToDataLayer({
    event: "view_collection",
    collection_handle: collectionHandle,
    collection_name: collectionName,
  });
}

/**
 * Virtual page view for client-side route changes. GTM's built-in Page View
 * trigger only fires on a real document load, which never happens again after
 * the first render in an App Router SPA.
 */
export function trackPageView(url: string, title: string) {
  pushToDataLayer({
    event: "page_view",
    page_path: url,
    page_title: title,
    page_location: typeof window !== "undefined" ? window.location.href : url,
  });
}

/**
 * Scroll milestone, re-armed per route by `GtmRouteTracker`.
 *
 * Pushes up to two events so both trigger styles work:
 *
 * - `gtm.scrollDepth` with the `gtm.scroll*` keys GTM's **built-in** Scroll
 *   Depth trigger reads. The built-in listener only arms itself on a real
 *   document load, so it goes silent after the first client-side navigation;
 *   replaying the event keeps existing built-in triggers firing per route.
 *   Gated on `replayBuiltIn` to avoid double-counting the initial route.
 * - `scroll_depth`, a plain custom event for new triggers. Always pushed.
 */
export function trackScrollDepth(
  percent: number,
  path: string,
  replayBuiltIn: boolean = false
) {
  // Only replay once GTM's own listener has gone silent — on the initially
  // loaded route it is still active and would report each milestone twice.
  if (replayBuiltIn) {
    pushToDataLayer({
      event: "gtm.scrollDepth",
      "gtm.scrollThreshold": percent,
      "gtm.scrollUnits": "percent",
      "gtm.scrollDirection": "vertical",
      "gtm.triggers": "",
    });
  }

  pushToDataLayer({
    event: "scroll_depth",
    scroll_percent: percent,
    page_path: path,
  });
}
