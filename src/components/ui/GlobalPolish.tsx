'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const STAGGER_STEP_MS = 70;
const STAGGER_MAX_MS = 420;

function isHTMLElement(node: Element): node is HTMLElement {
  return node instanceof HTMLElement;
}

function collectRevealTargets(main: HTMLElement): HTMLElement[] {
  const directChildren = Array.from(main.children).filter(isHTMLElement);
  const sectionChildren = Array.from(
    main.querySelectorAll(':scope > section, :scope > div > section')
  ).filter(isHTMLElement);

  const merged = [...directChildren, ...sectionChildren];
  const deduped = Array.from(new Set(merged));

  return deduped.filter((el) => el.dataset.polishReveal === 'false' ? false : true);
}

export default function GlobalPolish() {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.querySelector('main');
    if (!main || !(main instanceof HTMLElement)) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = new WeakSet<HTMLElement>();

    const reveal = (el: HTMLElement) => {
      el.classList.add('polish-visible');
    };

    let revealIndex = 0;

    const observer = prefersReducedMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) return;
              reveal(entry.target);
              observer?.unobserve(entry.target);
            });
          },
          {
            threshold: 0.14,
            rootMargin: '0px 0px -8% 0px',
          }
        );

    const registerTargets = () => {
      const targets = collectRevealTargets(main);

      targets.forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);

        el.classList.add('polish-reveal');
        el.style.setProperty(
          '--polish-delay',
          `${Math.min(revealIndex * STAGGER_STEP_MS, STAGGER_MAX_MS)}ms`
        );
        revealIndex += 1;

        if (prefersReducedMotion) {
          reveal(el);
          return;
        }

        observer?.observe(el);
      });
    };

    registerTargets();

    const mutationObserver = new MutationObserver(registerTargets);
    mutationObserver.observe(main, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
