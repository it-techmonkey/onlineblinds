import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {work} from './env.mjs';
const config=JSON.parse(fs.readFileSync(path.join(work,'lpo-mcp-secret.json'),'utf8'));
if(!new URL(config.url).hostname.endsWith('.cloudlift.app'))throw new Error('Unexpected LPO server');
// X-Shop is Cloudlift's opaque shop identifier, not a myshopify domain.
if(createHash('sha256').update(config.headers?.['X-Shop']||'').digest('hex')!=="190688a9b938585c745497c0fdeabfa0350b4596073426da7bdebb1d8c939011")throw new Error('Unexpected LPO shop');
let next=1,session;
export async function rpc(method,params,notification=false){const response=await fetch(config.url,{method:'POST',headers:{...config.headers,'Content-Type':'application/json',Accept:'application/json, text/event-stream',...(session?{'Mcp-Session-Id':session}:{})},body:JSON.stringify({jsonrpc:'2.0',...(notification?{}:{id:next++}),method,...(params?{params}:{})}),signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`LPO MCP HTTP ${response.status}`);session=response.headers.get('mcp-session-id')||session;if(notification)return;const body=await response.text();const lines=body.startsWith('data:')||body.includes('\ndata:')?body.split('\n').filter(l=>l.startsWith('data:')).map(l=>JSON.parse(l.slice(5))):[JSON.parse(body)];const result=lines.find(m=>m.result||m.error);if(result?.error)throw new Error('LPO MCP: '+result.error.message);return result?.result;}
export async function initialize(){await rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'OnlineBlindsMigration',version:'1.0'}});await rpc('notifications/initialized',undefined,true);}
export async function call(name,args={}){
  const allowed=/^(learn_|session_(list|get)$|config_(list|get|open|new|duplicate)$|template_(list|get)$|product_(list|media|variants)$|docs_search$|asset_upload_url$|draft_(get|prepareOptions$|saveOptions$|saveDesignJS$|setOptionValues$|info$|info_update$|product_set$|moveOption$|deleteOption$|save$))/;
  if(!allowed.test(name))throw new Error('LPO tool is outside the preview workflow: '+name);
  if(name==='config_duplicate'){
    const source=await rpc('tools/call',{name:'config_get',arguments:{configUuid:args.configUuid}});
    const stored=source.structuredContent||JSON.parse(source.content.find(c=>c.type==='text').text);
    // Copies are created disabled by LPO; the source only has to be a migration config.
    if(!stored.name?.startsWith('OB Preview -')||!args.description?.startsWith('OB Preview -'))throw new Error('Refusing to duplicate an unrelated configuration');
    const copy=await rpc('tools/call',{name,arguments:args});if(copy?.isError)throw new Error('LPO tool rejected '+name+': '+JSON.stringify(copy.content).slice(0,1000));
    const made=copy.structuredContent||JSON.parse(copy.content.find(c=>c.type==='text').text);
    if(made.config?.enabled)throw new Error('Duplicate unexpectedly enabled: '+made.config.uuid);
    return copy;
  }
  if(name==='draft_save'||name==='draft_saveDesignJS'){
    const response=await rpc('tools/call',{name:'draft_info',arguments:{sessionId:args.sessionId}});
    const info=response.structuredContent||JSON.parse(response.content.find(c=>c.type==='text').text);
    if(info.enabled||!info.description?.startsWith('OB Preview -')||(name==='draft_save'&&(!args.configUuid||info.configUuid!==args.configUuid)))throw new Error('Refusing to commit an active, unguarded or unrelated LPO configuration');
  }
  const result=await rpc('tools/call',{name,arguments:args});if(result?.isError)throw new Error('LPO tool rejected '+name+': '+JSON.stringify(result.content).slice(0,1000));return result;}

// Sessionless update of a migration config. Only "OB Preview -" configs can be
// changed, and the enabled flag only moves when the caller explicitly asks.
export async function updateConfig(configUuid,patch,{allowEnabledChange=false}={}){
  const read=r=>r.structuredContent||JSON.parse(r.content.find(c=>c.type==='text').text);
  const stored=read(await rpc('tools/call',{name:'config_get',arguments:{configUuid}}));
  if(!stored.name?.startsWith('OB Preview -'))throw new Error('Refusing to update an unrelated configuration: '+stored.name);
  if(patch.name&&!patch.name.startsWith('OB Preview -'))throw new Error('Migration configs must keep the OB Preview prefix');
  if('enabled' in patch&&patch.enabled!==stored.enabled&&!allowEnabledChange)throw new Error('Refusing to change enabled state without explicit permission');
  const result=await rpc('tools/call',{name:'config_update',arguments:{configUuid,version:stored.version,patch}});
  if(result?.isError)throw new Error('LPO config_update rejected: '+JSON.stringify(result.content).slice(0,1000));
  const answer=read(result);if(!answer.ok)throw new Error('LPO config_update failed: '+JSON.stringify(answer.errors).slice(0,1000));
  return {before:stored,answer};
}
