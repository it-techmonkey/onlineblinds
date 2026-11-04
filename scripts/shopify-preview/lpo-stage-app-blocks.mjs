import fs from 'node:fs';import path from 'node:path';
const reference=fs.readFileSync('.shopify-work/reference-theme/templates/product.json','utf8');const type=reference.match(/shopify:\/\/apps\/live-product-options\/blocks\/app-block\/[a-z0-9-]+/)?.[0];if(!type)throw new Error('Verified LPO app block reference missing');
const changed=[];
for(const name of fs.readdirSync('shopify-theme/templates').filter(n=>/^product(?:\..+)?\.json$/.test(n))){
 const file=path.join('shopify-theme/templates',name),source=fs.readFileSync(file,'utf8'),template=JSON.parse(source.slice(source.indexOf('{')));
 for(const section of Object.values(template.sections))if(section.type==='ob-product-design'){
  if(section.settings?.lpo_pilot_enabled===true)throw new Error('Category bridge must remain disabled until private storefront tests');
  section.blocks||={};section.block_order||=[];if(!Object.values(section.blocks).some(b=>b.type===type)){section.blocks.ob_lpo_engine={type,settings:{}};section.block_order.push('ob_lpo_engine');changed.push(name);}
 }
 fs.writeFileSync(file,JSON.stringify(template,null,2)+'\n');
}
console.log(JSON.stringify({appBlocksStaged:changed,bridgeEnabled:false,purchasingEnabled:false}));
