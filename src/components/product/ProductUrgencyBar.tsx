'use client';

import { useState, useEffect, useRef } from 'react';

function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function seededViewers(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) & 0xffffffff;
  }
  return 12 + (Math.abs(hash) % 17); // 12–28
}

const COUPON = 'FINAL10';

interface ProductUrgencyBarProps {
  productSlug: string;
}

const ProductUrgencyBar = ({ productSlug }: ProductUrgencyBarProps) => {
  const [seconds, setSeconds] = useState(getSecondsUntilMidnight);
  const [viewers, setViewers] = useState(() => seededViewers(productSlug));
  const [copied, setCopied] = useState(false);
  const biasRef = useRef(0);

  useEffect(() => {
    const tick = setInterval(() => setSeconds(getSecondsUntilMidnight()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const schedule = () => {
      const delay = 18000 + Math.random() * 27000;
      return setTimeout(() => {
        setViewers((v) => {
          biasRef.current = v < 14 ? 0.7 : v > 24 ? 0.3 : 0.5;
          const goUp = Math.random() < biasRef.current;
          return Math.max(10, Math.min(32, v + (goUp ? 1 : -1)));
        });
        timerRef.current = schedule();
      }, delay);
    };
    const timerRef: { current: ReturnType<typeof setTimeout> | null } = { current: null };
    timerRef.current = schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(COUPON).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return (
    <div className="flex flex-col gap-2.5">

      {/* Countdown + code */}
      <div className="flex items-center gap-4 rounded-[12px] border border-border bg-surface px-4 py-3 shadow-[0_2px_8px_rgba(31,41,51,0.05)]">
        {/* Clock icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
          <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[13px] font-medium text-foreground">
            Sale ends in{' '}
            <span className="font-black tabular-nums text-red-600">
              {pad(h)}:{pad(m)}:{pad(s)}
            </span>
          </span>
          <span className="text-muted">·</span>
          <span className="text-[13px] text-muted">Use code</span>

          {/* Copyable code pill */}
          <button
            onClick={handleCopy}
            title="Click to copy"
            className="group inline-flex items-center gap-1.5 rounded-[7px] border border-dashed border-red-300 bg-red-50 px-2.5 py-0.5 transition-all hover:border-red-400 hover:bg-red-100 active:scale-95"
          >
            <span className="font-black tracking-widest text-red-700 text-[12px]">{COUPON}</span>
            <span className="text-red-400 transition-colors group-hover:text-red-600">
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
          </button>

          {copied && (
            <span className="text-[11px] font-semibold text-green-600">Copied!</span>
          )}
        </div>
      </div>

      {/* Viewers */}
      <div className="flex items-center gap-4 rounded-[12px] border border-border bg-surface px-4 py-3 shadow-[0_2px_8px_rgba(31,41,51,0.05)]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-soft">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
        </div>
        <span className="text-[13px] font-medium text-foreground">
          <span className="font-bold">{viewers} people</span>
          <span className="text-muted"> are viewing this product right now</span>
        </span>
      </div>

    </div>
  );
};

export default ProductUrgencyBar;
