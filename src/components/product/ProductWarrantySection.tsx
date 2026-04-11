'use client';

import React from 'react';

export const ProductWarrantySection = () => {
    return (
        <section className="relative bg-[#22385d] py-16 md:py-24 pb-20 md:pb-28 px-4 md:px-6 lg:px-20 text-white text-center">
            <div className="max-w-[1400px] mx-auto space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white">5 Years Warranty Guarantee</h2>
                <p className="text-gray-300 leading-relaxed text-sm md:text-base font-medium max-w-[1000px] mx-auto">
                    We take customer satisfaction to a new standard, and that all begins with our customer experience. We offer all of our customers a 5 - Year WARRANTY GUARANTEE for any issues with our product that you purchase
                </p>
            </div>

            {/* Animated Wave Border */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                <svg
                    className="relative block w-[calc(100%+1.3px)] h-[24px] md:h-[40px]"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox="0 24 150 28"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
                    </defs>
                    <g className="parallax">
                        <use xlinkHref="#gentle-wave" x="48" y="0" fill="rgba(255,255,255,0.7)" className="animate-[move-forever_12s_cubic-bezier(0.55,0.5,0.45,0.5)_infinite]" />
                        <use xlinkHref="#gentle-wave" x="48" y="3" fill="rgba(255,255,255,0.5)" className="animate-[move-forever_12s_cubic-bezier(0.55,0.5,0.45,0.5)_infinite_delay-[-2s]]" />
                        <use xlinkHref="#gentle-wave" x="48" y="5" fill="rgba(255,255,255,0.3)" className="animate-[move-forever_12s_cubic-bezier(0.55,0.5,0.45,0.5)_infinite_delay-[-4s]]" />
                        <use xlinkHref="#gentle-wave" x="48" y="7" fill="#fff" className="animate-[move-forever_12s_cubic-bezier(0.55,0.5,0.45,0.5)_infinite_delay-[-5s]]" />
                    </g>
                </svg>
                <style jsx>{`
                  @keyframes move-forever {
                    0% {
                      transform: translate3d(-90px, 0, 0);
                    }
                    100% {
                      transform: translate3d(85px, 0, 0);
                    }
                  }
                `}</style>
            </div>
        </section>
    );
};

