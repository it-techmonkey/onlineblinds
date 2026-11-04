import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {root,work} from './env.mjs';
const {build}=createRequire(path.join(work,'tooling/package.json'))('esbuild');
const handle='plain-soft-white-day-and-night-blind';
const catalog=JSON.parse(fs.readFileSync(path.join(work,'catalog.json')));
const product=catalog.products.find(p=>p.handle===handle);
const raw=JSON.parse(fs.readFileSync(path.join(root,'src/data/pricing/pricing-data.json')));
const band=raw.priceBands.find(b=>b.name===product.priceBandName.value);
const data={...raw,priceBands:[band],priceCells:raw.priceCells.filter(c=>c.priceBandId===band.id)};
const output=path.join(work,'pilot-engine.js');
await build({stdin:{contents:"export {calculateProductPrice as calculate} from './src/lib/server/pricing.service';",resolveDir:root,loader:'ts'},outfile:output,bundle:true,platform:'browser',format:'iife',globalName:'OBPilot',minify:true,tsconfig:path.join(root,'tsconfig.json'),plugins:[{name:'pilot-only',setup(b){
 b.onLoad({filter:/pricing-data\.json$/},()=>({contents:JSON.stringify(data),loader:'json'}));
 b.onLoad({filter:/pricing\.service\.ts$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace(/\basync\s+/g,'').replace(/\bawait\s+/g,''),loader:'ts',resolveDir:path.dirname(args.path)}));
 b.onResolve({filter:/product-cache$/},()=>({path:'pilot-catalog',namespace:'pilot'}));
 b.onLoad({filter:/.*/,namespace:'pilot'},()=>({contents:`export function getAllCachedProducts(){return ${JSON.stringify({[handle]:{title:product.title,tags:product.tags,priceBandName:product.priceBandName.value}})}}`,loader:'js'}));
}}]});
const engine=fs.readFileSync(output,'utf8');
const formula=engine+`\n// Clear only our previous size errors through the documented option reference.
// options.error(name, null) adds an error; it does not clear one.
var widthOption=options.option&&options.option('width');
if(widthOption&&Array.isArray(widthOption.errors))widthOption.errors=widthOption.errors.filter(function(message){return message&&message!=='Please enter a valid size'&&message!=='Selected measurements are outside the allowed range for this product'&&message!=='We cannot make this blind in that width and drop combination. Please adjust your measurements.';});
var unit=options.value('measurementUnit');
var widthValue=options.value('width'),heightValue=options.value('height');
if(widthValue==null||heightValue==null||String(widthValue).trim()===''||String(heightValue).trim()===''||!['cm','mm'].includes(unit))return 0;
var width=Number(widthValue),height=Number(heightValue);
if(!Number.isFinite(width)||!Number.isFinite(height)){options.error('width','Please enter a valid size');return 0;}
if(unit==='cm'){width+=Number(options.value('widthFraction')||0)/10;height+=Number(options.value('heightFraction')||0)/10;}
var customizations=[];
[['installationMethod','installation-method'],['controlSide','control-side'],['chromeUpgrade','chrome-upgrade'],['cassetteMatchingBar','cassette-bar'],['sameFabricInsert','fabric-insert-cassette'],['motorization','motorization']].forEach(function(pair){if((pair[0]==='chromeUpgrade'||pair[0]==='controlSide')&&options.value('motorization')==='motorized')return;var selected=options.value(pair[0]);if(selected&&selected!=='none')customizations.push({category:pair[1],optionId:selected});});
try{var calculated=OBPilot.calculate({handle:${JSON.stringify(handle)},widthInches:width/(unit==='cm'?2.54:25.4),heightInches:height/(unit==='cm'?2.54:25.4),customizations:customizations});return calculated.totalPrice;}
catch(error){options.error('width',error.message);return 0;}
`;
const directory=path.join(root,'shopify-migration/lpo');
fs.writeFileSync(path.join(directory,'pilot-day-night-formula.js'),formula);
// Compare the reduced engine against the existing full calculator, including
// invalid sizes and every customization combination represented here.
const calculate=new Function(engine+';return OBPilot.calculate;')();
const reference=await import(pathToFileURL(path.join(work,'pricing-reference.mjs')).href);
let checked=0,rejections=0;
for(const width of [10,20,25,35.01,40,55.1,70,90,120])for(const height of [10,20,30.01,50,70,90,120])for(const motor of [false,true])for(const cassette of ['none','white','black','grey']){
 const customizations=[{category:'chrome-upgrade',optionId:'yes'},{category:'fabric-insert-cassette',optionId:'yes'},...(motor?[{category:'motorization',optionId:'motorized'}]:[]),...(cassette==='none'?[]:[{category:'cassette-bar',optionId:cassette}])];
 const request={handle,widthInches:width,heightInches:height,customizations};let a,b,ea,eb;
 try{a=calculate(request);}catch(e){ea=e.message;}
 try{b=await reference.calculateProductPrice(request);}catch(e){eb=e.message;}
 if(ea||eb){if(ea!==eb)throw new Error('Rejection mismatch');rejections++;}else if(Math.abs(a.totalPrice-b.totalPrice)>0.00001)throw new Error('Pilot price mismatch');checked++;
}
const execute=new Function('options',formula);let adapterChecks=0;
for(const unit of ['cm','mm'])for(const cm of [-10,0,10,50,100,200])for(const motor of ['none','motorized'])for(const fraction of [0,9]){
 const values={measurementUnit:unit,width:unit==='cm'?cm:cm*10,height:unit==='cm'?120:1200,widthFraction:String(fraction),heightFraction:String(fraction),motorization:motor,chromeUpgrade:'yes',cassetteMatchingBar:'black',sameFabricInsert:'yes'};
 const errors={};const actual=execute({value:n=>values[n],error:(n,message)=>{errors[n]=message;}});
 const extra=unit==='cm'?fraction/10:0;let expected,error;
 try{expected=(await reference.calculateProductPrice({handle,widthInches:(cm+extra)/2.54,heightInches:(120+extra)/2.54,customizations:[{category:'cassette-bar',optionId:'black'},{category:'fabric-insert-cassette',optionId:'yes'},...(motor==='motorized'?[{category:'motorization',optionId:'motorized'}]:[{category:'chrome-upgrade',optionId:'yes'}])]})).totalPrice;}catch(e){error=e.message;}
 if(error){if(actual!==0||errors.width!==error)throw new Error('Adapter rejection mismatch');}else if(Math.abs(actual-expected)>0.00001)throw new Error('Adapter price mismatch');adapterChecks++;
}
fs.writeFileSync(path.join(directory,'pilot-formula-check.json'),JSON.stringify({handle,band:band.name,checked,rejections,adapterChecks,bytes:Buffer.byteLength(formula),status:'Offline engine and adapter comparisons. Real editor results are recorded separately in pilot-app-price-check.json; checkout remains unverified.'},null,2));
console.log(JSON.stringify({checked,rejections,adapterChecks,formulaBytes:Buffer.byteLength(formula)}));
