'use client';

import { useState } from 'react';

const faqData = [
  { id: 1, question: 'How do I measure my windows for blinds?', answer: 'We provide easy-to-follow measuring guides on our website. Just follow the step-by-step instructions to get the perfect fit for your exact window dimensions.' },
  { id: 2, question: 'Can I order free samples before buying?', answer: 'Yes! We offer up to 10 free samples delivered to your door at zero cost — see and feel the quality before you purchase.' },
  { id: 3, question: 'How long will delivery take?', answer: 'Standard delivery takes 5–7 business days. Express delivery options are available at checkout.' },
  { id: 4, question: 'Do you offer made-to-measure blinds?', answer: 'Yes, all our blinds are custom made to your exact measurements for a perfect window fit.' },
  { id: 5, question: 'What is your return policy?', answer: 'As all products are custom-made, returns are accepted only for defective or damaged items. Contact us within 14 days of delivery.' },
];

const FAQ = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <section className="bg-white py-16 md:py-24">
      <div className="max-w-[680px] mx-auto px-5 md:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="block w-6 h-0.5 bg-primary rounded-full" />
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary">FAQ</p>
            <span className="block w-6 h-0.5 bg-primary rounded-full" />
          </div>
          <h2 className="font-display font-semibold text-[36px] md:text-[40px] leading-[1.1] tracking-tight text-foreground mb-3">
            Common Questions
          </h2>
          <p className="font-jost text-[15px] text-muted">Everything you need to know before ordering</p>
        </div>

        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border overflow-hidden shadow-sm">
          {faqData.map((faq) => {
            const open = openId === faq.id;
            return (
              <div key={faq.id} className={`transition-colors duration-200 ${open ? 'bg-primary-light/50' : 'bg-white hover:bg-neutral-50/80'}`}>
                <button
                  onClick={() => setOpenId(open ? null : faq.id)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                  aria-expanded={open}
                >
                  <span className={`font-jost text-[15px] font-medium transition-colors duration-200 ${open ? 'text-primary' : 'text-foreground'}`}>
                    {faq.question}
                  </span>
                  <div
                    className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      open
                        ? 'bg-primary border-primary rotate-45'
                        : 'bg-white border-border-strong'
                    }`}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M5 2v6M2 5h6"
                        stroke={open ? 'white' : '#111'}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[200px]' : 'max-h-0'}`}
                >
                  <p className="font-jost text-[14.5px] leading-[1.75] text-muted px-6 pb-5">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
