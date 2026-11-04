import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { root,work } from './env.mjs';
const {chromium}=createRequire(path.join(work,'tooling/package.json'))('playwright');
const state=JSON.parse(fs.readFileSync(path.join(root,'shopify-migration/preview.json')));
const publication=JSON.parse(fs.readFileSync(path.join(root,'shopify-migration/approved-collection-publication.json')));
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try {
 const page=await browser.newPage();const reports=[];
 for(const {handle}of publication.collections){
  const response=await page.goto(`https://${state.store}/collections/${handle}?preview_theme_id=${state.id}`,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(800);
  const details=await page.evaluate(()=>({heading:document.querySelector('h1')?.textContent,themeId:window.Shopify?.theme?.id,role:window.Shopify?.theme?.role}));
  reports.push({handle,status:response.status(),...details});
 }
 fs.writeFileSync(path.join(root,'shopify-migration/approved-collection-links.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
 if(reports.some(r=>r.status!==200||String(r.themeId)!==String(state.id)||r.role!=='unpublished'))process.exitCode=1;
}finally{await browser.close();}
