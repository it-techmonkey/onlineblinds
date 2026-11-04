import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {root,work,themePath} from './env.mjs';
const {chromium}=createRequire(path.join(work,'tooling/package.json'))('playwright');
const state=JSON.parse(fs.readFileSync(path.join(root,'shopify-migration/preview.json')));
const catalog=JSON.parse(fs.readFileSync(path.join(themePath,'assets/ob-catalog-data.json')));
const reviews=JSON.parse(fs.readFileSync(path.join(themePath,'assets/ob-reviews-data.json')));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage();const errors=[],writes=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()!=='GET'&&/\/api\/reviews|\/cart\/add|\/checkout/.test(r.url()))writes.push(r.url().split('?')[0]);});
try{
 for(const [slug,sort,p]of[['roller-blinds','price-low',1],['roller-blinds','price-high',2],['blackout-blinds','price-low',1],['perfect-fit-blinds','name-az',1],['light-filtering-vertical-blinds','best-selling',1]]){
  await page.goto(`https://${state.store}/collections/all?ob_collection=${slug}&sort=${sort}&page=${p}&preview_theme_id=${state.id}`,{waitUntil:'domcontentloaded'});
  await page.locator('[data-ob-island="collection-design"] select').waitFor();
  let expected=catalog.collections[slug].handles.map(h=>catalog.products[h]);
  if(sort==='price-low')expected.sort((a,b)=>a.price-b.price);if(sort==='price-high')expected.sort((a,b)=>b.price-a.price);if(sort==='name-az')expected.sort((a,b)=>a.name.localeCompare(b.name));
  expected=expected.slice((p-1)*24,p*24).map(p=>p.slug);
  const actual=await page.locator('[data-ob-island="collection-design"] a[href*="/products/"]').evaluateAll(links=>[...new Set(links.map(a=>new URL(a.href).pathname.split('/').pop()))]);
  if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error(`Collection mismatch: ${slug} ${sort} page ${p}`);
  checks.push({slug,sort,page:p,products:actual.length});console.log(`Verified ${slug} ${sort} page ${p}`);
 }
 const handle='oasis-rock-vertical-blind';
 await page.goto(`https://${state.store}/products/${handle}?preview_theme_id=${state.id}`,{waitUntil:'domcontentloaded'});
 await page.getByRole('heading',{name:'Details & Specifications',exact:true}).waitFor();
 await page.getByRole('heading',{name:'Related Products',exact:true}).waitFor();
 await page.getByRole('heading',{name:reviews.products[handle]?.totalReviews?'Rating snapshot':'Customer reviews',exact:true}).first().waitFor();
 const related=await page.locator('section').filter({has:page.getByRole('heading',{name:'Related Products',exact:true})}).last().locator('h3').allTextContents();
 if(JSON.stringify(related)!==JSON.stringify(catalog.products[handle].related.map(h=>catalog.products[h].name)))throw new Error('Related products differ');
 for(const button of await page.getByRole('button',{name:'Write a review',exact:true}).all())if(!await button.isDisabled())throw new Error('Review submission enabled');
 await page.getByRole('button',{name:/^Specifications/}).click();
 if(!await page.locator('table').count())throw new Error('Specification table missing');
 for(const [width,height]of[[1440,1000],[390,844]]){
  await page.setViewportSize({width,height});await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}scrollTo(0,0);});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error('Product overflow');
  await page.screenshot({path:path.join(work,`completed-product-${width}.png`),fullPage:true});
 }
 await page.goto(`https://${state.store}/search?q=white&type=product&sort=price-high&preview_theme_id=${state.id}`,{waitUntil:'domcontentloaded'});
 await page.locator('[data-ob-island="search-design"] select').waitFor({timeout:60000});
 if(await page.locator('[data-ob-island="search-design"] select').inputValue()!=='price-high')throw new Error('Search sort lost');
 if(errors.length||writes.length)throw new Error(JSON.stringify({errors,writes}));
 const report={collections:checks,product:{handle,related,reviewCount:reviews.products[handle]?.totalReviews||0,specifications:true},searchSort:true,errors,writes};
 fs.writeFileSync(path.join(root,'shopify-migration/catalog-review-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
