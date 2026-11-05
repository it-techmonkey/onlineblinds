# Promotions: codes, signup popup and temporary price increase

Added 4 November 2026. Everything is set in one file, `src/data/promotions.ts`, which both the Next.js site and the Shopify theme use.

## Black Friday campaign — November 2026

- Shared campaign settings: `BLACK_FRIDAY_PROMOTION` in `src/data/promotions.ts`.
- Deadline: **30 November 2026, 11:59 pm UK time**, including that final minute. The exclusive cutoff is `2026-12-01T00:00:00Z` (UK is on GMT). The announcement countdown shows days, hours, minutes and seconds to this fixed instant, independent of the visitor's timezone; it does not reset at midnight.
- Design: charcoal announcement bar, existing room photography with darker hero overlays, a Black Friday first slide, a small collection label and restrained product discount styling. The hero shows the selected code's actual extra discount (currently 20%), separately from the existing “up to 60% off” headline.
- `src/hooks/useBlackFridaySale.ts` keeps the components on the same deadline. At expiry, countdowns and campaign labels disappear and the default homepage slides return. Shopify custom slides keep their merchant-provided content. Cached pages update after hydration.
- These are presentation changes. Pricing, the code picker, cart application and newsletter discount remain as documented below. The Shopify discount's own expiry must be configured in Shopify; the visual countdown does not disable a checkout code.
- Both storefronts use the same React components. Run the Shopify theme build/check below after changing them. No LPO formula or price sync is needed for campaign artwork/copy changes.

### Rollout — 4 November 2026

- **Shopify live:** published to the existing live theme `200474362240` at `www.onlineblindsexpress.co.uk`. Only `assets/ob-storefront.css`, `assets/ob-storefront.js`, `sections/ob-announcement.liquid` and `snippets/ob-category-heroes.liquid` were uploaded. The previous copies are in `.shopify-work/backup-black-friday-live-2026-11-04/`.
- Public home, collection and product pages verified at 390px and 1440px: campaign and deadline visible, no horizontal overflow or JavaScript errors. Results: `.shopify-work/black-friday-live-check.json`.
- **Shopify-only rollout (owner instruction):** skip Vercel and publish only to Shopify. The Next.js implementation, production build and local browser checks passed, but it has not been deployed; `onlineblinds.vercel.app` still serves the previous version. DNS and domain routing were not changed.
- **Hero follow-up:** removed the “Ends 30 November · 11:59 pm UK time” line beneath the homepage banner button. The announcement/product countdowns and the campaign expiry remain unchanged.
- **Product/collection follow-up:** removed the separate product countdown/code panel. The product-price code badge remains. `shopify-src/catalog-data.ts` resolves all catalog card prices from the current `window.OnlineBlinds.minimumPrices` map before rendering and sorting; this prevents old collection, search and related-product snapshot prices from disagreeing with product pages after a price sync (e.g. Unity Polaris £44.86 → £56.08).
- The product/collection fix is live on Shopify. Verified 120 collection cards across ascending/descending sorting, pagination, roller, motorised and vertical collections; 78 search results; four related products; and the linked Unity Polaris product at £56.08. The countdown/code panel is absent and desktop/mobile layouts pass. Results: `.shopify-work/collection-price-live-check.json`.

## Sale presentation — 5 November 2026

- Main banner leads with “Up to 60% off”, followed by made-to-measure messaging, “Take an extra 20% off” and a copyable selected code. The other slides lead with blackout comfort and room transformation. Buttons link directly to shopping destinations.
- The first banner links to `#black-friday-bestsellers`. That section uses “Shop Black Friday Bestsellers” during the campaign, with a mobile-visible shopping link, then returns to its regular heading at expiry.
- Product pages show a separate, clearly labelled price with the selected code beneath the standard price. The amount follows the same current price and selected options as the normal product price. It says “From” while showing the starting price. Example: £56.08 standard → £44.86 with a 20% code. No base prices or discount rates were changed.
- “Final days” appears only in the announcement bar during the last 72 hours (from 28 November, 00:00 UK time). The fixed 30 November deadline remains. Removed hero deadline text and the separate product countdown panel stay removed.
- Owner instruction: retain the existing viewer-count section. Deploy to Shopify only; Vercel remains out of scope.
- **Published 5 November:** updated the live theme's storefront JS/CSS, announcement section and bestseller section. Rollback copies: `.shopify-work/black-friday-conversion-2026-11-05/live-backup/`.
- **Verification:** TypeScript and changed-component lint pass; theme validation reports zero errors (nine existing warnings). Live checks at 320/390/768/1440px cover all three slides, bestseller anchor, code copying/selection, starting and configured code prices (including motorisation), final-72-hour wording and expiry. The viewer-count source is unchanged. Reports and screenshots: `.shopify-work/black-friday-conversion-2026-11-05/`.
- **Next.js build note:** the default Turbopack build hit the existing Google-font resolver error. Webpack compiled, passed TypeScript and generated 1,995 pages, but emitted catalog-fetch warnings. Vercel was not deployed; the validated Shopify theme build is separate.

