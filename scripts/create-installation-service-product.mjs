// One-off script: creates the "Installation Service" product in Shopify via the Admin API,
// with 3 variants (one per pricing tier) used as synthetic checkout line items by
// src/lib/server/order.service.ts. Safe to re-run — exits early if the product already exists.
//
// Usage: node scripts/create-installation-service-product.mjs

import fs from 'node:fs';
import path from 'node:path';

const SHOPIFY_API_VERSION = '2025-01';
const PRODUCT_HANDLE = 'installation-service';
const PRODUCT_TITLE = 'Installation Service';
const CURRENCY = 'GBP';

// Must stay in sync with INSTALLATION_SERVICE_TIERS in src/lib/pricing.ts
const TIERS = [
  { optionValue: '1 Blind', price: '40.00' },
  { optionValue: '2-5 Blinds', price: '60.00' },
  { optionValue: '6+ Blinds', price: '85.00' },
];

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

function loadEnv() {
  loadEnvFile(path.join(process.cwd(), '.env.local'));
  loadEnvFile(path.join(process.cwd(), '.env'));
}

function requiredEnv(name, fallbackName) {
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

async function shopifyGraphql(url, headers, query, variables) {
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

const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      handle
      title
      variants(first: 10) {
        nodes {
          id
          title
          price
        }
      }
    }
  }
`;

const PRODUCT_SET_MUTATION = `
  mutation ProductSet($input: ProductSetInput!) {
    productSet(input: $input) {
      product {
        id
        handle
        title
        variants(first: 10) {
          nodes {
            id
            title
            price
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

const PUBLICATIONS_QUERY = `
  query Publications {
    publications(first: 10) {
      nodes {
        id
        name
      }
    }
  }
`;

async function main() {
  loadEnv();

  const storeDomain = normalizeDomain(requiredEnv('SHOPIFY_STORE_DOMAIN', 'NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN'));
  const adminToken = requiredEnv('SHOPIFY_ADMIN_ACCESS_TOKEN');
  const url = `https://${storeDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': adminToken,
  };

  const existing = await shopifyGraphql(url, headers, PRODUCT_BY_HANDLE_QUERY, {
    handle: PRODUCT_HANDLE,
  });

  if (existing.productByHandle) {
    console.log(`Product "${PRODUCT_HANDLE}" already exists (id: ${existing.productByHandle.id}). Nothing to do.`);
    console.log('Variants:');
    for (const variant of existing.productByHandle.variants.nodes) {
      console.log(`  - ${variant.title}: ${variant.price} (id: ${variant.id})`);
    }
    return;
  }

  const result = await shopifyGraphql(url, headers, PRODUCT_SET_MUTATION, {
    input: {
      title: PRODUCT_TITLE,
      handle: PRODUCT_HANDLE,
      productType: 'Service',
      status: 'ACTIVE',
      productOptions: [
        {
          name: 'Tier',
          values: TIERS.map((tier) => ({ name: tier.optionValue })),
        },
      ],
      variants: TIERS.map((tier) => ({
        optionValues: [{ optionName: 'Tier', name: tier.optionValue }],
        price: tier.price,
        taxable: true,
        inventoryPolicy: 'CONTINUE',
      })),
    },
  });

  const { product, userErrors } = result.productSet;

  if (userErrors?.length) {
    throw new Error(`Shopify userErrors: ${JSON.stringify(userErrors)}`);
  }

  console.log(`Created product "${product.title}" (handle: ${product.handle}, id: ${product.id}).`);
  console.log('Variants:');
  for (const variant of product.variants.nodes) {
    console.log(`  - ${variant.title}: ${variant.price} (id: ${variant.id})`);
  }

  // Publish to the Online Store sales channel so the variants are orderable via draft orders.
  const publications = await shopifyGraphql(url, headers, PUBLICATIONS_QUERY, {});
  const onlineStore = publications.publications.nodes.find((p) => p.name === 'Online Store');

  if (onlineStore) {
    const publishResult = await shopifyGraphql(url, headers, PUBLISHABLE_PUBLISH_MUTATION, {
      id: product.id,
      input: [{ publicationId: onlineStore.id }],
    });

    if (publishResult.publishablePublish.userErrors?.length) {
      console.warn('Publish warnings:', publishResult.publishablePublish.userErrors);
    } else {
      console.log('Published to Online Store sales channel.');
    }
  }

  console.log('\nDone. This product handle ("installation-service") is referenced in src/lib/server/order.service.ts.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
