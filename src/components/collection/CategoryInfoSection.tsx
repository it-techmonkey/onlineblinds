'use client';

import { useState } from 'react';
import categoryContent from '@/data/categoryContent';
import { NAVIGATION_SLUG_MAPPING, NAVIGATION_TAG_FILTERS } from '@/data/navigation';

interface CategoryInfoSectionProps {
  categorySlug: string;
  /** Product tag slugs — used on product pages to resolve the most specific content */
  productTags?: string[];
}

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

function AccordionRow({ item, isOpen, onToggle }: { item: AccordionItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_0_rgba(17,17,17,0.02)] transition-all duration-200 hover:shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-soft/80 md:px-6 md:py-5"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] font-semibold text-foreground md:text-[17px]">{item.title}</span>
        <span className={`ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-lg leading-none text-muted transition-all duration-200 ${isOpen ? 'border-primary/30 bg-primary-light text-primary' : ''}`}>
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <div className="border-t border-border px-5 pb-6 pt-4 text-sm leading-relaxed text-muted md:px-6">
          {item.content}
        </div>
      )}
    </div>
  );
}

/**
 * Given a backend category slug and the product's tag slugs, find the most
 * specific content key.  e.g. category "vertical-blinds" + tags ["blackout"]
 * → "blackout-vertical-blinds" content (if it exists).
 */
function resolveContentSlug(categorySlug: string, tags: string[]): string {
  // Build a list of candidate nav slugs that map to the same backend category
  const candidates: { slug: string; matchCount: number }[] = [];

  for (const [navSlug, requiredTags] of Object.entries(NAVIGATION_TAG_FILTERS)) {
    const backendSlug = NAVIGATION_SLUG_MAPPING[navSlug];
    if (backendSlug !== categorySlug) continue;

    // Check if the product has ALL tags required by this nav slug
    const allMatch = requiredTags.every(t => tags.includes(t));
    if (allMatch) {
      candidates.push({ slug: navSlug, matchCount: requiredTags.length });
    }
  }

  // Pick the most specific match (most tags matched)
  candidates.sort((a, b) => b.matchCount - a.matchCount);

  for (const c of candidates) {
    if (categoryContent[c.slug]) return c.slug;
  }

  return categorySlug;
}

