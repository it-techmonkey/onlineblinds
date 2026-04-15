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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Content */}
          <div className="flex flex-col gap-7 order-2 lg:order-1">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="block w-6 h-0.5 bg-primary rounded-full" />
                <p className="font-jost text-[11px] font-semibold tracking-[0.18em] uppercase text-primary">
                  Made in Yorkshire
                </p>
              </div>

              <h2 className="font-display text-[38px] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground md:text-[50px]">
                Proudly Designed &amp;<br />
                Manufactured in <span className="italic text-primary">Yorkshire</span>
              </h2>
            </div>

            <p className="font-jost text-[16px] leading-[1.8] text-muted max-w-[460px]">
              Locally crafted with care, quality, and sustainability. With local production and skilled craftsmanship, we ensure perfect fit, lasting durability, and quicker lead times.
            </p>

            {/* Stats */}
            <div className="flex gap-8 pt-2 border-t border-border">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col gap-1 pt-5 group">
                  <span className="font-display font-semibold text-[40px] leading-none text-foreground tracking-tight tabular-nums group-hover:text-primary transition-colors duration-300">
                    {s.value}
                  </span>
                  <span className="font-jost text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/about"
              className="self-start flex items-center gap-2.5 bg-foreground text-white font-jost text-[13px] font-semibold uppercase tracking-[0.08em] px-7 h-12 rounded-lg transition-all duration-200 hover:bg-neutral-800 hover:-translate-y-px hover:shadow-lg group"
            >
              Discover Our Story
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform duration-200">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Right: Photo */}
          <div className="relative h-[400px] md:h-[500px] order-1 lg:order-2">
            <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.1)]">
              <Image
                src="/about/story.png"
                alt="Crafted window blinds in a warm, design-focused interior"
                fill
                className="object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Craftsmanship;
