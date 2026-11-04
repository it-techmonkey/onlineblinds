# LPO category setup — 28 October 2026

## Phase 1 complete (owner-approved rollout plan)

The 11 Day & Night formulas were rebuilt in a small, data-driven form (`scripts/shopify-preview/lpo-slim-formula.mjs`, `lpo-slim-day-night.mjs`): about 2.2 KB each instead of about 175 KB, because LPO ships every active configuration to every product page. Each formula carries only its band grid, size limits and flat add-on prices; the dimension price still comes from its linked **OB Preview -** Assets list.

- Offline: 673,160 comparisons with the website calculator (every assigned product, every band edge, cm and mm), and identical output to the previous editor-tested formulas.
- Uploaded with the sessionless `config_update` (`lpo-upload-formulas.mjs`); only the formulas changed. Stored configs went from about 373 KB to about 15 KB. Pre-update copies are in `.shopify-work/lpo-config-backups/`.
- The shared design JS (`lpo/design.js`, built by `lpo-design-js.mjs`) went from 60 KB to 4.7 KB and reads its size data from the formulas.
- All 66 LPO editor checks passed again, with no cart or checkout requests. All 11 configurations remain inactive.

## Phase 2 complete — one product through cart to the checkout page

- **Found and fixed:** formulas that look up an Assets list by name work in the LPO editor but return £0 on the storefront, because only lists linked to a config are shipped. Each formula now embeds its own price grid (about 3.7 KB per formula; re-verified offline with the same 673,160 comparisons).
- LPO helper product created by enabling **Include add-on product in bundle**: `product-options` (£0.01 variant). It is published to Online Store only; the headless channel used by the live Next.js site cannot see it.
- Pilot **OB Preview - Dayandnight - Band A** (5 products) is **active**. The published theme is the bare headless theme with no LPO, so nothing renders on the live site.
- Preview theme: **Connect configured LPO categories** on; new setting **Allow cart and checkout for LPO-priced products** on (global purchasing stays off, so the uploader guard is unchanged). Add to Cart / Buy Now go through LPO's own add flow; checkout is offered only when every cart line carries `_cl_options`. LPO writes its price into a hidden `data-live-price` target so it never edits the visible design.
- Tested on the preview: 100 × 120 cm, black cassette, fabric insert → page, LPO, cart and Shopify checkout all show **£155.83** (bundle: blind + Product options). The live site's `/api/pricing/calculate` returns the same total. Stopped at the checkout page; no details entered, no order. Test cart cleared.

## Phase 3 complete — all Day & Night live on the preview

- **Order details now match the live site.** LPO option names are hidden (`_width`, `_measurementUnit`, …) and the theme adds the live site's own properties. The build extracts `buildLineItemProperties` from `src/lib/server/order.service.ts` (live code untouched), so keys and values are identical: `Width: 150.0cm`, `Height`, `Room Type`, `Blind Name`, `Colour`, `Installation`, `Control Side`, `Chrome Upgrade`, `Cassette Bar`, `Same Fabric Insert`, `Motorization`, `_calculatedPrice`.
- All 11 Day & Night configurations are **active** (121 products). Formulas re-verified offline (673,160 comparisons) and the 66 editor checks pass with the hidden names.
- New `lpo-storefront-check.mjs` drives the real LPO on each config's product page: **94/94 pass** (cm, mm, fractions, upgrades, motorised, large, too small, too large, zero). Results in `categories/day-night/storefront-check.json`.
- End-to-end on the preview, stopping at the checkout page (no details, no payment; carts cleared):
  - Electrical product via **Buy Now** → checkout £279.53; the live site's `/api/pricing/calculate` returns £279.53.
  - Colour product (`plain-soft-day-and-night-blinds`, Navy) → Navy variant booked, £133.61, `Colour: Navy` property.
- Add to Cart / Buy Now stay clickable while fields are missing (they highlight them, as on the live site) and only add once LPO has verified the price.
- The live Shopify theme still loads no LPO. LPO's public script is 210 KB with 11 active configs.

## Phase 4 — Roller (13 of 14 configs live on the preview)

