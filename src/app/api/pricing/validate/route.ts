import { NextResponse } from 'next/server';
import * as pricingService from '@/lib/server/pricing.service';
import { PricingError } from '@/lib/server/pricing.service';


export async function POST(request: Request) {
  try {
    const { handle, widthInches, heightInches, customizations, submittedPrice } = await request.json();

    if (!handle || typeof widthInches !== 'number' || typeof heightInches !== 'number' || typeof submittedPrice !== 'number') {
      return NextResponse.json(
        { success: false, error: { message: 'handle, widthInches, heightInches, and submittedPrice are required' } },
        { status: 400 }
      );
    }
    if (widthInches <= 0) {
      return NextResponse.json(
        { success: false, error: { message: 'widthInches must be a positive number' } },
        { status: 400 }
      );
    }
    if (heightInches <= 0) {
      return NextResponse.json(
        { success: false, error: { message: 'heightInches must be a positive number' } },
        { status: 400 }
      );
    }

    const validation = await pricingService.validateCartPrice(
      { handle, widthInches, heightInches, customizations },
      submittedPrice
    );

    return NextResponse.json({ success: true, data: validation });
  } catch (error: unknown) {
    // A size outside the supplier's envelope, a missing price band or a grid gap
    // is a bad request, not a server fault — return the real reason so the caller
    // can show it.
    if (error instanceof PricingError) {
      return NextResponse.json(
        { success: false, error: { message: error.message } },
        { status: error.statusCode }
      );
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Pricing validate error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
