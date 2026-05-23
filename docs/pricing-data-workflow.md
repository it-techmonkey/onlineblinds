# Pricing Data Workflow

Runtime pricing now reads from `src/data/pricing/pricing-data.json`. Neon and Prisma have been removed from the app runtime.

## Runtime

- Runtime pricing reads from `src/data/pricing/pricing-data.json`.
- The app does not need `DATABASE_URL`, Prisma, Neon, or `PRICING_SOURCE`.
- Server-side checkout still recalculates prices before creating a Shopify draft order.
- Shopify catalog data uses a 1-hour cache by default to reduce Vercel ISR/data-cache writes without making normal catalog updates feel stale for too long. Redeploy after urgent Shopify product or collection edits, or lower `SHOPIFY_CACHE_REVALIDATE_SECONDS`, `SHOPIFY_ADMIN_PRODUCT_CACHE_REVALIDATE_SECONDS`, and `SERVER_API_CACHE_REVALIDATE_SECONDS` if fresher catalog reads matter more than Vercel usage.

## Updating Pricing Data

1. Update `src/data/pricing/pricing-data.json`.
2. Run `npm run pricing:validate`.
3. Run `npm run pricing:validate:shopify` when Shopify product metafields may have changed.
4. Commit the updated `src/data/pricing/pricing-data.json` and `src/data/pricing/pricing-report.json`.
5. Deploy and spot-check affected products.

## Shopify Reference Validation

Run this when Shopify product metafields may have changed:

```bash
npm run pricing:validate:shopify
```

This checks that Shopify `custom.price_band_name` values point to price bands present in the JSON file.

## Product CSV Export

Run this when you need a catalog CSV:

```bash
npm run export:products
```

The export reads base prices from `src/data/pricing/pricing-data.json`, not from Neon.

## Cart Behavior

Carts are local-browser only. They persist on the same device/browser using `localStorage`, including for signed-in users. Cross-device cart sync is intentionally removed to avoid runtime database usage.
