'use client';

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface PortalImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Portal-based image preview modal that renders outside the DOM tree
 * to escape overflow constraints from parent containers.
 */
export const PortalImageModal = ({
  isOpen,
  onClose,
  children,
}: PortalImageModalProps): ReactNode => {
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') {
      return;
    }

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100100]">
      <div
        className="absolute inset-0 bg-black/72 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex min-h-full items-center justify-center p-4 md:p-6">
        <div
          role="dialog"
          aria-modal="true"
          className="max-h-full w-full"
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PortalImageModal;
