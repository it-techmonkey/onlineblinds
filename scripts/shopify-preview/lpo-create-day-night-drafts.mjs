import fs from 'node:fs';import {initialize,call} from './lpo-mcp.mjs';
await initialize();const read=r=>r.structuredContent||JSON.parse(r.content.find(c=>c.type==='text').text);
const folder='shopify-migration/lpo/categories/day-night';const plan=JSON.parse(fs.readFileSync(folder+'/plan.json'));
const existing=read(await call('config_list',{limit:250})).configs;
const file=folder+'/drafts.json';const drafts=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):[];
for(const group of plan.configurations){
 if(drafts.some(d=>d.key===group.key))continue;
 let config=existing.find(c=>c.name===group.description);
 if(group.band==='Dayandnight - Band A'&&!group.motorized){config=existing.find(c=>c.uuid==='clfhanm6jjqw');}
 if(!config){const result=read(await call('config_duplicate',{configUuid:'clfhanm6jjqw',description:group.description}));config=result.config;}
 if(!config||config.enabled)throw new Error('Invalid or active migration configuration');
 drafts.push({key:group.key,slug:group.slug,configUuid:config.uuid,description:group.description,products:group.products.length});fs.writeFileSync(file,JSON.stringify(drafts,null,2)+'\n');console.log('Prepared inactive draft '+group.description);
}
