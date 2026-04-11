'use client';

interface StickyBottomBarProps {
  price: number;
  additionalCost: number;
  onBuyClick: () => void;
}

const StickyBottomBar = ({ price, additionalCost, onBuyClick }: StickyBottomBarProps) => {
  const totalPrice = price + additionalCost;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#d9dfeb] px-6 py-4 z-40 lg:hidden">
      <div className="flex items-center justify-between max-w-[1200px] mx-auto">
        <div className="flex flex-col">
          <span className="text-xs text-[#67748a]">Price</span>
          <span className="text-xl font-bold text-[#25344d]">${totalPrice.toFixed(0)}</span>
        </div>
        <button
          onClick={onBuyClick}
          className="bg-[#335c99] text-white px-8 py-3 rounded text-base font-medium hover:bg-[#26497d] transition-colors"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default StickyBottomBar;

