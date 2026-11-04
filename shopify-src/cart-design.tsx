import React, { useEffect, useRef, useState } from 'react';
import { Image, Link, formatPriceWithCurrency } from './adapters/runtime';
import { EmptyCart } from './catalog';
import InstallationServiceInfo from '@/components/product/customization/InstallationServiceInfo';
import { getInstallationServicePrice, getInstallationServiceTier } from '@/lib/pricing';
import { isPromoCode } from '@/data/promotions';
import { readPromoCode } from '@/hooks/usePromoCode';

// The live site adds installation once per order, priced by the number of blinds.
export const INSTALLATION_HANDLE = 'installation-service';
const root = () => window.Shopify?.routes?.root || '/';
const post = (url: string, body: unknown) => fetch(root() + url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
  .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data?.description || data?.message || 'The cart could not be updated.'); return data; });
const readCart = () => fetch(root() + 'cart.js').then(r => r.json());
const takeFlag = (key: string) => { try { const value = sessionStorage.getItem(key); sessionStorage.removeItem(key); return value; } catch { return null; } };
const isInstallation = (item: any) => item.handle === INSTALLATION_HANDLE;
// Set for this visit once the customer removes the announcement bar code.
const PROMO_DISMISSED_KEY = 'ob-promo-dismissed';
const appliedCodes = (cart: any): string[] => (cart.discount_codes || []).filter((d: any) => d.applicable).map((d: any) => d.code);
const sameCode = (a: string, b: string) => a.toUpperCase() === b.toUpperCase();
// Only one announcement bar code at a time; other codes (newsletter) are kept beside it.
const codesWith = (cart: any, code: string) => [...appliedCodes(cart).filter(c => !sameCode(c, code) && !(isPromoCode(c) && isPromoCode(code))), code];
// Adds a code; if Shopify does not accept it, puts the previous codes back. Returns [cart, accepted].
async function addCode(cart: any, code: string): Promise<[any, boolean]> {
  const before = appliedCodes(cart);
  const next = await post('cart/update.js', { discount: codesWith(cart, code).join(',') });
  if (appliedCodes(next).some(c => sameCode(c, code))) return [next, true];
  return [await post('cart/update.js', { discount: before.join(',') }), false];
}
const blindCount = (cart: any) => cart.items.filter((i: any) => !isInstallation(i)).reduce((sum: number, i: any) => sum + i.quantity, 0);

// Keeps the installation line on the tier that matches the number of blinds
// (or removes it when no blinds are left). Returns the updated cart.
async function syncInstallation(cart: any, wanted: boolean) {
  const variants: any[] = window.OnlineBlinds?.installationVariants || [];
  const count = blindCount(cart);
  const target = wanted && count > 0 ? variants.find(v => v.title === getInstallationServiceTier(count).variantTitle) : null;
  const updates: Record<string, number> = {};
  for (const line of cart.items.filter(isInstallation)) if (!target || String(line.variant_id) !== String(target.id) || line.quantity !== 1) updates[line.variant_id] = 0;
  if (target && (updates[target.id] === 0 || !cart.items.some((i: any) => isInstallation(i) && String(i.variant_id) === String(target.id)))) updates[target.id] = 1;
  return Object.keys(updates).length ? post('cart/update.js', { updates }) : cart;
}

