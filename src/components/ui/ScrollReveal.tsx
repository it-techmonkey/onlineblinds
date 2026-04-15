'use client';

import type * as React from 'react';
import { useLayoutEffect, useRef } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: keyof React.JSX.IntrinsicElements;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  as: Tag = 'div',
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      el.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -6% 0px',
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const AnyTag = Tag as React.ElementType;
  return (
    <AnyTag
      ref={ref}
      className={`${className}`}
      data-reveal
      data-delay={delay || undefined}
    >
      {children}
    </AnyTag>
  );
}
