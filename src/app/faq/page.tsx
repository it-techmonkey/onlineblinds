'use client';

import { useState } from 'react';
import { Header, Footer } from '@/components';
import Link from 'next/link';

const faqs = [
  {
    category: 'Orders & Delivery',
    items: [
      {
        q: 'Where is my order?',
        a: 'You can track your order using the tracking number sent to you by email once your parcel is dispatched. If you haven\'t received a tracking email, please check your spam folder or contact us at sales@onlineblindsexpress.co.uk.',
      },
      {
        q: 'What are your delivery times?',
        a: 'All blinds are made to your exact measurements, so they require manufacturing time before dispatch. Delivery is typically 7–12 working days from order date. Accurate dispatch times are shown against each product.',
      },
      {
        q: 'Do you deliver across the UK?',
        a: 'Yes — we deliver to all of mainland UK. We also deliver to Northern Ireland, Scottish Islands, Isle of Man, and Isle of Wight for an additional £9.95. Contact us for Channel Islands deliveries (VAT-free).',
      },
      {
        q: 'How much does delivery cost?',
        a: 'Free delivery on orders over £250. A standard charge of £9.95 applies to orders under £250. Remote area surcharges may apply for certain postcodes.',
      },
      {
        q: 'Will I be notified when my order is dispatched?',
        a: 'Yes. We\'ll send you an email with your tracking number and estimated delivery date as soon as your order leaves us.',
      },
      {
        q: 'What happens if I\'m not in when the delivery arrives?',
        a: 'The courier will leave a card with instructions to rearrange delivery at a more convenient time. Redelivery is free of charge.',
      },
      {
        q: 'My parcel arrived damaged — what do I do?',
        a: 'If the packaging looks damaged, write \'damaged\' on the delivery note before signing. Then email us at sales@onlineblindsexpress.co.uk within 3 working days with photos and your order details. We\'ll arrange a replacement.',
      },
    ],
  },
  {
    category: 'Measuring & Fitting',
    items: [
      {
        q: 'How do I measure my windows?',
        a: 'Visit our Guides page for step-by-step measuring instructions for each blind type. Measure twice to be sure — all our blinds are made to your exact dimensions and we cannot change them once production begins.',
      },
      {
        q: 'Should I measure inside or outside the recess?',
        a: 'This depends on the fitting method you choose. Inside-recess fittings sit within the window frame; face-fix fittings mount on the wall or frame above. Our measuring guides explain both methods with diagrams.',
      },
      {
        q: 'What tolerance should I allow?',
        a: 'Please allow for a manufacturing tolerance of ±4mm on all blinds, or up to ±6mm depending on fabric type. This is normal and does not affect fit or function.',
      },
      {
        q: 'Can I get free fabric samples before ordering?',
        a: 'Yes — order up to 10 free fabric samples to check colours and textures in your home before committing. Samples are delivered free of charge, usually within 1–2 working days.',
      },
    ],
  },
  {
    category: 'Products & Customisation',
    items: [
      {
        q: 'Are your blinds made to measure?',
        a: 'Every blind we sell is made to your exact specifications — width, height, colour, control type, and more. Nothing is off the shelf.',
      },
      {
        q: 'Can I order replacement slats for my vertical blinds?',
        a: 'Yes. We sell replacement vertical blind slats sized to your specification. Simply select the correct product from our collection and enter your slat dimensions at checkout.',
      },
      {
        q: 'Do you offer motorised blinds?',
        a: 'Yes — several of our ranges are available with motorisation. Look for the motorised filter in our collections, or select motorisation as an add-on during the customisation step on any eligible product.',
      },
      {
        q: 'What is the maximum size you can make?',
        a: 'Maximum dimensions vary by blind type and fabric. The available range is shown dynamically on each product page once you begin entering measurements. Contact us if you need an unusually large size.',
      },
    ],
  },
  {
    category: 'Returns & Warranty',
    items: [
      {
        q: 'What is your returns policy?',
        a: 'Because all blinds are custom made to your measurements, we cannot accept returns for change of mind. If your blind arrives with a manufacturing defect or transit damage, please report it within 3 working days and we will arrange a like-for-like replacement.',
      },
      {
        q: 'Can I cancel or change my order after placing it?',
        a: 'Once your order enters production it cannot be changed or cancelled. If you need to make a change, contact us immediately at sales@onlineblindsexpress.co.uk — we will do our best to help if production has not yet begun.',
      },
      {
        q: 'What warranty do you offer?',
        a: 'All our blinds come with a 5-year warranty against manufacturing defects. This covers mechanical components, fabric (excluding fading), and fixings. See our full Warranty page for details.',
      },
      {
        q: 'How do I make a warranty claim?',
        a: 'Email sales@onlineblindsexpress.co.uk with your order number and photos of the defect. We aim to respond within 1 working day and will arrange a replacement if the fault is confirmed.',
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
      >
        <span className="font-jost text-[15px] font-medium text-foreground">{q}</span>
        <span className="mt-0.5 shrink-0 text-primary">
          <svg
            className={`h-5 w-5 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="pb-5 font-jost text-[14px] leading-[1.8] text-muted">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-foreground py-14 md:py-20">
          <div className="mx-auto max-w-[1280px] px-6">
            <p className="font-jost text-[13px] font-medium uppercase tracking-[0.7px] text-white/60">
              Help
            </p>
            <h1 className="mt-2 font-display text-[32px] font-semibold leading-tight text-white md:text-[48px]">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 max-w-xl font-jost text-[15px] leading-relaxed text-white/60">
              Everything you need to know about ordering, measuring, delivery, and our warranty.
            </p>
          </div>
        </section>

        {/* FAQ sections */}
        <section className="mx-auto max-w-[860px] px-6 py-12 md:py-16">
          <div className="space-y-12">
            {faqs.map(({ category, items }) => (
              <div key={category}>
                <h2 className="mb-2 font-display text-[20px] font-semibold text-foreground md:text-[22px]">
                  {category}
                </h2>
                <div className="divide-y divide-border rounded-[16px] border border-border bg-surface px-5 md:px-6">
                  {items.map(({ q, a }) => (
                    <AccordionItem key={q} q={q} a={a} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-[20px] border border-border bg-surface p-7 text-center">
            <h2 className="font-display text-[20px] font-semibold text-foreground">
              Still have a question?
            </h2>
            <p className="mt-2 font-jost text-[14px] text-muted">
              Our team is happy to help — usually within 1 working day.
            </p>
            <Link
              href="mailto:sales@onlineblindsexpress.co.uk"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-[12px] bg-primary px-7 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-primary-dark"
            >
              Email Us
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
