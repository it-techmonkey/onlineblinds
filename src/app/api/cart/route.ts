import { NextResponse } from 'next/server';
import { getCustomer } from '@/lib/auth';
import { getCustomerCart, saveCustomerCart, type SerializedCartItem } from '@/lib/server/cart.service';

export async function GET() {
  try {
    const customer = await getCustomer();

    if (!customer?.email) {
      return NextResponse.json(
        { success: false, error: { message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const items = await getCustomerCart(customer.email);
    return NextResponse.json({ success: true, data: { items } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Get cart error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
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

    const savedItems = await saveCustomerCart(customer.email, items as SerializedCartItem[]);
    return NextResponse.json({ success: true, data: { items: savedItems } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Save cart error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
