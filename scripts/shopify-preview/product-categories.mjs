import fs from 'node:fs';
import path from 'node:path';
import {readAdmin,themePath} from './env.mjs';
// Liquid omits collections unavailable to Online Store. Preserve the source
// product-type assignments without modifying collection publication or products.
const products=[];let cursor=null;
do {
 const result=await readAdmin('query($cursor:String){products(first:100,after:$cursor){nodes{handle collections(first:100){nodes{handle title} pageInfo{hasNextPage}}} pageInfo{hasNextPage endCursor}}}',{cursor});
 for(const p of result.products.nodes){if(p.collections.pageInfo.hasNextPage)throw new Error(`Collection pagination required for ${p.handle}`);products.push(p);}
 cursor=result.products.pageInfo.hasNextPage?result.products.pageInfo.endCursor:null;
}while(cursor);
const lines=products.map(p=>`{% when '${p.handle}' %}"collections":${JSON.stringify(p.collections.nodes.map(c=>c.handle))},"collectionTitles":${JSON.stringify(p.collections.nodes.map(c=>c.title))}`);
const parts=[];
for(let offset=0;offset<lines.length;offset+=100){
 const name=`ob-product-categories-${offset/100}`;
 fs.writeFileSync(path.join(themePath,`snippets/${name}.liquid`),`{%- case product.handle -%}${lines.slice(offset,offset+100).join('')}{%- endcase -%}`);
 parts.push(`{% render '${name}', product: product %}`);
}
fs.writeFileSync(path.join(themePath,'snippets/ob-product-categories.liquid'),`{% capture assignments %}${parts.join('')}{% endcapture %}{% assign assignments = assignments | strip %}{% if assignments != blank %}{{ assignments }}{% else %}"collections":[],"collectionTitles":[]{% endif %}\n`);
console.log(`Prepared category assignments for ${products.length} products; no store writes.`);
