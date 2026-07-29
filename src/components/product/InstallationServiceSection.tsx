'use client';


/* ─── Data ─── */

const benefits = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: 'Expert Technicians',
    desc: 'Trained professionals with years of hands-on experience fitting all blind types — perfectly, every time.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Quick & Tidy',
    desc: 'In and out efficiently — our fitters respect your home and leave zero mess behind.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z" />
        <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z" />
        <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z" />
        <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z" />
        <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z" />
        <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z" />
        <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z" />
      </svg>
    ),
    title: 'Guaranteed Fit',
    desc: 'Accurate measurements taken on-site so your blinds hang flawlessly — or we return and fix it, free.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Order Your Blinds',
    desc: 'Choose your blinds online and add Professional Installation to your basket — one per blind.',
  },
  {
    number: '02',
    title: 'We Confirm Your Appointment',
    desc: 'Once your order is placed, our team calls you to schedule a date and time that suits you.',
  },
  {
    number: '03',
    title: 'Expert Arrives On The Day',
    desc: 'A vetted, fully-equipped fitter arrives at your door, takes precise measurements, and installs everything cleanly.',
  },
  {
    number: '04',
    title: 'Sit Back & Enjoy',
    desc: 'Your blinds are perfectly fitted and ready to use. We tidy up and leave nothing behind but a beautiful result.',
  },
];

const faqs = [
  {
    id: 1,
    question: 'What areas do you serve?',
    answer:
      'Our professional installation service is available across the UK. Coverage is confirmed at checkout when you enter your postcode — most major cities and towns are fully covered.',
  },
  {
    id: 2,
    question: 'Do you bring tools & equipment?',
    answer:
      'Yes, absolutely. Our fitters arrive with everything needed — drills, fixings, levels, and all associated hardware. You don\'t need to provide a single thing.',
  },
  {
    id: 3,
    question: 'How do I prepare for installation?',
    answer:
      'Simply clear the window sill and ensure easy access to the window area. Our fitter handles all the measuring and fitting from there.',
  },
  {
    id: 4,
    question: 'Can you remove my old blinds?',
    answer:
      'Yes. We can remove and responsibly dispose of your existing blinds as part of the installation visit at no extra charge.',
  },
  {
    id: 5,
    question: 'Is there a warranty on your service?',
    answer:
      'All installations come with a workmanship guarantee. If anything isn\'t right after we leave, we\'ll return to make it perfect — completely free of charge.',
  },
];

/* ─── Component ─── */

export const InstallationServiceSection = () => {

  return (
    <section className="bg-white">

      {/* ── 1. Hero Banner ── */}
      <div className="relative bg-[#111] overflow-hidden">
        {/* Subtle diagonal texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '18px 18px',
          }}
        />
        {/* Gold accent bar top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#c9a96e] to-transparent" />

        <div className="relative max-w-[1200px] mx-auto px-5 md:px-8 lg:px-12 py-14 md:py-20 flex flex-col items-center text-center gap-5">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[#c9a96e] rounded-full" />
            <p className="font-jost font-semibold text-[11px] tracking-[0.18em] uppercase text-[#c9a96e]">
              Add-On Service
            </p>
            <span className="h-px w-8 bg-[#c9a96e] rounded-full" />
          </div>

          <h2 className="font-display font-semibold text-[32px] md:text-[42px] lg:text-[50px] text-white leading-[1.1] tracking-[-0.02em] max-w-2xl">
            Professional Blind Installation
          </h2>
          <p className="font-jost text-[15px] md:text-[16px] text-white/60 leading-[1.75] max-w-xl">
            Skip the DIY. Our expert fitters handle accurate measurements, clean
            fitting, and zero hassle — from just £40.
          </p>

          {/* Price badge */}
          <div className="mt-1 inline-flex items-baseline gap-1.5 bg-white/[0.07] border border-white/10 rounded-full px-5 py-2">
            <span className="font-jost text-[12px] text-white/50 uppercase tracking-wider">From</span>
            <span className="font-display text-[28px] font-semibold text-white leading-none">£40</span>
          </div>
        </div>
      </div>

      {/* ── 2. Benefit Cards ── */}
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 lg:px-12 -mt-8 relative z-10 pb-16 md:pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {benefits.map((b, i) => (
            <div
              key={i}
              className="bg-white border border-border rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center text-primary shrink-0">
                {b.icon}
              </div>
              <div>
                <p className="font-jost font-semibold text-[15px] text-foreground mb-1">{b.title}</p>
                <p className="font-jost text-[13.5px] text-muted leading-[1.7]">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. How It Works Timeline ── */}
      <div className="bg-surface-muted border-y border-border">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 lg:px-12 py-16 md:py-20">
          {/* Section header */}
          <div className="mb-12 md:mb-16">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-primary rounded-full" />
              <p className="font-jost font-semibold text-[11px] tracking-[0.18em] uppercase text-primary">
                The Process
              </p>
            </div>
            <h3 className="font-display font-semibold text-[28px] md:text-[36px] text-foreground leading-[1.15] tracking-tight">
              How It Works
            </h3>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 relative">
            {/* Connector line (desktop only) */}
            <div className="hidden lg:block absolute top-[22px] left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-px bg-border z-0" />

            {steps.map((s, i) => (
              <div key={i} className="relative flex flex-col gap-4 z-10">
                {/* Number bubble */}
                <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                  <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-jost font-bold text-[13px] tracking-wide shrink-0">
                    {s.number}
                  </div>
                  {/* Mobile connector */}
                  {i < steps.length - 1 && (
                    <div className="flex-1 h-px bg-border lg:hidden" />
                  )}
                </div>
                <div>
                  <p className="font-jost font-semibold text-[14.5px] text-foreground mb-1.5">{s.title}</p>
                  <p className="font-jost text-[13.5px] text-muted leading-[1.7]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Installation Q&A Cards ── */}
      <div className="bg-[#111] py-16 md:py-20">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 lg:px-12">
          {/* Header */}
          <div className="mb-10 flex items-center gap-3">
            <span className="h-px w-8 bg-[#c9a96e] rounded-full shrink-0" />
            <p className="font-jost font-semibold text-[11px] tracking-[0.18em] uppercase text-[#c9a96e]">
              Good to Know
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white/[0.05] border border-white/10 rounded-2xl p-6 flex flex-col gap-3 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200"
              >
                <p className="font-jost font-semibold text-[14px] text-white leading-snug">
                  {faq.question}
                </p>
                <p className="font-jost text-[13.5px] text-white/55 leading-[1.75]">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
};
