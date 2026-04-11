import Link from 'next/link';

interface ComingSoonProps {
  categoryName: string;
}

export default function ComingSoon({ categoryName }: ComingSoonProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="text-center py-16 md:py-24 px-6">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(68,87,102,0.14)] to-[rgba(68,87,102,0.05)] md:mb-8 md:h-32 md:w-32">
          <svg 
            className="h-12 w-12 text-primary md:h-16 md:w-16" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
          Coming Soon
        </h2>

        {/* Description */}
        <p className="mx-auto mb-8 max-w-lg text-base text-muted md:text-lg">
          We&apos;re working hard to bring you an amazing selection of <span className="font-semibold text-primary">{categoryName}</span>. 
          Check back soon or explore our other collections in the meantime.
        </p>

        {/* Features */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-10">
          <div className="flex items-center gap-2 text-sm text-muted">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Premium Quality</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Free Samples</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Fast Delivery</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 font-medium text-white transition-colors hover:bg-primary-dark"
          >
            <span>Browse All Products</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-primary bg-surface px-8 py-3 font-medium text-primary transition-colors hover:bg-surface-soft"
          >
            <span>Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Bottom decorative element */}
      <div className="h-1 bg-gradient-to-r from-[rgba(68,87,102,0.15)] via-[rgba(68,87,102,0.7)] to-[rgba(68,87,102,0.15)]" />
    </div>
  );
}

