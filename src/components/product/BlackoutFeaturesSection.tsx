'use client';

const features = [
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        ),
        title: 'Total Blackout Fabric',
        description: 'Enjoy complete darkness anytime with total blackout fabric that blocks all external light.',
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: 'Cordless Safety Design',
        description: 'Designed with safety in mind, featuring a sleek cordless system with no cords or chains.',
    },
    {
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        title: 'Energy-Efficient Thermal Fabric',
        description: 'Thermal pleated fabric helps keep rooms cooler in summer and warmer in winter.',
    },
];

export const BlackoutFeaturesSection = () => {
    return (
        <section className="bg-white py-12 md:py-16 px-4 md:px-6 lg:px-20">
            <div className="max-w-350 mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                {features.map((feature) => (
                    <div
                        key={feature.title}
                        className="rounded-2xl border border-border bg-white p-5 md:p-6 shadow-[0_2px_12px_rgba(15,23,42,0.03)]"
                    >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary">
                            {feature.icon}
                        </div>
                        <p className="mb-1.5 text-sm font-semibold text-foreground md:text-base">{feature.title}</p>
                        <p className="text-xs leading-relaxed text-muted md:text-sm">{feature.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};