// Cart presentation and editing, mirroring the live cart page. Checkout opens
// only when every blind line was priced by LPO (it carries _cl_options).
export function CartDesign({ cart: initialCart }: any) {
  const [cart, setCart] = useState<any>(initialCart);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const started = useRef(false);
  const currency = cart.currency || 'GBP';
  const money = (cents: number) => formatPriceWithCurrency(cents / 100, currency);

  const show = (next: any) => { setCart(next); document.dispatchEvent(new CustomEvent('cart:updated')); return next; };
  const run = async (action: () => Promise<any>) => {
    if (busy) return; setBusy(true); setError(null);
    try { show(await action()); } catch (e: any) { setError(e?.message || 'The cart could not be updated.'); show(await readCart().catch(() => cart)); }
    finally { setBusy(false); }
  };
  const hasInstallation = (c: any) => c.items.some(isInstallation);

  useEffect(() => {
    if (started.current) return; started.current = true;
    void run(async () => {
      let next = await readCart();
      // Editing a line onto another colour adds a new line; drop the one it replaced.
      const replaced = takeFlag('ob-edit-replace');
      const old = replaced && next.items.find((i: any) => i.key === replaced);
      if (old && next.items.some((i: any) => i.key !== old.key && i.product_id === old.product_id && Number(i.properties?._cl_options_id) > Number(old.properties?._cl_options_id || 0))) next = await post('cart/change.js', { id: old.key, quantity: 0 });
      next = await syncInstallation(next, takeFlag('ob-installation') === '1' || hasInstallation(next));
      // Apply the code picked in the announcement bar unless one is already
      // applied or the customer removed it this visit.
      let dismissed = false; try { dismissed = Boolean(sessionStorage.getItem(PROMO_DISMISSED_KEY)); } catch {}
      if (!dismissed && next.items.some((i: any) => !isInstallation(i)) && !appliedCodes(next).some(isPromoCode)) next = (await addCode(next, readPromoCode()))[0];
      // Fallback Buy Now (added through the cart): continue straight to checkout.
      if (takeFlag('ob-buy-now') && checkoutAllowed(next)) window.location.href = root() + 'checkout';
      return next;
    });
  }, []);

  const blinds = cart.items.filter((i: any) => !isInstallation(i));
  const installationLine = cart.items.find(isInstallation);
  const count = blindCount(cart);
  if (!blinds.length && !installationLine) return <EmptyCart />;
  const canCheckout = checkoutAllowed(cart);
  const subtotal = blinds.reduce((sum: number, i: any) => sum + i.original_line_price, 0);
  const codes = appliedCodes(cart);
  const titleOf = (code: string) => (cart.cart_level_discount_applications || []).find((d: any) => d.title && sameCode(d.title, code))?.title || code;

  const changeQuantity = (item: any, quantity: number) => run(async () => syncInstallation(await post('cart/change.js', { id: item.key, quantity: Math.max(0, quantity) }), hasInstallation(cart)));
  const setInstallation = (wanted: boolean) => run(async () => syncInstallation(await readCart(), wanted));
  const clearCart = () => run(() => post('cart/clear.js', {}));
  const applyCoupon = async () => {
    const code = coupon.trim(); if (!code || busy) return;
    setCouponError(null);
    await run(async () => {
      const [next, accepted] = await addCode(cart, code);
      if (accepted) setCoupon(''); else setCouponError('Invalid discount code');
      return next;
    });
  };
  const removeCoupon = (code: string) => {
    setCouponError(null);
    if (isPromoCode(code)) { try { sessionStorage.setItem(PROMO_DISMISSED_KEY, '1'); } catch {} }
    void run(() => post('cart/update.js', { discount: codes.filter(c => !sameCode(c, code)).join(',') }));
  };
  const editUrl = (item: any) => `${item.url}${item.url.includes('?') ? '&' : '?'}item=${encodeURIComponent(item.key)}`;

  return <div className="bg-background-alt">
    <section className="border-b border-border bg-white px-4 py-5 md:px-6 md:py-6 lg:px-8"><div className="mx-auto max-w-7xl">
      <nav className="mb-2 flex items-center gap-2 text-[13px] text-muted"><Link href="/">Home</Link><span>/</span><span className="font-medium text-foreground">Shopping Cart</span></nav>
      <h1 className="font-display text-[34px] leading-none text-foreground md:text-[42px]">Your Cart <span className="font-jost text-[17px] font-medium text-muted">({count} {count === 1 ? 'item' : 'items'})</span></h1>
    </div></section>
    <div className="px-4 py-8 md:px-6 md:py-10 lg:px-8"><div className="mx-auto max-w-7xl"><div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <section className="min-w-0 lg:col-span-8 xl:col-span-9"><div className="rounded-2xl border border-border bg-white p-4 md:p-6">
        <div className="mb-6 flex items-center justify-between"><h2 className="font-jost text-[15px] font-semibold uppercase tracking-[0.08em] text-foreground">Selected Products</h2><button disabled={busy} onClick={() => setShowClearConfirm(true)} className="rounded-md border border-red-200 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50">Clear Cart</button></div>
        <div className="space-y-4" aria-busy={busy}>{blinds.map((item: any) => <article key={item.key} data-live-item-key={item.key} className="rounded-xl border border-border bg-surface-muted p-4 md:p-5">
          <div className="flex gap-4 md:gap-6"><div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-white md:h-28 md:w-28">{item.image && <Image src={item.image} alt={item.product_title} fill className="object-cover" />}</div>
            <div className="min-w-0 flex-1"><div className="mb-3 flex flex-wrap justify-between gap-3">
              <Link href={item.url} className="min-w-0 line-clamp-2 text-[16px] font-semibold text-foreground hover:text-primary md:text-[18px]">{item.product_title}</Link>
              <div className="flex shrink-0 items-start gap-2">
                {item.properties?._cl_options && <a href={editUrl(item)} className="rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-foreground transition-colors hover:border-primary/40 hover:text-primary">Edit</a>}
                <button disabled={busy} onClick={() => changeQuantity(item, 0)} aria-label="Remove item" className="text-muted transition-colors hover:text-red-600 disabled:opacity-50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div></div>
            <div className="mb-4 space-y-1 break-words">{item.variant_title && item.variant_title !== 'Default Title' && <p className="text-[12px] text-muted md:text-[13px]">{item.variant_title}</p>}{Object.entries(item.properties || {}).filter(([key,value]) => !key.startsWith('_') && value != null && value !== '').map(([key,value]) => <p key={key} className="text-[12px] text-muted md:text-[13px]">{key}: {String(value)}</p>)}</div>
            <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap items-center gap-3"><span className="text-[13px] text-muted">Quantity</span><div className="flex items-center overflow-hidden rounded-lg border border-border bg-white">
              <button disabled={busy} onClick={() => changeQuantity(item, item.quantity - 1)} aria-label="Decrease quantity" className="px-3 py-1.5 text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg></button>
              <span className="min-w-10 px-4 py-1.5 text-center text-sm font-medium">{item.quantity}</span>
              <button disabled={busy} onClick={() => changeQuantity(item, item.quantity + 1)} aria-label="Increase quantity" className="px-3 py-1.5 text-foreground transition-colors hover:bg-surface-muted disabled:opacity-50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
            </div></div><div className="text-[20px] font-bold text-foreground md:text-[22px]">{money(item.original_line_price)}</div></div>
          </div></div></article>)}</div>
        <div className="mt-6 border-t border-border pt-6"><Link href="/collections" className="inline-flex items-center gap-2 font-medium text-primary"><span aria-hidden>←</span>Continue Shopping</Link></div>
      </div></section>
      <aside className="min-w-0 lg:col-span-4 xl:col-span-3"><div className="rounded-2xl border border-border bg-white p-5 shadow-sm lg:sticky lg:top-24 md:p-6">
        <h2 className="mb-4 font-display text-[30px] leading-none text-foreground">Order Summary</h2>
        <div className="mb-4 space-y-3"><div className="flex justify-between text-sm"><span className="text-muted">Subtotal</span><span className="font-medium text-foreground">{money(subtotal)}</span></div>
        {cart.total_discount > 0 && <div className="flex justify-between gap-2 text-sm"><span className="text-muted">Discount{codes.length ? ` (${codes.join(' + ')})` : ''}</span><span className="font-medium text-green-700">-{money(cart.total_discount)}</span></div>}
        <label className="flex cursor-pointer items-start justify-between gap-3 text-sm"><span className="flex items-start gap-2"><input type="checkbox" disabled={busy || !count} checked={Boolean(installationLine)} onChange={e => setInstallation(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary" /><span className="flex items-center gap-1.5 text-muted">Add professional installation<InstallationServiceInfo /></span></span><span className="whitespace-nowrap font-medium text-foreground">{formatPriceWithCurrency(getInstallationServicePrice(count), currency)}</span></label>
        <div className="flex justify-between gap-2 text-sm"><span className="text-muted">Shipping</span><span className="text-right text-sm italic text-muted">Calculated at checkout</span></div></div>
        <div className="mb-4 border-t border-border pt-4">{codes.map(code => <div key={code} className="mb-2 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2"><div className="min-w-0"><p className="truncate text-xs font-semibold text-green-800">{titleOf(code)}</p><p className="text-[11px] text-green-700">Code &quot;{code}&quot; applied</p></div><button disabled={busy} onClick={() => removeCoupon(code)} className="shrink-0 text-xs font-semibold text-green-800 underline hover:text-green-900">Remove</button></div>)}
          <div><div className="flex gap-2"><input type="text" aria-label="Discount code" value={coupon} onChange={e => setCoupon(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void applyCoupon(); } }} placeholder="Discount code" className="h-10 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm focus:border-primary focus:outline-none" /><button onClick={() => void applyCoupon()} disabled={busy || !coupon.trim()} className="h-10 shrink-0 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50">{busy && coupon.trim() ? 'Applying…' : 'Apply'}</button></div>{couponError && <p className="mt-1.5 text-xs text-red-600">{couponError}</p>}</div></div>
        <div className="mb-6 border-t border-border pt-4"><div className="flex items-baseline justify-between gap-2"><span className="text-lg font-bold">Total</span><span className="text-2xl font-bold text-primary">{money(cart.total_price)}</span></div></div>
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3"><p className="text-xs text-red-800">{error}</p></div>}
        <button disabled={!canCheckout || busy} onClick={() => { window.location.href = root() + 'checkout'; }} className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.04em] text-white disabled:cursor-not-allowed disabled:opacity-50">Proceed to Checkout</button>
      </div></aside>
    </div></div></div>
    {showClearConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-lg">
      <h3 className="mb-3 text-xl font-bold text-foreground">Clear Cart?</h3>
      <p className="mb-6 text-muted">Are you sure you want to remove all items from your cart? This action cannot be undone.</p>
      <div className="flex gap-3"><button onClick={() => setShowClearConfirm(false)} className="flex-1 rounded-lg border border-border px-4 py-2.5 font-medium text-foreground transition-colors hover:bg-surface-muted">Cancel</button><button onClick={() => { setShowClearConfirm(false); void clearCart(); }} className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-red-700">Clear Cart</button></div>
    </div></div>}
  </div>;
}

// Every blind line must carry LPO's price; installation is a plain Shopify variant.
function checkoutAllowed(cart: any) {
  const blinds = cart.items.filter((i: any) => !isInstallation(i));
  return Boolean(window.OnlineBlinds?.lpoCheckoutEnabled) && blinds.length > 0 && blinds.every((i: any) => i.properties?._cl_options);
}
