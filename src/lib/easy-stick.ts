export type EasyStickSubtype = 'honeycomb' | 'metal' | 'wood' | null;

function normalizeValue(value: string | null | undefined) {
  return (value || '').toLowerCase().trim();
}

export function isEasyStickProduct(params: {
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
    category.includes('easy stick') ||
    tags.includes('easy-stick-blinds') ||
    name.includes('easy stick') ||
    slug.includes('easy-stick')
  );
}

export function getEasyStickSubtype(params: {
  name?: string | null;
  slug?: string | null;
  tags?: string[];
}): EasyStickSubtype {
  const name = normalizeValue(params.name);
  const slug = normalizeValue(params.slug);
  const tags = (params.tags || []).map((tag) => normalizeValue(tag));

  if (tags.includes('easy-stick-honeycomb') || name.includes('appollo') || name.includes('apollo') || slug.includes('appollo') || slug.includes('apollo')) {
    return 'honeycomb';
  }

  if (tags.includes('easy-stick-wood') || name.includes('real wood') || slug.includes('real-wood')) {
    return 'wood';
  }

  if (tags.includes('easy-stick-metal') || name.includes('metal') || slug.startsWith('tr') || slug.startsWith('easy-stick-tr')) {
    return 'metal';
  }

  return null;
}

export function getEasyStickFieldLabels(subtype: EasyStickSubtype) {
  switch (subtype) {
    case 'honeycomb':
      return {
        installationMethod: 'Measurement Type',
        controlOption: 'Operation',
        controlSide: null,
        frameColor: 'Profile Color',
      };
    case 'metal':
      return {
        installationMethod: 'Fitting Option',
        controlOption: 'Slat Size',
        controlSide: 'Controls',
        frameColor: null,
      };
    case 'wood':
      return {
        installationMethod: 'Measurement Type',
        controlOption: 'Operation',
        controlSide: 'Control Side',
        frameColor: 'Profile Color',
      };
    default:
      return {
        installationMethod: 'Installation Method',
        controlOption: 'Control Option',
        controlSide: 'Control Side',
        frameColor: 'Frame Color',
      };
  }
}
