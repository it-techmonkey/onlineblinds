import Image from 'next/image';
import Link from 'next/link';

const Installation = () => {
  return (
    <section className="relative bg-surface-muted px-4 md:px-6 lg:px-20 py-16 md:py-20 lg:py-28 overflow-hidden">
      {/* Decorative vertical accent lines */}
      <div className="hidden lg:flex flex-col gap-4 absolute top-1/2 -translate-y-1/2 right-0">
        <div className="w-1 h-12 bg-[#c9a96e] rounded-l-full opacity-80" />
        <div className="w-1 h-12 bg-[#c9a96e] rounded-l-full opacity-45" />
        <div className="w-1 h-12 bg-[#c9a96e] rounded-l-full opacity-20" />
      </div>

      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">

        {/* Left: Text */}
        <div className="flex flex-col gap-6 max-w-[520px] w-full items-start">

          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#c9a96e] shrink-0 rounded-full" />
            <p className="font-jost font-semibold text-[11px] tracking-[0.18em] uppercase text-[#c9a96e]">
              Professional Installation
            </p>
          </div>

          <h2 className="font-display text-[36px] md:text-[44px] font-semibold text-foreground tracking-[-0.02em] leading-[1.08]">
            Professional Installation Available at your Doorstep
          </h2>

          {/* Mobile image */}
          <div className="relative w-full h-[280px] lg:hidden overflow-hidden rounded-2xl shadow-[0_16px_40px_rgba(31,41,51,0.1)]">
            <Image
              src="/home/installation.jpg"
              alt="Professional installation"
              fill
              className="object-cover"
            />
          </div>

          <p className="font-jost text-[16px] leading-[1.75] text-muted">
            We offer a complete blinds installation service. Simply order your chosen blinds and add contact us about installation once your order is confirmed. Our team will give you a call to arrange a convenient installation date and time.
          </p>

          {/* Trust micro-badges */}
          <div className="flex flex-wrap gap-2">
            {['Licensed Installers', 'Same-Day Available', 'Fully Insured'].map((badge) => (
              <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#c9a96e]/30 text-[12px] font-medium text-muted-strong">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c9a96e]" />
                {badge}
              </span>
            ))}
          </div>

          <Link
            href="/contact"
            className="flex items-center gap-2.5 h-12 bg-primary text-white px-8 rounded-lg font-jost text-[14px] font-semibold tracking-wide hover:bg-primary-dark transition-all duration-200 hover:-translate-y-px hover:shadow-md hover:shadow-primary/20 group"
          >
            Book Now
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1 duration-200">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Right: Image */}
        <div className="relative w-full lg:flex-1 h-[300px] md:h-[400px] lg:h-[500px] max-lg:hidden overflow-hidden rounded-2xl shadow-[0_24px_64px_rgba(31,41,51,0.12)] group">
          <Image
            src="/home/installation.jpg"
            alt="Professional installation"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
          {/* Gold corner accent */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#c9a96e]/80 to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default Installation;
