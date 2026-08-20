import { NextResponse } from 'next/server';
import { validateCartItemPrices, type CheckoutItemRequest } from '@/lib/server/order.service';

export async function POST(request: Request) {
  try {
    const { items } = (await request.json()) as { items?: CheckoutItemRequest[] };

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: { message: 'items array is required' } },
        { status: 400 }
      );
    }

    const results = await validateCartItemPrices(items);
    return NextResponse.json({ success: true, data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cart price validation error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
