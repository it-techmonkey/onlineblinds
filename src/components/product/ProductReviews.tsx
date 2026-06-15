'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { JudgeMeReview, JudgeMeReviewsResponse } from '@/app/api/reviews/[handle]/route';

// ─── Star component ────────────────────────────────────────────────────────────

function StarIcon({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled || half ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      className="shrink-0"
      aria-hidden
    >
      {half ? (
        <>
          <defs>
            <linearGradient id="half-grad">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
            fill="url(#half-grad)"
            stroke="currentColor"
          />
        </>
      ) : (
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      )}
    </svg>
  );
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-gold text-2xl gap-1' : size === 'md' ? 'text-gold gap-0.5' : 'text-gold gap-0.5';
  return (
    <span className={`flex items-center ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} filled={i <= Math.floor(rating)} half={i === Math.ceil(rating) && !Number.isInteger(rating)} />
      ))}
    </span>
  );
}

// ─── Interactive star picker (for write form) ──────────────────────────────────

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [preview, setPreview] = useState(0);
  // preview is only for visual highlight on hover — does NOT change value
  const display = preview || value;

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex items-center gap-1"
        onMouseLeave={() => setPreview(0)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const lit = i <= display;
          const selected = i <= value;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              onMouseEnter={() => setPreview(i)}
              className="focus-visible:outline-none p-0.5 transition-transform duration-100 hover:scale-105 active:scale-95"
              aria-label={`${i} star`}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill={lit ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.8"
                className={lit ? 'text-gold' : 'text-border'}
                style={{ transition: 'color 0.1s, fill 0.1s' }}
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </button>
          );
        })}
      </div>
      <span className="text-sm font-medium text-foreground min-w-18">
        {display ? RATING_LABELS[display] : <span className="text-muted">Select</span>}
      </span>
    </div>
  );
}

// ─── Photo lightbox modal ──────────────────────────────────────────────────────

function PhotoModal({
  photos,
  initialIndex,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(0, c - 1));
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(photos.length - 1, c + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [photos.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[20px] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Customer photos ({photos.length})
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-contrast transition-colors"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Photo grid */}
        <div className="overflow-y-auto p-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {photos.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                  current === idx ? 'border-primary shadow-md' : 'border-transparent hover:border-border-strong'
                }`}
              >
                <Image src={url} alt={`Customer photo ${idx + 1}`} fill className="object-cover" sizes="120px" />
              </button>
            ))}
          </div>
        </div>

        {/* Selected photo */}
        {photos[current] && (
          <div className="border-t border-border p-4 flex items-center justify-center bg-surface-soft">
            <div className="relative w-full max-h-64 aspect-video rounded-xl overflow-hidden">
              <Image
                src={photos[current]}
                alt={`Customer photo ${current + 1}`}
                fill
                className="object-contain"
                sizes="600px"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Media file type ──────────────────────────────────────────────────────────

interface MediaFile {
  file: File;
  preview: string; // object URL for img/video preview
  type: 'image' | 'video';
  uploading: boolean;
  url: string | null;   // CDN URL after upload
  error: boolean;
}

// ─── Write a review form ───────────────────────────────────────────────────────

function WriteReviewForm({
  productHandle,
  onClose,
  onSuccess,
}: {
  productHandle: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Revoke object URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => { media.forEach((m) => URL.revokeObjectURL(m.preview)); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadFile = async (mf: MediaFile, index: number) => {
    const fd = new FormData();
    fd.append('file', mf.file);
    try {
      const res = await fetch('/api/reviews/upload', { method: 'POST', body: fd });
      const data = await res.json();
      setMedia((prev) =>
        prev.map((m, i) =>
          i === index ? { ...m, uploading: false, url: res.ok ? data.url : null, error: !res.ok } : m
        )
      );
    } catch {
      setMedia((prev) =>
        prev.map((m, i) => (i === index ? { ...m, uploading: false, error: true } : m))
      );
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = Array.from(files).filter((f) =>
      f.type.startsWith('image/') || f.type.startsWith('video/')
    ).slice(0, 5 - media.length); // max 5 total

    const newMedia: MediaFile[] = allowed.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      type: f.type.startsWith('video/') ? 'video' : 'image',
      uploading: true,
      url: null,
      error: false,
    }));

    setMedia((prev) => {
      const updated = [...prev, ...newMedia];
      // kick off uploads for the new items
      newMedia.forEach((mf, i) => uploadFile(mf, prev.length + i));
      return updated;
    });
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (media.some((m) => m.uploading)) {
      setError('Please wait for uploads to finish.');
      return;
    }
    if (media.some((m) => m.error)) {
      setError('Some files failed to upload. Remove them and try again.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const pictureUrls = media.filter((m) => m.url).map((m) => m.url!);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: productHandle, name, email, rating, title, body, pictureUrls }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setSubmitted(true);
        setTimeout(() => { onSuccess(); onClose(); }, 2500);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-center px-6">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-base font-semibold text-foreground">Thank you for your review!</p>
        <p className="text-sm text-muted">It will appear once approved.</p>
      </div>
    );
  }

  const inputClass =
    'w-full border border-border rounded-xl px-4 py-2.5 text-sm text-foreground bg-white placeholder:text-muted focus:outline-none focus:border-primary transition-colors';

  const uploadsInProgress = media.some((m) => m.uploading);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 sm:p-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Tell us what you think</h3>
          <p className="text-xs text-muted mt-0.5">Your review helps other shoppers make a better decision.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-contrast transition-colors"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Star picker */}
      <div>
        <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-2">Overall rating</label>
        <div className="border border-border rounded-xl px-4 py-3 bg-white flex items-center gap-4">
          <StarPicker value={rating} onChange={setRating} />
        </div>
      </div>

      {/* Name + Email row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">Name</label>
          <input className={inputClass} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">Email</label>
          <input type="email" className={inputClass} placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>

      {/* Headline */}
      <div>
        <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">Headline</label>
        <input className={inputClass} placeholder="What's most important to know?" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {/* Review body */}
      <div>
        <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">Your review</label>
        <textarea
          className={`${inputClass} resize-none h-28`}
          placeholder="What did you like or dislike? How was the quality, fit, or delivery?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      </div>

      {/* Media upload */}
      <div>
        <label className="text-xs font-semibold text-muted uppercase tracking-widest block mb-1.5">
          Photos &amp; videos <span className="normal-case font-normal text-muted">(optional, up to 5)</span>
        </label>

        <div className="flex flex-wrap gap-2">
          {/* Existing previews */}
          {media.map((m, idx) => (
            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border bg-surface-soft shrink-0">
              {m.type === 'image' ? (
                <img src={m.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={m.preview} className="w-full h-full object-cover" muted playsInline />
              )}

              {/* Upload spinner overlay */}
              {m.uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}

              {/* Error overlay */}
              {m.error && (
                <div className="absolute inset-0 bg-red-500/70 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M12 8v4m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              {/* Remove button */}
              {!m.uploading && (
                <button
                  type="button"
                  onClick={() => removeMedia(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  aria-label="Remove"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Add button — hidden when 5 reached */}
          {media.length < 5 && (
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border hover:border-primary bg-white flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors group shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-muted group-hover:text-primary transition-colors">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] text-muted group-hover:text-primary transition-colors leading-tight text-center px-1">Add photo<br />or video</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || uploadsInProgress}
        className="w-full bg-foreground text-white text-sm font-semibold py-3 rounded-xl hover:bg-primary transition-colors disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : uploadsInProgress ? 'Uploading files…' : 'Submit review'}
      </button>
    </form>
  );
}

// ─── Main ProductReviews component ────────────────────────────────────────────

interface ProductReviewsProps {
  productHandle: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const PHOTOS_PREVIEW_COUNT = 8;

const ProductReviews = ({ productHandle }: ProductReviewsProps) => {
  const [data, setData] = useState<JudgeMeReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [photoModal, setPhotoModal] = useState<{ photos: string[]; index: number } | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(productHandle)}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [productHandle]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  // Collect all customer photos across all reviews
  const allPhotos = (data?.reviews ?? []).flatMap((r) =>
    r.pictures?.map((p) => p.urls.original) ?? []
  );


  // ── Skeleton ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-36 rounded-2xl bg-surface-contrast" />
        <div className="h-24 rounded-2xl bg-surface-contrast" />
        <div className="h-32 rounded-2xl bg-surface-contrast" />
      </div>
    );
  }

  const isEmpty = !data || data.totalReviews === 0;

  return (
    <>
      {/* Photo lightbox */}
      {photoModal && (
        <PhotoModal
          photos={photoModal.photos}
          initialIndex={photoModal.index}
          onClose={() => setPhotoModal(null)}
        />
      )}

      <div className="flex flex-col gap-6">

        {/* ── Header card ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-border p-5 md:p-6 shadow-[0_4px_14px_rgba(31,41,51,0.04)]">
          {isEmpty ? (
            /* Empty state */
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-foreground mb-1">Customer reviews</h2>
                <p className="text-sm text-muted">No reviews yet — be the first to share your experience.</p>
              </div>
              <button
                onClick={() => setShowForm((v) => !v)}
                className="shrink-0 bg-foreground text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary transition-colors"
              >
                Write a review
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center gap-8">

              {/* Left: big number + stars */}
              <div className="shrink-0">
                <h2 className="text-sm font-semibold text-foreground mb-3">Rating snapshot</h2>
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-5xl font-bold text-foreground leading-none tracking-tight">
                    {data.averageRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-muted self-end pb-1">out of 5</span>
                </div>
                <StarRating rating={data.averageRating} size="md" />
                <p className="text-xs text-muted mt-1.5">{data.totalReviews} global {data.totalReviews === 1 ? 'rating' : 'ratings'}</p>
              </div>

              {/* Middle: distribution bars */}
              <div className="flex flex-col gap-1.5 w-full sm:w-64 md:w-72">
                {data.ratingCounts.map(({ rating, count }) => {
                  const pct = data.totalReviews > 0 ? Math.round((count / data.totalReviews) * 100) : 0;
                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-xs text-muted w-10 shrink-0 text-right">{rating} star</span>
                      <div className="relative flex-1 h-1.5 bg-surface-contrast rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-gold rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted w-8 shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Right: CTA */}
              <button
                onClick={() => setShowForm((v) => !v)}
                className="shrink-0 sm:ml-auto bg-foreground text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-primary transition-colors"
              >
                Write a review
              </button>
            </div>
          )}
        </div>

        {/* ── Write review form (inline) ───────────────────────────────────── */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-border shadow-[0_4px_14px_rgba(31,41,51,0.04)] overflow-hidden">
            <WriteReviewForm
              productHandle={productHandle}
              onClose={() => setShowForm(false)}
              onSuccess={loadReviews}
            />
          </div>
        )}

        {/* ── Customer photos strip ────────────────────────────────────────── */}
        {allPhotos.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-5 md:p-6 shadow-[0_4px_14px_rgba(31,41,51,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Customer reviews</h3>
              <p className="text-xs text-muted">Read feedback from customers and share your own experience.</p>
            </div>

            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {allPhotos.slice(0, PHOTOS_PREVIEW_COUNT).map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setPhotoModal({ photos: allPhotos, index: idx })}
                  className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-border hover:border-primary transition-colors"
                >
                  <Image src={url} alt={`Customer photo ${idx + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}

              {allPhotos.length > PHOTOS_PREVIEW_COUNT && (
                <button
                  onClick={() => setPhotoModal({ photos: allPhotos, index: PHOTOS_PREVIEW_COUNT })}
                  className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-border bg-surface-soft flex flex-col items-center justify-center hover:border-primary transition-colors"
                >
                  <span className="text-xs font-bold text-foreground">+{allPhotos.length - PHOTOS_PREVIEW_COUNT}</span>
                  <span className="text-[10px] text-muted">more</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Review list ──────────────────────────────────────────────────── */}
        {!isEmpty && (
          <div className="bg-white rounded-2xl border border-border shadow-[0_4px_14px_rgba(31,41,51,0.04)] divide-y divide-border">
            {data!.reviews.map((review) => {
              const reviewPhotos = review.pictures?.map((p) => p.urls.original) ?? [];
              return (
                <div key={review.id} className="p-5 md:p-6 flex flex-col gap-3">
                  {/* Author row */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-surface-soft border border-border flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {initials(review.reviewer.name)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.reviewer.name}</p>
                      {review.verified && (
                        <span className="text-[10px] text-green-600 font-medium">Verified purchase</span>
                      )}
                    </div>
                  </div>

                  {/* Stars + date + title */}
                  <div className="flex flex-wrap items-center gap-2">
                    <StarRating rating={review.rating} size="sm" />
                    {review.title && (
                      <span className="text-sm font-semibold text-foreground">{review.title}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted">{formatDate(review.created_at)}</p>

                  {/* Body */}
                  <p className="text-sm text-foreground leading-relaxed">{review.body}</p>

                  {/* Review photos */}
                  {reviewPhotos.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-1">
                      {reviewPhotos.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPhotoModal({ photos: allPhotos, index: allPhotos.indexOf(url) })}
                          className="relative w-20 h-20 rounded-xl overflow-hidden border border-border hover:border-primary transition-colors"
                        >
                          <Image src={url} alt="Review photo" fill className="object-cover" sizes="80px" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default ProductReviews;
