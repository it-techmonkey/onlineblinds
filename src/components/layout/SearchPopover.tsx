'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPriceWithCurrency } from '@/lib/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

interface LiveSearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  image: string | null;
}

interface SearchPopoverProps {
  onClose: () => void;
}

const SearchPopover = ({ onClose }: SearchPopoverProps) => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LiveSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setLoading(false);
      setRateLimited(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setRateLimited(false);

    fetch(`/api/search/live?q=${encodeURIComponent(debouncedQuery)}`)
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 429) {
          setRateLimited(true);
          setResults([]);
          return;
        }
        const json = await response.json();
        setResults(json.success ? json.data : []);
      })
      .catch((error) => {
        console.error('Live search failed:', error);
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const goToFullResults = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goToFullResults();
  };

  return (
    <div className="flex w-full flex-col">
      <div className="p-3">
        <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for blinds, colors, styles..."
              className="w-full rounded-full border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-[rgba(68,87,102,0.12)]"
            />
          </div>
          <button
            type="submit"
            aria-label="Search"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-dark"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>
      </div>

      <div className="max-h-96 overflow-y-auto px-2 pb-2">
        {!debouncedQuery ? (
          <p className="px-2 py-6 text-center text-sm text-muted">Start typing to search products.</p>
        ) : rateLimited ? (
          <p className="px-2 py-6 text-center text-sm text-muted">Too many searches — please slow down and try again in a moment.</p>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : results.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted">No products found for &quot;{debouncedQuery}&quot;.</p>
        ) : (
          <ul className="space-y-1">
            {results.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/product/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-muted"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-white">
                    {product.image && (
                      <Image src={product.image} alt={product.name} fill className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted">{formatPriceWithCurrency(product.price, product.currency)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {debouncedQuery && (
        <button
          type="button"
          onClick={goToFullResults}
          className="m-3 mt-0 rounded-md border border-border py-2.5 text-center text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
        >
          View all results for &quot;{debouncedQuery}&quot;
        </button>
      )}
    </div>
  );
};

export default SearchPopover;
