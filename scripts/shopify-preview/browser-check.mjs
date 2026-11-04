import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { root, work } from './env.mjs';
const require = createRequire(path.join(work, 'tooling/package.json'));
const { chromium } = require('playwright');
const state = JSON.parse(fs.readFileSync(path.join(root, 'shopify-migration/preview.json'), 'utf8'));
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/adity/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Europe/London' });
const page = await context.newPage();
const errors = [], failures = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.status() >= 400 && /ob-|\/assets\/|\.woff2/.test(r.url())) failures.push({ status: r.status(), url: r.url() }); });
await page.goto(state.preview_url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4500);
const origin = new URL(page.url()).origin;
const reports = [];
for (const [name, pathname] of [['home', '/'], ['collection', '/collections/day-and-night-blinds'], ['product', '/products/plain-soft-white-day-and-night-blind'], ['guides', '/pages/instructions-for-measuring-fitting-guides'], ['cart', '/cart']]) {
  if (name !== 'home') await page.goto(`${origin}${pathname}?preview_theme_id=${state.id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  // Exercise the actual scroll-reveal and lazy-image behavior before capturing
  // full-page images; capturing only the initial viewport hides lower sections.
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 650) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(500);
  const details = await page.evaluate(() => ({
    title: document.title, headings: [...document.querySelectorAll('h1')].map(e => e.textContent),
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    brokenImages: [...document.images].filter(i => i.complete && !i.naturalWidth).map(i => i.src),
    islandCount: document.querySelectorAll('[data-ob-island]').length,
    unrevealedSections: document.querySelectorAll('.polish-reveal:not(.polish-visible)').length,
    themeId: window.Shopify?.theme?.id,
    themeRole: window.Shopify?.theme?.role,
    productButtonsDisabled: [...document.querySelectorAll('[data-ob-product-form] button[name="add"], [data-ob-island="product-preview"] button')].filter(b => b.name === 'add' || /^(Add to Cart|Buy Now)/.test(b.textContent.trim())).every(b => b.disabled),
  }));
  if (String(details.themeId) !== String(state.id)) throw new Error(`Wrong preview theme on ${name}: ${details.themeId}`);
  await page.screenshot({ path: path.join(work, `preview-${name}-desktop.png`), fullPage: true });
  if (name === 'home') {
    const faq = page.getByRole('button', { name: 'How do I measure my windows for blinds?' });
    await faq.click();
    await page.waitForFunction(() => document.querySelector('[data-ob-island="faq"] button')?.getAttribute('aria-expanded') === 'true');
    details.faqExpanded = await faq.getAttribute('aria-expanded');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(500);
  details.mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  await page.screenshot({ path: path.join(work, `preview-${name}-mobile.png`), fullPage: true });
  reports.push({ name, url: page.url(), ...details });
  await page.setViewportSize({ width: 1440, height: 1000 });
}
const report = { pages: reports, errors: [...new Set(errors)], assetFailures: failures };
fs.writeFileSync(path.join(work, 'browser-check.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
await browser.close();
if (errors.length || failures.length || reports.some(p => p.overflow || p.mobileOverflow || p.brokenImages.length || p.unrevealedSections || !p.productButtonsDisabled)) process.exitCode = 1;
