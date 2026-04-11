'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Header, Footer } from '@/components';
import { transformProduct, extractFilterOptions, fetchProducts } from '@/lib/api';
import { Product } from '@/types';
import CategoryHero from '@/components/collection/CategoryHero';
import ProductGridWithFilters from '@/components/collection/ProductGridWithFilters';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ colors: string[]; patterns: string[] }>({ colors: [], patterns: [] });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setProducts([]);
        setFilterOptions({ colors: [], patterns: [] });
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Use the fetchProducts function which properly handles URL construction
        const response = await fetchProducts({
          limit: 500,
          search: query,
        });
        
        const apiProducts = response.data || [];
        const transformedProducts = apiProducts.map(transformProduct);
        setProducts(transformedProducts);
        setFilterOptions(extractFilterOptions(apiProducts));
      } catch (error) {
        console.error('Error searching products:', error);
        setProducts([]);
        setFilterOptions({ colors: [], patterns: [] });
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <div className="border-b border-border bg-surface">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-20 py-6 md:py-8">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search for blinds, colors, styles..."
                  className="flex-1 rounded-md border border-border px-4 py-3 text-base text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-[rgba(68,87,102,0.12)]"
                />
                <button
                  type="submit"
                  className="rounded-md bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {query && (
          <>
            <CategoryHero
              title={`Search Results for "${query}"`}
              description={loading ? 'Searching...' : `Found ${products.length} product${products.length !== 1 ? 's' : ''}`}
              productCount={products.length}
            />

            <div className="px-4 md:px-6 lg:px-20 py-8 md:py-12">
              <div className="max-w-[1400px] mx-auto">
                {loading ? (
                  <div className="text-center py-16">
                    <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="mt-4 text-muted">Searching products...</p>
                  </div>
                ) : products.length > 0 ? (
                  <ProductGridWithFilters
                    products={products}
                    filterOptions={filterOptions}
                    categoryName={`Search: ${query}`}
                  />
                ) : (
                  <div className="rounded-lg border border-border bg-surface py-16 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft">
                      <svg className="h-8 w-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">No products found</h3>
                    <p className="mb-4 text-muted">Try searching with different keywords or browse our collections.</p>
                    <Link
                      href="/collections"
                      className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
                    >
                      Browse All Products
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!query && (
          <div className="px-4 md:px-6 lg:px-20 py-16">
            <div className="max-w-[1400px] mx-auto text-center">
              <h2 className="mb-4 text-2xl font-semibold text-foreground">Search Products</h2>
              <p className="mb-8 text-muted">Enter a search term above to find the perfect blinds for your home.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <Link href="/collections/vertical-blinds" className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary">
                  <p className="text-sm font-medium text-foreground">Vertical Blinds</p>
                </Link>
                <Link href="/collections/roller-blinds" className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary">
                  <p className="text-sm font-medium text-foreground">Roller Blinds</p>
                </Link>
                <Link href="/collections/roman-blinds" className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary">
                  <p className="text-sm font-medium text-foreground">Roman Blinds</p>
                </Link>
                <Link href="/collections" className="rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary">
                  <p className="text-sm font-medium text-foreground">All Products</p>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted">Loading...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}


