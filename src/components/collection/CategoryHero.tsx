'use client';

import Image from 'next/image';

interface CategoryHeroProps {
  title: string;
  description: string;
  productCount: number;
}

// Category images mapping
const categoryImages: Record<string, string> = {
  'Vertical Blinds': '/home/products/vertical-blinds-1.jpg',
  'Roller Blinds': '/home/products/vertical-blinds-2.jpg',
  'Metal Venetian Blinds': '/home/products/vertical-blinds-5.jpg',
  'Venetian Blinds': '/home/products/vertical-blinds-5.jpg',
  'Roman Blinds': '/home/products/vertical-blinds-3.jpg',
  'Day and Night Blinds': '/home/products/vertical-blinds-4.jpg',
};

export default function CategoryHero({ title, description, productCount }: CategoryHeroProps) {
  const image = categoryImages[title] || '/home/products/blinds.jpeg';
  const isComingSoon = productCount === 0;

  return (
    <section className="relative h-[350px] w-full overflow-hidden">
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
        <div className="flex flex-col gap-[8px] items-start max-w-[1280px] px-[24px] w-[1280px]">
          {/* Product Count Label */}
          <div className="w-full">
            <div className="font-jost font-medium text-[14px] text-white/72 tracking-[0.7px] uppercase leading-[20px]">
              {isComingSoon ? 'Coming Soon' : `${productCount} Product${productCount === 1 ? '' : 's'} Available`}
            </div>
          </div>

          {/* Heading */}
          <div className="w-full">
            <h1 className="font-display text-[48px] font-semibold text-white leading-[48px]">
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
