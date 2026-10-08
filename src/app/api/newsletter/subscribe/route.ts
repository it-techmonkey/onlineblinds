import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getNewsletterDiscountCode, subscribeToNewsletter } from '@/lib/server/newsletter.service';

export const dynamic = 'force-dynamic';

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const EMAIL_PATTERN = /^[^\s@"\\]+@[^\s@"\\]+\.[^\s@"\\]+$/;
const MAX_EMAIL_LENGTH = 254;

function getClientKey(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(`newsletter:${getClientKey(request)}`, RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: { message: 'Too many attempts. Please try again in a minute.' } },
      {
        status: 429,
        headers: { 'Retry-After': Math.ceil(rateLimit.retryAfterMs / 1000).toString() },
      }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { success: false, error: { message: 'Please enter a valid email address.' } },
        { status: 400 }
      );
    }

    await subscribeToNewsletter(email);

    // The signup itself succeeded; a failed code lookup just means no code is shown.
    const discountCode = await getNewsletterDiscountCode().catch(() => null);

    return NextResponse.json({ success: true, data: { discountCode } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Newsletter subscribe error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'We could not subscribe you right now. Please try again later.' } },
      { status: 500 }
    );
  }
}
