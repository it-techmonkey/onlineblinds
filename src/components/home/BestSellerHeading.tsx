'use client';

import Link from 'next/link';
import { useBlackFridaySale } from '@/hooks/useBlackFridaySale';

export default function BestSellerHeading() {
  const sale = useBlackFridaySale();

  return (
    <div className="mb-8 flex flex-col items-start justify-between gap-5 md:mb-12 md:flex-row md:items-end">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="block h-0.5 w-6 rounded-full bg-primary" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {sale.active ? 'Black Friday favourites' : 'Bestsellers'}
          </p>
        </div>
        <h2 className="font-display text-[30px] font-semibold leading-[1.1] tracking-tight text-foreground md:text-[40px]">
          {sale.active ? 'Shop Black Friday Bestsellers' : 'Best Selling Products'}
        </h2>
        {sale.active && <p className="text-[14px] leading-relaxed text-muted">Popular picks. Made to measure. Priced for Black Friday.</p>}
      </div>
      <Link href="/collections" className="inline-flex shrink-0 items-center gap-2 text-[13px] font-semibold text-primary transition-colors hover:text-primary-dark">
        {sale.active ? 'Shop all Black Friday offers' : 'View all'}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
