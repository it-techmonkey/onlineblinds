import { Header, Footer, FAQ } from '@/components';
import { fetchProducts, transformProduct, extractFilterOptions } from '@/lib/api';
import CategoryHero from '@/components/collection/CategoryHero';
import ProductGridWithFilters from '@/components/collection/ProductGridWithFilters';
import { Product } from '@/types';

export const metadata = {
  title: 'All Products | Online Blinds',
  description: 'Browse our complete range of premium window blinds. Find the perfect blinds for your home.',
};

export default async function CollectionsPage() {
  let products: Product[] = [];
  let filterOptions: { colors: string[]; patterns: string[] } = { colors: [], patterns: [] };
  
  try {
    const response = await fetchProducts({ limit: 500 });
    const apiProducts = response.data;
    products = apiProducts.map(transformProduct);
    filterOptions = extractFilterOptions(apiProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <CategoryHero
          title="All Products"
          description="Explore our complete range of premium window blinds. From vertical to roller, find the perfect style to complement your space."
          productCount={products.length}
        />

        <div className="px-4 md:px-6 lg:px-20 py-8 md:py-12">
          <div className="max-w-[1400px] mx-auto">
            <ProductGridWithFilters
              products={products}
              filterOptions={filterOptions}
              categoryName="All Products"
            />
          </div>
        </div>
        <FAQ />
      </main>

      <Footer />
    </div>
  );
}

