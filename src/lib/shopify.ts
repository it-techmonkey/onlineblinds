// ============================================
// Shopify Storefront API Client
// ============================================
// Fetches product catalog data (titles, descriptions, images,
// collections, tags) directly from Shopify's public Storefront API.
// Pricing and checkout use local Next.js API routes.

import type { ApiProduct, ApiCategory, ApiTag } from '@/types';

// ============================================
// Configuration
// ============================================

const SHOPIFY_STORE_DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
const SHOPIFY_STOREFRONT_TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '';
const SHOPIFY_API_VERSION = '2025-01';

const STOREFRONT_URL = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

// ============================================
// Storefront GraphQL Types
// ============================================

interface StorefrontImage {
  url: string;
  altText: string | null;
}

interface StorefrontCollection {
  id: string;
  handle: string;
  title: string;
  description: string | null;
}

interface StorefrontProduct {
  id: string;
  handle: string;
  description: string;
  title: string;
  descriptionHtml: string;
  productType: string;
  vendor: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  images: {
    edges: Array<{ node: StorefrontImage }>;
  };
  collections: {
    edges: Array<{ node: StorefrontCollection }>;
  };
  metafields: Array<{
    key: string;
    namespace: string;
    type: string;
    value: string;
  } | null>;
}

interface StorefrontProductsResponse {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    edges: Array<{ node: StorefrontProduct }>;
  };
}

interface StorefrontProductIdsResponse {
  products: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    edges: Array<{ node: { id: string } }>;
  };
}

interface StorefrontProductByHandleResponse {
  product: StorefrontProduct | null;
}

interface StorefrontCollectionProductsResponse {
  collection: {
    id: string;
    handle: string;
    title: string;
    description: string | null;
    products: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      edges: Array<{ node: StorefrontProduct }>;
    };
  } | null;
}

interface StorefrontCollectionProductIdsResponse {
  collection: {
    products: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
      edges: Array<{ node: { id: string } }>;
    };
  } | null;
}

type StorefrontCollectionProductsConnection =
  NonNullable<StorefrontCollectionProductsResponse['collection']>['products'];
type StorefrontCollectionProductIdsConnection =
  NonNullable<StorefrontCollectionProductIdsResponse['collection']>['products'];

interface StorefrontCollectionsResponse {
  collections: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    edges: Array<{
      node: {
        id: string;
        handle: string;
        title: string;
        description: string | null;
      };
    }>;
  };
}

// ============================================
// Customer Types
// ============================================

export interface ShopifyCustomer {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
}

// ============================================
// GraphQL Queries
// ============================================

const PRODUCT_FIELDS = `
  id
  handle
  title
  description
  descriptionHtml
  productType
  vendor
  tags
  createdAt
  updatedAt
  images(first: 20) {
    edges {
      node {
        url
        altText
      }
    }
  }
  collections(first: 10) {
    edges {
      node {
        id
        handle
        title
        description
      }
    }
  }
  metafields(identifiers: [
    { namespace: "custom", key: "subtitle" }
    { namespace: "custom", key: "estimated_delivery" }
    { namespace: "custom", key: "rating" }
    { namespace: "custom", key: "review_count" }
    { namespace: "custom", key: "product_details" }
    { namespace: "custom", key: "specifications" }
    { namespace: "custom", key: "measuring_installation" }
    { namespace: "custom", key: "delivery_returns" }
  ]) {
    key
    namespace
    type
    value
  }
`;

const PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys!, $reverse: Boolean!) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ${PRODUCT_FIELDS}
        }
      }
    }
  }
`;

const PRODUCT_IDS_QUERY = `
  query ProductIds($first: Int!, $after: String, $query: String, $sortKey: ProductSortKeys!, $reverse: Boolean!) {
    products(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
        }
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      ${PRODUCT_FIELDS}
    }
  }
