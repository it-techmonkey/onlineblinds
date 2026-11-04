import fs from 'node:fs';
import path from 'node:path';
import {environment,themePath} from './env.mjs';
const env=environment();const grouped={};let count=0;
for(let page=1;;page++){
 const url=new URL('https://judge.me/api/v1/reviews');
 url.search=new URLSearchParams({api_token:env.JUDGEME_API_TOKEN,shop_domain:env.JUDGEME_SHOP_DOMAIN,per_page:'100',page:String(page),published:'true'});
 let response;try{response=await fetch(url,{signal:AbortSignal.timeout(30000)});}catch{throw new Error(`Review read failed on page ${page}`);}
 if(!response.ok)throw new Error(`Review read HTTP ${response.status} on page ${page}`);
 const data=await response.json();if(!Array.isArray(data.reviews))throw new Error('Invalid review response');
 for(const r of data.reviews){
  if(r.published!==true||r.hidden===true||r.curated!=='ok'||!r.product_handle)continue;
  const reviews=grouped[r.product_handle]||=[];if(reviews.length>=150)continue;
  reviews.push({id:r.id,title:r.title,body:r.body,rating:r.rating,reviewer:{name:r.reviewer?.name||'Customer'},created_at:r.created_at,verified:Boolean(r.verified),pictures:(r.pictures||[]).filter(p=>p.hidden===false).map(p=>({urls:{original:p.urls?.original,small:p.urls?.small}}))});count++;
 }
 console.log(`Read published review page ${page}`);
 if(data.reviews.length<100)break;if(page>=500)throw new Error('Review pagination safety limit reached');
}
const products=Object.fromEntries(Object.entries(grouped).map(([handle,reviews])=>[handle,{averageRating:Math.round(reviews.reduce((n,r)=>n+r.rating,0)/reviews.length*10)/10,totalReviews:reviews.length,ratingCounts:[5,4,3,2,1].map(rating=>({rating,count:reviews.filter(r=>r.rating===rating).length})),reviews}]));
fs.writeFileSync(path.join(themePath,'assets/ob-reviews-data.json'),JSON.stringify({generatedAt:new Date().toISOString(),products}));
console.log(`Prepared ${count} published reviews across ${Object.keys(products).length} products; private reviewer fields excluded.`);