- **Generic (v2) setup.** The theme sends the page's own customization list (`category:optionId|…`, the same list the server prices) in one hidden option, `_customizations`. One formula (`lpo-generic.mjs`) mirrors `calculateProductPrice`: size envelope → ceiling band with clamp → cell price → customization prices (flat or per width band, with the server's cassette normalisation) → +£75 when motorised. The same approach should cover the remaining band-priced families.
- Products are grouped by band **and** by the rules their tags trigger. Electrical roller products lack the `roller-blinds` tag, so the live server prices them without roller size limits or clamping and with Day & Night cassette prices (black/grey £7.99, not £9.99). The migration mirrors this exactly; **owner may want to review whether that live behaviour is intended.**
- Offline: 219,024 comparisons with the website calculator (every product, band edges in cm/mm, every customization option alone and with motorisation, random combinations). Storefront: **130/130** pass on the 13 active configs. End-to-end: Cairo Blackout Beige, 120 × 150 cm, grey cassette, matching fabric, chrome chain → page, LPO, cart and checkout **£102.09** = live `/api/pricing/calculate`. Cart cleared; no order.
- Configs are created with `lpo-generic-create.mjs` (server-side copy, then `config_update`). LPO limits copies to **10 per hour**; **OB Preview - Roller - Band A - Electrical (26 products) is pending**. Finish with: `lpo-generic-create.mjs roller` → `lpo-registry-build.mjs roller` → `lpo-design-js.mjs` + `lpo-save-design-js.mjs` → theme build/upload → `lpo-set-active.mjs on <uuid>` → `lpo-storefront-check-generic.mjs roller`.
- LPO's public script is 477 KB with 37 active configs (1Clickblinds: 2.2 MB).

Roller is now complete: **Band A - Electrical** was created and activated; 14/14 configs active, storefront **140/140**.

## Phase 5 complete — every category live on the preview

- **64 Phase 5 configs active** (75 LPO configs in all with Day & Night and Roller); the theme routes **1,885 of 1,886 products** to LPO. Only `installation-service` (the £40 add-on, Phase 6) is excluded.
- Storefront checks all pass: vertical 144, Roman 90, venetian/Perfect Fit 60, no-drill 30, faux wood 30, Easy Stick 30, skylight 11, Eclipsecore 10.
- End-to-end on the preview, each stopped at the checkout page with the cart cleared, all equal to the live `/api/pricing/calculate`: vertical £129.53, slat £2.90, Roman £211.72, Perfect Fit shutter £220.18 (with Measurement Type / Handle Position / Number of Panels properties), no-drill £82.04, skylight Velux 104 £75.20.
- LPO public script: 1.14 MB raw / 87 KB gzipped with all configs active (1Clickblinds: 2.2 MB).

### Phase 5 working notes

- Built with `lpo-kind-build.mjs <category>`, which selects products by the band the live server resolves (`resolveHandleToPriceBand`) and adds two formula kinds: **slat** (replacement vertical slats: drop tiers from the product tags, fixed 16in width, no grid) and **skylight** (fixed 1 × 1 in cell plus blind type). Width-dependent option prices are resolved per column of each band's own width bands (not by mm). Roller formulas are unchanged.
- Offline, every category matches the website calculator: vertical 167,936 · Roman 157,524 · venetian/Perfect Fit 244,224 · no-drill 95,464 · faux wood 53,560 · Easy Stick 19,820 · skylight 2,164 · Eclipsecore 84,424 comparisons.
- **Vertical (13 configs, 510 products) live on the preview**; storefront 144/144. End-to-end, stopped at the checkout page (cart cleared): Aqualush Beige Vertical 150 × 180 cm, platinum headrail, Vouge Silver, chain right, right stack → **£129.53**; Aqualush Beige Slat 200 cm, black weights → **£2.90**; both equal the live `/api/pricing/calculate`.
- **Roman: 4 of 9 configs live** (EB Bands A, B, C, D); storefront 40/40.
- Waiting for LPO's copy limit (10 per hour): Roman EB AA, Arena D/E/F/G; venetian/Perfect Fit (6); no-drill (3); faux wood (3); Easy Stick (3); skylight (1); Eclipsecore (1). Resume one category at a time with `lpo-generic-create.mjs <category>` → `lpo-registry-build.mjs <category>` → `lpo-design-js.mjs` + `lpo-save-design-js.mjs <inactive uuid>` → theme build/check/upload → `lpo-set-active.mjs on …` → `lpo-storefront-check-generic.mjs <category>`.
- Live-site behaviours mirrored as-is (the live site is the source of truth): some dropdown labels show a different add-on price from what is charged (e.g. slat black weights shows +£0.75, charged £0.59 — same on the live site).
- The `installation-service` product has no price band; it is the installation add-on (wired in Phase 6).

