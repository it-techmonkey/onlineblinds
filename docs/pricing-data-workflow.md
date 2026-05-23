# Pricing Data Workflow

Runtime pricing now reads from `src/data/pricing/pricing-data.json` by default. Neon is only needed during the temporary rollback/export window.

## Normal Runtime

- Production should use `PRICING_SOURCE=json` or leave `PRICING_SOURCE` unset.
- The app does not need `DATABASE_URL` for JSON pricing.
- Server-side checkout still recalculates prices before creating a Shopify draft order.

## Rollback Window

Set `PRICING_SOURCE=neon` only if you need to temporarily route pricing back through the old Prisma/Neon service. Keep `DATABASE_URL` available while this rollback option is needed.

After 3-7 days of clean production traffic, remove the rollback env var and then remove `DATABASE_URL` from Vercel.

## Updating Pricing Data

1. Update the Neon pricing tables while Neon is still the operational editing source.
2. Run `npm run pricing:export`.
3. Run `npm run pricing:validate`.
4. Run `npm run pricing:compare` while Neon is still available.
5. Commit the updated `src/data/pricing/pricing-data.json` and `src/data/pricing/pricing-report.json`.
6. Deploy and spot-check affected products.

## Shopify Reference Validation

Run this when Shopify product metafields may have changed:

```bash
npm run pricing:validate:shopify
```

This checks that Shopify `custom.price_band_name` values point to price bands present in the JSON file.

## Cart Behavior

Carts are local-browser only. They persist on the same device/browser using `localStorage`, including for signed-in users. Cross-device cart sync is intentionally removed to avoid runtime database usage.
