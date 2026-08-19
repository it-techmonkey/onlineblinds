'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface StickyAddToCartBarProps {
  productName: string;
  price: string;
  compareAtPrice: string;
  onAddToCart: () => void;
  addToCartLabel: string;
  addToCartDisabled: boolean;
  onBuyNow: () => void;
  buyNowLabel: string;
  buyNowDisabled: boolean;
  buyNowLoading?: boolean;
}

const StickyAddToCartBar = ({
  price,
  compareAtPrice,
  onAddToCart,
  addToCartLabel,
  addToCartDisabled,
  onBuyNow,
  buyNowLabel,
  buyNowDisabled,
  buyNowLoading = false,
}: StickyAddToCartBarProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur-sm shadow-[0_-8px_24px_rgba(31,41,51,0.08)]">
      <div className="max-w-[1320px] mx-auto px-3 md:px-6 lg:px-16 py-2.5 md:py-4">
        <div className="flex items-center gap-2 md:gap-6">
          <div className="flex items-baseline gap-1.5 md:gap-2 min-w-0 flex-1">
            <span className="text-base md:text-2xl font-semibold text-foreground truncate">{price}</span>
            <span className="hidden sm:inline text-sm text-muted line-through whitespace-nowrap shrink-0">{compareAtPrice}</span>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3 shrink-0 justify-end">
            <button
              onClick={onBuyNow}
              disabled={buyNowDisabled}
              className={`shrink-0 flex items-center justify-center gap-1.5 py-2.5 md:py-2.5 px-4 md:px-6 rounded-[10px] md:rounded-[12px] text-sm md:text-base font-medium transition-all whitespace-nowrap border ${
                buyNowDisabled
                  ? 'border-border bg-surface-soft text-muted cursor-not-allowed'
                  : 'border-primary text-primary bg-white hover:bg-surface-soft'
              }`}
            >
              {buyNowLoading && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {buyNowLabel}
            </button>

            <button
              onClick={onAddToCart}
              disabled={addToCartDisabled}
              data-gtm="add-to-cart"
              data-gtm-location="sticky-bar"
              className={`shrink-0 py-2.5 md:py-2.5 px-4 md:px-6 rounded-[10px] md:rounded-[12px] text-sm md:text-base font-medium transition-all whitespace-nowrap ${
                addToCartDisabled
                  ? 'bg-[#98a4bb] text-white cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark shadow-[0_6px_14px_rgba(68,87,102,0.24)]'
              }`}
            >
              {addToCartLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StickyAddToCartBar;