## Phase 6 — launch readiness (preview only; nothing published)

- **Cart works like the live cart** (`shopify-src/cart-design.tsx`, the live cart's own markup): quantity +/−, remove, Clear Cart with the same confirm box, discount codes through Shopify (`/cart/update.js`; invalid codes show "Invalid discount code"), and the header counts blinds only.
- **Installation** uses the existing `installation-service` variants with the live tiers (1 blind £40, 2–5 £60, 6+ £85; `getInstallationServiceTier`). One line per order; the tier follows the number of blinds and the line is removed when no blinds are left. The product-page tick-box carries through to the cart and Buy Now.
- **Edit** uses LPO's own `?item=<cart key>` edit link: the product page reopens with the saved selections (`_ob_config`, hidden) and LPO updates that cart line in place. A colour change adds the new line and the cart then drops the old one.
- **Buy Now** matches the live site: LPO prices the line without adding it (capture mode), and a separate Shopify cart is opened at checkout (Storefront API `cartCreate`, no token). The customer's cart is left untouched. If that fails, it falls back to the previous add-then-checkout path.
- **Search:** the `product-options` helper product is already hidden from search (`seo.hidden = 1`).
- `lpo-cart-flow-check.mjs`: **14/14** pass (`phase6-cart-check.json`). Stopped at the checkout page; carts cleared. Live theme unchanged.
- Difference: the cart shows Shopify's own discount, which also covers the installation line (FINAL10 applies to all items). The live cart's estimate discounts blinds only, but its Shopify checkout applies the same code.

### Launch blocker — LPO prices can be tampered with

A hand-edited cart request (`_cl_options_price=100`) put a £76.14 blind into the cart **and onto the checkout page at £1.00**. LPO's cart transform trusts the price property sent by the browser. LPO has an optional price key (`checkout.validate`), but it is a simple checksum with the key sent to every visitor, so it only stops casual edits. The live site is not affected: its server re-prices every item before creating the draft order. A server-side check is needed before launch (owner decision pending).

#### Order price check (Shopify only; the live site is not involved)

Owner decision (29 October 2026): keep the live website and the Shopify version separate. So the check runs entirely in Shopify:
- **Shopify Flow, "Run code" step:** prices every web order from the details staff build from (Width, Height, Motorization, …) with the same LPO formulas, and compares that with what was charged (50p tolerance, as on the live checkout). It also checks:
  - the product → configuration mapping,
  - unknown order details,
  - stripped LPO data (blinds are £0 in Shopify),
  - the installation tier and its price.
- **Draft orders** (the live site's checkout) are skipped.
- **Missing data:** if the price data can't be read, the order is flagged rather than passed.
- **Build:** `lpo-order-check-build.mjs` writes `order-check/` (Flow code 17.1K of 50K characters; query; output schema). `lpo-order-check-upload.mjs` stores the formula data in shop metafields `ob_order_check.pricing` (100 KB) and `ob_order_check.products` (30 KB), and reads them back. **Rebuild and re-upload whenever products, LPO configurations or live prices change**; a product missing from the data is flagged, not passed.
- **How Flow reads the data:** Flow doesn't accept `metafield(...)` lookups or aliases in a Run code query. The two metafields are added as workflow variables (Flow's "unstructured metafield" picker: `shop.pricing`, `shop.products`) and queried as `shop { pricing { value } products { value } }`.
- **Flow lint:** Flow blocks the workflow on any ESLint error (for example an unused `catch (e)`). The code passes ESLint's recommended rules locally.
- **Fixes found by the 29 October review:**
  - Flow rejected the original query, so the step would have failed on every order.
  - Roller cassette bars are now priced from the roller table, as on the live server.
  - A written size can't be dropped while LPO's size is kept.
  - With no LPO size, the written cm size is priced correctly even when the unit says mm.
  - Day & Night values the page doesn't offer (e.g. "2ch-remote"), and paid manual extras on a motorised blind, are flagged.
- **Offline tests** (`order-check/test.json`, 26,876 order checks, 0 failures):
  - Every one of the 1,885 products: 3 random genuine orders each must price exactly the live price, and a £1 cut must be flagged.
  - Every option value, one at a time and in pairs, for each pricing kind (configuration × product rules); every skylight brand and blind type.
  - Size limits in cm and mm, and sizes the live site rejects.
  - Tampering: options added without paying, sizes changed or removed, motorisation unpaid, stripped data, extra instructions, values not offered.
  - Order shapes: quantities, several blinds, ungrouped lines, every installation tier boundary (1, 2, 5, 6, 9 blinds), missing or corrupt data.
- **Storefront test** (`order-check/storefront-test.json`): the real LPO engine on the preview priced 256 genuine selections across all 64 configurations and 126 products, in capture mode (nothing added to the cart). LPO's price matched the live price in every case, the check accepted every order, and it flagged a £1 cut on every one.
- **Bundle shape confirmed** on a throwaway Storefront cart (no checkout): LPO expands each blind into the blind (£0, LPO's hidden values) plus "Product options" (the price). Every detail stays on the group. The check reads it that way.
- **23 real live-site orders** (read-only, treated as web orders): 21 match exactly. The 2 flagged (an old inch-format order; a motorised blind below today's motorised minimum width) are also rejected by the live pricing API today.
- **Flow test run** on live order #1637: the data loaded ("64 configurations"), the draft order was skipped, `ok` was true, and no action ran.
- **Flow workflow "OB order price check" (draft, off):** Order created → Run code → if `ok` is false → tag `price-check-failed` → hold all fulfilment orders (reason Other, with a note) → internal email to onlineblindsexpressltd@gmail.com with the order number, the summary and an admin link. Approved by the owner on 29 October 2026; the final "Turn on workflow" click was blocked by Claude's permission settings and is left for the owner.
- LPO's settings page offers no price-validation option, so LPO's price key could not be switched on.

**Day & Night now has saved Draft configurations for all 121 products. Storefront LPO pricing is still switched off; no cart/checkout test or launch has occurred.**

| Category | Saved app setup | Verification | Remaining |
| --- | --- | --- | --- |
| Day & Night, including electrical | 11 inactive configurations; 121 products; 6 linked migration Assets lists | 1,584 stored price cells matched; 1,584 offline formula comparisons; 66 actual editor checks passed | Isolated storefront/cart/checkout acceptance, including colour variants |
| Roller, including electrical | 7 corrected Assets lists imported and verified; 648 products mapped into 15 planned profiles | All 616 stored price cells matched the current source | Build the category-specific options, conditions and formulas; test and save the 15 drafts |
| Other categories | Not configured yet | Existing lists must be checked per category | Configure sequentially after Roller |

## Assets lists

The library contained 141 existing lists. The 18 Day & Night lists and 24 Roller lists were exported. Their compared prices differ from the current website matrices, so they were preserved and not reused unchanged. The migration now adds 13 separately named lists, each prefixed **OB Preview -**. The library currently contains 154 lists.

Corrected lists were exported back from LPO and compared with the source, not merely uploaded. Day & Night has two distinct Band A matrices; the five products using the separately named Dayandnight band retain their own prices. Formula lookup selects the original inch-ceiling/clamped band before querying the list at its exact stored coordinates.

## What is visible in the preview

The original React controls and layout remain. Routing for all 121 Day & Night handles and LPO app blocks are staged in theme 200474362240. **Connect configured LPO categories** remains off and purchasing is disabled. Inactive app configurations are not served on normal storefront visits, so the preview still uses the existing pricing snapshot. It is not yet a working storefront LPO integration.

All 121 Day & Night products and 133 variants were unchanged in the before/after audit. The original published theme and other existing themes were preserved. No recurring charge was accepted and no messages were sent to Cloudlift.

See [Day & Night details](categories/day-night/STATUS.md), [current coverage](CATEGORY-PROGRESS.json), and the per-category asset, formula, editor and store check reports. Historical pilot files remain as development references; they are not the current category status.
