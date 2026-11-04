import React, {useState,useEffect} from 'react';
import {catalogData} from './catalog-data';
import CategoryHero from '@/components/collection/CategoryHero';
import ProductGridWithFilters from '@/components/collection/ProductGridWithFilters';
import { Link, storefrontSearch } from './adapters/runtime';

// Mirrors the live /search page: Storefront products(query:) matches, newest
// first, up to 500, all shown on one page in the category-page product grid.
export function SearchDesign({ query }: any) {
  const [products,setProducts]=useState<any[]>([]),[loading,setLoading]=useState(Boolean(query.trim())),[error,setError]=useState(false);
  useEffect(()=>{let active=true;async function load(){
    if(!query.trim())return;
    const [catalog,handles]=await Promise.all([catalogData(),storefrontSearch(query,500)]);
    if(active){setProducts([...new Set(handles)].map(h=>catalog.products[h]).filter(Boolean));setLoading(false);}
  }load().catch(()=>{if(active){setError(true);setLoading(false);}});return()=>{active=false};},[query]);
  if(error)return <p role="alert" className="ob-wrap ob-section">Search could not be loaded. Please reload this page.</p>;
  return <div className="bg-background">
    <div className="border-b border-border bg-surface"><div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-20 py-6 md:py-8"><form action="/search" method="get" className="max-w-2xl mx-auto"><input type="hidden" name="type" value="product" /><div className="flex gap-2"><input type="text" name="q" aria-label="Search products" defaultValue={query} placeholder="Search for blinds, colors, styles..." className="flex-1 rounded-md border border-border px-4 py-3 text-base text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-[rgba(68,87,102,0.12)]" /><button type="submit" className="rounded-md bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark">Search</button></div></form></div></div>
    {query ? <><CategoryHero title={`Search Results for "${query}"`} description={loading ? 'Searching...' : `Found ${products.length} product${products.length !== 1 ? 's' : ''}`} productCount={products.length} /><div className="px-4 md:px-6 lg:px-20 py-8 md:py-12"><div className="max-w-[1400px] mx-auto">{loading ? <div className="text-center py-16"><div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div><p className="mt-4 text-muted">Searching products...</p></div> : products.length > 0 ? <ProductGridWithFilters products={products} filterOptions={{colors:[],patterns:[]}} categoryName={`Search Results for "${query}"`} listId="search_results" /> : <div className="rounded-lg border border-border bg-surface py-16 text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft"><svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></div><h3 className="mb-2 text-lg font-semibold text-foreground">No products found</h3><p className="mb-4 text-muted">Try searching with different keywords or browse our collections.</p><Link href="/collections" className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">Browse All Products</Link></div>}</div></div></> : <div className="px-4 md:px-6 lg:px-20 py-16"><div className="max-w-[1400px] mx-auto text-center"><h2 className="mb-4 text-2xl font-semibold text-foreground">Search Products</h2><p className="mb-8 text-muted">Enter a search term above to find the perfect blinds for your home.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">{[['/collections/vertical-blinds','Vertical Blinds'],['/collections/roller-blinds','Roller Blinds'],['/collections/roman-blinds','Roman Blinds'],['/collections','All Products']].map(([href,label])=><Link key={href} href={href} className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary"><p className="text-sm font-medium text-foreground">{label}</p></Link>)}</div></div></div>}
  </div>;
}
