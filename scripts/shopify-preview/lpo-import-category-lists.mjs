import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {work} from './env.mjs';
const category=process.argv[2]||'day-night';if(!/^[a-z-]+$/.test(category))throw new Error('Invalid category');
const directory='shopify-migration/lpo/categories/'+category;const plan=JSON.parse(fs.readFileSync(directory+'/plan.json'));
if(plan.lists.some(l=>!l.description.startsWith('OB Preview - ')))throw new Error('Only migration-owned lists may be created');
const {chromium}=createRequire(path.join(work,'tooling/package.json'))('playwright');const browser=await chromium.connectOverCDP('http://127.0.0.1:9334');const page=browser.contexts()[0].pages().find(p=>p.url().includes('admin.shopify.com'));page.setDefaultTimeout(15000);const frame=page.frameLocator('iframe[name="app-iframe"]');
const back=()=>frame.locator('vaadin-button:visible').filter({has:frame.locator('vaadin-icon[src*="ArrowLeftIcon"]')});const results=[];
async function findList(name){const filter=frame.locator('input[placeholder="Search list"]');await filter.fill(name);await filter.press('Tab');await page.waitForTimeout(650);return frame.getByText(name,{exact:true}).filter({visible:true}).count();}
async function openList(name){if(await findList(name)!==1)throw new Error('Missing or ambiguous migration asset '+name);const edits=frame.getByRole('button',{name:'Edit',exact:true});if(await edits.count()!==1)throw new Error('Ambiguous migration asset row');await edits.click();const description=frame.locator('input[placeholder="Description"]');let matched=false;for(let i=0;i<30;i++){if(await description.inputValue()===name){matched=true;break;}await page.waitForTimeout(100);}if(!matched)throw new Error('Wrong list editor');}
try{
 await page.locator('a[href*="/apps/live-product-options/app/options/assets"]').click();await frame.getByRole('tab',{name:'Lists',exact:true}).click();if(await back().count())await back().click();
 fs.mkdirSync(path.join(work,'lpo-asset-exports',category),{recursive:true});
 for(const list of plan.lists){
  const count=await findList(list.description);if(count>1)throw new Error('Duplicate migration list names');
  if(!count){
   await frame.getByRole('button',{name:'New List',exact:true}).click();const description=frame.locator('input[placeholder="Description"]');await description.fill(list.description);await description.press('Tab');
   const combo=frame.getByRole('combobox');await combo.press('Escape');await combo.locator('..').locator('[part="toggle-button"]').click();const choices=frame.getByRole('listbox').getByRole('option');await choices.first().waitFor();await page.waitForTimeout(500);const names=await choices.allTextContents();const index=names.findIndex(n=>n.trim()==='Price List Dimension');if(index<0)throw new Error('Dimension list type missing');await choices.nth(index).click();
   await frame.locator('input[type="file"][accept=".csv,.xlsx"]').setInputFiles(list.file);
   const upload=frame.locator('vaadin-upload').filter({has:frame.getByRole('button',{name:'Import',exact:true})});let complete=false;for(let i=0;i<50;i++){complete=await upload.evaluate(e=>e.files?.length>0&&e.files.every(f=>f.complete));if(complete)break;await page.waitForTimeout(200);}if(!complete)throw new Error('Asset upload did not finish');
   if(await description.inputValue()!==list.description)throw new Error('Migration name changed');await frame.getByRole('button',{name:'Save List',exact:true}).click();await frame.getByRole('button',{name:'New List',exact:true}).waitFor();
  }
  await openList(list.description);
  const pending=page.waitForEvent('download');await frame.getByRole('button',{name:'Export',exact:true}).click();const download=await pending;const saved=path.join(work,'lpo-asset-exports',category,path.basename(list.file));await download.saveAs(saved);
  const clean=s=>s.trim().replaceAll('\r','');if(clean(fs.readFileSync(saved,'utf8'))!==clean(fs.readFileSync(list.file,'utf8')))throw new Error('Saved matrix differs from source: '+list.description);
  results.push({description:list.description,band:list.band,cells:list.cells,created:count===0,savedValuesMatchSource:true});fs.writeFileSync(directory+'/asset-lists-check.json',JSON.stringify({date:'2026-10-28',existingListsModified:false,results},null,2)+'\n');console.log('Verified '+list.description+' ('+list.cells+' cells)');await back().click();
 }
}finally{await browser.close();}
