import fs from 'node:fs';import path from 'node:path';
const raw=JSON.parse(fs.readFileSync('src/data/pricing/pricing-data.json'));
const catalog=JSON.parse(fs.readFileSync('.shopify-work/catalog.json'));
const source=JSON.parse(fs.readFileSync('shopify-theme/assets/ob-catalog-data.json'));
const category=process.argv[2]||'day-night';if(!['day-night','roller'].includes(category))throw new Error('Unsupported category');
const folder='shopify-migration/lpo/categories/'+category;fs.mkdirSync(folder,{recursive:true});
const widths=new Map(raw.widthBands.map(w=>[w.id,w]));const heights=new Map(raw.heightBands.map(h=>[h.id,h]));
const products=catalog.products.filter(p=>category==='day-night'?/^(Day and Night Blinds|Motorised Dual Zebra Shades)$/.test(source.products[p.handle]?.category):/^Roller\s+-\s+Band/i.test(p.priceBandName?.value||''));
const plans=[];const lists=new Map();
for(const product of products){
 const band=raw.priceBands.find(b=>b.name===product.priceBandName?.value);if(!band)throw new Error('Missing Day/Night band: '+product.handle);
 const motorized=product.tags.some(t=>category==='day-night'?(t.toLowerCase()==='day-and-night-blinds-electrical'||/^day_band_ele_[a-z]+$/i.test(t)):(t.toLowerCase()==='roller-blinds-electrical'||/^roller[-_]\d+(?:1)?[-_]e$/i.test(t)));
 const manualControls=category==='day-night'||motorized||/roller|day|night/i.test(source.products[product.handle]?.category||'');
 const key=band.id+'-'+motorized+(manualControls?'':'-simple');let plan=plans.find(p=>p.key===key);
 if(!plan){const suffix=(motorized?'-electrical':'')+(manualControls?'':'-simple-controls');const slug=(band.name.replace(/\s+-\s+/g,'-')+suffix).toLowerCase().replace(/[^a-z0-9]+/g,'-');plan={key,slug,bandId:band.id,band:band.name,motorized,manualControls,description:'OB Preview - '+band.name+(motorized?' - Electrical':'')+(manualControls?'':' - Simple controls'),listDescription:'OB Preview - '+band.name,representative:product.handle,products:[]};plans.push(plan);}
 plan.products.push({id:product.id.split('/').at(-1),type:'product',title:product.title,handle:product.handle});
 if(!lists.has(band.id)){
  const cells=raw.priceCells.filter(c=>c.priceBandId===band.id);const xs=[...new Set(cells.map(c=>widths.get(c.widthBandId).widthMm))].sort((a,b)=>a-b);const ys=[...new Set(cells.map(c=>heights.get(c.heightBandId).heightMm))].sort((a,b)=>a-b);const prices=new Map();
  for(const cell of cells){const key=widths.get(cell.widthBandId).widthMm+':'+heights.get(cell.heightBandId).heightMm;if(prices.has(key)&&prices.get(key)!==Number(cell.price))throw new Error('Ambiguous matrix cell');prices.set(key,Number(cell.price));}
  const csv=[[0,...xs],...ys.map(y=>[y,...xs.map(x=>prices.get(x+':'+y)??'')])].map(row=>row.join(',')).join('\n')+'\n';
  const file=path.join(folder,band.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.csv');fs.writeFileSync(file,csv);
  lists.set(band.id,{bandId:band.id,band:band.name,description:'OB Preview - '+band.name,file,cells:cells.length,columns:xs.length,rows:ys.length});
 }
}
const result={date:'2026-10-28',category:category==='day-night'?'Day & Night':'Roller',products:products.length,groups:plans.length,lists:[...lists.values()],configurations:plans};
fs.writeFileSync(path.join(folder,'plan.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({products:result.products,groups:result.groups,lists:result.lists},null,2));
