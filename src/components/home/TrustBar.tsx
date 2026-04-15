const trustItems = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 7H4C2.9 7 2 7.9 2 9v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 3H8L6 7h12l-2-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 12v4M10 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: 'Custom Made to Order',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M21 10H3M16 2v4M8 2v4M3 6h18v16H3V6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: '12 Day Delivery',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: '5 Years Warranty',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 9h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 15h4M14 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: 'Free Fabric Samples',
  },
];

const TrustBar = () => (
  <section className="border-b border-border bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 border-x border-border divide-x divide-y md:divide-y-0 divide-border">
        {trustItems.map((item) => (
          <div
            key={item.label}
            className="group flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 sm:py-4 text-center sm:text-left transition-colors duration-200 hover:bg-primary-light cursor-default"
          >
            <span className="text-primary shrink-0 transition-transform duration-200 group-hover:scale-110">
              {item.icon}
            </span>
            <div>
              <span className="font-jost text-[12px] sm:text-[13px] font-semibold text-foreground leading-snug">
                {item.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBar;
