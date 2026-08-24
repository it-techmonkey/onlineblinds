/**
 * Shopify Custom Pixel — GTM on checkout & thank-you pages
 * =========================================================
 *
 * This is NOT part of the Next.js build. It runs nowhere in this repo.
 * Paste it into Shopify Admin -> Settings -> Customer events -> Add custom pixel.
 *
 * Why this exists: the storefront's own GTM load (see src/app/layout.tsx,
 * container GTM-5KVNBLSF) only runs inside the Next.js app. Checkout is
 * created via a draft order and the customer is redirected to Shopify's own
 * hosted checkout (draftOrder.invoiceUrl) — a different domain the Next.js
 * bundle never touches. A custom pixel is Shopify's supported way to run
 * code on checkout/thank-you pages on non-Plus plans.
 *
 * The pixel runs in a sandboxed iframe with its OWN `window`/`dataLayer` —
 * it cannot see or merge with the storefront's dataLayer. That's fine here
 * since checkout is a separate page anyway; just don't expect continuity
 * with events pushed from src/lib/gtm.ts.
 *
 * Item fields are named to match src/lib/gtm.ts's GtmItem shape
 * (item_id, item_name, item_category, item_variant, price, quantity) so the
 * same GTM tags/triggers can read checkout events consistently with the
 * rest of the funnel.
 *
 * Replace GTM_CONTAINER_ID below only if you ever move checkout tracking to
 * a different container than the storefront's.
 */

(function (w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var f = d.getElementsByTagName(s)[0],
    j = d.createElement(s),
    dl = l != 'dataLayer' ? '&l=' + l : '';
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', 'GTM-5KVNBLSF');

function money(m) {
  return m ? Number(m.amount) : undefined;
}

function toItems(lineItems) {
  return (lineItems || []).map(function (li, index) {
    var variant = li.variant || {};
    var product = variant.product || {};
    var item = {
      item_id: variant.sku || variant.id || product.id || li.title,
      item_name: product.title || li.title,
      price: money(variant.price),
      quantity: li.quantity,
      index: index,
    };
    if (product.type) item.item_category = product.type;
    if (variant.title && variant.title !== 'Default Title') item.item_variant = variant.title;
    return item;
  });
}

function pushEcommerce(event, ecommerce) {
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event: event, ecommerce: ecommerce });
}

// checkout_started -> begin_checkout
analytics.subscribe('checkout_started', function (evt) {
  var checkout = evt.data.checkout;
  pushEcommerce('begin_checkout', {
    currency: checkout.currencyCode,
    value: money(checkout.totalPrice),
    items: toItems(checkout.lineItems),
  });
});

// checkout_shipping_info_submitted -> add_shipping_info
analytics.subscribe('checkout_shipping_info_submitted', function (evt) {
  var checkout = evt.data.checkout;
  pushEcommerce('add_shipping_info', {
    currency: checkout.currencyCode,
    value: money(checkout.totalPrice),
    shipping_tier: checkout.shippingLine ? checkout.shippingLine.title : undefined,
    items: toItems(checkout.lineItems),
  });
});

// payment_info_submitted -> add_payment_info
analytics.subscribe('payment_info_submitted', function (evt) {
  var checkout = evt.data.checkout;
  pushEcommerce('add_payment_info', {
    currency: checkout.currencyCode,
    value: money(checkout.totalPrice),
    items: toItems(checkout.lineItems),
  });
});

// checkout_completed -> purchase (the one that matters most: real order confirmation)
analytics.subscribe('checkout_completed', function (evt) {
  var checkout = evt.data.checkout;
  var discount = (checkout.discountApplications || [])[0];

  pushEcommerce('purchase', {
    transaction_id: (checkout.order && checkout.order.id) || checkout.token,
    currency: checkout.currencyCode,
    value: money(checkout.totalPrice),
    tax: money(checkout.totalTax),
    shipping: checkout.shippingLine ? money(checkout.shippingLine.price) : undefined,
    coupon: discount ? discount.title : undefined,
    items: toItems(checkout.lineItems),
  });
});
