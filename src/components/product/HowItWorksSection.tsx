'use client';

import Image from 'next/image';

const steps = [
    {
        step: 'Step 1.',
        image: '/products/eclipseCore/howitworks-1.jpg',
        description: "This couldn't be easier, Simply click the frame together. Then assemble each side of the frame.",
    },
    {
        step: 'Step 2.',
        image: '/products/eclipseCore/howitworks-2.webp',
        description: 'Then remove the wrapping from the sealment foam, and simply apply foam on the frame.',
    },
    {
        step: 'Step 3.',
        image: '/products/eclipseCore/howitworks-3.webp',
        description: 'Fit the blinds in the window and make sure all edges fit snug so no light seeps through.',
    },
    {
        step: 'Step 4.',
        image: '/products/eclipseCore/howitworks-4.webp',
        description: 'Use screws if needed holes on sides for extra security and stability of the frame installation.',
    },
    {
        step: 'Step 5.',
        image: '/products/eclipseCore/howitworks-5.webp',
        description: 'Easy tension blind - pull clip up and reclose once the right blind tension is found for optimal performance.',
    },
    {
        step: 'Step 6.',
        image: '/products/eclipseCore/howitworks-6.webp',
        description: 'And now grab the handle installed on the blinds, and pull gently down till room is fully 100% black.',
    },
];

export const HowItWorksSection = () => {
    return (
        <section className="bg-white py-16 md:py-24 px-4 md:px-6 lg:px-20 text-black">
            <div className="max-w-[1400px] mx-auto text-center">
                <h2 className="text-3xl md:text-3xl font-bold mb-16 uppercase tracking-wide">HOW IT WORKS?</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                    {steps.map((item, index) => (
                        <div key={index} className="flex flex-col items-center">
                            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 shadow-md hover:shadow-xl transition-shadow duration-300">
                                <Image
                                    src={item.image}
                                    alt={item.step}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <h3 className="text-lg font-bold mb-3">{item.step}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
