import fs from 'node:fs';import {readAdmin} from './env.mjs';
const before=JSON.parse(fs.readFileSync('.shopify-work/lpo-day-night-products-before.json'));
const result=await readAdmin('query($ids:[ID!]!){nodes(ids:$ids){... on Product{id handle updatedAt variants(first:5){nodes{id price} pageInfo{hasNextPage}}}}}',{ids:before.map(p=>p.id)});
for(let i=0;i<result.nodes.length;i++)if(result.nodes[i]?.variants.pageInfo.hasNextPage){const response=await readAdmin('query($id:ID!){product(id:$id){id handle updatedAt variants(first:100){nodes{id price} pageInfo{hasNextPage}}}}',{id:result.nodes[i].id});result.nodes[i]=response.product;}
const changes=before.filter((p,i)=>JSON.stringify(p)!==JSON.stringify(result.nodes[i])).map(p=>p.handle);
const report={date:'2026-10-28',productsChecked:before.length,variantCount:before.flatMap(p=>p.variants.nodes).length,changedProducts:changes,pricesUnchanged:changes.length===0};
fs.writeFileSync('shopify-migration/lpo/categories/day-night/store-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(changes.length)process.exitCode=1;
