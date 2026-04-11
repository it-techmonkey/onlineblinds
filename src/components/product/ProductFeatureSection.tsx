'use client';

import Image from 'next/image';

export const ProductFeatureSection = () => {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <section className="bg-white py-12 md:py-20 px-4 md:px-6 lg:px-20">
            <div className="max-w-[1400px] mx-auto flex flex-col gap-16 md:gap-24">
                {/* Block 1: Text Left, Video Right */}
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-20">
                    <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#000] mb-4">
                            The Solution to your lack of sleep
                        </h2>
                        <p className="text-lg text-gray-700 font-medium mb-6">
                            Struggling to sleep with sunlight in your room?
                        </p>
                        <p className="text-gray-600 mb-8 leading-relaxed max-w-lg">
                            Our honeycomb blackout blinds not only blocks 100% of light but also helps insulate your room, keeping it cool and quiet. Perfect for a restful, dark environment!
                        </p>
                        <button
                            onClick={scrollToTop}
                            className="bg-black text-white px-8 py-3 rounded hover:bg-gray-800 transition-colors font-medium text-sm tracking-wide"
                        >
                            Get Instant Price
                        </button>
                    </div>
                    <div className="w-full md:w-1/2">
                        <div className="relative aspect-square md:aspect-[4/3] w-full rounded-lg overflow-hidden bg-gray-100 shadow-md">
                            <video
                                src="/products/eclipseCore/eclipseCore1.mp4"
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                            />
                        </div>
                    </div>
                </div>

                {/* Block 2: Image Left, Text Right */}
                <div className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12 lg:gap-20">
                    <div className="w-full md:w-1/2">
                        <div className="relative aspect-square md:aspect-[4/3] w-full rounded-lg overflow-hidden bg-gray-100 shadow-md">
                            <Image
                                src="/products/eclipseCore/eclipseCore2.webp"
                                alt="Easy Fit blinds design details"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold text-[#000] mb-6">
                            1st Ever Easy Fit blinds design
                        </h2>
                        <p className="text-gray-600 leading-relaxed max-w-lg">
                            The very first blinds that requires minimal assembly. With no need for DIY expertise you can install them damage-free in just 4 simple steps.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
