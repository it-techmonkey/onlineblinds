'use client';

import Image from 'next/image';

export const ProductRechargeSection = () => {
    return (
        <section className="bg-white py-16 md:py-24 px-4 md:px-6 lg:px-20">
            <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16 lg:gap-24">

                {/* Text Content - Left */}
                <div className="w-full md:w-1/2 text-center md:text-center space-y-6">
                    <h2 className="text-3xl md:text-3xl lg:text-4xl font-bold text-black">
                        Recharge Anytime
                    </h2>
                    <div className="space-y-6 text-gray-600 text-sm md:text-base leading-relaxed max-w-lg mx-auto md:mx-0 lg:mx-auto">
                        <p>
                            <span className="font-bold text-gray-800">At any time of day.</span> Our blackout blinds were built to mimic total darkness in your space so you can <span className="font-bold text-gray-800">rest deeply</span> whenever you want.
                        </p>
                        <p>
                            Lightweight and easy to handle, these blinds offer a quick, <span className="font-bold text-gray-800">hassle-free</span> solution to block light and add privacy without any mess or stress.
                        </p>
                    </div>
                </div>

                {/* Image Content - Right */}
                <div className="w-full md:w-1/2">
                    <div className="relative aspect-[16/9] md:aspect-[4/3] w-full rounded-2xl overflow-hidden shadow-lg">
                        <Image
                            src="/products/eclipseCore/eclipseCore4.webp"
                            alt="Total darkness recharge anytime"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>

            </div>
        </section>
    );
};
