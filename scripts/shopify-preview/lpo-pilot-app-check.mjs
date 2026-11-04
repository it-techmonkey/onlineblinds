import fs from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {work} from './env.mjs';
import {initialize,call} from './lpo-mcp.mjs';
const {chromium}=createRequire(path.join(work,'tooling/package.json'))('playwright');
await initialize();
const sessions=(await call('session_list')).structuredContent;
const current=sessions?.sessions.find(s=>s.activeConfigUuid==='clfhanm6jjqw'&&s.canDraftEdit);
if(!current)throw new Error('Open the Day & Night pilot editor before testing');
const {sessionId}=current;
const reference=await import(pathToFileURL(path.resolve('.shopify-work/pricing-reference.mjs')).href);
const browser=await chromium.connectOverCDP('http://127.0.0.1:9334');
const page=browser.contexts()[0].pages().find(p=>p.url().includes('/detail/clfhanm6jjqw'));
if(!page)throw new Error('Expected pilot browser not found');
const frame=page.frameLocator('iframe[name="app-iframe"]');page.setDefaultTimeout(10000);
await frame.locator('body').evaluate(()=>{window.obValidationResults=[];window.addEventListener('options:validated',e=>window.obValidationResults.push(e.detail.valid));});
const requests=[];
const watch=r=>{if(r.method()!=='GET'&&/\/cart\/add|\/checkouts?\/|draftOrder/.test(r.url()))requests.push(new URL(r.url()).pathname);};
page.on('request',watch);
const base={width:100,height:120,measurementUnit:'cm',installationMethod:'inside-mount',controlSide:'left',chromeUpgrade:'no',cassetteMatchingBar:'white',sameFabricInsert:'no',motorization:'none',widthFraction:0,heightFraction:0};
const cases=[['manual',{}],['millimetres',{width:1000,height:1200,measurementUnit:'mm'}],['cm precision',{widthFraction:1,heightFraction:9}],['manual upgrades',{chromeUpgrade:'yes',cassetteMatchingBar:'black',sameFabricInsert:'yes'}],['motorized upgrades',{motorization:'motorized',chromeUpgrade:'yes',cassetteMatchingBar:'black',sameFabricInsert:'yes'}],['invalid width',{width:10}],['recovery after width',{}],['invalid drop',{height:10}],['recovery after drop',{}],['invalid millimetres',{width:100,height:1200,measurementUnit:'mm'}],['recovery after mm',{}],['oversize',{width:400}],['zero width',{width:0}],['zero drop',{height:0}],['negative width',{width:-1}],['negative drop',{height:-1}],['final recovery',{}]];
const results=[];
try{
 for(const [name,changes]of cases){
  const v={...base,...changes};await call('draft_setOptionValues',{sessionId,valuesJson:JSON.stringify(v)});await page.waitForTimeout(1400);
  let expected,error;
  try{const factor=v.measurementUnit==='cm'?2.54:25.4,extra=v.measurementUnit==='cm'?0.1:0;expected=(await reference.calculateProductPrice({handle:'plain-soft-white-day-and-night-blind',widthInches:(v.width+v.widthFraction*extra)/factor,heightInches:(v.height+v.heightFraction*extra)/factor,customizations:[{category:'cassette-bar',optionId:v.cassetteMatchingBar},{category:'fabric-insert-cassette',optionId:v.sameFabricInsert},...(v.motorization==='motorized'?[{category:'motorization',optionId:'motorized'}]:[{category:'chrome-upgrade',optionId:v.chromeUpgrade}])]})).totalPrice;}catch(e){error=e.message;}
  await frame.locator('body').evaluate(()=>{window.obValidationResults=[];});
  await frame.getByRole('button',{name:'Add to cart (validation test)',exact:true}).click();await page.waitForTimeout(600);
  const actual=await frame.locator('.cl-po--options').evaluate(el=>({text:el.innerText,valid:window.obValidationResults.at(-1),native:el.querySelector('[data-option="width"] input').validationMessage,price:el.querySelector('[data-live-price]').textContent}));
  const price=Number(actual.price.replace(/[^0-9.]/g,''));
  const passed=error?price===0&&actual.valid===false&&actual.text.includes(error)&&actual.native===error:Math.abs(price-expected)<0.011&&actual.valid===true&&!actual.native;
  results.push({name,expected:expected??null,actual:price,error:error||null,errorDisplayed:error?actual.text.includes(error):null,lpoValid:actual.valid,nativeError:actual.native,passed});
  console.log((passed?'PASS ':'FAIL ')+name);
 }
 if(requests.length)throw new Error('Unexpected cart/checkout request');
 const report={date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),scope:'Real LPO editor formulas, visible/native errors and its validation-test button. No real cart, checkout or orders created.',acceptancePassed:results.every(r=>r.passed),checkoutVerified:false,requests,results};
 fs.writeFileSync('shopify-migration/lpo/pilot-app-price-check.json',JSON.stringify(report,null,2)+'\n');
 if(!report.acceptancePassed)process.exitCode=1;
}finally{page.off('request',watch);await browser.close();}
