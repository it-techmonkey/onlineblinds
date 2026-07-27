'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatPriceWithCurrency } from '@/lib/api';
import { INSTALLATION_SERVICE_PRICING_TIERS } from '@/lib/pricing';

interface InstallationServiceInfoProps {
  currency?: string;
}

const POPOVER_WIDTH = 220;
const GUTTER = 12;
const CLOSE_DELAY_MS = 120;

const InstallationServiceInfo = ({ currency }: InstallationServiceInfoProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openNow = () => {
    clearCloseTimer();
    setIsOpen(true);
  };

  const closeSoon = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setIsOpen(false), CLOSE_DELAY_MS);
  };

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const left = Math.min(rect.left, viewportWidth - POPOVER_WIDTH - GUTTER);
      setPosition({ top: rect.bottom + 8, left: Math.max(GUTTER, left) });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      const popover = document.getElementById('installation-service-info-popover');
      if (popover?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        onFocus={openNow}
        onBlur={closeSoon}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen((open) => !open);
        }}
        aria-label="Installation service pricing tiers"
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-semibold text-muted hover:border-border-strong hover:text-foreground"
      >
        i
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          id="installation-service-info-popover"
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          className="fixed rounded-[12px] border border-border bg-white p-3 shadow-xl"
          style={{ zIndex: 9999, top: position.top, left: position.left, width: POPOVER_WIDTH }}
        >
          <p className="mb-2 text-xs font-semibold text-foreground">Installation pricing</p>
          <ul className="space-y-1 text-xs text-muted">
            {INSTALLATION_SERVICE_PRICING_TIERS.map((tier) => (
              <li key={tier.label} className="flex justify-between">
                <span>{tier.label}</span>
                <span className="font-medium text-foreground">
                  {formatPriceWithCurrency(tier.price, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </>
  );
};

export default InstallationServiceInfo;
