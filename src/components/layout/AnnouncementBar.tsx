'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight.getTime() - now.getTime()) / 1000);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

const COUPON = 'FINAL10';

const AnnouncementBar = () => {
  // null on server — populated after mount to avoid hydration mismatch
  const [seconds, setSeconds] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSeconds(getSecondsUntilMidnight());
    const interval = setInterval(() => {
      setSeconds(getSecondsUntilMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(COUPON).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const h = seconds !== null ? Math.floor(seconds / 3600) : 0;
  const m = seconds !== null ? Math.floor((seconds % 3600) / 60) : 0;
  const s = seconds !== null ? seconds % 60 : 0;

  return (
    <div className="relative z-50 bg-[#b91c1c] text-white">
      {/* Shimmer sweep */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-y-0 -left-full w-1/3 bg-linear-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3.5s_ease-in-out_infinite]" />
      </div>

      <div className="relative mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-8 py-2.5 text-center flex-wrap">

        {/* Tag icon + headline */}
        <span className="inline-flex items-center gap-1.5 text-[13px] font-black uppercase tracking-widest text-white">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M7 7h.01M7 3H5a2 2 0 00-2 2v2a2 2 0 00.586 1.414l9 9a2 2 0 002.828 0l4-4a2 2 0 000-2.828l-9-9A2 2 0 007 3z" />
          </svg>
          Up to 60% Off
        </span>

        <span className="text-white/50">|</span>

        {/* Code + copy button */}
        <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-white/90">
          Extra 10% Off with code
          <button
            onClick={handleCopy}
            title="Copy code"
            className="group inline-flex items-center gap-1 rounded border border-white/30 bg-white/15 px-2 py-0.5 font-black tracking-widest text-white transition-all hover:bg-white/25 active:scale-95"
          >
            {COUPON}
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
          {copied && (
            <span className="text-[11px] font-semibold text-green-300">Copied!</span>
          )}
        </span>

        <span className="text-white/50">|</span>
        <span className="text-[12.5px] font-medium text-white/90">Today Only</span>
        <span className="text-white/50">|</span>
        <span className="text-[12.5px] font-medium text-white/90">Whilst Stock Lasts</span>
        <span className="text-white/50">|</span>

        {/* Countdown — only rendered after mount to prevent hydration mismatch */}
        <span className="inline-flex items-center gap-1.5 text-[12.5px]">
          <svg className="h-3.5 w-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium text-white/80">Sale ends in</span>
          <span className="font-black tabular-nums text-white text-[13px]" suppressHydrationWarning>
            {seconds !== null ? `${pad(h)}:${pad(m)}:${pad(s)}` : '--:--:--'}
          </span>
        </span>

        <Link
          href="/collections"
          className="ml-1 rounded-full bg-white px-4 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#b91c1c] transition-all hover:bg-white/90 hover:scale-105"
        >
          Shop Now
        </Link>
      </div>
    </div>
  );
};

export default AnnouncementBar;
