'use client';

import Image from 'next/image';

interface CategoryHeroProps {
  title: string;
  slug?: string;
  description: string;
  productCount: number;
}

const slugToImageMap: Record<string, string> = {
  // Navigation Custom Slugs
  'light-filtering-vertical-blinds': '/collections/hero-lf-vertical.png',
  'blackout-vertical-blinds': '/collections/hero-bo-vertical.png',
  'waterproof-blackout-vertical-blinds': '/collections/hero-wp-vertical.png',
  'light-filtering-roller-shades': '/collections/hero-lf-roller.png',
  'blackout-roller-shades': '/collections/hero-bo-roller.png',
  'waterproof-blackout-roller-shades': '/collections/hero-wp-roller.png',
  'motorised-roller-shades': '/collections/hero-mot-roller.png',
  'motorised-dual-zebra-shades': '/collections/hero-mot-zebra.png',
  'motorised-eclipsecore': '/collections/hero-eclipsecore.png',
  'blackout-roller-shades-category': '/collections/hero-bo-roller.png',
  'blackout-dual-zebra-shades': '/collections/hero-bo-zebra.png',
  'blackout-vertical-blinds-category': '/collections/hero-bo-vertical.png',
  'eclipsecore-shades': '/collections/hero-eclipsecore.png',
  'shop-by-feature': '/collections/hero-feature.png',
  'shop-by-room': '/collections/hero-room.png',

  // Backend Base Slugs
  'vertical-blinds': '/collections/hero-vertical.png',
  'roller-blinds': '/collections/hero-roller.png',
  'day-and-night-blinds': '/collections/hero-daynight.png',
  'pleated-blinds': '/collections/hero-eclipsecore.png',
  'venetian-blinds': '/collections/hero-venetian.png',
  'roman-blinds': '/collections/hero-roman.png',
};

const getHeroImage = (title: string, slug?: string): string => {
  // 1. Exact Match via Slug
  if (slug && slugToImageMap[slug]) {
    return slugToImageMap[slug];
  }

  // 2. Fallback Substring Matching via Title
  const t = title.toLowerCase();
  if (t.includes('vertical')) return '/collections/hero-vertical.png';
  if (t.includes('venetian')) return '/collections/hero-venetian.png';
  if (t.includes('roman')) return '/collections/hero-roman.png';
  if (t.includes('zebra') || t.includes('day and night')) return '/collections/hero-daynight.png';
  if (t.includes('roller') || t.includes('shade')) return '/collections/hero-roller.png';

  // 3. Global Default Fallback
  return '/collections/hero-all.png';
};

export default function CategoryHero({ title, slug, description, productCount }: CategoryHeroProps) {
  const image = getHeroImage(title, slug);
  const isComingSoon = productCount === 0;

  return (
    <section className="relative h-[320px] md:h-[500px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[rgba(31,41,51,0.7)] via-[rgba(31,41,51,0.34)] to-[rgba(31,41,51,0.12)]" />

      {/* Content Container */}
      <div className="absolute inset-0 z-[2] flex items-center justify-center">
        <div className="flex flex-col gap-[8px] items-start max-w-[1280px] px-[24px] w-full">
          {/* Product Count Label */}
          <div className="w-full">
            <div className="font-jost font-medium text-[14px] text-white/72 tracking-[0.7px] uppercase leading-[20px]">
              {isComingSoon ? 'Coming Soon' : `${productCount} Product${productCount === 1 ? '' : 's'} Available`}
            </div>
          </div>

          {/* Heading */}
          <div className="w-full">
            <h1 className="font-display text-[28px] leading-[32px] md:text-[48px] md:leading-[48px] font-semibold text-white">
              {title}
            </h1>
          </div>

          <p className="max-w-2xl font-jost text-[15px] leading-[24px] text-white/76 md:text-[16px]">
            {description}
          </p>

          {/* Feature Badges */}
          <div className="flex w-full flex-wrap items-center gap-[12px] pt-[8px]">
            <div className="flex items-center gap-[6px] rounded-full border border-white/18 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <svg className="h-[16px] w-[16px] text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <div className="font-jost text-[14px] font-normal text-white/78 leading-[20px]">
                Free Samples
              </div>
            </div>
            <div className="flex items-center gap-[6px] rounded-full border border-white/18 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <svg className="h-[16px] w-[16px] text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="font-jost text-[14px] font-normal text-white/78 leading-[20px]">
                Fast Delivery
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
