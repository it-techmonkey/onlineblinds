import { NextResponse } from 'next/server';
import { getDraftOrderStatus, CheckoutError } from '@/lib/server/order.service';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ draftOrderId: string }> }
) {
  try {
    const { draftOrderId } = await params;

    if (!draftOrderId) {
      return NextResponse.json(
        { success: false, error: { message: 'draftOrderId is required' } },
        { status: 400 }
      );
    }

    const result = await getDraftOrderStatus(draftOrderId);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    if (error instanceof CheckoutError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Draft order status error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
