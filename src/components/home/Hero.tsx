'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const slides = [
  {
    src: '/home/hero/hero-img1.webp',
    alt: 'Premium Vertical Blinds',
    eyebrow: 'Classic style, modern precision',
    title: 'Premium\nVertical Blinds',
    buttonText: 'Shop Vertical Blinds',
    href: '/collections/light-filtering-vertical-blinds',
  },
  {
    src: '/home/hero/hero-img2.webp',
    alt: 'Blackout Roller Shades',
    eyebrow: 'Total darkness, total comfort',
    title: 'Blackout\nRoller Shades',
    buttonText: 'Shop Roller Shades',
    href: '/collections/blackout-roller-shades',
  },
  {
    src: '/home/hero/hero-img3.webp',
    alt: 'Dual Zebra Shades',
    eyebrow: 'Elegance meets light control',
    title: 'Dual\nZebra Shades',
    buttonText: 'Shop Zebra Shades',
    href: '/collections/day-and-night-blinds',
  },
];

const INTERVAL_MS = 6000;

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => { setAnimKey((k) => k + 1); return (prev + 1) % slides.length; });
    }, INTERVAL_MS);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNav = (index: number) => {
    setCurrent(index);
    setAnimKey((k) => k + 1);
    startTimer();
  };

  return (
    <section className="relative h-130 sm:h-155 md:h-175 w-full overflow-hidden bg-neutral-100">
      {/* Images with subtle zoom */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className={`object-cover transition-transform duration-8000 ease-out ${i === current ? 'scale-105' : 'scale-100'}`}
            priority={i === 0}
          />
        </div>
      ))}

      {/* Minimal overlay for legible text */}
      <div className="absolute inset-0 z-10 bg-linear-to-r from-black/70 via-black/45 to-black/20" />

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div key={animKey} className="animate-slide-up-fade flex flex-col gap-4 max-w-75 sm:max-w-115 md:max-w-140">
            <p className="font-jost text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] uppercase text-primary/95 bg-white/90 rounded-full px-3 py-1 self-start">
              {slides[current].eyebrow}
            </p>

            <h1
              className="font-display font-semibold text-[42px] sm:text-[52px] md:text-[72px] text-white leading-[0.98] tracking-[-0.02em]"
              style={{ whiteSpace: 'pre-line' }}
            >
              {slides[current].title}
            </h1>

            <Link
              href={slides[current].href}
              className="self-start mt-1 inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-jost font-semibold text-[13px] sm:text-[14px] tracking-wide px-5 sm:px-6 h-11 rounded-md transition-colors duration-200 group"
            >
              {slides[current].buttonText}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      <button
        onClick={() => handleNav(current === 0 ? slides.length - 1 : current - 1)}
        className="hidden sm:flex absolute left-4 top-1/2 z-30 -translate-y-1/2 w-10 h-10 rounded-full bg-white/12 backdrop-blur border border-white/20 items-center justify-center hover:bg-white/22 transition-colors duration-200"
        aria-label="Previous"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button
        onClick={() => handleNav((current + 1) % slides.length)}
        className="hidden sm:flex absolute right-4 top-1/2 z-30 -translate-y-1/2 w-10 h-10 rounded-full bg-white/12 backdrop-blur border border-white/20 items-center justify-center hover:bg-white/22 transition-colors duration-200"
        aria-label="Next"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 5L12.5 10L7.5 15" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => handleNav(i)}
            aria-label={`Slide ${i + 1}`}
            className="relative h-0.75 rounded-full transition-all duration-500 overflow-hidden"
            style={{ width: i === current ? 26 : 10, background: 'rgba(255,255,255,0.35)' }}
          >
            {i === current && (
              <span
                className="absolute inset-0 bg-primary rounded-full"
                style={{
                  animation: `slide-progress ${INTERVAL_MS}ms linear forwards`,
                }}
              />
            )}
            {i !== current && (
              <span className="absolute inset-0 bg-white/50 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-progress {
          from { transform: scaleX(0); transform-origin: left; }
          to   { transform: scaleX(1); transform-origin: left; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
