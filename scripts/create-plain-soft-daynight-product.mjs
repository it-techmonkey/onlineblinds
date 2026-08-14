// One-off script: creates "Plain Soft - Day and Night Blinds" in Shopify as a single
// product with one variant per colour, each variant bound to its own image.
//
// This is the first product in the catalogue with real variants. The storefront reads
// them via the Colour option — see ColourSelector on the product page — and checkout
// resolves the chosen colour's variant in src/lib/server/order.service.ts.
//
// Created as DRAFT, published to every sales channel so activating is one click.
// Safe to re-run — an existing product keeps its images and variants, and only has
// its SEO, metafields and sales channels re-synced.
//
// Usage:
//   node scripts/create-plain-soft-daynight-product.mjs --dry-run
//   node scripts/create-plain-soft-daynight-product.mjs

import fs from 'node:fs';
import path from 'node:path';
import {
  getAdminClient,
  shopifyGraphql,
  assertNoUserErrors,
  attachImages,
  fetchPublications,
  publishToChannels,
  resolveCollectionId,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_SET_MUTATION,
  PRODUCT_UPDATE_MUTATION,
  METAFIELDS_SET_MUTATION,
  COLLECTION_ADD_PRODUCTS_MUTATION,
} from './lib/shopify-admin.mjs';

const IMAGE_DIR = path.join(process.cwd(), 'new product');
const HANDLE = 'plain-soft-day-and-night-blinds';
const TITLE = 'Plain Soft - Day and Night Blinds';
const PRICE_BAND_NAME = 'Day and Night - Band A';
const PRODUCT_TYPE = 'Day & Night blinds';
const VENDOR = 'onlineblindsexpress';
const OPTION_NAME = 'Colour';
const TARGET_COLLECTION_HANDLE = 'day-and-night-blinds';

const SEO_TITLE = 'Plain Soft Day & Night Blinds | 13 Colours, Made to Measure';
const SEO_DESCRIPTION =
  'Plain Soft day and night blinds in 13 colours. Made to measure, with alternating sheer and solid fabric bands for flexible daylight and privacy control.';

// The product body is intentionally left empty — the product page falls back to the
// shared Day & Night copy in src/data/categoryContent.ts, as the rest of the range does.

// Colour name → source file. The file for Chocolate is misspelled "CHOCLATE" on disk.
// `tag` feeds the colour smart collections, which match on a lowercase colour tag.
const COLOURS = [
  { name: 'Beige', file: 'PLAINSOFT BEIGE.webp', tag: 'beige' }, // first = featured image
  { name: 'Anthracite', file: 'PLAINSOFT ANTHRACITE.webp', tag: 'grey' },
  { name: 'Blue', file: 'PLAINSOFT BLUE.webp', tag: 'blue' },
  { name: 'Brown', file: 'PLAINSOFT BROWN.webp', tag: 'brown' },
  { name: 'Chocolate', file: 'PLAINSOFT CHOCLATE.webp', tag: 'brown' },
  { name: 'Navy', file: 'PLAINSOFT NAVY.webp', tag: 'blue' },
  { name: 'Pink', file: 'PLAINSOFT PINK.webp', tag: 'pink' },
  { name: 'Purple', file: 'PLAINSOFT PURPLE.webp', tag: 'purple' },
  { name: 'Red', file: 'PLAINSOFT RED.webp', tag: 'red' },
  { name: 'Sage Green', file: 'PLAINSOFT SAGE GREEN.webp', tag: 'green' },
  { name: 'Sea Blue', file: 'PLAINSOFT SEA BLUE.webp', tag: 'blue' },
  { name: 'Silver', file: 'PLAINSOFT SILVER.webp', tag: 'grey' },
  { name: 'Steel', file: 'PLAINSOFT STEEL.webp', tag: 'grey' },
];

const BASE_TAGS = ['day-and-night-blinds', 'day_night_blinds', 'day_band_a', 'sample'];

