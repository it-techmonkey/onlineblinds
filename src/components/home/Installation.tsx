import Image from 'next/image';
import Link from 'next/link';

const Installation = () => {
  return (
    <section className="relative bg-surface-muted px-4 md:px-6 lg:px-20 py-16 md:py-20 lg:py-28 overflow-hidden">
      {/* Decorative vertical accent lines */}
      <div className="hidden lg:flex flex-col gap-5 absolute top-1/2 -translate-y-1/2 right-0">
        <div className="w-1 h-10 bg-[#c9a96e] rounded-l-full opacity-80" />
        <div className="w-1 h-10 bg-[#c9a96e] rounded-l-full opacity-50" />
        <div className="w-1 h-10 bg-[#c9a96e] rounded-l-full opacity-25" />
      </div>

      <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">

        {/* Left: Text */}
        <div className="flex flex-col gap-6 max-w-[520px] w-full items-start">

          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#c9a96e] shrink-0" />
            <p className="font-jost font-medium text-[11px] tracking-[0.14em] uppercase text-[#c9a96e]">
              Professional Installation
            </p>
          </div>

          <h2 className="font-display text-[36px] md:text-[42px] font-semibold text-foreground tracking-[-0.02em] leading-[1.1]">
            Professional Installation Available at your Doorstep
          </h2>

          {/* Mobile image */}
          <div className="relative w-full h-[280px] lg:hidden overflow-hidden rounded-[16px] shadow-[0_16px_40px_rgba(31,41,51,0.1)]">
            <Image
              src="/home/installation.jpg"
              alt="Professional installation"
              fill
              className="object-cover"
            />
          </div>

          <p className="font-jost text-[16px] leading-[1.7] text-muted">
            We offer a complete blinds installation service. Simply order your chosen blinds and add contact us about installation once your order is confirmed. Our team will give you a call to arrange a convenient installation date and time.
          </p>

          <Link
            href="/contact"
            className="flex items-center gap-2.5 h-11 bg-primary text-white px-8 rounded-[4.4px] font-jost text-[14px] font-medium tracking-wide hover:bg-primary-dark transition-colors shadow-sm group"
          >
            Book Now
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Right: Image */}
        <div className="relative w-full lg:flex-1 h-[300px] md:h-[400px] lg:h-[500px] max-lg:hidden overflow-hidden rounded-[20px] shadow-[0_24px_64px_rgba(31,41,51,0.1)]">
          <Image
            src="/home/installation.jpg"
            alt="Professional installation"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default Installation;
