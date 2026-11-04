import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';import {initialize,call} from './lpo-mcp.mjs';import {editorSession} from './lpo-editor-session.mjs';
await initialize();const ui=await editorSession();const folder='shopify-migration/lpo/categories/day-night',plan=JSON.parse(fs.readFileSync(folder+'/plan.json')),drafts=JSON.parse(fs.readFileSync(folder+'/drafts.json'));
const reference=await import(pathToFileURL(path.resolve('.shopify-work/pricing-reference.mjs')).href);const snapshots=JSON.parse(fs.readFileSync('.shopify-work/lpo-day-night-products-before.json'));
const results=[],requests=[];const watch=r=>{if(r.method()!=='GET'&&/\/cart\/add|\/checkouts?\/|draftOrder/.test(r.url()))requests.push(new URL(r.url()).pathname);};ui.page.on('request',watch);
try{
 for(const group of plan.configurations){
  const draft=drafts.find(d=>d.key===group.key),sessionId=await ui.open(draft.configUuid,group.description);
  await ui.frame.locator('body').evaluate(()=>{window.obCategoryResults={prices:[],validations:[]};if(!window.obCategoryWatch){window.addEventListener('options:price',e=>window.obCategoryResults.prices.push(e.detail));window.addEventListener('options:validated',e=>window.obCategoryResults.validations.push(e.detail.valid));window.obCategoryWatch=true;}});
  const expectedIds=snapshots.find(p=>p.handle===group.representative).variants.nodes.map(v=>v.id.split('/').at(-1));
  const id=await ui.frame.locator('.cl-po--options input[name="id"]').inputValue();if(!expectedIds.includes(id))throw new Error('Stale preview product in '+group.description+': '+id);
  const base={width:100,height:120,widthFraction:0,heightFraction:0,measurementUnit:'cm',installationMethod:'inside-mount',controlSide:'left',chromeUpgrade:'no',cassetteMatchingBar:'white',sameFabricInsert:'no',motorization:group.motorized?'motorized':'none',roomType:'bedroom',blindName:'Preview only'};
  for(const[name,change]of [['base',{}],['mm',{width:1000,height:1200,measurementUnit:'mm'}],['upgrades',{chromeUpgrade:'yes',cassetteMatchingBar:'black',sameFabricInsert:'yes'}],['invalid size',{width:10}],['zero',{width:0}],['recovery',{}]]){
   const values={...base,...change};await ui.frame.locator('body').evaluate(()=>{window.obCategoryResults={prices:[],validations:[]};});
   await call('draft_setOptionValues',{sessionId,valuesJson:JSON.stringify(Object.fromEntries(Object.entries(values).map(([k,v])=>['_'+k,v])))});await ui.page.waitForTimeout(750);
   let expected,error;try{const factor=values.measurementUnit==='cm'?2.54:25.4;expected=(await reference.calculateProductPrice({handle:group.representative,widthInches:values.width/factor,heightInches:values.height/factor,customizations:[{category:'cassette-bar',optionId:values.cassetteMatchingBar},{category:'fabric-insert-cassette',optionId:values.sameFabricInsert},...(group.motorized?[{category:'motorization',optionId:'motorized'}]:[{category:'chrome-upgrade',optionId:values.chromeUpgrade}])]})).totalPrice;}catch(e){error=e.message;}
   await ui.frame.getByRole('button',{name:'Add to cart (validation test)',exact:true}).click();await ui.page.waitForTimeout(300);
   const state=await ui.frame.locator('.cl-po--options').evaluate(el=>({price:window.obCategoryResults.prices.at(-1)?.price,valid:window.obCategoryResults.validations.at(-1),native:el.querySelector('[data-option="_width"] input').validationMessage,text:el.innerText,manualVisible:!!el.querySelector('[data-option="_controlSide"]')}));
   const actual=state.price===undefined?null:state.price/100;
   const passed=error?actual===0&&state.valid===false&&state.native===error&&state.text.includes(error):actual!==null&&Math.abs(actual-expected)<0.011&&state.valid===true&&!state.native&&state.manualVisible!==group.motorized;
   const record={description:group.description,configUuid:draft.configUuid,name,expected:expected??null,actual,error:error||null,valid:state.valid,nativeError:state.native,manualVisible:state.manualVisible,passed};results.push(record);console.log((passed?'PASS ':'FAIL ')+group.description+' / '+name+' / '+actual);
   fs.writeFileSync(folder+'/app-check.json',JSON.stringify({date:'2026-10-28',scope:'Actual LPO editor reads migration Assets lists, renders native validation and exercises its validation-test button. No real cart/checkout/order.',expectedChecks:plan.configurations.length*6,completed:results.length===plan.configurations.length*6,passed:results.length===plan.configurations.length*6&&results.every(r=>r.passed),checkoutVerified:false,requests,results},null,2)+'\n');if(!passed)throw new Error('Editor check failed: '+JSON.stringify(record));
  }
 }
 if(requests.length)throw new Error('Unexpected purchase request');
}finally{ui.page.off('request',watch);await ui.browser.close();}
