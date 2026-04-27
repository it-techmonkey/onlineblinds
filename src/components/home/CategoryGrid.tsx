import Link from 'next/link';
import Image from 'next/image';

const categoryItems = [
  { label: 'Light Filtering Vertical Blinds', href: '/collections/light-filtering-vertical-blinds', image: "/home/categories/light_filtering_vertical_blinds.webp" },
  { label: 'Blackout Vertical Blinds', href: '/collections/blackout-vertical-blinds', image: "/home/categories/blackout_vertical_blinds.webp" },
  { label: 'Waterproof Blackout Roller Shades', href: '/collections/waterproof-blackout-roller-shades', image: "/home/categories/waterproof_blackout_roller_shades.webp" },
  { label: 'Dual Zebra Shades', href: '/collections/day-and-night-blinds', image: "/home/categories/dual_zebra_shades.webp" },
  { label: 'Light Filtering Roller Shades', href: '/collections/light-filtering-roller-shades', image: "/home/categories/light_filtering_roller_shades.webp" },
  { label: 'Blackout Roller Shades', href: '/collections/blackout-roller-shades', image: "/home/categories/blackout_roller_shades.webp" },
  { label: 'Motorized Roller Shades', href: '/collections/motorised-roller-shades', image: "/home/categories/motorised_roller_shades.webp" },
  { label: 'Motorized Dual Zebra Shades', href: '/collections/motorised-dual-zebra-shades', image: "/home/categories/motorised_dual_zebra_shades.webp" },
];

const CategoryGrid = () => {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        {/* Header row */}
        <div className="flex items-end justify-between mb-10 md:mb-12">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="block w-6 h-0.5 bg-primary rounded-full" />
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">Collections</p>
            </div>
            <h2 className="font-display font-semibold text-[36px] md:text-[40px] leading-[1.1] tracking-tight text-foreground">
              Shop by Category
            </h2>
          </div>
          <Link
            href="/collections"
            className="hidden md:flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-primary transition-colors group"
          >
            View all
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform duration-200">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {categoryItems.map((cat, i) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group flex flex-col overflow-hidden rounded-xl bg-neutral-50 border border-border/60 transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1 hover:border-primary/20"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative h-[200px] md:h-[220px] w-full overflow-hidden">
                {cat.image && (
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/8 transition-colors duration-300" />
              </div>
              <div className="px-4 py-3.5 flex items-center justify-between border-t border-border/40 group-hover:border-primary/20 transition-colors">
                <span className="font-jost font-medium text-[13.5px] text-foreground leading-snug group-hover:text-primary transition-colors duration-200">
                  {cat.label}
                </span>
                <svg
                  width="13" height="13" viewBox="0 0 16 16" fill="none"
                  className="text-primary shrink-0 translate-x-[-6px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-250"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
