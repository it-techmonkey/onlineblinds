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
    className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
      type === 'Installation'
        ? 'bg-foreground text-white'
        : 'bg-primary-light text-primary-dark'
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
        <section className="px-4 pb-8 pt-10 md:px-6 md:pb-12 md:pt-14 lg:px-20">
          <div className="mx-auto max-w-[980px] rounded-[28px] border border-border bg-[linear-gradient(180deg,#ffffff_0%,#f8fcfb_100%)] px-6 py-10 md:px-10 md:py-14">
            <p className="mb-3 font-jost text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
              Support
            </p>
            <h1 className="max-w-[620px] font-display text-[38px] leading-[1.02] text-foreground md:text-[54px]">
              Measure &amp; Fit Guides
            </h1>
            <p className="mt-4 max-w-[520px] font-jost text-[14px] leading-[1.8] text-muted md:text-[15px]">
              Clean, straightforward PDF guides for measuring and installing each blind style with confidence.
            </p>
          </div>
        </section>

        <section className="px-4 pb-14 pt-2 md:px-6 md:pb-20 lg:px-20">
          <div className="mx-auto max-w-[980px] space-y-12">
            {guides.map((group) => (
              <div key={group.category} className="grid gap-5 border-t border-border pt-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:pt-8">
                <div>
                  <h2 className="font-display text-[26px] leading-none text-foreground md:text-[30px]">
                    {group.category}
                  </h2>
                  <p className="mt-2 font-jost text-[13px] leading-[1.7] text-muted">
                    {group.items.length} guide{group.items.length > 1 ? 's' : ''} available
                  </p>
                </div>
                <div className="space-y-2.5">
                  {group.items.map((guide) => (
                    <a
                      key={guide.file}
                      href={guide.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-transparent bg-background-alt px-4 py-4 transition-all hover:border-border-strong hover:bg-white"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <TypeBadge type={guide.type} />
                          <span className="font-jost text-[10px] uppercase tracking-[0.16em] text-muted">PDF</span>
                        </div>
                        <p className="font-jost text-sm font-medium leading-snug text-foreground md:text-[15px]">
                          {guide.title}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-foreground transition-transform group-hover:translate-y-0.5">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 5v14m0 0 5-5m-5 5-5-5" />
                        </svg>
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

