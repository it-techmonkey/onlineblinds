import Image from 'next/image';
import type { Metadata } from 'next';
import { Header, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'About Us - Online Blinds | Custom Blinds Made in Yorkshire',
  description: 'Learn about Online Blinds - over 15 years of expertise in custom window coverings. Designed for light, built for life. Manufactured in Yorkshire.',
};

type StatIconVariant = 'experience' | 'customers' | 'custom' | 'guarantee';

const stats: Array<{ value: string; label: string; icon: StatIconVariant }> = [
  { value: '15+', label: 'Years of Experience', icon: 'experience' },
  { value: '50K+', label: 'Happy Customers', icon: 'customers' },
  { value: '100%', label: 'Custom Made', icon: 'custom' },
  { value: '30-Day', label: 'Guarantee', icon: 'guarantee' },
];

const highlights = [
  {
    title: 'Custom Made to Measure',
    description: 'Every blind is precision-cut to your exact window dimensions. No standard sizes - just a perfect fit, every time.',
  },
  {
    title: 'Premium Materials',
    description: 'We source only the finest fabrics and components, ensuring lasting beauty and durability for years to come.',
  },
  {
    title: 'Factory Direct Pricing',
    description: 'By selling directly to you, we cut out the middleman, delivering premium quality at unbeatable prices.',
  },
  {
    title: 'Expert Craftsmanship',
    description: 'Our skilled artisans in Yorkshire bring decades of experience to every window covering we produce.',
  },
  {
    title: 'Free Samples',
    description: 'Try before you buy. We will send you free fabric samples so you can see the quality and colors in your own home.',
  },
  {
    title: 'Satisfaction Guaranteed',
    description: 'Love your blinds or we will make it right. Our 30-day guarantee means you can buy with complete confidence.',
  },
];

function StatIcon({ variant }: { variant: StatIconVariant }) {
  const common = 'h-8 w-8 text-primary';

  if (variant === 'experience') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === 'customers') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <circle cx="9" cy="8" r="3" />
        <path d="M4 18c0-2.7 2.2-4.8 5-4.8S14 15.3 14 18" strokeLinecap="round" />
        <circle cx="17" cy="9" r="2" />
        <path d="M15.3 18c.2-1.8 1.6-3.2 3.7-3.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (variant === 'custom') {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
        <path d="M5 5h14v14H5z" />
        <path d="M8 16l8-8" strokeLinecap="round" />
        <path d="M9 9h.01M15 15h.01" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path d="M12 3l7 3v6c0 5.2-3.2 8-7 9-3.8-1-7-3.8-7-9V6l7-3z" strokeLinejoin="round" />
      <path d="M9 12.5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main>
        <section className="relative flex h-130 items-center justify-center overflow-hidden md:h-150">
          <Image
            src="/about/hero-bg.webp"
            alt="Warm natural sunlight filtering through premium custom sheer roller blinds in a modern living room"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[rgba(31,41,51,0.58)]" />

          <div className="relative z-10 mx-auto flex max-w-245 flex-col items-center gap-4 px-6 text-center md:px-8">
            <h1 className="font-display text-[38px] leading-[1.08] text-white sm:text-[48px] md:text-[60px]">
              Designed for Light. <span className="italic">Built for Life.</span>
            </h1>
            <p className="max-w-190 text-[16px] leading-7 text-white/78 md:text-[18px]">
              Light changes how a space feels. It sets the mood of a room, defines comfort, and
              shapes how we experience our homes every day.
            </p>
          </div>
        </section>

        <section className="px-6 py-20 md:px-10 lg:px-14">
          <div className="mx-auto grid w-full max-w-308 grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <h2 className="font-display text-[32px] leading-10 text-foreground md:text-[36px]">Our Story</h2>
              <div className="mt-6 space-y-4 text-[16px] leading-6.5 text-muted">
                <p>
                  At Online Blinds, we&apos;ve spent over 15 years understanding the relationship between light and living - how to filter light softly, how to block it completely, and how to give homeowners full control over it.
                </p>
                <p>
                  Our journey began in 2008, working hands-on with window coverings across multiple markets and countries. Over time, we mastered the materials, the mechanics, and the craftsmanship behind high-quality blinds and shades.
                </p>
                <p>
                  We created Online Blinds to make premium, custom window coverings simple, accessible, and reliable - without showroom pressure, inflated prices, or guesswork.
                </p>
              </div>
            </div>

            <div className="relative h-75 overflow-hidden rounded-2xl sm:h-85 lg:h-82.25">
              <Image
                src="/about/story.png"
                alt="Close-up of skilled artisan carefully measuring and assembling premium textured fabric for custom window blinds"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 576px"
              />
            </div>
          </div>
        </section>

        <section className="bg-surface-soft px-6 py-16 md:px-10 lg:px-14">
          <div className="mx-auto grid w-full max-w-308 grid-cols-2 gap-8 md:grid-cols-4 md:gap-10">
            {stats.map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center">
                <StatIcon variant={item.icon} />
                <p className="pt-2 font-display text-[30px] leading-10 text-foreground md:text-[36px]">
                  {item.value}
                </p>
                <p className="text-[14px] leading-5 text-muted">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 py-24 md:px-10 lg:px-14">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="text-center font-display text-[32px] leading-10 text-foreground md:text-[36px]">
              What Sets Us Apart
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {highlights.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-border bg-surface p-6.25"
                >
                  <h3 className="text-[16px] font-medium leading-6 text-foreground">{item.title}</h3>
                  <p className="mt-1.75 text-[14px] leading-[22.75px] text-muted">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
