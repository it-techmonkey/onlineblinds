import React, { useEffect, useState } from 'react';
import { catalogData } from './catalog-data';
import ProductPage from '@/components/product/ProductPage';
import { getCategoryCustomizations, findPrimaryCategorySlug, normalizeCategorySlug } from '@/data/categoryCustomizations';
import { isElectricalRollerProduct, isElectricalDayNightProduct } from '@/lib/electrical-roller';
import { DELIVERY_STANDARD, DELIVERY_VERTICAL } from '@/types';
import { InstallationServiceSection } from '@/components/product/InstallationServiceSection';
import FAQ from '@/components/home/FAQ';
import { ProductFeatureSection } from '@/components/product/ProductFeatureSection';
import { ProductComparisonSection } from '@/components/product/ProductComparisonSection';
import { HowItWorksSection } from '@/components/product/HowItWorksSection';
import { ProductRechargeSection } from '@/components/product/ProductRechargeSection';
import { ProductWarrantySection } from '@/components/product/ProductWarrantySection';
import { ProductComparisonTableSection } from '@/components/product/ProductComparisonTableSection';

export function ProductPreview({ product, relatedProducts = [], showRelated = true }: any) {
  const [source, setSource] = useState<any>(null);
  useEffect(() => { let active = true; catalogData().then(data => { if(active) setSource(data); }).catch(() => {}); return () => { active = false; }; }, []);
  const tags = product.tags.map((tag: string) => tag.toLowerCase());
  const roller = isElectricalRollerProduct(tags), dayNight = isElectricalDayNightProduct(tags);
  const primary = findPrimaryCategorySlug(product.collections);
  const categoryIndex = product.collections.findIndex((slug: string) => normalizeCategorySlug(slug) === primary);
  const category = roller ? 'Motorised Roller Shades' : dayNight ? 'Motorised Dual Zebra Shades' : product.collectionTitles?.[categoryIndex] || primary?.replaceAll('-', ' ') || product.collectionTitles?.find((title: string) => title !== title.toUpperCase() && !/do not delete|filter index|smart product/i.test(title)) || 'Blinds';
  let slugs = [...product.collections];
  if (roller && !slugs.includes('roller-blinds')) slugs.unshift('roller-blinds');
  if (dayNight && !slugs.includes('day-and-night-blinds')) slugs.unshift('day-and-night-blinds');
  if (product.slug === 'non-driii-honeycomb-blackout-blinds' && !slugs.some(s => s.toLowerCase().includes('eclipse'))) slugs.unshift('eclipsecore-shades');
  const features = getCategoryCustomizations(slugs);
  features.hasPvcFabric = slugs.includes('vertical-blinds') && tags.includes('waterproof');
  const original = source?.products[product.slug];
  const prepared = { ...product, tags: original?.tags || product.tags, category: original?.category || category, features: original?.features || features, productDetails: original?.productDetails || product.productDetails, estimatedDelivery: slugs.includes('vertical-blinds') ? DELIVERY_VERTICAL : DELIVERY_STANDARD, reviews: [], relatedProducts: [] };
  const recommendations = relatedProducts.length ? relatedProducts : (original?.related || []).map((handle: string) => source.products[handle]).filter(Boolean);
  return <ProductPage product={prepared} relatedProducts={showRelated ? recommendations : []} />;
}

let data: Promise<any>;
async function pricingData() {
  return data ||= fetch(window.OnlineBlinds.productDesignData).then(r => { if (!r.ok) throw new Error('Preview data unavailable'); return r.json(); });
}
export async function fetchPriceMatrix(handle: string) {
  const d = await pricingData(); return d.matrices[d.products[handle]] || null;
}
export async function fetchCustomizationPricing() { return (await pricingData()).customizations; }
export function useAuth() { return { customer: null }; }
export function trackShopifyProductView() {}
export function Reviews() {
  const markup = document.querySelector<HTMLTemplateElement>('#ob-product-reviews')?.innerHTML || '';
  return <div dangerouslySetInnerHTML={{ __html: markup }} />;
}


const contentComponents: Record<string, React.ComponentType> = {
  installation: InstallationServiceSection, faq: FAQ, features: ProductFeatureSection,
  comparison: ProductComparisonSection, steps: HowItWorksSection, recharge: ProductRechargeSection,
  warranty: ProductWarrantySection, table: ProductComparisonTableSection,
};
export function ProductContent({ kind }: { kind: string }) {
  const Component = contentComponents[kind];
  return Component ? <Component /> : null;
}