## What is on

| Feature | Where |
|---|---|
| Code picker in the announcement bar. It shows one code, with a dropdown of all four 20% codes: `BLKFRIDAY60` (default), `XMASOFF`, `BOXOFF`, `NEWYROFF`. The choice is remembered in the browser. | `src/components/layout/AnnouncementBar.tsx` |
| The chosen code beside the product price. | `src/components/product/PromoCodeBadge.tsx` |
| The cart applies the chosen code automatically. If the customer removes it, it isn't added again that visit. A cart holds at most one of the four codes, plus other codes such as `SUBSCRIBE15`. | `src/app/cart/page.tsx`, `src/context/CartContext.tsx`, `shopify-src/cart-design.tsx` |
| "Sign up and get 15% off" popup after 5 seconds. Shown once per visitor: never again after signing up, and not for 7 days after closing it. It reveals `SUBSCRIBE15`. The home page signup form gives the same code. | `src/components/layout/SignupPopup.tsx`, `src/components/home/EmailCapture.tsx` |
| Base prices up 25% (`BASE_PRICE_MULTIPLIER = 1.25`). Only the size price from the price tables and the replacement slat prices go up. Extras such as motors, brackets and cassettes do not. | `src/lib/server/pricing.service.ts`, `src/lib/vertical-blinds.ts` |

Discount totals follow Shopify's rule: percentage codes are each taken from the same subtotal, so 20% + 15% = 35% off.

### Shopify settings this relies on

- All five codes must be **Amount off order** codes set to **combine with other order discounts**. Otherwise Shopify keeps only the better code at checkout.
- `SUBSCRIBE15` is limited to the **Email subscribers** segment. Both signup forms subscribe the customer: the live site through `/api/newsletter/subscribe`, the Shopify theme through Shopify's own customer form.

## Change the codes

Edit `PROMO_COUPONS` or `DEFAULT_PROMO_CODE` in `src/data/promotions.ts`, then deploy the site and push the theme (see "Shopify theme" below). Each code must also exist in Shopify.

## Roll back the price increase

1. Set `BASE_PRICE_MULTIPLIER` to `1` in `src/data/promotions.ts`.
2. **Next.js site:** commit and deploy.
3. **Shopify:** run the price sync below, then push the theme.

The site and Shopify change separately, so do both close together.

### Shopify price sync

Shopify prices come from the Live Product Options (LPO) formulas, which hold their own copy of the price tables. Each build step regenerates a category's formulas from `promotions.ts` and stops at the first price that differs from the website calculator.

```powershell
node scripts/shopify-preview/pricing.mjs
node scripts/shopify-preview/lpo-slim-day-night.mjs
node scripts/shopify-preview/lpo-generic-build.mjs roller
foreach ($c in 'vertical','roman','venetian','no-drill','faux-wood','easy-stick','skylight','other') { node scripts/shopify-preview/lpo-kind-build.mjs $c --rebuild }
node scripts/shopify-preview/lpo-order-check-build.mjs
```

Then upload. This changes prices on the live Shopify store straight away:

```powershell
foreach ($c in 'day-night','roller','vertical','roman','venetian','no-drill','faux-wood','easy-stick','skylight','other') { node scripts/shopify-preview/lpo-upload-formulas.mjs $c }
node scripts/shopify-preview/lpo-order-check-upload.mjs
```

`lpo-upload-formulas.mjs` saves a copy of every stored LPO configuration under `.shopify-work/lpo-config-backups/<date>/` before changing it.

### Shopify theme

```powershell
node scripts/shopify-preview/build.mjs
node scripts/shopify-preview/check.mjs
node scripts/shopify-preview/push-live.mjs <changed files>
```

The starting prices on collection pages (`snippets/ob-minimum-price.liquid`, `snippets/ob-minimum-prices-json.liquid`) come from `pricing.mjs`, so push them after a price change.

## Turn off the popup or code picker

- Popup: remove `<SignupPopup />` from `src/app/layout.tsx`, and the `signup-popup` line from `shopify-theme/layout/theme.liquid`.
- Code picker: the bar shows the code at the top of `PROMO_COUPONS`. With one entry, the dropdown lists just that code.
