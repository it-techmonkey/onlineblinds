'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/types';
import { ProductCard } from '@/components/product';

interface FilterOptions {
  colors: string[];
  patterns: string[];
}

interface ProductGridWithFiltersProps {
  products: Product[];
  filterOptions: FilterOptions;
  categoryName: string;
  preselectedMotorization?: boolean;
}

type SortOption = 'best-selling' | 'price-low' | 'price-high' | 'name-az' | 'name-za';

export default function ProductGridWithFilters({ 
  products, 
  preselectedMotorization = false,
}: ProductGridWithFiltersProps) {
  // Filter state
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('best-selling');
  const [visibleCount, setVisibleCount] = useState(24);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by colors (check product name for color keywords)
    if (selectedColors.length > 0) {
      result = result.filter((product) => {
        const productName = product.name.toLowerCase();
        return selectedColors.some((color) => productName.includes(color));
      });
    }

    // Filter by patterns (check product name for pattern keywords)
    if (selectedPatterns.length > 0) {
      result = result.filter((product) => {
        const productName = product.name.toLowerCase();
        return selectedPatterns.some((pattern) => productName.includes(pattern));
      });
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // best-selling - keep original order
        break;
    }

    return result;
  }, [products, selectedColors, selectedPatterns, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const clearAllFilters = () => {
    setSelectedColors([]);
    setSelectedPatterns([]);
    setVisibleCount(24);
  };

  const hasActiveFilters = selectedColors.length > 0 || selectedPatterns.length > 0;

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-[12px] mb-[32px]">
        {/* Product Count */}
        <div>
          <div className="font-jost text-[14px] font-normal text-muted leading-[20px]">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="flex gap-[12px] items-center">
          <div className="font-jost text-[14px] font-normal text-muted leading-[20px]">
            Sort by:
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-[36px] w-[180px] rounded-[4.4px] border border-border bg-surface px-[13px] py-[9px] font-jost text-[14px] leading-[20px] font-normal text-foreground shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
          >
            <option value="best-selling">Best Selling</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-az">Name: A to Z</option>
            <option value="name-za">Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {displayedProducts.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-surface py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft">
            <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="mb-2 font-jost text-[16px] font-medium text-foreground">No products found</h3>
          <p className="mb-4 font-jost text-[14px] font-normal text-muted">Try adjusting your filters to find what you&apos;re looking for.</p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="rounded-[4.4px] bg-primary px-4 py-2 font-jost text-[14px] font-medium text-white hover:bg-primary-dark"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="gap-x-[24px] gap-y-[24px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 w-full">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  image: product.images[0],
                }}
                preselectedMotorization={preselectedMotorization}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-8 mt-8">
              <button
                onClick={() => setVisibleCount((prev) => prev + 24)}
                className="rounded-[4.4px] border border-border bg-surface px-8 py-3 font-jost text-[14px] font-medium text-foreground transition-colors hover:bg-foreground hover:text-white"
              >
                Load More Products
              </button>
            </div>
          )}

          {/* Results Info */}
          <div className="mt-4 text-center font-jost text-[14px] font-normal text-muted">
            Showing {displayedProducts.length} of {filteredProducts.length} products
          </div>
        </>
      )}
    </div>
  );
}

