import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-white">
      {/* Main footer */}
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-14">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4 max-w-[280px]">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/icons/logo.svg" alt="Online Blinds" width={20} height={20} className="filter brightness-0 invert" />
              <span className="font-display font-semibold text-[20px] text-white">
                Online <span className="italic text-primary">Blinds</span>
              </span>
            </Link>
            <p className="font-jost text-[13.5px] text-white/50 leading-relaxed">
              Premium custom blinds, manufactured in Texas. 15+ years of expertise.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Facebook" className="text-white/40 hover:text-white transition-colors">
                <Image src="/icons/facebook.svg" alt="Facebook" width={16} height={16} className="filter brightness-0 invert opacity-50 hover:opacity-100" />
              </a>
              <a href="#" aria-label="Instagram" className="text-white/40 hover:text-white transition-colors">
                <Image src="/icons/instagram.svg" alt="Instagram" width={16} height={16} className="filter brightness-0 invert opacity-50 hover:opacity-100" />
              </a>
            </div>
          </div>

          {/* Links — two columns */}
          <div className="flex gap-12 md:gap-16">
            <div className="flex flex-col gap-3">
              <p className="font-jost text-[11px] font-semibold tracking-[0.12em] uppercase text-primary mb-1">Shop</p>
              {['Blinds', 'Shades', 'Motorization', 'Blackout', 'Free Samples'].map((l) => (
                <Link key={l} href="/collections" className="font-jost text-[13.5px] text-white/50 hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <p className="font-jost text-[11px] font-semibold tracking-[0.12em] uppercase text-primary mb-1">Company</p>
              {[
                { label: 'About', href: '/about' },
                { label: 'Guides', href: '/guides' },
                { label: 'Contact', href: '#' },
                { label: 'Privacy', href: '#' },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="font-jost text-[13.5px] text-white/50 hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <p className="font-jost text-[11px] font-semibold tracking-[0.12em] uppercase text-primary mb-1">Contact</p>
            <a href="tel:+18326706705" className="font-jost text-[13.5px] text-white/50 hover:text-white transition-colors">+1 832-670-6705</a>
            <a href="mailto:enquiries@onlineblinds.com" className="font-jost text-[13.5px] text-white/50 hover:text-white transition-colors">enquiries@onlineblinds.com</a>
            <p className="font-jost text-[13px] text-white/30">Houston, TX</p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="font-jost text-[12px] text-white/30">© {new Date().getFullYear()} Online Blinds. All Rights Reserved.</p>
          <div className="flex gap-5">
            <Link href="#" className="font-jost text-[12px] text-white/30 hover:text-white/60 transition-colors">Privacy Policy</Link>
            <Link href="#" className="font-jost text-[12px] text-white/30 hover:text-white/60 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
