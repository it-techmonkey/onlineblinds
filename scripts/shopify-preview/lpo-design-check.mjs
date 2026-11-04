import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {work} from './env.mjs';
const {chromium}=createRequire(path.join(work,'tooling/package.json'))('playwright');
const state=JSON.parse(fs.readFileSync('shopify-migration/preview.json'));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const results=[];
try{
 for(const width of [1440,390]){
  const pages={};
  for(const [name,url]of [['source','https://onlineblindsexpress.co.uk/product/plain-soft-white-day-and-night-blind'],['preview',`https://${state.store}/products/plain-soft-white-day-and-night-blind?preview_theme_id=${state.id}`]]){
   const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});const measure=page.getByRole('button',{name:'Measure your windows',exact:true});await measure.waitFor({timeout:30000});await page.waitForTimeout(1600);
   if(await measure.getAttribute('aria-expanded')!=='true')await measure.click();
   const fields=page.locator('input[type="number"]');await fields.nth(0).fill('100');await fields.nth(1).fill('120');await fields.nth(1).blur();await page.waitForTimeout(800);
   const panel=measure.locator('..');await panel.screenshot({path:path.join(work,`lpo-design-${name}-${width}.png`)});
   const details=await panel.evaluate(el=>({text:el.innerText,font:getComputedStyle(el).fontFamily,rect:{width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height},controls:[...el.querySelectorAll('input,select,button')].map(e=>({tag:e.tagName,type:e.type,label:e.getAttribute('aria-label'),text:e.tagName==='BUTTON'?e.textContent:null})),overflow:document.documentElement.scrollWidth>innerWidth+1}));
   const customize=page.getByRole('button',{name:'Customize your blind',exact:true});
   if(await customize.getAttribute('aria-expanded')!=='true')await customize.click();
   const customPanel=customize.locator('..');
   const readCustom=()=>customPanel.evaluate(el=>({text:el.innerText,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,controls:[...el.querySelectorAll('input,select,button')].map(e=>({tag:e.tagName,type:e.type,text:e.tagName==='BUTTON'?e.textContent:null}))}));
   const manual=await readCustom();await customPanel.screenshot({path:path.join(work,`lpo-options-manual-${name}-${width}.png`)});
   await page.getByRole('heading',{name:'Motorization',exact:true}).click();await page.waitForTimeout(500);
   const motorized=await readCustom();await customPanel.screenshot({path:path.join(work,`lpo-options-motorized-${name}-${width}.png`)});
   pages[name]={...details,manual,motorized,errors};await page.close();
  }
  const textEqual=pages.source.text===pages.preview.text;
  const controlsEqual=JSON.stringify(pages.source.controls)===JSON.stringify(pages.preview.controls);
  const layoutEqual=Math.abs(pages.source.rect.width-pages.preview.rect.width)<1&&Math.abs(pages.source.rect.height-pages.preview.rect.height)<1;
  const manualEqual=JSON.stringify(pages.source.manual)===JSON.stringify(pages.preview.manual);
  const motorizedEqual=JSON.stringify(pages.source.motorized)===JSON.stringify(pages.preview.motorized);
  results.push({viewport:width,source:pages.source,preview:pages.preview,textEqual,controlsEqual,layoutEqual,manualEqual,motorizedEqual,passed:textEqual&&controlsEqual&&layoutEqual&&manualEqual&&motorizedEqual&&!pages.preview.overflow&&!pages.preview.errors.length});
 }
 const report={date:'2026-10-27',scope:'Measurement and manual/motorized customization panels on the current website and unpublished theme. Same source React controls retained; LPO native controls are not displayed.',passed:results.every(r=>r.passed),results};fs.writeFileSync('shopify-migration/lpo/pilot-design-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,results:results.map(({viewport,textEqual,controlsEqual,layoutEqual,manualEqual,motorizedEqual,source,preview})=>({viewport,textEqual,controlsEqual,layoutEqual,manualEqual,motorizedEqual,source:source.rect,preview:preview.rect}))},null,2));if(!report.passed)process.exitCode=1;
}finally{await browser.close();}