`;

const COLLECTION_PRODUCTS_QUERY = `
  query CollectionProducts($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys!, $reverse: Boolean!) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            ${PRODUCT_FIELDS}
          }
        }
      }
    }
  }
`;

const COLLECTION_PRODUCT_IDS_QUERY = `
  query CollectionProductIds($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys!, $reverse: Boolean!) {
    collection(handle: $handle) {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
          }
        }
      }
    }
  }
`;

const COLLECTIONS_QUERY = `
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          handle
          title
          description
        }
      }
    }
  }
`;

// ============================================
// Customer GraphQL Query
// ============================================

const CUSTOMER_FIELDS = `
  id
  firstName
  lastName
  emailAddress {
    emailAddress
  }
`;

// ============================================
// GraphQL Fetch Helper
// ============================================

async function storefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: {
    revalidate?: number | false;
  }
): Promise<T> {
  if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
    throw new Error(
      'Shopify Storefront API credentials not configured. Set NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN.'
    );
  }

  const isServerSide = typeof window === 'undefined';

  const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  };

  // Use Next.js data cache for normal server-side requests, but allow opting out
  // for large bulk catalog fetches that exceed the persistent cache size limit.
  if (isServerSide) {
    if (options?.revalidate === false) {
      fetchOptions.cache = 'no-store';
    } else {
      fetchOptions.next = { revalidate: options?.revalidate ?? 60 };
    }
  }

  const response = await fetch(STOREFRONT_URL, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Shopify Storefront API error [${response.status}]: ${errorText}`
    );
  }

  const json = await response.json();

  if (json.errors) {
    console.error('Shopify GraphQL errors:', json.errors);
    throw new Error(
      `Shopify GraphQL error: ${json.errors[0]?.message || 'Unknown error'}`
    );
  }

  return json.data as T;
}

// ============================================
// Data Mapping Helpers
// ============================================

/**
 * Convert a string to a URL-friendly slug.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Map a Shopify Storefront product to our ApiProduct type.
 * Uses minimum prices map (handle → price) from the backend pricing engine.
 */
function mapStorefrontProduct(
  sfProduct: StorefrontProduct,
  minimumPrices: Record<string, number>
): ApiProduct {
  const categories: ApiCategory[] = sfProduct.collections.edges.map(
    (edge) => ({
      id: edge.node.id,
      slug: edge.node.handle,
      name: edge.node.title,
      description: edge.node.description,
    })
  );

  const tags: ApiTag[] = sfProduct.tags.map((tag) => ({
    id: slugify(tag),
    name: tag,
    slug: slugify(tag),
  }));

  const metafields = Object.fromEntries(
    sfProduct.metafields
      .filter((metafield): metafield is NonNullable<typeof metafield> => Boolean(metafield))
      .map((metafield) => [metafield.key, metafield.value])
  );

  const parseOptionalNumber = (value: string | undefined): number | null => {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  return {
    id: sfProduct.id,
    slug: sfProduct.handle,
    title: sfProduct.title,
    description: sfProduct.description || null,
    descriptionHtml: sfProduct.descriptionHtml || null,
    images: sfProduct.images.edges.map((edge) => edge.node.url),
    imageAlts: sfProduct.images.edges.map((edge) => edge.node.altText || ''),
    videos: [],
    price: minimumPrices[sfProduct.handle] || 0,
    createdAt: sfProduct.createdAt,
    updatedAt: sfProduct.updatedAt,
    vendor: sfProduct.vendor || null,
    productType: sfProduct.productType || null,
    subtitle: metafields.subtitle || null,
    estimatedDelivery: metafields.estimated_delivery || null,
    rating: parseOptionalNumber(metafields.rating),
    reviewCount: parseOptionalNumber(metafields.review_count),
    productDetails: metafields.product_details || null,
    specifications: metafields.specifications || null,
    measuringInstallation: metafields.measuring_installation || null,
    deliveryReturns: metafields.delivery_returns || null,
    categories,
    tags,
  };
}

type CatalogSortOption = 'best-selling' | 'price-low' | 'price-high' | 'name-az' | 'name-za';

interface PaginatedShopifyProductsParams {
  page?: number;
  limit?: number;
  searchQuery?: string;
  sortBy?: CatalogSortOption;
}

interface ShopifyPaginationResult {
  products: ApiProduct[];
  total: number;
}

interface CursorPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
  edgeCount: number;
}

