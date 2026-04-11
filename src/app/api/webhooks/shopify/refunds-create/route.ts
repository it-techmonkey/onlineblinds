import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const refund = await request.json();

    if (!refund || !refund.order_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log(`Webhook: Refund created for Shopify order ${refund.order_id}`);
    console.log(`  Refund amount: ${refund.transactions?.[0]?.amount || 'unknown'}`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', message);
    return NextResponse.json({ success: true, warning: 'Processed with errors' });
  }
}
