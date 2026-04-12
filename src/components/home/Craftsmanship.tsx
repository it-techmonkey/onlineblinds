import Image from 'next/image';
import Link from 'next/link';

const stats = [
  { value: '15+', label: 'Years of expertise' },
  { value: '10k+', label: 'Orders completed' },
  { value: '100%', label: 'Custom made' },
];

const Craftsmanship = () => {
  return (
    <section className="bg-white py-16 md:py-24 overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Content */}
          <div className="flex flex-col gap-6 order-2 lg:order-1">
            <p className="font-jost text-[11px] font-medium tracking-[0.18em] uppercase text-primary">
              Made in Texas
            </p>

            <h2 className="font-display text-[40px] font-semibold leading-[1.03] tracking-[-0.03em] text-foreground md:text-[52px]">
              Proudly Designed &amp;<br />
              Manufactured in <span className="italic">Texas</span>
            </h2>

            <p className="font-jost text-[16px] leading-[1.8] text-muted">
              Locally crafted with care, quality, and sustainability. With local production and skilled craftsmanship, we ensure perfect fit, lasting durability, and quicker lead times.
            </p>

            {/* Stats */}
            <div className="flex gap-8 pt-2 border-t border-border">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-0.5 pt-6">
                  <span className="font-display font-semibold text-[36px] leading-none text-foreground tracking-tight">{s.value}</span>
                  <span className="font-jost text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{s.label}</span>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="self-start flex items-center gap-2.5 bg-foreground text-white font-jost text-[13px] font-semibold uppercase tracking-[0.08em] px-7 h-12 rounded-lg transition-colors hover:bg-neutral-800 group"
            >
              Discover Our Story
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-0.5 transition-transform">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Right: Photo */}
          <div className="relative h-[380px] md:h-[480px] order-1 lg:order-2">
            <div className="absolute inset-0 rounded-2xl overflow-hidden">
              <Image
                src="/about/story.png"
                alt="Crafted window blinds in a warm, design-focused interior"
                fill
                className="object-cover object-center"
              />
            </div>
            {/* Teal accent block */}
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary rounded-2xl -z-10 hidden lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Craftsmanship;
