import fs from 'node:fs';
import path from 'node:path';
import { environment, storeDomain, readAdmin, root, work } from './env.mjs';

// Explicit owner authorization: publish only these five collections to Online Store.
const handles = ['faux-wooden-blinds','skylight-blinds','easy-stick-blinds','perfect-fit-metal','perfect-fit-wooden'];
if(process.argv.length !== 2) throw new Error('No arguments accepted');
if(storeDomain() !== 'online-blinds-express.myshopify.com') throw new Error('Unexpected store');
const catalog=JSON.parse(fs.readFileSync(path.join(work,'catalog.json')));
const publications=await readAdmin('{ publications(first:100){nodes{id name} pageInfo{hasNextPage}} themes(first:20){nodes{id role name updatedAt}} }');
if(publications.publications.pageInfo.hasNextPage) throw new Error('Publication listing incomplete');
const candidates=publications.publications.nodes.filter(p=>p.name==='Online Store');
if(candidates.length!==1) throw new Error('Online Store publication not uniquely identified');
const publicationId=candidates[0].id;
const query='query($id:ID!,$publicationId:ID!){collection(id:$id){id handle title publishedOnPublication(publicationId:$publicationId) resourcePublicationsV2(first:100){nodes{isPublished publication{id name}}}}}';
const before=[];
for(const handle of handles){
 const item=catalog.collections.find(c=>c.handle===handle);
 if(!item)throw new Error(`Missing collection ${handle}`);
 const {collection}=await readAdmin(query,{id:item.id,publicationId});
 if(collection?.handle!==handle)throw new Error('Collection mismatch');
 before.push(collection);
}
fs.writeFileSync(path.join(work,'approved-collection-publication-before.json'),JSON.stringify({publicationId,collections:before,themes:publications.themes.nodes},null,2));
const env=environment();
for(const collection of before){
 if(collection.publishedOnPublication)continue;
 const response=await fetch(`https://${storeDomain()}/admin/api/2026-10/graphql.json`,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Access-Token':env.SHOPIFY_ADMIN_ACCESS_TOKEN},body:JSON.stringify({query:'mutation($id:ID!,$publicationId:ID!){publishablePublish(id:$id,input:{publicationId:$publicationId}){publishable{publishedOnPublication(publicationId:$publicationId)} userErrors{field message}}}',variables:{id:collection.id,publicationId}}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 const result=await response.json();
 if(result.errors || result.data?.publishablePublish.userErrors.length)throw new Error(JSON.stringify(result.errors || result.data.publishablePublish.userErrors));
 console.log(`Published ${collection.handle} to Online Store`);
}
const after=[];
for(const collection of before){
 const {collection:updated}=await readAdmin(query,{id:collection.id,publicationId});
 if(!updated.publishedOnPublication)throw new Error('Publication verification failed');
 for(const previous of collection.resourcePublicationsV2.nodes.filter(p=>p.isPublished)){
  if(!updated.resourcePublicationsV2.nodes.some(p=>p.isPublished&&p.publication.id===previous.publication.id))throw new Error('Existing publication missing');
 }
 after.push(updated);
}
const themes=(await readAdmin('{themes(first:20){nodes{id role name updatedAt}}}')).themes.nodes;
if(JSON.stringify(themes)!==JSON.stringify(publications.themes.nodes))throw new Error('Theme state changed during operation');
const report={checkedAt:new Date().toISOString(),collections:after.map(c=>({handle:c.handle,channels:c.resourcePublicationsV2.nodes.filter(p=>p.isPublished).map(p=>p.publication.name)})),themesUnchanged:true};
fs.writeFileSync(path.join(root,'shopify-migration/approved-collection-publication.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
