'use client';

import { useState } from 'react';
import { BLACK_FRIDAY_PROMOTION, PROMO_COUPONS, findPromoCoupon, getPromoPrice } from '@/data/promotions';
import { formatPriceWithCurrency } from '@/lib/api';
import { usePromoCode } from '@/hooks/usePromoCode';
import { useBlackFridaySale } from '@/hooks/useBlackFridaySale';

// The code picked in the announcement bar, shown beside the product price.
// Click to copy.
const PromoCodeBadge = ({ price, currency = 'GBP', from = false }: { price?: number; currency?: string; from?: boolean }) => {
  const sale = useBlackFridaySale();
  const [code] = usePromoCode();
  const [copied, setCopied] = useState(false);
  const coupon = findPromoCoupon(code) ?? PROMO_COUPONS[0];
  const codePrice = sale.active && typeof price === 'number' && Number.isFinite(price) && price > 0
    ? getPromoPrice(price, coupon.percentOff)
    : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={codePrice !== null ? 'w-full border-t border-border pt-3' : 'self-center'}>
      <button
        type="button"
        onClick={handleCopy}
        title="Click to copy"
        data-promo-price={codePrice ?? undefined}
        className={`group inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-lg border px-3 transition-colors hover:border-primary/30 hover:bg-primary-light ${codePrice !== null ? 'w-full border-primary/10 bg-primary-light py-2.5 lg:justify-start' : 'border-border bg-surface-muted py-1'}`}
      >
        {codePrice !== null ? <>
          <span className="text-[20px] font-semibold leading-tight text-primary">{from ? 'From ' : ''}{formatPriceWithCurrency(codePrice, currency)}</span>
          <span className="text-[12px] text-muted">with code</span>
        </> : <>
          {sale.active && <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{BLACK_FRIDAY_PROMOTION.name} ·</span>}
          <span className="text-[11px] font-semibold text-primary">Extra {coupon.percentOff}% off</span>
        </>}
        <span className="text-[12px] font-bold tracking-wider text-foreground">{coupon.code}</span>
        <span className="text-muted transition-colors group-hover:text-primary">
          {copied ? (
            <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </span>
        <span className="sr-only">{copied ? 'Copied' : 'Copy code'}</span>
      </button>
      {codePrice !== null && <p className="mt-1.5 text-center text-[11px] text-muted lg:text-left">An extra {coupon.percentOff}% off your blind with this code.</p>}
    </div>
  );
};

export default PromoCodeBadge;
