# Launch readiness check — 30 October 2026

Shopify preview theme 200474362240 compared with the live site (www.onlineblindsexpress.co.uk, the source of truth). Read-only except for throwaway carts and preview-theme uploads. Nothing was published, no order was placed and the domain was not touched.

**Verdict: not ready to switch the domain yet.** Pricing, product options, cart and checkout are ready. The blockers are around the switch itself (old links, search engines, tracking) and a few features that are switched off on the preview.

## Passed

| Area | What was tested | Result |
|---|---|---|
| Pricing, every product | The real LPO engine on the preview priced one random, page-valid selection for every product on sale. Each price was compared with the live price. | 1,881 / 1,881 equal. The 4 that "failed" are draft products, not on sale on either site. |
| Live price reference | The local copy of the live calculator was checked against the live `/api/pricing/calculate`. | 315 / 315 equal |
| Real Shopify cart | One product per LPO setup (64 configurations; Day & Night manual and motorised), put in a throwaway Shopify cart at quantity 2 | 70 / 70 charged exactly 2 × the live price, as a bundle |
| Order price check (Flow code) | Every product's real LPO cart data, then the same order with £1 taken off | 1,881 accepted, 1,881 £1 cuts flagged |
| Cart to checkout | Add, quantity, installation £40/£60, invalid code, FINAL10, remove code, edit, Buy Now to checkout, clear | 14 / 14. The checkout shows the size and options of each blind. |
| Product pages | All 1,879 live product URLs, rendered on both sites, with the visible text compared | Same content (exceptions are listed below) |
| Information pages | Home, About, Contact, FAQ, Guides, Privacy, Refunds, Shipping, Terms, Warranty, Cart | Identical text, except the home best-sellers |
| Menu collections | All 26 menu category pages | Identical (products, prices, text) |
| Mobile (390 px) | 80 pages: one product per configuration plus the main pages | No sideways scrolling, no broken images, no script errors; Add to Cart on every product type |
| Forms and controls | Header search suggestions, search page and sorting, account sign-in page, FAQ accordion, mobile menu, cart discount box | Working |
| Accessibility | LPO's hidden pricing form | Not reachable by keyboard (inert) |
| Plan limits | Orders per month since April | 2–18; the LPO Startup plan allows 100 |
| Payments and delivery | Shopify Payments, delivery rates | Active. The rates are the same ones the live site's checkout uses. |

## Fixed on 30 October (preview theme only, retested against live)

| Item | Change | Retest |
|---|---|---|
| Search | Uses the same Shopify product query as live (every word must match, newest first, up to 500, all on one page in the category grid). Header suggestions use the same query (first 5). | "grey blackout" 68 = live, "roller" 500 = live, nonsense 0 = live; pages identical; suggestions identical |
| Newsletter | After sign-up shows live's "You're all set!" with WELCOME20 and Copy Code (code read from the live source). Still a native Shopify customer form tagged newsletter. | Form renders; not submitted (would create a customer) |
| Honeycomb video and images | Build now includes `.mp4` and converts `.avif` | Video loads (200); the 3 comparison images load |
| Home best sellers | Built from the live best-seller order in the snapshot; hidden helper product excluded | Same 8 products in the same order as live |
| `/collections` | Shows All Products with live's heading, text and layout | Identical |
| Older collection pages | Live's title, description and "Coming Soon" rules | All 35+ identical |
| Collections missing from the Online Store channel, old live links | The not-found page forwards `/product/<handle>`, `/about`, `/faq`, `/guides`, policy pages, `/warranty`, `/login` and live category slugs to the Shopify page | `roller-pattern-blinds`, `perfect-fit-shutter` and the globofilter index identical; old links land on the right page |
| "Verified purchase" | Same rule as live (any Judge.me value shows the label) | Matches live |
| Reviews | Writing turned on: the live form (name, email, rating, title, review) posts to Judge.me's public review endpoint, which needs no private key. Photo/video upload is left out because it needs the live site's server. | Form opens; not submitted (would create a real review) |

## Must do before switching the domain

1. ~~**Old links for search engines.**~~ **Done 1 November:** the owner ran `redirects.mjs --apply`; 1,906 redirects (301) cover every `/product/<handle>`, the main pages including `/contact`, and live category slugs. Spot checks return 301 to the right page.
2. **Two existing store redirects clash with live pages (do on launch day).** `/collections/blackout-blinds` goes to Blackout Vertical Blinds (live: Blackout Blinds, 77 products), and `/collections/motorised-blinds` goes to Motorised Roller Blinds (live: Motorised Blinds, 364). Delete or change both.
3. **Remove `noindex,nofollow`** in `shopify-theme/layout/theme.liquid` at launch.
4. **Tracking.** Add Google Tag Manager `GTM-5KVNBLSF`.
5. **Data sync.** Since the theme was published (1 November), `upload.mjs` refuses to touch it. Push changed files to the live theme with `node scripts/shopify-preview/push-live.mjs <file> [...]` (for example `sections/ob-newsletter.liquid`) after `build.mjs` and `check.mjs`. The owner will keep Shopify and the live site in sync. On Shopify that means running `refresh.mjs`, then `upload.mjs`, after any product, price, review or content change, including switching the Halloween flag off. After adding products, also run `redirects.mjs --apply` so their old `/product/<handle>` links redirect.
   - **Size limit or price table changes** also need the LPO app updated, in this order (example category `easy-stick`):
     1. `node scripts/shopify-preview/pricing.mjs`
     2. `node scripts/shopify-preview/lpo-kind-build.mjs easy-stick --rebuild` (compares every size with the live calculator)
     3. `node scripts/shopify-preview/lpo-upload-formulas.mjs easy-stick`
     4. `node scripts/shopify-preview/lpo-design-js.mjs`, then `node scripts/shopify-preview/lpo-save-design-js.mjs cl0lhxa9lfbd`

     Step 4 matters: the shared LPO script blocks add-to-cart for sizes outside its own copy of the limits. `cl0lhxa9lfbd` ("OB Preview - Shared JS helper (keep inactive)") is an inactive copy used only to save that shared script. Keep it inactive.
6. **One real order.** The owner places and refunds one real web order.

## Owner decisions recorded

- Delivery charges stay as they are (30 October): checkout £9.99, Scotland £22, Northern Ireland £30.99, free from £200. The live text (free over £250, £9.95, +£9.95 remote areas) still differs.

## Remaining differences (flagged)

- Live shows reviews that Judge.me marked hidden or spam (2 in the store; e.g. Unity Willow Vertical shows 12 reviews and 4.3 on live, 11 and 4.4 on Shopify).
- Review photo/video upload is not available on Shopify.
- The not-found page itself differs (live shows a plain Next.js 404).

## Not tested

- Payment and real orders (testing stops at the checkout page by agreement).
- Newsletter submission: not sent, because it would create a customer record and possibly an email.
- Review submission: not sent, because it would publish a real review (Judge.me accepted a test request with no rating or text; no review was created).

Evidence: `.shopify-work/launch/` (`cmp-pages.jsonl`, `cmp-products*.jsonl`, `lpo-all.jsonl`, `cart-all.json`, `live-api-check.json`, `mobile.json`, `forms.json`, `store.json`).
