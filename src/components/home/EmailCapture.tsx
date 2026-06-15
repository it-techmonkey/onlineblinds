'use client';

import { useState } from 'react';

const EmailCapture = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Simulate submission — wire to your email provider / Shopify customer API
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <section className="border-t border-border bg-foreground py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col items-center text-center gap-6 md:gap-8">
          {/* Badge */}
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
            Exclusive Offer
          </span>

          {submitted ? (
            <div className="space-y-3">
              <h2 className="font-display text-[28px] font-semibold leading-tight text-white md:text-[38px]">
                You&apos;re all set!
              </h2>
              <p className="max-w-md text-[15px] leading-relaxed text-white/80">
                Check your inbox — your £20 discount code is on its way.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 text-center">
                <h2 className="font-display text-[28px] font-semibold leading-tight text-white md:text-[38px]">
                  Ready to Save £20 on Your First Order?
                </h2>
                <p className="mx-auto max-w-lg text-center text-[15px] leading-relaxed text-white/80">
                  Subscribe and we&apos;ll email you a <span className="font-semibold text-white">£20 discount code</span> valid on orders of £200 or more. No spam — just great blinds at better prices.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="h-12 flex-1 rounded-[12px] border border-white/10 bg-white/8 px-4 text-[14px] text-white placeholder:text-white/55 outline-none focus:border-white/30 focus:bg-white/12 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 shrink-0 rounded-[12px] bg-primary px-6 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-all hover:bg-primary-dark disabled:opacity-60"
                >
                  {loading ? 'Sending…' : 'Get My £20 Off'}
                </button>
              </form>

              <p className="text-[12px] text-white/60">
                By subscribing you agree to receive marketing emails. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default EmailCapture;
