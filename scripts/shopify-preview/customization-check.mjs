import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {root,work} from './env.mjs';
const {chromium}=createRequire(path.join(work,'tooling/package.json'))('playwright');
const state=JSON.parse(fs.readFileSync(path.join(root,'shopify-migration/preview.json')));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const results=[];
try {
 for(const handle of ['oasis-rock-vertical-blind','sierra-ice-white-perfect-fit-shutter-blind','non-driii-honeycomb-blackout-blinds']) {
  await page.goto(`https://${state.store}/products/${handle}?preview_theme_id=${state.id}`,{waitUntil:'domcontentloaded'});
  await page.locator('[data-ob-island="product-preview"] h1').waitFor();
  await page.waitForTimeout(1000);
  if(handle==='sierra-ice-white-perfect-fit-shutter-blind') {
   const customize=page.getByRole('button',{name:'Customize your blind',exact:true});
   await customize.waitFor();
   if(await customize.getAttribute('aria-expanded')==='true') await customize.click();
   await customize.click();
   if(await customize.getAttribute('aria-expanded')!=='true')throw new Error('Shutter customization failed to expand');
  }
  results.push({handle,...await page.evaluate(()=>({content:[...document.querySelectorAll('[data-ob-island="product-content"]')].map(e=>e.textContent.trim().slice(0,65)),accent:getComputedStyle(document.documentElement).getPropertyValue('--primary').trim(),overflow:document.documentElement.scrollWidth>innerWidth+1}))});
 }
 // Theme editor replaces sections without a full page reload. Exercise that lifecycle.
 const editor=await page.evaluate(async()=>{
  const section=document.createElement('section');section.id='test-editor-section';
  section.innerHTML='<div data-ob-island="product-content" data-ob-client="true"><script type="application/json" data-ob-props>{"kind":"faq"}</script></div>';
  document.body.append(section);section.dispatchEvent(new Event('shopify:section:load',{bubbles:true}));
  await new Promise(r=>setTimeout(r,500));const mounted=section.textContent.includes('Common Questions');
  section.dispatchEvent(new Event('shopify:section:unload',{bubbles:true}));const unmounted=!section.querySelector('h2');section.remove();
  const custom=document.createElement('section');
  const hero={customSlides:[{src:'/home/hero/hero-img1.webp',alt:'Preview image',title:'Custom hero verification',eyebrow:'Editor heading',buttonText:'Custom button',href:'/collections/all'}],interval:6000};
  const faq={heading:'Custom FAQ verification',subtitle:'Edited subtitle',items:[{id:1,question:'Custom question?',answer:'Custom answer.'}]};
  custom.innerHTML=`<div data-ob-island="hero" data-ob-client="true"><script type="application/json" data-ob-props>${JSON.stringify(hero)}</script></div><div data-ob-island="faq" data-ob-client="true"><script type="application/json" data-ob-props>${JSON.stringify(faq)}</script></div>`;
  document.body.append(custom);custom.dispatchEvent(new Event('shopify:section:load',{bubbles:true}));await new Promise(r=>setTimeout(r,600));
  const customHero=custom.querySelector('h1')?.textContent==='Custom hero verification';
  const customFaq=custom.querySelector('h2')?.textContent==='Custom FAQ verification'&&custom.textContent.includes('Custom question?');
  custom.dispatchEvent(new Event('shopify:section:unload',{bubbles:true}));custom.remove();
  return {mounted,unmounted,customHero,customFaq};
 });
 if(Object.values(editor).some(v=>!v)||errors.length||results.some(r=>r.overflow||r.accent!=='#800922'||!r.content.length))throw new Error(JSON.stringify({results,editor,errors}));
 const report={results,editor,errors};fs.writeFileSync(path.join(work,'customization-check.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
