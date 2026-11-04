// Phase 6 cart flow on the unpublished preview: add, quantity, installation tiers,
// discount codes, edit, Buy Now (separate checkout) and clear. Stops at the checkout page.
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const {chromium} = createRequire('D:/Web/TechMonkeys/blinds/onlineblinds/.shopify-work/tooling/package.json')('playwright');
const reference = await import(pathToFileURL('D:/Web/TechMonkeys/blinds/onlineblinds/.shopify-work/pricing-reference.mjs').href);
const OUT = 'D:/Web/TechMonkeys/blinds/onlineblinds/.shopify-work/phase6/';
const STORE = 'https://online-blinds-express.myshopify.com';
const P = '?preview_theme_id=200474362240';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9334');
const page = await browser.contexts()[0].newPage();
await page.setViewportSize({width: 1400, height: 1000});
const results = [];
const check = (name, ok, detail) => { results.push({name, ok, detail}); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' - ' + detail : ''}`); };
const cart = () => page.evaluate(() => fetch('/cart.js').then((r) => r.json()));
const expectedFor = async (line) => {
  const p = line.properties, cm = p._measurementUnit === 'cm';
  const w = cm ? (Number(p._width) + Number(p._widthFraction || 0) / 10) / 2.54 : Number(p._width) / 25.4;
  const h = cm ? (Number(p._height) + Number(p._heightFraction || 0) / 10) / 2.54 : Number(p._height) / 25.4;
  const customizations = (p._customizations || '').split('|').filter(Boolean).map((s) => { const i = s.indexOf(':'); return {category: s.slice(0, i), optionId: s.slice(i + 1)}; });
  return Math.round((await reference.calculateProductPrice({handle: line.handle, widthInches: w, heightInches: h, customizations})).totalPrice * 100);
};
async function configure(handle, width, height, edit) {
  await page.goto(`${STORE}/products/${handle}${P}${edit ? '&item=' + encodeURIComponent(edit) : ''}`, {waitUntil: 'domcontentloaded'});
  await page.waitForFunction(() => window.OnlineBlindsLpoPilot?.instance, null, {timeout: 30000});
  await page.waitForTimeout(2500);
  const w = page.locator('input[type=number]').first(), h = page.locator('input[type=number]').nth(1);
  if (edit) return {w: await w.inputValue(), h: await h.inputValue()};
  await w.fill(String(width)); await h.fill(String(height));
  await page.getByRole('button', {name: /^Inside Recess/}).click();
  await page.getByRole('button', {name: /^Select$/}).first().click();
  await page.waitForTimeout(400);
  const option = page.locator('[role=option], [role=listbox] li, [role=menu] button').first();
  if (await option.count()) await option.click(); else await page.keyboard.press('Escape');
  await page.getByPlaceholder('Ex: West Wall').fill('Test');
  const roll = page.getByRole('button', {name: /^Standard Roll/});
  if (await roll.count()) await roll.click();
  await page.getByText(/^Continuous Chain/).first().click();
  for (const name of ['Select location', 'Select chain color']) {
    await page.getByRole('button', {name}).first().click(); await page.waitForTimeout(400);
    await page.locator('[role=option], [role=listbox] li, [role=menu] button').first().click();
  }
  await page.waitForTimeout(1500);
}
const addButton = () => page.getByRole('button', {name: /^Add to Cart — /}).first();
try {
  await page.goto(STORE + '/cart' + P, {waitUntil: 'domcontentloaded'});
  await page.evaluate(() => fetch('/cart/clear.js', {method: 'POST'}));

  // 1. Add to cart
  await configure('cairo-blackout-beige-roller-blind', 100, 120);
  const label = await addButton().innerText();
  await Promise.all([page.waitForURL(/\/cart/, {timeout: 30000}), addButton().click()]);
  await page.waitForTimeout(3000);
  let c = await cart();
  let line = c.items[0];
  check('add to cart', c.items.length === 1 && line.price === await expectedFor(line), `${label} -> cart ${line?.price} (live ${line && await expectedFor(line)})`);
  check('page state saved on line', Boolean(line?.properties?._ob_config));

  // 2. Quantity + installation + discount on the cart page
  await page.getByRole('button', {name: 'Increase quantity'}).click(); await page.waitForTimeout(3000);
  c = await cart(); check('quantity up', c.items.find((i) => i.key === line.key)?.quantity === 2, 'total ' + c.total_price);
  await page.getByRole('checkbox').first().click(); await page.waitForTimeout(3500);
  c = await cart(); let inst = c.items.find((i) => i.handle === 'installation-service');
  check('installation 2 blinds = £60', inst?.variant_title === '2-5 Blinds' && inst.price === 6000 && inst.quantity === 1, inst?.variant_title);
  await page.getByRole('button', {name: 'Decrease quantity'}).click(); await page.waitForTimeout(3500);
  c = await cart(); inst = c.items.find((i) => i.handle === 'installation-service');
  check('installation 1 blind = £40', inst?.variant_title === '1 Blind' && inst.price === 4000, inst?.variant_title);
  await page.getByLabel('Discount code').fill('NOTACODE1'); await page.getByRole('button', {name: 'Apply'}).click(); await page.waitForTimeout(3500);
  check('invalid code rejected', await page.getByText('Invalid discount code').isVisible() && !(await cart()).discount_codes.length);
  await page.getByLabel('Discount code').fill('FINAL10'); await page.getByRole('button', {name: 'Apply'}).click(); await page.waitForTimeout(3500);
  c = await cart();
  const gross = c.items.reduce((s, i) => s + i.original_line_price, 0);
  check('FINAL10 applied', c.discount_codes.some((d) => d.applicable) && c.total_discount > 0, `discount ${c.total_discount} of ${gross}, total ${c.total_price}`);
  console.log('SUMMARY TEXT:', (await page.locator('aside').first().innerText()).replace(/\n+/g, ' | '));
  await page.screenshot({path: OUT + 'cart-after.png'});
  await page.getByRole('button', {name: 'Remove', exact: true}).click(); await page.waitForTimeout(3000);
  check('discount removed', !(await cart()).discount_codes.length);

  // 3. Edit the line
  line = (await cart()).items.find((i) => i.handle !== 'installation-service');
  const restored = await configure(line.handle, 0, 0, line.key);
  check('edit restores page', restored.w === '100' && restored.h === '120', JSON.stringify(restored));
  await page.locator('input[type=number]').first().fill('150'); await page.waitForTimeout(2500);
  const editLabel = await addButton().innerText();
  await Promise.all([page.waitForURL(/\/cart/, {timeout: 30000}), addButton().click()]);
  await page.waitForTimeout(3500);
  c = await cart();
  const blinds = c.items.filter((i) => i.handle !== 'installation-service');
  check('edit updates the line in place', blinds.length === 1 && blinds[0].properties._width === '150' && blinds[0].price === await expectedFor(blinds[0]) && String(blinds[0].properties.Width).startsWith('150'), `${editLabel} -> ${blinds[0]?.price}, Width ${blinds[0]?.properties.Width}, lines ${c.items.length}`);
  check('installation kept', c.items.some((i) => i.handle === 'installation-service'));
  const before = JSON.stringify((await cart()).items.map((i) => [i.key, i.quantity]));

  // 4. Buy Now with installation ticked on the product page (separate checkout; cart untouched)
  await configure('cairo-blackout-beige-roller-blind', 90, 110);
  const box = page.locator('input[type=checkbox]:visible').first();
  await box.check();
  await page.waitForTimeout(800);
  const buyLabel = await addButton().innerText();
  await Promise.all([page.waitForURL(/checkouts|\/cart\/c\//, {timeout: 40000}), page.getByRole('button', {name: 'Buy Now'}).first().click()]);
  await page.waitForTimeout(10000);
  const text = (await page.innerText('body')).replace(/\n+/g, ' | ');
  const at = text.indexOf('Order summary');
  console.log('CHECKOUT SUMMARY:', text.slice(at, at + 700));
  await page.screenshot({path: OUT + 'buy-now-checkout.png'});
  await page.goto(STORE + '/cart' + P, {waitUntil: 'domcontentloaded'});
  const after = JSON.stringify((await cart()).items.map((i) => [i.key, i.quantity]));
  check('buy now leaves cart untouched', before === after, after);
  check('buy now reached checkout', /Installation Service/.test(text), buyLabel);

  // 5. Clear cart via the confirm dialog
  await page.waitForTimeout(2500);
  await page.getByRole('button', {name: 'Clear Cart'}).first().click();
  await page.getByRole('dialog').getByRole('button', {name: 'Clear Cart'}).click(); await page.waitForTimeout(3000);
  check('clear cart', (await cart()).item_count === 0);
} catch (e) { console.log('ERROR', e.message.split('\n')[0]); await page.screenshot({path: OUT + 'error.png'}).catch(() => {}); }
finally { await page.evaluate(() => fetch('/cart/clear.js', {method: 'POST'})).catch(() => {}); await page.close(); await browser.close(); }
console.log(JSON.stringify({passed: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length}));
