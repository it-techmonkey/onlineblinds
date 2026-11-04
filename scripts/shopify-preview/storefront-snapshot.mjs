import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {root,work,themePath,environment} from './env.mjs';
Object.assign(process.env,environment());
// Source production functions can suppress fetch errors during static builds.
// A refresh must fail instead of silently replacing a collection with no data.
process.env.NODE_ENV='development';
const {build}=createRequire(path.join(work,'tooling/package.json'))('esbuild');
await build({stdin:{contents:`export * from './src/lib/api';export * from './src/data/navigation';export {fetchAllShopifyProductsByCollectionMerged} from './src/lib/shopify';`,resolveDir:root,loader:'ts'},outfile:path.join(work,'source-catalog.mjs'),bundle:true,platform:'node',format:'esm',tsconfig:path.join(root,'tsconfig.json'),plugins:[{name:'offline-prices',setup(b){b.onResolve({filter:/server\/pricing.service/},()=>({path:path.join(work,'pricing-reference.mjs')}));}}]});
const api=await import(pathToFileURL(path.join(work,'source-catalog.mjs')).href);
const all=(await api.fetchProducts()).data;
if(all.length<1000)throw new Error('Incomplete source catalog; refusing replacement');
const categories=await api.fetchCategories();
if(!categories.length)throw new Error('Source categories unavailable');
if(all.some(p=>!(Number(p.price)>0)))throw new Error('Source catalog contains unpriced products');
const collections={};
const handles=[...new Set([...api.ALL_COLLECTION_SLUGS,...categories.map(c=>c.slug),'all'])];
for(const slug of handles){
 const filter=api.CUSTOM_COLLECTION_FILTERS[slug];let products=[];
 if(slug==='all')products=all;
 else if(filter){
  const scoped=filter.categorySlugsAny?.length&&!filter.tagsAny?.length&&!filter.tagsAll?.length&&!filter.productSlugsAny?.length&&!filter.categorySlugsAll?.length;
  const source=scoped?await api.fetchProductsForCollectionSlugs(filter.categorySlugsAny):all;
  products=source.filter(p=>{const tags=p.tags.map(t=>t.slug.toLowerCase()),cats=p.categories.map(c=>c.slug.toLowerCase());
   if(filter.productSlugsAny?.includes(p.slug.toLowerCase()))return true;
   return (!filter.tagsAll||filter.tagsAll.every(t=>tags.includes(t.toLowerCase())))&&(!filter.tagsAny||filter.tagsAny.some(t=>tags.includes(t.toLowerCase())))&&(!filter.categorySlugsAll||filter.categorySlugsAll.every(c=>cats.includes(c.toLowerCase())))&&(!filter.categorySlugsAny||filter.categorySlugsAny.some(c=>cats.includes(c.toLowerCase())));
  });
 }else{
  const mapped=api.NAVIGATION_SLUG_MAPPING[slug]||slug;
  if(categories.some(c=>c.slug===mapped)){
   products=await api.fetchAllShopifyProductsByCollectionMerged(mapped);
   products=products.filter(p=>(api.NAVIGATION_TAG_FILTERS[slug]||[]).every(t=>p.tags.some(v=>v.slug===t))&&(api.NAVIGATION_CATEGORY_FILTERS[slug]||[]).every(c=>p.categories.some(v=>v.slug===c)));
  }
 }
 // Same title, description and "Coming Soon" rules as the live category page.
 const backend=categories.find(c=>c.slug===(api.NAVIGATION_SLUG_MAPPING[slug]||slug));
 const title=slug==='all'?'All Products':api.COLLECTION_DISPLAY_NAMES[slug]||backend?.name||slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
 const description=slug==='all'?'Explore our complete range of premium window blinds. From vertical to roller, find the perfect style to complement your space.':api.COLLECTION_DESCRIPTIONS[slug]??backend?.description??`Explore our beautiful collection of ${title.toLowerCase()} for your home.`;
 collections[slug]={title,description,handles:products.map(p=>p.slug),comingSoon:slug!=='all'&&((!backend&&!filter)||products.length===0)};
 console.log(`${slug}: ${products.length}`);
}
const top=(await api.fetchProducts({limit:100})).data;
const products={};
for(const p of all){const category=p.categories[0]?.slug;const same=top.filter(q=>q.slug!==p.slug&&(!category||q.categories.some(c=>c.slug===category))).slice(0,4);const remaining=top.filter(q=>q.slug!==p.slug&&!same.some(s=>s.slug===q.slug)&&(!category||!q.categories.some(c=>c.slug===category))).slice(0,4-same.length);const transformed=api.transformProduct(p);
 products[p.slug]={...transformed,description:undefined,reviews:undefined,relatedProducts:undefined,images:transformed.images.slice(0,2),related:[...same,...remaining].map(p=>p.slug)};
}
fs.writeFileSync(path.join(themePath,'assets/ob-catalog-data.json'),JSON.stringify({generatedAt:new Date().toISOString(),products,collections}));
fs.writeFileSync(path.join(work,'source-catalog-summary.json'),JSON.stringify({products:all.length,collections:handles.length},null,2));
console.log(`Prepared ${all.length} products and ${handles.length} collections from source read-only functions.`);
