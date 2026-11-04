# Day & Night — inactive category configuration, 28 October 2026

> **Superseded later on 28 October:** all 11 configs now use slim formulas with embedded prices and hidden option names, are **active**, and pass 94 storefront checks plus end-to-end tests up to the checkout page. See `../../PILOT-STATUS.md` (Phases 1–3). The text below describes the earlier inactive stage.

**121 products are assigned to 11 saved Draft configurations. Six migration-owned Assets lists are linked by the formulas. Storefront LPO pricing is still disabled; this is not a live checkout sign-off.**

The split covers 67 standard and 54 electrical products. Electrical configurations force motorization and hide the manual controls. The five products using the separately named `Dayandnight - Band A` retain their own matrix rather than being merged into the other Band A.

The 18 existing Day & Night Assets lists were exported. Their matching-coordinate prices differ from the current website's matrices, so they were preserved and not reused unchanged. See `../../existing-day-night-lists-audit.json`. The six new lists use the prefix **OB Preview -** and the source band's name. All 1,584 stored cells were exported back from LPO and matched the source exactly (`asset-lists-check.json`).

Formulas preserve the original inch-ceiling lookup, family/control sizing limits, clamping and customization charges. They select the original band first, then query the Assets list at that band's exact stored coordinates. Raw customer measurements must not be passed directly to LPO's lower-bound lookup. A source-price verification guard remains in place during migration; changing Assets prices independently requires updating the reference calculation before rollout.

Validation includes 1,584 offline comparisons across all assigned products/profiles and 66 actual LPO editor cases. Editor tests cover base pricing, equivalent mm measurements, upgrades, invalid/zero sizes, recovery, native error messages and manual-control visibility. See `formula-check.json` and `app-check.json`. These tests do not create carts, checkouts or orders.

`saved-configurations.json` records saved names and product counts. Each stored config export verifies its explicit product IDs and both unit formulas. The before/after store audit found no changes to the 121 products or their 133 variants (`store-check.json`).

The unpublished theme now has routing for all 121 handles and staged LPO app blocks. Its category connection switch remains off and purchasing remains disabled. The visible controls remain the original website components. Inactive LPO configurations are not served on normal storefront visits, so the preview still uses the existing pricing snapshot. An isolated storefront/cart/checkout test path remains to be established before activation.

Roller is the next category. Other categories are not configured by this Day & Night work.
