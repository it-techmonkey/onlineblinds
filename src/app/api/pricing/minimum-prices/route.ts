import { NextResponse } from 'next/server';
import * as pricingService from '@/lib/server/pricing.service';

// Revalidate hourly instead of freezing the response at build time. A frozen
// (force-static/revalidate:false) route baked whatever prices existed at build
// and never refreshed on the deployed site, so a build-time pricing blip served
// stale/empty prices to clients forever. Periodic revalidation lets it recover.
export const revalidate = 3_600;

export const maxDuration = 60;

export async function GET() {
  try {
    const prices = await pricingService.getMinimumPricesByHandle();

    // Never cache an empty price map: returning a non-error empty response would
    // let Next.js freeze £0 prices for the whole revalidate window. Signal an
    // error so the cache isn't populated and the next request retries.
    if (Object.keys(prices).length === 0) {
      console.error('[Pricing] minimum-prices route resolved an empty map; not caching.');
      return NextResponse.json(
        { success: false, error: { message: 'Prices temporarily unavailable' } },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, data: prices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Minimum prices error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
