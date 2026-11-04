import React from 'react';
import { renderToString } from 'react-dom/server';
import { islands } from './islands';
export function renderIsland(name: string, props = {}) {
  const Component = islands[name];
  return renderToString(<Component {...props} />).replace(/<link[^>]+rel="preload"[^>]*>/g, '');
}
export { navigationData, ALL_COLLECTION_SLUGS, NAVIGATION_SLUG_MAPPING, NAVIGATION_TAG_FILTERS, COLLECTION_DISPLAY_NAMES, COLLECTION_DESCRIPTIONS } from '@/data/navigation';
export { CATEGORY_CUSTOMIZATIONS } from '@/data/categoryCustomizations';
export * as customizationOptions from '@/data/customizations';
