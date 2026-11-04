// Builds the single shared LPO design JavaScript for every migrated category.
// LPO stores this JS once (on its design theme) and runs it for each rendered
// configuration. It mirrors the formula's size errors as native form validity
// (so LPO cannot add an invalid size) and hands the instance to the theme bridge.
// Size data is read from each config's own formula, so the two cannot drift.
import fs from 'node:fs';
import path from 'node:path';
import {MESSAGES, PREFIX} from './lpo-slim-formula.mjs';

const base = 'shopify-migration/lpo/categories';
const schemas = {};
for (const category of fs.readdirSync(base)) {
  const draftsFile = path.join(base, category, 'drafts.json');
  if (!fs.existsSync(draftsFile)) continue;
  for (const draft of JSON.parse(fs.readFileSync(draftsFile))) {
    const formula = fs.readFileSync(path.join(base, category, draft.slug + '-formula.js'), 'utf8');
    const match = formula.match(/^var D=(\{.*?\}),M=/);
    if (!match) throw new Error('Formula for ' + draft.slug + ' is not in the slim format');
    const D = JSON.parse(match[1]);
    // Slats (drop only) and skylights (fixed size) have no width x drop check.
    if (D.n) { schemas[draft.configUuid] = {n: 1}; continue; }
    schemas[draft.configUuid] = {w: D.w, h: D.h, c: D.v.includes(0) ? D.v.map((p) => (p ? '1' : '0')).join('') : '', k: D.k, m: D.m, z: D.z, f: D.f || 0};
  }
}

const code = `// Shared Online Blinds LPO JS. Runs inside LPO's options:rendered callback.
var S=${JSON.stringify(schemas)},M=${JSON.stringify(MESSAGES)},Q=${JSON.stringify(PREFIX)};
var productOptions=e.detail;
var configId=Object.keys(S).find(function(id){return document.getElementById(id);});
if(configId){
 var root=document.getElementById(configId),D=S[configId];
 if(root.obValidationCleanup)root.obValidationCleanup();
 function band(a,v){if(v<a[0])return D.k?0:-1;if(v>a[a.length-1])return D.k?a.length-1:-1;var c=Math.ceil(v);for(var i=0;i<a.length;i++)if(a[i]>=c)return i;return D.k?a.length-1:-1;}
 function validateSize(v){
  if(D.n)return '';
  var unit=v[Q+'measurementUnit'],wv=v[Q+'width'],hv=v[Q+'height'];
  if(wv==null||hv==null||String(wv).trim()===''||String(hv).trim()==='')return '';
  if(unit!=='cm'&&unit!=='mm')return M[0];
  var w=Number(wv),h=Number(hv);
  if(!isFinite(w)||!isFinite(h))return M[0];
  if(unit==='cm'){w+=Number(v[Q+'widthFraction']||0)/10;h+=Number(v[Q+'heightFraction']||0)/10;}
  var u=unit==='cm'?2.54:25.4;w/=u;h/=u;
  var mot=D.f===1||v[Q+'motorization']==='motorized'||String(v[Q+'customizations']||'').split('|').some(function(c){return c.indexOf('motorization:')===0&&c!=='motorization:none';});
  var L=mot?D.z:D.m;
  if(w<L[0]||w>L[1]||h<L[2]||h>L[3])return M[1];
  var x=band(D.w,w),y=band(D.h,h);
  if(x<0||y<0)return M[1];
  return D.c&&D.c.charAt(y*D.w.length+x)!=='1'?M[2]:'';
 }
 function applySizeValidation(event){
  if(event&&event.detail!==productOptions)return;
  var message=validateSize(productOptions.getValues());
  var width=root.querySelector('[data-option="'+Q+'width"] input'),field=root.querySelector('[data-option="'+Q+'width"]');if(!width||!field)return;
  width.setCustomValidity(message);width.setAttribute('aria-invalid',message?'true':'false');
  var notice=field.querySelector('[data-ob-size-error]');if(!notice){notice=document.createElement('p');notice.dataset.obSizeError='';notice.id='ob-lpo-size-error-'+configId;notice.setAttribute('role','alert');notice.style.cssText='color:#c24646;font-size:12px;margin-top:8px';field.appendChild(notice);}
  if(notice.textContent!==message)notice.textContent=message;notice.hidden=!message;width.setAttribute('aria-describedby',notice.id);
 }
 applySizeValidation();window.addEventListener('options:rendered',applySizeValidation);
 root.obValidationCleanup=function(){window.removeEventListener('options:rendered',applySizeValidation);};
 window.OnlineBlindsLpoPilot={configId:configId,instance:productOptions};window.dispatchEvent(new CustomEvent('ob:lpo-ready',{detail:window.OnlineBlindsLpoPilot}));
}
`;
fs.writeFileSync('shopify-migration/lpo/design.js', code);
console.log('Built shared design JS for ' + Object.keys(schemas).length + ' configurations (' + Buffer.byteLength(code) + ' bytes)');
