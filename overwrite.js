const fs = require('fs');
const content = `'use client';

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
      <div className="border-b border-gray-100 last:border-0">
        {item.href ? (
          <Link
            href={item.href}
            className="flex items-center justify-between py-3 text-sm font-semibold text-black hover:text-[#a07222] transition-colors"
            onClick={onClose}
          >
            <span>{item.label}</span>
          </Link>
        ) : (
          <div className="flex items-center justify-between py-3 text-sm font-semibold text-black">
            <span>{item.label}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between py-3 text-sm font-semibold text-black w-full"
      >
        <span>{item.label}</span>
        <Image
          src="/icons/CaretDown.svg"
          alt=""
          width={12}
          height={12}
          className={\`opacity-60 transition-transform \${isOpen ? 'rotate-180' : ''}\`}
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
                    className="text-sm text-gray-700 hover:text-[#a07222] transition-colors block py-1"
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <div className="text-sm text-gray-700 block py-1">
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

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col backdrop-blur-[4px] bg-[rgba(250,248,245,0.8)] border-b border-[#e4dfd7]">
      {/* Top Banner */}
      <div className="bg-[#2b221d] w-full shrink-0">
        <div className="flex flex-col items-center px-4 py-2 w-full">
          <p className="font-['Jost',sans-serif] font-medium text-[#faf8f5] text-[12px] md:text-[14px] text-center tracking-[1.4px] uppercase whitespace-nowrap">
            <span>{\`Up to 50% Off + Extra 15% Off with Code \`}</span>
            <span className="font-semibold text-[#e2bc78]">SALE15</span>
          </p>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="h-[64px] flex items-center justify-between w-full max-w-[1280px] mx-auto px-4 md:px-6 lg:px-6 relative">
        
        {/* Left: Hamburger (Mobile) + Logo */}
        <div className="flex gap-4 items-center shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-1"
            aria-label="Menu"
          >
            <span className={\`w-5 h-0.5 bg-[#2b221d] transition-transform \${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}\`} />
            <span className={\`w-5 h-0.5 bg-[#2b221d] transition-opacity \${mobileMenuOpen ? 'opacity-0' : ''}\`} />
            <span className={\`w-5 h-0.5 bg-[#2b221d] transition-transform \${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}\`} />
          </button>
          
          <Link href="/" className="flex gap-2 items-center shrink-0">
            <div className="bg-[#a07222] flex items-center justify-center rounded-[2.4px] shrink-0 w-[32px] h-[32px]">
              <span className="font-['Jost',sans-serif] font-bold text-[#faf8f5] text-[18px] leading-none mb-0.5">O</span>
            </div>
            <div className="hidden sm:flex flex-col font-['Cormorant_Garamond',serif] justify-center leading-none not-italic text-[#2b221d] text-[20px] lg:text-[24px] tracking-[-0.5px] whitespace-nowrap">
              <p>
                <span className="leading-[28px] font-medium">Online </span>
                <span className="leading-[28px] text-[#a07222] font-medium ml-0.5">Blinds</span>
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
                  <div className="flex gap-[4px] items-center px-[12px] py-[8px] cursor-pointer hover:bg-[rgba(43,34,29,0.05)] rounded-[4px] transition-colors h-[36px]">
                    <span className="font-['Jost',sans-serif] font-medium text-[rgba(43,34,29,0.8)] text-[14px] leading-[20px] whitespace-nowrap">
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
                  <div className="absolute left-1/2 -translate-x-1/2 top-[64px] opacity-0 invisible group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 group-hover:visible transition-all duration-200 z-50 w-[1200px] pointer-events-none group-hover:pointer-events-auto">
                    <div className="bg-white border-t-2 border-[#a07222] shadow-xl p-8 rounded-b-[8px]">
                      <div className="max-w-4xl mx-auto">
                        <ul className="space-y-3">
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
                              <li key={linkIndex} className="flex items-start gap-2">
                                <Image src={icon} alt="" width={20} height={20} className="opacity-70 mt-0.5 shrink-0" />
                                {link.href ? (
                                  <Link href={link.href} className="text-[15px] font-['Jost',sans-serif] text-gray-700 hover:text-[#a07222] transition-colors">
                                    {link.label}
                                  </Link>
                                ) : (
                                  <span className="text-[15px] font-['Jost',sans-serif] text-gray-700">
                                    {link.label}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="flex px-[12px] py-[8px] items-center hover:bg-[rgba(43,34,29,0.05)] rounded-[4px] transition-colors h-[36px]"
                >
                  <span className="font-['Jost',sans-serif] font-medium text-[rgba(43,34,29,0.8)] text-[14px] leading-[20px] whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <div className="flex px-[12px] py-[8px] items-center h-[36px]">
                  <span className="font-['Jost',sans-serif] font-medium text-[rgba(43,34,29,0.8)] text-[14px] leading-[20px] whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              )}
            </div>
          ))}
          <Link
            href="/about"
            className="flex px-[12px] py-[8px] items-center hover:bg-[rgba(43,34,29,0.05)] rounded-[4px] transition-colors h-[36px] ml-0"
          >
            <span className="font-['Jost',sans-serif] font-medium text-[rgba(43,34,29,0.8)] text-[14px] leading-[20px] whitespace-nowrap">
              About Us
            </span>
          </Link>
        </nav>

        {/* Right: Icons */}
        <div className="flex gap-[8px] items-center shrink-0">
          <Link href="/search" aria-label="Search" className="flex items-center justify-center rounded-[4.4px] hover:bg-[rgba(43,34,29,0.05)] transition-colors w-[36px] h-[36px]">
            <div className="overflow-hidden relative w-[16px] h-[16px]">
              <Image src="/icons/search.svg" alt="Search" fill className="object-contain opacity-80" style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(21%) saturate(543%) hue-rotate(345deg) brightness(92%) contrast(92%)' }} />
            </div>
          </Link>
          <Link href="/account" aria-label="Account" className="flex items-center justify-center rounded-[4.4px] hover:bg-[rgba(43,34,29,0.05)] transition-colors w-[36px] h-[36px]">
            <div className="overflow-hidden relative w-[16px] h-[16px]">
              <Image src="/icons/profile.svg" alt="Profile" fill className="object-contain opacity-80" style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(21%) saturate(543%) hue-rotate(345deg) brightness(92%) contrast(92%)' }} />
            </div>
          </Link>
          {customer && (
            <Link
              href="/api/auth/shopify/logout?return_to=/"
              aria-label="Logout"
              className="text-sm font-medium text-[#a07222] hover:underline transition-opacity font-['Jost',sans-serif] mr-2 hidden sm:block"
            >
              Logout
            </Link>
          )}
          <Link href="/cart" aria-label="Cart" className="flex items-center justify-center rounded-[4.4px] hover:bg-[rgba(43,34,29,0.05)] transition-colors w-[36px] h-[36px] relative">
            <div className="overflow-hidden relative w-[16px] h-[16px]">
              <Image src="/icons/cart.svg" alt="Cart" fill className="object-contain opacity-80" style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(21%) saturate(543%) hue-rotate(345deg) brightness(92%) contrast(92%)' }} />
            </div>
            {cart.itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#e2bc78] text-[#2b221d] text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center font-['Jost',sans-serif]">
                {cart.itemCount > 99 ? '99+' : cart.itemCount}
              </span>
            )}
          </Link>
        </div>

      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 top-[100px] bg-black/50 z-40 transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="lg:hidden absolute top-[100%] left-0 w-full bg-white shadow-xl z-50 border-t border-[#e4dfd7]">
            <div className="px-4 py-4 max-h-[calc(100vh-100px)] overflow-y-auto">
              {navigationData.map((item, index) => (
                <MobileMenuItem
                  key={index}
                  item={item}
                  onClose={() => setMobileMenuOpen(false)}
                />
              ))}
              <div className="border-b border-gray-100 last:border-0">
                <Link
                  href="/about"
                  className="flex items-center justify-between py-3 text-sm font-semibold text-black hover:text-[#a07222] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>About Us</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
`;
fs.writeFileSync('src/components/layout/Header.tsx', content);
