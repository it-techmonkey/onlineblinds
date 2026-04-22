'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { navigationData, NavigationItem, NavigationLink } from '@/data/navigation';
import { formatPriceWithCurrency } from '@/lib/api';

const MobileMenuItem = ({ item, onClose }: { item: NavigationItem; onClose: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  if (!hasSubmenu) {
    return (
      <div className="border-b border-border last:border-0">
        {item.href ? (
          <Link
            href={item.href}
            className="flex items-center justify-between py-4 text-[13px] font-medium text-foreground transition-colors hover:text-primary"
            onClick={onClose}
          >
            {item.label}
          </Link>
        ) : (
          <div className="flex items-center py-4 text-[13px] font-medium text-foreground">
            {item.label}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-4 text-[13px] font-medium text-foreground transition-colors hover:text-primary"
      >
        {item.label}
        <Image
          src="/icons/CaretDown.svg"
          alt=""
          width={11}
          height={11}
          className={`opacity-40 transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-90 pb-3' : 'max-h-0'}`}>
        <ul className="pl-3 space-y-0.5">
          {item.submenu && item.submenu.map((link: NavigationLink, i: number) => (
            <li key={i}>
              {link.href ? (
                <Link href={link.href} className="block py-2 text-[13px] text-muted hover:text-primary transition-colors" onClick={onClose}>
                  {link.label}
                </Link>
              ) : (
                <span className="block py-2 text-[13px] text-muted">{link.label}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const Header = () => {
  const { cart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const miniCartRef = useRef<HTMLDivElement>(null);
  const cartCount = cart?.itemCount || 0;
  const previewItems = cart.items.slice(0, 3);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (miniCartRef.current && !miniCartRef.current.contains(event.target as Node)) {
        setMiniCartOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      setMiniCartOpen(false);
    }
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-white/94 shadow-[0_6px_24px_rgba(17,17,17,0.04)] backdrop-blur-xl supports-backdrop-filter:bg-white/88">
      <div className="relative mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:px-8">

        {/* Left: Mobile hamburger + Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden -ml-1.5 rounded-md p-1.5 hover:bg-neutral-100 transition-all duration-200 hover:shadow-sm"
            aria-label="Menu"
          >
            <span className={`block w-5 h-[1.5px] bg-foreground transition-all duration-250 ${mobileMenuOpen ? 'rotate-45 translate-y-[5.5px]' : ''}`} />
            <span className={`block w-5 h-[1.5px] bg-foreground my-1 transition-all duration-250 ${mobileMenuOpen ? 'opacity-0 scale-x-0' : ''}`} />
            <span className={`block w-5 h-[1.5px] bg-foreground transition-all duration-250 ${mobileMenuOpen ? '-rotate-45 -translate-y-[5.5px]' : ''}`} />
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <Image
              src="/icons/logo.webp"
              alt="Online Blinds"
              width={100}
              height={30}
            />
          </Link>
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
          {navigationData.map((item, i) => (
            <div key={i} className="group relative flex items-center h-16">
              {item.submenu ? (
                <>
                  <button className="relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-3.5 py-2 text-[13.5px] font-medium tracking-[0.01em] text-neutral-500 transition-all duration-200 hover:bg-neutral-50 hover:text-foreground">
                    {item.label}
                    <Image
                      src="/icons/CaretDown.svg"
                      alt=""
                      width={10}
                      height={10}
                      className="opacity-35 group-hover:rotate-180 transition-transform duration-250"
                    />
                  </button>
                  <div className="invisible absolute left-0 top-full z-50 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    <div className="min-w-72 rounded-2xl border border-border/90 bg-white p-2 shadow-[0_18px_44px_rgba(15,23,42,0.12)]">
                      <ul className="space-y-0.5">
                        {item.submenu.map((link, j) => {
                          let icon = '/nav-icons/vertical-blinds.webp';
                          if (item.label === 'Blinds') {
                            if (link.label.includes('Light filtering Vertical')) icon = '/nav-icons/vertical-blinds.webp';
                            else if (link.label.includes('Blackout vertical')) icon = '/nav-icons/blackout-blinds.svg';
                            else if (link.label.includes('All blinds')) icon = '/nav-icons/roller-blinds.webp';
                          } else if (item.label === 'Shades') {
                            if (link.label.includes('Light filtering roller')) icon = '/nav-icons/roller-blinds.webp';
                            else if (link.label.includes('Blackout roller')) icon = '/nav-icons/blackout-blinds.svg';
                            else if (link.label.includes('Waterproof')) icon = '/nav-icons/waterproof-blinds.svg';
                            else if (link.label.includes('Dual zebra')) icon = '/nav-icons/day-night-blinds.webp';
                            else if (link.label.includes('All blinds')) icon = '/nav-icons/roller-blinds.webp';
                          } else if (item.label === 'Motorization') {
                            if (link.label.includes('roller')) icon = '/nav-icons/roller-blinds.webp';
                            else if (link.label.includes('Dual')) icon = '/nav-icons/day-night-blinds.webp';
                            else if (link.label.includes('EclipseCore')) icon = '/nav-icons/blackout-blinds.svg';
                          } else if (item.label === 'Blackout') {
                            if (link.label.includes('Roller')) icon = '/nav-icons/blackout-blinds.svg';
                            else if (link.label.includes('Dual')) icon = '/nav-icons/day-night-blinds.webp';
                            else if (link.label.includes('Vertical')) icon = '/nav-icons/vertical-blinds.webp';
                            else if (link.label.includes('EclipseCore')) icon = '/nav-icons/blackout-blinds.svg';
                          } else if (item.label === 'Shop by') {
                            if (link.label.includes('Feature')) icon = '/nav-icons/thermal-blinds.svg';
                            else if (link.label.includes('room')) icon = '/nav-icons/rooms-livingroom.webp';
                          }
                          return (
                            <li key={j}>
                              {link.href ? (
                                <Link href={link.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-neutral-500 transition-all duration-200 hover:bg-primary-light hover:text-primary hover:shadow-[inset_0_0_0_1px_rgba(13,148,136,0.12)]">
                                  <Image src={icon} alt="" width={16} height={16} className="opacity-50 shrink-0" />
                                  {link.label}
                                </Link>
                              ) : (
                                <span className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-neutral-500">
                                  <Image src={icon} alt="" width={16} height={16} className="opacity-50 shrink-0" />
                                  {link.label}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </>
              ) : item.href ? (
                <Link href={item.href} className="whitespace-nowrap rounded-md px-3.5 py-2 text-[13.5px] font-medium tracking-[0.01em] text-neutral-500 transition-all duration-200 hover:bg-neutral-50 hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span className="whitespace-nowrap px-3.5 py-2 text-[13.5px] font-medium text-neutral-500">{item.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Right: Icons */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Link
            href="/search"
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-strong transition-all duration-200 hover:-translate-y-px hover:bg-primary-light hover:text-primary hover:shadow-sm"
          >
            <Image src="/icons/search.svg" alt="Search" width={18} height={18} className="opacity-60" />
          </Link>
          <Link
            href="/account"
            aria-label="Account"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-strong transition-all duration-200 hover:-translate-y-px hover:bg-primary-light hover:text-primary hover:shadow-sm"
          >
            <Image src="/icons/profile.svg" alt="Profile" width={18} height={18} className="opacity-60" />
          </Link>
          <div ref={miniCartRef} className="relative">
            <button
              type="button"
              onClick={() => setMiniCartOpen((prev) => !prev)}
              aria-label="Cart"
              aria-expanded={miniCartOpen}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-strong transition-all duration-200 hover:-translate-y-px hover:bg-primary-light hover:text-primary hover:shadow-sm"
            >
              <Image src="/icons/cart.svg" alt="Cart" width={18} height={18} className="opacity-60" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-white shadow-[0_4px_10px_rgba(13,148,136,0.42)]">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            <div
              className={`absolute right-0 top-full z-50 mt-2 w-92 max-w-[calc(100vw-1rem)] rounded-2xl border border-border bg-white shadow-[0_20px_44px_rgba(15,23,42,0.14)] transition-all duration-200 ${miniCartOpen ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-1 opacity-0'}`}
            >
              <div className="border-b border-border px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <p className="font-jost text-[13px] font-semibold uppercase tracking-[0.08em] text-foreground">
                    Cart ({cartCount})
                  </p>
                  <button
                    type="button"
                    onClick={() => setMiniCartOpen(false)}
                    className="rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                    aria-label="Close cart preview"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {previewItems.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[14px] text-muted">Your cart is empty.</p>
                  <Link
                    href="/collections"
                    onClick={() => setMiniCartOpen(false)}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-primary-dark"
                  >
                    Shop Now
                  </Link>
                </div>
              ) : (
                <>
                  <div className="max-h-88 overflow-y-auto px-3 py-3">
                    <ul className="space-y-2">
                      {previewItems.map((item) => (
                        <li key={item.id} className="rounded-xl border border-border bg-surface-muted px-2.5 py-2">
                          <div className="flex gap-3">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                              <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/product/${item.product.slug}`}
                                onClick={() => setMiniCartOpen(false)}
                                className="line-clamp-2 text-[13px] font-medium text-foreground hover:text-primary"
                              >
                                {item.product.name}
                              </Link>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="text-[12px] text-muted">Qty {item.quantity}</span>
                                <span className="text-[13px] font-semibold text-foreground">
                                  {formatPriceWithCurrency(item.product.price * item.quantity, item.product.currency)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border-t border-border px-4 py-3">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[13px] text-muted">Subtotal</span>
                      <span className="text-[16px] font-semibold text-foreground">{formatPriceWithCurrency(cart.total)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/cart"
                        onClick={() => setMiniCartOpen(false)}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-border text-[12px] font-semibold uppercase tracking-[0.05em] text-foreground transition-colors hover:bg-surface-muted"
                      >
                        View Cart
                      </Link>
                      <Link
                        href="/cart"
                        onClick={() => setMiniCartOpen(false)}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary text-[12px] font-semibold uppercase tracking-[0.05em] text-white transition-colors hover:bg-primary-dark"
                      >
                        Checkout
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 top-16 bg-black/25 z-40 animate-fade-in backdrop-blur-[2px]" onClick={() => setMobileMenuOpen(false)} />
          <div className="lg:hidden absolute top-full left-0 z-50 w-full animate-slide-up-fade border-t border-border/80 bg-white shadow-[0_18px_36px_rgba(17,17,17,0.12)]">
            <div className="px-5 py-2 max-h-[calc(100vh-64px)] overflow-y-auto">
              {navigationData.map((item, i) => (
                <MobileMenuItem key={i} item={item} onClose={() => setMobileMenuOpen(false)} />
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
