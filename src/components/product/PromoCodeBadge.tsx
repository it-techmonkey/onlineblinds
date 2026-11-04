'use client';

import { useState } from 'react';
import { BLACK_FRIDAY_PROMOTION, PROMO_COUPONS, findPromoCoupon } from '@/data/promotions';
import { usePromoCode } from '@/hooks/usePromoCode';
import { useBlackFridaySale } from '@/hooks/useBlackFridaySale';

// The code picked in the announcement bar, shown beside the product price.
// Click to copy.
const PromoCodeBadge = () => {
  const sale = useBlackFridaySale();
  const [code] = usePromoCode();
  const [copied, setCopied] = useState(false);
  const coupon = findPromoCoupon(code) ?? PROMO_COUPONS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Click to copy"
      className="group inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 self-center rounded-[8px] border border-border bg-surface-muted px-2.5 py-1 transition-colors hover:border-primary/30 hover:bg-primary-light"
    >
      {sale.active && <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">{BLACK_FRIDAY_PROMOTION.name} ·</span>}
      <span className="text-[11px] font-semibold text-primary">Extra {coupon.percentOff}% off</span>
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
  );
};

export default PromoCodeBadge;
