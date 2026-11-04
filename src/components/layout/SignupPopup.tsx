'use client';

import { useEffect, useRef, useState } from 'react';
import {
  NEWSLETTER_DISCOUNT_CODE,
  NEWSLETTER_PERCENT_OFF,
  SIGNUP_POPUP_DELAY_SECONDS,
  SIGNUP_POPUP_SNOOZE_DAYS,
} from '@/data/promotions';

// "Sign up and get 15% off" popup, opened a few seconds into the visit.
// Not shown again once the visitor signs up, and not for a week after closing it.
const STORAGE_KEY = 'ob-signup-popup';
// Shopify's customer form reloads the page with ?customer_posted=true and this hash.
const SHOPIFY_FORM_ID = 'ob-signup-popup';

export function markSignupDone() {
  try {
    window.localStorage.setItem(STORAGE_KEY, 'subscribed');
  } catch {}
}

function shouldOpen() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'subscribed') return false;
    if (saved && Number(saved) > Date.now()) return false;
  } catch {}
  return true;
}

function snooze() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now() + SIGNUP_POPUP_SNOOZE_DAYS * 86400000));
  } catch {}
}

interface SignupPopupProps {
  /** Shopify theme: post Shopify's native customer form instead of the site's API. */
  shopifyForm?: boolean;
}

const SignupPopup = ({ shopifyForm = false }: SignupPopupProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Back from Shopify's form post: show the code straight away.
    // (A signup from the home page form also lands here, without the hash.)
    if (shopifyForm && /[?&]customer_posted=true/.test(window.location.search)) {
      markSignupDone();
      if (window.location.hash === `#${SHOPIFY_FORM_ID}`) {
        setCode(NEWSLETTER_DISCOUNT_CODE);
        setOpen(true);
      }
      return;
    }
    if (!shouldOpen()) return;
    const timer = setTimeout(() => {
      if (shouldOpen()) setOpen(true);
    }, SIGNUP_POPUP_DELAY_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [shopifyForm]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    if (!code) inputRef.current?.focus({ preventScroll: true });
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    if (!code) snooze();
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (shopifyForm) {
      // Native post; the page reloads and the effect above shows the code.
      setLoading(true);
      return;
    }
    event.preventDefault();
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
        setError(result?.error?.message || 'We could not sign you up right now. Please try again later.');
        return;
      }
      markSignupDone();
      setCode(result.data?.discountCode || NEWSLETTER_DISCOUNT_CODE);
    } catch {
      setError('We could not sign you up right now. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).then(() => setCopied(true)).catch(() => {});
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ob-signup-title"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-[#b91c1c] px-6 pb-6 pt-8 text-center text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">Exclusive Offer</p>
          <p className="mt-1 font-display text-[52px] font-semibold leading-none">{NEWSLETTER_PERCENT_OFF}% Off</p>
        </div>

        <div className="px-6 pb-6 pt-5 text-center">
          {code ? (
            <>
              <h2 id="ob-signup-title" className="font-display text-[26px] font-semibold leading-tight text-foreground">
                You&apos;re all set!
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
                Here&apos;s your {NEWSLETTER_PERCENT_OFF}% discount code. Enter it in your cart, alongside any other code.
              </p>
              <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <span className="rounded-[12px] border border-dashed border-red-300 bg-red-50 px-5 py-2.5 font-jost text-[17px] font-semibold tracking-[0.12em] text-red-700">
                  {code}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="h-11 rounded-[12px] bg-primary px-5 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-all hover:bg-primary-dark"
                >
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 id="ob-signup-title" className="font-display text-[26px] font-semibold leading-tight text-foreground">
                Sign up and get {NEWSLETTER_PERCENT_OFF}% off
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
                Join our newsletter for a {NEWSLETTER_PERCENT_OFF}% discount code you can use on top of other offers.
              </p>
              <form
                onSubmit={handleSubmit}
                className="mt-4 flex flex-col gap-3"
                {...(shopifyForm && {
                  method: 'post',
                  action: `/contact#${SHOPIFY_FORM_ID}`,
                  acceptCharset: 'UTF-8',
                })}
              >
                {shopifyForm && (
                  <>
                    <input type="hidden" name="form_type" value="customer" />
                    <input type="hidden" name="utf8" value="✓" />
                    <input type="hidden" name="contact[tags]" value="newsletter" />
                  </>
                )}
                <input
                  ref={inputRef}
                  type="email"
                  name="contact[email]"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address"
                  className="h-12 rounded-[12px] border border-border px-4 text-[14px] text-foreground outline-none transition-colors focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 rounded-[12px] bg-primary px-6 text-[13px] font-semibold uppercase tracking-[0.06em] text-white transition-all hover:bg-primary-dark disabled:opacity-60"
                >
                  {loading ? 'Sending…' : `Get My ${NEWSLETTER_PERCENT_OFF}% Off`}
                </button>
              </form>
              {error && (
                <p role="alert" className="mt-2 text-[13px] text-red-600">
                  {error}
                </p>
              )}
              <p className="mt-3 text-[11.5px] text-muted">
                By subscribing you agree to receive marketing emails. Unsubscribe anytime.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-2 text-[12px] font-medium text-muted underline hover:text-foreground"
              >
                No thanks
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignupPopup;
