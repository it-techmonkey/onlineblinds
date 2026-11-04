import fs from 'node:fs';
const folder='shopify-migration/lpo/categories/day-night';const metadata=JSON.parse(fs.readFileSync(folder+'/validation-metadata.json'));
const products=JSON.parse(fs.readFileSync('.shopify-work/lpo-day-night-products-before.json'));
for(const config of Object.values(metadata))config.variantIds=products.filter(p=>config.products.includes(p.id.split('/').at(-1))).flatMap(p=>p.variants.nodes.map(v=>v.id.split('/').at(-1)));
const code=`// LPO config JS runs inside its once-only options:rendered callback.
var configurations=${JSON.stringify(metadata)};
var productOptions=e.detail,variant=productOptions.getSelectedVariant();
var configId=Object.keys(configurations).find(function(id){return document.getElementById(id)&&variant&&configurations[id].variantIds.indexOf(String(variant.id))>=0;});
if(configId){
 var root=document.getElementById(configId),schema=configurations[configId];
 if(root.obValidationCleanup)root.obValidationCleanup();
 function validateSize(values){
  var unit=values.measurementUnit,wv=values.width,hv=values.height;
  if(wv==null||hv==null||String(wv).trim()===''||String(hv).trim()==='')return '';
  if(unit!=='cm'&&unit!=='mm')return 'Please enter a valid size';
  var width=Number(wv),height=Number(hv);
  if(unit==='cm'){width+=Number(values.widthFraction||0)/10;height+=Number(values.heightFraction||0)/10;}
  if(!Number.isFinite(width)||!Number.isFinite(height))return 'Please enter a valid size';
  width/=unit==='cm'?2.54:25.4;height/=unit==='cm'?2.54:25.4;
  var limits=schema.forceMotorized||values.motorization==='motorized'?schema.motorLimits:schema.manualLimits;
  if(width<limits.minWidth||width>limits.maxWidth||height<limits.minHeight||height>limits.maxHeight)return 'Selected measurements are outside the allowed range for this product';
  var x=schema.widths.find(function(b){return b.inches>=Math.ceil(width);}),y=schema.heights.find(function(b){return b.inches>=Math.ceil(height);});
  if(schema.clamp){if(!x)x=schema.widths[schema.widths.length-1];if(!y)y=schema.heights[schema.heights.length-1];}
  if(!x||!y)return 'Selected measurements are outside the allowed range for this product';
  return schema.cells.indexOf(x.mm+':'+y.mm)<0?'We cannot make this blind in that width and drop combination. Please adjust your measurements.':'';
 }
 function applySizeValidation(event){
  if(event&&event.detail!==productOptions)return;
  var message=validateSize(productOptions.getValues());
  var width=root.querySelector('[data-option="width"] input'),field=root.querySelector('[data-option="width"]');if(!width||!field)return;
  width.setCustomValidity(message);width.setAttribute('aria-invalid',message?'true':'false');
  var notice=field.querySelector('[data-ob-size-error]');if(!notice){notice=document.createElement('p');notice.dataset.obSizeError='';notice.id='ob-lpo-size-error-'+configId;notice.setAttribute('role','alert');notice.style.cssText='color:#c24646;font-size:12px;margin-top:8px';field.appendChild(notice);}
  if(notice.textContent!==message)notice.textContent=message;notice.hidden=!message;width.setAttribute('aria-describedby',notice.id);
 }
 applySizeValidation();window.addEventListener('options:rendered',applySizeValidation);
 root.obValidationCleanup=function(){window.removeEventListener('options:rendered',applySizeValidation);};
 window.OnlineBlindsLpoPilot={configId:configId,instance:productOptions};window.dispatchEvent(new CustomEvent('ob:lpo-ready',{detail:window.OnlineBlindsLpoPilot}));
}
`;
fs.writeFileSync(folder+'/validation.js',code);
const registry={};for(const[id,config]of Object.entries(metadata))for(const handle of config.handles)registry[handle]={configId:id,forceMotorized:config.forceMotorized,variantIds:config.variantIds};
fs.writeFileSync('shopify-src/lpo-configurations.json',JSON.stringify(registry,null,2)+'\n');
fs.writeFileSync(folder+'/validation-metadata.json',JSON.stringify(metadata,null,2)+'\n');console.log('Built shared validation and theme registry for '+Object.keys(registry).length+' products');
