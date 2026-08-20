import { NextResponse } from 'next/server';
import { resolveDiscountCode } from '@/lib/server/discount.service';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: { message: 'A discount code is required' } },
        { status: 400 }
      );
    }

    const discount = await resolveDiscountCode(code);
    if (!discount) {
      return NextResponse.json(
        { success: false, error: { message: 'This discount code is invalid or has expired.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: discount });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Discount validation error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
