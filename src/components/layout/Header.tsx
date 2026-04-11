'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { navigationData, NavigationItem, NavigationLink } from '@/data/navigation';

// Mobile Menu Item Component with Accordion
const MobileMenuItem = ({ item, onClose }: { item: NavigationItem; onClose: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  if (!hasSubmenu) {
    return (
      <div className="border-b border-border last:border-0">
        {item.href ? (
          <Link
            href={item.href}
            className="flex items-center justify-between py-3 text-sm font-semibold text-foreground transition-colors hover:text-primary"
            onClick={onClose}
          >
            <span>{item.label}</span>
          </Link>
        ) : (
          <div className="flex items-center justify-between py-3 text-sm font-semibold text-foreground">
            <span>{item.label}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-3 text-sm font-semibold text-foreground"
      >
        <span>{item.label}</span>
        <Image
          src="/icons/CaretDown.svg"
          alt=""
          width={12}
          height={12}
          className={`opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && item.submenu && (
        <div className="pb-3 pl-4">
          <ul className="space-y-2">
            {item.submenu.map((link: NavigationLink, linkIndex: number) => (
              <li key={linkIndex}>
                {link.href ? (
                  <Link
                    href={link.href}
                    className="block py-1 text-[15px] font-['Jost',sans-serif] text-muted transition-colors hover:text-primary"
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <div className="block py-1 text-[15px] font-['Jost',sans-serif] text-muted">
                    {link.label}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const Header = () => {
  const { cart } = useCart();
  const { customer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart?.itemCount || 0;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-[rgba(251,249,245,0.88)] backdrop-blur-md">
      {/* Top Banner */}
      {/* <div className="bg-[#1f2a44] w-full shrink-0">
        <div className="flex flex-col items-center px-4 py-2 w-full max-w-[1280px] mx-auto">
          <p className="font-['Jost',sans-serif] font-medium text-[#f8f4ec] text-[12px] md:text-[14px] text-center tracking-[1.4px] uppercase whitespace-nowrap">
            <span>{`Up to 50% Off + Extra 15% Off with Code `}</span>
            <span className="font-semibold text-[#d4a15a]">SALE15</span>
          </p>
        </div>
      </div> */}

      {/* Main Header Container */}
      <div className="relative mx-auto flex h-[64px] w-full max-w-[1264px] items-center justify-between px-4 md:px-6">
        
        {/* Left: Hamburger (Mobile) + Logo */}
        <div className="flex gap-4 items-center shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-1"
            aria-label="Menu"
          >
            <span className={`w-5 h-0.5 bg-foreground transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-5 h-0.5 bg-foreground transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-0.5 bg-foreground transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
          
          <Link href="/" className="flex gap-[8px] items-center shrink-0">
            <Image src="/icons/logo.svg" alt="Online Blinds" width={20} height={20} />
            <div className="hidden sm:flex flex-col font-['Cormorant_Garamond',serif] justify-center leading-none not-italic text-foreground text-[20px] tracking-[-0.5px] whitespace-nowrap">
              <p>
                <span className="leading-[28px] font-semibold">Online </span>
                <span className="leading-[28px] text-primary font-semibold">Blinds</span>
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-[4px] absolute left-1/2 -translate-x-1/2 h-full">
          {navigationData.map((item, index) => (
            <div key={index} className="group flex flex-col items-start relative h-[64px] justify-center">
              {item.submenu ? (
                <>
                  <div className="flex gap-[4px] items-center px-[12px] py-[8px] cursor-pointer hover:bg-[rgba(31,41,51,0.04)] rounded-[4px] transition-colors h-[36px]">
                    <span className="font-['Jost',sans-serif] font-medium text-[rgba(31,41,51,0.78)] text-[14px] leading-[20px] whitespace-nowrap">
                      {item.label}
                    </span>
                    <Image
                      src="/icons/CaretDown.svg"
                      alt=""
                      width={12}
                      height={12}
                      className="opacity-70 transition-transform group-hover:rotate-180"
                    />
                  </div>

                  {/* Dropdown Menu */}
                  <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:translate-y-0 translate-y-1 group-hover:visible transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                    <div className="min-w-[320px] max-w-[420px] rounded-[16px] border border-border bg-white p-3 shadow-[0_20px_45px_rgba(31,41,51,0.12)]">
                        <ul className="space-y-1">
                          {item.submenu.map((link, linkIndex) => {
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
                              <li key={linkIndex}>
                                {link.href ? (
                                  <Link
                                    href={link.href}
                                    className="flex items-start gap-3 rounded-[12px] px-3 py-3 text-[15px] font-['Jost',sans-serif] text-muted hover:bg-surface-soft hover:text-primary transition-colors"
                                  >
                                    <Image src={icon} alt="" width={20} height={20} className="opacity-70 mt-0.5 shrink-0" />
                                    <span>{link.label}</span>
                                  </Link>
                                ) : (
                                  <span className="flex items-start gap-3 rounded-[12px] px-3 py-3 text-[15px] font-['Jost',sans-serif] text-muted">
                                    <Image src={icon} alt="" width={20} height={20} className="opacity-70 mt-0.5 shrink-0" />
                                    <span>{link.label}</span>
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
                <Link
                  href={item.href}
                  className="flex px-[12px] py-[8px] items-center hover:bg-[rgba(31,41,51,0.04)] rounded-[4px] transition-colors h-[36px]"
                >
                  <span className="font-['Jost',sans-serif] font-medium text-[rgba(31,41,51,0.78)] text-[14px] leading-[20px] whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <div className="flex px-[12px] py-[8px] items-center h-[36px]">
                  <span className="font-['Jost',sans-serif] font-medium text-[rgba(31,41,51,0.78)] text-[14px] leading-[20px] whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Right: Icons */}
        <div className="flex gap-[8px] items-center shrink-0">
          <Link href="/search" aria-label="Search" className="flex items-center justify-center rounded-[4.4px] hover:bg-[rgba(31,41,51,0.05)] transition-colors w-[36px] h-[36px]">
            <div className="overflow-hidden relative w-[22px] h-[22px]">
              <Image src="/icons/search.svg" alt="Search" fill className="object-contain opacity-80 filter grayscale" />
            </div>
          </Link>
          <Link href="/account" aria-label="Account" className="flex items-center justify-center rounded-[4.4px] hover:bg-[rgba(31,41,51,0.05)] transition-colors w-[36px] h-[36px]">
            <div className="overflow-hidden relative w-[22px] h-[22px]">
              <Image src="/icons/profile.svg" alt="Profile" fill className="object-contain opacity-80 filter grayscale hover:brightness-0" />
            </div>
          </Link>
          {customer && (
            <Link
              href="/api/auth/shopify/logout?return_to=/"
              aria-label="Logout"
              className="text-[14px] font-semibold text-[rgba(31,41,51,0.78)] hover:text-primary transition-colors font-['Jost',sans-serif] mr-2 ml-1 hidden lg:block"
            >
              Logout
            </Link>
          )}
          <Link href="/cart" aria-label="Cart" className="flex items-center justify-center rounded-[4.4px] hover:bg-[rgba(31,41,51,0.05)] transition-colors w-[36px] h-[36px] relative">
            <div className="overflow-hidden relative w-[22px] h-[22px]">
              <Image src="/icons/cart.svg" alt="Cart" fill className="object-contain opacity-80 filter grayscale hover:brightness-0" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] font-bold rounded-[999px] w-[18px] h-[18px] flex items-center justify-center font-['Jost',sans-serif] shadow-sm">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>

      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 top-[103px] bg-black/35 z-40 transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="lg:hidden absolute top-[100%] left-0 w-full bg-surface shadow-xl z-50 border-t border-border">
            <div className="px-4 py-4 max-h-[calc(100vh-103px)] overflow-y-auto">
              {navigationData.map((item, index) => (
                <MobileMenuItem
                  key={index}
                  item={item}
                  onClose={() => setMobileMenuOpen(false)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
