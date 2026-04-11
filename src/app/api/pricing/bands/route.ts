import { NextResponse } from 'next/server';
import * as pricingService from '@/lib/server/pricing.service';

export async function GET() {
  try {
    const [widthBands, heightBands] = await Promise.all([
      pricingService.getWidthBands(),
      pricingService.getHeightBands(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        widthBands: widthBands.map((wb: any) => ({
          id: wb.id,
          mm: wb.widthMm,
          inches: wb.widthInches,
        })),
        heightBands: heightBands.map((hb: any) => ({
          id: hb.id,
          mm: hb.heightMm,
          inches: hb.heightInches,
        })),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Size bands error:', message);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
