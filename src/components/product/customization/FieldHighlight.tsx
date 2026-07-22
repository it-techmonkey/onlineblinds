'use client';

import { ReactNode } from 'react';

interface FieldHighlightProps {
  /** Field key(s) this section covers. The first key is used as the scroll-target ref. */
  fieldKey: string | string[];
  invalid: boolean;
  registerRef: (key: string, el: HTMLDivElement | null) => void;
  children: ReactNode;
  className?: string;
  message?: string;
}

const FieldHighlight = ({
  fieldKey,
  invalid,
  registerRef,
  children,
  className = '',
  message = 'Please select an option',
}: FieldHighlightProps) => {
  const keys = Array.isArray(fieldKey) ? fieldKey : [fieldKey];

  return (
    <div
      ref={(el) => {
        keys.forEach((key) => registerRef(key, el));
      }}
      className={`${className} ${invalid ? 'rounded-md border border-[#c24646] p-4' : ''}`}
    >
      {children}
      {invalid && (
        <p className="mt-3 pt-3 border-t border-[#c24646]/30 flex items-center gap-1.5 text-xs font-semibold text-[#c24646]">
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.28 11.18c.75 1.334-.213 2.987-1.744 2.987H3.72c-1.53 0-2.493-1.653-1.743-2.987l6.28-11.18zM10 7a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 7zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          {message}
        </p>
      )}
    </div>
  );
};

export default FieldHighlight;
