import Image from 'next/image';

const windowTypes = [
  { id: 1, name: 'Standard Window', icon: '/home/categories/standard-window.svg', width: 88, height: 140 },
  { id: 2, name: 'French Door', icon: '/home/categories/french-door.svg', width: 199, height: 140 },
  { id: 3, name: 'Specialty Window', icon: '/home/categories/specialty-window.svg', width: 93, height: 140 },
  { id: 4, name: 'Sliding Window', icon: '/home/categories/sliding-window.svg', width: 138, height: 140 },
];

const WindowTypes = () => {
  return (
    <section className="bg-[#f5f8fe] px-4 md:px-6 lg:px-20 py-12 md:py-16 lg:py-20">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-8 md:gap-10 lg:gap-14 items-center">
        <div className="text-center max-w-[600px]">
          <h2 className="text-xl md:text-2xl lg:text-[32px] font-medium text-black tracking-tight mb-2 md:mb-3">
            Find Your Match
          </h2>
          <p className="text-sm md:text-base lg:text-lg text-[#4b5a73] leading-relaxed">
            Start by selecting the shape of your window or door
          </p>
        </div>
        
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-4 justify-items-center">
          {windowTypes.map((type) => (
            <button
              key={type.id}
              className="flex flex-col gap-4 md:gap-5 items-center w-full max-w-[174px] group"
            >
              <div className="h-[100px] md:h-[140px] flex items-center justify-center">
                <div 
                  className="relative transition-transform group-hover:scale-105"
                  style={{ width: `${type.width * 0.8}px`, height: `${type.height * 0.8}px` }}
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
              <span className="text-sm md:text-base lg:text-lg font-normal text-[#25344d] text-center leading-snug">
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

