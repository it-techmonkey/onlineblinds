import Image from 'next/image';

const features = [
  { 
    id: 1, 
    title: 'First in your Letterbox', 
    description: 'Samples are posted directly through your letterbox — no waiting required.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.6667 4.16666H3.33333C2.41286 4.16666 1.66667 4.91285 1.66667 5.83332V14.1667C1.66667 15.0871 2.41286 15.8333 3.33333 15.8333H16.6667C17.5871 15.8333 18.3333 15.0871 18.3333 14.1667V5.83332C18.3333 4.91285 17.5871 4.16666 16.6667 4.16666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18.3333 5.83334L10 10.8333L1.66667 5.83334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    id: 2, 
    title: 'Available on Selected Products', 
    description: 'Free samples are offered on specific fabric ranges. Look for the sample option on eligible product pages.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15.8333 4.16666H4.16667C3.24619 4.16666 2.5 4.91285 2.5 5.83332V15.8333C2.5 16.2936 2.87276 16.6667 3.33333 16.6667H16.6667C17.1272 16.6667 17.5 16.2936 17.5 15.8333V5.83332C17.5 4.91285 16.7538 4.16666 15.8333 4.16666Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.3333 4.16666V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.66667 4.16666V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.5 8.33334H17.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  { 
    id: 3, 
    title: 'Find Your Perfect Match', 
    description: 'See how our fabrics and colours look in your own home before placing your order.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 18.3333C14.6023 18.3333 18.3333 14.6024 18.3333 10.0001C18.3333 5.39775 14.6023 1.66675 10 1.66675C5.39762 1.66675 1.66666 5.39775 1.66666 10.0001C1.66666 14.6024 5.39762 18.3333 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 5.00008V10.0001L13.3333 11.6667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
];

const FreeSamples = () => {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-12 items-center">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:gap-8 items-start w-full order-2 lg:order-1">
          <div className="flex flex-col items-start w-full">
            <h2 className="mb-2 font-display text-[36px] leading-[40px] font-semibold text-foreground">
              Fast, Free Samples
            </h2>
            <p className="font-jost text-[16px] leading-[26px] font-normal text-muted">
              Want to feel the quality before you buy? Order up to 10 FREE fabric samples for selected products — delivered straight to your door at absolutely no cost.
            </p>
          </div>
          
          <div className="flex flex-col gap-6 items-start w-full py-6">
            {features.map((feature) => (
              <div key={feature.id} className="flex gap-4 items-start w-full">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-soft text-primary">
                  {feature.icon}
                </div>
                <div className="flex flex-col gap-1 items-start">
                  <h3 className="font-jost text-[16px] leading-[24px] font-medium text-foreground">
                    {feature.title}
                  </h3>
                  <p className="font-jost text-[14px] leading-[22.75px] font-normal text-muted">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <button className="flex h-10 cursor-pointer items-center justify-center rounded-[4.4px] bg-primary px-8 shadow-sm transition-colors hover:bg-primary-dark">
            <span className="font-jost text-[14px] leading-[20px] font-medium text-white">
              Order Now
            </span>
          </button>
        </div>
        
        {/* Right Column */}
        <div className="relative w-full h-[300px] md:h-[432px] overflow-hidden rounded-[16px] order-1 lg:order-2">
          <Image
            src="/home/samples.webp"
            alt="Free fabric samples"
            fill
            className="object-cover"
          />
        </div>
        
      </div>
    </section>
  );
};

export default FreeSamples;
