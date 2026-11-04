import React, {useEffect,useState} from 'react';
import CategoryHero from '@/components/collection/CategoryHero';
import ProductGridWithFilters from '@/components/collection/ProductGridWithFilters';
import ComingSoon from '@/components/collection/ComingSoon';
import {catalogData} from './catalog-data';

export function sortedPage(products: any[], sort: string, page: number) {
  const sorted=[...products];
  if(sort==='price-low') sorted.sort((a,b)=>Number(a.price)-Number(b.price));
  if(sort==='price-high') sorted.sort((a,b)=>Number(b.price)-Number(a.price));
  if(sort==='name-az') sorted.sort((a,b)=>a.name.localeCompare(b.name));
  if(sort==='name-za') sorted.sort((a,b)=>b.name.localeCompare(a.name));
  const total=sorted.length,totalPages=Math.ceil(total/24);
  return {products:sorted.slice((page-1)*24,page*24),pagination:{page,limit:24,total,totalPages,hasNextPage:page<totalPages,hasPreviousPage:page>1}};
}
export function CollectionDesign({handle}: {handle:string}) {
  const [data,setData]=useState<any>(null),[error,setError]=useState(false);
  useEffect(()=>{catalogData().then(setData).catch(()=>setError(true));},[]);
  if(error)return <p role="alert" className="ob-wrap ob-section">Products could not be loaded. Please reload this page.</p>;
  if(!data)return <p role="status" className="ob-wrap ob-section">Loading products…</p>;
  const params=new URLSearchParams(location.search),slug=params.get('ob_collection')||handle;
  const collection=data.collections[slug];
  if(!collection)return <p className="ob-wrap ob-section">Collection unavailable.</p>;
  const sort=params.get('sort')||'price-low',page=Math.max(1,Math.floor(Number(params.get('page'))||1));
  const results=sortedPage(collection.handles.map((h:string)=>data.products[h]).filter(Boolean),sort,page);
  const motorised=['motorised-roller-shades','motorised-dual-zebra-shades','motorised-eclipsecore','motorised-blinds'].includes(slug);
  // Live /collections (All Products) uses a wider layout than category pages.
  if(slug==='all')return <><CategoryHero title={collection.title} description={collection.description} productCount={results.pagination.total}/><div className="px-4 md:px-6 lg:px-20 py-8 md:py-12"><div className="max-w-[1400px] mx-auto"><ProductGridWithFilters {...results} filterOptions={{colors:[],patterns:[]}} categoryName={collection.title} listId="all" basePath="/collections" currentSort={sort as any}/></div></div></>;
  return <><CategoryHero title={collection.title} slug={slug} description={collection.description} productCount={results.pagination.total}/><div className="flex flex-col gap-[32px] items-start max-w-[1280px] px-[24px] py-[40px] mx-auto w-full">{collection.comingSoon?<ComingSoon categoryName={collection.title}/>:<ProductGridWithFilters {...results} filterOptions={{colors:[],patterns:[]}} categoryName={collection.title} listId={slug} basePath={location.pathname} currentSort={sort as any} preselectedMotorization={motorised}/>}</div></>;
}