const countCache = new Map<string, { value: number; expiresAt: number }>();
const COUNT_CACHE_TTL = 60_000;

function getSortConfig(sortBy: CatalogSortOption = 'best-selling'): {
  productSortKey: 'CREATED_AT' | 'PRICE' | 'TITLE';
  collectionSortKey: 'CREATED' | 'PRICE' | 'TITLE';
  reverse: boolean;
} {
  switch (sortBy) {
    case 'price-low':
      return { productSortKey: 'PRICE', collectionSortKey: 'PRICE', reverse: false };
    case 'price-high':
      return { productSortKey: 'PRICE', collectionSortKey: 'PRICE', reverse: true };
    case 'name-az':
      return { productSortKey: 'TITLE', collectionSortKey: 'TITLE', reverse: false };
    case 'name-za':
      return { productSortKey: 'TITLE', collectionSortKey: 'TITLE', reverse: true };
    default:
      return { productSortKey: 'CREATED_AT', collectionSortKey: 'CREATED', reverse: true };
  }
}

async function getCachedCount(cacheKey: string, compute: () => Promise<number>): Promise<number> {
  const cached = countCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = await compute();
  countCache.set(cacheKey, {
    value,
    expiresAt: Date.now() + COUNT_CACHE_TTL,
  });
  return value;
}

async function findCursorForPage(
  page: number,
  fetchPageInfo: (after: string | null) => Promise<CursorPageInfo>
): Promise<string | null> {
  if (page <= 1) {
    return null;
  }

  let after: string | null = null;

  for (let currentPage = 1; currentPage < page; currentPage += 1) {
    const { hasNextPage, endCursor, edgeCount } = await fetchPageInfo(after);
    if (edgeCount === 0 || !endCursor) {
      return after;
    }
    after = endCursor;
    if (!hasNextPage) {
      break;
    }
  }

  return after;
}

// ============================================
// Public API Functions
// ============================================

/**
 * Fetch all products from Shopify Storefront API (handles pagination).
 * Returns up to ~1000 products across multiple pages.
 */
export async function fetchAllShopifyProducts(
  searchQuery?: string
): Promise<StorefrontProduct[]> {
  const allProducts: StorefrontProduct[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  const { productSortKey, reverse } = getSortConfig('best-selling');

  while (hasNextPage) {
    const variables: Record<string, unknown> = {
      first: 250,
      after: cursor,
      sortKey: productSortKey,
      reverse,
    };

    if (searchQuery) {
      variables.query = searchQuery;
    }

    const data =
      await storefrontFetch<StorefrontProductsResponse>(
        PRODUCTS_QUERY,
        variables,
        { revalidate: false }
      );

    const { edges, pageInfo } = data.products;
    allProducts.push(...edges.map((edge) => edge.node));

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }

  return allProducts;
}

/**
 * Fetch a single product by its handle (slug) from Shopify.
 */
export async function fetchShopifyProductByHandle(
  handle: string
): Promise<StorefrontProduct | null> {
  const data =
    await storefrontFetch<StorefrontProductByHandleResponse>(
      PRODUCT_BY_HANDLE_QUERY,
      { handle }
    );

  return data.product;
}

/**
 * Fetch all collections from Shopify.
 */
export async function fetchShopifyCollections(): Promise<
  Array<{
    id: string;
    handle: string;
    title: string;
    description: string | null;
  }>
> {
  const collections: Array<{
    id: string;
    handle: string;
    title: string;
    description: string | null;
  }> = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: StorefrontCollectionsResponse =
      await storefrontFetch<StorefrontCollectionsResponse>(
        COLLECTIONS_QUERY,
        { first: 50, after: cursor }
      );

    collections.push(...data.collections.edges.map((edge: { node: StorefrontCollection }) => edge.node));
    hasNextPage = data.collections.pageInfo.hasNextPage;
    cursor = data.collections.pageInfo.endCursor;
  }

  return collections;
}

