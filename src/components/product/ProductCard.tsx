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
    currency?: string;
    rating: number;
    image?: string;
    images?: string[];
  };
  className?: string;
  preselectedMotorization?: boolean;
}

export default function ProductCard({ product, className = '', preselectedMotorization = false }: ProductCardProps) {
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
      className={`group relative flex flex-col overflow-hidden rounded-[12px] border border-border bg-surface p-[1px] transition-shadow hover:shadow-[0_16px_30px_rgba(31,41,51,0.08)] ${className}`}
    >
      <div className="relative z-[2] h-[280px] w-full overflow-hidden rounded-[11px] rounded-b-none bg-surface-soft md:h-[384px]">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
      </div>

      <div className="flex flex-col gap-2 p-4 w-full z-[1]">
        <h3 className="font-jost w-full truncate text-[16px] leading-[24px] font-medium text-foreground">
          {product.name}
        </h3>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="font-jost text-[18px] leading-[28px] font-semibold text-foreground">
              {formatPriceWithCurrency(product.price, currency)}
            </span>
          </div>
          
          {/* Add Button */}
          <button 
            onClick={handleAddToCart}
            className="group/btn flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-foreground shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] transition-colors hover:border-primary hover:bg-primary hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5.33329 14.6667C5.70148 14.6667 5.99996 14.3682 5.99996 14C5.99996 13.6319 5.70148 13.3334 5.33329 13.3334C4.9651 13.3334 4.66663 13.6319 4.66663 14C4.66663 14.3682 4.9651 14.6667 5.33329 14.6667Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12.6667 14.6667C13.0349 14.6667 13.3333 14.3682 13.3333 14C13.3333 13.6319 13.0349 13.3334 12.6667 13.3334C12.2985 13.3334 12 13.6319 12 14C12 14.3682 12.2985 14.6667 12.6667 14.6667Z" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.3667 1.3667H2.70003L4.47337 9.6467C4.53842 9.94994 4.70715 10.221 4.95051 10.4133C5.19387 10.6055 5.49664 10.7069 5.8067 10.7H12.3267C12.6301 10.6995 12.9244 10.5956 13.1607 10.4053C13.3971 10.215 13.5615 9.94972 13.6267 9.65337L14.7267 4.70003H3.41337" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
