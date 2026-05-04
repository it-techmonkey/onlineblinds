function normalizeValue(value: string | null | undefined) {
  return (value || '').toLowerCase().trim();
}

export const PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM = 110;
export const PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM = 1100;

export const PERFECT_FIT_SHUTTER_PANEL_OPTIONS = [
  { id: '1-panel', name: '1 Panel', price: 0 },
  { id: '2-panels', name: '2 Panels', price: 0 },
  { id: '3-panels', name: '3 Panels', price: 0 },
  { id: '4-panels', name: '4 Panels', price: 0 },
  { id: '5-panels', name: '5 Panels', price: 0 },
];

const PANEL_SEQUENCE_RANGES_MM = [
  { maxWidthMm: 750, optionId: '1-panel' },
  { maxWidthMm: 1500, optionId: '2-panels' },
  { maxWidthMm: 2250, optionId: '3-panels' },
  { maxWidthMm: 3000, optionId: '4-panels' },
  { maxWidthMm: 3750, optionId: '5-panels' },
];

export function isPerfectFitShutterProduct(params: {
  category?: string | null;
  tags?: string[];
  name?: string | null;
  slug?: string | null;
}) {
  const category = normalizeValue(params.category);
  const name = normalizeValue(params.name);
  const slug = normalizeValue(params.slug);
  const tags = (params.tags || []).map((tag) => normalizeValue(tag));

  return (
    category.includes('perfect fit shutter') ||
    tags.includes('perfect-fit-shutter') ||
    slug.includes('perfect-fit-shutter') ||
    name.includes('perfect fit shutter') ||
    name.includes('clip on shutter') ||
    name.includes('no drill shutter')
  );
}

export function getPerfectFitShutterFieldLabels() {
  return {
    installationMethod: 'Measurement Type',
    controlOption: 'Window Handle Location',
    handlePosition: 'Handle Position',
    bracketType: 'Bracket Size',
    numberOfPanels: 'Number of Panels',
  };
}

export function getPerfectFitShutterPanelOption(widthMm: number) {
  if (!Number.isFinite(widthMm) || widthMm <= 0) {
    return null;
  }

  const matchingRange = PANEL_SEQUENCE_RANGES_MM.find((range) => widthMm <= range.maxWidthMm);
  if (!matchingRange) {
    return null;
  }

  return (
    PERFECT_FIT_SHUTTER_PANEL_OPTIONS.find((option) => option.id === matchingRange.optionId) ??
    null
  );
}

export function isPerfectFitShutterHandlePositionRequired(controlOption: string | null | undefined) {
  return normalizeValue(controlOption) !== '' && normalizeValue(controlOption) !== 'none';
}

export function isPerfectFitShutterHandlePositionValid(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return false;
  }

  return (
    parsed >= PERFECT_FIT_SHUTTER_HANDLE_POSITION_MIN_MM &&
    parsed <= PERFECT_FIT_SHUTTER_HANDLE_POSITION_MAX_MM
  );
}
