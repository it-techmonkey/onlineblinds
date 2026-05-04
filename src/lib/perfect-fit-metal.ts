function normalizeValue(value: string | null | undefined) {
  return (value || '').toLowerCase().trim();
}

export function isPerfectFitMetalProduct(params: {
  category?: string | null;
  tags?: string[];
  name?: string | null;
  slug?: string | null;
}) {
  const category = normalizeValue(params.category);
  const name = normalizeValue(params.name);
  const slug = normalizeValue(params.slug);
  const tags = (params.tags || []).map((tag) => normalizeValue(tag));

  const shutterProduct =
    category.includes('perfect fit shutter') ||
    tags.includes('perfect-fit-shutter') ||
    slug.includes('perfect-fit-shutter') ||
    name.includes('perfect fit shutter') ||
    name.includes('clip on shutter') ||
    name.includes('no drill shutter');

  if (shutterProduct) {
    return false;
  }

  return (
    category.includes('perfect fit metal') ||
    tags.includes('perfect metal venetian') ||
    name.includes('perfect fit metal blind') ||
    name.includes('perfect fit no drill metal blind')
  );
}

export function getPerfectFitMetalFieldLabels() {
  return {
    installationMethod: 'Measurement Type',
    controlSide: 'Control Option Side',
    frameColor: 'Frame Color',
    bracketType: 'Bracket Size',
  };
}
