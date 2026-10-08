import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '@/components';
import { business, businessAddressLines, businessPhoneHref } from '@/data/business';

export const metadata: Metadata = {
  title: 'Contact Us | Online Blinds Express',
  description:
    'Get in touch with Online Blinds Express. Find our email address, business address, and where to get help with orders, delivery, returns, and warranty claims.',
};

const helpLinks = [
  { label: 'Shipping Policy', description: 'Delivery times, costs, and tracking.', href: '/shipping-policy' },
  { label: 'Returns & Refunds', description: 'Damaged goods, faults, and refunds.', href: '/refund-policy' },
  { label: 'Warranty', description: 'What our 5-year warranty covers.', href: '/warranty' },
  { label: 'FAQ', description: 'Answers to common questions.', href: '/faq' },
];

const companyDetails = [
  { label: 'Registered company', value: business.legalName },
  { label: 'Company number', value: business.companyNumber },
  { label: 'VAT number', value: business.vatNumber },
].filter((detail) => detail.value);

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-foreground py-14 md:py-20">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="font-jost text-[13px] font-medium uppercase tracking-[0.7px] text-white/60">
              Get in touch
            </p>
            <h1 className="mt-2 font-display text-[32px] font-semibold leading-tight text-white md:text-[48px]">
              Contact Us
            </h1>
          </div>
        </section>

        {/* Intro */}
        <section className="mx-auto max-w-[860px] px-6 pt-10 pb-4">
          <p className="font-jost text-[15px] leading-[1.75] text-muted">
            Have a question about an order, measuring, delivery, or a warranty claim? Contact {business.tradingName} using
            the details below. We aim to respond within <strong>{business.responseTime}</strong>.
          </p>
        </section>

        {/* Contact details */}
        <section className="mx-auto max-w-[860px] px-6 pb-6 pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-[16px] border border-border bg-surface p-5 md:p-6">
              <h2 className="mb-3 font-display text-[18px] font-semibold text-foreground">Email</h2>
              <a
                href={`mailto:${business.email}`}
                className="font-jost text-[15px] text-primary underline hover:text-primary/80 break-all"
              >
                {business.email}
              </a>
              <p className="mt-3 font-jost text-[14px] leading-relaxed text-muted">
                Please include your order number if you are contacting us about an existing order.
              </p>
            </div>

            {business.phone && (
              <div className="rounded-[16px] border border-border bg-surface p-5 md:p-6">
                <h2 className="mb-3 font-display text-[18px] font-semibold text-foreground">Phone</h2>
                <a href={businessPhoneHref} className="font-jost text-[15px] text-primary underline hover:text-primary/80">
                  {business.phone}
                </a>
                {business.hours && (
                  <p className="mt-3 font-jost text-[14px] leading-relaxed text-muted">{business.hours}</p>
                )}
              </div>
            )}

            <div className="rounded-[16px] border border-border bg-surface p-5 md:p-6">
              <h2 className="mb-3 font-display text-[18px] font-semibold text-foreground">Address</h2>
              <address className="font-jost text-[15px] not-italic leading-[1.75] text-muted">
                {business.legalName || business.tradingName}
                {businessAddressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </div>

            {!business.phone && business.hours && (
              <div className="rounded-[16px] border border-border bg-surface p-5 md:p-6">
                <h2 className="mb-3 font-display text-[18px] font-semibold text-foreground">Opening Hours</h2>
                <p className="font-jost text-[15px] leading-[1.75] text-muted">{business.hours}</p>
              </div>
            )}

            {companyDetails.length > 0 && (
              <div className="rounded-[16px] border border-border bg-surface p-5 md:p-6">
                <h2 className="mb-3 font-display text-[18px] font-semibold text-foreground">Company Details</h2>
                <dl className="font-jost text-[15px] leading-[1.75] text-muted">
                  {companyDetails.map((detail) => (
                    <div key={detail.label}>
                      <dt className="inline">{detail.label}: </dt>
                      <dd className="inline text-foreground">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>

        {/* Help links */}
        <section className="mx-auto max-w-[860px] px-6 pb-16 pt-6">
          <h2 className="mb-4 font-display text-[20px] font-semibold text-foreground md:text-[22px]">
            Looking for something specific?
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {helpLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[16px] border border-border bg-surface p-5 transition-colors hover:border-primary"
              >
                <p className="font-jost text-[15px] font-semibold text-foreground">{link.label}</p>
                <p className="mt-1 font-jost text-[14px] leading-relaxed text-muted">{link.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
