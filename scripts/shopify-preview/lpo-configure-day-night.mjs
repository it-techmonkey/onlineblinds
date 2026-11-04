import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';import {work} from './env.mjs';import {initialize,call} from './lpo-mcp.mjs';
await initialize();const read=r=>r.structuredContent||JSON.parse(r.content.find(c=>c.type==='text').text);
const folder='shopify-migration/lpo/categories/day-night',plan=JSON.parse(fs.readFileSync(folder+'/plan.json')),drafts=JSON.parse(fs.readFileSync(folder+'/drafts.json'));
const {chromium}=createRequire(path.join(work,'tooling/package.json'))('playwright');const browser=await chromium.connectOverCDP('http://127.0.0.1:9334');const page=browser.contexts()[0].pages().find(p=>p.url().includes('admin.shopify.com'));page.setDefaultTimeout(15000);await page.bringToFront();const frame=page.frameLocator('iframe[name="app-iframe"]');
async function openEditor(configUuid,name){
 let session=read(await call('session_list')).sessions.find(s=>s.activeConfigUuid===configUuid&&s.canDraftEdit);if(session)return session.sessionId;
 if(await frame.getByRole('button',{name:'Add option',exact:true}).isVisible()){const back=frame.locator('vaadin-button:visible').filter({has:frame.locator('vaadin-icon[src*="ArrowLeftIcon"]')});await back.click();}
 const label=frame.getByText(name,{exact:true}).filter({visible:true});await label.scrollIntoViewIfNeeded();const y=await label.evaluate(e=>e.getBoundingClientRect().y+e.getBoundingClientRect().height/2);const buttons=frame.getByRole('button',{name:'Edit',exact:true});const positions=await buttons.evaluateAll(els=>els.map(e=>e.getBoundingClientRect().y+e.getBoundingClientRect().height/2));const index=positions.reduce((best,n,i)=>Math.abs(n-y)<Math.abs(positions[best]-y)?i:best,0);if(Math.abs(positions[index]-y)>25)throw new Error('Ambiguous migration config row');await buttons.nth(index).click();await frame.getByRole('button',{name:'Add option',exact:true}).waitFor();
 session=read(await call('session_list')).sessions.find(s=>s.activeConfigUuid===configUuid&&s.canDraftEdit);if(!session)throw new Error('The requested editor did not connect');return session.sessionId;
}
const records=[];const requested=process.argv[2];
for(const group of plan.configurations){
 if(requested&&group.slug!==requested)continue;
 const draft=drafts.find(d=>d.key===group.key),configUuid=draft.configUuid;
 const stored=read(await call('config_get',{configUuid}));if(stored.enabled||!stored.name.startsWith('OB Preview -'))throw new Error('Protected configuration');
 const expectedFormula=fs.readFileSync(folder+'/'+group.slug+'-formula.js','utf8');
 const assigned=(stored.config.conditions||[]).flatMap(c=>(c.products||[]).map(p=>p.id)).sort();
 if(stored.name===group.description&&stored.config.targetMode===1&&JSON.stringify(assigned)===JSON.stringify(group.products.map(p=>p.id).sort())&&stored.config.options.find(o=>o.name==='measurementUnit')?.values.every(v=>v.priceFormula===expectedFormula)){console.log('Already verified '+group.description);continue;}
 const sessionId=await openEditor(configUuid,stored.name);
 await call('draft_info_update',{sessionId,configUuid,description:group.description});
 const representative=group.products.find(p=>p.handle===group.representative);
 const listed=read(await call('product_list',{query:'id:'+representative.id,limit:1})).products;if(listed.length!==1||listed[0].id!==representative.id)throw new Error('Representative product mismatch');
 await call('draft_product_set',{sessionId,configUuid,targeting:{targetMode:0,conditionMode:1,product:listed[0]}});
 const options=JSON.parse(fs.readFileSync(folder+'/'+group.slug+'-options.json'));
 await call('draft_prepareOptions',{sessionId,optionsJson:JSON.stringify(options)});await call('draft_saveOptions',{sessionId});
 await call('draft_saveDesignJS',{sessionId,customJS:fs.readFileSync(folder+'/validation.js','utf8')});
 const values={width:100,height:120,measurementUnit:'cm',widthFraction:0,heightFraction:0,installationMethod:'inside-mount',controlSide:'left',chromeUpgrade:'no',cassetteMatchingBar:'white',sameFabricInsert:'no',motorization:group.motorized?'motorized':'none'};
 await call('draft_setOptionValues',{sessionId,valuesJson:JSON.stringify(values)});
 const html=(await call('draft_getDesignHTML',{sessionId})).content.find(c=>c.type==='text').text;fs.writeFileSync('.shopify-work/category-preview-'+group.slug+'.html',html);
 // Explicit product IDs keep category targeting independent of titles or mutable tags.
 await call('draft_product_set',{sessionId,configUuid,targeting:{targetMode:1,conditionMode:1,product:listed[0],conditions:[{data:'product',field:'product',operator:'=',products:group.products}]}});
 await call('draft_save',{sessionId,configUuid});
 const saved=read(await call('config_get',{configUuid}));
 if(saved.enabled||saved.name!==group.description||saved.config.targetMode!==1)throw new Error('Saved draft guard failed');
 const targetIds=saved.config.conditions.flatMap(c=>(c.products||[]).map(p=>p.id)).sort();if(JSON.stringify(targetIds)!==JSON.stringify(group.products.map(p=>p.id).sort()))throw new Error('Saved category targeting differs');
 const formula=fs.readFileSync(folder+'/'+group.slug+'-formula.js','utf8');if(saved.config.options.find(o=>o.name==='measurementUnit').values.some(v=>v.priceFormula!==formula))throw new Error('Saved formula mismatch');
 fs.writeFileSync(folder+'/'+group.slug+'-stored.json',JSON.stringify(saved,null,2)+'\n');
 const record={description:group.description,configUuid,products:group.products.length,inactive:true,savedTargetingVerified:true,savedFormulaVerified:true,formulaSha256:createHash('sha256').update(formula).digest('hex')};records.push(record);
 const recordFile=folder+'/saved-configurations.json';const previous=fs.existsSync(recordFile)?JSON.parse(fs.readFileSync(recordFile)):[];fs.writeFileSync(recordFile,JSON.stringify([...previous.filter(r=>r.configUuid!==configUuid),record],null,2)+'\n');
 console.log('Saved '+group.description+' for '+group.products.length+' products, inactive');
}
await browser.close();
