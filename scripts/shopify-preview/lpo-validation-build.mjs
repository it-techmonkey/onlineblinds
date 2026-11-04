import fs from 'node:fs';
// Reuse the verified source engine for validation only. LPO Formula owns prices.
const formula=fs.readFileSync('shopify-migration/lpo/pilot-day-night-formula.js','utf8');
const code=`// Runs inside LPO's once-only options:rendered callback.
var productOptions=e.detail;
var root=document.getElementById('clfhanm6jjqw');
if(root){
  if(root.obValidationCleanup)root.obValidationCleanup();
  function evaluateSize(options){${formula}}
  function applySizeValidation(event){
    if(event&&event.detail!==productOptions)return;
    var values=productOptions.getValues(),message='';
    evaluateSize({value:function(name){return values[name];},error:function(name,error){if(error)message=error;}});
    var width=root.querySelector('[data-option="width"] input');
    var field=root.querySelector('[data-option="width"]');
    if(!width||!field)return;
    width.setCustomValidity(message);
    width.setAttribute('aria-invalid',message?'true':'false');
    var notice=field.querySelector('[data-ob-size-error]');
    if(!notice){notice=document.createElement('p');notice.dataset.obSizeError='';notice.id='ob-lpo-size-error';notice.setAttribute('role','alert');notice.style.cssText='color:#c24646;font-size:12px;margin-top:8px';field.appendChild(notice);}
    if(notice.textContent!==message)notice.textContent=message;
    notice.hidden=!message;
    width.setAttribute('aria-describedby','ob-lpo-size-error');
  }
  applySizeValidation();
  window.addEventListener('options:rendered',applySizeValidation);
  root.obValidationCleanup=function(){window.removeEventListener('options:rendered',applySizeValidation);};
  // Handshake also supports themes whose deferred bundle loads after LPO.
  window.OnlineBlindsLpoPilot={configId:'clfhanm6jjqw',instance:productOptions};
  window.dispatchEvent(new CustomEvent('ob:lpo-ready',{detail:window.OnlineBlindsLpoPilot}));
}
`;
fs.writeFileSync('shopify-migration/lpo/pilot-validation.js',code);
console.log('Built pilot validation JS ('+Buffer.byteLength(code)+' bytes)');
