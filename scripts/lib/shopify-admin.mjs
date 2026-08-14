// Shared Shopify Admin API helpers for the product-creation scripts.
//
// Extracted from create-kids-daynight-products.mjs so the Plain Soft variant
// script reuses one implementation of env loading, transport, staged image
// uploads and sales-channel publishing.

import fs from 'node:fs';
import path from 'node:path';

export const SHOPIFY_API_VERSION = '2025-01';

// ============================================================================
// Env
// ============================================================================

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

export function loadEnv() {
  loadEnvFile(path.join(process.cwd(), '.env.local'));
  loadEnvFile(path.join(process.cwd(), '.env'));
}

export function requiredEnv(name, fallbackName) {
  const value = process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
  if (!value) {
    const names = fallbackName ? `${name} or ${fallbackName}` : name;
    throw new Error(`Missing required environment variable: ${names}`);
  }
  return value;
}

function normalizeDomain(domain) {
  return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/** Resolve the Admin GraphQL endpoint and auth headers from the environment. */
export function getAdminClient() {
  loadEnv();

  const storeDomain = normalizeDomain(
    requiredEnv('SHOPIFY_STORE_DOMAIN', 'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN')
  );

  return {
    storeDomain,
    url: `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': requiredEnv('SHOPIFY_ADMIN_ACCESS_TOKEN'),
    },
  };
}

// ============================================================================
// Transport
// ============================================================================

export async function shopifyGraphql(url, headers, query, variables) {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify GraphQL request failed [${response.status}]: ${errorText}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

export function assertNoUserErrors(label, userErrors) {
  if (userErrors?.length) {
    throw new Error(`${label} userErrors: ${JSON.stringify(userErrors)}`);
  }
}

// ============================================================================
// Shared queries and mutations
// ============================================================================

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      handle
      status
    }
  }
`;

export const COLLECTION_BY_HANDLE_QUERY = `
  query CollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      title
    }
  }
`;

export const PRODUCT_SET_MUTATION = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product {
        id
        handle
        title
        status
        variants(first: 50) {
          nodes {
            id
            title
            selectedOptions {
              name
              value
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// productUpdate applies a partial update. productSet is declarative and resets
// anything you leave out — using it to patch an existing product silently flipped
// status back to the ACTIVE default and published drafts to the live store.
export const PRODUCT_UPDATE_MUTATION = `
  mutation ProductUpdate($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        id
        handle
        status
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const STAGED_UPLOADS_CREATE_MUTATION = `
  mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCT_CREATE_MEDIA_MUTATION = `
  mutation ProductCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
    productCreateMedia(productId: $productId, media: $media) {
      media {
        ... on MediaImage {
          id
          alt
        }
        mediaContentType
        status
      }
      mediaUserErrors {
        field
        message
      }
    }
  }
`;

export const METAFIELDS_SET_MUTATION = `
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        namespace
        key
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const COLLECTION_ADD_PRODUCTS_MUTATION = `
  mutation CollectionAddProducts($id: ID!, $productIds: [ID!]!) {
    collectionAddProducts(id: $id, productIds: $productIds) {
      collection {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PUBLICATIONS_QUERY = `
  query Publications {
    publications(first: 50) {
      nodes {
        id
        name
      }
    }
  }
`;

const PUBLISHABLE_PUBLISH_MUTATION = `
  mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

// ============================================================================
// Operations
// ============================================================================

/**
 * Stage a local image with Shopify, POST the bytes, and return the resourceUrl
 * that productCreateMedia consumes.
 */
export async function uploadImage(url, headers, { filePath, uploadName }) {
  const staged = await shopifyGraphql(url, headers, STAGED_UPLOADS_CREATE_MUTATION, {
    input: [
      {
        resource: 'IMAGE',
        httpMethod: 'POST',
        mimeType: 'image/webp',
        filename: uploadName,
      },
    ],
  });

  assertNoUserErrors('stagedUploadsCreate', staged.stagedUploadsCreate.userErrors);

  const target = staged.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const parameter of target.parameters) {
    form.append(parameter.name, parameter.value);
  }
  // The file field must be appended last.
  const bytes = fs.readFileSync(filePath);
  form.append('file', new Blob([bytes], { type: 'image/webp' }), uploadName);

  const uploadResponse = await fetch(target.url, { method: 'POST', body: form });
  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Image upload failed for ${uploadName} [${uploadResponse.status}]: ${errorText}`);
  }

  return target.resourceUrl;
}

/**
 * Upload the given images in order and attach them to the product, returning the
 * created MediaImage nodes so callers can bind them to variants.
 */
export async function attachImages(url, headers, productId, images) {
  const media = [];
  for (const image of images) {
    const resourceUrl = await uploadImage(url, headers, image);
    media.push({
      originalSource: resourceUrl,
      alt: image.alt,
      mediaContentType: 'IMAGE',
    });
  }

  const result = await shopifyGraphql(url, headers, PRODUCT_CREATE_MEDIA_MUTATION, {
    productId,
    media,
  });
  assertNoUserErrors('productCreateMedia', result.productCreateMedia.mediaUserErrors);

  return result.productCreateMedia.media;
}

export async function fetchPublications(url, headers) {
  const data = await shopifyGraphql(url, headers, PUBLICATIONS_QUERY, {});
  return data.publications.nodes;
}

/**
 * Publish to every sales channel, matching the rest of the catalogue. The headless
 * storefront token is scoped to its own publication, so publishing to "Online Store"
 * alone leaves the product invisible to the Next.js app.
 *
 * Idempotent — safe to re-run to reconcile channels.
 */
export async function publishToChannels(url, headers, productId, publications) {
  if (publications.length === 0) return;

  const result = await shopifyGraphql(url, headers, PUBLISHABLE_PUBLISH_MUTATION, {
    id: productId,
    input: publications.map((publication) => ({ publicationId: publication.id })),
  });

  if (result.publishablePublish.userErrors?.length) {
    console.warn('    Publish warnings:', result.publishablePublish.userErrors);
  } else {
    console.log(`    Published to ${publications.length} sales channels.`);
  }
}

export async function resolveCollectionId(url, headers, handle) {
  const data = await shopifyGraphql(url, headers, COLLECTION_BY_HANDLE_QUERY, { handle });
  if (!data.collectionByHandle) {
    throw new Error(`Collection "${handle}" not found.`);
  }
  return data.collectionByHandle;
}
