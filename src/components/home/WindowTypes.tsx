import Image from 'next/image';

const windowTypes = [
  { id: 1, name: 'Standard Window', icon: '/home/categories/standard-window.svg', width: 88, height: 140 },
  { id: 2, name: 'French Door', icon: '/home/categories/french-door.svg', width: 199, height: 140 },
  { id: 3, name: 'Specialty Window', icon: '/home/categories/specialty-window.svg', width: 93, height: 140 },
  { id: 4, name: 'Sliding Window', icon: '/home/categories/sliding-window.svg', width: 138, height: 140 },
];

const WindowTypes = () => {
  return (
    <section className="bg-surface-muted px-4 md:px-6 lg:px-20 py-16 md:py-20 lg:py-24">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10 md:gap-14 items-center">

        {/* Heading */}
        <div className="text-center max-w-[560px] flex flex-col gap-3 items-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#c9a96e] shrink-0 rounded-full" />
            <p className="font-jost font-semibold text-[11px] tracking-[0.18em] uppercase text-[#c9a96e]">
              Find Your Match
            </p>
            <span className="h-px w-8 bg-[#c9a96e] shrink-0 rounded-full" />
          </div>
          <h2 className="font-display text-[34px] md:text-[40px] font-semibold text-foreground tracking-[-0.02em] leading-[1.1]">
            Shop by Window Type
          </h2>
          <p className="font-jost text-[15px] text-muted leading-relaxed">
            Start by selecting the shape of your window or door
          </p>
        </div>

        {/* Types */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 justify-items-center">
          {windowTypes.map((type) => (
            <button
              key={type.id}
              className="flex flex-col gap-4 items-center w-full max-w-[200px] group rounded-2xl border border-border bg-surface p-5 py-7 transition-all duration-250 hover:border-[#c9a96e]/50 hover:shadow-[0_10px_28px_rgba(31,41,51,0.08)] hover:-translate-y-1.5 hover:bg-[#fdfaf5]"
            >
              <div className="h-[100px] md:h-[120px] flex items-center justify-center">
                <div
                  className="relative transition-transform duration-300 group-hover:scale-110"
                  style={{ width: `${type.width * 0.72}px`, height: `${type.height * 0.72}px` }}
                >
                  <Image
                    src={type.icon}
                    alt={type.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 70px, 88px"
                  />
                </div>
              </div>
              <span className="font-jost text-[14px] font-semibold text-foreground text-center leading-snug group-hover:text-[#b8945a] transition-colors duration-200">
                {type.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WindowTypes;
