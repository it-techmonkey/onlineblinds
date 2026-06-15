import type { Metadata } from 'next';
import { Header, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'Shipping Policy | Online Blinds Express',
  description: 'Learn how Online Blinds Express processes and delivers made-to-measure blind orders.',
};

const sections = [
  {
    heading: 'Order Processing',
    content: (
      <p>
        All blinds are made to measure. Manufacturing typically takes <strong>3–5 working days</strong> before dispatch.
        Once dispatched, your blinds are usually with you within <strong>2–3 working days</strong>, making the total
        delivery window approximately <strong>7–12 working days</strong> from order date. This timeframe may vary during
        busy periods or for large orders.
      </p>
    ),
  },
  {
    heading: 'Shipping Costs',
    content: (
      <>
        <p>
          <strong>Free delivery</strong> on all orders over <strong>£250</strong> to UK mainland addresses.
        </p>
        <p>
          A standard charge of <strong>£9.95</strong> applies to orders under £250.
        </p>
        <p>
          Remote area surcharge of <strong>+£9.95</strong> applies to Northern Ireland, Scottish Islands, Isle of Man,
          and Isle of Wight. Contact us for Channel Islands deliveries (VAT-free).
        </p>
      </>
    ),
  },
  {
    heading: 'Delivery Tracking',
    content: (
      <p>
        As soon as your order is dispatched, we&apos;ll send you an email with a <strong>tracking number and link</strong>{' '}
        so you can follow your delivery all the way to your door. If you haven&apos;t received a dispatch email, please
        check your spam folder or contact us.
      </p>
    ),
  },
  {
    heading: 'Delivery Address',
    content: (
      <p>
        Please make sure your delivery address is complete and accurate before placing your order. We are not responsible
        for delays, failed deliveries, or additional charges caused by incorrect or incomplete delivery details supplied
        at checkout.
      </p>
    ),
  },
  {
    heading: 'Receipt of Goods',
    content: (
      <p>
        Deliveries may require a signature depending on the courier service used. If the packaging appears damaged on
        arrival, please sign for the item as damaged where possible and notify us immediately.
      </p>
    ),
  },
  {
    heading: 'Damaged or Missing Items',
    content: (
      <p>
        Any damage, missing items, or manufacturing defects must be reported by email to{' '}
        <a href="mailto:sales@onlineblindsexpress.co.uk">sales@onlineblindsexpress.co.uk</a> within{' '}
        <strong>3 working days</strong> of delivery. Please do not install or fit a blind if it appears damaged, as we
        may require photographs or the return of the item for inspection.
      </p>
    ),
  },
  {
    heading: 'Failed Delivery',
    content: (
      <p>
        Multiple unsuccessful delivery attempts may result in re-delivery charges. Items returned to us by the courier
        will be held for <strong>4 weeks</strong> before disposal.
      </p>
    ),
  },
  {
    heading: 'Delays Outside Our Control',
    content: (
      <p>
        We are not liable for delivery delays caused by couriers, severe weather, customs or border checks, supply chain
        disruption, incorrect address details, or other events outside our reasonable control.
      </p>
    ),
  },
  {
    heading: 'Contact',
    content: (
      <>
        <p>
          For shipping questions, please email{' '}
          <a href="mailto:sales@onlineblindsexpress.co.uk">sales@onlineblindsexpress.co.uk</a>.
        </p>
        <p>
          Response time: <strong>1-3 working days</strong>.
        </p>
      </>
    ),
  },
];

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-foreground py-14 md:py-20">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="font-jost text-[13px] font-medium uppercase tracking-[0.7px] text-white/60">
              Legal
            </p>
            <h1 className="mt-2 font-display text-[32px] font-semibold leading-tight text-white md:text-[48px]">
              Shipping Policy
            </h1>
          </div>
        </section>

        {/* Intro */}
        <section className="mx-auto max-w-[860px] px-6 pt-10 pb-4">
          <p className="font-jost text-[15px] leading-[1.75] text-muted">
            This Shipping Policy explains how Online Blinds Express processes and delivers made-to-measure blind orders.
            Because each blind is custom manufactured, dispatch takes place after production is complete.
          </p>
        </section>

        {/* Sections */}
        <section className="mx-auto max-w-[860px] px-6 pb-16 pt-4">
          <div className="divide-y divide-border">
            {sections.map((section) => (
              <div key={section.heading} className="py-8">
                <h2 className="mb-4 font-display text-[20px] font-semibold text-foreground md:text-[22px]">
                  {section.heading}
                </h2>
                <div className="font-jost text-[15px] leading-[1.75] text-muted [&_a]:text-primary [&_a]:underline [&_a:hover]:text-primary/80 [&_p+p]:mt-3">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
