'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const categories = [
  { id: 1,  name: 'Light Filtering Roller Shades',    href: '/collections/light-filtering-roller-shades',    image: '/home/categories/light%20filtering%20roller%20shades.png' },
  { id: 2,  name: 'Blackout Roller Shades',            href: '/collections/blackout-roller-shades',            image: '/home/categories/Blackout%20roller%20Shades.png' },
  { id: 3,  name: 'Waterproof Blackout Roller Shades', href: '/collections/waterproof-blackout-roller-shades', image: '/home/categories/Waterproof%20Blackout%20roller%20Shades.png' },
  { id: 4,  name: 'Dual Zebra Shades',                 href: '/collections/dual-zebra-shades',                 image: '/home/categories/Dual%20zebra%20Shades.png' },
  { id: 5,  name: 'Light Filtering Vertical Blinds',   href: '/collections/light-filtering-vertical-blinds',   image: '/home/categories/light%20filtering%20vertical%20blinds.png' },
  { id: 6,  name: 'Blackout Vertical Blinds',          href: '/collections/blackout-vertical-blinds',          image: '/home/categories/blackout%20vertical%20blinds.png' },
  { id: 7,  name: 'Waterproof Vertical Blinds',        href: '/collections/waterproof-blackout-vertical-blinds', image: '/home/categories/water%20proof%20vertical%20blinds.png' },
  { id: 8,  name: 'EclipseCore Shades',                href: '/collections/eclipsecore-shades',                image: '/home/categories/eclipse%20core%20shades.png' },
  { id: 9,  name: 'Motorised Roller Shades',           href: '/collections/motorised-roller-shades',           image: '/home/categories/Motorised%20roller%20shades.png' },
  { id: 10, name: 'Motorised Dual Zebra Shades',       href: '/collections/motorised-dual-zebra-shades',       image: '/home/categories/motorised%20zebra%20dual%20shades.png' },
  { id: 11, name: 'Motorised EclipseCore',             href: '/collections/motorised-eclipsecore',             image: '/home/categories/motorised%20eclipsecore.png' },
];

const Categories = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -354 : 354,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="bg-white py-12 md:py-16 lg:py-24 overflow-hidden">
      <div className="flex flex-col gap-8 md:gap-10 items-center">
        <div className="w-full flex items-center justify-between px-4 md:px-6 lg:px-20">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="block w-6 h-0.5 bg-primary rounded-full" />
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">Browse All</p>
            </div>
            <h2 className="font-display text-[32px] md:text-[36px] lg:text-[40px] font-semibold text-foreground tracking-tight leading-[1.1]">
              Popular Categories
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/collections"
              className="hidden md:flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-primary transition-colors group mr-2"
            >
              View all
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform duration-200">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <div className="hidden lg:flex gap-2">
              <button
                onClick={() => scroll('left')}
                aria-label="Scroll left"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary hover:-translate-x-0.5 transition-all duration-200 text-muted-strong"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={() => scroll('right')}
                aria-label="Scroll right"
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary hover:text-primary hover:translate-x-0.5 transition-all duration-200 text-muted-strong"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div ref={scrollRef} className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 md:gap-5 h-[360px] md:h-[430px] items-center pl-4 md:pl-6 lg:pl-20">
            {categories.map((category) => (
              <a
                key={category.id}
                href={category.href}
                className="flex flex-col gap-3 shrink-0 w-[250px] md:w-[300px] h-full group"
              >
                <div className="relative flex-1 w-full overflow-hidden rounded-xl border border-border/60 group-hover:border-primary/20 transition-colors duration-300">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/6 transition-colors duration-300" />
                </div>
                <h3 className="text-sm md:text-[15px] font-medium text-foreground text-center w-full group-hover:text-primary transition-colors duration-200 leading-snug px-1">
                  {category.name}
                </h3>
              </a>
            ))}
            <div className="shrink-0 w-6 lg:w-[68px] h-px" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Categories;
