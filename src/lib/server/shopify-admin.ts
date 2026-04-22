// Shopify Admin API configuration (server-side only).
// Customer/order PII reads are intentionally not exposed here. The app stores
// paid order details from Shopify webhooks instead of querying Shopify account data.

export const shopifyConfig = {
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN || '',
  adminAccessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '',
  storefrontAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
  apiVersion: '2025-01',
};

export function validateShopifyConfig(): void {
  if (!shopifyConfig.storeDomain) {
    throw new Error('SHOPIFY_STORE_DOMAIN is required');
  }
  if (!shopifyConfig.adminAccessToken) {
    throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN is required');
  }
}

export function getAdminApiUrl(endpoint: string): string {
  const domain = shopifyConfig.storeDomain.replace(/^https?:\/\//, '');
  return `https://${domain}/admin/api/${shopifyConfig.apiVersion}${endpoint}`;
}

export function getAdminHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': shopifyConfig.adminAccessToken,
  };
}
