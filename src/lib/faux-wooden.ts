const FAUX_WOODEN_TAGS = new Set([
  'aqua_wood',
  'aqua_wood_faux',
  'expressions_no_tape',
]);

function normalizeValue(value: string | null | undefined) {
  return (value || '').toLowerCase().trim();
}

export function isFauxWoodenProduct(params: {
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
    category.includes('faux wooden') ||
    tags.some((tag) => FAUX_WOODEN_TAGS.has(tag)) ||
    name.includes('faux wooden') ||
    slug.includes('faux-wooden')
  );
}
