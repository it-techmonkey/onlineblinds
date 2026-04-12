'use client';

import { ProductReview } from '@/types';

interface ProductReviewsProps {
  reviews: ProductReview[];
  averageRating: number;
  totalReviews: number;
}

const ProductReviews = ({ reviews, averageRating, totalReviews }: ProductReviewsProps) => {
  // Calculate rating distribution
  const ratingCounts = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length
  }));
  
  const maxCount = Math.max(...ratingCounts.map(r => r.count), 1);

  return (
    <div className="flex flex-col gap-5 md:gap-7">
      {/* Reviews Overview */}
      <div className="bg-white rounded-lg px-3 md:px-4 py-4 md:py-5 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 md:gap-0">
          {/* Left side - Rating summary and bars */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 lg:gap-16">
            {/* Rating Summary */}
            <div className="flex flex-col gap-3 md:gap-4">
              <h3 className="text-lg md:text-xl font-medium text-[#1f2a44]">Reviews</h3>
              <div className="flex flex-col gap-1">
                <span className="text-2xl md:text-[32px] font-bold text-black leading-tight md:leading-[34px]">{averageRating.toFixed(1)}</span>
                <span className="text-xs font-medium text-[#858585]">({totalReviews} Reviews)</span>
              </div>
            </div>

            {/* Rating Bars */}
            <div className="flex items-center gap-2">
              {/* Labels */}
              <div className="flex flex-col gap-[7px] items-end">
                {['5 stars', '4 stars', '3 stars', '2 stars', '1 star'].map((label) => (
                  <span key={label} className="text-[10px] font-medium text-black whitespace-nowrap">{label}</span>
                ))}
              </div>
              
              {/* Bars */}
              <div className="flex flex-col gap-4 relative">
                {ratingCounts.map(({ rating, count }) => (
                  <div key={rating} className="relative">
                    <div className="w-[120px] sm:w-[180px] lg:w-[351px] h-1.5 bg-[#f2f6fb] rounded-lg" />
                    <div
                      className="absolute top-0 left-0 h-1.5 bg-[#e7b66b] rounded-lg"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                ))}
              </div>

              {/* Counts */}
              <div className="flex flex-col gap-1 items-start">
                {ratingCounts.map(({ rating, count }) => (
                  <span
                    key={rating}
                    className={`text-[10px] font-medium leading-[18px] ${count > 0 ? 'text-[#1f2a44]' : 'text-[#858585]'}`}
                  >
                    {count}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Review Button */}
          <button className="w-full sm:w-auto bg-black text-white text-sm font-medium px-3 py-2.5 md:py-3 hover:bg-gray-800 transition-colors">
            Review this Product
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white p-3">
        {reviews.map((review, index) => (
          <div key={review.id}>
            <div className="flex flex-col gap-3 py-3">
              {/* Date */}
              <span className="text-xs font-medium text-[#858585] leading-5">{review.date}</span>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#f2f6fb] flex items-center justify-center">
                  <span className="text-sm font-medium text-[#5465ff]">
                    {review.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                </div>
                <span className="text-sm font-medium text-[#1f2a44]">{review.author}</span>
              </div>
              
              {/* Review Text */}
              <p className="text-sm text-[#1f2a44] leading-[18px]">{review.content}</p>
            </div>
            
            {/* Divider - not on last item */}
            {index < reviews.length - 1 && (
              <div className="h-0.5 w-full bg-[#f8f5ef]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;

