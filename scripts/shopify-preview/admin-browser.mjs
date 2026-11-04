import path from 'node:path';
import { createRequire } from 'node:module';
import { work, storeDomain } from './env.mjs';
const require = createRequire(path.join(work, 'tooling/package.json'));
const { chromium } = require('playwright');
const store = storeDomain().replace('.myshopify.com', '');
const adminUrl = `https://admin.shopify.com/store/${store}/apps/live-product-options`;
// Reopen a visible window in our isolated profile if its browser is already
// running, rather than launching a second process against the same profile.
let existing;
try {
  existing = await chromium.connectOverCDP('http://127.0.0.1:9334', { timeout: 3000 });
} catch { /* No existing isolated browser; launch it below. */ }
if (existing) {
  const session = await existing.newBrowserCDPSession();
  const { targetId } = await session.send('Target.createTarget', { url: adminUrl, newWindow: true });
  const { windowId } = await session.send('Browser.getWindowForTarget', { targetId });
  await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal' } });
  await session.send('Target.activateTarget', { targetId });
  await session.detach();
  await existing.close();
  console.log('Separate Shopify Admin window reopened. Complete sign-in in that window.');
  process.exit(0);
}
const context = await chromium.launchPersistentContext(path.join(work, 'admin-chrome-profile'), {
  headless: false,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  viewport: null,
  args: ['--remote-debugging-port=9334', '--remote-debugging-address=127.0.0.1'],
});
const page = context.pages()[0] || await context.newPage();
await page.goto(adminUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.bringToFront();
console.log('Separate Shopify Admin browser opened. Sign in in the browser; credentials are not collected by this script.');
await new Promise(resolve => context.on('close', resolve));
