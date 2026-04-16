'use client';

import { ReactNode } from 'react';
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
  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Modal Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" style={{ zIndex: 10000 }} onClick={onClose} aria-hidden="true" />
      {/* Modal Content */}
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 10001 }}>
        {children}
      </div>
    </>,
    document.body
  );
};

export default PortalImageModal;
