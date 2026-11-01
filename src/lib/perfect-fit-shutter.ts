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

// Panel choices by total width: up to 950mm is 1 panel, 951-1500mm is 2 panels,
// and above 1500mm the customer chooses 2 or 3 panels.
const PANEL_RANGES_MM = [
  { maxWidthMm: 950, optionIds: ['1-panel'] },
  { maxWidthMm: 1500, optionIds: ['2-panels'] },
  { maxWidthMm: Infinity, optionIds: ['2-panels', '3-panels'] },
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

export function getPerfectFitShutterPanelOptions(widthMm: number) {
  if (!Number.isFinite(widthMm) || widthMm <= 0) {
    return [];
  }

  // Widths entered in cm or inches are converted through inches, so round off
  // tiny float errors (95cm must stay 950mm, not 950.0000001mm).
  const roundedMm = Math.round(widthMm * 100) / 100;
  const matchingRange = PANEL_RANGES_MM.find((range) => roundedMm <= range.maxWidthMm);
  return PERFECT_FIT_SHUTTER_PANEL_OPTIONS.filter((option) =>
    matchingRange?.optionIds.includes(option.id)
  );
}

// One allowed choice is filled in automatically. With several, only a choice the
// customer made themselves is kept (while still allowed); an automatic one is
// cleared so they must choose before adding to basket.
export function getPerfectFitShutterPanelSelection(
  current: string | null,
  options: { id: string }[],
  chosenByCustomer: boolean
) {
  if (options.length === 1) return options[0].id;
  return chosenByCustomer && options.some((option) => option.id === current) ? current : null;
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
