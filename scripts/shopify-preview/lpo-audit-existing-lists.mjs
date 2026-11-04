import fs from 'node:fs';
const family=process.argv[2]||'Day & Night',slug=family==='Day & Night'?'day-night':family.toLowerCase();
if(!['Day & Night','Roller'].includes(family))throw new Error('Unsupported family audit');
const data=JSON.parse(fs.readFileSync('src/data/pricing/pricing-data.json')),catalog=JSON.parse(fs.readFileSync('.shopify-work/catalog.json'));
const width=new Map(data.widthBands.map(w=>[w.id,w])),height=new Map(data.heightBands.map(h=>[h.id,h]));const lists=[];
for(const band of data.priceBands.filter(b=>family==='Day & Night'?/day.*night/i.test(b.name):/^Roller\s+-\s+Band/i.test(b.name))){
 const suffix=band.name.match(/Band\s+(.+)$/i)?.[1];
 for(const unit of ['mm','cm','inches']){
  const name=family+' Band '+suffix+(unit==='mm'?'':unit==='cm'?' CM':' Inches');const file='.shopify-work/lpo-asset-exports/'+name.replace(/[^a-zA-Z0-9_-]/g,'_')+'.csv';if(!fs.existsSync(file))continue;
  const table=fs.readFileSync(file,'utf8').trim().split(/\r?\n/).map(l=>l.split(',').map(Number)),xs=table[0].slice(1),rows=table.slice(1);const factor=unit==='mm'?1:unit==='cm'?10:25.4;let checked=0,mismatches=0;const examples=[];
  for(const cell of data.priceCells.filter(c=>c.priceBandId===band.id)){
   const x=width.get(cell.widthBandId).widthMm/factor,y=height.get(cell.heightBandId).heightMm/factor,epsilon=unit==='inches'?0.051:0.001;
   const xi=xs.findIndex(v=>Math.abs(v-x)<epsilon),row=rows.find(r=>Math.abs(r[0]-y)<epsilon);if(xi<0||!row)continue;
   const actual=row[xi+1],expected=Number(cell.price);checked++;if(Math.abs(actual-expected)>0.011){mismatches++;if(examples.length<2)examples.push({widthMm:width.get(cell.widthBandId).widthMm,heightMm:height.get(cell.heightBandId).heightMm,listPrice:actual,sourcePrice:expected});}
  }
  lists.push({band:band.name,list:name,unit,matchingCoordinates:checked,priceMismatches:mismatches,examples,reuseUnchanged:checked>0&&mismatches===0,products:catalog.products.filter(p=>p.priceBandName?.value===band.name).length});
 }
}
const report={date:'2026-10-28',family,scope:'Exported Assets cells at the same physical coordinates compared with current source matrix prices. Inches labels use the exported one-decimal precision; lookup semantics must also be checked before reuse. Originals are not edited.',lists};
fs.writeFileSync('shopify-migration/lpo/existing-'+slug+'-lists-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({family,listComparisons:lists.length,coordinatesCompared:lists.reduce((s,l)=>s+l.matchingCoordinates,0),mismatches:lists.reduce((s,l)=>s+l.priceMismatches,0),reusable:lists.filter(l=>l.reuseUnchanged).map(l=>l.list)}));
