import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {root} from './env.mjs';
// Read-only store refresh plus local generation. Upload remains a separate,
// guarded action so merchant editor changes can be merged first.
for(const script of ['catalog','pricing','product-categories','storefront-snapshot','reviews-snapshot','build','check']){
 console.log(`Running ${script}`);
 const result=spawnSync(process.execPath,[path.join(root,`scripts/shopify-preview/${script}.mjs`)],{cwd:root,stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
console.log('Local preview refreshed and checked. Review editor changes before running the guarded uploader.');
