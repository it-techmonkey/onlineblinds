# Keeping both storefronts available

## Switch for review now

- Current Next.js storefront: https://onlineblindsexpress.co.uk
- Separate Shopify preview: https://online-blinds-express.myshopify.com?preview_theme_id=200474362240
- Preview editor: https://admin.shopify.com/store/online-blinds-express/themes/200474362240/editor

Use separate browser profiles for review to avoid Shopify preview cookies affecting other checks. The existing Next.js source and deployment remain intact. No public-domain switch has been made.

## Before an approved public switch

1. Complete LPO configuration and verify formula pricing, samples, installation, cart editing, discounts and checkout against the current site. Day & Night has 11 inactive configurations for 121 products and passed 66 editor checks. Roller price lists are prepared, with its option profiles and other families pending. Storefront LPO pricing is still off; editor tests do not establish cart/checkout acceptance. Review submission, account flow, newsletter discount behavior and analytics require production acceptance too.
2. Choose live data synchronization for catalog/prices/reviews. The preview currently uses generated snapshots. `node scripts/shopify-preview/refresh.mjs` refreshes them locally through read-only store access, then builds and checks. It does not upload or publish. A maintained refresh/deployment workflow or live integration is needed before launch.
3. Save an exact export of the DNS provider's current records, Vercel domain configuration, deployed revision/environment and Shopify primary-domain configuration. Read-only DNS lookup on 24 October found `www.onlineblindsexpress.co.uk` pointing at `d5a292862970ca84.vercel-dns-016.com`; this observation is not a complete rollback backup.
4. Keep the current Next.js deployment available at a verified separate hostname. Record and test it before changing domain routing. Do not remove the original deployment or its credentials.
5. Prepare redirects from `/product/<handle>` and legacy content/collection URLs, verify canonical URLs, sitemap, robots, consent and tracking. Remove the preview's noindex and purchasing restrictions only during the approved launch process.
6. Get the owner's explicit launch instruction before publishing the preview or changing domains. Publishing a Shopify theme does not by itself reroute the Next.js public domain.

## Reversal

Restore the saved DNS/Vercel routing configuration and, if changed during launch, Shopify's prior primary-domain settings. Verify the original site, cart and checkout after DNS propagation. Keep both deployments operational throughout. Carts, login sessions and in-progress orders do not automatically move between systems; switching routing is not a shared-session toggle.

This is the cutover procedure, not an implemented one-click production switch. Production routing remains unchanged until explicitly authorized.
