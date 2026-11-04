'use client';

import { useState, useEffect, useRef } from 'react';

function seededViewers(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) & 0xffffffff;
  }
  return 12 + (Math.abs(hash) % 17); // 12–28
}

interface ProductUrgencyBarProps {
  productSlug: string;
}

const ProductUrgencyBar = ({ productSlug }: ProductUrgencyBarProps) => {
  const [viewers, setViewers] = useState(() => seededViewers(productSlug));
  const biasRef = useRef(0);

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

  return (
    <div className="flex flex-col gap-2.5">

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
