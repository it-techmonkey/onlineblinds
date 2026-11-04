import { useEffect, useState } from 'react';
import type { ProductConfiguration } from '@/types';
import configurations from './lpo-configurations.json';
// Virtual module: the live site's buildLineItemProperties (see build.mjs).
// @ts-ignore
import { buildLineItemProperties } from 'ob-order-properties';

export const PILOT_HANDLE = 'plain-soft-white-day-and-night-blind';
export const PILOT_CONFIG = 'clfhanm6jjqw';
// schema 2 = generic configs (Roller onwards) that receive the page's customization list.
const configurationFor = (handle: string) => (configurations as Record<string, {configId: string; forceMotorized?: boolean; variantIds: string[]; schema?: number}>)[handle];
type Customization = { category: string; optionId: string };
export type Values = Record<string, string | number>;
export interface LpoInstance {
  getValues(): Values;
  updateValues(values: Values): Promise<unknown>;
  getSelectedVariant?(): { id: string | number } | null;
}
declare global { interface Window { OnlineBlindsLpoPilot?: { configId: string; instance: LpoInstance }; } }
type Quote = { ready: boolean; price: number | null; error: string | null };
type Selection = { values: Values; expected: number; valid: boolean };

// Keep the exact React controls, images and responsive layout from the source.
// Only the pilot's explicit fields cross into LPO; no arbitrary properties.
// LPO option names are hidden (underscore) so they stay out of order details;
// readable properties are added separately (see lpoAddToCart).
export function pilotValues(config: ProductConfiguration, forceMotorized = false, schema = 1, customizations: Customization[] = []): Values {
  const size: Values = {
    width: config.width || '', height: config.height || '',
    widthFraction: Number(config.widthFraction || 0), heightFraction: Number(config.heightFraction || 0),
    measurementUnit: config.widthUnit,
  };
  // Generic configs price the same customization list the server prices.
  const values: Values = schema === 2 ? {
    ...size,
    customizations: customizations.map(c => `${c.category}:${c.optionId}`).join('|'),
  } : {
    width: config.width || '', height: config.height || '',
    widthFraction: Number(config.widthFraction || 0), heightFraction: Number(config.heightFraction || 0),
    measurementUnit: config.widthUnit,
    installationMethod: config.installationMethod || '', controlSide: config.controlSide || '',
    chromeUpgrade: config.chromeUpgrade || 'no', cassetteMatchingBar: config.cassetteMatchingBar || '',
    sameFabricInsert: config.sameFabricInsert || 'no', motorization: forceMotorized ? 'motorized' : config.motorization || 'none',
    roomType: config.roomType || '', blindName: config.blindName || '',
  };
  return Object.fromEntries(Object.entries(values).map(([key, value]) => ['_' + key, value]));
}

