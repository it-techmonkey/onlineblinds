# Preview theme customization

Open **Online Store → Themes → Online Blinds - Shopify Preview → Customize**. Keep this theme unpublished.

## Available controls

- **Theme settings → Brand colors:** page background, text, accent/hover/light accent, cards, soft panels, secondary text, borders and gold accent. Defaults match the current design. Some original components still use fixed colors; these controls affect shared color tokens, not every decorative detail.
- **Product templates → Product content:** reorder, hide or remove installation, FAQ and the six honeycomb marketing sections. Choose the content and audience for each section. Standard products retain installation then FAQ; honeycomb retains its original six sections. Audience-mismatched sections show a note only in the editor.
- **Product templates → Blinds product design:** choose up to four related products and toggle their visibility. The current product is excluded. With no manual selection, the original site's automatic related-product selection is used from the catalog snapshot. Honeycomb intentionally retains its original layout without related products.
- **Product templates → Blinds product design → Connect configured LPO categories:** off by default. LPO app blocks and routing are staged for all 121 Day & Night handles while retaining the original visible controls. The 11 inactive configurations passed 66 editor pricing/validation checks. Leave this switch off until isolated storefront/cart/checkout verification is arranged; enabling a theme setting does not make a Draft app config available.
- **Add section → Custom image and text:** edit heading, rich text, image, button label/link, alignment, colors and vertical spacing. This section is available across JSON templates and can be reordered or removed.
- **Homepage → Blinds hero:** add/reorder up to eight image slides, with image descriptions, small headings, multiline headings, button labels/links and a slide interval. With no custom image slides, the existing seasonal slides remain in place.
- **Homepage → Blinds FAQ:** edit heading/subtitle and add/reorder up to 20 question/answer blocks. With no blocks, the existing questions remain in place.
- Existing homepage sections can be reordered, hidden or removed. Other internal copy/images remain source-controlled unless exposed by a dedicated control.

These controls are the first customization layer, not a claim that every original component is fully editable. Day & Night is configured as 11 Drafts for 121 products; Roller price lists are prepared, while its options and other families remain pending. Storefront/cart/checkout acceptance remains pending. Purchase controls remain disabled.

## Preserving edits during development

The build now creates JSON templates only when absent, preserving existing **local** section settings and order. Existing settings_data.json is also retained. Before another code upload after online editor changes, pull the preview's templates and config/settings_data.json into a separate working directory, review/merge them into shopify-theme, then build/check/upload. The uploader does not automatically merge remote editor edits; uploading stale local files could overwrite them. Never pull or push another theme as part of this workflow.

## Validation on 24 October 2026

- Build and TypeScript passed; theme check: zero errors, one existing generated-code complexity warning.
- Standard and honeycomb content rendered in their default order with the original accent color.
- Theme-editor section load/unload lifecycle passed without JavaScript errors.
- Product desktop/mobile checks passed with no detected overflow, broken images or forbidden purchase/API requests.
- Guarded upload confirmed the preview remains unpublished and all 10 existing themes unchanged.
- The shutter customization panel now renders and expands correctly. A read-only category-assignment snapshot restores product types that Liquid omits when their collection is unavailable to Online Store, without changing publication settings or existing products.

Run `node scripts/shopify-preview/product-categories.mjs` when catalog category assignments change, then check and upload the preview. This snapshot covers 1,886 products at validation time; it is not a live synchronization service. Its generated snippets are split to stay within Shopify's file-size and complexity limits.

Reviews, automatic related-product selection, vertical specifications, and collection membership/price sorting were restored in the 24 October follow-up. See design-review-completed.json and catalog-review-check.json. Catalog and reviews are snapshots that need refreshing. Day & Night has 11 inactive configurations for 121 products and passed 66 editor checks. Storefront/cart/checkout acceptance and other families remain pending. See lpo/PILOT-STATUS.md.
