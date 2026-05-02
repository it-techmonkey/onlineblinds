const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { randomUUID } = require('crypto');
const { Client } = require('pg');

const ROOT = process.cwd();
const CSV_PATH = path.join(ROOT, 'products_export_1.csv');
const WORKBOOK_PATH = path.join(ROOT, 'pricebands', 'Roller Blinds Price band.xlsx');
const ROLLER_COLLECTION_ID = 'gid://shopify/Collection/462704476479';
const MOTORIZED_COLLECTION_ID = 'gid://shopify/Collection/696528241024';
const HEADLESS_PUBLICATION_ID = 'gid://shopify/Publication/333288472960';
const importMode = process.argv[2] === 'electrical' ? 'electrical' : 'standard';

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

const BAND_NAME_BY_TAG = {
  roller_40: 'Roller - Band A',
  roller_40_e: 'Roller - Band A',
  roller_36: 'Roller - Band C',
  roller_36_e: 'Roller - Band C',
  roller_34: 'Roller - Band D',
  roller_34_e: 'Roller - Band D',
  roller_24: 'Roller - Band E',
  roller_24_e: 'Roller - Band E',
  roller_241: 'Roller - Band E',
  roller_241_e: 'Roller - Band E',
  roller_22: 'Roller - Band F',
  roller_22_e: 'Roller - Band F',
  roller_20: 'Roller - Band G',
  roller_20_e: 'Roller - Band G',
  roller_16: 'Roller - Band Premium',
  roller_16_e: 'Roller - Band Premium',
  roller_14: 'Roller - Band Premium',
  roller_14_e: 'Roller - Band Premium',
};

function isElectricalRollerTag(tag) {
  return tag.startsWith('roller_') && tag.endsWith('_e');
}

function productIsElectrical(product) {
  return product.tags.some((tag) => isElectricalRollerTag(tag));
}

function runPython(code, args = []) {
  const result = spawnSync('python', ['-c', code, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 100,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'Python command failed');
  }

  return result.stdout.trim();
}

function parseWorkbook() {
  const pythonCode = `
import json
import sys
from openpyxl import load_workbook

workbook_path = sys.argv[1]
wb = load_workbook(workbook_path, data_only=True)
ws = wb[wb.sheetnames[0]]

starts = []
for row in range(1, ws.max_row + 1):
    value = ws.cell(row, 1).value
    if isinstance(value, str) and value.strip().upper().startswith('BAND'):
        starts.append(row)

sections = []
for idx, start in enumerate(starts):
    end = starts[idx + 1] - 1 if idx + 1 < len(starts) else ws.max_row
    raw_name = str(ws.cell(start, 1).value).strip().upper()
    if raw_name == 'BAND - PREMIUM':
        band_name = 'Roller - Band Premium'
    else:
        suffix = raw_name.replace('BAND', '').strip()
        band_name = f'Roller - Band {suffix}'

    widths = []
    col = 3
    while ws.cell(start + 1, col).value is not None:
        widths.append(int(ws.cell(start + 1, col).value))
        col += 1

    heights = []
    prices = []
    row = start + 3
    while row <= end:
        height_value = ws.cell(row, 1).value
        if height_value is None:
            row += 1
            continue
        if isinstance(height_value, str):
            break

        heights.append(int(height_value))
        price_row = []
        for price_col in range(3, 3 + len(widths)):
            value = ws.cell(row, price_col).value
            price_row.append(None if value is None else round(float(value), 2))
        prices.append(price_row)
        row += 1

    sections.append({
        'name': band_name,
        'widthsMm': widths,
        'heightsMm': heights,
        'prices': prices,
    })

print(json.dumps(sections))
`;

  return JSON.parse(runPython(pythonCode, [WORKBOOK_PATH]));
}

