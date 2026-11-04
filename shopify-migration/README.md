# Shopify migration preview

This is an unfinished, unpublished migration. The current Next.js site remains active. Day & Night has 11 inactive LPO configurations covering all 121 products, six linked migration Assets lists and 66 actual editor checks passed. Roller has seven corrected, verified Assets lists and 15 planned option profiles for 648 products; those option configurations are not built yet. Storefront LPO pricing remains off. Other families and storefront/cart/checkout acceptance remain pending. Full appearance and behavior parity has not been signed off.

Current owner direction: check existing Assets lists against source data, reuse only matching data and configure categories one by one while preserving the original options design. Day & Night is the first category; Roller is next. Do not activate app configurations, publish the theme or change current products/themes.

Search design now covers empty, populated and no-result states using native Shopify search results and the original product cards. Search discovery, calculated-price sorting and result membership still need behavior parity verification; visual checks alone do not establish that parity.

Navigation audit found five existing collections published only to `Online Blinds Express Headless`, so their native Online Store routes return 404: `faux-wooden-blinds`, `skylight-blinds`, `easy-stick-blinds`, `perfect-fit-metal`, `perfect-fit-wooden`. Publication settings were not changed. Restoring these native routes requires a publication decision or a preview-only alternative; changing the theme cannot publish collections. The audit also encountered a 429 rate-limit response on the home route, which loaded normally in the browser. Evidence is in ignored `.shopify-work/collection-visibility.json` and `.shopify-work/search-navigation-check.json`.

Resolved with explicit owner authorization on 23 October 2026: all five collections above were additionally published to Online Store. Their existing headless publications were preserved; no product publication or theme change was made. See `approved-collection-publication.json` for verified channel membership. The original baseline remains unchanged, so subsequent audits should account for these authorized collection changes.

The cart uses `shopify-src/cart-design.tsx` to display Shopify cart line properties and totals in the existing site's layout. Editing, clearing, quantity changes, applying discounts, installation selection and checkout remain disabled until LPO integration. Private `_` line properties are retained in input but not displayed. `cart-design-check.mjs` substitutes a browser-only fixture to check populated desktop/mobile layouts and discounted totals without adding products or changing a real cart. No example cart data is shipped to the theme.

Product templates use `ob-product-design`, rendering the existing ProductPage through build-only adapters. Measurement panels, conditional cards and installation controls retain their source layout. App blocks and routing for all 121 Day & Night handles are staged behind an off-by-default category connection switch. The bridge synchronizes the existing controls through supported LPO methods and accepts only a matching valid quote. The configurations passed real editor tests, but the storefront still uses the public pricing snapshot while they are inactive. Purchase handlers are removed and inline/sticky purchase buttons remain disabled. See `lpo/PILOT-STATUS.md` for current category coverage and pending storefront/cart/checkout acceptance.

