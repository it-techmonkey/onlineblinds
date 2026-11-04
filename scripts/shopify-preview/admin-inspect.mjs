import path from 'node:path';
import { createRequire } from 'node:module';
import { work } from './env.mjs';
const require = createRequire(path.join(work, 'tooling/package.json'));
const { chromium } = require('playwright');
const browser = await chromium.connectOverCDP('http://127.0.0.1:9334');
for (const page of browser.contexts()[0].pages()) {
  const url = new URL(page.url());
  console.log(JSON.stringify({ origin: url.origin, path: url.pathname, title: await page.title() }));
  if (url.hostname !== 'admin.shopify.com') continue;
  for (const frame of page.frames()) {
    if (!/cloudlift\./.test(frame.url())) continue;
    const frameUrl = new URL(frame.url());
    console.log(JSON.stringify({ frameOrigin: frameUrl.origin, framePath: frameUrl.pathname, text: (await frame.locator('body').innerText()).slice(0, 14000) }));
  }
}
await browser.close();
