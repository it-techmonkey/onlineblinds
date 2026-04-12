'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { formatPriceWithCurrency } from '@/lib/api';

interface RelatedProductsProps {
  products: Product[];
}

const RelatedProducts = ({ products }: RelatedProductsProps) => {
  if (products.length === 0) return null;

  return (
    <section className="py-8 md:py-12">
      <div className="rounded-[16px] border border-[#d9dfeb] bg-white p-5 md:p-8">
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#67748a] mb-2">Recommended</p>
            <h2 className="text-2xl md:text-3xl leading-[1.1] font-semibold text-[#1f2a44]">
              Related Products
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {products.map((product) => (
            <article key={product.id} className="rounded-[12px] border border-[#d9dfeb] bg-white overflow-hidden hover:shadow-[0_6px_16px_rgba(31,42,68,0.06)] transition-shadow">
            {/* Product Image */}
            <Link href={`/product/${product.slug}`} className="group block">
              <div className="relative aspect-[4/5] md:h-[291px] bg-[#eef2f8] overflow-hidden">
                <Image
                  src={product.images[0] || '/home/products/vertical-blinds-1.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
            </Link>

            {/* Product Info */}
            <div className="bg-white p-3 md:p-4 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Link href={`/product/${product.slug}`}>
                  <h3 className="text-sm md:text-base font-medium text-[#1f2a44] capitalize line-clamp-2 leading-snug hover:text-[#335c99] transition-colors">{product.name}</h3>
                </Link>
                <div className="flex items-end gap-2">
                  <span className="text-base md:text-xl font-semibold text-[#1f2a44]">
                    {formatPriceWithCurrency(product.price, product.currency)}
                  </span>
                </div>
              </div>

              {/* Add to Cart Button - Hidden on mobile */}
              <button 
                onClick={(e) => e.stopPropagation()}
                className="hidden md:inline-flex items-center justify-center px-3 py-2.5 border border-[#c4d0e4] bg-white text-sm font-medium text-[#596783] hover:border-[#335c99] hover:text-[#335c99] hover:bg-[#eef2f8] rounded-[8px] transition-colors whitespace-nowrap"
              >
                Add to Cart
              </button>
            </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;
