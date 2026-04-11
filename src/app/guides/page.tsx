import type { Metadata } from 'next';
import { Header, Footer } from '@/components';

export const metadata: Metadata = {
  title: 'Measure & Fit Guides | Online Blinds',
  description: 'Download our free measuring and installation guides for vertical blinds, roller shades, zebra shades, and EclipseCore honeycomb blinds.',
};

const guides = [
  {
    category: 'Vertical Blinds',
    items: [
      {
        title: 'Vertical Blinds – Measurement Guide',
        file: '/guides/vertical_blinds_measurement_guide_onlineblinds.pdf',
        type: 'Measuring',
      },
      {
        title: 'Vertical Blinds – Installation Guide',
        file: '/guides/vertical_blinds_installation_guide_onlineblinds.pdf',
        type: 'Installation',
      },
      {
        title: 'Blackout Vertical Blinds – How to Measure',
        file: '/guides/how_to_measure_blackout_vertical_blinds.pdf',
        type: 'Measuring',
      },
    ],
  },
  {
    category: 'Roller Shades',
    items: [
      {
        title: 'Roller Shades – Measurement Guide',
        file: '/guides/roller_shades_measurement_guide_onlineblinds.pdf',
        type: 'Measuring',
      },
      {
        title: 'Roller Shades – How to Measure',
        file: '/guides/how_to_measure_roller_shades_onlineblinds.pdf',
        type: 'Measuring',
      },
      {
        title: 'Roller Blinds – Installation Guide',
        file: '/guides/roller_blinds_installation_guide_onlineblinds.pdf',
        type: 'Installation',
      },
    ],
  },
  {
    category: 'Dual Zebra Shades',
    items: [
      {
        title: 'Dual Zebra Shades – Measurement Guide',
        file: '/guides/dual_zebra_measurement_guide_onlineblinds.pdf',
        type: 'Measuring',
      },
      {
        title: 'Zebra Shades – How to Measure',
        file: '/guides/how_to_measure_zebra_shades_onlineblinds.pdf',
        type: 'Measuring',
      },
      {
        title: 'Dual Zebra Shades – Installation Guide',
        file: '/guides/dual_zebra_installation_guide_onlineblinds.pdf',
        type: 'Installation',
      },
    ],
  },
  {
    category: 'EclipseCore Honeycomb Blinds',
    items: [
      {
        title: 'EclipseCore – Drill-Free Measuring Guide',
        file: '/guides/eclipsecore_honeycomb_drillfree_measuring_guide.pdf',
        type: 'Measuring',
      },
    ],
  },
];

const TypeBadge = ({ type }: { type: string }) => (
  <span
    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
      type === 'Installation'
        ? 'bg-[rgba(68,87,102,0.12)] text-primary'
        : 'bg-surface-soft text-muted-strong'
    }`}
  >
    {type}
  </span>
);

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Hero */}
        <section className="bg-gradient-to-br from-foreground via-primary to-primary-dark px-4 py-14 md:px-6 md:py-20 lg:px-20">
          <div className="max-w-[1400px] mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              Measure &amp; Fit Guides
            </h1>
            <p className="text-white/80 text-base md:text-lg max-w-xl mx-auto">
              Download our free step-by-step guides to measure and install your blinds perfectly every time.
            </p>
          </div>
        </section>

        {/* Guides */}
        <section className="px-4 md:px-6 lg:px-20 py-12 md:py-16">
          <div className="max-w-[1400px] mx-auto space-y-12">
            {guides.map((group) => (
              <div key={group.category}>
                <h2 className="mb-5 border-b border-border pb-3 text-xl font-semibold text-foreground md:text-2xl">
                  {group.category}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((guide) => (
                    <a
                      key={guide.file}
                      href={guide.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-4 rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                    >
                      {/* PDF icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(68,87,102,0.1)] transition-colors group-hover:bg-[rgba(68,87,102,0.16)]">
                        <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="mb-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {guide.title}
                        </p>
                        <div className="flex items-center justify-between">
                          <TypeBadge type={guide.type} />
                          <span className="flex items-center gap-1 text-xs text-muted">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            PDF
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

