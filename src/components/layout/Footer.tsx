import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-[linear-gradient(180deg,#171717_0%,#0f0f0f_100%)] text-white">
      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
        <div className="flex flex-col items-center text-center md:flex-row md:items-start md:justify-between md:text-left gap-10">

          {/* Brand */}
          <div className="flex max-w-70 flex-col items-center md:items-start gap-4">
            <Link href="/" className="group flex items-center gap-2">
              <Image
                src="/icons/logo-footer.webp"
                alt="Online Blinds"
                width={120}
                height={20}
                className="h-auto w-[120px]"
              />
            </Link>
            <p className="font-jost text-[13.5px] text-white/75 leading-relaxed">
              Premium custom blinds, manufactured in Yorkshire. 15+ years of expertise.
            </p>
            <div className="flex justify-center md:justify-start gap-3">
              <a href="https://www.facebook.com/OnlineBlindsExpressltd" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-all duration-200 hover:-translate-y-px hover:border-white/25 hover:bg-white/10 hover:text-white">
                <Image src="/icons/facebook.svg" alt="Facebook" width={16} height={16} className="filter brightness-0 invert opacity-80" />
              </a>
              <a href="https://www.instagram.com/online_blinds_express_ltd/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 transition-all duration-200 hover:-translate-y-px hover:border-white/25 hover:bg-white/10 hover:text-white">
                <Image src="/icons/instagram.svg" alt="Instagram" width={16} height={16} className="filter brightness-0 invert opacity-80" />
              </a>
            </div>
          </div>

          {/* Links — two columns */}
          <div className="flex justify-center md:justify-start gap-12 md:gap-16">
            <div className="flex flex-col gap-3">
              <p className="font-jost text-[11px] font-semibold tracking-[0.12em] uppercase text-primary mb-1">Shop</p>
              {['Blinds', 'Shades', 'Motorization', 'Blackout', 'Free Samples'].map((l) => (
                <Link key={l} href="/collections" className="font-jost text-[13.5px] text-white/70 hover:text-white transition-colors">{l}</Link>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <p className="font-jost text-[11px] font-semibold tracking-[0.12em] uppercase text-primary mb-1">Company</p>
              {[
                { label: 'About', href: '/about' },
                { label: 'Guides', href: '/guides' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Warranty', href: '/warranty' },
                { label: 'Contact', href: '#' },
                { label: 'Privacy', href: '/privacy-policy' },
                { label: 'Shipping', href: '/shipping-policy' },
                { label: 'Returns', href: '/refund-policy' },
                { label: 'Terms', href: '/terms-and-conditions' },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="font-jost text-[13.5px] text-white/70 hover:text-white transition-colors">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <p className="font-jost text-[11px] font-semibold tracking-[0.12em] uppercase text-primary mb-1">Contact</p>
            <a href="mailto:sales@onlineblindsexpress.co.uk" className="font-jost text-[13.5px] text-white/70 hover:text-white transition-colors">sales@onlineblindsexpress.co.uk</a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-4 md:flex-row md:px-8">
          <p className="font-jost text-[12px] text-white/55">© {new Date().getFullYear()} Online Blinds. All Rights Reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="font-jost text-[12px] text-white/55 transition-colors hover:text-white/90">Privacy Policy</Link>
            <Link href="/shipping-policy" className="font-jost text-[12px] text-white/55 transition-colors hover:text-white/90">Shipping</Link>
            <Link href="/refund-policy" className="font-jost text-[12px] text-white/55 transition-colors hover:text-white/90">Returns</Link>
            <Link href="/terms-and-conditions" className="font-jost text-[12px] text-white/55 transition-colors hover:text-white/90">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