- Preview theme: **Online Blinds - Shopify Preview**, ID **200474362240**.
- [Open preview](https://online-blinds-express.myshopify.com?preview_theme_id=200474362240)
- [Open theme editor](https://online-blinds-express.myshopify.com/admin/themes/200474362240/editor)
- Existing products, collection assignments, product template assignments, existing themes and domains must remain unchanged.
- Publishing requires the owner's explicit instruction. No publish command is provided here.

## Keeping both versions

See [THEME-EDITOR-GUIDE.md](THEME-EDITOR-GUIDE.md) for brand colors, reorderable product content, related-product selections, custom image/text sections and the workflow for preserving editor changes during uploads. Product supplemental content now lives in separate Shopify sections; default order and audience retain the existing design.

The original Next.js application stays in `src/`, with its original package scripts and deployment. Shopify-specific code is in `shopify-src/` and `shopify-theme/`. The theme reuses selected source components through build adapters; those adapters do not change the original application.

For review, switch between the existing site and the preview link. Opening the preview can set a Shopify preview cookie; use a separate browser profile or Shopify's Exit preview control when checking the current Shopify theme.

Switching the actual public site later is a separate domain/routing and deployment step. Publishing a Shopify theme alone does not switch a domain still served by Next.js. An approved cutover must record the current hosting/domain configuration and retain the Next.js deployment for reversal. Customer carts and sessions do not automatically transfer between implementations. A production switching control has not been implemented yet.

## Build and verify

From the repository root, using Node and the existing project dependencies:

```powershell
node scripts/shopify-preview/catalog.mjs
node scripts/shopify-preview/product-categories.mjs
node scripts/shopify-preview/pricing.mjs
node scripts/shopify-preview/pricing-check.mjs
node scripts/shopify-preview/build.mjs
node scripts/shopify-preview/check.mjs
node scripts/shopify-preview/upload.mjs
node scripts/shopify-preview/browser-check.mjs
node scripts/shopify-preview/audit.mjs
```

The local tooling lives under ignored `.shopify-work/tooling/`, separate from the application's package manifest. Its installed versions are Shopify CLI 4.9.4, esbuild 0.28.2, Playwright 1.64.1 and PostCSS 8.5.31. Browser scripts currently use the installed Windows Chromium executable; update its path if the browser installation moves.

Credentials load from `.env.local` and stay out of theme files. `check.mjs` scans text output for configured secret values. Never commit `.env.local`, `.shopify-work/`, or browser profiles. The guarded uploader targets only the recorded unpublished theme, rejects protected themes and requires purchasing to stay disabled. It verifies existing theme timestamps and the published theme after upload.

`catalog.mjs` and `audit.mjs` compare product and collection fields, including update timestamps, against the initial snapshot. These checks can detect unrelated store edits too; a difference must be reviewed rather than assumed to be caused by this migration.

## Live Product Options

The app embed reference and a legacy native product section are retained in this new theme; active design templates do not render the LPO block. App Admin access is required to inspect the plan and create option configurations. The Theme Access credential cannot configure the app. Use the manual setup guide because browser login was unavailable.

`lpo/` contains reference price tables, product mappings and an offline JavaScript calculator prepared from the current server calculator. These CSV files are **not** directly importable LPO configurations. Dimension lookup must preserve the existing ceiling rules, limits, missing-cell failures and family-specific adjustments. LPO's standard lower-bound table lookup must not silently replace those rules.

`lpo/pricing-check.json` records 84,460 comparisons across 96 product profiles, including 9,016 matching rejections. That verifies the offline calculator conversion only. It does not prove LPO option configuration, cart totals or checkout correctness.

Before saving app configuration, verify how assignment and pricing affect existing products and themes. Keep drafts unassigned or disabled until isolation is established. Any app setting that creates variants, changes product metadata or changes live-store behavior needs a compatible isolation approach. Any paid extension requires owner approval before accepting charges.

## Completed design/data follow-up ? 24 October 2026

The preview now restores the original review layout and rating badge from 7,505 published reviews across 581 products. Reviewer email, IP address and internal reviewer fields are excluded. Review submissions remain disabled. The read-only review snapshot follows the existing 150-review per-product limit; it does not republish hidden reviews.

Automatic related products use the existing source selection algorithm, with the theme-editor picker as an override. Source-normalized product tags restore vertical specifications; category snapshots restore shutter customization. The product's source features and detail metafield are retained.

Collection content uses a snapshot of the original source filters across 1,879 storefront products and 78 routes. Default price-low sorting and subsequent pages sort the entire collection by calculated starting price. Native search loads up to 500 product matches and sorts the full loaded set by those same prices; Shopify native search matching can differ from the original Storefront API query behavior.

The 14-family desktop/mobile review detected no JavaScript errors, overflow or broken loaded images, and no source headings were missing. Targeted checks verified five collection/sort/page combinations, automatic related products, the specification accordion, published reviews and search sorting. See catalog-review-check.json and design-review-completed.json. This is representative validation, not a pixel-by-pixel sign-off of every product and conditional state.

## Data refresh and remaining integration

- Run node scripts/shopify-preview/refresh.mjs to refresh catalog, pricing references, category assignments and published reviews, then build/check locally. Merge remote editor changes before the separate guarded upload. These snapshots are not live synchronization; a maintained refresh/deployment workflow or live data integration is required before launch.
- Update, 28 October: Day & Night now has 11 inactive configurations for all 121 products and six verified Assets lists. All 66 editor cases passed. Roller has seven corrected lists, with its 15 option profiles still to be configured. Existing Day & Night/Roller lists were preserved because their compared prices did not match current source matrices. No test store is available. See lpo/PILOT-STATUS.md. No paid activation, live configuration activation or checkout test was performed.
- Configure and validate LPO fields, units, conditions, limits and all pricing bands. Then integrate sample orders, installation, cart editing, discounts and Buy Now, preserving private app properties.
- Review submission, account flows, newsletter welcome-code behavior and production analytics need acceptance before launch. Native search matching needs comparison for important real queries.
- Test valid/invalid dimensions and every priced option through cart and checkout using an isolated approach that preserves existing products.
- Follow SWITCHING-AND-LAUNCH.md for public-domain switching and reversal. No one-click production routing switch is implemented. Publishing or domain changes still require the owner's explicit instruction.

The preview remains unpublished, with purchasing disabled and noindex,nofollow. The original site source and existing themes are retained.