function parseProducts() {
  const pythonCode = `
import csv
import json
import sys
from collections import OrderedDict

csv_path = sys.argv[1]

def first_non_empty(rows, key):
    for row in rows:
        value = row.get(key, '').strip()
        if value:
            return value
    return ''

products = OrderedDict()

with open(csv_path, newline='', encoding='utf-8-sig') as handle:
    reader = csv.DictReader(handle)
    for row in reader:
        product_handle = row['Handle'].strip()
        if not product_handle:
            continue
        products.setdefault(product_handle, []).append(row)

result = []
for product_handle, rows in products.items():
    tags_value = first_non_empty(rows, 'Tags')
    tags = [tag.strip() for tag in tags_value.split(',') if tag.strip()]
    if not any(tag.startswith('roller_') for tag in tags):
        continue

    images = []
    seen_images = set()
    for row in rows:
        src = row.get('Image Src', '').strip()
        if src and src not in seen_images:
            seen_images.add(src)
            images.append({
                'src': src,
                'alt': row.get('Image Alt Text', '').strip(),
                'position': row.get('Image Position', '').strip(),
            })

    result.append({
        'handle': product_handle,
        'title': first_non_empty(rows, 'Title'),
        'bodyHtml': first_non_empty(rows, 'Body (HTML)'),
        'vendor': first_non_empty(rows, 'Vendor'),
        'productType': first_non_empty(rows, 'Type'),
        'tags': tags,
        'published': first_non_empty(rows, 'Published').lower() == 'true',
        'status': (first_non_empty(rows, 'Status') or 'draft').lower(),
        'variantSku': first_non_empty(rows, 'Variant SKU'),
        'variantGrams': first_non_empty(rows, 'Variant Grams'),
        'variantInventoryPolicy': first_non_empty(rows, 'Variant Inventory Policy'),
        'variantFulfillmentService': first_non_empty(rows, 'Variant Fulfillment Service'),
        'variantRequiresShipping': first_non_empty(rows, 'Variant Requires Shipping').lower() != 'false',
        'variantTaxable': first_non_empty(rows, 'Variant Taxable').lower() != 'false',
        'variantWeightUnit': first_non_empty(rows, 'Variant Weight Unit') or 'kg',
        'costPerItem': first_non_empty(rows, 'Cost per item'),
        'seoTitle': first_non_empty(rows, 'SEO Title'),
        'seoDescription': first_non_empty(rows, 'SEO Description'),
        'subtitle': first_non_empty(rows, 'subtitle (product.metafields.custom.subtitle)'),
        'images': images,
    })

print(json.dumps(result))
`;

  return JSON.parse(runPython(pythonCode, [CSV_PATH]));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}, attempt = 1) {
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    let json = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

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
    const transientNetworkError =
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'UND_ERR_CONNECT_TIMEOUT' ||
      code === 'UND_ERR_SOCKET';

    if (attempt < 6 && transientNetworkError) {
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

async function adminRest(endpoint, method = 'GET', body = null) {
  return fetchJson(
    `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/2025-01${endpoint}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
}

async function fetchProductImages(productId) {
  const response = await adminRest(`/products/${productId}/images.json`, 'GET');
  return response.images || [];
}

async function deleteProductImage(productId, imageId) {
  await adminRest(`/products/${productId}/images/${imageId}.json`, 'DELETE');
}

async function fetchAllShopifyProducts() {
  const products = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const json = await adminGraphQL(
      `
        query Products($cursor: String) {
          products(first: 250, after: $cursor) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                legacyResourceId
                handle
                resourcePublications(first: 10) {
                  edges {
                    node {
                      publication {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      { cursor }
    );

    const data = json.data.products;
    for (const edge of data.edges) {
      products.push(edge.node);
    }
    hasNextPage = data.pageInfo.hasNextPage;
    cursor = data.pageInfo.endCursor;
  }

  return products;
}

async function publishablePublish(id, publicationId) {
  const publishResult = await adminGraphQL(
    `
      mutation PublishResource($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) {
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      id,
      input: [{ publicationId }],
    }
  );

  const userErrors = publishResult.data.publishablePublish.userErrors;
  if (userErrors.length > 0) {
    throw new Error(`Publish failed for ${id}: ${JSON.stringify(userErrors)}`);
  }
}

async function fetchCollectionProductIds(collectionId) {
  const productIds = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const json = await adminGraphQL(
      `
        query CollectionProducts($id: ID!, $cursor: String) {
          collection(id: $id) {
            products(first: 250, after: $cursor) {
              pageInfo {
                hasNextPage
                endCursor
              }
              edges {
                node {
                  id
                  handle
                  tags
                }
              }
            }
          }
        }
      `,
      { id: collectionId, cursor }
    );

    const products = json.data.collection?.products;
    if (!products) {
      break;
    }

    for (const edge of products.edges) {
      productIds.push(edge.node);
    }

    hasNextPage = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
  }

  return productIds;
}

async function removeProductsFromCollection(collectionId, productIds) {
  if (productIds.length === 0) {
    return;
  }

  for (let index = 0; index < productIds.length; index += 250) {
    const batch = productIds.slice(index, index + 250);
    const removeResult = await adminGraphQL(
      `
        mutation RemoveProductsFromCollection($id: ID!, $productIds: [ID!]!) {
          collectionRemoveProducts(id: $id, productIds: $productIds) {
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        id: collectionId,
        productIds: batch,
      }
    );

    const userErrors = removeResult.data.collectionRemoveProducts.userErrors;
    if (userErrors.length > 0) {
      throw new Error(`Collection remove failed: ${JSON.stringify(userErrors)}`);
    }
  }
}

async function importMissingBands(dbClient, sections) {
  const widthResult = await dbClient.query(
    'select id, "widthMm", "widthInches", "sortOrder" from "WidthBand" order by "sortOrder", "widthMm"'
  );
  const heightResult = await dbClient.query(
    'select id, "heightMm", "heightInches", "sortOrder" from "HeightBand" order by "sortOrder", "heightMm"'
  );
  const bandResult = await dbClient.query('select id, name from "PriceBand"');

  const widthByMm = new Map(widthResult.rows.map((row) => [Number(row.widthMm), row]));
  const heightByMm = new Map(heightResult.rows.map((row) => [Number(row.heightMm), row]));
  const existingBands = new Set(bandResult.rows.map((row) => row.name));

  let maxWidthSort = widthResult.rows.reduce((max, row) => Math.max(max, Number(row.sortOrder)), 0);
  let maxHeightSort = heightResult.rows.reduce((max, row) => Math.max(max, Number(row.sortOrder)), 0);
  const insertedBands = [];

  await dbClient.query('BEGIN');
  try {
    for (const section of sections) {
      if (existingBands.has(section.name)) {
        continue;
      }

      for (const widthMm of section.widthsMm) {
        if (!widthByMm.has(widthMm)) {
          maxWidthSort += 1;
          const widthInches = Math.round(widthMm / 25.4);
          const widthBandId = randomUUID();
          const inserted = await dbClient.query(
            'insert into "WidthBand" (id, "widthMm", "widthInches", "sortOrder", "createdAt") values ($1, $2, $3, $4, now()) returning id, "widthMm", "widthInches", "sortOrder"',
            [widthBandId, widthMm, widthInches, maxWidthSort]
          );
          widthByMm.set(widthMm, inserted.rows[0]);
        }
      }

      for (const heightMm of section.heightsMm) {
        if (!heightByMm.has(heightMm)) {
          maxHeightSort += 1;
          const heightInches = Math.round(heightMm / 25.4);
          const heightBandId = randomUUID();
          const inserted = await dbClient.query(
            'insert into "HeightBand" (id, "heightMm", "heightInches", "sortOrder", "createdAt") values ($1, $2, $3, $4, now()) returning id, "heightMm", "heightInches", "sortOrder"',
            [heightBandId, heightMm, heightInches, maxHeightSort]
          );
          heightByMm.set(heightMm, inserted.rows[0]);
        }
      }

      const priceBandId = randomUUID();
      const bandInsert = await dbClient.query(
        'insert into "PriceBand" (id, name, "createdAt", "updatedAt") values ($1, $2, now(), now()) returning id, name',
        [priceBandId, section.name]
      );
      const insertedPriceBandId = bandInsert.rows[0].id;

      for (let rowIndex = 0; rowIndex < section.heightsMm.length; rowIndex += 1) {
        const heightMm = section.heightsMm[rowIndex];
        const heightBandId = heightByMm.get(heightMm).id;

        for (let colIndex = 0; colIndex < section.widthsMm.length; colIndex += 1) {
          const widthMm = section.widthsMm[colIndex];
          const widthBandId = widthByMm.get(widthMm).id;
          const price = section.prices[rowIndex][colIndex];

          if (price == null) {
            continue;
          }

          const priceCellId = randomUUID();
          await dbClient.query(
            'insert into "PriceCell" (id, "priceBandId", "widthBandId", "heightBandId", price, "createdAt", "updatedAt") values ($1, $2, $3, $4, $5, now(), now())',
            [priceCellId, insertedPriceBandId, widthBandId, heightBandId, price]
          );
        }
      }

      insertedBands.push(section.name);
    }

    await dbClient.query('COMMIT');
  } catch (error) {
    await dbClient.query('ROLLBACK');
    throw error;
  }

  return insertedBands;
}

function normalizeStatus(status, published) {
  if (status === 'active' || status === 'draft' || status === 'archived') {
    return status;
  }
  return published ? 'active' : 'draft';
}

function buildProductPayload(product) {
  const variant = {
    option1: 'Default Title',
    price: '0.00',
    compare_at_price: null,
    sku: product.variantSku || undefined,
    grams: product.variantGrams ? Number(product.variantGrams) : 0,
    inventory_management: null,
    inventory_policy: product.variantInventoryPolicy || 'deny',
    fulfillment_service: product.variantFulfillmentService || 'manual',
    requires_shipping: product.variantRequiresShipping,
    taxable: product.variantTaxable,
    weight_unit: product.variantWeightUnit || 'kg',
  };

  const metafields = [
    {
      namespace: 'custom',
      key: 'price_band_name',
      type: 'single_line_text_field',
      value: product.priceBandName,
    },
  ];

  if (product.subtitle) {
    metafields.push({
      namespace: 'custom',
      key: 'subtitle',
      type: 'single_line_text_field',
      value: product.subtitle,
    });
  }

  return {
    product: {
      title: product.title,
      body_html: product.bodyHtml || undefined,
      vendor: product.vendor || undefined,
      product_type: product.productType || undefined,
      handle: product.handle,
      tags: product.tags.join(', '),
      status: normalizeStatus(product.status, product.published),
      published: product.published,
      variants: [variant],
      options: [{ name: 'Title' }],
      images: product.images.map((image) => ({
        src: image.src,
        alt: image.alt || undefined,
        position: image.position ? Number(image.position) : undefined,
      })),
      metafields,
    },
  };
}

function buildProductUpdatePayload(product, productId) {
  return {
    product: {
      id: productId,
      title: product.title,
      body_html: product.bodyHtml || undefined,
      vendor: product.vendor || undefined,
      product_type: product.productType || undefined,
      handle: product.handle,
      tags: product.tags.join(', '),
      status: normalizeStatus(product.status, product.published),
      published: product.published,
      images: product.images.map((image) => ({
        src: image.src,
        alt: image.alt || undefined,
        position: image.position ? Number(image.position) : undefined,
      })),
    },
  };
}

async function syncExistingProductFromCsv(existing, product) {
  const legacyId = existing.legacyResourceId;
  const existingImages = await fetchProductImages(legacyId);

  for (const image of existingImages) {
    await deleteProductImage(legacyId, image.id);
  }

  const updated = await adminRest(
    `/products/${legacyId}.json`,
    'PUT',
    buildProductUpdatePayload(product, legacyId)
  );

  return {
    legacyId,
    graphQlId: existing.id,
    product: updated.product,
  };
}

async function upsertRollerProducts(products) {
  const existingProducts = await fetchAllShopifyProducts();
  const existingByHandle = new Map(existingProducts.map((product) => [product.handle, product]));
  const targetCollectionId =
    importMode === 'electrical' ? MOTORIZED_COLLECTION_ID : ROLLER_COLLECTION_ID;

  const createdHandles = [];
  const updatedHandles = [];
  const skippedExistingHandles = [];
  const productIdsForCollection = [];
  const countsByBand = new Map();

  await publishablePublish(targetCollectionId, HEADLESS_PUBLICATION_ID);

  let removedNonElectricalFromMotorized = 0;
  if (importMode === 'electrical') {
    const collectionProducts = await fetchCollectionProductIds(MOTORIZED_COLLECTION_ID);
    const nonElectricalProductIds = collectionProducts
      .filter((product) => {
        const hasRollerBandTag = product.tags.some((tag) => tag.startsWith('roller_'));
        return hasRollerBandTag && !product.tags.some((tag) => isElectricalRollerTag(tag));
      })
      .map((product) => product.id);

    removedNonElectricalFromMotorized = nonElectricalProductIds.length;
    await removeProductsFromCollection(MOTORIZED_COLLECTION_ID, nonElectricalProductIds);
  }

  for (const product of products) {
    countsByBand.set(product.priceBandName, (countsByBand.get(product.priceBandName) || 0) + 1);

    const payload = buildProductPayload(product);
    const existing = existingByHandle.get(product.handle);
    let legacyId;
    let graphQlId;

    if (existing) {
      const synced = await syncExistingProductFromCsv(existing, product);
      legacyId = synced.legacyId;
      graphQlId = existing.id;
      updatedHandles.push(product.handle);
    } else {
      const created = await adminRest('/products.json', 'POST', payload);
      legacyId = created.product.id;
      graphQlId = `gid://shopify/Product/${legacyId}`;
      createdHandles.push(product.handle);
    }

    productIdsForCollection.push(graphQlId);

    const existingPublicationIds = new Set(
      (existing?.resourcePublications?.edges || []).map((edge) => edge.node.publication.id)
    );

    if (!existingPublicationIds.has(HEADLESS_PUBLICATION_ID)) {
      const publishResult = await adminGraphQL(
        `
          mutation PublishProduct($id: ID!, $input: [PublicationInput!]!) {
            publishablePublish(id: $id, input: $input) {
              userErrors {
                field
                message
              }
            }
          }
        `,
        {
          id: graphQlId,
          input: [{ publicationId: HEADLESS_PUBLICATION_ID }],
        }
      );

      const userErrors = publishResult.data.publishablePublish.userErrors;
      if (userErrors.length > 0) {
        throw new Error(`Publish failed for ${product.handle}: ${JSON.stringify(userErrors)}`);
      }
    }
  }

  for (let index = 0; index < productIdsForCollection.length; index += 250) {
    const batch = productIdsForCollection.slice(index, index + 250);
    const addResult = await adminGraphQL(
      `
        mutation AddProductsToCollection($id: ID!, $productIds: [ID!]!) {
          collectionAddProducts(id: $id, productIds: $productIds) {
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        id: targetCollectionId,
        productIds: batch,
      }
    );

    const userErrors = addResult.data.collectionAddProducts.userErrors;
    const unexpectedErrors = userErrors.filter(
      (error) => !error.message.toLowerCase().includes('already exists')
    );

    if (unexpectedErrors.length > 0) {
      throw new Error(`Collection add failed: ${JSON.stringify(unexpectedErrors)}`);
    }
  }

  return {
    createdHandles,
    updatedHandles,
    skippedExistingHandles,
    countsByBand: Object.fromEntries([...countsByBand.entries()].sort()),
    removedNonElectricalFromMotorized,
    targetCollectionId,
  };
}

async function main() {
  const sections = parseWorkbook();
  const missingSections = sections.filter((section) =>
    ['Roller - Band F', 'Roller - Band G', 'Roller - Band Premium'].includes(section.name)
  );

  const parsedProducts = parseProducts();
  const products = parsedProducts
    .filter((product) => product.status === 'active')
    .filter((product) =>
      importMode === 'electrical'
        ? productIsElectrical(product)
        : !productIsElectrical(product)
    )
    .map((product) => {
      const priceBandName = product.tags
        .map((tag) => BAND_NAME_BY_TAG[tag])
        .find(Boolean);

      if (!priceBandName) {
        return null;
      }

      return {
        ...product,
        priceBandName,
      };
    })
    .filter(Boolean);

  const dbClient = new Client({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await dbClient.connect();
  let insertedBands = [];

  try {
    insertedBands = await importMissingBands(dbClient, missingSections);
  } finally {
    await dbClient.end();
  }

  const uploadSummary = await upsertRollerProducts(products);

  console.log(
    JSON.stringify(
      {
        mode: importMode,
        insertedBands,
        totalRollerProducts: products.length,
        createdProducts: uploadSummary.createdHandles.length,
        updatedProducts: uploadSummary.updatedHandles.length,
        skippedExistingProducts: uploadSummary.skippedExistingHandles.length,
        countsByBand: uploadSummary.countsByBand,
        removedNonElectricalFromMotorized: uploadSummary.removedNonElectricalFromMotorized,
        targetCollectionId: uploadSummary.targetCollectionId,
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
