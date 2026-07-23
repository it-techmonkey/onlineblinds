import { NextRequest, NextResponse } from 'next/server';
import { fetchProducts, transformProduct } from '@/lib/api';
import { checkRateLimit } from '@/lib/server/rate-limit';

export const dynamic = 'force-dynamic';

const LIVE_RESULT_LIMIT = 5;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 1000;

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function GET(request: NextRequest) {
  const clientKey = getClientKey(request);
  const rateLimit = checkRateLimit(clientKey, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many search requests. Please slow down.' } },
      {
        status: 429,
        headers: { 'Retry-After': Math.ceil(rateLimit.retryAfterMs / 1000).toString() },
      }
    );
  }

  const query = request.nextUrl.searchParams.get('q')?.trim() || '';

  if (!query) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const response = await fetchProducts({
      limit: LIVE_RESULT_LIMIT,
      search: query,
      skipTotalCount: true,
    });

    const products = (response.data || []).map(transformProduct).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      currency: product.currency,
      image: product.images[0] || null,
    }));

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error('Live search failed:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Search failed' } },
      { status: 500 }
    );
  }
}
