'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

// We'll keep the slider logic but use the exact design for the primary slide
const slides = [
  {
    src: '/home/hero/hero-img1.webp',
    alt: 'Premium Vertical Blinds',
    tagline: 'Classic style, modern precision',
    title: 'Premium Vertical Blinds',
    buttonText: 'Shop Vertical Blinds'
  },
  {
    src: '/home/hero/hero-img2.webp', // Placeholder for other slides
    alt: 'Blackout Roller Shades',
    tagline: 'Total darkness, total comfort',
    title: 'Blackout Roller Shades',
    buttonText: 'Shop Roller Shades'
  },
  {
    src: '/home/hero/hero-img3.webp', // Placeholder for other slides
    alt: 'Dual Zebra Shades',
    tagline: 'Elegance meets light control',
    title: 'Dual Zebra Shades',
    buttonText: 'Shop Zebra Shades'
  },
];

const INTERVAL_MS = 5000;

const Hero = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[600px] w-full overflow-hidden bg-surface-soft">
      {/* Background sliding images */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === current ? 'opacity-100 z-0' : 'opacity-0 -z-10'
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-[rgba(31,41,51,0.68)] via-[rgba(31,41,51,0.32)] to-[rgba(31,41,51,0.08)]" />

      {/* Content wrapper */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="flex flex-col items-start w-full max-w-[1280px] px-6">
          <div className="flex flex-col gap-2 max-w-[512px]">
            <p className="font-jost font-medium text-[16px] tracking-[0.8px] text-white/72 uppercase">
              {slides[current].tagline}
            </p>
            <h1 className="font-display font-bold text-[60px] text-white leading-[60px] pb-4">
              {slides[current].title}
            </h1>
            <button className="self-start rounded-[4.4px] bg-[rgba(251,249,245,0.94)] px-8 shadow-sm transition-colors hover:bg-white">
              <span className="flex h-10 items-center justify-center font-jost text-[14px] font-medium text-foreground">
                {slides[current].buttonText}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Left/Right Arrows */}
      <button 
        onClick={() => setCurrent(c => (c === 0 ? slides.length - 1 : c - 1))}
        className="absolute left-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/12 backdrop-blur-[2px] transition-colors hover:bg-white/24"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <button 
        onClick={() => setCurrent(c => (c + 1) % slides.length)}
        className="absolute right-4 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/12 backdrop-blur-[2px] transition-colors hover:bg-white/24"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7.5 5L12.5 10L7.5 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2 items-center">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`rounded-full transition-all duration-300 ${
              index === current ? 'h-2.5 w-8 bg-[rgba(251,249,245,0.95)]' : 'h-2.5 w-2.5 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;
