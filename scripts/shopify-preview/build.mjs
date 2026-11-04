import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { root, work, themePath } from './env.mjs';
const require = createRequire(path.join(root, 'package.json'));
const tooling = createRequire(path.join(work, 'tooling/package.json'));
const { build } = tooling('esbuild');
const postcss = tooling('postcss');
const tailwind = require('@tailwindcss/postcss');
const sharp = require('sharp');
for (const dir of ['assets', 'layout', 'sections', 'snippets', 'templates', 'config', 'locales']) fs.mkdirSync(path.join(themePath, dir), { recursive: true });
const write = (name, value) => {
  // JSON templates belong to the merchant once created. Do not reset editor choices.
  if (name.startsWith('templates/') && fs.existsSync(path.join(themePath, name))) return;
  fs.writeFileSync(path.join(themePath, name), value);
};
const json = value => JSON.stringify(value, null, 2);
const catalogue = JSON.parse(fs.readFileSync(path.join(work, 'catalog.json'), 'utf8'));
const runtime = path.join(root, 'shopify-src/adapters/runtime.tsx').replaceAll('\\', '/');
const plugins = [{ name: 'shopify-adapters', setup(b) {
  const productAdapter = path.join(root, 'shopify-src/product-preview.tsx').replaceAll('\\', '/');
  // Order line properties come from the live site's own server function, so LPO
  // orders carry exactly the keys and values the existing draft orders do.
  b.onResolve({ filter: /^ob-order-properties$/ }, args => ({ path: args.path, namespace: 'order-properties' }));
  b.onLoad({ filter: /.*/, namespace: 'order-properties' }, () => {
    const source = fs.readFileSync(path.join(root, 'src/lib/server/order.service.ts'), 'utf8').replace(/\r\n/g, '\n');
    const start = source.indexOf('function formatInchesAsCm(');
    const fnStart = source.indexOf('function buildLineItemProperties(', start);
    const end = source.indexOf('\n}\n', fnStart);
    if (start < 0 || fnStart < 0 || end < 0) throw new Error('Order property source structure changed');
    const imports = source.split('\n').filter(line => /^import .* from '@\/(lib\/(vertical-blinds|skylight|perfect-fit-shutter)|data\/skylight)';$/.test(line)).join('\n');
    return { contents: `${imports}\n${source.slice(start, end + 2).replace('item: CheckoutItemRequest', 'item: any')}\nexport { buildLineItemProperties };`, loader: 'ts', resolveDir: path.join(root, 'src/lib/server') };
  });
  b.onResolve({ filter: /^(@\/context\/AuthContext|@\/lib\/shopify-analytics)$/ }, args => ({ path: args.path, namespace: 'product-design' }));
  b.onLoad({ filter: /.*/, namespace: 'product-design' }, args => ({ contents: args.path === './ProductReviews' ? `export {Reviews as default} from '${productAdapter}';` : `export * from '${productAdapter}';`, loader: 'tsx', resolveDir: root }));
  b.onLoad({ filter: /ProductPage\.tsx$/ }, args => {
    let contents = fs.readFileSync(args.path, 'utf8');
    const bridge = path.join(root, 'shopify-src/lpo-bridge.ts').replaceAll('\\', '/');
    contents = `import {useLpoQuote, lpoAddToCart, lpoAttached, useLpoEditRestore} from '${bridge}';\n` + contents;
    // Cart "Edit" reopens this page (LPO ?item=<key>); restore the saved selections.
    const restoreAnchor = '  // Force motorization when arriving from a motorised collection page';
    if (!contents.includes(restoreAnchor)) throw new Error('Product option-card source structure changed');
    contents = contents.replace(restoreAnchor, '  useLpoEditRestore(product.slug, (saved: any) => { if (saved?.config) setConfig(saved.config); if (saved?.cards) setSelectedOptionalCards(saved.cards); });\n' + restoreAnchor);
    contents = contents.replace('  const totalPrice = useMemo(', '  const sourceTotalPrice = useMemo(');
    const quoteAnchor = '  const isRequiredCustomizationIncomplete = missingRequiredCustomizations.length > 0;';
    if (!contents.includes(quoteAnchor)) throw new Error('Product validation source structure changed');
    contents = contents.replace(quoteAnchor, quoteAnchor + `\n  const lpoQuote = useLpoQuote(product.slug, config, sourceTotalPrice, !showMinPriceIndicator && !isMeasurementOutOfRange && !isSizeUnavailable && !controlSizeConflict && !isRequiredCustomizationIncomplete, selectedCustomizations);\n  const totalPrice = lpoQuote.ready ? lpoQuote.price! : sourceTotalPrice;`);
    contents = `import {reviewFetch as fetch} from '${path.join(root, 'shopify-src/catalog-data.ts').replaceAll('\\', '/')}';\n` + contents;
    const handlersStart = contents.indexOf('  const handleAddToCart = async');
    const handlersEnd = contents.indexOf('\n  return (', handlersStart);
    // Purchases go through LPO, which attaches the options and bundle price.
    // Buttons stay disabled unless LPO has verified the same price as the source.
    contents = contents.slice(0, handlersStart) + '  const lpoPurchase = (buyNow: boolean) => { const invalidKeys = getInvalidFieldKeys(); if (invalidKeys.size > 0) { focusInvalidFields(invalidKeys); return; } setInvalidFields(new Set()); lpoAddToCart(buyNow, buildCheckoutItem(), product.tags, colourVariants.find((variant) => variant.colour === config.colour)?.id, {config, cards: selectedOptionalCards}, wantsInstallation); };\n  const handleAddToCart = () => lpoPurchase(false);\n  const handleBuyNow = () => lpoPurchase(true);\n' + contents.slice(handlersEnd);
    contents = contents.replace('validateCartPrice, createCheckout', '').replaceAll('isValidating || isCheckingOut', '!(lpoQuote.ready || ((isRequiredCustomizationIncomplete || showMinPriceIndicator) && lpoAttached()))');
    return { contents, loader: 'tsx', resolveDir: path.dirname(args.path) };
  });
  b.onLoad({filter:/ProductReviews\.tsx$/}, args => {
    let contents = fs.readFileSync(args.path,'utf8');
    // Review writing goes to Judge.me's public review endpoint (see catalog-data.ts).
    // The photo/video upload needs the live site's server, so it is left out here.
    const mediaStart=contents.indexOf('      {/* Media upload */}'), mediaEnd=contents.indexOf('      {error && <p className="text-sm text-red-600">');
    const main=contents.indexOf('interface ProductReviewsProps'), loadEnd=contents.indexOf('    } finally {', main);
    if(mediaStart<0||mediaEnd<mediaStart||main<mediaEnd||loadEnd<0)throw new Error('Review source structure changed');
    contents=contents.slice(0,mediaStart)+contents.slice(mediaEnd,loadEnd)+'    } catch { setData(null); } finally {'+contents.slice(loadEnd+'    } finally {'.length);
    contents=contents.replace('  const isEmpty = !data || data.totalReviews === 0;', '  if (!data) return <p role="status">Customer reviews are temporarily unavailable.</p>;\n  const isEmpty = data.totalReviews === 0;');
    return {contents: `import {reviewFetch as fetch} from '${path.join(root,'shopify-src/catalog-data.ts').replaceAll('\\','/')}';\n`+contents,loader:'tsx',resolveDir:path.dirname(args.path)};
  });
  // Videos are plain <video src> elements, not next/image, so map them to theme assets here.
  b.onLoad({ filter: /ProductFeatureSection\.tsx$/ }, args => ({ contents: `import {assetUrl} from '${runtime}';\n` + fs.readFileSync(args.path, 'utf8').replace(/src="(\/[^"]+\.mp4)"/g, 'src={assetUrl("$1")}'), loader: 'tsx', resolveDir: path.dirname(args.path) }));
  b.onLoad({ filter: /RelatedProducts\.tsx$/ }, args => ({contents: fs.readFileSync(args.path,'utf8').replace('data-gtm="related-product-cta"', 'disabled data-gtm="related-product-cta"'), loader:'tsx', resolveDir:path.dirname(args.path)}));
  b.onLoad({ filter: /BestSelling\.tsx$/ }, args => {
    let contents = fs.readFileSync(args.path, 'utf8');
    const start = contents.indexOf('async function getBestSellers');
    const end = contents.indexOf('  // If pricing came back broken');
    if (start < 0 || end < start) throw new Error('BestSelling source structure changed');
    contents = contents.slice(0, start) + 'const BestSelling = ({ products }: { products: ProductCardData[] }) => {\n' + contents.slice(end);
    contents = contents.replace('import { fetchProductsByCategoryPage, transformProduct } from \'@/lib/api\';', '');
    return { contents, loader: 'tsx', resolveDir: path.dirname(args.path) };
  });
  b.onResolve({ filter: /^(next\/(image|link|navigation)|@\/lib\/api|@\/context\/CartContext|@\/components|@\/components\/product)$/ }, args => ({ path: args.path, namespace: 'adapter' }));
  b.onLoad({ filter: /.*/, namespace: 'adapter' }, args => {
    let contents = `export * from '${runtime}';`;
    if (args.path === '@/lib/api') contents += `export {fetchPriceMatrix,fetchCustomizationPricing} from '${productAdapter}';`;
    if (args.path === 'next/image') contents += `export {Image as default} from '${runtime}';`;
    if (args.path === 'next/link') contents += `export {Link as default} from '${runtime}';`;
    if (args.path === '@/components') contents = 'export const Header=()=>null;export const Footer=()=>null;';
    if (args.path === '@/components/product') contents = `export {default as ProductCard} from '${path.join(root, 'src/components/product/ProductCard.tsx').replaceAll('\\', '/')}';`;
    return { contents, loader: 'tsx', resolveDir: root };
  });
  b.onLoad({ filter: /SearchPopover\.tsx$/ }, args => ({
    contents: `import {storefrontFetch as fetch} from '${runtime}';\n` + fs.readFileSync(args.path, 'utf8'), loader: 'tsx', resolveDir: path.dirname(args.path),
  }));
  // styled-jsx is a Next.js transform; these keyframes are ordinary theme CSS.
  b.onLoad({ filter: /[\\/]home[\\/]Hero\.tsx$/ }, args => ({ contents: fs.readFileSync(args.path, 'utf8').replace('<style jsx>', '<style>'), loader: 'tsx', resolveDir: path.dirname(args.path) }));
  b.onLoad({filter:/[\\/]home[\\/]FAQ\.tsx$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace('const FAQ = () => {','const defaultFaqData = faqData; const FAQ = ({items, heading="Common Questions", subtitle="Everything you need to know before ordering"}: any) => { const faqData = items?.length ? items : defaultFaqData;').replace('            Common Questions','            {heading}').replace('>Everything you need to know before ordering</p>','>{subtitle}</p>'),loader:'tsx',resolveDir:path.dirname(args.path)}));
  b.onLoad({ filter: /guides[\\/]page\.tsx$/ }, args => ({ contents: `import {assetUrl} from '${runtime}';\n` + fs.readFileSync(args.path, 'utf8').replace('href={guide.file}', 'href={assetUrl(guide.file)}'), loader: 'tsx', resolveDir: path.dirname(args.path) }));
}}];
const common = { bundle: true, jsx: 'automatic', tsconfig: path.join(root, 'tsconfig.json'), plugins, logLevel: 'warning' };
await build({ ...common, entryPoints: [path.join(root, 'shopify-src/ssr.tsx')], outfile: path.join(work, 'theme-ssr.mjs'), platform: 'node', format: 'esm', packages: 'external' });
const ssr = await import(pathToFileURL(path.join(work, 'theme-ssr.mjs')).href + `?v=${Date.now()}`);

const routes = {
  '/collections/light-filtering-vertical-blinds': '/collections/non-blackout-vertical-blinds',
  '/collections/light-filtering-roller-shades': '/collections/non-blackout-roller-blinds',
  '/collections/blackout-roller-shades': '/collections/blackout-roller-blinds',
  '/collections/waterproof-blinds': '/collections/waterproof-blackout-blinds',
  '/collections/motorised-roller-shades': '/collections/motorised-roller-blinds',
  '/collections/motorised-dual-zebra-shades': '/collections/motorised-day-night-blinds',
  '/collections/motorised-blinds': '/collections/motorized-blinds',
  '/collections/blackout-blinds': '/collections/all/blackout',
  '/collections/light-filtering-blinds': '/collections/all/light-filtering',
  '/collections/perfect-fit-blinds': '/collections/all/perfect-fit',
};
for (const slug of ssr.ALL_COLLECTION_SLUGS) {
  const existing = catalogue.collections.some(c=>c.handle===slug);
  routes['/collections/'+slug] = '/collections/'+(existing?slug:'all')+'?ob_collection='+slug;
}
globalThis.__obRoutes = routes;

const assets = {};
const assetFiles = {};
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
for (const source of walk(path.join(root, 'public'))) {
  const rel = '/' + path.relative(path.join(root, 'public'), source).replaceAll('\\', '/');
  const ext = path.extname(source).toLowerCase();
  if (!['.webp', '.jpg', '.jpeg', '.png', '.avif', '.svg', '.pdf', '.ico', '.gif', '.mp4'].includes(ext)) continue;
  const hash = createHash('sha256').update(rel).digest('hex').slice(0, 10);
  const raster = ['.jpg', '.jpeg', '.png', '.avif'].includes(ext);
  const name = `ob-${hash}-${path.basename(source, ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 55)}${raster ? '.webp' : ext}`;
  const dest = path.join(themePath, 'assets', name);
  if (!fs.existsSync(dest) || fs.statSync(source).mtimeMs > fs.statSync(dest).mtimeMs) {
    if (raster) await sharp(source).webp({ quality: 92 }).toFile(dest);
    else fs.copyFileSync(source, dest);
  }
  assets[rel] = `__OB_ASSET_${hash}__`; assetFiles[rel] = name;
}
globalThis.__obAssets = assets;
const pricingReference = await import(pathToFileURL(path.join(work, 'pricing-reference.mjs')).href);
const designData = { products: {}, matrices: {}, customizations: await pricingReference.getCustomizationPricing() };
for (const product of catalogue.products) {
  const band = await pricingReference.resolveHandleToPriceBand(product.handle);
  if (!band) continue;
  designData.products[product.handle] = band.id;
  designData.matrices[band.id] ||= await pricingReference.getPriceBandMatrix(band.id);
}
write('assets/ob-product-design.json', JSON.stringify(designData));
function liquidAssets(html) {
  for (const [url, token] of Object.entries(assets)) {
    html = html.replaceAll(token, `{{ '${assetFiles[url]}' | asset_url }}`);
    html = html.replaceAll(`href="${url}"`, `href="{{ '${assetFiles[url]}' | asset_url }}"`);
    html = html.replaceAll(`src="${url}"`, `src="{{ '${assetFiles[url]}' | asset_url }}"`);
  }
  html = html.replaceAll('href="/collections/all"', 'href="{{ routes.all_products_collection_url }}"')
    .replaceAll('href="/collections/', 'href="{{ routes.collections_url }}/')
    .replaceAll('href="/account"', 'href="{{ routes.account_url }}"')
    .replaceAll('href="/"', 'href="{{ routes.root_url }}"');
  return html;
}
function island(name, props = {}, client = false) {
  const markup = liquidAssets(ssr.renderIsland(name, props));
  return `<div data-ob-island="${name}"${client ? ' data-ob-client="true"' : ''}>${markup}</div>`;
}
const schema = name => { name = name.replace('Online Blinds ', 'Blinds '); return `{% schema %}${json({ name, settings: [], presets: [{ name }] })}{% endschema %}`; };
for (const name of ['header', 'footer', 'hero', 'trust', 'categories', 'craftsmanship', 'samples', 'faq', 'announcement']) {
  write(`sections/ob-${name}.liquid`, island(name, {}, name === 'announcement') + '\n' + schema(`Online Blinds ${name}`));
}
// Custom slide/FAQ blocks retain the source defaults until a merchant adds content.
write('sections/ob-hero.liquid', fs.readFileSync(path.join(root,'shopify-src/sections/hero.liquid'),'utf8'));
write('sections/ob-faq.liquid', fs.readFileSync(path.join(root,'shopify-src/sections/faq.liquid'),'utf8'));
for (const name of ['about', 'contact', 'guides', 'faq-page', 'warranty', 'privacy', 'refund', 'shipping', 'terms']) {
  write(`snippets/ob-page-${name}.liquid`, island(name));
}
write('snippets/ob-product-trust.liquid', liquidAssets(ssr.renderIsland('product-trust')));
write('snippets/ob-blackout-features.liquid', liquidAssets(ssr.renderIsland('blackout-features')));
write('snippets/ob-runtime.liquid', `<script>window.OnlineBlinds={purchasingEnabled:{{ settings.purchasing_enabled | json }},lpoCheckoutEnabled:{{ settings.lpo_checkout_enabled | json }},installationVariants:[{% for v in all_products['installation-service'].variants %}{id:{{ v.id | json }},title:{{ v.title | json }},price:{{ v.price | json }}}{% unless forloop.last %},{% endunless %}{% endfor %}],routes:${JSON.stringify(routes)},assets:{${Object.entries(assetFiles).map(([url, name]) => `${JSON.stringify(url)}:{{ '${name}' | asset_url | json }}`).join(',')}},minimumPrices:{% render 'ob-minimum-prices-json' %},collectionSlugs:${JSON.stringify(Object.keys(JSON.parse(fs.readFileSync(path.join(themePath, 'assets/ob-catalog-data.json'), 'utf8')).collections))}};</script>`);
write('snippets/ob-category-heroes.liquid', `{% case collection.handle %}\n${catalogue.collections.map(c => {
  const html = liquidAssets(ssr.renderIsland('category-hero', { title: ssr.COLLECTION_DISPLAY_NAMES[c.handle] || c.title, slug: c.handle, description: ssr.COLLECTION_DESCRIPTIONS[c.handle] || '', productCount: 999999 }));
  return `{% when '${c.handle}' %}${html.replace('999999 Products Available', '{{ collection.products_count }} Products Available')}`;
}).join('\n')}\n{% else %}${liquidAssets(ssr.renderIsland('category-hero', { title: 'All Products', description: 'Browse our complete range of premium window blinds.', productCount: 999999 })).replace('999999 Products Available', '{{ collection.products_count }} Products Available')}\n{% endcase %}`);

// Preserve product template assignments: create corresponding templates in the
// new theme, never change product.templateSuffix on the store.
const ref = fs.readFileSync(path.join(work, 'reference-theme/templates/product.json'), 'utf8');
const appType = ref.match(/shopify:\/\/apps\/live-product-options\/blocks\/app-block\/[a-z0-9-]+/)?.[0];
const settingsRef = fs.readFileSync(path.join(work, 'reference-theme/config/settings_data.json'), 'utf8');
const embedType = settingsRef.match(/shopify:\/\/apps\/live-product-options\/blocks\/app-embed\/[a-z0-9-]+/)?.[0];
if (!appType || !embedType) throw new Error('Verified Live Product Options app references are required.');
const supplemental = ['installation','faq','features','comparison','steps','recharge','warranty','table'];
const productTemplate = { sections: { main: { type: 'ob-product-design', settings: {} }, ...Object.fromEntries(supplemental.map(kind => [kind, {type:'ob-product-content', settings:{kind, audience:['installation','faq'].includes(kind)?'standard':'honeycomb'}}])) }, order: ['main', ...supplemental] };
for (const suffix of ['', ...new Set(catalogue.products.map(p => p.templateSuffix).filter(Boolean))]) write(`templates/product${suffix ? '.' + suffix : ''}.json`, json(productTemplate));
if (!fs.existsSync(path.join(themePath, 'config/settings_data.json'))) write('config/settings_data.json', json({ current: { purchasing_enabled: false, blocks: { lpo: { type: embedType, disabled: false, settings: {} } } }, presets: {} }));
const indexSections = ['hero', 'trust', 'categories', 'best-sellers', 'craftsmanship', 'samples', 'newsletter', 'faq'];
write('templates/index.json', json({ sections: Object.fromEntries(indexSections.map(n => [n, { type: `ob-${n}`, settings: {} }])), order: indexSections }));
for (const type of ['collection', 'cart', 'search', 'page', '404', 'list-collections']) write(`templates/${type}.json`, json({ sections: { main: { type: `ob-${type}`, settings: {} } }, order: ['main'] }));
for (const c of catalogue.collections) if (c.templateSuffix) write(`templates/collection.${c.templateSuffix}.json`, json({ sections: { main: { type: 'ob-collection', settings: {} } }, order: ['main'] }));
for (const name of ['faq', 'warranty']) write(`templates/page.${name}.json`, json({ sections: { main: { type: 'ob-page', settings: { content: name === 'faq' ? 'faq-page' : name } } }, order: ['main'] }));

// Home best sellers: the live site's first 8 of the best-sellers list, in its order
// (from the storefront snapshot). The hidden LPO helper product never appears there.
const catalogData = JSON.parse(fs.readFileSync(path.join(themePath, 'assets/ob-catalog-data.json'), 'utf8'));
const bestSellerHandles = (catalogData.collections['best-sellers']?.handles || []).filter(h => h !== 'product-options').slice(0, 8);
if (bestSellerHandles.length !== 8) throw new Error('Best-seller snapshot is missing.');
const bestSellerLoop = body => `{% assign ob_best = ${JSON.stringify(bestSellerHandles.join(','))} | split: ',' %}{% assign ob_first = true %}{% for ob_handle in ob_best %}{% assign card_product = all_products[ob_handle] %}{% if card_product.id %}${body}{% endif %}{% endfor %}`;
write('sections/ob-best-sellers.liquid', `<div data-ob-island="best-selling" data-ob-client="true"><script type="application/json" data-ob-props>{"products":[${bestSellerLoop(`{% unless ob_first %},{% endunless %}{% render 'ob-card-json', card_product: card_product %}{% assign ob_first = false %}`)}]}</script><section class="ob-section"><div class="ob-wrap"><h2 class="ob-title mb-10">Best Selling Products</h2><div class="ob-grid">${bestSellerLoop(`{% render 'ob-product-card', card_product: card_product %}`)}</div></div></section></div>\n{% schema %}{"name":"Blinds best sellers","settings":[],"presets":[{"name":"Blinds best sellers"}]}{% endschema %}`);
write('snippets/ob-collection-faq.liquid', island('faq'));
write('snippets/ob-empty-cart.liquid', island('empty-cart'));
// Native customer form (tag: newsletter). After a successful post it shows the
// live site's "You're all set!" state with the newsletter discount code.
let newsletter = liquidAssets(ssr.renderIsland('newsletter'));
const promotions = fs.readFileSync(path.join(root, 'src/data/promotions.ts'), 'utf8').replace(/\r\n/g, '\n');
const welcomeCode = promotions.match(/^export const NEWSLETTER_DISCOUNT_CODE = '([A-Z0-9]+)';$/m)?.[1];
const welcomePercent = promotions.match(/^export const NEWSLETTER_PERCENT_OFF = (\d+);$/m)?.[1];
if (!welcomeCode || !welcomePercent) throw new Error('Newsletter code source structure changed');
const nlStart = newsletter.indexOf('<div class="space-y-3 text-center">'), nlEnd = newsletter.indexOf('</p>', newsletter.indexOf('Unsubscribe anytime.')) + 4;
const formMatch = newsletter.match(/<form([^>]*)>/);
if (nlStart < 0 || nlEnd < 4 || !formMatch) throw new Error('Newsletter source structure changed');
const formClass = formMatch[1].match(/class="([^"]*)"/)?.[1] || '';
const signup = newsletter.slice(nlStart, nlEnd)
  .replace(formMatch[0], `<div class="${formClass}"><input type="hidden" name="contact[tags]" value="newsletter">`).replace('</form>', '</div>{% if form.errors %}<p role="alert" class="text-[13px] text-red-300">{% for field in form.errors %}{{ form.errors.messages[field] }} {% endfor %}</p>{% endif %}')
  .replace('type="email"', 'type="email" name="contact[email]"').replace('type="submit"', 'type="submit" onclick="var f=this.form;if(f.checkValidity()){var b=this;setTimeout(function(){b.disabled=true;b.textContent=\'Sending…\'},0)}"');
