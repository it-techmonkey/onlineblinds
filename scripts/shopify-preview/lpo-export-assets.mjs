import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {work} from './env.mjs';
const {chromium}=createRequire(path.join(work,'tooling/package.json'))('playwright');
const family=process.argv[2]||'Day & Night';
const all=JSON.parse(fs.readFileSync(path.join(work,'lpo-list-inventory.json'))).lists;
const names=all.filter(l=>l.description.startsWith(family)).map(l=>l.description);
if(!names.length)throw new Error('No matching asset list descriptions');
const directory=path.join(work,'lpo-asset-exports');fs.mkdirSync(directory,{recursive:true});
const browser=await chromium.connectOverCDP('http://127.0.0.1:9334');const page=browser.contexts()[0].pages().find(p=>p.url().includes('admin.shopify.com'));page.setDefaultTimeout(15000);
const frame=page.frameLocator('iframe[name="app-iframe"]');
const back=()=>frame.locator('vaadin-button:visible').filter({has:frame.locator('vaadin-icon[src*="ArrowLeftIcon"]')});
const index=[];
try{
 await page.locator('a[href*="/apps/live-product-options/app/options/assets"]').click();await frame.getByRole('tab',{name:'Lists',exact:true}).click();
 if(await back().count())await back().click();
 for(const name of names){
  const file=path.join(directory,name.replace(/[^a-zA-Z0-9_-]/g,'_')+'.csv');
  if(fs.existsSync(file)){index.push({description:name,file:path.relative(work,file).replaceAll('\\','/'),bytes:fs.statSync(file).size});continue;}
  const filter=frame.locator('input[placeholder="Search list"]');await filter.fill(name);await filter.press('Tab');
  const label=frame.getByText(name,{exact:true}).filter({visible:true});await label.waitFor();await page.waitForTimeout(200);
  const y=await label.evaluate(e=>e.getBoundingClientRect().y+e.getBoundingClientRect().height/2);
  const buttons=frame.getByRole('button',{name:'Edit',exact:true});const positions=await buttons.evaluateAll(els=>els.map(e=>e.getBoundingClientRect().y+e.getBoundingClientRect().height/2));
  const nearest=positions.reduce((best,n,i)=>Math.abs(n-y)<Math.abs(positions[best]-y)?i:best,0);
  if(Math.abs(positions[nearest]-y)>20)throw new Error('Could not identify the matching list row');
  await buttons.nth(nearest).click();await frame.locator('input[placeholder="Description"]').waitFor();
  if(await frame.locator('input[placeholder="Description"]').inputValue()!==name)throw new Error('Unexpected asset editor; export stopped');
  const pending=page.waitForEvent('download');await frame.getByRole('button',{name:'Export',exact:true}).click();const download=await pending;await download.saveAs(file);
  index.push({description:name,file:path.relative(work,file).replaceAll('\\','/'),bytes:fs.statSync(file).size});
  fs.writeFileSync(path.join(directory,family.replace(/[^a-zA-Z0-9_-]/g,'_')+'-index.json'),JSON.stringify(index,null,2));
  console.log('Exported '+name);await back().click();
 }
}finally{await browser.close();}
