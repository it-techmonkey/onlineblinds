import { useCallback, useSyncExternalStore } from 'react';
import { DEFAULT_PROMO_CODE, findPromoCoupon } from '@/data/promotions';

// The promo code the visitor picked in the announcement bar. Stored in the
// browser so the bar, product page and cart all show the same code.
const STORAGE_KEY = 'ob-promo-code';
const CHANGE_EVENT = 'ob:promo-code';
// Used when the browser blocks storage, so the choice still lasts for this page.
let memoryCode: string | null = null;

export function readPromoCode(): string {
  if (typeof window === 'undefined') return DEFAULT_PROMO_CODE;
  try {
    return findPromoCoupon(window.localStorage.getItem(STORAGE_KEY))?.code ?? DEFAULT_PROMO_CODE;
  } catch {
    return memoryCode ?? DEFAULT_PROMO_CODE;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function usePromoCode(): [string, (code: string) => void] {
  // The server and the first client render use the default, so hydration matches.
  const code = useSyncExternalStore(subscribe, readPromoCode, () => DEFAULT_PROMO_CODE);

  const setCode = useCallback((next: string) => {
    const coupon = findPromoCoupon(next);
    if (!coupon) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, coupon.code);
    } catch {
      memoryCode = coupon.code;
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [code, setCode];
}
