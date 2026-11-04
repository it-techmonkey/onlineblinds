import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { root, work } from './env.mjs';
const { chromium }=createRequire(path.join(work,'tooling/package.json'))('playwright');
const state=JSON.parse(fs.readFileSync(path.join(root,'shopify-migration/preview.json')));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(state.preview_url,{waitUntil:'domcontentloaded'});await page.waitForTimeout(1500);
const origin=new URL(page.url()).origin;
const links=await page.evaluate(()=>[...new Set([...document.querySelectorAll('[data-ob-island="header"] a,[data-ob-island="footer"] a')].map(a=>a.getAttribute('href')).filter(h=>h?.startsWith('/')&&!h.startsWith('/account')))]);
const routes=[];
for(let i=0;i<links.length;i+=4){
  const results=await Promise.allSettled(links.slice(i,i+4).map(async href=>{const url=new URL(href,origin);url.searchParams.set('preview_theme_id',String(state.id));const r=await page.request.get(url.href);return {href,status:r.status()};}));
  for(const result of results){if(result.status==='fulfilled')routes.push(result.value);else errors.push(String(result.reason));}
}
const searches=[];
for(const [name,q] of [['empty',''],['results','white'],['none','zzzz-no-matching-blind-12345']]){
  await page.goto(`${origin}/search?type=product&q=${q}&preview_theme_id=${state.id}`,{waitUntil:'domcontentloaded'});
  await page.locator('[data-ob-island="search-design"] form').waitFor();await page.waitForTimeout(1000);
  if(name==='none')await page.getByRole('heading',{name:'No products found'}).waitFor();
  if(name==='results'&&!await page.locator('[data-ob-island="search-design"] a[href*="/products/"]').count())throw new Error('Search result cards missing');
  for(const [view,width,height]of[['desktop',1440,1000],['mobile',390,844]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(300);
    await page.screenshot({path:path.join(work,`search-${name}-${view}.png`),fullPage:true});
    searches.push({name,view,...await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,themeId:window.Shopify.theme.id}))});
  }
}
const report={routes,searches,errors};fs.writeFileSync(path.join(work,'search-navigation-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
if(errors.length||routes.some(r=>r.status>=400)||searches.some(r=>r.overflow||String(r.themeId)!==String(state.id)))process.exitCode=1;
