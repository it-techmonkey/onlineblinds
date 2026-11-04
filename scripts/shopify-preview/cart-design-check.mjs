import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { root, work } from './env.mjs';
const { chromium } = createRequire(path.join(work, 'tooling/package.json'))('playwright');
const state = JSON.parse(fs.readFileSync(path.join(root,'shopify-migration/preview.json')));
const fixture = {currency:'GBP',item_count:3,items_subtotal_price:36000,total_price:32400,cart_level_discount_applications:[{title:'DESIGN TEST',total_allocated_amount:3600}],items:[
  {key:'design-1',product_title:'Plain Soft White Day and Night Blind',url:'/products/plain-soft-white-day-and-night-blind',image:'/products/cassetteBar/zebra_shade_cassette_and_bottom_bar_white.png',quantity:2,final_line_price:24000,properties:{Width:'100 cm',Height:'120 cm','Installation Method':'Inside Recess','Blind Name':'Living room',_cl_options:'private-test-value'}},
  {key:'design-2',product_title:'Roller blind with a longer product name for mobile layout verification',url:'/collections/roller-blinds',image:'/products/cassetteBar/standard-white-cassette-roller.png',quantity:1,final_line_price:12000,properties:{Width:'80 cm',Height:'140 cm',Control:'Left'}}]};
const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page = await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(state.preview_url,{waitUntil:'domcontentloaded'});
await page.route('**/cart?*',async route=>{
  if(!route.request().isNavigationRequest()) return route.continue();
  const response=await route.fetch();
  const html=(await response.text()).replace(/(<script type="application\/json" data-ob-props>)\{"cart":[\s\S]*?(<\/script>)/,(_,start,end)=>start+JSON.stringify({cart:fixture})+end);
  await route.fulfill({response,body:html});
});
await page.goto(`https://${state.store}/cart?preview_theme_id=${state.id}`,{waitUntil:'domcontentloaded'});
await page.getByRole('heading',{name:'Order Summary'}).waitFor();
const cart=page.locator('[data-ob-island="cart-design"]');
if(await cart.locator('article').count()!==2) throw new Error('Cart fixture not rendered');
if((await cart.innerText()).includes('private-test-value')) throw new Error('Private properties exposed');
if(!await cart.getByText('£324.00',{exact:true}).count()) throw new Error('Wrong total');
await page.getByLabel('Discount code').fill('DESIGN TEST');
for(const b of await cart.locator('button').all()) {
  // Installation information remains an interactive help control.
  if(/Clear Cart|Edit|Apply|Proceed to Checkout|^[+−×]$/.test((await b.innerText()).trim()) && !await b.isDisabled()) throw new Error('Mutation control enabled');
}
const views=[];
for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(500);
  await page.screenshot({path:path.join(work,`cart-design-${name}.png`),fullPage:true});
  views.push(await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,themeId:window.Shopify.theme.id,brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).length})));
}
await browser.close();console.log(JSON.stringify({views,errors,fixtureOnly:true},null,2));
if(errors.length||views.some(v=>v.overflow||v.brokenImages||String(v.themeId)!==String(state.id)))process.exitCode=1;
