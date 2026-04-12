'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { navigationData, NavigationItem, NavigationLink } from '@/data/navigation';

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
        className="flex w-full items-center justify-between py-4 text-[13px] font-medium text-foreground"
      >
        {item.label}
        <Image
          src="/icons/CaretDown.svg"
          alt=""
          width={11}
          height={11}
          className={`opacity-40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[360px] pb-3' : 'max-h-0'}`}>
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
  const { customer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = cart?.itemCount || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="relative mx-auto flex h-[64px] w-full max-w-[1280px] items-center justify-between px-5 md:px-8">

        {/* Left: Mobile hamburger + Logo */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 -ml-1.5"
            aria-label="Menu"
          >
            <span className={`block w-5 h-[1.5px] bg-foreground transition-all duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-[5.5px]' : ''}`} />
            <span className={`block w-5 h-[1.5px] bg-foreground my-1 transition-all duration-200 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-[1.5px] bg-foreground transition-all duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-[5.5px]' : ''}`} />
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/icons/logo.svg" alt="Online Blinds" width={22} height={22} />
            <span className="hidden whitespace-nowrap sm:block font-display font-semibold text-[20px] tracking-[-0.02em] text-foreground leading-none">
              Online <span className="italic text-primary">Blinds</span>
            </span>
          </Link>
        </div>

        {/* Center: Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navigationData.map((item, i) => (
            <div key={i} className="group relative flex items-center h-[64px]">
              {item.submenu ? (
                <>
                  <button className="flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2 rounded-md text-[13.5px] font-medium text-neutral-600 hover:text-foreground hover:bg-neutral-50 transition-all relative">
                    {item.label}
                    <Image src="/icons/CaretDown.svg" alt="" width={10} height={10} className="opacity-40 group-hover:rotate-180 transition-transform duration-200" />
                  </button>
                  <div className="absolute left-0 top-full pt-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-1 transition-all duration-200 z-50">
                    <div className="min-w-[280px] bg-white rounded-2xl border border-border shadow-[0_8px_30px_rgba(0,0,0,0.08)] p-2">
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
                                <Link href={link.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-neutral-600 hover:bg-neutral-50 hover:text-foreground transition-colors">
                                  <Image src={icon} alt="" width={16} height={16} className="opacity-50 shrink-0" />
                                  {link.label}
                                </Link>
                              ) : (
                                <span className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] text-neutral-600">
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
                <Link href={item.href} className="whitespace-nowrap px-3.5 py-2 rounded-md text-[13.5px] font-medium text-neutral-600 hover:text-foreground hover:bg-neutral-50 transition-all">
                  {item.label}
                </Link>
              ) : (
                <span className="whitespace-nowrap px-3.5 py-2 text-[13.5px] font-medium text-neutral-600">{item.label}</span>
              )}
            </div>
          ))}
        </nav>

        {/* Right: Icons */}
        <div className="flex items-center gap-1 shrink-0">
          <Link href="/search" aria-label="Search" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors">
            <Image src="/icons/search.svg" alt="Search" width={18} height={18} className="opacity-60" />
          </Link>
          <Link href="/account" aria-label="Account" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors">
            <Image src="/icons/profile.svg" alt="Profile" width={18} height={18} className="opacity-60" />
          </Link>
          {customer && (
            <Link href="/api/auth/shopify/logout?return_to=/" className="hidden lg:block text-[12.5px] font-medium text-muted hover:text-primary transition-colors px-2">
              Logout
            </Link>
          )}
          <Link href="/cart" aria-label="Cart" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors relative">
            <Image src="/icons/cart.svg" alt="Cart" width={18} height={18} className="opacity-60" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 top-[64px] bg-black/20 z-40 animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
          <div className="lg:hidden absolute top-full left-0 w-full bg-white z-50 border-t border-border shadow-lg">
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