export class PilotBridge {
  private instance: LpoInstance | null = null;
  private pending: Selection | null = null;
  private latest: Selection | null = null;
  private running = false;
  private revision = 0;
  private cents: number | null = null;
  private listeners = new Set<(quote: Quote) => void>();
  quote: Quote = { ready: false, price: null, error: null };
  subscribe(listener: (quote: Quote) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private publish(quote: Quote) {
    this.quote = quote;
    // Read-only snapshot for diagnostics and automated storefront checks.
    (window as any).OnlineBlindsLpoState = { quote, expected: this.latest?.expected ?? null, valid: this.latest?.valid ?? null, attached: !!this.instance };
    this.listeners.forEach(listener => listener(quote));
  }
  attach(instance: LpoInstance) {
    if (this.instance === instance) return;
    this.instance = instance; this.revision++; this.cents = null;
    this.pending = this.latest;
    this.publish({ ready: false, price: null, error: null }); void this.flush();
  }
  detach() { this.instance = null; this.pending = null; this.latest = null; this.revision++; this.cents = null; this.publish({ ready: false, price: null, error: null }); }
  price(cents: number) { this.cents = Number.isFinite(cents) ? cents : null; }
  select(values: Values, expected: number, valid: boolean) {
    this.latest = { values, expected, valid }; this.pending = this.latest; this.revision++;
    this.publish({ ready: false, price: null, error: null }); void this.flush();
  }
  private async flush() {
    if (this.running || !this.pending || !this.instance) return;
    this.running = true;
    try {
      while (this.pending && this.instance) {
        const selection = this.pending;
        const instance: LpoInstance = this.instance;
        const revision = this.revision;
        this.pending = null; this.cents = null;
        try {
          // LPO recalculates the formula and emits options:price synchronously
          // during updateValues. Await preview completion before accepting it.
          await instance.updateValues(selection.values);
          if (revision !== this.revision || instance !== this.instance) continue;
          const price = this.cents === null ? null : this.cents / 100;
          const matches = price !== null && Math.abs(price - selection.expected) < 0.011;
          this.publish({ ready: selection.valid && matches, price: selection.valid && matches ? price : null,
            error: selection.valid && !matches ? 'The configured price could not be verified. Please try again.' : null });
        } catch {
          if (revision === this.revision) this.publish({ ready: false, price: null, error: 'Product options could not be loaded. Please try again.' });
        }
      }
    } finally { this.running = false; }
  }
}

export const pilotBridge = new PilotBridge();

// True when this page's LPO configuration is live and checkout is allowed, so
// the buttons can be clicked to reveal missing fields as on the original site.
export function lpoAttached() {
  return Boolean(window.OnlineBlinds?.lpoCheckoutEnabled && (window as any).OnlineBlindsLpoState?.attached);
}

// True while an LPO-verified price may be added through LPO's own cart flow.
export function lpoPurchaseAllowed() {
  return Boolean(window.OnlineBlinds?.lpoCheckoutEnabled && pilotBridge.quote.ready);
}

// Cart line being edited (LPO's own ?item=<cart key> edit link), if any.
export const editingCartKey = () => typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('item');
const storage = (key: string, value: string | null) => { try { if (value === null) sessionStorage.removeItem(key); else sessionStorage.setItem(key, value); } catch {} };

// Restores the page's own selections when a cart line is reopened for editing.
// The page state is saved on the line (_ob_config) when it is added.
export function useLpoEditRestore(handle: string, restore: (saved: any) => void) {
  useEffect(() => {
    const key = editingCartKey();
    if (!key || !configurationFor(handle)) return;
    let active = true;
    fetch(`${window.Shopify?.routes?.root || '/'}cart.js`).then(r => r.json()).then(cart => {
      const line = cart.items.find((i: any) => i.key === key);
      const saved = line?.properties?._ob_config;
      if (active && saved) restore(JSON.parse(saved));
    }).catch(() => {});
    return () => { active = false; };
  }, [handle]);
}

// Fills LPO's form with the chosen colour and the live site's readable order
// properties (plus the page state used to reopen the line for editing).
function prepareLpoForm(item: any, tags: string[], variantId?: string | null, snapshot?: unknown) {
  const form = document.getElementById('ob-lpo-pilot-form') as HTMLFormElement | null;
  const button = form?.querySelector<HTMLButtonElement>('[data-ob-lpo-add]');
  if (!form || !button) return null;
  // Book the colour the customer chose (products with colour variants).
  const idInput = form.querySelector<HTMLInputElement>('input[name="id"]');
  if (variantId && idInput && idInput.value !== String(variantId)) {
    idInput.value = String(variantId);
    idInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  form.querySelectorAll('[data-ob-order-property]').forEach(el => el.remove());
  const properties = buildLineItemProperties(item, pilotBridge.quote.price!, tags);
  if (snapshot !== undefined) properties.push({ key: '_ob_config', value: JSON.stringify(snapshot) });
  for (const {key, value} of properties) {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = `properties[${key}]`; input.value = value;
    input.setAttribute('data-ob-order-property', '');
    form.appendChild(input);
  }
  return { form, button, variant: idInput?.value || '' };
}

// Live site: Buy Now checks out this one item (plus installation if ticked)
// and leaves the cart untouched. Here LPO prices the line without adding it,
// and a separate Shopify cart is opened at checkout.
async function lpoBuyNowCheckout(variant: string, installation: boolean): Promise<boolean> {
  const instance: any = window.OnlineBlindsLpoPilot?.instance;
  if (typeof instance?._handleFormSubmit !== 'function') return false;
  const properties = await instance._handleFormSubmit(new CustomEvent('cloudlift.cart', { detail: { capture: true }, cancelable: true }));
  if (!properties?._cl_options || !properties._cl_options_price) return false;
  const lines: any[] = [{ merchandiseId: `gid://shopify/ProductVariant/${variant}`, quantity: 1,
    attributes: Object.entries(properties).map(([key, value]) => ({ key, value: String(value) })) }];
  const tier = installation ? (window.OnlineBlinds?.installationVariants || []).find((v: any) => v.title === '1 Blind') : null;
  if (installation && !tier) return false;
  if (tier) lines.push({ merchandiseId: `gid://shopify/ProductVariant/${tier.id}`, quantity: 1 });
  const response = await fetch(`${window.Shopify?.routes?.root || '/'}api/2026-10/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'mutation($input:CartInput){cartCreate(input:$input){cart{checkoutUrl} userErrors{message}}}', variables: { input: { lines } } }),
  });
  const result = await response.json();
  const url = result?.data?.cartCreate?.cart?.checkoutUrl;
  if (!url || result.data.cartCreate.userErrors?.length) return false;
  window.location.href = url;
  return true;
}

// Adds the configured item via LPO (which attaches its options and bundle
// pricing) with the same readable properties the live site writes on orders.
// LPO then opens the cart (or, when editing, updates that cart line in place).
export function lpoAddToCart(buyNow: boolean, item: any, tags: string[], variantId?: string | null, snapshot?: unknown, installation = false): boolean {
  if (!lpoPurchaseAllowed()) return false;
  const prepared = prepareLpoForm(item, tags, variantId, snapshot);
  if (!prepared) return false;
  storage('ob-buy-now', null);
  if (buyNow) {
    void lpoBuyNowCheckout(prepared.variant, installation).then(done => {
      if (done) return;
      // Fallback: the previous behaviour (add to cart, then continue to checkout).
      storage('ob-buy-now', '1'); if (installation) storage('ob-installation', '1');
      prepared.button.click();
    }).catch(() => { storage('ob-buy-now', '1'); if (installation) storage('ob-installation', '1'); prepared.button.click(); });
    return true;
  }
  if (installation) storage('ob-installation', '1');
  // A colour change while editing adds a new line; the cart then drops the old one.
  const editing = editingCartKey();
  storage('ob-edit-replace', editing && !editing.startsWith(prepared.variant + ':') ? editing : null);
  prepared.button.click();
  return true;
}
export function installLpoBridge() {
  const host = document.querySelector<HTMLElement>('[data-ob-lpo-engine]');
  if (!host || host.dataset.obBridgeInstalled) return;
  const configId = host.dataset.obLpoEngine;
  const configuration = Object.values(configurations).find(c => c.configId === configId);
  if (!configuration) return;
  host.dataset.obBridgeInstalled = 'true';
  const rendered = (event: Event) => {
    if (!host.querySelector(`[id="${configId}"]`)) return;
    const instance = (event as CustomEvent).detail;
    if (!configuration.variantIds.includes(String(instance?.getSelectedVariant?.()?.id))) return;
    if (typeof instance?.getValues === 'function' && typeof instance?.updateValues === 'function') pilotBridge.attach(instance);
  };
  const price = (event: Event) => {
    if (host.querySelector(`[id="${configId}"]`)) pilotBridge.price((event as CustomEvent).detail?.price);
  };
  window.addEventListener('options:rendered', rendered);
  window.addEventListener('options:price', price);
  const ready = () => {
    const pilot = window.OnlineBlindsLpoPilot;
    if (pilot && pilot.configId === configId && host.querySelector(`[id="${configId}"]`)) pilotBridge.attach(pilot.instance);
  };
  window.addEventListener('ob:lpo-ready', ready); ready();
  const unload = (event: Event) => {
    if ((event.target as Element).contains(host)) {
      window.removeEventListener('options:rendered', rendered); window.removeEventListener('options:price', price); window.removeEventListener('ob:lpo-ready', ready); pilotBridge.detach();
      document.removeEventListener('shopify:section:unload', unload);
    }
  };
  document.addEventListener('shopify:section:unload', unload);
}

export function useLpoQuote(handle: string, config: ProductConfiguration, expected: number, valid: boolean, customizations: Customization[] = []): Quote {
  const [quote, setQuote] = useState<Quote>(pilotBridge.quote);
  const configuration = configurationFor(handle);
  const serialized = JSON.stringify(pilotValues(config, configuration?.forceMotorized, configuration?.schema, customizations));
  useEffect(() => configuration ? pilotBridge.subscribe(setQuote) : undefined, [handle]);
  useEffect(() => {
    if (configuration) pilotBridge.select(JSON.parse(serialized), expected, valid);
  }, [handle, serialized, expected, valid]);
  return configuration && valid && quote.price !== null && Math.abs(quote.price - expected) < 0.011
    ? quote : { ready: false, price: null, error: quote.error };
}
