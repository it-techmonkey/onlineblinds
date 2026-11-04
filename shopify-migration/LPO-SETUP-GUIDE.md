# Live Product Options setup for Online Blinds

**Update, 28 October 2026:** Day & Night now has 11 saved inactive configurations covering all 121 products, with six linked Assets price lists and 66 actual editor checks passed. The existing 18 Day & Night lists did not match current source prices, so separately named migration lists were created and verified by exporting them back. Roller now has seven corrected, verified price lists; its 15 option profiles are not configured yet. The original controls are retained. Storefront LPO pricing is still off, and cart/checkout acceptance remains pending. Read [category progress](lpo/PILOT-STATUS.md) before following the older single-product worksheet below. Do not duplicate or activate configurations.

Use your normal browser and Shopify login. No password or account access needs to be shared with me. This guide prepares the app for the separate unpublished theme; it does not publish the migration or finish the pricing integration.

## 1. Open the correct theme

Go to **Online Store → Themes → Theme library → Online Blinds - Shopify Preview → Customize**. The preview theme ID is **200474362240**.

[Direct editor link](https://admin.shopify.com/store/online-blinds-express/themes/200474362240/editor)

Leave the current theme and product records as they are. Keep the preview's purchasing setting off. Do not change product prices, variants, tags, collection membership or assigned theme templates as part of this setup.

## 2. Integration status before adding an app block

The product template uses **Blinds product design**, retaining the original configurator and disabled purchase controls. LPO app blocks are staged, and **Connect configured LPO categories** remains off. Routing covers all 121 Day & Night handles. Do not replace the existing visual controls or add duplicate configurators.

The embed reference is present in the preview, and the bridge synchronizes the existing controls through LPO's supported API. Keep the pilot switch off until an isolated storefront test is arranged: inactive configurations are not served on normal storefront visits. Editor tests do not establish cart/checkout acceptance. Keep purchasing disabled and do not publish.

Cloudlift documents the [theme embed](https://docs.cloudlift.app/article/129-how-can-i-enable-the-options-app-in-the-theme-editor) and [product app block](https://docs.cloudlift.app/article/126-product-options-block-in-theme-editor) separately.

## 3. Check Formula availability

The owner reported Formula inactive on 24 October. On 27 October, the signed-in app showed Formula already enabled on the current subscription. No purchase was made during setup. Theme Access credentials alone cannot configure LPO; the authenticated browser and app's supported MCP connection now provide access.

Open **Apps → Live Product Options → Plans → Extensions**. Check whether **Formula** is active. If not, review the recurring charge shown before choosing whether to add it. Formula is the intended approach for preserving this site's existing calculation rules; it is an additional subscription feature. [Extension instructions](https://docs.cloudlift.app/article/166-app-extensions-options).

You can prepare option labels while deciding about the extension. There is no need to enable unrelated extensions just for this migration.

## 4. Prepare one inactive configuration

In Live Product Options, click **New Product Options** and select **Plain Soft White Day and Night Blind** as the first example. Use a clear name such as **OB Preview - Day & Night** if the editor offers a configuration name.

Keep **Status** inactive while preparing it. Do not apply the configuration to all products. Cloudlift's instructions explicitly use Active to make configurations available on the storefront; we are deferring that step. [Configuration instructions](https://docs.cloudlift.app/article/72-how-can-i-add-product-options-to-a-product).

If the screen does not offer a way to save without activation, leave it unsaved and send me a screenshot of that screen. A theme being unpublished does not, by itself, make app-wide configuration changes private to that theme.

Start with the existing product page open beside the app editor. Reproduce its labels, order, choices, required selections and conditions. The following is a worksheet for this family, not a substitute for checking the actual product's available features:

| Existing control | Intended LPO control | Mapping notes |
| --- | --- | --- |
| Width and drop/height | Dimension, or separate numeric inputs | Preserve units, fractions, allowed increments and family/control-specific limits. Check the Dimension editor's capabilities before choosing the final input structure. |
| Installation method | Image swatches or radio buttons | Existing IDs: `inside-mount`, `outside-mount`; use the site's labels and images. |
| Manual control side | Image swatches or radio buttons | Reproduce the choices displayed by the current product; visibility depends on the selected control system. |
| Chrome upgrade | Yes/No control | Use `no` and `yes`; the current upgrade is £3.99 when applicable. |
| Cassette and bottom matching bar | Optional group with a choice inside | `white` = White Standard, `black` = Black, `grey` = Grey. Existing charges: £0 / £7.99 / £7.99. Preserve the optional group's selection behavior. |
| Same fabric insert in cassette | Yes/No control | `no` / `yes`; current charge £0 / £8.99 when applicable. |
| Motorization | Optional control | Current motorized selection uses `motorized`, includes remote and charging wire, and has a £75 charge handled by the calculator. Do not create the old remote-channel choices from historical pricing rows. |

The charges above describe current site behavior. Do not enter them both as app add-ons and inside a formula that already includes them. For the initial inactive configuration, prepare the choices first and leave pricing unwired until the formula's responsibility is agreed.

Use [option-reference.md](lpo/option-reference.md) for exact existing IDs, labels and local image paths. These IDs are mapping references, not instructions to overwrite Shopify variant IDs. Keep a record of the actual internal option names generated by LPO; the formula must use those names.

## 5. Wire pricing after the option names are known

This site has 62 price bands, 9,843 dimension-price cells and 334 customization price entries. A simple width × height formula would change its prices.

Prepared files:

- [Product-to-band mapping](lpo/product-band-mapping.csv)
- [Customization prices](lpo/customization-prices.csv)
- `lpo/price-bands/`: individual dimension-price reference CSVs
- `lpo/pricing-engine.js`: offline calculator conversion
- [Offline comparison result](lpo/pricing-check.json)

**Do not import these CSVs as ready-made LPO configurations or paste the whole engine into an option's formula box.** The browser engine has not yet been installed and connected to the app.

The existing calculator rounds dimension inputs upward in inches and includes family-specific limits and exceptions. LPO's standard dimension list chooses ranges using lower thresholds, so direct import is not equivalent. [Price-list lookup behavior](https://docs.cloudlift.app/article/188-price-lists).

LPO provides a `{}` control beside eligible price fields; the Dimension option also exposes a formula in its Advanced settings. Once the option structure is known, the integration must map those inputs to the existing calculator, return a per-item price and surface invalid-size errors. [Formula documentation](https://docs.cloudlift.app/article/151-price-formula).

Base-price handling also needs checking. Do not set existing Shopify prices to zero. Do not enable the app-wide **Deduct variant price from price total** setting as a shortcut: it affects every configuration and ordinarily cannot reduce totals below the Shopify base price. Any conflict between current variant prices and the intended calculated price must be resolved before activation. [Cloudlift base-price behavior](https://docs.cloudlift.app/article/223-how-can-i-show-the-base-price-on-the-collection-page).

The prepared engine passed 84,460 offline comparisons. LPO and checkout have not yet passed equivalent tests.

## 6. Expand by family after the first configuration is verified

Avoid one universal option set. The current code distinguishes vertical blinds, replacement vertical slats, roller, day/night, Roman, venetian, faux wood, no-drill, Easy Stick subtypes, Perfect Fit subtypes, skylight and blackout/honeycomb products.

Examples of behavior that must be retained:

- Replacement vertical slats use height-only pricing and omit normal headrail controls.
- Regular vertical blinds condition headrail colour on Platinum selection and vary other choices by headrail/control.
- Roller and day/night cassette charges come from different categories even when colour names match.
- Skylight products use their own selection flow instead of the general measurement controls.
- Easy Stick and Perfect Fit products have subtype-specific fields and limits.

The complete visibility and validation rules are in `src/components/product/ProductPage.tsx`, supported by `src/data/categoryCustomizations.ts` and the family helper modules. Static option lists alone do not capture those rules.

## 7. Preview activation and acceptance

Before setting any configuration Active, verify that it will not appear on the published theme or alter existing products. The theme embed is theme-specific, but app settings and product assignments are shared. If the app's effects cannot be isolated, use a separate test store rather than changing the existing store to make a test work.

When isolation and formula mapping are confirmed, activate only the pilot configuration and open it using the unpublished preview link. An inactive configuration may legitimately show no fields in the theme preview.

[Preview the pilot product](https://online-blinds-express.myshopify.com/products/plain-soft-white-day-and-night-blind?preview_theme_id=200474362240)

Compare the old site and preview using identical measurements and selections. Include band boundaries, just above/below boundaries, units/fractions, out-of-range sizes, unavailable combinations, manual/motorized controls and every priced option. Then verify line properties, quantities, discounts, cart and checkout totals through an isolated testing approach. Purchasing remains disabled until that integration is ready.

The app's default field styling will not automatically reproduce the existing design; theme styling and interaction work remain part of the migration.

## What to send me next

Send screenshots of the app's **Plans → Extensions** area, the first inactive configuration's option list, and its **Dimension → Advanced** or formula panel. Include the internal option names if visible; leave account/billing details out of the screenshots. I can use those to prepare the specific field mapping and formula instructions without signing into your account.

The original Next.js site remains available throughout. Reviewing this Shopify theme uses a preview link; switching the public site later still requires a separately approved domain/routing change. Nothing in this guide publishes the theme.
