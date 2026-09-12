import type { MetadataRoute } from 'next';
import { fetchAllShopifyProducts, fetchShopifyCollections } from '@/lib/shopify';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://onlineblindsexpress.co.uk').replace(/\/$/, '');

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '', changeFrequency: 'daily', priority: 1 },
  { path: '/collections', changeFrequency: 'daily', priority: 0.9 },
  { path: '/guides', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/search', changeFrequency: 'weekly', priority: 0.3 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/refund-policy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/shipping-policy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms-and-conditions', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/warranty', changeFrequency: 'yearly', priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let collectionEntries: MetadataRoute.Sitemap = [];
  let productEntries: MetadataRoute.Sitemap = [];

  try {
    const collections = await fetchShopifyCollections();
    collectionEntries = collections.map((collection) => ({
      url: `${SITE_URL}/collections/${collection.handle}`,
      changeFrequency: 'daily',
      priority: 0.8,
    }));
  } catch (error) {
    console.error('sitemap: failed to fetch collections', error);
  }

  try {
    const products = await fetchAllShopifyProducts();
    productEntries = products.map((product) => ({
      url: `${SITE_URL}/product/${product.handle}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));
  } catch (error) {
    console.error('sitemap: failed to fetch products', error);
  }

  return [...staticEntries, ...collectionEntries, ...productEntries];
}
