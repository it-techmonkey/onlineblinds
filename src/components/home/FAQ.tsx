'use client';

import { useState } from 'react';

const faqData = [
  {
    id: 1,
    question: 'How do I measure my windows for blinds?',
    answer: 'We provide easy-to-follow measuring guides on our website. Just follow the step-by-step instructions to get the perfect fit.',
  },
  {
    id: 2,
    question: 'Can I order free samples before buying?',
    answer: 'Yes! We offer up to 10 free samples delivered to your door at zero cost. This allows you to see and feel the quality before making a purchase.',
  },
  {
    id: 3,
    question: 'How long will delivery take?',
    answer: 'Standard delivery takes 5-7 business days. Express delivery options are also available for faster shipping.',
  },
  {
    id: 4,
    question: 'Do you offer made-to-measure blinds?',
    answer: 'Yes, all our blinds are custom made to your exact measurements, ensuring a perfect fit for your windows.',
  },
  {
    id: 5,
    question: 'What is your return policy?',
    answer: 'Since all products are custom-made, we only accept returns for items that are defective or damaged upon arrival. Please contact support within 14 days of delivery.',
  },
];

const FAQ = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <section className="bg-white py-24">
      <div className="max-w-[768px] mx-auto px-6 flex flex-col gap-10">
        <div className="flex flex-col items-center w-full">
          <h2 className="font-display text-[36px] leading-[40px] text-center font-semibold text-foreground">
            Frequently Asked Questions
          </h2>
        </div>
        
        <div className="flex flex-col w-full">
          {faqData.map((faq) => (
            <div key={faq.id} className="flex w-full flex-col border-b border-border pb-[1px]">
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between py-4 text-left group"
                aria-expanded={openId === faq.id}
              >
                <span className="font-jost text-[16px] leading-[24px] font-medium text-foreground">
                  {faq.question}
                </span>
                <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center relative">
                  <span className="absolute h-[1.5px] w-[14px] bg-foreground" />
                  <span className={`absolute h-[14px] w-[1.5px] bg-foreground transition-transform duration-300 ${openId === faq.id ? 'rotate-90 scale-y-0' : 'rotate-0'}`} />
                </div>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openId === faq.id ? 'max-h-[200px] pb-4 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="font-jost text-[16px] leading-relaxed font-normal text-muted">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

