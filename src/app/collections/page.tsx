import { Header, Footer, FAQ } from '@/components';
import { fetchProducts, transformProduct, extractFilterOptions, CatalogSortOption, PaginationMeta } from '@/lib/api';
import CategoryHero from '@/components/collection/CategoryHero';
import ProductGridWithFilters from '@/components/collection/ProductGridWithFilters';
import CollectionViewTracker from '@/components/analytics/CollectionViewTracker';
import { Product } from '@/types';

export const metadata = {
  title: 'All Products | Online Blinds',
  description: 'Browse our complete range of premium window blinds. Find the perfect blinds for your home.',
};

export const revalidate = 3_600;

interface CollectionsPageProps {
  searchParams?: Promise<{ page?: string; sort?: string }>;
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const resolvedSearchParams = await (searchParams ?? Promise.resolve({} as { page?: string; sort?: string }));
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  const sortBy = (resolvedSearchParams.sort as CatalogSortOption) || 'best-selling';
  const pageSize = 24;
  let products: Product[] = [];
  let filterOptions: { colors: string[]; patterns: string[] } = { colors: [], patterns: [] };
  let pagination: PaginationMeta = {
    page,
    limit: pageSize,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  };
  
  try {
    const response = await fetchProducts({ page, limit: pageSize, sortBy });
    const apiProducts = response.data;
    products = apiProducts.map(transformProduct);
    filterOptions = extractFilterOptions(apiProducts);
    if (response.pagination) {
      pagination = response.pagination;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <CollectionViewTracker collectionId="gid://shopify/Collection/all" collectionHandle="all" />
        <CategoryHero
          title="All Products"
          description="Explore our complete range of premium window blinds. From vertical to roller, find the perfect style to complement your space."
          productCount={pagination.total}
        />

        <div className="px-4 md:px-6 lg:px-20 py-8 md:py-12">
          <div className="max-w-[1400px] mx-auto">
            <ProductGridWithFilters
              products={products}
              filterOptions={filterOptions}
              categoryName="All Products"
              pagination={pagination}
              currentSort={sortBy}
              basePath="/collections"
            />
          </div>
        </div>
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
