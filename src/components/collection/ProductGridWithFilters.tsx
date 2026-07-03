'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Product } from '@/types';
import { ProductCard } from '@/components/product';
import type { CatalogSortOption, PaginationMeta } from '@/lib/api';

interface FilterOptions {
  colors: string[];
  patterns: string[];
}

interface ProductGridWithFiltersProps {
  products: Product[];
  filterOptions: FilterOptions;
  categoryName: string;
  preselectedMotorization?: boolean;
  pagination?: PaginationMeta;
  currentSort?: CatalogSortOption;
  basePath?: string;
}

export default function ProductGridWithFilters({
  products,
  preselectedMotorization = false,
  pagination,
  currentSort = 'price-low',
  basePath,
}: ProductGridWithFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activePath = basePath || pathname;

  const page = pagination?.page || 1;
  const total = pagination?.total ?? products.length;
  const totalPages = pagination?.totalPages ?? (total > 0 ? 1 : 0);
  const pageSize = pagination?.limit ?? products.length;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : start + products.length - 1;

  const sortOptions: Array<{ value: CatalogSortOption; label: string }> = useMemo(() => [
    { value: 'best-selling', label: 'Best Selling' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name-az', label: 'Name: A to Z' },
    { value: 'name-za', label: 'Name: Z to A' },
  ], []);

  const navigateWithParams = (nextPage: number, nextSort: CatalogSortOption) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    } else {
      params.delete('page');
    }

    if (nextSort !== 'price-low') {
      params.set('sort', nextSort);
    } else {
      params.delete('sort');
    }

    const queryString = params.toString();
    router.push(queryString ? `${activePath}?${queryString}` : activePath, { scroll: false });
  };

  const handleSortChange = (nextSort: CatalogSortOption) => {
    navigateWithParams(1, nextSort);
  };

  const hasProducts = products.length > 0;

  return (
    <div className="w-full">
      <div className="mb-[32px] flex flex-wrap items-center justify-between gap-[12px]">
        <div className="font-jost text-[14px] font-normal leading-[20px] text-muted">
          {total} product{total !== 1 ? 's' : ''}
        </div>

        <div className="flex items-center gap-[12px]">
          <div className="font-jost text-[14px] font-normal leading-[20px] text-muted">
            Sort by:
          </div>
          <select
            value={currentSort}
            onChange={(event) => handleSortChange(event.target.value as CatalogSortOption)}
            className="h-[36px] w-[180px] rounded-[4.4px] border border-border bg-surface px-[13px] py-[9px] font-jost text-[14px] font-normal leading-[20px] text-foreground shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!hasProducts ? (
        <div className="rounded-[12px] border border-border bg-surface py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft">
            <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="mb-2 font-jost text-[16px] font-medium text-foreground">No products found</h3>
          <p className="font-jost text-[14px] font-normal text-muted">Try adjusting your filters to find what you&apos;re looking for.</p>
        </div>
      ) : (
        <>
          <div className="grid w-full grid-cols-2 gap-x-[24px] gap-y-[24px] md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
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

          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-center md:flex-row">
            <div className="font-jost text-[14px] font-normal text-muted">
              Showing {start}-{end} of {total} products
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateWithParams(page - 1, currentSort)}
                  disabled={!pagination?.hasPreviousPage}
                  className="rounded-[4.4px] border border-border bg-surface px-4 py-2 font-jost text-[14px] font-medium text-foreground transition-colors hover:bg-foreground hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-foreground"
                >
                  Previous
                </button>

                <div className="min-w-[92px] font-jost text-[14px] font-normal text-muted">
                  Page {page} of {totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => navigateWithParams(page + 1, currentSort)}
                  disabled={!pagination?.hasNextPage}
                  className="rounded-[4.4px] border border-border bg-surface px-4 py-2 font-jost text-[14px] font-medium text-foreground transition-colors hover:bg-foreground hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-surface disabled:hover:text-foreground"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
