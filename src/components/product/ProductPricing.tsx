'use client';

interface ProductPricingProps {
  price: number;
  additionalCost: number;
}

const ProductPricing = ({ price, additionalCost }: ProductPricingProps) => {
  const totalPrice = price + additionalCost;

  return (
    <div className="flex flex-col gap-3 bg-[#f8f5ef] p-4 rounded">
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-[#25344d]">$ {totalPrice.toFixed(0)}</span>
      </div>
      
      <button className="w-full bg-[#335c99] text-white py-3 rounded text-base font-medium hover:bg-[#26497d] transition-colors">
        Customize and Buy
      </button>
    </div>
  );
};

export default ProductPricing;

