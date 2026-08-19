"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { trackPageView, trackScrollDepth } from "@/lib/gtm";

/** Milestones pushed as `scroll_depth`, matching GTM's built-in defaults. */
const SCROLL_MILESTONES = [25, 50, 75, 90] as const;

/**
 * Emits GTM events that a single-page app would otherwise never produce:
 *
 * - `page_view` on every client-side route change. GTM's built-in Page View
 *   trigger fires only on a real document load, so without this the container
 *   sees exactly one page view per session.
 * - Scroll milestones that re-arm on each route change. GTM's built-in Scroll
 *   Depth trigger arms once on DOM ready and is consumed on the landing page,
 *   so it never fires again after the first navigation. `trackScrollDepth`
 *   replays both `gtm.scrollDepth` (for existing built-in triggers) and
 *   `scroll_depth` (for custom ones).
 */
export default function GtmRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = useMemo(() => searchParams.toString(), [searchParams]);
  const url = `${pathname}${search ? `?${search}` : ""}`;

  const lastTrackedUrl = useRef<string | null>(null);

  // GTM's native scroll listener is still armed on the route the browser
  // actually loaded, so replaying `gtm.scrollDepth` there would double-count.
  // From the first client-side navigation onward the native listener is dead
  // and the replay is the only thing keeping built-in triggers alive.
  const hasNavigated = useRef(false);

  // Virtual page view, one per unique route.
  useEffect(() => {
    if (!pathname) return;
    if (lastTrackedUrl.current === url) return;
    if (lastTrackedUrl.current !== null) {
      hasNavigated.current = true;
    }
    lastTrackedUrl.current = url;

    // Defer a frame so the new route's <title> is in place before we read it.
    const frame = requestAnimationFrame(() => {
      trackPageView(url, document.title);
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, url]);

  // Scroll milestones, reset whenever the route changes.
  useEffect(() => {
    if (!pathname) return;

    const fired = new Set<number>();
    let ticking = false;

    const evaluate = () => {
      ticking = false;

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;

      // Pages shorter than the viewport are fully visible on arrival; count
      // them as a complete read rather than reporting nothing at all.
      if (scrollable <= 0) {
        for (const milestone of SCROLL_MILESTONES) {
          if (!fired.has(milestone)) {
            fired.add(milestone);
            trackScrollDepth(milestone, url, hasNavigated.current);
          }
        }
        return;
      }

      const percent = (window.scrollY / scrollable) * 100;

      for (const milestone of SCROLL_MILESTONES) {
        if (percent >= milestone && !fired.has(milestone)) {
          fired.add(milestone);
          trackScrollDepth(milestone, url, hasNavigated.current);
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(evaluate);
    };

    // Route content mounts after this effect runs, so wait a frame before the
    // first measurement — otherwise scrollHeight is still the previous page's.
    const frame = requestAnimationFrame(evaluate);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname, url]);

  return null;
}
