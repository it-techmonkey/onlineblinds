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

/**
 * Made-to-measure blinds are built on one of several control systems, and the
 * supplier makes each in a different size envelope — so "is this size valid?"
 * cannot be answered without knowing which control the customer picked.
 *
 * All limits in inches, from the supplier product information sheets.
 */
export type BlindFamily = 'day-and-night' | 'roller';

export type ControlSystem = 'ccl' | 'motorized' | 'any';

const CONTROL_LIMITS: Record<BlindFamily, Partial<Record<ControlSystem, MeasurementRanges>>> = {
  // Zebra / Day & Night sheet (page 19).
  'day-and-night': {
    // Continuous cord loop
    ccl: { minWidth: 13, maxWidth: 96, minHeight: 13, maxHeight: 94 },
    // Motorized rechargeable radio remote (with wand). The low minimum height
    // against a high minimum width is per the sheet, not a transcription slip.
    motorized: { minWidth: 24, maxWidth: 96, minHeight: 11, maxHeight: 94 },
    any: { minWidth: 13, maxWidth: 96, minHeight: 11, maxHeight: 94 },
  },
  // Roller sheet. The cordless / no-drill systems on that sheet are omitted:
  // roller blinds offer no cordless control on the site, so nothing selects them.
  // The "RD Fabric with Flat Headrail caps at 86in" and "Open Roll Motorized has a
  // min Width of 25in" footnotes are likewise omitted: roller has no headrail option,
  // and open roll is not a distinction the site asks the customer to make.
  roller: {
    ccl: { minWidth: 8, maxWidth: 116, minHeight: 11, maxHeight: 144 },
    motorized: { minWidth: 22, maxWidth: 116, minHeight: 11, maxHeight: 144 },
    any: { minWidth: 8, maxWidth: 116, minHeight: 11, maxHeight: 144 },
  },
};

/**
 * Which sheet's rules apply, or null for a product neither sheet covers (whose
 * band range then stands unnarrowed).
 */
export function getBlindFamily({
  isDayNight,
  isRoller,
}: {
  isDayNight: boolean;
  isRoller: boolean;
}): BlindFamily | null {
  // Day & Night is checked first: it is the narrower, more specific family, and
  // a product should never be treated as both.
  if (isDayNight) {
    return 'day-and-night';
  }
  if (isRoller) {
    return 'roller';
  }
  return null;
}

/**
 * Resolve which control system the current configuration is on. Returns 'any'
 * when no control has been chosen yet — the union of every control, so the page
 * never advertises a size that no control could deliver once one is picked.
 *
 * Motorization wins when both are somehow set, mirroring the product page, where
 * selecting motorization clears the continuous chain.
 */
export function getControlSystem({
  family,
  selectedOptionalCards,
  forceMotorization = false,
  isSpecialMotorized = false,
}: {
  family: BlindFamily | null;
  selectedOptionalCards: { continuousChain: boolean; motorization: boolean };
  forceMotorization?: boolean;
  isSpecialMotorized?: boolean;
}): ControlSystem | null {
  if (!family) {
    return null;
  }

  if (selectedOptionalCards.motorization || forceMotorization || isSpecialMotorized) {
    return 'motorized';
  }
  if (selectedOptionalCards.continuousChain) {
    return 'ccl';
  }
  return 'any';
}

/**
 * Narrow a band-derived range to what the chosen control system can be built in.
 *
 * Takes the tighter of each bound in both directions: the control limits may only
 * ever shrink the range, never widen it. Widening would admit width/drop pairs the
 * price band has no cell for, which the product page treats as unsellable.
 */
export function applyControlSystemLimits(
  base: MeasurementRanges | null,
  family: BlindFamily | null,
  system: ControlSystem | null
): MeasurementRanges | null {
  if (!base || !family || !system) {
    return base;
  }

  const limits = CONTROL_LIMITS[family][system];
  if (!limits) {
    return base;
  }

  return {
    minWidth: Math.max(base.minWidth, limits.minWidth),
    maxWidth: Math.min(base.maxWidth, limits.maxWidth),
    minHeight: Math.max(base.minHeight, limits.minHeight),
    maxHeight: Math.min(base.maxHeight, limits.maxHeight),
  };
}

/**
 * How each control system is named back to the customer. These match the labels
 * on the cards they clicked, so the error points at something they can see.
 */
const CONTROL_LABELS: Record<ControlSystem, string> = {
  ccl: 'The continuous chain',
  motorized: 'Motorization',
  any: 'This blind',
};

export interface ControlSystemSizeConflict {
  system: ControlSystem;
  widthConflict: boolean;
  heightConflict: boolean;
  /** The control's envelope, already intersected with the price band. */
  limits: MeasurementRanges;
}

/**
 * Detect a size the price band can make but the *chosen control system* cannot.
 *
 * This is deliberately narrower than "measurement out of range": it fires only
 * when the control is the thing doing the rejecting, so the customer can be told
 * to change their control rather than just their measurements. A size outside the
 * band entirely is not a control conflict and keeps the generic message.
 */
export function getControlSystemSizeConflict({
  base,
  family,
  system,
  widthInches,
  heightInches,
}: {
  base: MeasurementRanges | null;
  family: BlindFamily | null;
  system: ControlSystem | null;
  widthInches: number;
  heightInches: number;
}): ControlSystemSizeConflict | null {
  // 'any' is the union of every control, so it can never single one out.
  if (!base || !family || !system || system === 'any') {
    return null;
  }
  if (widthInches <= 0 || heightInches <= 0) {
    return null;
  }

  const limits = applyControlSystemLimits(base, family, system);
  if (!limits) {
    return null;
  }

  const within = (value: number, min: number, max: number) => value >= min && value <= max;

  const widthConflict =
    within(widthInches, base.minWidth, base.maxWidth) &&
    !within(widthInches, limits.minWidth, limits.maxWidth);
  const heightConflict =
    within(heightInches, base.minHeight, base.maxHeight) &&
    !within(heightInches, limits.minHeight, limits.maxHeight);

  if (!widthConflict && !heightConflict) {
    return null;
  }

  return { system, widthConflict, heightConflict, limits };
}

/**
 * Turn a conflict into customer-facing copy, in whichever unit they are entering
 * measurements in. Limits are stored in inches; the size inputs display cm or mm.
 */
export function formatControlSystemConflict(
  conflict: ControlSystemSizeConflict,
  unit: 'cm' | 'mm'
): string {
  const factor = unit === 'mm' ? 25.4 : 2.54;
  const toDisplay = (inches: number) => Math.round(inches * factor);

  const { limits, widthConflict, heightConflict, system } = conflict;
  const bounds: string[] = [];
  if (widthConflict) {
    bounds.push(`widths between ${toDisplay(limits.minWidth)} and ${toDisplay(limits.maxWidth)} ${unit}`);
  }
  if (heightConflict) {
    bounds.push(`heights between ${toDisplay(limits.minHeight)} and ${toDisplay(limits.maxHeight)} ${unit}`);
  }

  return `${CONTROL_LABELS[system]} is only available for ${bounds.join(
    ' and '
  )}. Please adjust your measurements or choose a different control.`;
}
