import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
import {root,work} from './env.mjs';
const {build}=createRequire(path.join(work,'tooling/package.json'))('esbuild');
const folder='shopify-migration/lpo/categories/day-night';const plan=JSON.parse(fs.readFileSync(folder+'/plan.json'));
const drafts=JSON.parse(fs.readFileSync(folder+'/drafts.json'));if(drafts.length!==plan.configurations.length)throw new Error('Create all inactive draft IDs first');
const catalog=JSON.parse(fs.readFileSync('.shopify-work/catalog.json'));const raw=JSON.parse(fs.readFileSync('src/data/pricing/pricing-data.json'));
const reference=await import(pathToFileURL(path.join(work,'pricing-reference.mjs')).href);
const metadata={};const checks=[];
const widthById=new Map(raw.widthBands.map(b=>[b.id,b])),heightById=new Map(raw.heightBands.map(b=>[b.id,b]));
for(const group of plan.configurations){
 const product=catalog.products.find(p=>p.handle===group.representative),draft=drafts.find(d=>d.key===group.key);
 const cells=raw.priceCells.filter(c=>c.priceBandId===group.bandId),band=raw.priceBands.find(b=>b.id===group.bandId);
 const data={...raw,priceBands:[band],priceCells:cells};const enginePath=path.join(work,'category-'+group.slug+'.js');
 const body=`export {calculateProductPrice as calculate} from './src/lib/server/pricing.service';
 import {getBlindFamilyFromTags,getControlSystemLimits,shouldClampToBandGrid} from './src/lib/measurement-ranges';
 const tags=${JSON.stringify(product.tags)};
 export const manualLimits=getControlSystemLimits(getBlindFamilyFromTags(tags),'ccl');
 export const motorLimits=getControlSystemLimits(getBlindFamilyFromTags(tags),'motorized');
 export const clamp=shouldClampToBandGrid(tags);
 export function checkSize(width,height,motorized){const limits=motorized?motorLimits:manualLimits;if(limits&&(width<limits.minWidth||width>limits.maxWidth||height<limits.minHeight||height>limits.maxHeight))throw new Error('Selected measurements are outside the allowed range for this product');}`;
 await build({stdin:{contents:body,resolveDir:root,loader:'ts'},outfile:enginePath,bundle:true,platform:'browser',format:'iife',globalName:'OBCategory',minify:true,tsconfig:path.join(root,'tsconfig.json'),plugins:[{name:'category-only',setup(b){
  b.onLoad({filter:/pricing-data\.json$/},()=>({contents:JSON.stringify(data),loader:'json'}));
  b.onLoad({filter:/pricing\.service\.ts$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace(/\basync\s+/g,'').replace(/\bawait\s+/g,''),loader:'ts',resolveDir:path.dirname(args.path)}));
  b.onResolve({filter:/product-cache$/},()=>({path:'category-products',namespace:'category'}));b.onLoad({filter:/.*/,namespace:'category'},()=>({contents:`export function getAllCachedProducts(){return ${JSON.stringify({[product.handle]:{title:product.title,tags:product.tags,priceBandName:band.name}})}}`,loader:'js'}));
 }}]});
 const engine=fs.readFileSync(enginePath,'utf8');const api=new Function(engine+';return OBCategory;')();
 const messages=['Please enter a valid size','Selected measurements are outside the allowed range for this product','We cannot make this blind in that width and drop combination. Please adjust your measurements.','The pricing list could not be verified. Please try again.'];
 const formula=engine+`\nvar widthOption=options.option&&options.option('width');
 if(widthOption&&Array.isArray(widthOption.errors))widthOption.errors=widthOption.errors.filter(function(message){return message&&${JSON.stringify(messages)}.indexOf(message)<0;});
 var unit=options.value('measurementUnit'),wv=options.value('width'),hv=options.value('height');
 if(wv==null||hv==null||String(wv).trim()===''||String(hv).trim()===''||!['cm','mm'].includes(unit))return 0;
 var width=Number(wv),height=Number(hv);
 if(!Number.isFinite(width)||!Number.isFinite(height)){options.error('width',${JSON.stringify(messages[0])});return 0;}
 if(unit==='cm'){width+=Number(options.value('widthFraction')||0)/10;height+=Number(options.value('heightFraction')||0)/10;}
 var motorized=${group.motorized?'true':"options.value('motorization')==='motorized'"},customizations=[];
 [['installationMethod','installation-method'],['controlSide','control-side'],['chromeUpgrade','chrome-upgrade'],['cassetteMatchingBar','cassette-bar'],['sameFabricInsert','fabric-insert-cassette']].forEach(function(pair){if(motorized&&(pair[0]==='controlSide'||pair[0]==='chromeUpgrade'))return;var selected=options.value(pair[0]);if(selected&&selected!=='none')customizations.push({category:pair[1],optionId:selected});});
 if(motorized)customizations.push({category:'motorization',optionId:'motorized'});
 try{
  OBCategory.checkSize(width/(unit==='cm'?2.54:25.4),height/(unit==='cm'?2.54:25.4),motorized);
  var calculated=OBCategory.calculate({handle:${JSON.stringify(product.handle)},widthInches:width/(unit==='cm'?2.54:25.4),heightInches:height/(unit==='cm'?2.54:25.4),customizations:customizations});
  var dimension=Number(options.lookup(options.list(${JSON.stringify(group.listDescription)}),calculated.widthBand.mm,calculated.heightBand.mm));
  if(!Number.isFinite(dimension)||Math.abs(dimension-calculated.dimensionPrice)>0.011)throw new Error(${JSON.stringify(messages[3])});
  return dimension+calculated.totalPrice-calculated.dimensionPrice;
 }catch(error){options.error('width',error.message);return 0;}
 `;
 fs.writeFileSync(folder+'/'+group.slug+'-formula.js',formula);
 const options=JSON.parse(fs.readFileSync('shopify-migration/lpo/pilot-app-options.json'));
 const units=options.find(o=>o.name==='measurementUnit');units.values=units.values.map(v=>({...v,priceFormula:formula}));
 if(group.motorized){const motor=options.find(o=>o.name==='motorization');motor.required=true;motor.value='motorized';motor.values=motor.values.filter(v=>v.value==='motorized');}
 fs.writeFileSync(folder+'/'+group.slug+'-options.json',JSON.stringify(options,null,2)+'\n');
 const xs=[...new Map(cells.map(c=>{const w=widthById.get(c.widthBandId);return[w.widthMm,{mm:w.widthMm,inches:w.widthInches}];})).values()].sort((a,b)=>a.inches-b.inches);
 const ys=[...new Map(cells.map(c=>{const h=heightById.get(c.heightBandId);return[h.heightMm,{mm:h.heightMm,inches:h.heightInches}];})).values()].sort((a,b)=>a.inches-b.inches);
 const fallback={minWidth:xs[0].inches,maxWidth:xs.at(-1).inches,minHeight:ys[0].inches,maxHeight:ys.at(-1).inches};
 metadata[draft.configUuid]={description:group.description,products:group.products.map(p=>p.id),handles:group.products.map(p=>p.handle),forceMotorized:group.motorized,manualLimits:api.manualLimits||fallback,motorLimits:api.motorLimits||fallback,clamp:api.clamp,widths:xs,heights:ys,cells:cells.map(c=>widthById.get(c.widthBandId).widthMm+':'+heightById.get(c.heightBandId).heightMm)};
 const prices=new Map(cells.map(c=>[widthById.get(c.widthBandId).widthMm+':'+heightById.get(c.heightBandId).heightMm,Number(c.price)]));
 const execute=new Function('options',formula);let compared=0,rejections=0;
 const cases=[];
 for(const motor of group.motorized?[true]:[false,true])for(const w of [0,10,33.02,50,60.96,100,100.1,150,243.84,250])for(const h of [0,20,33.02,120,238.76,300])cases.push({handle:product.handle,width:w,height:h,motor});
 for(const p of group.products)for(const motor of group.motorized?[true]:[false,true])for(const w of [50,100,200])cases.push({handle:p.handle,width:w,height:120,motor});
 for(const test of cases){const values={width:test.width,height:test.height,measurementUnit:'cm',widthFraction:0,heightFraction:0,motorization:test.motor?'motorized':'none',chromeUpgrade:'yes',cassetteMatchingBar:'black',sameFabricInsert:'yes'};let error;
  const actual=execute({value:n=>values[n],option:()=>({errors:[]}),error:(n,msg)=>{error=msg;},list:n=>{if(n!==group.listDescription)throw new Error('Wrong list description');return prices;},lookup:(list,x,y)=>list.get(x+':'+y)});
  let expected,expectedError;try{api.checkSize(test.width/2.54,test.height/2.54,test.motor);expected=(await reference.calculateProductPrice({handle:test.handle,widthInches:test.width/2.54,heightInches:test.height/2.54,customizations:[{category:'cassette-bar',optionId:'black'},{category:'fabric-insert-cassette',optionId:'yes'},...(test.motor?[{category:'motorization',optionId:'motorized'}]:[{category:'chrome-upgrade',optionId:'yes'}])]})).totalPrice;}catch(e){expectedError=e.message;}
  if(expectedError){if(actual!==0||error!==expectedError)throw new Error('Category rejection mismatch '+group.slug+' '+JSON.stringify(test));rejections++;}else if(error||Math.abs(actual-expected)>0.011)throw new Error('Category price mismatch '+group.slug+' '+JSON.stringify(test));compared++;
 }
 checks.push({description:group.description,products:group.products.length,compared,rejections,formulaSha256:createHash('sha256').update(formula).digest('hex'),formulaBytes:Buffer.byteLength(formula)});console.log('Verified '+group.description+': '+compared+' source comparisons');
}
fs.writeFileSync(folder+'/validation-metadata.json',JSON.stringify(metadata,null,2)+'\n');fs.writeFileSync(folder+'/formula-check.json',JSON.stringify({date:'2026-10-28',scope:'Offline formulas including explicit Assets lookup, source control limits and every assigned product. Actual editor and storefront checks are separate.',passed:true,checks},null,2)+'\n');
