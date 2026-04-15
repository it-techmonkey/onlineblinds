'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/product';
import { fetchProducts, transformProduct } from '@/lib/api';

interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  currency?: string;
  rating: number;
  image?: string;
  images?: string[];
  isBestSeller?: boolean;
}

const fallbackImages = [
  "/home/products/vertical-blinds-1.jpg",
  "/home/products/vertical-blinds-2.jpg",
  "/home/products/vertical-blinds-3.jpg",
  "/home/products/vertical-blinds-4.jpg",
  "/home/products/vertical-blinds-5.jpg",
  "/home/products/blinds.jpeg",
  "/home/products/vertical-blinds-1.jpg",
];

const BestSelling = () => {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetchProducts({ limit: 8 });
        setProducts(response.data.slice(0, 8).map((pd, i) => {
          const p = transformProduct(pd);
          return {
            id: p.id, name: p.name, slug: p.slug, price: p.price,
            compareAtPrice: Math.round(p.price * 1.4), currency: p.currency,
            rating: p.rating, image: fallbackImages[i % fallbackImages.length],
            images: p.images, isBestSeller: true,
          };
        }));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <section className="bg-neutral-50 py-16 md:py-24 border-y border-border/60">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <div className="flex items-end justify-between mb-10 md:mb-12">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="block w-6 h-0.5 bg-primary rounded-full" />
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">Bestsellers</p>
            </div>
            <h2 className="font-display font-semibold text-[36px] md:text-[40px] leading-[1.1] tracking-tight text-foreground">
              Best Selling Products
            </h2>
          </div>
          <Link
            href="/collections"
            className="hidden md:flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-primary transition-colors group"
          >
            View all
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform duration-200">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[380px] rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                className="w-full"
                showBestSellerBadge={false}
                showComparePrice={false}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BestSelling;
