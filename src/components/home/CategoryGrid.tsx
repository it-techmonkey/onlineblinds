import Link from 'next/link';
import Image from 'next/image';

const categoryItems = [
  { label: 'Light Filtering Vertical Blinds', href: '/collections/light-filtering-vertical-blinds', image: "/home/categories/light_filtering_vertical_blinds.webp" },
  { label: 'Blackout Vertical Blinds', href: '/collections/blackout-vertical-blinds', image: "/home/categories/blackout_vertical_blinds.webp" },
  { label: 'Waterproof Blackout Roller Shades', href: '/collections/waterproof-blackout-roller-shades', image: "/home/categories/waterproof_blackout_roller_shades.webp" },
  { label: 'Dual Zebra Shades', href: '/collections/dual-zebra-shades', image: "/home/categories/dual_zebra_shades.webp" },
  { label: 'Light Filtering Roller Shades', href: '/collections/light-filtering-roller-shades', image: "/home/categories/light_filtering_roller_shades.webp" },
  { label: 'Blackout Roller Shades', href: '/collections/blackout-roller-shades', image: "/home/categories/blackout_roller_shades.webp" },
  { label: 'Motorized Roller Shades', href: '/collections/motorised-roller-shades', image: "/home/categories/motorised_roller_shades.webp" },
  { label: 'Motorized Dual Zebra Shades', href: '/collections/motorised-dual-zebra-shades', image: "/home/categories/motorised_dual_zebra_shades.webp" },
];

const CategoryGrid = () => {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Heading Container */}
        <div className="flex flex-col gap-2 mb-10 w-full">
          <h2 className="font-display font-semibold text-[36px] leading-[40px] text-foreground">
            Shop by Category
          </h2>
          <p className="font-jost font-normal text-[16px] leading-[24px] text-muted">
            Browse our full range of made-to-measure window coverings
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {categoryItems.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className="group flex flex-col items-center gap-4 overflow-hidden rounded-[12px] border border-border bg-surface p-[1px] pb-[17px] transition-shadow hover:shadow-[0_16px_30px_rgba(31,41,51,0.07)]"
            >
              {/* Image Container */}
              <div className="relative h-[216px] w-full overflow-hidden rounded-[11px] rounded-b-none bg-surface-soft">
                {cat.image && (
                  <Image
                    src={cat.image}
                    alt={cat.label}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              
              {/* Label */}
              <div className="w-full px-4 text-center">
                <span className="font-jost font-medium text-[16px] leading-[24px] text-foreground">
                  {cat.label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
