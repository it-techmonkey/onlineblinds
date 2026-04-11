'use client';

import { useEffect, useState } from 'react';
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
  "/home/products/vertical-blinds-1.jpg"
];

const BestSelling = () => {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetchProducts({ limit: 8 });
        const mappedProducts = response.data.slice(0, 8).map((productData, index) => {
          const product = transformProduct(productData);
          return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            compareAtPrice: Math.round(product.price * 1.4),
            currency: product.currency,
            rating: product.rating,
            image: fallbackImages[index % fallbackImages.length], // Use fallback design images
            images: product.images,
            isBestSeller: true,
          };
        });
        setProducts(mappedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <section className="bg-background py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col gap-2 mb-10 w-full">
          <h2 className="font-display font-semibold text-[36px] leading-[40px] text-foreground">
            Best Selling Products
          </h2>
          <p className="font-jost font-normal text-[16px] leading-[24px] text-muted">
            Our most popular window coverings
          </p>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-[400px] w-full animate-pulse rounded-[12px] bg-surface-soft" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product}
                className="w-full"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BestSelling;

