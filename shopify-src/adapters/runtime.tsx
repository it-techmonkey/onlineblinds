import React, { createContext, useContext, useEffect, useState } from 'react';

declare global {
  interface Window { OnlineBlinds: any; Shopify: any; }
}
const pageRoutes: Record<string, string> = {
  '/about': '/pages/about-us', '/contact': '/pages/contact',
  '/guides': '/pages/instructions-for-measuring-fitting-guides',
  '/shipping-policy': '/pages/shipping-delivery-information',
  '/refund-policy': '/pages/refunds-return-policy', '/privacy-policy': '/pages/privacy-policy',
  '/terms-and-conditions': '/pages/terms-and-conditions',
  '/warranty': '/pages/surefit-guarantee?view=warranty',
  '/faq': '/pages/about-us?view=faq', '/login': '/account',
};
export function assetUrl(src: string) {
  if (typeof src !== 'string' || !src.startsWith('/')) return src;
  const assets = typeof window === 'undefined' ? (globalThis as any).__obAssets : window.OnlineBlinds?.assets;
  return assets?.[src] || src;
}
export function route(href: string) {
  if (!href || typeof href !== 'string') return href;
  const routes = typeof window === 'undefined' ? (globalThis as any).__obRoutes : window.OnlineBlinds?.routes;
  const [base, query] = href.split('?');
  let result = pageRoutes[base] || routes?.[base] || base.replace(/^\/product\//, '/products/');
  if (query) {
    // A link that was already routed (e.g. rewritten twice) keeps one copy of each pair.
    const [path, existing = ''] = result.split('?');
    const merged = new URLSearchParams(existing);
    new URLSearchParams(query).forEach((value, key) => { if (!merged.getAll(key).includes(value)) merged.append(key, value); });
    result = `${path}?${merged}`;
  }
  if (base === '/search' && !/(?:\?|&)type=/.test(result)) result += `${result.includes('?') ? '&' : '?'}type=product`;
  return assetUrl(result);
}
export function Image({ src, fill, priority, quality, loader, unoptimized, placeholder, blurDataURL, style, ...props }: any) {
  return <img {...props} src={assetUrl(typeof src === 'string' ? src : src.src)} loading={priority ? 'eager' : 'lazy'}
    style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style} />;
}
export function Link({ href, prefetch, replace, scroll, ...props }: any) {
  return <a {...props} href={route(typeof href === 'string' ? href : href.pathname)} />;
}
export function useRouter() {
  const prepare = (input: string) => {
    const url = new URL(route(input), location.origin);
    if (url.pathname.startsWith('/collections/')) url.searchParams.delete('sort_by');

    return url.href;
  };
  return { push: (url: string) => location.assign(prepare(url)), replace: (url: string) => location.replace(prepare(url)), back: () => history.back() };
}
export function usePathname() { return typeof location === 'undefined' ? '/' : location.pathname; }
export function useSearchParams() { return new URLSearchParams(typeof location === 'undefined' ? '' : location.search); }
export function formatPrice(value: number) { return Math.round(Number(value) * 100) / 100; }
export function formatPriceWithCurrency(value: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(formatPrice(value));
}
export function getCurrencySymbol(currency: string) { return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).formatToParts(0).find(p => p.type === 'currency')?.value || currency; }

const emptyCart = { items: [], itemCount: 0, total: 0, subtotal: 0, currency: 'GBP', installationServicePrice: 0, installationService: false };
const Cart = createContext<any>({ cart: emptyCart });
export function useCart() { return useContext(Cart); }
export function CartProvider({ children }: any) {
  const [cart, setCart] = useState<any>(emptyCart);
  useEffect(() => {
    const update = () => fetch(`${window.Shopify?.routes?.root || '/'}cart.js`).then(r => r.json()).then(c => setCart({
      itemCount: c.items.filter((i: any) => i.handle !== 'installation-service').reduce((n: number, i: any) => n + i.quantity, 0), total: c.total_price / 100, subtotal: c.items_subtotal_price / 100, currency: c.currency, installationServicePrice: 0, installationService: false,
      items: c.items.map((i: any) => ({ id: i.key, quantity: i.quantity, price: i.final_price / 100, totalPrice: i.final_line_price / 100,
        product: { slug: i.handle, name: i.product_title, price: i.final_price / 100, currency: c.currency, images: [i.image] },
      })),
    })).catch(() => {});
    update(); document.addEventListener('cart:updated', update);
    return () => document.removeEventListener('cart:updated', update);
  }, []);
  return <Cart.Provider value={{ cart }}>{children}</Cart.Provider>;
}

// Live search runs Storefront products(query:) sorted newest first (every word
// must match). The online store domain allows the same query without a token.
export async function storefrontSearch(query: string, limit: number, init?: RequestInit) {
  const handles: string[] = [];
  let after: string | null = null;
  do {
    const r: Response = await fetch(`${window.Shopify?.routes?.root || '/'}api/2026-10/graphql.json`, { ...init, method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'query($q:String,$a:String,$n:Int!){products(first:$n,after:$a,query:$q,sortKey:CREATED_AT,reverse:true){pageInfo{hasNextPage endCursor} nodes{handle}}}', variables: { q: query, a: after, n: Math.min(250, limit - handles.length) } }) });
    if (!r.ok) throw new Error('Search unavailable');
    const data: any = (await r.json())?.data?.products;
    if (!data) throw new Error('Search unavailable');
    handles.push(...data.nodes.map((n: any) => n.handle));
    after = data.pageInfo.hasNextPage && handles.length < limit ? data.pageInfo.endCursor : null;
  } while (after);
  return handles;
}

export async function storefrontFetch(input: string, init?: RequestInit) {
  if (!input.startsWith('/api/search/live?')) throw new Error('Unsupported legacy endpoint in Shopify theme.');
  const q = new URL(input, location.origin).searchParams.get('q') || '';
  // Live header search shows the first 5 matches; card data comes from the catalogue snapshot.
  const [handles, catalog] = await Promise.all([storefrontSearch(q, 5, init), import('../catalog-data').then(m => m.catalogData())]);
  return new Response(JSON.stringify({ success: true, data: handles.map(h => catalog.products[h]).filter(Boolean).map((p: any) => ({
    id: String(p.id), name: p.name, slug: p.slug,
    price: window.OnlineBlinds?.minimumPrices?.[p.slug] ?? p.price,
    currency: p.currency || 'GBP', image: p.images?.[0] || null,
  })) }), { headers: { 'Content-Type': 'application/json' } });
}
