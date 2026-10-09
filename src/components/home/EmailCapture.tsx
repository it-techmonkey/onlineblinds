'use client';

import { useState } from 'react';
import PumpkinIcon from '@/components/ui/PumpkinIcon';
import { HALLOWEEN_ENABLED, halloween } from '@/data/seasonalTheme';

const EmailCapture = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(discountCode);
      setCopied(true);
    } catch {
      // Clipboard unavailable — the code is still visible to copy manually.
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        setError(result?.error?.message || 'We could not subscribe you right now. Please try again later.');
        return;
      }
      setDiscountCode(result.data?.discountCode || '');
      setSubmitted(true);
    } catch {
      setError('We could not subscribe you right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-t border-border bg-foreground py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="flex flex-col items-center text-center gap-6 md:gap-8">
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
            {HALLOWEEN_ENABLED && <PumpkinIcon className="h-3.5 w-3.5" />}
            {HALLOWEEN_ENABLED ? halloween.emailCapture.badge : 'Exclusive Offer'}
          </span>

          {submitted ? (
            <div className="space-y-3">
              <h2 className="font-display text-[28px] font-semibold leading-tight text-white md:text-[38px]">
                You&apos;re all set!
              </h2>
              {discountCode ? (
                <>
                  <p className="mx-auto max-w-md text-[15px] leading-relaxed text-white/80">
                    Here&apos;s your £20 discount code. Enter it in your cart on orders of £200 or more.
                  </p>
                  <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                    <span className="rounded-[12px] border border-dashed border-white/40 bg-white/8 px-6 py-3 font-jost text-[18px] font-semibold tracking-[0.12em] text-white">
                      {discountCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="h-12 rounded-[12px] bg-primary px-6 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-all hover:bg-primary-dark"
                    >
                      {copied ? 'Copied' : 'Copy Code'}
                    </button>
                  </div>
                </>
              ) : (
                <p className="max-w-md text-[15px] leading-relaxed text-white/80">
                  Thanks for subscribing — you&apos;re on the list.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3 text-center">
                <h2 className="font-display text-[28px] font-semibold leading-tight text-white md:text-[38px]">
                  {HALLOWEEN_ENABLED ? halloween.emailCapture.heading : 'Ready to Save £20 on Your First Order?'}
                </h2>
                <p className="mx-auto max-w-lg text-center text-[15px] leading-relaxed text-white/80">
                  Subscribe and get a <span className="font-semibold text-white">£20 discount code</span> valid on orders of £200 or more. No spam — just great blinds at better prices.
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

              {error && (
                <p role="alert" className="text-[13px] text-red-300">
                  {error}
                </p>
              )}

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
