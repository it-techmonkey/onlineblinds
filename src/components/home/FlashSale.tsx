const FlashSale = () => {
  return (
    <section className="bg-foreground py-20 px-6">
      <div className="max-w-[1280px] mx-auto flex flex-col items-center justify-center relative w-full">
        <div className="flex flex-col gap-[12px] items-center justify-center max-w-[800px]">
          
          <div className="flex flex-col items-center w-full">
            <h3 className="font-jost text-[14px] leading-[20px] tracking-[1.4px] uppercase text-center font-medium text-white/60">
              Our Biggest Flash Sale Ever
            </h3>
          </div>
          
          <div className="flex flex-col items-center w-full">
            <h2 className="font-display text-[48px] leading-[48px] text-center font-bold text-white">
              Up to 50% Off
            </h2>
          </div>
          
          <div className="flex flex-col items-center pt-1 pb-5 w-full">
            <p className="font-jost text-[18px] leading-[28px] text-center font-normal text-white/74">
              Get an Extra 15% Off with Code <span className="font-bold text-white">SALE15</span>
            </p>
          </div>
          
          <button className="flex h-10 cursor-pointer items-center justify-center rounded-[4.4px] bg-surface-muted px-10 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)] transition-colors hover:bg-white">
            <span className="font-jost text-[14px] leading-[20px] font-medium text-foreground">
              Shop Now
            </span>
          </button>
          
        </div>
      </div>
    </section>
  );
};

export default FlashSale;

