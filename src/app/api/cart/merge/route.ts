import { NextResponse } from 'next/server';
import { getCustomer } from '@/lib/auth';
import { mergeCustomerCart, type SerializedCartItem } from '@/lib/server/cart.service';

export async function POST(request: Request) {
  try {
    const customer = await getCustomer();

    if (!customer?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: { message: 'items must be an array' } },
        { status: 400 }
      );
    }

    const mergedItems = await mergeCustomerCart(customer.email, items as SerializedCartItem[]);
    return NextResponse.json({ success: true, data: { items: mergedItems } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Merge cart error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
