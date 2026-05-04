function normalizeValue(value: string | null | undefined) {
  return (value || '').toLowerCase().trim();
}

export function isPerfectFitWoodenProduct(params: {
  category?: string | null;
  tags?: string[];
  name?: string | null;
  slug?: string | null;
}) {
  const category = normalizeValue(params.category);
  const name = normalizeValue(params.name);
  const tags = (params.tags || []).map((tag) => normalizeValue(tag));

  return (
    category.includes('perfect fit wooden') ||
    tags.includes('perfect_wood') ||
    name.includes('perfect fit wooden') ||
    name.includes('perfect fit no drill wooden')
  );
}

export function getPerfectFitWoodenFieldLabels() {
  return {
    installationMethod: 'Measurement Type',
    controlSide: 'Control Option Side',
    frameColor: 'Frame Color',
    bracketType: 'Bracket Size',
  };
}
