'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const SALE_END = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

function useCountdown(target: Date) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, target.getTime() - Date.now());
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);

  return timeLeft;
}

const TimeBox = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className="rounded-[8px] bg-white/10 border border-white/12 w-[56px] h-[52px] flex items-center justify-center">
      <span className="font-display font-semibold text-[28px] leading-none text-white tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <span className="font-jost text-[10px] tracking-[0.1em] uppercase text-white/40">{label}</span>
  </div>
);

const FlashSale = () => {
  const { d, h, m, s } = useCountdown(SALE_END);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#141c24] via-[#1f2d3a] to-[#1a2530] py-20 px-6">
      {/* Noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px',
        }}
      />

      <div className="max-w-[1280px] mx-auto relative flex flex-col items-center gap-8">

        {/* Eyebrow */}
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-[#c9a96e] shrink-0" />
          <p className="font-jost font-medium text-[11px] tracking-[0.14em] uppercase text-[#c9a96e]">
            Limited Time Offer
          </p>
          <span className="h-px w-8 bg-[#c9a96e] shrink-0" />
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-3 items-center">
          <h2 className="font-display text-[52px] md:text-[64px] leading-[1.0] text-center font-semibold text-white tracking-[-0.02em]">
            Up to 50% Off
          </h2>
          <p className="font-jost text-[17px] leading-[28px] text-center font-normal text-white/60">
            Get an Extra 15% Off with Code{' '}
            <span className="inline-flex items-center gap-1 rounded-full border border-[#c9a96e]/60 bg-[#c9a96e]/10 px-3 py-0.5 font-semibold text-[#c9a96e] ml-1">
              SALE15
            </span>
          </p>
        </div>

        {/* Countdown */}
        <div className="flex items-start gap-3">
          <TimeBox value={d} label="Days" />
          <span className="font-display text-[28px] text-white/30 mt-3">:</span>
          <TimeBox value={h} label="Hours" />
          <span className="font-display text-[28px] text-white/30 mt-3">:</span>
          <TimeBox value={m} label="Mins" />
          <span className="font-display text-[28px] text-white/30 mt-3">:</span>
          <TimeBox value={s} label="Secs" />
        </div>

        {/* CTA */}
        <Link
          href="/collections"
          className="flex items-center gap-2.5 h-12 cursor-pointer rounded-[4.4px] bg-[#c9a96e] px-10 shadow-[0_4px_20px_rgba(201,169,110,0.35)] transition-all hover:bg-[#b8945a] hover:shadow-[0_6px_24px_rgba(201,169,110,0.45)] group"
        >
          <span className="font-jost text-[14px] font-semibold text-white tracking-wide">
            Shop the Sale
          </span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

      </div>
    </section>
  );
};

export default FlashSale;
