import path from 'node:path';import {createRequire} from 'node:module';import {work} from './env.mjs';import {call} from './lpo-mcp.mjs';
const {chromium}=createRequire(path.join(work,'tooling/package.json'))('playwright');
const read=r=>r.structuredContent||JSON.parse(r.content.find(c=>c.type==='text').text);
export async function editorSession(){
 const browser=await chromium.connectOverCDP('http://127.0.0.1:9334');let page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().includes('admin.shopify.com'));const created=!page;if(created){page=await browser.contexts()[0].newPage();await page.goto('https://admin.shopify.com/store/online-blinds-express/apps/live-product-options');}page.setDefaultTimeout(15000);await page.bringToFront();const frame=page.frameLocator('iframe[name="app-iframe"]');
 async function open(configUuid,name){
  let session=read(await call('session_list')).sessions.find(s=>s.activeConfigUuid===configUuid&&s.canDraftEdit);if(session)return session.sessionId;
  // Prefer LPO's own navigation by uuid (the list is paginated/virtualised).
  const live=read(await call('session_list')).sessions.find(s=>s.canNavigate);
  if(live){await call('config_open',{sessionId:live.sessionId,configUuid});for(let i=0;i<20;i++){session=read(await call('session_list')).sessions.find(s=>s.activeConfigUuid===configUuid&&s.canDraftEdit);if(session){await page.waitForTimeout(600);return session.sessionId;}await page.waitForTimeout(500);}}
  if(await frame.getByRole('button',{name:'Add option',exact:true}).isVisible())await frame.locator('vaadin-button:visible').filter({has:frame.locator('vaadin-icon[src*="ArrowLeftIcon"]')}).click();
  const label=frame.getByText(name,{exact:true}).filter({visible:true});await label.scrollIntoViewIfNeeded();const y=await label.evaluate(e=>e.getBoundingClientRect().y+e.getBoundingClientRect().height/2),buttons=frame.getByRole('button',{name:'Edit',exact:true}),positions=await buttons.evaluateAll(els=>els.map(e=>e.getBoundingClientRect().y+e.getBoundingClientRect().height/2));const index=positions.reduce((best,n,i)=>Math.abs(n-y)<Math.abs(positions[best]-y)?i:best,0);if(Math.abs(positions[index]-y)>25)throw new Error('Ambiguous config row');await buttons.nth(index).click();await frame.getByRole('button',{name:'Add option',exact:true}).waitFor();
  session=read(await call('session_list')).sessions.find(s=>s.activeConfigUuid===configUuid&&s.canDraftEdit);if(!session)throw new Error('Requested configuration editor is not attached');await page.waitForTimeout(600);return session.sessionId;
 }
 return {browser,page,frame,open,created};
}
