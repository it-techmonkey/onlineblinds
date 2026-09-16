import { NextResponse } from 'next/server';
import * as pricingService from '@/lib/server/pricing.service';
import { PricingError } from '@/lib/server/pricing.service';


export async function POST(request: Request) {
  try {
    const { handle, widthInches, heightInches, customizations } = await request.json();

    if (!handle) {
      return NextResponse.json(
        { success: false, error: { message: 'handle is required' } },
        { status: 400 }
      );
    }
    if (typeof widthInches !== 'number' || widthInches <= 0) {
      return NextResponse.json(
        { success: false, error: { message: 'widthInches must be a positive number' } },
        { status: 400 }
      );
    }
    if (typeof heightInches !== 'number' || heightInches <= 0) {
      return NextResponse.json(
        { success: false, error: { message: 'heightInches must be a positive number' } },
        { status: 400 }
      );
    }

    const pricing = await pricingService.calculateProductPrice({
      handle,
      widthInches,
      heightInches,
      customizations,
    });

    return NextResponse.json({ success: true, data: pricing });
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
    console.error('Pricing calculate error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
