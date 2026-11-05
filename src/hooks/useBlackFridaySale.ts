'use client';

import { useSyncExternalStore } from 'react';
import { BLACK_FRIDAY_PROMOTION, formatSaleCountdown, getBlackFridaySeconds } from '@/data/promotions';

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 1000);
  return () => window.clearInterval(timer);
}

// A stable server snapshot keeps Next.js and the generated Shopify markup in sync
// with their first client render, including when a page is cached across expiry.
const getServerSnapshot = () => null;

export function useBlackFridaySale() {
  const seconds = useSyncExternalStore<number | null>(subscribe, getBlackFridaySeconds, getServerSnapshot);
  return {
    active: seconds === null || seconds > 0,
    finalDays: seconds !== null && seconds > 0 && seconds <= BLACK_FRIDAY_PROMOTION.finalDaysSeconds,
    seconds,
    countdown: seconds === null ? '--d --:--:--' : formatSaleCountdown(seconds),
  };
}
