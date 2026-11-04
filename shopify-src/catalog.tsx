import React from 'react';
import ProductGridWithFilters from '@/components/collection/ProductGridWithFilters';
import ProductCard from '@/components/product/ProductCard';
import { getDeliveryDateRange } from '@/lib/delivery';
import { DELIVERY_STANDARD, DELIVERY_VERTICAL } from '@/types';
import { Image, Link } from './adapters/runtime';

export function EmptyCart() {
  return <div className="bg-background-alt px-4 py-12 md:px-6 md:py-16 lg:px-8"><div className="mx-auto max-w-3xl"><div className="rounded-2xl border border-border bg-white px-6 py-10 text-center shadow-sm md:px-10 md:py-14"><div className="mb-6 flex justify-center"><div className="flex h-22 w-22 items-center justify-center rounded-full bg-primary-light text-primary"><Image src="/icons/cart.svg" alt="Empty Cart" width={44} height={44} className="opacity-80" /></div></div><h1 className="font-display text-[36px] leading-none text-foreground md:text-[44px]">Your Cart is Empty</h1><p className="mx-auto mt-3 max-w-lg text-[15px] text-muted md:text-[16px]">Looks like you haven&apos;t added any custom blinds yet. Explore collections and build your perfect fit.</p><Link href="/collections" className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-jost text-[14px] font-semibold uppercase tracking-[0.06em] text-white transition-colors hover:bg-primary-dark">Browse Collections</Link></div></div></div>;
}

const sorts: Record<string, any> = { 'price-ascending': 'price-low', 'price-descending': 'price-high', 'title-ascending': 'name-az', 'title-descending': 'name-za', 'best-selling': 'best-selling', manual: 'best-selling' };
export function CollectionGrid(props: any) {
  return <ProductGridWithFilters {...props} filterOptions={{ colors: [], patterns: [] }} currentSort={sorts[props.currentSort] || props.currentSort || 'price-low'} />;
}
export function BestSellerGrid({ products }: any) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{products.map((product: any) => <ProductCard key={product.id} product={product} className="w-full" showBestSellerBadge={false} />)}</div>;
}
export function Delivery({ vertical }: any) {
  return <div className="flex items-center border border-border rounded-[16px] mb-4 md:mb-6 px-3 md:px-4 py-2.5 md:py-3 bg-surface shadow-[0_4px_14px_rgba(31,41,51,0.04)]">
    <div className="w-10 h-10 md:w-12 md:h-12 bg-surface-soft rounded-[12px] flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 md:w-6 md:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
    </div><div className="ml-2 md:ml-3"><div className="text-[10px] md:text-xs text-muted">Est. Delivery</div><div className="text-xs md:text-sm font-semibold text-foreground">{getDeliveryDateRange(vertical ? DELIVERY_VERTICAL : DELIVERY_STANDARD)}</div></div>
  </div>;
}
