import { PriceBandMatrix } from '@/types';

export interface MeasurementRanges {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

export function getMeasurementRanges(priceMatrix: PriceBandMatrix | null): MeasurementRanges | null {
  if (!priceMatrix || priceMatrix.widthBands.length === 0 || priceMatrix.heightBands.length === 0) {
    return null;
  }

  return {
    minWidth: Math.min(...priceMatrix.widthBands.map((band) => band.inches)),
    maxWidth: Math.max(...priceMatrix.widthBands.map((band) => band.inches)),
    minHeight: Math.min(...priceMatrix.heightBands.map((band) => band.inches)),
    maxHeight: Math.max(...priceMatrix.heightBands.map((band) => band.inches)),
  };
}
