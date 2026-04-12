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
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-primary mb-3">FAQ</p>
          <h2 className="font-display font-semibold text-[38px] leading-[1.1] tracking-tight text-foreground mb-3">
            Common Questions
          </h2>
          <p className="font-jost text-[15px] text-muted">Everything you need to know before ordering</p>
        </div>

        <div className="flex flex-col">
          {faqData.map((faq) => {
            const open = openId === faq.id;
            return (
              <div key={faq.id} className="border-b border-border last:border-b-0">
                <button
                  onClick={() => setOpenId(open ? null : faq.id)}
                  className="w-full flex items-center justify-between py-5 text-left gap-4"
                  aria-expanded={open}
                >
                  <span className={`font-jost text-[15px] font-medium transition-colors ${open ? 'text-primary' : 'text-foreground'}`}>
                    {faq.question}
                  </span>
                  <div className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full border border-border">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d={open ? 'M2 5h6' : 'M5 2v6M2 5h6'} stroke={open ? '#0d9488' : '#111'} strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[200px] pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="font-jost text-[14.5px] leading-[1.75] text-muted">{faq.answer}</p>
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
