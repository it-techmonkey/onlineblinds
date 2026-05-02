const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

function loadEnv(filePath) {
  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .filter((line) => !line.startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1).replace(/^"|"$/g, '')];
      })
  );
}

const env = loadEnv(path.join(ROOT, '.env'));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}, attempt = 1) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    const json = text ? JSON.parse(text) : null;

    const throttled =
      response.status === 429 ||
      text.includes('THROTTLED') ||
      text.includes('throttled') ||
      text.includes('Too Many Requests');

    if (!response.ok || (json && json.errors)) {
      if (attempt < 6 && throttled) {
        await sleep(1000 * attempt);
        return fetchJson(url, options, attempt + 1);
      }

      throw new Error(
        `Request failed (${response.status}) ${url}\n${text || JSON.stringify(json)}`
      );
    }

    return json;
  } catch (error) {
    const code = error?.cause?.code || error?.code || '';
    if (attempt < 6 && ['ECONNRESET', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET'].includes(code)) {
      await sleep(1000 * attempt);
      return fetchJson(url, options, attempt + 1);
    }

    throw error;
  }
}

async function adminGraphQL(query, variables = {}) {
  return fetchJson(
    `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );
}

async function adminRest(endpoint, method = 'GET') {
  return fetchJson(
    `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-01${endpoint}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      },
    }
  );
}

async function fetchElectricalRollerProducts() {
  const queryString =
    'tag:roller_40_e OR tag:roller_36_e OR tag:roller_34_e OR tag:roller_24_e OR ' +
    'tag:roller_241_e OR tag:roller_22_e OR tag:roller_20_e OR tag:roller_16_e OR tag:roller_14_e';

  const products = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const json = await adminGraphQL(
      `
        query ElectricalRollers($query: String!, $cursor: String) {
          products(first: 250, after: $cursor, query: $query) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                legacyResourceId
                handle
                title
                tags
              }
            }
          }
        }
      `,
      { query: queryString, cursor }
    );

    const data = json.data.products;
    products.push(...data.edges.map((edge) => edge.node));
    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }

  return products.filter((product) =>
    product.tags.some((tag) => tag.startsWith('roller_') && tag.endsWith('_e'))
  );
}

async function main() {
  const products = await fetchElectricalRollerProducts();

  for (const product of products) {
    await adminRest(`/products/${product.legacyResourceId}.json`, 'DELETE');
  }

  console.log(
    JSON.stringify(
      {
        deletedCount: products.length,
        deletedHandles: products.map((product) => product.handle),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
