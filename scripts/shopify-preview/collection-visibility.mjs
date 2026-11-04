import fs from 'node:fs';
import path from 'node:path';
import { readAdmin, work } from './env.mjs';
const catalog=JSON.parse(fs.readFileSync(path.join(work,'catalog.json')));
const handles=['faux-wooden-blinds','skylight-blinds','easy-stick-blinds','perfect-fit-metal','perfect-fit-wooden'];
const reports=[];
for(const handle of handles){
 const item=catalog.collections.find(c=>c.handle===handle);
 const result=await readAdmin('query($id:ID!){collection(id:$id){handle title productsCount{count} resourcePublicationsV2(first:20){nodes{isPublished publication{name}}}}}',{id:item.id});
 reports.push(result.collection);
}
fs.writeFileSync(path.join(work,'collection-visibility.json'),JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
