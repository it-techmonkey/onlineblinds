'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPriceWithCurrency } from '@/lib/api';

interface ProductCardProps {
  product: {
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
  };
  className?: string;
  preselectedMotorization?: boolean;
  showBestSellerBadge?: boolean;
  showComparePrice?: boolean;
}

export default function ProductCard({
  product,
  className = '',
  preselectedMotorization = false,
  showBestSellerBadge = true,
  showComparePrice = true,
}: ProductCardProps) {
  const router = useRouter();
  const imageUrl = product.image || product.images?.[0] || '';
  const currency = product.currency || 'USD';
  const motorizedParam = preselectedMotorization ? '&motorized=true' : '';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/product/${product.slug}?customize=true${motorizedParam}`);
  };

  return (
    <Link
      href={`/product/${product.slug}${preselectedMotorization ? '?motorized=true' : ''}`}
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-white border border-border transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)] hover:-translate-y-0.5 ${className}`}
    >
      {/* Image */}
      <div className="relative h-[260px] md:h-[300px] w-full overflow-hidden bg-neutral-50">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {/* Best Seller badge */}
        {showBestSellerBadge && product.isBestSeller && (
          <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full">
            Best Seller
          </div>
        )}
        {/* Hover CTA */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleAddToCart}
            className="w-full bg-foreground/90 backdrop-blur-sm text-white font-jost text-[13px] font-semibold py-3 hover:bg-foreground transition-colors flex items-center justify-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M5.33 14.67a.67.67 0 100-1.34.67.67 0 000 1.34zM12.67 14.67a.67.67 0 100-1.34.67.67 0 000 1.34zM1.37 1.37H2.7l1.77 8.28c.065.303.234.574.477.766.244.193.547.294.857.304h6.52c.303 0 .598-.104.834-.294.237-.19.4-.455.465-.752l1.1-4.953H3.41" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Customize &amp; Buy
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 p-4">
        <h3 className="font-jost font-medium text-[14.5px] text-foreground truncate">{product.name}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="font-jost font-semibold text-[16px] text-foreground">
            {formatPriceWithCurrency(product.price, currency)}
          </span>
          {showComparePrice && product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="font-jost text-[13px] text-muted line-through">
              {formatPriceWithCurrency(product.compareAtPrice, currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