// ============================================
// Merged Fetch Functions
// (These combine Shopify catalog data with backend product IDs/prices)
// ============================================

/**
 * Fetch minimum prices (handle → price) from our backend pricing engine.
 * Cached for 60 seconds to avoid repeated calls.
 */
let cachedMinimumPrices: Record<string, number> | null = null;
let pricesCacheTime = 0;
const PRICES_CACHE_TTL = 60_000; // 60 seconds

function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

async function getMinimumPrices(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedMinimumPrices && now - pricesCacheTime < PRICES_CACHE_TTL) {
    return cachedMinimumPrices;
  }

  const isServerSide = typeof window === 'undefined';

  // On the server, call pricing service directly instead of HTTP-calling our own API route.
  // This avoids 401 issues on Vercel deployments with protection enabled.
  if (isServerSide) {
    try {
      const pricingService = await import('@/lib/server/pricing.service');
      cachedMinimumPrices = await pricingService.getMinimumPricesByHandle();
      if (Object.keys(cachedMinimumPrices).length === 0) {
        console.warn(
          '[Pricing] getMinimumPricesByHandle returned no prices. ' +
          'Check that: (1) price band data is seeded in the DB, ' +
          '(2) SHOPIFY_ADMIN_ACCESS_TOKEN is set, and ' +
          '(3) the custom.price_band_name metafield is set on Shopify products.'
        );
      }
      pricesCacheTime = now;
      return cachedMinimumPrices;
    } catch (err: any) {
      console.error('[Pricing] Failed to fetch minimum prices from DB:', err?.message || err);
      cachedMinimumPrices = {};
      pricesCacheTime = now;
      return cachedMinimumPrices;
    }
  }

  const base = getApiBaseUrl();

  const fetchOptions: RequestInit & { next?: { revalidate: number } } = {
    headers: { 'Content-Type': 'application/json' },
  };

  const response = await fetch(`${base}/api/pricing/minimum-prices`, fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to fetch minimum prices: ${response.status}`);
  }

  const json = await response.json();
  cachedMinimumPrices = json.data;
  pricesCacheTime = now;
  return cachedMinimumPrices!;
}

async function countProducts(searchQuery?: string): Promise<number> {
  const cacheKey = `products:${searchQuery || '__all__'}`;
  return getCachedCount(cacheKey, async () => {
    let total = 0;
    let cursor: string | null = null;
    let hasNextPage = true;
    const { productSortKey, reverse } = getSortConfig('best-selling');

    while (hasNextPage) {
      const data: StorefrontProductIdsResponse = await storefrontFetch<StorefrontProductIdsResponse>(
        PRODUCT_IDS_QUERY,
        {
          first: 250,
          after: cursor,
          query: searchQuery,
          sortKey: productSortKey,
          reverse,
        }
      );

      total += data.products.edges.length;
      hasNextPage = data.products.pageInfo.hasNextPage;
      cursor = data.products.pageInfo.endCursor;
    }

    return total;
  });
}

async function countCollectionProducts(handle: string): Promise<number> {
  const cacheKey = `collection:${handle}`;
  return getCachedCount(cacheKey, async () => {
    let total = 0;
    let cursor: string | null = null;
    let hasNextPage = true;
    const { collectionSortKey, reverse } = getSortConfig('best-selling');

    while (hasNextPage) {
      const data: StorefrontCollectionProductIdsResponse = await storefrontFetch<StorefrontCollectionProductIdsResponse>(
        COLLECTION_PRODUCT_IDS_QUERY,
        {
          handle,
          first: 250,
          after: cursor,
          sortKey: collectionSortKey,
          reverse,
        }
      );

      const connection: StorefrontCollectionProductIdsConnection | undefined =
        data.collection?.products;
      if (!connection) {
        return 0;
      }

      total += connection.edges.length;
      hasNextPage = connection.pageInfo.hasNextPage;
      cursor = connection.pageInfo.endCursor;
    }

    return total;
  });
}

async function fetchStorefrontProductsPage(params: PaginatedShopifyProductsParams): Promise<StorefrontProduct[]> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || 24);
  const { productSortKey, reverse } = getSortConfig(params.sortBy);

  const cursor = await findCursorForPage(page, async (after) => {
    const data: StorefrontProductIdsResponse = await storefrontFetch<StorefrontProductIdsResponse>(
      PRODUCT_IDS_QUERY,
      {
        first: limit,
        after,
        query: params.searchQuery,
        sortKey: productSortKey,
        reverse,
      }
    );

    return {
      hasNextPage: data.products.pageInfo.hasNextPage,
      endCursor: data.products.pageInfo.endCursor,
      edgeCount: data.products.edges.length,
    };
  });

  const data = await storefrontFetch<StorefrontProductsResponse>(
    PRODUCTS_QUERY,
    {
      first: limit,
      after: cursor,
      query: params.searchQuery,
      sortKey: productSortKey,
      reverse,
    }
  );

  return data.products.edges.map((edge) => edge.node);
}

async function fetchAllStorefrontProductsByCollection(handle: string): Promise<StorefrontProduct[]> {
  const allProducts: StorefrontProduct[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  const { collectionSortKey, reverse } = getSortConfig('best-selling');

  while (hasNextPage) {
    const data: StorefrontCollectionProductsResponse = await storefrontFetch<StorefrontCollectionProductsResponse>(
      COLLECTION_PRODUCTS_QUERY,
      {
        handle,
        first: 250,
        after: cursor,
        sortKey: collectionSortKey,
        reverse,
      },
      { revalidate: false }
    );

    const connection: StorefrontCollectionProductsConnection | undefined =
      data.collection?.products;
    if (!connection) {
      return [];
    }

    allProducts.push(...connection.edges.map((edge: { node: StorefrontProduct }) => edge.node));
    hasNextPage = connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
  }

  return allProducts;
}

async function fetchStorefrontProductsPageByCollection(
  handle: string,
  params: PaginatedShopifyProductsParams
): Promise<StorefrontProduct[]> {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, params.limit || 24);
  const { collectionSortKey, reverse } = getSortConfig(params.sortBy);

  const cursor = await findCursorForPage(page, async (after) => {
    const data: StorefrontCollectionProductIdsResponse = await storefrontFetch<StorefrontCollectionProductIdsResponse>(
      COLLECTION_PRODUCT_IDS_QUERY,
      {
        handle,
        first: limit,
        after,
        sortKey: collectionSortKey,
        reverse,
      }
    );

    const connection: StorefrontCollectionProductIdsConnection | undefined =
      data.collection?.products;
    return {
      hasNextPage: connection?.pageInfo.hasNextPage ?? false,
      endCursor: connection?.pageInfo.endCursor ?? null,
      edgeCount: connection?.edges.length ?? 0,
    };
  });

  const data: StorefrontCollectionProductsResponse = await storefrontFetch<StorefrontCollectionProductsResponse>(
    COLLECTION_PRODUCTS_QUERY,
    {
      handle,
      first: limit,
      after: cursor,
      sortKey: collectionSortKey,
      reverse,
    }
  );

  return (data.collection?.products.edges || []).map((edge: { node: StorefrontProduct }) => edge.node);
}

/**
 * Fetch all products from Shopify, merged with backend minimum prices.
 * This is the primary product fetch function.
 */
export async function fetchShopifyProductsMerged(
  searchQuery?: string
): Promise<ApiProduct[]> {
  const [sfProducts, minimumPrices] = await Promise.all([
    fetchAllShopifyProducts(searchQuery),
    getMinimumPrices(),
  ]);

  return sfProducts.map((sfProduct) =>
    mapStorefrontProduct(sfProduct, minimumPrices)
  );
}

export async function fetchShopifyProductsMergedPage(
  params: PaginatedShopifyProductsParams
): Promise<ShopifyPaginationResult> {
  const [sfProducts, minimumPrices, total] = await Promise.all([
    fetchStorefrontProductsPage(params),
    getMinimumPrices(),
    countProducts(params.searchQuery),
  ]);

  return {
    products: sfProducts.map((sfProduct) => mapStorefrontProduct(sfProduct, minimumPrices)),
    total,
  };
}

export async function fetchAllShopifyProductsByCollectionMerged(
  handle: string
): Promise<ApiProduct[]> {
  const [sfProducts, minimumPrices] = await Promise.all([
    fetchAllStorefrontProductsByCollection(handle),
    getMinimumPrices(),
  ]);

  return sfProducts.map((sfProduct) =>
    mapStorefrontProduct(sfProduct, minimumPrices)
  );
}

export async function fetchShopifyProductsByCollectionMergedPage(
  handle: string,
  params: PaginatedShopifyProductsParams
): Promise<ShopifyPaginationResult> {
  const [sfProducts, minimumPrices, total] = await Promise.all([
    fetchStorefrontProductsPageByCollection(handle, params),
    getMinimumPrices(),
    countCollectionProducts(handle),
  ]);

  return {
    products: sfProducts.map((sfProduct) => mapStorefrontProduct(sfProduct, minimumPrices)),
    total,
  };
}

/**
 * Fetch a single product from Shopify by handle, merged with backend price.
 */
export async function fetchShopifyProductByHandleMerged(
  handle: string
): Promise<ApiProduct | null> {
  const [sfProduct, minimumPrices] = await Promise.all([
    fetchShopifyProductByHandle(handle),
    getMinimumPrices(),
  ]);

  if (!sfProduct) return null;

  return mapStorefrontProduct(sfProduct, minimumPrices);
}

/**
 * Fetch collections from Shopify, mapped to the Category type used in the frontend.
 */
export async function fetchShopifyCollectionsMapped(): Promise<
  Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    productCount: number;
  }>
> {
  const collections = await fetchShopifyCollections();

  return collections.map((col) => ({
    id: col.id,
    slug: col.handle,
    name: col.title,
    description: col.description,
    productCount: 0,
  }));
}

// ============================================
// Customer Account Functions
// ============================================

/**
 * Fetch the currently authenticated customer's profile.
 */
export async function shopifyCustomerFetch(
  accessToken: string
): Promise<ShopifyCustomer | null> {
  const discoveryResponse = await fetch(
    `https://${SHOPIFY_STORE_DOMAIN}/.well-known/customer-account-api`,
    { cache: 'no-store' }
  );

  if (!discoveryResponse.ok) {
    throw new Error(`Customer account API discovery failed: ${discoveryResponse.status}`);
  }

  const discoveryJson: { graphql_api: string } = await discoveryResponse.json();
  const response = await fetch(discoveryJson.graphql_api, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken,
      Origin: typeof window === 'undefined'
        ? (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'))
        : window.location.origin,
      'User-Agent': 'blackout-blinds-headless-auth',
    },
    body: JSON.stringify({
      query: `query Customer { customer { ${CUSTOMER_FIELDS} } }`,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Customer account API error: ${response.status}`);
  }

  const json: {
    data?: {
      customer?: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        emailAddress?: { emailAddress: string } | null;
      } | null;
    };
    errors?: Array<{ message: string }>;
  } = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0]?.message || 'Customer account GraphQL error');
  }

  const customer = json.data?.customer;
  if (!customer?.emailAddress?.emailAddress) {
    return null;
  }

  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.emailAddress.emailAddress,
    phone: null,
  };
}

