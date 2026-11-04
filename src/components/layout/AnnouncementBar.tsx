'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BLACK_FRIDAY_PROMOTION, PROMO_COUPONS, findPromoCoupon } from '@/data/promotions';
import { usePromoCode } from '@/hooks/usePromoCode';
import { useBlackFridaySale } from '@/hooks/useBlackFridaySale';

const AnnouncementBar = () => {
  const sale = useBlackFridaySale();
  const [copied, setCopied] = useState(false);
  const [code, setCode] = usePromoCode();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLSpanElement>(null);
  const coupon = findPromoCoupon(code) ?? PROMO_COUPONS[0];

  // Close the code list on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative z-[60] border-b border-white/10 bg-[#191919] text-white">
      <div className="relative mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1.5 px-3 py-2 text-center md:flex md:flex-wrap md:justify-center md:gap-x-3 md:px-8 md:py-2.5">

        {/* Tag icon + headline */}
        <span className="col-start-1 row-start-1 inline-flex items-center gap-1 whitespace-nowrap text-[10.5px] font-bold uppercase tracking-wide text-white md:gap-1.5 md:text-[12px] md:tracking-widest">
          <svg className="hidden h-3.5 w-3.5 shrink-0 text-red-300 sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M7 7h.01M7 3H5a2 2 0 00-2 2v2a2 2 0 00.586 1.414l9 9a2 2 0 002.828 0l4-4a2 2 0 000-2.828l-9-9A2 2 0 007 3z" />
          </svg>
          {sale.active && <span>{BLACK_FRIDAY_PROMOTION.name}<span className="mx-2 text-white/30">·</span></span>}
          <span>{BLACK_FRIDAY_PROMOTION.headline}</span>
        </span>

        <span className="hidden text-white/30 md:inline">|</span>

        {/* Code (click to copy) + list of codes to choose from */}
        <span className="col-start-1 row-start-2 inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-white/90">
          <span className="text-[10.5px] md:text-[12.5px]">Extra {coupon.percentOff}% off<span className="hidden lg:inline"> with code</span></span>
          <span ref={menuRef} className="relative inline-flex">
            <span className="inline-flex items-stretch overflow-hidden rounded border border-white/20 bg-white/8">
              <button
                type="button"
                onClick={handleCopy}
                title="Copy code"
                className="group inline-flex items-center gap-1 px-1.5 py-0.5 text-[10.5px] font-black tracking-wide text-white transition-all hover:bg-white/25 active:scale-95 md:px-2 md:text-[13px] md:tracking-widest"
              >
                {coupon.code}
                <span className="text-white/60 transition-colors group-hover:text-white">
                  {copied ? (
                    <svg className="h-3 w-3 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
                aria-label="Choose a discount code"
                title="More codes"
                className="inline-flex items-center border-l border-white/30 px-1 text-white/80 transition-colors hover:bg-white/25 hover:text-white md:px-1.5"
              >
                <svg className={`h-3 w-3 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </span>

            {menuOpen && (
              <ul
                role="listbox"
                aria-label="Discount codes"
                className="absolute left-1/2 top-full z-[60] mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-lg border border-border bg-white py-1 text-left shadow-lg"
              >
                {PROMO_COUPONS.map((option) => {
                  const selected = option.code === coupon.code;
                  return (
                    <li key={option.code} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        onClick={() => {
                          setCode(option.code);
                          setMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-red-50 ${selected ? 'bg-red-50' : ''}`}
                      >
                        <span className="min-w-0">
                          <span className="block text-[13px] font-black tracking-wider text-[#b91c1c]">{option.code}</span>
                          <span className="block text-[11.5px] font-medium text-muted">
                            {option.label} · {option.percentOff}% off entire order
                          </span>
                        </span>
                        {selected && (
                          <svg className="h-4 w-4 shrink-0 text-[#b91c1c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </span>
          {copied && (
            <span role="status" className="sr-only">Copied!</span>
          )}
        </span>

        {/* The same UK deadline is used on product pages. */}
        {sale.active && <span className="col-start-2 row-start-2 inline-flex items-center justify-end gap-1.5 whitespace-nowrap text-[10px] md:text-[12px]" title={BLACK_FRIDAY_PROMOTION.deadlineLabel}>
          <svg className="hidden h-3.5 w-3.5 text-white/70 sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="hidden font-medium text-white/60 sm:inline">Ends in</span>
          <span className="font-semibold tabular-nums text-white">{sale.countdown}</span>
        </span>}

        <Link
          href="/collections"
          className="col-start-2 row-start-1 ml-0.5 shrink-0 whitespace-nowrap rounded bg-white px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.05em] text-[#191919] transition-colors hover:bg-white/90 md:ml-1 md:px-3 md:text-[10px]"
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
