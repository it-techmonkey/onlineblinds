import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {readAdmin,root,work} from './env.mjs';
const {chromium}=createRequire(path.join(work,'tooling/package.json'))('playwright');
const catalog=JSON.parse(fs.readFileSync(path.join(work,'catalog.json')));
const state=JSON.parse(fs.readFileSync(path.join(root,'shopify-migration/preview.json')));
const families=['vertical-blinds','replacement-vertical-blinds-slat','roller-blinds','day-and-night-blinds','roman-blinds','metal-venetian-blind','faux-wooden-blinds','no-drill-blinds','easy-stick-blinds','perfect-fit-metal','perfect-fit-wooden','perfect-fit-shutter','skylight-blinds','pleated-blinds'];
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage();const reports=[];
try{for(const family of families){
 const collection=catalog.collections.find(c=>c.handle===family);if(!collection)throw new Error(`Missing family ${family}`);
 const result=await readAdmin('query($id:ID!){collection(id:$id){products(first:1){nodes{handle}}}}',{id:collection.id});
 const handle=result.collection.products.nodes[0]?.handle;if(!handle)throw new Error(`Empty family ${family}`);
 for(const site of (process.argv.includes('--preview-only') ? ['preview'] : ['current','preview'])){
  const url=site==='current'?`https://onlineblindsexpress.co.uk/product/${handle}`:`https://${state.store}/products/${handle}?preview_theme_id=${state.id}`;
  const errors=[];const listener=e=>errors.push(e.message);page.on('pageerror',listener);
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(1200);
  const views=[];
  for(const [view,width,height]of[['desktop',1440,1000],['mobile',390,844]]){
   await page.setViewportSize({width,height});await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}scrollTo(0,0);});await page.waitForTimeout(250);
   views.push({view,...await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>e.textContent),brokenImages:[...document.images].filter(i=>i.complete&&!i.naturalWidth).length}))});
   if(['day-and-night-blinds','easy-stick-blinds','skylight-blinds'].includes(family))await page.screenshot({path:path.join(work,`review-${family}-${site}-${view}.png`),fullPage:true});
  }
  page.off('pageerror',listener);reports.push({family,handle,site,status:response.status(),views,errors});
 }
 console.log(`Compared ${family}`);
 fs.writeFileSync(path.join(work,process.argv.includes('--preview-only') ? 'visual-review-after.json' : 'visual-review.json'),JSON.stringify(reports,null,2));
}}finally{await browser.close();}
const failures=reports.filter(r=>r.status!==200||r.errors.length||r.views.some(v=>v.overflow||v.brokenImages));
console.log(JSON.stringify({pages:reports.length,failures},null,2));
if(failures.length)process.exitCode=1;
