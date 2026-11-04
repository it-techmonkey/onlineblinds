import React from 'react';
import { createRoot, hydrateRoot, Root } from 'react-dom/client';
import { islands } from './islands';
import { assetUrl, route } from './adapters/runtime';
import { installLpoBridge, lpoPurchaseAllowed } from './lpo-bridge';

const roots = new Map<Element, Root>();
// Keep the unpublished, incomplete preview from placing orders even if an app
// re-enables a submit button as it renders its option fields. The one
// exception is the hidden LPO form, and only while LPO has verified the price.
const lpoFormAllowed = (el: Element | null) => !!el?.closest('#ob-lpo-pilot-form') && lpoPurchaseAllowed();
document.addEventListener('submit', event => {
  const form = event.target as HTMLFormElement;
  if (!window.OnlineBlinds?.purchasingEnabled && !lpoFormAllowed(form) && (form.matches('[data-ob-product-form]') || (form.id === 'cart' && (event as SubmitEvent).submitter?.getAttribute('name') === 'checkout'))) {
    event.preventDefault(); event.stopImmediatePropagation();
  }
}, true);
document.addEventListener('click', event => {
  const button = (event.target as Element)?.closest<HTMLButtonElement>('[data-ob-product-form] button[name="add"], #cart button[name="checkout"]');
  if (button && !window.OnlineBlinds?.purchasingEnabled && !lpoFormAllowed(button)) { event.preventDefault(); event.stopImmediatePropagation(); }
}, true);
function mount(container: ParentNode = document) {
  container.querySelectorAll<HTMLElement>('[data-ob-island]').forEach(el => {
    if (roots.has(el)) return;
    const Component = islands[el.dataset.obIsland || ''];
    if (!Component || el.dataset.obIsland === 'newsletter') return;
    const source = el.querySelector<HTMLScriptElement>('script[data-ob-props]');
    const props = source ? JSON.parse(source.textContent || '{}') : {};
    source?.remove();
    if (el.dataset.obClient === 'true') {
      const root = createRoot(el); root.render(<Component {...props} />); roots.set(el, root);
    } else roots.set(el, hydrateRoot(el, <Component {...props} />));
  });
  container.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a => {
    const raw = a.getAttribute('href')!;
    if (raw.startsWith('/')) a.setAttribute('href', route(raw));
  });
  container.querySelectorAll<HTMLImageElement>('img[src]').forEach(i => {
    const raw = i.getAttribute('src')!;
    if (raw.startsWith('/')) i.setAttribute('src', assetUrl(raw));
  });
}
// Old live-site links (/product/<handle>, /about, /faq, category slugs and
// collections that are not on the Online Store channel) land on Shopify's
// not-found page. Send visitors to the matching Shopify page instead.
function redirectLegacyLink() {
  if (!document.querySelector('[data-ob-notfound]')) return false;
  const here = location.pathname.replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(location.search);
  const slug = here.match(/^\/collections\/([^/]+)$/)?.[1];
  // A mapped link that still 404s carries ob_collection; never map it again.
  let target = params.has('ob_collection') ? here + location.search : route(here + location.search);
  if (slug && target.split('?')[0] === here) {
    const wanted = params.get('ob_collection') || slug;
    if (window.OnlineBlinds?.collectionSlugs?.includes(wanted)) { params.set('ob_collection', wanted); target = `/collections/all?${params}`; }
  }
  if (target === here + location.search) return false;
  location.replace(target + location.hash);
  return true;
}
if (!redirectLegacyLink()) { installLpoBridge(); mount(); }
document.addEventListener('shopify:section:load', (event) => { installLpoBridge(); mount(event.target as Element); });
document.addEventListener('shopify:section:unload', (event) => {
  const parent = event.target as Element;
  roots.forEach((root, el) => { if (parent.contains(el)) { root.unmount(); roots.delete(el); } });
});

// Shopify owns cart/checkout and Live Product Options owns product submission.
// No Next.js pricing, order creation or authentication endpoints are called.
document.querySelectorAll<HTMLFormElement>('[data-ob-product-form]').forEach(form => {
  const variant = form.querySelector<HTMLSelectElement>('select[name="id"]');
  variant?.addEventListener('change', () => {
    const url = new URL(location.href); url.searchParams.set('variant', variant.value); history.replaceState({}, '', url);
    form.dispatchEvent(new CustomEvent('variant:change', { bubbles: true, detail: { variantId: variant.value } }));
  });
});