function buildTags() {
  return [...new Set([...BASE_TAGS, ...COLOURS.map((colour) => colour.tag)])];
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Ordered image descriptors, one per colour — index matches COLOURS. */
function resolveImages() {
  return COLOURS.map((colour) => {
    const filePath = path.join(IMAGE_DIR, colour.file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Image not found: ${filePath}`);
    }

    return {
      colour: colour.name,
      filePath,
      uploadName: `${HANDLE}-${slugify(colour.name)}.webp`,
      alt: `Plain Soft Day & Night Blind — ${colour.name}`,
    };
  });
}

const VARIANTS_BULK_UPDATE_MUTATION = `
  mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        title
        image {
          url
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function syncMetafields(url, headers, productId) {
  const result = await shopifyGraphql(url, headers, METAFIELDS_SET_MUTATION, {
    metafields: [
      {
        ownerId: productId,
        namespace: 'custom',
        key: 'price_band_name',
        type: 'single_line_text_field',
        value: PRICE_BAND_NAME,
      },
    ],
  });
  assertNoUserErrors('metafieldsSet', result.metafieldsSet.userErrors);
  console.log(`    Set custom.price_band_name = "${PRICE_BAND_NAME}".`);
}

async function syncSeo(url, headers, productId) {
  const result = await shopifyGraphql(url, headers, PRODUCT_UPDATE_MUTATION, {
    product: {
      id: productId,
      seo: { title: SEO_TITLE, description: SEO_DESCRIPTION },
    },
  });
  assertNoUserErrors('productUpdate', result.productUpdate.userErrors);
  console.log('    Synced SEO title and description.');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { storeDomain, url, headers } = getAdminClient();

  console.log(dryRun ? 'DRY RUN — no changes will be made.\n' : `Store: ${storeDomain}\n`);

  const images = resolveImages();
  const tags = buildTags();

  const existing = await shopifyGraphql(url, headers, PRODUCT_BY_HANDLE_QUERY, { handle: HANDLE });
  const collection = await resolveCollectionId(url, headers, TARGET_COLLECTION_HANDLE);
  const publications = await fetchPublications(url, headers);

  console.log(`Target collection: ${collection.title} (${collection.id})`);
  console.log(`Sales channels:    ${publications.map((p) => p.name).join(', ')}\n`);

  if (dryRun) {
    console.log(`Would ${existing.productByHandle ? 'update' : 'create'} "${TITLE}"`);
    console.log(`  handle:      ${HANDLE}`);
    console.log(`  status:      DRAFT`);
    console.log(`  productType: ${PRODUCT_TYPE}`);
    console.log(`  vendor:      ${VENDOR}`);
    console.log(`  priceBand:   ${PRICE_BAND_NAME}`);
    console.log(`  option:      ${OPTION_NAME} (${COLOURS.length} values)`);
    console.log(`  tags:        ${tags.join(', ')}`);
    console.log(`  description: (empty — falls back to shared Day & Night category copy)`);
    console.log(`  seoTitle:    ${SEO_TITLE} (${SEO_TITLE.length} chars)`);
    console.log(`  seoDesc:     ${SEO_DESCRIPTION.length} chars`);
    console.log('  variants / images:');
    for (const [index, image] of images.entries()) {
      console.log(
        `    ${String(index + 1).padStart(2)}. ${image.colour.padEnd(11)} ${path.basename(image.filePath).padEnd(28)} -> ${image.uploadName}`
      );
    }
    console.log('\nDry run complete.');
    return;
  }

  if (existing.productByHandle) {
    const productId = existing.productByHandle.id;
    console.log(`Exists — ${productId}; re-syncing SEO, metafields and channels.`);
    await syncSeo(url, headers, productId);
    await syncMetafields(url, headers, productId);
    await publishToChannels(url, headers, productId, publications);
    console.log('\nDone.');
    return;
  }

  // Create the product with its Colour option and one variant per colour.
  const created = await shopifyGraphql(url, headers, PRODUCT_SET_MUTATION, {
    input: {
      title: TITLE,
      handle: HANDLE,
      status: 'DRAFT',
      productType: PRODUCT_TYPE,
      vendor: VENDOR,
      tags,
      productOptions: [
        {
          name: OPTION_NAME,
          values: COLOURS.map((colour) => ({ name: colour.name })),
        },
      ],
      variants: COLOURS.map((colour) => ({
        optionValues: [{ optionName: OPTION_NAME, name: colour.name }],
        price: '0.00',
        taxable: true,
      })),
    },
  });

  assertNoUserErrors('productSet', created.productSet.userErrors);
  const product = created.productSet.product;
  console.log(`Created "${product.title}" (${product.id}) with ${product.variants.nodes.length} variants.`);

  // Upload images in colour order — the first becomes the featured image.
  const media = await attachImages(url, headers, product.id, images);
  console.log(`    Attached ${media.length} images (featured: ${images[0].colour}).`);

  // Bind each variant to its own image so variant.image resolves on the storefront.
  const mediaIdByColour = new Map();
  media.forEach((node, index) => mediaIdByColour.set(images[index].colour, node.id));

  const variantUpdates = product.variants.nodes
    .map((variant) => {
      const colour = variant.selectedOptions.find((option) => option.name === OPTION_NAME)?.value;
      const mediaId = colour ? mediaIdByColour.get(colour) : undefined;
      return mediaId ? { id: variant.id, mediaId } : null;
    })
    .filter(Boolean);

  const bulk = await shopifyGraphql(url, headers, VARIANTS_BULK_UPDATE_MUTATION, {
    productId: product.id,
    variants: variantUpdates,
  });
  assertNoUserErrors('productVariantsBulkUpdate', bulk.productVariantsBulkUpdate.userErrors);
  console.log(`    Bound ${variantUpdates.length} variants to their colour images.`);

  await syncSeo(url, headers, product.id);
  await syncMetafields(url, headers, product.id);

  const added = await shopifyGraphql(url, headers, COLLECTION_ADD_PRODUCTS_MUTATION, {
    id: collection.id,
    productIds: [product.id],
  });
  assertNoUserErrors('collectionAddProducts', added.collectionAddProducts.userErrors);
  console.log(`    Added to the ${TARGET_COLLECTION_HANDLE} collection.`);

  await publishToChannels(url, headers, product.id, publications);

  console.log('\nDone. Product is DRAFT — review in Shopify admin, then set status to ACTIVE.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
