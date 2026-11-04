import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {root,work} from './env.mjs';
import {initialize,call} from './lpo-mcp.mjs';
const require=createRequire(path.join(work,'tooling/package.json'));
const {build}=require('esbuild'),{chromium}=require('playwright');
const bundle=path.join(work,'lpo-bridge-check.js');
await build({entryPoints:[path.join(root,'shopify-src/lpo-bridge.ts')],outfile:bundle,bundle:true,platform:'browser',format:'iife',globalName:'OBLpoBridgeCheck',tsconfig:path.join(root,'tsconfig.json')});
await initialize();
const session=(await call('session_list')).structuredContent.sessions.find(s=>s.activeConfigUuid==='clfhanm6jjqw');
if(!session)throw new Error('Open the inactive pilot editor');
const browser=await chromium.connectOverCDP('http://127.0.0.1:9334');
const page=browser.contexts()[0].pages().find(p=>p.url().includes('/detail/clfhanm6jjqw'));
const frame=page.frameLocator('iframe[name="app-iframe"]');
const results=[];
try{
 await frame.locator('body').evaluate((el,code)=>{const script=document.createElement('script');script.textContent=code;document.head.appendChild(script);
   const host=document.getElementById('clfhanm6jjqw').parentElement;host.dataset.obLpoEngine='clfhanm6jjqw';window.obBridgeHost=host;
   window.OBLpoBridgeCheck.installLpoBridge();
   // A different editor section unloading must not remove this section's listeners.
   const unrelated=document.createElement('section');document.body.appendChild(unrelated);unrelated.dispatchEvent(new Event('shopify:section:unload',{bubbles:true}));unrelated.remove();
 },fs.readFileSync(bundle,'utf8'));
 const base={width:100,height:120,measurementUnit:'cm',installationMethod:'inside-mount',controlSide:'left',chromeUpgrade:'no',cassetteMatchingBar:'white',sameFabricInsert:'no',motorization:'none',widthFraction:0,heightFraction:0,roomType:'bedroom',blindName:'Preview only'};
 await call('draft_setOptionValues',{sessionId:session.sessionId,valuesJson:JSON.stringify(base)});
 for(const [name,changes,expected,valid]of [['manual',{},138.85,true],['manual upgrades',{chromeUpgrade:'yes',cassetteMatchingBar:'black',sameFabricInsert:'yes'},159.82,true],['motorized',{motorization:'motorized',cassetteMatchingBar:'black',sameFabricInsert:'yes'},230.83,true],['invalid width',{width:10},0,false],['recovery',{},138.85,true],['mismatched quote',{},150,true]]){
  await frame.locator('body').evaluate((el,args)=>window.OBLpoBridgeCheck.pilotBridge.select(args.values,args.expected,args.valid),{values:{...base,...changes},expected,valid});
  await page.waitForTimeout(800);
  const state=await frame.locator('body').evaluate(()=>({quote:window.OBLpoBridgeCheck.pilotBridge.quote,values:window.OnlineBlindsLpoPilot.instance.getValues(),error:document.querySelector('[data-option="width"] input').validationMessage}));
  const mismatch=name==='mismatched quote';
  const passed=valid&&!mismatch?state.quote.ready&&Math.abs(state.quote.price-expected)<0.011:!state.quote.ready&&state.quote.price===null&&(mismatch?!!state.quote.error:!!state.error);
  results.push({name,expected,valid,...state,passed});console.log((passed?'PASS ':'FAIL ')+name);
 }
 // Rapid changes must finish with the latest selection, never a stale quote.
 await frame.locator('body').evaluate((el,base)=>{const b=window.OBLpoBridgeCheck.pilotBridge;b.select({...base,width:10},0,false);b.select({...base,motorization:'motorized',cassetteMatchingBar:'black',sameFabricInsert:'yes'},230.83,true);b.select(base,138.85,true);},base);
 await page.waitForTimeout(800);
 const rapid=await frame.locator('body').evaluate(()=>window.OBLpoBridgeCheck.pilotBridge.quote);
 results.push({name:'rapid selection recovery',...rapid,passed:rapid.ready&&Math.abs(rapid.price-138.85)<0.011});
 await frame.locator('body').evaluate(()=>{const actual=window.OnlineBlindsLpoPilot.instance;window.OBLpoBridgeCheck.pilotBridge.attach({getValues:()=>actual.getValues(),updateValues:values=>actual.updateValues(values),getSelectedVariant:()=>actual.getSelectedVariant()});});
 await page.waitForTimeout(800);
 const reattached=await frame.locator('body').evaluate(()=>window.OBLpoBridgeCheck.pilotBridge.quote);
 results.push({name:'reattach retains latest selection',...reattached,passed:reattached.ready&&Math.abs(reattached.price-138.85)<0.011});
 const cleanup=await frame.locator('body').evaluate(()=>{window.obBridgeHost.dispatchEvent(new Event('shopify:section:unload',{bubbles:true}));return !window.OBLpoBridgeCheck.pilotBridge.quote.ready;});
 results.push({name:'theme section cleanup',passed:cleanup});
 fs.writeFileSync('shopify-migration/lpo/pilot-bridge-check.json',JSON.stringify({date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),scope:'Theme bridge installed against the real LPO instance in its inactive editor, using public updateValues/getValues and options events. Includes initial handshake and theme section lifecycle. No storefront activation or cart writes.',passed:results.every(r=>r.passed),results},null,2)+'\n');
 if(results.some(r=>!r.passed))process.exitCode=1;
}finally{
 await frame.locator('body').evaluate(()=>{window.obBridgeHost?.dispatchEvent(new Event('shopify:section:unload',{bubbles:true}));if(window.obBridgeHost){delete window.obBridgeHost.dataset.obBridgeInstalled;delete window.obBridgeHost.dataset.obLpoEngine;}});
 await browser.close();
}
