import fs from 'node:fs';
const registry=JSON.parse(fs.readFileSync('shopify-src/lpo-configurations.json'));
const groups=new Map();for(const[handle,config]of Object.entries(registry)){const handles=groups.get(config.configId)||[];handles.push(handle);groups.set(config.configId,handles);}
const lines=['{%- case product.handle -%}',...[...groups].map(([id,handles])=>`{%- when ${handles.map(handle=>`'${handle}'`).join(', ')} -%}${id}`),'{%- endcase -%}'];
fs.writeFileSync('shopify-theme/snippets/ob-lpo-config-id.liquid',lines.join('\n')+'\n');
console.log('Generated theme LPO routing for '+Object.keys(registry).length+' product handles');
