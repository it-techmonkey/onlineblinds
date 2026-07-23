// One-off script: creates a "Best Sellers" smart collection in Shopify via the Admin API.
// The collection matches all products (rule: title != "") so Shopify's own BEST_SELLING
// sort key can rank them by real sales data when the storefront queries this collection.
//
// Usage: node scripts/create-best-sellers-collection.mjs

import fs from 'node:fs';
import path from 'node:path';

const SHOPIFY_API_VERSION = '2025-01';
const COLLECTION_HANDLE = 'best-sellers';
const COLLECTION_TITLE = 'Best Sellers';

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
    throw new Error(`Shopify GraphQL error: ${json.errors[0].message}`);
  }

  return json.data;
}

const COLLECTION_BY_HANDLE_QUERY = `
  query CollectionByHandle($handle: String!) {
    collectionByHandle(handle: $handle) {
      id
      handle
      title
    }
  }
`;

const COLLECTION_CREATE_MUTATION = `
  mutation CollectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        id
        handle
        title
      }
      userErrors {
        field
        message
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

  const existing = await shopifyGraphql(url, headers, COLLECTION_BY_HANDLE_QUERY, {
    handle: COLLECTION_HANDLE,
  });

  if (existing.collectionByHandle) {
    console.log(
      `Collection "${COLLECTION_HANDLE}" already exists (id: ${existing.collectionByHandle.id}). Nothing to do.`
    );
    return;
  }

  const result = await shopifyGraphql(url, headers, COLLECTION_CREATE_MUTATION, {
    input: {
      title: COLLECTION_TITLE,
      handle: COLLECTION_HANDLE,
      ruleSet: {
        appliedDisjunctively: false,
        rules: [
          {
            column: 'TAG',
            relation: 'NOT_EQUALS',
            condition: '__onlineblinds_best_sellers_catch_all__',
          },
        ],
      },
    },
  });

  const { collection, userErrors } = result.collectionCreate;

  if (userErrors?.length) {
    throw new Error(`Shopify userErrors: ${JSON.stringify(userErrors)}`);
  }

  console.log(`Created collection "${collection.title}" (handle: ${collection.handle}, id: ${collection.id}).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
