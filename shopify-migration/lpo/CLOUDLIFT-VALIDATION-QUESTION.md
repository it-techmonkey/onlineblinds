# Prepared Cloudlift follow-up — not sent

We are configuring an inactive/Draft LPO setup on Shopify Basic for made-to-measure blinds. Formula is enabled. The theme must remain unpublished and existing products/themes must retain their current behavior.

The pilot uses required Number options named `width` and `height`, a Select option `measurementUnit` (cm/mm), and a per-value price formula on the unit option. It uses our existing synchronous matrix calculator, including ceiling lookup and invalid-size rejection. Valid editor prices match the original calculator.

The original editor blocker is resolved. We found that calling `options.error('width', null)` adds an error in the current runtime rather than clearing it. We now remove only prior size-error strings through `options.option('width').errors`, and use config JavaScript to display a scoped accessible message and call native `setCustomValidity`. The script uses the same source calculator for validation only; prices remain in Formula. Zero/negative measurements are distinguished from blank required fields.

Seventeen editor cases now pass: valid prices, visible/native invalid-size errors, validation-test rejection and immediate recovery. The source controls synchronize with the real editor through public `updateValues` / `getValues` and options events. No real cart or checkout has been created.

Please confirm:

1. What is the supported API for clearing a previous Formula error on another Number field? Is filtering `options.option(name).errors` supported?
2. Can an inactive/Draft configuration be loaded on an unpublished theme for a private storefront/cart/checkout test? Is there a documented preview parameter or theme targeting mechanism?
3. If not, what isolation method do you recommend when the merchant has no development store and the published theme/products must remain unchanged?
4. What server-side enforcement does Bundle checkout provide for invalid or altered client-side matrix inputs? What additional validation is required before launch?

We can provide the pilot formula and configuration privately if needed. They contain no API credentials. Please do not activate the configuration, alter product prices or change the published theme as part of troubleshooting.
