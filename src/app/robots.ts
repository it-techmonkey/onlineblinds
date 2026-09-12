import type { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://onlineblindsexpress.co.uk').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account/', '/cart/', '/login/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
