import Image from 'next/image';
import Link from 'next/link';

interface ProductHeaderProps {
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  estimatedDelivery: string;
}

const ProductHeader = ({ name, category, rating, reviewCount, estimatedDelivery }: ProductHeaderProps) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[#67748a]">
        <Link href="/" className="hover:text-[#335c99] transition-colors">{category}</Link>
        <span>›</span>
        <span className="text-[#25344d]">{name}</span>
      </nav>
      
      {/* Title */}
      <h1 className="text-2xl lg:text-3xl font-medium text-[#25344d]">{name}</h1>
      
      {/* Delivery & Rating Row */}
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-[#67748a]">
          Estimated Shipping Date: <span className="text-[#25344d] font-medium">{estimatedDelivery}</span>
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Image
              key={star}
              src={star <= rating ? '/icons/Star.svg' : '/icons/starEmpty.svg'}
              alt=""
              width={16}
              height={16}
            />
          ))}
          <span className="text-sm text-[#67748a] ml-1">({reviewCount})</span>
        </div>
      </div>
    </div>
  );
};

export default ProductHeader;

