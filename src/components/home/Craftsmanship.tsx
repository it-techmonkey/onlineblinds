import Image from 'next/image';

const Craftsmanship = () => {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Background Image and Overlay */}
      <div className="absolute inset-0">
        <Image
          src="/home/craftsmanship-bg.webp"
          alt="Craftsmanship"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(31,41,51,0.76)]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full py-[112px]">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex flex-col gap-4 max-w-[672px] items-start w-full">
            <div className="flex flex-col items-start w-full">
              <h2 className="font-display font-bold text-[48px] leading-[48px] text-white">
                Proudly Designed and<br />Manufactured in Texas
              </h2>
            </div>
            
            <div className="flex flex-col items-start pb-4 w-full">
              <p className="font-jost max-w-[672px] text-[18px] leading-[28px] font-normal text-white/76">
                Locally crafted with care, quality, and sustainability. With local production and skilled craftsmanship, we ensure perfect fit, lasting durability, and quicker lead times.
              </p>
            </div>
            
            <button className="flex h-10 cursor-pointer items-center justify-center rounded-[4.4px] border border-white/24 bg-transparent px-8 shadow-sm transition-colors hover:border-white/40 hover:bg-white/10">
              <span className="font-jost text-[14px] font-medium text-white">
                Discover Craftsmanship
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Craftsmanship;