const done = `<div class="space-y-3"><h2 class="font-display text-[28px] font-semibold leading-tight text-white md:text-[38px]">You&#x27;re all set!</h2><p class="mx-auto max-w-md text-[15px] leading-relaxed text-white/80">Here&#x27;s your ${welcomePercent}% discount code. Enter it in your cart, alongside any other code.</p><div class="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row"><span class="rounded-[12px] border border-dashed border-white/40 bg-white/8 px-6 py-3 font-jost text-[18px] font-semibold tracking-[0.12em] text-white">${welcomeCode}</span><button type="button" onclick="var b=this;navigator.clipboard&&navigator.clipboard.writeText('${welcomeCode}').then(function(){b.textContent='Copied'}).catch(function(){})" class="h-12 rounded-[12px] bg-primary px-6 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-all hover:bg-primary-dark">Copy Code</button></div></div>`;
// Shopify posts the form, reloads the page and jumps to #ob-newsletter. The form
// needs its own box for that jump (display: contents has none), and the script
// re-centres it after late-loading sections above it have changed the layout.
const nlParent = newsletter.slice(0, nlStart).match(/<div class="(flex flex-col[^"]*)">\s*(?:<span[\s\S]*?<\/span>)?\s*$/)?.[1];
if (!nlParent) throw new Error('Newsletter layout structure changed');
const nlReturn = `<script>(function(){var f=document.getElementById('ob-newsletter');if(!f||!(/[?&]customer_posted=true/.test(location.search)||f.querySelector('[role=alert]')))return;var go=function(){f.scrollIntoView({block:'center'})};go();addEventListener('load',function(){setTimeout(go,50)})})()</script>`;
newsletter = newsletter.slice(0, nlStart) + `{% form 'customer', class: '${nlParent} w-full', id: 'ob-newsletter' %}{% if form.posted_successfully? %}${done}{% else %}${signup}{% endif %}{% endform %}${nlReturn}` + newsletter.slice(nlEnd);
write('sections/ob-newsletter.liquid', newsletter + '\n' + schema('Online Blinds newsletter'));