export default function CategoryInfoSection({ categorySlug, productTags }: CategoryInfoSectionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  // On product pages productTags is provided — resolve the most specific content.
  // On collection pages the slug is already the nav slug — try it directly,
  // then fall back through the mapping.
  let resolvedSlug = categorySlug;
  if (productTags) {
    // Product page: category is a backend slug like "vertical-blinds"
    resolvedSlug = resolveContentSlug(categorySlug, productTags);
  }
  const content = categoryContent[resolvedSlug]
    ?? categoryContent[NAVIGATION_SLUG_MAPPING[resolvedSlug] ?? ''];

  const toggle = (id: string) => setOpenId(prev => (prev === id ? null : id));

  const items: AccordionItem[] = [];

  // --- Category-specific sections ---
  if (content) {
    items.push({
      id: 'product-details',
      title: 'Product Details',
      content: (
        <div className="space-y-4">
          {content.productDetails.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <div className="pt-1">
            <p className="mb-2 font-semibold text-foreground">Key Features</p>
            <ul className="space-y-1.5 list-none">
              {content.keyFeatures.map((feat, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ),
    });

    items.push({
      id: 'specifications',
      title: 'Specifications',
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {content.specifications.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-surface-soft' : 'bg-surface'}>
                  <td className="w-1/2 px-3 py-2.5 font-medium text-foreground">{row.label}</td>
                  <td className="px-3 py-2.5 text-muted">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    });

    items.push({
      id: 'perfect-for',
      title: 'Perfect For',
      content: (
        <ul className="space-y-1.5 list-none">
          {content.perfectFor.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ),
    });

    items.push({
      id: 'whats-in-the-box',
      title: "What's in the Box?",
      content: (
        <ul className="space-y-1.5 list-none">
          {content.whatsInTheBox.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ),
    });

    items.push({
      id: 'easy-maintenance',
      title: 'Easy Maintenance',
      content: (
        <div className="space-y-2">
          <p>Our blinds are designed to be low maintenance and easy to clean. To keep them looking their best:</p>
          <ul className="space-y-1.5 list-none mt-2">
            {content.easyMaintenance.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    });

    items.push({
      id: 'child-safety',
      title: 'Child Safety',
      content: (
        <div className="space-y-3">
          {content.childSafety.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ),
    });
  }

  const whyChooseFeatures = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      ),
      title: 'Custom Made to Measure',
      desc: 'Every blind is cut to your exact specifications for a perfect fit.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
      ),
      title: 'Built to Last',
      desc: 'Premium materials engineered for durability and long-term performance.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
      ),
      title: 'Modern Styles',
      desc: 'Contemporary designs that complement any interior, traditional or modern.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      ),
      title: 'Easy Installation',
      desc: 'Simple DIY setup with all hardware and guides included.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      ),
      title: 'Full Light Control',
      desc: 'Filter or block light precisely — from bright mornings to total blackout.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
      ),
      title: 'Dedicated Support',
      desc: 'Friendly experts ready to help before, during, and after your purchase.',
    },
  ];

  const warrantyYears = resolvedSlug === 'waterproof-blackout-vertical-blinds' ? 10 : 5;
  const overviewPoints = [
    `${warrantyYears}-year manufacturer coverage`,
    'Made-to-measure for a precise fit',
    'Guides and expert support included',
  ];

  return (
    <section className="border-t border-border bg-white">
      <div className="px-4 pt-10 md:px-6 md:pt-14 lg:px-20">
        <div className="mx-auto max-w-350 border-b border-border pb-8 md:pb-10">
          <div className="rounded-[20px] border border-border bg-[linear-gradient(180deg,#ffffff_0%,#f7fcfb_100%)] px-5 py-6 md:px-6 md:py-7">
            <div className="flex flex-col gap-6">
              <div className="max-w-215">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">Product Details</p>
                <h2 className="font-display text-[32px] font-semibold leading-[1.05] text-foreground md:text-[40px]">
                  Everything you need to know
                </h2>
                <p className="mt-4 text-sm leading-[1.8] text-muted md:text-[15px]">
                  Materials, specifications, care guidance, and support details for this product are collected below in one place.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {overviewPoints.map((point) => (
                  <div key={point} className="flex min-h-22 items-center rounded-[14px] border border-border bg-white px-5 py-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                    <p className="text-sm font-medium leading-relaxed text-foreground">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guarantee */}
      <div className="px-4 md:px-6 lg:px-20 pt-10 md:pt-12">
        <div className="mx-auto max-w-350 rounded-[20px] border border-border bg-white px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-primary">Warranty & Support</p>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] text-foreground md:text-4xl">
                {warrantyYears}-Year Manufacturer Guarantee
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
                Every blind is backed by manufacturer support. For assistance, contact{' '}
                <a href="mailto:enquiries@onlineblinds.com" className="font-semibold text-primary hover:underline">
                  enquiries@onlineblinds.com
                </a>
                . Photos may be required for claims processing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category-specific accordion */}
      {items.length > 0 && (
        <div className="px-4 md:px-6 lg:px-20 py-10 md:py-12">
          <div className="mx-auto max-w-350">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-primary">Product Knowledge</p>
                <h3 className="font-display text-[30px] font-semibold leading-none text-foreground md:text-[38px]">
                  Details & Specifications
                </h3>
              </div>
            </div>
            <div className="space-y-3">
              {items.map((item) => (
                <AccordionRow
                  key={item.id}
                  item={item}
                  isOpen={openId === item.id}
                  onToggle={() => toggle(item.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Why Choose */}
      <div className="px-4 md:px-6 lg:px-20 pb-10 md:pb-12">
        <div className="mx-auto max-w-350 rounded-[20px] border border-border bg-white p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-primary">Why Choose Us</p>
              <h2 className="font-display text-[30px] font-semibold leading-none text-foreground md:text-[38px]">Why Choose Online Blinds</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {whyChooseFeatures.map((feat, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                  {feat.icon}
                </div>
                <p className="mb-1.5 text-sm font-semibold text-foreground md:text-base">{feat.title}</p>
                <p className="text-xs leading-relaxed text-muted md:text-sm">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
