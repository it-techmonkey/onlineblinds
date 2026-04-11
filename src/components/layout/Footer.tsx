import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-foreground px-4 py-12 text-white md:px-6 lg:px-20 lg:py-16">
      <div className="max-w-[1240px] mx-auto flex flex-col gap-12 lg:gap-16">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 justify-between items-center lg:items-start text-center lg:text-left">
          <div className="flex flex-col gap-5 max-w-[360px] w-full items-center lg:items-start">
            <Link href="/" className="flex gap-2 items-center">
              <Image src="/icons/logo.svg" alt="Online Blinds" width={19} height={23} className="filter brightness-0 invert sepia-0 select-none" />
              <span className="font-['Cormorant_Garamond',serif] font-medium text-2xl lg:text-[28px] text-white leading-tight">
                Online <span className="italic">Blinds</span>
              </span>
            </Link>
            <p className="font-['Jost',sans-serif] text-sm leading-relaxed text-white/72 md:text-base">
              Premium custom blinds and shades, manufactured in Texas. Over 15 years of expertise, designed for light and built for life.
            </p>
          </div>
          
          <nav className="flex flex-wrap justify-center gap-x-8 gap-y-4 font-['Jost',sans-serif] text-base font-medium text-white/68 lg:justify-start">
            <Link href="/about" className="hover:text-white hover:underline transition-colors">About</Link>
            <Link href="#" className="hover:text-white hover:underline transition-colors">Testimonials</Link>
            <Link href="#" className="hover:text-white hover:underline transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-white hover:underline transition-colors">Contact</Link>
          </nav>
        </div>
        
        <div className="h-px w-full bg-white/12"></div>
        
        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center lg:items-end gap-10">
          <div className="flex flex-col gap-4 items-center lg:items-start">
            {/* Social Icons with white color scheme */}
            <div className="flex gap-6 items-center flex-wrap justify-center">
              <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                <Image src="/icons/facebook.svg" alt="Facebook" width={20} height={20} className="filter brightness-0 invert" />
              </a>
              <a href="#" className="opacity-80 hover:opacity-100 transition-opacity">
                <Image src="/icons/instagram.svg" alt="Instagram" width={20} height={20} className="filter brightness-0 invert" />
              </a>
            </div>
          </div>
          
          <div className="text-center font-['Jost',sans-serif] text-sm leading-relaxed text-white/60">
            <p>© {new Date().getFullYear()} Online Blinds Copyright</p>
            <p>All Rights Reserved</p>
          </div>
          
          <div className="flex flex-col gap-5 text-center lg:text-right font-['Jost',sans-serif]">
            <div className="text-sm leading-relaxed text-white/72 md:text-base">
              <a href="tel:+18326706705" className="hover:text-white transition-colors block">+1 832-670-6705</a>
              <a href="mailto:enquiries@onlineblinds.com" className="hover:text-white transition-colors block mt-1">enquiries@onlineblinds.com</a>
            </div>
            <div className="text-sm leading-relaxed text-white/56 md:text-base">
              <p>16819 Gentle Stone Dr</p>
              <p>Houston, TX 77095</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

