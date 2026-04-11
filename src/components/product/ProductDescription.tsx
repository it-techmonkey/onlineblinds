'use client';

import { useState } from 'react';

interface ProductDescriptionProps {
  description: string;
}

const ProductDescription = ({ description }: ProductDescriptionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shortDescription = description.slice(0, 200);
  const needsExpansion = description.length > 200;

  return (
    <div className="flex flex-col gap-4 border-t border-[#d9dfeb] pt-6">
      <h3 className="text-base font-medium text-[#25344d]">Product Details</h3>
      <p className="text-sm text-[#4b5a73] leading-relaxed">
        {isExpanded || !needsExpansion ? description : `${shortDescription}...`}
      </p>
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-[#335c99] font-medium hover:underline self-start"
        >
          {isExpanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

export default ProductDescription;

