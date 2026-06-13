import type { Metadata } from 'next';
import { Header, Footer } from '@/components';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '5 Year Warranty | Online Blinds Express',
  description: 'Online Blinds Express offers an unrivalled 5-year warranty on all made-to-measure blinds. Find out what is covered and how to make a claim.',
};

const covered = [
  'Brackets & fixings',
  'Roller mechanisms',
  'Top tube & bottom bar',
  'Venetian pulls & wands',
  'Slats & fabric (excluding fading)',
  'Roller chains & chain links',
  'Motor & remote control',
  'Cassette & internal parts',
  'Strings, tapes & cords',
];

const excluded = [
  'Improper use outside normal wear and tear',
  'Fabric fading from sunlight or abrasive cleaning',
  'Accidental damage — marks, spills, scratches',
  'Water damage on non-waterproof products',
  'Heat warping on non-conservatory-rated products',
  'Alterations, shortening, or customer modifications',
  'Installation failures where guidelines were not followed',
  'Non-residential / commercial use',
  'Loss or theft after delivery',
];

export default function WarrantyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-foreground py-14 md:py-20">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="font-jost text-[13px] font-medium uppercase tracking-[0.7px] text-white/60">
              Guarantee
            </p>
            <h1 className="mt-2 font-display text-[32px] font-semibold leading-tight text-white md:text-[48px]">
              5 Year Warranty
            </h1>
            <p className="mt-4 max-w-xl font-jost text-[15px] leading-relaxed text-white/60">
              Every blind we make is backed by an unrivalled 5-year warranty against manufacturing defects — because we stand behind the quality of our craftsmanship.
            </p>
          </div>
        </section>

        {/* Core guarantee */}
        <section className="mx-auto max-w-[860px] px-6 pt-12 pb-8">
          <div className="rounded-[20px] border border-primary/20 bg-primary/5 p-6 md:p-8">
            <h2 className="font-display text-[22px] font-semibold text-foreground md:text-[26px]">
              Our Promise
            </h2>
            <p className="mt-3 font-jost text-[15px] leading-[1.8] text-muted">
              If your blind develops a fault due to a manufacturing defect at any point within 5 years of purchase, we will resolve the issue by <strong className="text-foreground">replacing it free of charge</strong>. No quibbles, no hidden costs.
            </p>
            <p className="mt-3 font-jost text-[14px] text-muted">
              Proof of purchase is required for all warranty claims.
            </p>
          </div>
        </section>

        {/* Coverage grid */}
        <section className="mx-auto max-w-[860px] px-6 pb-10">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Covered */}
            <div>
              <h2 className="mb-4 font-display text-[20px] font-semibold text-foreground">
                What&apos;s Covered
              </h2>
              <ul className="space-y-2.5">
                {covered.map((item) => (
                  <li key={item} className="flex items-start gap-3 font-jost text-[14px] text-muted">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Excluded */}
            <div>
              <h2 className="mb-4 font-display text-[20px] font-semibold text-foreground">
                What&apos;s Not Covered
              </h2>
              <ul className="space-y-2.5">
                {excluded.map((item) => (
                  <li key={item} className="flex items-start gap-3 font-jost text-[14px] text-muted">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* How to claim */}
        <section className="mx-auto max-w-[860px] px-6 pb-10">
          <h2 className="mb-6 font-display text-[22px] font-semibold text-foreground md:text-[26px]">
            How to Make a Claim
          </h2>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Contact us', body: 'Email sales@onlineblindsexpress.co.uk with your order number and a description of the issue. We aim to respond within 1 working day.' },
              { step: '2', title: 'Send photos', body: 'We may ask for photographs of the defect so we can assess the issue quickly without requiring a return.' },
              { step: '3', title: 'We resolve it', body: 'Once confirmed, we will arrange a like-for-like replacement at no cost to you. If your exact blind is discontinued, we will offer a comparable alternative.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-4 rounded-[16px] border border-border bg-surface p-5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white">
                  {step}
                </div>
                <div>
                  <h3 className="font-jost text-[15px] font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 font-jost text-[14px] leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Replacements note */}
        <section className="mx-auto max-w-[860px] px-6 pb-16">
          <div className="rounded-[16px] border border-border bg-surface p-5 md:p-6">
            <h2 className="mb-3 font-display text-[18px] font-semibold text-foreground">
              Replacements
            </h2>
            <p className="font-jost text-[14px] leading-relaxed text-muted">
              Warranty replacements are like-for-like only — we cannot change measurements, colours, or specifications as part of a claim. If your specific blind is no longer available, we will offer the nearest equivalent. There is no cash alternative.
            </p>
            <p className="mt-3 font-jost text-[14px] leading-relaxed text-muted">
              This warranty does not affect your statutory rights under applicable consumer protection laws.
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="font-jost text-[14px] text-muted mb-4">Still have questions about your warranty?</p>
            <Link
              href="mailto:sales@onlineblindsexpress.co.uk"
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-primary px-6 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-primary-dark"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
