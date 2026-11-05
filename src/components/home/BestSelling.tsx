import BestSellerHeading from './BestSellerHeading';
import { ProductCard } from '@/components/product';
import { fetchProductsByCategoryPage, transformProduct } from '@/lib/api';

const BEST_SELLERS_COLLECTION_HANDLE = 'best-sellers';

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

async function getBestSellers(): Promise<ProductCardData[]> {
  try {
    const response = await fetchProductsByCategoryPage({
      categorySlug: BEST_SELLERS_COLLECTION_HANDLE,
      limit: 8,
      sortBy: 'best-selling',
    });
    return response.data.slice(0, 8).map((pd) => {
      const p = transformProduct(pd);
      return {
        id: p.id, name: p.name, slug: p.slug, price: p.price,
        currency: p.currency,
        rating: p.rating, image: p.images[0],
        images: p.images, isBestSeller: true,
      };
    });
  } catch (e) {
    console.error('Failed to load best sellers:', e);
    return [];
  }
}

const BestSelling = async () => {
  const products = await getBestSellers();

  // If pricing came back broken (any £0), don't render a section full of £0
  // cards — hide it rather than showing wrong prices. A real product is never £0.
  const allPriced = products.length > 0 && products.every((p) => p.price > 0);
  if (!allPriced) {
    return null;
  }

  return (
    <section id="black-friday-bestsellers" className="scroll-mt-24 bg-neutral-50 py-16 md:py-24 border-y border-border/60">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8">
        <BestSellerHeading />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              className="w-full"
              showBestSellerBadge={false}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSelling;
