import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    id: 1,
    title: 'First in your Letterbox',
    description: 'Samples are posted directly through your letterbox — no waiting required.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 9l10 7 10-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 2,
    title: 'Available on Selected Products',
    description: 'Free samples are offered on specific fabric ranges — look for the sample option on eligible pages.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 3,
    title: 'Find Your Perfect Match',
    description: 'See how our fabrics look in your own home before placing your order.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const FreeSamples = () => {
  return (
    <section className="bg-neutral-50 py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

        {/* Right: Image */}
        <div className="relative h-[340px] md:h-[460px] order-1 lg:order-1 rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.1)] group">
          <Image
            src="/home/samples.webp"
            alt="Free fabric samples"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        </div>

        {/* Left: Content */}
        <div className="flex flex-col gap-7 order-2 lg:order-2">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="block w-6 h-0.5 bg-primary rounded-full" />
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">Free Samples</p>
            </div>
            <h2 className="font-display font-semibold text-[36px] md:text-[42px] leading-[1.1] tracking-tight text-foreground mb-4">
              Try Before You Buy
            </h2>
            <p className="font-jost text-[15px] leading-[1.75] text-muted">
              Order up to 10 FREE fabric samples — delivered straight to your door. Feel the quality and see the colours in your space before committing.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {features.map((f) => (
              <div key={f.id} className="flex gap-4 items-start group">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-primary-light text-primary flex items-center justify-center transition-all duration-200 group-hover:bg-primary group-hover:text-white group-hover:shadow-md group-hover:shadow-primary/20">
                  {f.icon}
                </div>
                <div className="pt-0.5">
                  <h3 className="font-jost font-semibold text-[14px] text-foreground mb-1">{f.title}</h3>
                  <p className="font-jost text-[13.5px] text-muted leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/collections"
            className="self-start flex items-center gap-2.5 bg-primary hover:bg-primary-dark text-white font-jost font-semibold text-[14px] px-7 h-12 rounded-lg transition-all duration-200 shadow-sm hover:shadow-primary/25 hover:shadow-md hover:-translate-y-px group"
          >
            Order Free Samples
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform duration-200">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FreeSamples;
