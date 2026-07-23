'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPriceWithCurrency } from '@/lib/api';
import { isSpecialMotorizedProduct } from '@/lib/electrical-roller';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    tags?: string[];
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
  mobileHorizontal?: boolean;
}

export default function ProductCard({
  product,
  className = '',
  preselectedMotorization = false,
  showBestSellerBadge = true,
  showComparePrice = true,
  mobileHorizontal = false,
}: ProductCardProps) {
  const router = useRouter();
  const imageUrl = product.image || product.images?.[0] || '';
  const currency = product.currency || 'GBP';
  // Matches the "Save 40%" treatment on the product page (ProductPage.tsx), which
  // derives a was-price from a fixed 1.67x multiplier rather than a real compare-at field.
  const compareAtPrice = product.compareAtPrice ?? Math.round(product.price * 1.67);
  const discountPercent = Math.round((1 - product.price / compareAtPrice) * 100);
  const motorizedParam = preselectedMotorization ? '&motorized=true' : '';
  const showMotorizedRemote =
    preselectedMotorization || isSpecialMotorizedProduct(product.tags || []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/product/${product.slug}?customize=true${motorizedParam}`);
  };

  return (
    <Link
      href={`/product/${product.slug}${preselectedMotorization ? '?motorized=true' : ''}`}
      className={`group relative flex overflow-hidden rounded-xl bg-white border border-border transition-all duration-300 md:hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)] md:hover:-translate-y-0.5 ${
        mobileHorizontal ? 'flex-row items-stretch md:flex-col' : 'flex-col'
      } ${className}`}
    >
      {/* Image */}
      <div
        className={`relative shrink-0 overflow-hidden bg-neutral-50 ${
          mobileHorizontal
            ? 'h-auto w-[120px] aspect-square md:h-[300px] md:w-full md:aspect-auto'
            : 'h-[260px] md:h-[300px] w-full'
        }`}
      >
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 md:group-hover:scale-[1.04]"
        />
        {showMotorizedRemote && (
          <div className="pointer-events-none absolute bottom-0 right-0 z-10">
            <Image
              src="/motorized_remote.webp"
              alt="Motorized remote"
              width={88}
              height={88}
              className={`h-auto object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.16)] ${
                mobileHorizontal ? 'w-[52px] md:w-[140px]' : 'w-[100px] md:w-[140px]'
              }`}
            />
          </div>
        )}
        {/* Best Seller badge */}
        {showBestSellerBadge && product.isBestSeller && (
          <div
            className={`absolute bg-primary text-white font-semibold tracking-wide uppercase rounded-full ${
              mobileHorizontal
                ? 'top-1.5 left-1.5 text-[8px] px-1.5 py-0.5 md:top-3 md:left-3 md:text-[10px] md:px-2.5 md:py-1'
                : 'top-3 left-3 text-[10px] px-2.5 py-1'
            }`}
          >
            Best Seller
          </div>
        )}
        {/* Hover CTA (desktop only when mobileHorizontal) */}
        <div
          className={`absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out ${
            mobileHorizontal ? 'hidden md:block' : ''
          }`}
        >
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
      <div className={`flex flex-col gap-1.5 min-w-0 ${mobileHorizontal ? 'p-3 md:p-4' : 'p-4'}`}>
        <h3
          className={`font-jost font-medium text-foreground ${
            mobileHorizontal ? 'text-[13.5px] md:text-[14.5px] line-clamp-2 md:truncate' : 'text-[14.5px] truncate'
          }`}
        >
          {product.name}
        </h3>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="font-jost font-semibold text-[16px] text-foreground">
            {formatPriceWithCurrency(product.price, currency)}
          </span>
          {showComparePrice && (
            <span className="font-jost text-[13px] text-muted line-through">
              {formatPriceWithCurrency(compareAtPrice, currency)}
            </span>
          )}
          {showComparePrice && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
              Save {discountPercent}%
            </span>
          )}
        </div>
        {mobileHorizontal && (
          <button
            onClick={handleAddToCart}
            className="mt-1 md:hidden self-start rounded-full bg-primary text-white font-jost text-[11px] font-semibold px-3 py-1.5 hover:bg-primary-dark transition-colors"
          >
            Customize &amp; Buy
          </button>
        )}
      </div>
    </Link>
  );
}