await build({ ...common, entryPoints: [path.join(root, 'shopify-src/browser.tsx')], outfile: path.join(themePath, 'assets/ob-storefront.js'), platform: 'browser', format: 'iife', minify: true, define: { 'process.env.NODE_ENV': '"production"', 'process.env.NEXT_PUBLIC_SHOPIFY_ANALYTICS_CURRENCY': '"GBP"' }, metafile: true });
const fontSource = path.join(work, 'font-source.css');
if (!fs.existsSync(fontSource)) {
  const response = await fetch('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Lora:ital,wght@0,500;0,600;0,700;1,500;1,600;1,700&display=swap', { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36' }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('Could not retrieve the existing site fonts.');
  fs.writeFileSync(fontSource, await response.text());
}
let fontCss = fs.readFileSync(fontSource, 'utf8');
for (const url of [...new Set([...fontCss.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]))]) {
  const name = 'ob-font-' + createHash('sha256').update(url).digest('hex').slice(0, 12) + path.extname(new URL(url).pathname);
  const destination = path.join(themePath, 'assets', name);
  if (!fs.existsSync(destination)) {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error('Could not download font.');
    fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
  }
  fontCss = fontCss.replaceAll(url, name);
}
write('assets/ob-fonts.css', fontCss);
const css = fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8').replace('@import "tailwindcss";', '@import "tailwindcss" source(none);\n@source "../components";\n@source "../app";\n@source "../../shopify-src";\n@source "../../shopify-theme/sections";\n@source "../../shopify-theme/snippets";');
const compiled = await postcss([tailwind({ optimize: true })]).process(css, { from: path.join(root, 'src/app/globals.css') });
write('assets/ob-storefront.css', compiled.css);
fs.writeFileSync(path.join(work, 'asset-manifest.json'), json(assetFiles));
console.log(`Built native Shopify theme: ${Object.keys(assetFiles).length} assets, reused site components and ${catalogue.products.length} unchanged product assignments.`);
